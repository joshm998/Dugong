package routes

import (
	"dugong/internal/api/handlers"
	"github.com/go-chi/chi/v5"
)

func SetupProxyRoutes(r chi.Router, h *handlers.ProxyHandler) {
	r.Post("/proxy", h.AddSite)
	r.Get("/proxy", h.ListSites)
	r.Delete("/proxy/{id}", h.DeleteSite)
}
