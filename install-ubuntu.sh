#!/bin/bash
#
# @Project: ZeaZDev FiGaTect Super-App
# @Module: DevOps-Installer
# @File: install-ubuntu.sh
# @Author: ZeaZDev Enterprises (OMEGA AI)
# @Date: 2025-11-09
# @Version: 1.0.0
# @Description: Automated installer script for Ubuntu with automatic dependency installation
# @License: ZeaZDev Proprietary License
# @Copyright: (c) 2025-2026 ZeaZDev. All rights reserved.
#

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Banner
echo -e "${GREEN}"
cat << "EOF"
╔═══════════════════════════════════════════════════════╗
║   ZeaZDev FiGaTect Super-App Installer               ║
║   Ubuntu Automated Setup Script                      ║
║   Version: 1.0.0 (Omega Scaffolding)                 ║
╚═══════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Function to print colored messages
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Function to check if running as root
check_root() {
    if [ "$EUID" -eq 0 ]; then
        print_error "Please do not run this script as root or with sudo"
        print_info "The script will ask for sudo password when needed"
        exit 1
    fi
}

# Function to detect Ubuntu version
detect_ubuntu_version() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        if [ "$ID" != "ubuntu" ]; then
            print_error "This script is designed for Ubuntu only"
            print_info "Detected OS: $ID"
            print_info "For other Linux distributions, please use install.sh"
            exit 1
        fi
        
        UBUNTU_VERSION=$VERSION_ID
        print_success "Detected Ubuntu $VERSION_ID ($VERSION_CODENAME)"
        
        # Check if version is supported
        case "$VERSION_ID" in
            20.04|22.04|24.04)
                print_success "Ubuntu version is supported"
                ;;
            *)
                print_warning "Ubuntu $VERSION_ID may not be tested. Recommended: 20.04, 22.04, or 24.04"
                read -p "Continue anyway? (y/n) " -n 1 -r
                echo
                if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                    exit 1
                fi
                ;;
        esac
    else
        print_error "Cannot detect Ubuntu version"
        exit 1
    fi
}

# Check if running on Ubuntu and not as root
check_root
detect_ubuntu_version

echo ""
print_info "This installer will automatically install missing dependencies"
print_info "You may be asked for your sudo password during installation"
echo ""
read -p "Press Enter to continue or Ctrl+C to cancel..."
echo ""

# Step 1: System Update and Requirements Check
echo ""
print_info "Step 1/8: Checking and installing system requirements..."
echo ""

# Update package list
print_info "Updating package list..."
sudo apt-get update -qq

# Install basic dependencies
print_info "Installing basic build tools..."
sudo apt-get install -y -qq curl wget git build-essential ca-certificates gnupg lsb-release apt-transport-https software-properties-common

print_success "Basic system tools installed"
echo ""

# Step 2: Install Docker
echo ""
print_info "Step 2/8: Installing Docker..."
echo ""

if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version | awk '{print $3}' | sed 's/,//')
    print_success "Docker already installed: $DOCKER_VERSION"
    
    # Check if Docker daemon is running
    if ! docker info &> /dev/null; then
        print_warning "Docker daemon is not running. Attempting to start..."
        sudo systemctl start docker
        sudo systemctl enable docker
        
        # Add user to docker group if not already
        if ! groups $USER | grep -q docker; then
            print_info "Adding $USER to docker group..."
            sudo usermod -aG docker $USER
            print_warning "You'll need to log out and back in for docker group changes to take effect"
            print_warning "Or run: newgrp docker"
        fi
    fi
else
    print_info "Docker not found. Installing Docker..."
    
    # Remove old versions
    sudo apt-get remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true
    
    # Install Docker using official script
    print_info "Downloading Docker installation script..."
    curl -fsSL https://get.docker.com -o /tmp/get-docker.sh
    
    print_info "Running Docker installation..."
    sudo sh /tmp/get-docker.sh
    
    # Start and enable Docker
    sudo systemctl start docker
    sudo systemctl enable docker
    
    # Add user to docker group
    print_info "Adding $USER to docker group..."
    sudo usermod -aG docker $USER
    
    print_success "Docker installed successfully"
    print_warning "You may need to log out and back in for docker group changes to take effect"
    print_info "For this session, run: newgrp docker"
    
    rm /tmp/get-docker.sh
fi

# Install Docker Compose plugin if not present
if ! docker compose version &> /dev/null; then
    print_info "Installing Docker Compose plugin..."
    sudo apt-get install -y docker-compose-plugin
    print_success "Docker Compose plugin installed"
else
    COMPOSE_VERSION=$(docker compose version --short)
    print_success "Docker Compose already installed: $COMPOSE_VERSION"
fi

echo ""

# Step 3: Install Node.js
echo ""
print_info "Step 3/8: Installing Node.js..."
echo ""

