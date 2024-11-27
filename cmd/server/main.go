package main

import (
	"dugong/internal/api/routes"
	"dugong/internal/database"
	"dugong/internal/scheduler"
	"dugong/internal/system"
	"fmt"
	"log"
	"net/http"
	"path"
	"time"

	"dugong/internal/config"
	"dugong/internal/docker"
	"dugong/internal/logger"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	database, err := database.NewDB(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer database.Close()

	logManager, err := logger.NewManager(database)
	if err != nil {
		log.Fatalf("Failed to create log manager: %v", err)
	}

	dockerClient, err := docker.NewClient(logManager)
	if err != nil {
		log.Fatalf("Failed to create Docker client: %v", err)
	}

	monitor := system.NewMonitor()

	proxyManager, err := system.NewProxyManager(database.Queries, cfg)
	if err != nil {
		log.Fatalf("Failed to create proxy manager: %v", err)
	}
	go func() {
		if err := proxyManager.Start(); err != nil {
			log.Printf("Proxy manager failed: %v", err)
		}
	}()
	// Create and start the scheduler
	schedulerInstance := scheduler.NewScheduler(dockerClient, logManager, 7*24*time.Hour, database)
	schedulerInstance.Start()
	defer schedulerInstance.Stop()

	router := routes.SetupRoutes(cfg, database, dockerClient, logManager, monitor, proxyManager, schedulerInstance)

	log.Printf("Server starting on %s", cfg.ServerAddr)
	log.Fatal(http.ListenAndServeTLS(fmt.Sprintf(":%v", cfg.ServerAddr), path.Join(cfg.CertDirectory, "server.crt"), path.Join(cfg.CertDirectory, "server.key"), router))
}
