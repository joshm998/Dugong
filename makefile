# Variables
GO_FILES=cmd/server/main.go
BUILD_DIR=build
VITE_DIR=web

# Vite command to build the web assets
vite-build:
	@echo "Running Vite build in $(VITE_DIR)..."
	cd $(VITE_DIR) && npm run build

# macOS (darwin, arm64)
build-osx:
	@echo "Building for macOS (arm64)..."
	env GOOS=darwin GOARCH=arm64 CGO_ENABLED=1 go build -o $(BUILD_DIR)/darwin_arm64 -v $(GO_FILES)

# Linux (arm64)
build-linux-arm:
	@echo "Building for Linux (arm64)..."
	env GOOS=linux GOARCH=arm64 CGO_ENABLED=1 go build -o $(BUILD_DIR)/linux_arm64 -v $(GO_FILES)

# Linux (amd64)
build-linux-x64:
	@echo "Building for Linux (amd64)..."
	env GOOS=linux GOARCH=amd64 CGO_ENABLED=1 go build -o $(BUILD_DIR)/linux_amd64 -v $(GO_FILES)

# Build all targets after running Vite
build-all: vite-build build-osx build-linux-arm build-linux-x64
	@echo "All builds completed successfully."

.PHONY: vite-build build-osx build-linux-arm build-linux-x64 build-all
