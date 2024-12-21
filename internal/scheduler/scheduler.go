package scheduler

import (
	"context"
	"database/sql"
	"dugong/internal/database"
	"dugong/internal/docker"
	"dugong/internal/logger"
	"log"
	"net/http"
	"time"

	"github.com/go-co-op/gocron"
)

type Scheduler struct {
	client      *docker.Client
	scheduler   *gocron.Scheduler
	logManager  *logger.Manager
	dbRetention time.Duration
	db          *database.DB
	ctx         context.Context
	cancel      context.CancelFunc
}

type HealthCheck struct {
	ID            int64
	Name          string
	Interval      time.Duration
	URL           string
	LastCheckedAt sql.NullTime
}

func NewScheduler(client *docker.Client, logManager *logger.Manager, dbRetention time.Duration, db *database.DB) *Scheduler {
	ctx, cancel := context.WithCancel(context.Background())
	return &Scheduler{
		client:      client,
		scheduler:   gocron.NewScheduler(time.UTC),
		logManager:  logManager,
		dbRetention: dbRetention,
		db:          db,
		ctx:         ctx,
		cancel:      cancel,
	}
}

func (s *Scheduler) Start() {
	s.saveContainerLogs()

	// Schedule container log streaming every 10 seconds
	s.scheduler.Every(10).Seconds().Do(s.streamContainerLogs)

	// Schedule DB cleanup every hour
	s.scheduler.Every(1).Hour().Do(s.cleanupOldLogs)
	s.scheduler.Every(1).Hour().Do(s.cleanupOldHealthChecks)

	// Load and schedule health checks from the database
	s.loadAndScheduleHealthChecks()

	s.scheduler.StartAsync()
}

func (s *Scheduler) Stop() {
	s.scheduler.Stop()
}

func (s *Scheduler) loadAndScheduleHealthChecks() {
	checks, err := s.getHealthChecksFromDB()
	if err != nil {
		log.Printf("Error loading health checks: %v", err)
		return
	}

	for _, check := range checks {
		s.scheduleHealthCheck(check)
	}
}

func (s *Scheduler) getHealthChecksFromDB() ([]HealthCheck, error) {
	rows, err := s.db.GetHealthChecks(s.ctx)
	if err != nil {
		return nil, err
	}

	// SQLite Date format
	layout := "2006-01-02 15:04:05.999999-07:00"

	var checks []HealthCheck
	for _, row := range rows {
		// Convert interface{} to sql.NullTime
		var lastCheckedAt sql.NullTime
		if row.LastCheckedAt != nil {
			t, err := time.Parse(layout, row.LastCheckedAt.(string))
			if err == nil {
				lastCheckedAt = sql.NullTime{
					Time:  t,
					Valid: true,
				}
			}
		}

		check := HealthCheck{
			ID:            row.ID,
			Name:          row.Name,
			Interval:      time.Duration(row.Interval),
			URL:           row.Url,
			LastCheckedAt: lastCheckedAt,
		}
		checks = append(checks, check)
	}

	return checks, nil
}

func (s *Scheduler) scheduleHealthCheck(check HealthCheck) {
	if check.LastCheckedAt.Valid {
		nextRun := check.LastCheckedAt.Time.Add(check.Interval)
		if nextRun.After(time.Now()) {
			// Schedule with initial delay to maintain the interval
			delay := time.Until(nextRun)
			s.scheduler.Every(check.Interval).StartAt(time.Now().Add(delay)).Do(func() {
				s.runHealthCheck(check)
			})
			log.Printf("Scheduled health check '%s' with initial delay of %v", check.Name, delay)
			return
		}
	}

	// If no last check or interval has passed, schedule normally
	s.scheduler.Every(check.Interval).Do(func() {
		s.runHealthCheck(check)
	})
}

func (s *Scheduler) runHealthCheck(check HealthCheck) {
	start := time.Now()
	resp, err := http.Get(check.URL)
	duration := time.Since(start)

	status := "success"
	message := ""

	if err != nil {
		status = "failure"
		message = err.Error()
	} else {
		defer resp.Body.Close()
		if resp.StatusCode != http.StatusOK {
			status = "failure"
			message = "Non-OK status code"
		}
	}

	messageString := sql.NullString{
		String: message,
		Valid:  true,
	}

	checkedAt := sql.NullTime{
		Time:  time.Now(),
		Valid: true,
	}

	_, err = s.db.AddHealthCheckResult(s.ctx, database.AddHealthCheckResultParams{
		HealthCheckID: check.ID,
		Status:        status,
		Message:       messageString,
		CheckedAt:     checkedAt,
	})
	if err != nil {
		log.Printf("Error saving health check result: %v", err)
	}

	log.Printf("Health check '%s' completed in %v with status: %s (message: %s)", check.Name, duration, status, message)
}

func (s *Scheduler) AddHealthCheck(name string, url string, interval time.Duration) error {
	result, err := s.db.AddHealthCheck(s.ctx, database.AddHealthCheckParams{
		Name:     name,
		Url:      url,
		Interval: interval.Nanoseconds(),
	})
	if err != nil {
		return err
	}

	check := HealthCheck{
		ID:       result.ID,
		Name:     name,
		URL:      url,
		Interval: interval,
	}

	s.scheduleHealthCheck(check)

	return nil
}

func (s *Scheduler) saveContainerLogs() {
	containers, err := s.client.ListContainers()
	if err != nil {
		log.Printf("Error listing containers: %v", err)
		return
	}

	for _, container := range containers {
		if container.State == "running" {
			err := s.client.GetLogs(s.ctx, container.ID, "0")
			if err != nil {
				log.Printf("Error streaming logs: %v", err)
			}
		}
	}
}

func (s *Scheduler) streamContainerLogs() {
	containers, err := s.client.ListContainers()
	if err != nil {
		log.Printf("Error listing containers: %v", err)
		return
	}

	for _, container := range containers {
		if container.State == "running" {
			err := s.client.GetLogs(s.ctx, container.ID, "5")
			if err != nil {
				log.Printf("Error streaming logs: %v", err)
			}
		}
	}
}

func (s *Scheduler) cleanupOldLogs() {
	ctx := context.Background()
	cutoffTime := time.Now().Add(-s.dbRetention)

	err := s.logManager.DeleteOldLogs(ctx, cutoffTime)
	if err != nil {
		log.Printf("Error cleaning up old logs: %v", err)
	} else {
		log.Printf("Successfully cleaned up logs older than %v", cutoffTime)
	}
}

func (s *Scheduler) cleanupOldHealthChecks() {
	ctx := context.Background()
	cutoffTime := time.Now().Add(-s.dbRetention)

	err := s.db.DeleteOldLogs(ctx, cutoffTime)
	if err != nil {
		log.Printf("Error cleaning up old health checks: %v", err)
	} else {
		log.Printf("Successfully cleaned up health checks older than %v", cutoffTime)
	}
}
