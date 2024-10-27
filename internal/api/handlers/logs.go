package handlers

import (
	"dugong/internal/logger"
	"encoding/json"
	"math"
	"net/http"
	"strconv"
	"strings"
	"time"
)

type LogsHandler struct {
	logger *logger.Manager
}

func NewLogsHandler(logger *logger.Manager) *LogsHandler {
	return &LogsHandler{
		logger: logger,
	}
}

func (h *LogsHandler) SearchLogs(w http.ResponseWriter, r *http.Request) {
	params := logger.LogQueryParams{
		ContainerIDs:  strings.Split(r.URL.Query().Get("containerIds"), ","),
		MessageFilter: r.URL.Query().Get("message"),
		LogLevels:     strings.Split(r.URL.Query().Get("logLevels"), ","),
		Page:          1,
		PageSize:      100,
	}

	// Remove empty strings from slices
	params.ContainerIDs = removeEmptyStrings(params.ContainerIDs)
	params.LogLevels = removeEmptyStrings(params.LogLevels)

	if page, err := strconv.Atoi(r.URL.Query().Get("page")); err == nil && page > 0 {
		params.Page = page
	}
	if pageSize, err := strconv.Atoi(r.URL.Query().Get("pageSize")); err == nil && pageSize > 0 {
		params.PageSize = pageSize
	}
	if startTime, err := time.Parse(time.RFC3339, r.URL.Query().Get("startTime")); err == nil {
		params.StartTime = startTime
	}
	if endTime, err := time.Parse(time.RFC3339, r.URL.Query().Get("endTime")); err == nil {
		params.EndTime = endTime
	}

	logs, totalCount, err := h.logger.GetFilteredLogs(r.Context(), params)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	var totalPages = 1
	if totalCount > 0 && params.PageSize > 0 {
		totalPages = int(math.Ceil(float64(totalCount) / float64(params.PageSize)))
	}

	response := struct {
		Logs       []logger.SimplifiedLogEntry `json:"logs"`
		TotalCount int                         `json:"totalCount"`
		TotalPages int                         `json:"totalPages"`
		Page       int                         `json:"page"`
		PageSize   int                         `json:"pageSize"`
	}{
		Logs:       logs,
		TotalCount: totalCount,
		TotalPages: totalPages,
		Page:       params.Page,
		PageSize:   params.PageSize,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)

}

func removeEmptyStrings(s []string) []string {
	var r []string
	for _, str := range s {
		if str != "" {
			r = append(r, str)
		}
	}
	return r
}
