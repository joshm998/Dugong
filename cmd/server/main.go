package main

import (
	"dugong/internal/api/routes"
	"dugong/internal/database"
	"dugong/internal/scheduler"
	"dugong/internal/system"
	"fmt"
	"log"
	"net/http"
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

	// Create and start the scheduler
	schedulerInstance := scheduler.NewScheduler(dockerClient, logManager, 7*24*time.Hour, database)
	schedulerInstance.Start()
	defer schedulerInstance.Stop()

	router := routes.SetupRoutes(cfg, database, dockerClient, logManager, monitor, schedulerInstance)

	log.Printf("Server starting on %s", cfg.ServerAddr)
	log.Fatal(http.ListenAndServeTLS(fmt.Sprintf(":%v", cfg.ServerAddr), "server.crt", "server.key", router))
}