NODE_INSTALLED=false
NODE_VERSION_OK=false

if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    
    if [ "$NODE_MAJOR" -ge 18 ]; then
        print_success "Node.js already installed: $NODE_VERSION"
        NODE_INSTALLED=true
        NODE_VERSION_OK=true
    else
        print_warning "Node.js version $NODE_VERSION is too old (need 18+)"
        NODE_INSTALLED=true
        NODE_VERSION_OK=false
    fi
fi

if [ "$NODE_INSTALLED" = false ] || [ "$NODE_VERSION_OK" = false ]; then
    print_info "Installing Node.js 20 LTS..."
    
    # Remove old Node.js versions
    sudo apt-get remove -y nodejs npm 2>/dev/null || true
    
    # Install Node.js 20 using NodeSource
    print_info "Adding NodeSource repository..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    
    print_info "Installing Node.js from NodeSource..."
    sudo apt-get install -y nodejs
    
    NODE_VERSION=$(node --version)
    print_success "Node.js installed: $NODE_VERSION"
fi

echo ""

# Step 4: Install pnpm
echo ""
print_info "Step 4/8: Installing pnpm..."
echo ""

if command -v pnpm &> /dev/null; then
    PNPM_VERSION=$(pnpm --version)
    PNPM_MAJOR=$(echo $PNPM_VERSION | cut -d'.' -f1)
    
    if [ "$PNPM_MAJOR" -ge 8 ]; then
        print_success "pnpm already installed: $PNPM_VERSION"
    else
        print_warning "pnpm version $PNPM_VERSION is too old. Installing pnpm 8..."
        npm install -g pnpm@8
        print_success "pnpm upgraded to version $(pnpm --version)"
    fi
else
    print_info "Installing pnpm 8..."
    npm install -g pnpm@8
    print_success "pnpm installed: $(pnpm --version)"
fi

echo ""

# Step 5: Verify Git
echo ""
print_info "Step 5/8: Verifying Git installation..."
echo ""

if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version | awk '{print $3}')
    print_success "Git found: $GIT_VERSION"
    
    # Check if Git is configured
    if ! git config --global user.name &> /dev/null || ! git config --global user.email &> /dev/null; then
        print_warning "Git user information not configured"
        print_info "Please configure Git with:"
        echo "  git config --global user.name \"Your Name\""
        echo "  git config --global user.email \"your.email@example.com\""
    fi
else
    print_error "Git not found (should have been installed in step 1)"
    exit 1
fi

echo ""

# Step 6: Check system resources
echo ""
print_info "Step 6/8: Checking system resources..."
echo ""

# Check disk space (at least 10 GB)
AVAILABLE_SPACE=$(df -BG . | awk 'NR==2 {print $4}' | sed 's/G//')

if [ "$AVAILABLE_SPACE" -lt 10 ]; then
    print_warning "Low disk space: ${AVAILABLE_SPACE}GB available. At least 20GB recommended."
else
    print_success "Disk space: ${AVAILABLE_SPACE}GB available"
fi

# Check RAM
TOTAL_RAM=$(free -h | awk 'NR==2 {print $2}')
AVAILABLE_RAM=$(free -h | awk 'NR==2 {print $7}')
print_success "Total RAM: $TOTAL_RAM (Available: $AVAILABLE_RAM)"

echo ""
print_success "All prerequisites installed and verified!"
echo ""

# Step 7: Setup project environment
echo ""
print_info "Step 7/8: Setting up project environment..."
echo ""

if [ -f ".env" ]; then
    print_warning ".env file already exists. Backing up to .env.backup"
    cp .env .env.backup
fi

cp .env.example .env
print_success ".env file created from .env.example"
print_warning "Please edit .env file with your actual values before running services!"
echo ""

# Step 8: Start Docker services
echo ""
print_info "Step 8/8: Starting Docker services (PostgreSQL & Redis)..."
echo ""

# Check if user is in docker group for this session
if ! docker ps &> /dev/null 2>&1; then
    print_warning "Docker permission denied. Trying with newgrp docker..."
    print_info "If this fails, please log out and log back in, then run: ./install.sh"
    
    # Try to run docker commands with newgrp
    if ! sg docker -c "docker compose up -d"; then
        print_error "Cannot start Docker services. Please run 'newgrp docker' or log out and back in"
        print_info "Then run: ./install.sh to complete the setup"
        exit 1
    fi
else
    docker compose up -d
fi

# Wait for services to be healthy
print_info "Waiting for services to be ready..."
sleep 5

# Check if PostgreSQL is ready
POSTGRES_READY=false
for i in {1..30}; do
    if docker compose exec -T postgres pg_isready &> /dev/null; then
        print_success "PostgreSQL is ready"
        POSTGRES_READY=true
        break
    fi
    sleep 1
