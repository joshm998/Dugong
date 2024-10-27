package handlers

import (
	"database/sql"
	"dugong/internal/database"
	"dugong/internal/scheduler"
	"encoding/json"
	"github.com/go-chi/chi/v5"
	"net/http"
	"strconv"
	"time"
)

type HealthCheckHandler struct {
	scheduler *scheduler.Scheduler
	queries   *database.Queries
}

type HealthCheckRequest struct {
	Name     string `json:"name"`
	URL      string `json:"url"`
	Interval int64  `json:"interval"` // in seconds
}

type HealthCheckResultResponse struct {
	HealthCheckId   int64 `json:"healthCheckId"`
	FailedCount     int64 `json:"failedCount"`
	IsLatestFailure bool  `json:"isLatestFailure"`
}

type HealthCheckResponse struct {
	Id   int64  `json:"id"`
	Name string `json:"name"`
	Url  string `json:"url"`
}

func NewHealthCheckHandler(scheduler *scheduler.Scheduler, queries *database.Queries) *HealthCheckHandler {
	return &HealthCheckHandler{
		scheduler: scheduler,
		queries:   queries,
	}
}

func (h *HealthCheckHandler) AddHealthCheck(w http.ResponseWriter, r *http.Request) {
	var req HealthCheckRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	err := h.scheduler.AddHealthCheck(req.Name, req.URL, time.Duration(req.Interval*int64(time.Second)))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"message": "Health check added successfully"})
}

func (h *HealthCheckHandler) GetHealthChecks(w http.ResponseWriter, r *http.Request) {
	healthChecks, err := h.queries.GetHealthChecks(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}

	formattedResults := []HealthCheckResponse{}

	for _, result := range healthChecks {
		res := HealthCheckResponse{
			Id:   result.ID,
			Name: result.Name,
			Url:  result.Url,
		}
		formattedResults = append(formattedResults, res)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(formattedResults)
}

func (h *HealthCheckHandler) DeleteHealthCheck(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	i, err := strconv.ParseInt(id, 10, 64)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
	}

	err = h.queries.DeleteHealthCheck(r.Context(), i)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(true)

}

func (h *HealthCheckHandler) GetHealthCheckResults(w http.ResponseWriter, r *http.Request) {
	last7Days := sql.NullTime{
		Time:  time.Now().AddDate(0, 0, -7),
		Valid: true,
	}

	results, err := h.queries.GetHealthCheckResults(r.Context(), last7Days) // Get count from the last seven days
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	formattedResults := []HealthCheckResultResponse{}

	for _, result := range results {
		res := HealthCheckResultResponse{
			HealthCheckId:   result.HealthCheckID,
			FailedCount:     result.FailedCount,
			IsLatestFailure: result.IsLatestFailure != 0,
		}
		formattedResults = append(formattedResults, res)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(formattedResults)
}
