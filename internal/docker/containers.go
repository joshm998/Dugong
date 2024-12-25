package docker

import (
	"bufio"
	"context"
	"github.com/docker/docker/api/types/container"
	"log"
	"strings"
)

// ListContainers lists all containers
func (c *Client) ListContainers() ([]Container, error) {
	listOptions := container.ListOptions{All: true}
	containers, err := c.cli.ContainerList(context.Background(), listOptions)
	if err != nil {
		return nil, err
	}
	return convertContainers(containers), nil
}

// GetContainerDetails inspects a container by ID
func (c *Client) GetContainerDetails(id string) (ContainerDetails, error) {
	containerDetails, err := c.cli.ContainerInspect(context.Background(), id)
	if err != nil {
		return ContainerDetails{}, err
	}
	return ConvertToContainerDetails(containerDetails), nil
}

// StartContainer starts a container by ID
func (c *Client) StartContainer(id string) error {
	startOptions := container.StartOptions{}
	return c.cli.ContainerStart(context.Background(), id, startOptions)
}

// StopContainer stops a container by ID
func (c *Client) StopContainer(id string) error {
	return c.cli.ContainerStop(context.Background(), id, container.StopOptions{})
}

func (c *Client) GetLogs(ctx context.Context, id string, since string) error {
	options := container.LogsOptions{
		ShowStdout: true,
		ShowStderr: true,
		Follow:     false,
		Timestamps: true,
	}

	if since != "0" {
		options.Since = since
	}

	logs, err := c.cli.ContainerLogs(ctx, id, options)
	if err != nil {
		return err
	}
	defer logs.Close()

	scanner := bufio.NewScanner(logs)
	for scanner.Scan() {
		logLine := scanner.Text()
		// Split the log line into timestamp and message
		// TODO: Rework logging detection to be more robust and support more formats
		if len(logLine) > 8 {
			parts := strings.SplitN(logLine[8:], " ", 2)
			if len(parts) == 2 {
				timestamp, message := parts[0], parts[1]
				if err := c.logManager.SaveLog(ctx, id, timestamp, message); err != nil {
					if !strings.Contains(err.Error(), "UNIQUE constraint failed") {
						log.Printf("Error saving log for container %s: %v", id, err)
					}
				}
			}
		}
	}

	return scanner.Err()
}
