package routes

import (
	"dugong/internal/api/handlers"
	"dugong/internal/auth"
	"dugong/internal/config"
	"dugong/internal/database"
	"dugong/internal/docker"
	"dugong/internal/logger"
	"dugong/internal/scheduler"
	"dugong/internal/system"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

func SetupRoutes(
	cfg *config.Config,
	db *database.DB,
	dockerClient *docker.Client,
	logManager *logger.Manager,
	monitor *system.Monitor,
	proxyManager *system.ProxyManager,
	scheduler *scheduler.Scheduler,
) *chi.Mux {
	r := chi.NewRouter()

	// Initialize handlers
	containerHandler := handlers.NewContainerHandler(dockerClient, logManager)
	healthCheckHandler := handlers.NewHealthCheckHandler(scheduler, db.Queries)
	systemHandler := handlers.NewSystemHandler(monitor)
	logsHandler := handlers.NewLogsHandler(logManager)
	proxyHandler := handlers.NewProxyHandler(proxyManager)

	// Middleware
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: false,
		MaxAge:           300,
	}))

	// Auth routes
	r.Route("/auth", func(r chi.Router) {
		r.Post("/login", auth.LoginHandler(cfg, db))
		r.Get("/logout", auth.LogoutHandler())

		// Protected auth routes
		r.Group(func(r chi.Router) {
			r.Use(auth.JWTMiddleware(cfg))
			r.Post("/change-password", auth.ChangePasswordHandler(db))
		})
	})

	// API routes
	r.Route("/api", func(r chi.Router) {
		r.Use(auth.JWTMiddleware(cfg))
		r.Get("/auth-status", auth.GetAuthStatus(monitor))

		// Mount all route groups
		SetupContainerRoutes(r, containerHandler)
		r.Get("/logs", logsHandler.SearchLogs)
		SetupHealthCheckRoutes(r, healthCheckHandler)
		SetupSystemRoutes(r, systemHandler)
		SetupProxyRoutes(r, proxyHandler)
	})

	r.NotFound(handlers.NotFoundHandler)

	return r
}
