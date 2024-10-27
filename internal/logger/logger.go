package logger

import (
	"context"
	"crypto/sha256"
	"database/sql"
	"dugong/internal/database"
	"encoding/hex"
	"encoding/json"
	"regexp"
	"strings"
	"time"
)

type LogEntry struct {
	ContainerID string
	Timestamp   time.Time
	Message     string
	UniqueID    string
	LogLevel    string
}

type SimplifiedLogEntry struct {
	ContainerID string    `json:"containerId"`
	Timestamp   time.Time `json:"timestamp"`
	Message     string    `json:"message"`
	UniqueID    string    `json:"uniqueId"`
	LogLevel    string    `json:"logLevel"`
}

type Manager struct {
	queries *database.Queries
}

func NewManager(db *database.DB) (*Manager, error) {
	return &Manager{queries: db.Queries}, nil
}

func (m *Manager) SaveLog(ctx context.Context, containerID, timestamp, message string) error {
	uniqueID := generateUniqueID(containerID, timestamp, message)
	logLevel := extractLogLevel(message)
	return m.queries.SaveLog(ctx, database.SaveLogParams{
		ContainerID: containerID,
		Timestamp:   parseDockerTimestamp(timestamp),
		Message:     message,
		UniqueID:    uniqueID,
		LogLevel:    logLevel,
	})
}

func (m *Manager) DeleteOldLogs(ctx context.Context, cutoffTime time.Time) error {
	return m.queries.DeleteOldLogs(ctx, cutoffTime)
}

func (m *Manager) GetContainerLogs(ctx context.Context, containerID string) ([]LogEntry, error) {
	logs, err := m.queries.GetContainerLogs(ctx, containerID)
	if err != nil {
		return nil, err
	}
	result := make([]LogEntry, len(logs))
	for i, log := range logs {
		result[i] = LogEntry{
			ContainerID: log.ContainerID,
			Timestamp:   log.Timestamp,
			Message:     log.Message,
			UniqueID:    log.UniqueID,
			LogLevel:    log.LogLevel,
		}
	}
	return result, nil
}

func (m *Manager) SearchLogs(ctx context.Context, query string) ([]LogEntry, error) {
	logs, err := m.queries.SearchLogs(ctx, "%"+query+"%")
	if err != nil {
		return nil, err
	}
	result := make([]LogEntry, len(logs))
	for i, log := range logs {
		result[i] = LogEntry{
			ContainerID: log.ContainerID,
			Timestamp:   log.Timestamp,
			Message:     log.Message,
			UniqueID:    log.UniqueID,
			LogLevel:    log.LogLevel,
		}
	}
	return result, nil
}

type LogQueryParams struct {
	ContainerIDs  []string
	MessageFilter string
	LogLevels     []string
	StartTime     time.Time
	EndTime       time.Time
	Page          int
	PageSize      int
}

func (m *Manager) GetFilteredLogs(ctx context.Context, params LogQueryParams) ([]SimplifiedLogEntry, int, error) {
	containerIDs := strings.Join(params.ContainerIDs, ",")
	logLevels := strings.Join(params.LogLevels, ",")
	offset := (params.Page - 1) * params.PageSize

	logs, err := m.queries.GetFilteredLogs(ctx, database.GetFilteredLogsParams{
		ContainerIds:  containerIDs,
		MessageFilter: params.MessageFilter,
		LogLevels:     logLevels,
		StartTime:     sql.NullTime{Time: params.StartTime, Valid: !params.StartTime.IsZero()},
		EndTime:       sql.NullTime{Time: params.EndTime, Valid: !params.EndTime.IsZero()},
		PageSize:      int64(params.PageSize),
		Offset:        int64(offset),
	})
	if err != nil {
		return nil, 0, err
	}

	var totalCount int
	logEntries := make([]SimplifiedLogEntry, 0, len(logs))
	for _, log := range logs {
		logEntries = append(logEntries, SimplifiedLogEntry{
			ContainerID: log.ContainerID,
			Timestamp:   log.Timestamp,
			Message:     log.Message,
			UniqueID:    log.UniqueID,
			LogLevel:    log.LogLevel,
		})
		totalCount = int(log.TotalCount) // All rows will have the same total count
	}

	return logEntries, totalCount, nil
}

func generateUniqueID(containerID, timestamp, message string) string {
	data := containerID + timestamp + message[:minInt(len(message), 50)] // Use first 50 chars of message or less
	hash := sha256.Sum256([]byte(data))
	return hex.EncodeToString(hash[:])
}

func parseDockerTimestamp(timestamp string) time.Time {
	t, err := time.Parse(time.RFC3339Nano, timestamp)
	if err != nil {
		return time.Now() // Fallback to current time if parsing fails
	}
	return t
}

func minInt(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func extractLogLevel(message string) string {
	// Check if the message is in JSON format
	var jsonLog map[string]interface{}
	if err := json.Unmarshal([]byte(message), &jsonLog); err == nil {
		// Check common fields for log level in JSON logs
		for _, field := range []string{"level", "severity", "log_level"} {
			if level, ok := jsonLog[field].(string); ok {
				return normalizeLogLevel(level)
			}
		}
	}

	// If not JSON, use regex to extract log level
	re := regexp.MustCompile(`\[(ERROR|WARN|INFO|DEBUG)]`)
	match := re.FindString(message)
	if match != "" {
		return normalizeLogLevel(strings.Trim(match, "[]"))
	}

	// If no log level found, return "UNKNOWN"
	return "UNKNOWN"
}

func normalizeLogLevel(level string) string {
	level = strings.ToUpper(level)
	switch level {
	case "ERROR", "FATAL", "CRITICAL":
		return "ERROR"
	case "WARN", "WARNING":
		return "WARN"
	case "INFO", "INFORMATION":
		return "INFO"
	case "DEBUG", "TRACE":
		return "DEBUG"
	default:
		return "UNKNOWN"
	}
}
