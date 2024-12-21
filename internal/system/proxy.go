package system

import (
	"context"
	"crypto/tls"
	"dugong/internal/config"
	"dugong/internal/database"
	"fmt"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"path"
	"strconv"
	"sync"

	"github.com/caddyserver/certmagic"
)

type ProxySiteModel struct {
	Id            int64  `json:"id"`
	Port          string `json:"port"`
	ContainerName string `json:"containerName"`
	Domain        string `json:"domain"`
}

type ProxyManager struct {
	server        *http.Server
	config        map[string]string
	certDirectory string
	configMu      sync.RWMutex
	db            *database.Queries
}

func NewProxyManager(db *database.Queries, config *config.Config) (*ProxyManager, error) {
	// Define the mapping of domains to backend server URLs
	ctx := context.Background()
	sites, err := db.GetProxySites(ctx)
	if err != nil {
		log.Fatalf("Error Reading Proxy Sites")
	}

	pm := &ProxyManager{
		config:        make(map[string]string),
		db:            db,
		certDirectory: config.CertDirectory,
	}

	for _, site := range sites {
		pm.config[site.Domain] = fmt.Sprintf("http://localhost:%s", site.Port)
	}

	// Create the reverse proxy
	proxy := &httputil.ReverseProxy{
		Director: func(req *http.Request) {
			pm.configMu.RLock()
			defer pm.configMu.RUnlock()

			// Get the target URL based on the requested host
			target, ok := pm.config[req.Host]
			if !ok {
				return
			}

			// Parse the target URL
			targetURL, err := url.Parse(target)
			if err != nil {
				return
			}

			targetURL.Path = req.URL.Path
			targetURL.RawQuery = req.URL.RawQuery

			req.Header.Del("X-Forwarded-For")
			req.Header.Del("X-Forwarded-Host")
			req.Header.Del("X-Forwarded-Proto")

			// Set the request URL to the target URL
			req.URL = targetURL
			req.Host = targetURL.Host
		},
		Transport: &http.Transport{
			TLSClientConfig: &tls.Config{
				MinVersion: tls.VersionTLS13,
			},
		},
	}

	// Check if the server is running on a VPS
	isVPS := config.GenerateCertificates == "true"

	var hosts []string
	for _, site := range sites {
		hosts = append(hosts, site.Domain)
	}

	// Create the TLS configuration
	var tlsConfig *tls.Config
	if isVPS {
		// Configure CertMagic
		certmagic.DefaultACME.Email = config.CertEmail
		certmagic.DefaultACME.Agreed = true
		certmagic.HTTPSPort = 4432
		certmagic.DefaultACME.DisableHTTPChallenge = true

		magic := certmagic.NewDefault()

		err := magic.ManageSync(ctx, hosts)
		if err != nil {
			return nil, fmt.Errorf("failed to manage certificates: %v", err)
		}

		// Get TLS configuration
		tlsConfig = magic.TLSConfig()
	} else {
		// Use self-generated certificates for local development
		tlsConfig = &tls.Config{
			MinVersion:       tls.VersionTLS13,
			CurvePreferences: []tls.CurveID{tls.X25519, tls.CurveP256},
			CipherSuites: []uint16{
				tls.TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384,
				tls.TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256,
				tls.TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA,
			},
		}
	}

	// HTTPS server with proxy
	httpsServer := &http.Server{
		Addr:      ":4432",
		Handler:   proxy,
		ErrorLog:  log.New(os.Stderr, "", log.LstdFlags),
		TLSConfig: tlsConfig,
	}

	pm.server = httpsServer

	return pm, nil
}

func (p *ProxyManager) Start() error {
	fmt.Println("Starting server on port 80 and 443...")

	// Start HTTPS server
	return p.server.ListenAndServeTLS(path.Join(p.certDirectory, "server.crt"), path.Join(p.certDirectory, "server.key"))
}

func (p *ProxyManager) DeleteSite(ctx context.Context, siteId string) error {
	id, err := strconv.ParseInt(siteId, 10, 64)
	if err != nil {
		return err
	}

	err = p.db.DeleteProxySite(ctx, id)
	if err != nil {
		return err
	}

	err = p.ReloadConfiguration(ctx)
	if err != nil {
		return err
	}

	return nil
}

func (p *ProxyManager) AddSite(ctx context.Context, domain string, port string) (ProxySiteModel, error) {
	site, err := p.db.AddProxySite(ctx, database.AddProxySiteParams{Port: port, Domain: domain})
	if err != nil {
		return ProxySiteModel{}, err
	}

	res := ProxySiteModel{
		Id:            site.ID,
		Domain:        site.Domain,
		Port:          site.Port,
		ContainerName: site.ContainerName,
	}

	err = p.ReloadConfiguration(ctx)
	if err != nil {
		return ProxySiteModel{}, err
	}

	return res, nil
}

func (p *ProxyManager) ListSites(ctx context.Context) ([]ProxySiteModel, error) {
	proxySites, err := p.db.GetProxySites(ctx)
	if err != nil {
		return nil, err
	}

	var formattedResults []ProxySiteModel

	for _, result := range proxySites {
		res := ProxySiteModel{
			Id:            result.ID,
			Domain:        result.Domain,
			Port:          result.Port,
			ContainerName: result.ContainerName,
		}
		formattedResults = append(formattedResults, res)
	}

	return formattedResults, nil
}

func (p *ProxyManager) ReloadConfiguration(ctx context.Context) error {
	sites, err := p.db.GetProxySites(ctx)
	if err != nil {
		return err
	}

	p.configMu.Lock()
	defer p.configMu.Unlock()

	// Clear existing config
	p.config = make(map[string]string)

	// Repopulate config
	for _, site := range sites {
		p.config[site.Domain] = fmt.Sprintf("http://localhost:%s", site.Port)
	}

	return nil
}
