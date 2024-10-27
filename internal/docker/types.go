package docker

import (
	"github.com/docker/docker/api/types"
)

type Container struct {
	ID        string            `json:"id"`
	Names     []string          `json:"names"`
	Image     string            `json:"image"`
	ImageID   string            `json:"imageId"`
	Command   string            `json:"command"`
	CreatedAt int64             `json:"createdAt"`
	Ports     map[string]string `json:"ports"`
	Labels    map[string]string `json:"labels"`
	State     string            `json:"state"`
	Status    string            `json:"status"`
}

func convertContainers(originalContainers []types.Container) []Container {
	simplifiedContainers := make([]Container, len(originalContainers))

	for i, originalContainer := range originalContainers {
		simplifiedContainer := convertToContainer(originalContainer)
		simplifiedContainers[i] = simplifiedContainer
	}

	return simplifiedContainers
}

func convertToContainer(originalContainer types.Container) Container {
	simplifiedContainer := Container{
		ID:        originalContainer.ID,
		Names:     originalContainer.Names,
		Image:     originalContainer.Image,
		ImageID:   originalContainer.ImageID,
		Command:   originalContainer.Command,
		CreatedAt: originalContainer.Created,
		Labels:    originalContainer.Labels,
		State:     originalContainer.State,
		Status:    originalContainer.Status,
	}

	return simplifiedContainer
}

type ContainerDetails struct {
	ID           string                   `json:"id"`
	Created      string                   `json:"created"`
	Path         string                   `json:"path"`
	Args         []string                 `json:"args"`
	State        State                    `json:"state"`
	Image        string                   `json:"image"`
	HostnamePath string                   `json:"hostnamePath"`
	HostsPath    string                   `json:"hostsPath"`
	LogPath      string                   `json:"logPath"`
	Name         string                   `json:"name"`
	RestartCount int                      `json:"restartCount"`
	Mounts       []Mount                  `json:"mounts"`
	PortBindings map[string][]PortBinding `json:"ports"`
}

type State struct {
	Status     string `json:"status"`
	Running    bool   `json:"running"`
	Paused     bool   `json:"paused"`
	Restarting bool   `json:"restarting"`
	OOMKilled  bool   `json:"oomKilled"`
	Dead       bool   `json:"dead"`
	Pid        int    `json:"pid"`
	ExitCode   int    `json:"exitCode"`
	Error      string `json:"error"`
	StartedAt  string `json:"startedAt"`
	FinishedAt string `json:"finishedAt"`
}

type Mount struct {
	Type        string `json:"type"`
	Source      string `json:"source"`
	Destination string `json:"destination"`
	Mode        string `json:"mode"`
	RW          bool   `json:"rw"`
	Propagation string `json:"propagation"`
}

type PortBinding struct {
	HostIP   string `json:"hostIp"`
	HostPort string `json:"hostPort"`
}

func ConvertToContainerDetails(originalContainerDetails types.ContainerJSON) ContainerDetails {
	camelCaseDetail := ContainerDetails{
		ID:           originalContainerDetails.ID,
		Created:      originalContainerDetails.Created,
		Path:         originalContainerDetails.Path,
		Args:         originalContainerDetails.Args,
		Image:        originalContainerDetails.Image,
		HostnamePath: originalContainerDetails.HostnamePath,
		HostsPath:    originalContainerDetails.HostsPath,
		LogPath:      originalContainerDetails.LogPath,
		Name:         originalContainerDetails.Name,
		RestartCount: originalContainerDetails.RestartCount,
		State: State{
			Status:     originalContainerDetails.State.Status,
			Running:    originalContainerDetails.State.Running,
			Paused:     originalContainerDetails.State.Paused,
			Restarting: originalContainerDetails.State.Restarting,
			OOMKilled:  originalContainerDetails.State.OOMKilled,
			Dead:       originalContainerDetails.State.Dead,
			Pid:        originalContainerDetails.State.Pid,
			ExitCode:   originalContainerDetails.State.ExitCode,
			Error:      originalContainerDetails.State.Error,
			StartedAt:  originalContainerDetails.State.StartedAt,
			FinishedAt: originalContainerDetails.State.FinishedAt,
		},
	}

	// Convert Mounts
	camelCaseDetail.Mounts = make([]Mount, len(originalContainerDetails.Mounts))
	for i, mount := range originalContainerDetails.Mounts {
		camelCaseDetail.Mounts[i] = Mount{
			//Type:        mount.Type,
			Source:      mount.Source,
			Destination: mount.Destination,
			Mode:        mount.Mode,
			RW:          mount.RW,
			//Propagation: mount.Propagation,
		}
	}

	// Convert PortBindings
	camelCaseDetail.PortBindings = make(map[string][]PortBinding)
	for port, bindings := range originalContainerDetails.HostConfig.PortBindings {
		camelCaseBindings := make([]PortBinding, len(bindings))
		for i, binding := range bindings {
			camelCaseBindings[i] = PortBinding{
				HostIP:   binding.HostIP,
				HostPort: binding.HostPort,
			}
		}
		camelCaseDetail.PortBindings[string(port)] = camelCaseBindings
	}

	return camelCaseDetail
}