done

if [ "$POSTGRES_READY" = false ]; then
    print_error "PostgreSQL failed to start"
    print_info "Check logs with: docker compose logs postgres"
fi

# Check if Redis is ready
REDIS_READY=false
for i in {1..30}; do
    if docker compose exec -T redis redis-cli ping &> /dev/null 2>&1; then
        print_success "Redis is ready"
        REDIS_READY=true
        break
    fi
    sleep 1
done

if [ "$REDIS_READY" = false ]; then
    print_error "Redis failed to start"
    print_info "Check logs with: docker compose logs redis"
fi

echo ""

# Install dependencies
echo ""
print_info "Installing project dependencies..."
echo ""

pnpm install
print_success "Dependencies installed successfully"
echo ""

# Generate Prisma Client
echo ""
print_info "Generating Prisma client..."
echo ""

cd apps/backend
pnpm prisma generate
print_success "Prisma client generated"
cd ../..
echo ""

# Run database migrations
echo ""
print_info "Running database migrations..."
echo ""

# Check if DATABASE_URL is set
if grep -q "DATABASE_URL=postgresql://zeazdev:zeazdev_secure_password_change_in_production@localhost:5432/zeazdev" .env; then
    print_warning "Using default database credentials from .env.example"
    print_warning "Please update DATABASE_URL in .env for production!"
fi

cd apps/backend

# Run migrations
if pnpm prisma migrate dev --name init 2>/dev/null; then
    print_success "Database migrations completed"
else
    print_warning "Database migrations may have already been applied"
    print_info "You can run 'cd apps/backend && pnpm prisma migrate dev' manually if needed"
fi

cd ../..
echo ""

# Final verification
echo ""
print_info "Verifying installation..."
echo ""

# Check services
SERVICES_OK=true

if docker compose ps | grep -q "postgres.*running"; then
    print_success "PostgreSQL: Running"
else
    print_error "PostgreSQL: Not running"
    SERVICES_OK=false
fi

if docker compose ps | grep -q "redis.*running"; then
    print_success "Redis: Running"
else
    print_error "Redis: Not running"
    SERVICES_OK=false
fi

if [ -d "node_modules" ]; then
    print_success "Dependencies: Installed"
else
    print_error "Dependencies: Missing"
    SERVICES_OK=false
fi

echo ""

# Installation complete
if [ "$SERVICES_OK" = true ]; then
    echo -e "${GREEN}"
    cat << "EOF"
╔═══════════════════════════════════════════════════════╗
║   Installation Complete! 🚀                          ║
╚═══════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
    
    echo ""
    print_info "Next steps:"
    echo ""
    echo "1. Review and update .env file with your actual values:"
    echo "   - Database credentials"
    echo "   - API keys (World ID, FinTech, etc.)"
    echo "   - RPC URLs and private keys"
    echo ""
    echo "2. Start development servers:"
    echo "   ${BLUE}pnpm dev${NC}"
    echo ""
    echo "3. Or start individual services:"
    echo "   Backend:  ${BLUE}cd apps/backend && pnpm dev${NC}"
    echo "   Frontend: ${BLUE}cd apps/frontend-miniapp && pnpm start${NC}"
    echo ""
    echo "4. Deploy smart contracts (optional):"
    echo "   ${BLUE}cd packages/contracts && pnpm hardhat run scripts/deploy.ts${NC}"
    echo ""
    echo "5. Access services:"
    echo "   - Backend API:  http://localhost:3000"
    echo "   - Frontend:     http://localhost:8081"
    echo "   - PostgreSQL:   localhost:5432"
    echo "   - Redis:        localhost:6379"
    echo ""
    print_info "Documentation:"
    echo "   - README.md               - Overview and quick start"
    echo "   - ARCHITECTURE.md         - System architecture"
    echo "   - ROADMAP.md              - Development roadmap"
    echo "   - CONTRIBUTING.md         - Contribution guidelines"
    echo ""
    
    if ! docker ps &> /dev/null 2>&1; then
        echo ""
        print_warning "IMPORTANT: You need to activate docker group membership"
        print_info "Run one of the following:"
        echo "   ${YELLOW}newgrp docker${NC}   (for current session)"
        echo "   ${YELLOW}Log out and log back in${NC}   (permanent)"
        echo ""
    fi
    
    print_success "Happy coding! 💻"
    echo ""
else
    print_error "Installation completed with errors. Please check the logs above."
    echo ""
    print_info "Common issues:"
    echo "- If Docker permission denied: run 'newgrp docker' or log out and back in"
    echo "- If services not starting: check 'docker compose logs'"
    echo "- If ports in use: check with 'sudo lsof -i :5432' and 'sudo lsof -i :6379'"
    exit 1
fi
