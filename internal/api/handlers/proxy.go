package handlers

import (
	"dugong/internal/system"
	"encoding/json"
	"github.com/go-chi/chi/v5"
	"net/http"
)

type ProxyHandler struct {
	manager *system.ProxyManager
}

type ProxySiteRequest struct {
	Port   string `json:"port"`
	Domain string `json:"domain"`
}

func NewProxyHandler(manager *system.ProxyManager) *ProxyHandler {
	return &ProxyHandler{
		manager: manager,
	}
}

func (p *ProxyHandler) AddSite(w http.ResponseWriter, r *http.Request) {
	var req ProxySiteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	response, err := p.manager.AddSite(r.Context(), req.Domain, req.Port)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(response)
}

func (p *ProxyHandler) ListSites(w http.ResponseWriter, r *http.Request) {
	sites, err := p.manager.ListSites(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(sites)
}

func (p *ProxyHandler) DeleteSite(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	err := p.manager.DeleteSite(r.Context(), id)

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode("success")
}
