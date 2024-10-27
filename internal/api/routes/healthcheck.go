package routes

import (
	"dugong/internal/api/handlers"
	"github.com/go-chi/chi/v5"
)

func SetupHealthCheckRoutes(r chi.Router, h *handlers.HealthCheckHandler) {
	r.Post("/health-checks", h.AddHealthCheck)
	r.Get("/health-checks", h.GetHealthChecks)
	r.Delete("/health-check/{id}", h.DeleteHealthCheck)
	r.Get("/health-check/results", h.GetHealthCheckResults)
}
