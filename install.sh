#!/bin/bash
#
# @Project: ZeaZDev FiGaTect Super-App
# @Module: DevOps-Installer
# @File: install.sh
# @Author: ZeaZDev Enterprises (OMEGA AI)
# @Date: 2025-11-09
# @Version: 1.0.0
# @Description: Automated installer script for setting up development environment
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
║   Automated Setup Script                             ║
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

# Step 1: Check OS Requirements
echo ""
print_info "Step 1/7: Checking system requirements..."
echo ""

# Check OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macOS"
    print_success "Operating System: macOS"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="Linux"
    print_success "Operating System: Linux"
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
    OS="Windows"
    print_warning "Windows detected. Please use WSL2 for best compatibility."
else
    print_error "Unsupported operating system: $OSTYPE"
    exit 1
fi

# Check Docker
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version | awk '{print $3}' | sed 's/,//')
    print_success "Docker found: $DOCKER_VERSION"
    
    # Check if Docker daemon is running
    if ! docker info &> /dev/null; then
        print_error "Docker daemon is not running. Please start Docker Desktop."
        exit 1
    fi
else
    print_error "Docker not found. Please install Docker Desktop first."
    print_info "Visit: https://www.docker.com/products/docker-desktop/"
    exit 1
fi

# Check Docker Compose
if docker compose version &> /dev/null; then
    print_success "Docker Compose found"
else
    print_error "Docker Compose not found. Please install Docker Compose."
    exit 1
fi

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    
    if [ "$NODE_MAJOR" -ge 18 ]; then
        print_success "Node.js found: $NODE_VERSION"
    else
        print_error "Node.js version $NODE_VERSION is too old. Please install Node.js 18 or later."
        exit 1
    fi
else
    print_error "Node.js not found. Please install Node.js 18 or later."
    print_info "Visit: https://nodejs.org/"
    exit 1
fi

# Check pnpm
if command -v pnpm &> /dev/null; then
    PNPM_VERSION=$(pnpm --version)
    print_success "pnpm found: $PNPM_VERSION"
else
    print_warning "pnpm not found. Installing pnpm..."
    npm install -g pnpm@8
    print_success "pnpm installed successfully"
fi

# Check Git
if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version | awk '{print $3}')
    print_success "Git found: $GIT_VERSION"
else
    print_error "Git not found. Please install Git."
    exit 1
fi

# Check disk space (at least 10 GB)
if [[ "$OS" == "macOS" ]]; then
    AVAILABLE_SPACE=$(df -g . | awk 'NR==2 {print $4}')
elif [[ "$OS" == "Linux" ]]; then
    AVAILABLE_SPACE=$(df -BG . | awk 'NR==2 {print $4}' | sed 's/G//')
fi

if [ "$AVAILABLE_SPACE" -lt 10 ]; then
    print_warning "Low disk space: ${AVAILABLE_SPACE}GB available. At least 20GB recommended."
else
    print_success "Disk space: ${AVAILABLE_SPACE}GB available"
fi

echo ""
print_success "All system requirements met!"
echo ""

# Step 2: Create .env file
echo ""
print_info "Step 2/7: Setting up environment variables..."
echo ""

if [ -f ".env" ]; then
    print_warning ".env file already exists. Backing up to .env.backup"
    cp .env .env.backup
fi

cp .env.example .env
print_success ".env file created from .env.example"
print_warning "Please edit .env file with your actual values before running services!"
echo ""

# Step 3: Start Docker services
echo ""
print_info "Step 3/7: Starting Docker services (PostgreSQL & Redis)..."
echo ""

docker compose up -d

# Wait for services to be healthy
print_info "Waiting for services to be ready..."
sleep 5

# Check if PostgreSQL is ready
for i in {1..30}; do
    if docker compose exec -T postgres pg_isready &> /dev/null; then
        print_success "PostgreSQL is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        print_error "PostgreSQL failed to start"
        exit 1
    fi
    sleep 1
done

# Check if Redis is ready
for i in {1..30}; do
    if docker compose exec -T redis redis-cli ping &> /dev/null; then
        print_success "Redis is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        print_error "Redis failed to start"
        exit 1
    fi
    sleep 1
done

echo ""

# Step 4: Install dependencies
echo ""
print_info "Step 4/7: Installing project dependencies..."
echo ""

pnpm install
print_success "Dependencies installed successfully"
echo ""

# Step 5: Generate Prisma Client
echo ""
print_info "Step 5/7: Generating Prisma client..."
echo ""

cd apps/backend
pnpm prisma generate
print_success "Prisma client generated"
cd ../..
echo ""

# Step 6: Run database migrations
echo ""
print_info "Step 6/7: Running database migrations..."
echo ""

# Check if DATABASE_URL is set
if grep -q "DATABASE_URL=postgresql://zeazdev:zeazdev_secure_password_change_in_production@localhost:5432/zeazdev" .env; then
    print_warning "Using default database credentials from .env.example"
    print_warning "Please update DATABASE_URL in .env for production!"
fi

cd apps/backend

# Run migrations
if pnpm prisma migrate dev --name init; then
    print_success "Database migrations completed"
else
    print_error "Database migrations failed"
    print_info "This might be because migrations already exist or database is not accessible"
    print_info "You can run 'cd apps/backend && pnpm prisma migrate dev' manually later"
fi

cd ../..
echo ""

# Step 7: Final verification
echo ""
print_info "Step 7/7: Verifying installation..."
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
    print_success "Happy coding! 💻"
    echo ""
else
    print_error "Installation completed with errors. Please check the logs above."
    exit 1
fi
