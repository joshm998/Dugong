package routes

import (
	"dugong/internal/api/handlers"
	"github.com/go-chi/chi/v5"
)

func SetupSystemRoutes(r chi.Router, h *handlers.SystemHandler) {
	r.Get("/usage", h.GetUsage)
}
