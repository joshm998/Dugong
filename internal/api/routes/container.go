package routes

import (
	"dugong/internal/api/handlers"
	"github.com/go-chi/chi/v5"
)

func SetupContainerRoutes(r chi.Router, h *handlers.ContainerHandler) {
	r.Get("/containers", h.List)
	r.Get("/containers/{id}", h.GetDetails)
	r.Post("/containers/{id}/start", h.Start)
	r.Post("/containers/{id}/stop", h.Stop)
	r.Get("/containers/{id}/logs", h.GetLogs)
}
