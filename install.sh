#!/bin/bash

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
print_status() {
    echo -e "${GREEN}[+]${NC} $1"
}

print_error() {
    echo -e "${RED}[!]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[*]${NC} $1"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if port is in use
is_port_in_use() {
    local port=$1
    if lsof -i:$port > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to validate port number
validate_port() {
    local port=$1
    if [[ "$port" =~ ^[0-9]+$ ]] && [ "$port" -ge 1 ] && [ "$port" -le 65535 ]; then
        if is_port_in_use "$port"; then
            print_error "Port $port is already in use!"
            return 1
        fi
        return 0
    else
        print_error "Invalid port number: $port (must be between 1-65535)"
        return 1
    fi
}

# Check for existing installation
check_existing_installation() {
    local BINARY_PATH="$1"
    local SETTINGS_DIR="$2"
    local found=false
    local components=""

    if [ -f "$BINARY_PATH" ]; then
        components+="Binary found at $BINARY_PATH\n"
        found=true
    fi

    if [ -d "$SETTINGS_DIR" ]; then
        components+="Settings directory found at $SETTINGS_DIR\n"
        found=true
    fi

    if [ -f "/etc/systemd/system/dugong.service" ]; then
        components+="Systemd service found\n"
        found=true
    fi

    if systemctl is-active --quiet dugong.service 2>/dev/null; then
        components+="Service is currently running\n"
        found=true
    fi

    if [ "$found" = true ]; then
        print_warning "Existing installation detected:"
        echo -e "$components"

        read -p "Would you like to proceed with reinstallation? This will preserve your existing data but update the binary and service. [y/N] " response
        case "$response" in
            [yY][eE][sS]|[yY])
                if systemctl is-active --quiet dugong.service; then
                    print_status "Stopping existing service..."
                    systemctl stop dugong.service
                fi
                return 0
                ;;
            *)
                print_status "Installation cancelled"
                exit 0
                ;;
        esac
    fi
}

# Get current non-root user
USER_NAME=${SUDO_USER:-$(whoami)}

# Check if script is run as root
check_root() {
    if [ "$EUID" -ne 0 ]; then
        print_error "Please run as root"
        exit 1
    fi
}

# Detect system architecture
detect_arch() {
    local arch=$(uname -m)
    case $arch in
        x86_64)
            echo "amd64"
            ;;
        aarch64)
            echo "arm64"
            ;;
        *)
            print_error "Unsupported architecture: $arch"
            exit 1
            ;;
    esac
}

# Generate random string for JWT secret
generate_jwt_secret() {
    head -c 32 /dev/urandom | base64 | tr -d '\n'
}

# Function to get user input with default value
get_input() {
    local prompt="$1"
    local default="$2"
    local input

    read -p "$prompt [$default]: " input
    echo "${input:-$default}"
}

# Function to get port with validation
get_port() {
    local prompt="$1"
    local default="$2"
    local port

    while true; do
        read -p "$prompt [$default]: " port
        port=${port:-$default}
        if validate_port "$port"; then
            echo "$port"
            return 0
        fi
    done
}

# Function to get yes/no input
get_yes_no() {
    local prompt="$1"
    local default="$2"
    local input

    while true; do
        read -p "$prompt [y/n] ($default): " input
        input=${input:-$default}
        case $input in
            [yY]* ) echo "true"; return 0;;
            [nN]* ) echo "false"; return 0;;
            * ) print_warning "Please answer y or n";;
        esac
    done
}

# Install dependencies
install_dependencies() {
    print_status "Installing required packages..."
    apt-get update
    apt-get install -y curl wget apt-transport-https ca-certificates gnupg lsb-release sqlite3 lsof
}

# Install Docker if not present
install_docker() {
    if ! command_exists docker; then
        print_status "Installing Docker..."

        curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

        echo \
            "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/debian \
            $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

        apt-get update
        apt-get install -y docker-ce docker-ce-cli containerd.io

        systemctl start docker
        systemctl enable docker

        print_status "Docker installed successfully"
    else
        print_status "Docker is already installed"
    fi

    # Add user to Docker group
    usermod -aG docker "$USER_NAME"
    print_status "User $USER_NAME added to Docker group"
}


