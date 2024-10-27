package handlers

import (
	"dugong/internal/docker"
	"dugong/internal/logger"
	"encoding/json"
	"github.com/go-chi/chi/v5"
	"net/http"
	"strings"
)

type ContainerHandler struct {
	client     *docker.Client
	logManager *logger.Manager
}

func NewContainerHandler(client *docker.Client, logManager *logger.Manager) *ContainerHandler {
	return &ContainerHandler{
		client:     client,
		logManager: logManager,
	}
}

func (h *ContainerHandler) List(w http.ResponseWriter, r *http.Request) {
	containers, err := h.client.ListContainers()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(containers)
}

func (h *ContainerHandler) GetDetails(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	details, err := h.client.GetContainerDetails(id)
	if err != nil {
		if strings.Contains(err.Error(), "No such container") {
			http.Error(w, err.Error(), http.StatusNotFound)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(details)
}

func (h *ContainerHandler) Start(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	err := h.client.StartContainer(id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func (h *ContainerHandler) Stop(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	err := h.client.StopContainer(id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func (h *ContainerHandler) GetLogs(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	logs, err := h.logManager.GetContainerLogs(r.Context(), id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(logs)
}
