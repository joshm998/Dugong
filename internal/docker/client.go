package docker

import (
	"context"
	"dugong/internal/logger"
	"github.com/moby/moby/client"
	"sync"
)

type Client struct {
	cli           *client.Client
	streamingJobs map[string]context.CancelFunc
	mu            sync.Mutex
	logManager    *logger.Manager
}

func NewClient(logManager *logger.Manager) (*Client, error) {
	cli, err := client.NewClientWithOpts(client.FromEnv)
	if err != nil {
		return nil, err
	}
	return &Client{
		cli:           cli,
		streamingJobs: make(map[string]context.CancelFunc),
		logManager:    logManager,
	}, nil
}