generate_self_signed_certs() {
    local CERT_DIR="$1"

    print_status "Generating self-signed certificates..."

    # Create a configuration file for OpenSSL
    local OPENSSL_CONFIG="$CERT_DIR/openssl.cnf"
    cat > "$OPENSSL_CONFIG" << EOF
[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn
x509_extensions = v3_req

[dn]
C = US
ST = Local
L = Local
O = Dugong
OU = Dugong Self-Signed
CN = localhost

[v3_req]
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
IP.1 = 127.0.0.1
EOF

    # Generate private key
    openssl genrsa -out "$CERT_DIR/server.key" 2048

    # Generate self-signed certificate
    openssl req -new -x509 -days 365 -key "$CERT_DIR/server.key" -out "$CERT_DIR/server.crt" -config "$OPENSSL_CONFIG"

    # Generate PEM file (combine key and certificate)
    cat "$CERT_DIR/server.key" "$CERT_DIR/server.crt" > "$CERT_DIR/server.pem"

    # Clean up the temporary OpenSSL config
    rm "$OPENSSL_CONFIG"

    # Set correct permissions
    chmod 600 "$CERT_DIR/server.key" "$CERT_DIR/server.pem"
    chmod 644 "$CERT_DIR/server.crt"

    print_status "Self-signed certificates generated in $CERT_DIR"
}


# Main installation function
main() {
    check_root

    print_status "--------------------------------------------"
    print_status "Dugong Installer"
    print_status "--------------------------------------------"


    # Get initial paths for existing installation check
    INSTALL_DIR="/usr/local/bin"

    if [ -n "$SUDO_USER" ]; then
        USER_HOME=$(getent passwd $SUDO_USER | cut -d: -f6)
    else
        USER_HOME=$HOME
    fi
    SETTINGS_DIR="$USER_HOME/.config/dugong"

    # Check for existing installation before proceeding
    check_existing_installation "$INSTALL_DIR/dugong" "$SETTINGS_DIR"

    # Detect architecture
    ARCH=$(detect_arch)
    print_status "Detected architecture: $ARCH"

    # Get installation preferences
    INSTALL_DIR=$(get_input "Enter binary installation directory" "$INSTALL_DIR")
    SETTINGS_DIR=$(get_input "Enter settings directory" "$SETTINGS_DIR")
    DB_NAME=$(get_input "Enter SQLite database name" "app.db")
    APP_PORT=$(get_port "Enter application port" "8080")

    # JWT Secret handling
    if [ -f "$SETTINGS_DIR/config.env" ]; then
        print_warning "Existing config.env found. Would you like to keep the existing JWT secret?"
        if [ "$(get_yes_no "Keep existing JWT secret?" "y")" = "true" ]; then
            JWT_SECRET=$(grep JWT_SECRET "$SETTINGS_DIR/config.env" | cut -d= -f2)
            print_status "Using existing JWT secret"
        else
            GENERATE_JWT=true
        fi
    fi

    if [ -z "$JWT_SECRET" ]; then
        GENERATE_JWT=$(get_yes_no "Would you like to generate a random JWT secret?" "y")
        if [ "$GENERATE_JWT" = "true" ]; then
            JWT_SECRET=$(generate_jwt_secret)
            print_status "Generated JWT secret"
        else
            JWT_SECRET=$(get_input "Enter JWT secret" "")
            while [ -z "$JWT_SECRET" ]; do
                print_warning "JWT secret cannot be empty"
                JWT_SECRET=$(get_input "Enter JWT secret" "")
            done
        fi
    fi

     # Self-signed certificate generation
      GENERATE_SELF_SIGNED=$(get_yes_no "Would you like to generate self-signed SSL certificates? (Not recommended for external use)" "y")

      # Proxy certificate auto-generation
      AUTO_PROXY_CERTS=$(get_yes_no "Would you like to use auto-generated certificates for the proxy?" "y")


    # Generate certificates if selected
    if [ "$GENERATE_SELF_SIGNED" = "true" ]; then
        # Generate self-signed certificates
        generate_self_signed_certs "$SETTINGS_DIR/data"
    fi

    # Generate certificates if selected
    if [ "AUTO_PROXY_CERTS" = "true" ]; then
        CERT_EMAIL=$(get_input "Enter SSL Certificate Email Address" "")
    fi

    # Create directory structure
    mkdir -p "$INSTALL_DIR"
    mkdir -p "$SETTINGS_DIR"
    mkdir -p "$SETTINGS_DIR/data"
    chown -R "$USER_NAME:$USER_NAME" "$SETTINGS_DIR"
    chown -R "$USER_NAME:$USER_NAME" "$SETTINGS_DIR/data"

    # Download binary based on architecture
    print_status "Downloading binary for $ARCH architecture..."
    VERSION=$(curl -s https://api.github.com/repos/joshm998/dugong/releases/latest | grep -o '"tag_name": ".*"' | cut -d'"' -f4)
    if [ -z "$VERSION" ]; then
        print_error "Failed to get latest version"
        exit 1
    fi
    print_status "Latest version: $VERSION"

    BINARY_URL="https://github.com/joshm998/dugong/releases/download/${VERSION}/dugong_${VERSION#v}_linux_${ARCH}"
    wget -O "$INSTALL_DIR/dugong" "$BINARY_URL"
    chmod +x "$INSTALL_DIR/dugong"

    # Install Docker
    install_docker

    # Create environment file
    ENV_FILE="$SETTINGS_DIR/config.env"
    cat > "$ENV_FILE" << EOF
DATABASE_URL=${SETTINGS_DIR}/data/${DB_NAME}
CERT_DIR=${SETTINGS_DIR}/data
GENERATE_CERTIFICATES=false
JWT_SECRET=${JWT_SECRET}
SERVER_ADDR=${APP_PORT}
CERT_EMAIL=${CERT_EMAIL}
EOF

    # Create systemd service
    print_status "Creating systemd service..."
    cat > "/etc/systemd/system/dugong.service" << EOF
[Unit]
Description=Dugong Service
After=network.target docker.service
Requires=docker.service

[Service]
ExecStart=${INSTALL_DIR}/dugong
EnvironmentFile=${ENV_FILE}
User=${USER_NAME}
Group=${USER_NAME}
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

    # Reload systemd and start service
    systemctl daemon-reload
    systemctl enable dugong.service
    systemctl start dugong.service

    print_status "Installation complete! The application is now running on port $APP_PORT"
    print_status "The web interface is available at https://localhost:$APP_PORT with the default username and password admin"
}

main "$@"
