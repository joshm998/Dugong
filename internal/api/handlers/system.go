package handlers

import (
	"dugong/internal/system"
	"encoding/json"
	"net/http"
)

type SystemHandler struct {
	monitor *system.Monitor
}

func NewSystemHandler(monitor *system.Monitor) *SystemHandler {
	return &SystemHandler{
		monitor: monitor,
	}
}

func (h *SystemHandler) GetUsage(w http.ResponseWriter, r *http.Request) {
	usage, err := h.monitor.GetSystemUsage()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(usage)
}
