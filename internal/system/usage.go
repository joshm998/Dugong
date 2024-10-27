package system

import (
	"math"
	"runtime"
	"time"

	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/shirou/gopsutil/v3/disk"
	"github.com/shirou/gopsutil/v3/mem"
)

type Usage struct {
	UsagePercent float64 `json:"usagePercent"`
	Used         uint64  `json:"used"`
	Total        uint64  `json:"total"`
}

type DiskIO struct {
	ReadBytes    uint64  `json:"readBytes"`
	WriteBytes   uint64  `json:"writeBytes"`
	IOUsage      float64 `json:"ioUsage"`
	IOPercentage float64 `json:"ioPercentage"`
}

type SystemUsage struct {
	CPU    Usage  `json:"cpu"`
	Memory Usage  `json:"memory"`
	DiskIO DiskIO `json:"diskIO"`
}

type Monitor struct {
	lastDiskIO     disk.IOCountersStat
	lastCheck      time.Time
	ioHistory      []float64
	maxThroughput  float64
	averageSeconds int
}

func NewMonitor() *Monitor {
	return &Monitor{
		lastCheck:      time.Now(),
		ioHistory:      make([]float64, 0),
		maxThroughput:  0,
		averageSeconds: 5,
	}
}

func (m *Monitor) GetSystemUsage() (SystemUsage, error) {
	usage := SystemUsage{}

	// CPU usage
	cpuPercent, err := cpu.Percent(0, false)
	if err == nil && len(cpuPercent) > 0 {
		usage.CPU.UsagePercent = cpuPercent[0]
	}
	usage.CPU.Total = uint64(runtime.NumCPU() * 100)
	usage.CPU.Used = uint64(float64(usage.CPU.Total) * usage.CPU.UsagePercent / 100)

	// Memory usage
	memInfo, err := mem.VirtualMemory()
	if err == nil {
		usage.Memory.UsagePercent = memInfo.UsedPercent
		usage.Memory.Used = memInfo.Used
		usage.Memory.Total = memInfo.Total
	}

	// Disk I/O usage
	diskIO, err := disk.IOCounters()
	if err == nil {
		now := time.Now()
		duration := now.Sub(m.lastCheck).Seconds()

		if !m.lastCheck.IsZero() {
			for _, ioStat := range diskIO {
				readBytesPerSec := float64(ioStat.ReadBytes-m.lastDiskIO.ReadBytes) / duration
				writeBytesPerSec := float64(ioStat.WriteBytes-m.lastDiskIO.WriteBytes) / duration

				usage.DiskIO.ReadBytes = uint64(readBytesPerSec)
				usage.DiskIO.WriteBytes = uint64(writeBytesPerSec)
				usage.DiskIO.IOUsage = (readBytesPerSec + writeBytesPerSec) / 1024 / 1024 // Convert to MB/s

				// Update max throughput if necessary
				m.maxThroughput = math.Max(m.maxThroughput, usage.DiskIO.IOUsage)

				// Add current usage to history
				m.ioHistory = append(m.ioHistory, usage.DiskIO.IOUsage)

				// Keep only the last 'averageSeconds' entries
				if len(m.ioHistory) > m.averageSeconds {
					m.ioHistory = m.ioHistory[len(m.ioHistory)-m.averageSeconds:]
				}

				// Calculate average
				var sum float64
				for _, v := range m.ioHistory {
					sum += v
				}
				avgIOUsage := sum / float64(len(m.ioHistory))

				// Calculate percentage based on max throughput
				if m.maxThroughput > 0 {
					usage.DiskIO.IOPercentage = (avgIOUsage / m.maxThroughput) * 100
				} else {
					usage.DiskIO.IOPercentage = 0
				}
			}
		}

		// Store the last disk I/O stats
		for _, ioStat := range diskIO {
			m.lastDiskIO = ioStat
			break // We only need one disk for this example
		}
		m.lastCheck = now
	}

	return usage, nil
}
