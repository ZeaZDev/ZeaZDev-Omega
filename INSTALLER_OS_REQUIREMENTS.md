# OS & System Requirements for ZeaZDev

This document outlines the operating system and software requirements for developing and running the ZeaZDev FiGaTect Super-App.

---

## 💻 Supported Operating Systems

### ✅ Primary Support

**macOS**:
- macOS 12 (Monterey) or later
- macOS 13 (Ventura) recommended
- macOS 14 (Sonoma) supported
- Apple Silicon (M1/M2/M3) and Intel both supported

**Linux**:
- Ubuntu 20.04 LTS or later (recommended) - **Automated installer available**
- Ubuntu 22.04 LTS (tested) - **Automated installer available**
- Ubuntu 24.04 LTS (tested) - **Automated installer available**
- Debian 11+ (Bullseye)
- Fedora 36+
- Arch Linux (rolling)

**Windows**:
- Windows 10 (version 2004+) with WSL2
- Windows 11 (recommended)
- **Note**: WSL2 (Windows Subsystem for Linux) is REQUIRED
  - Ubuntu 20.04+ distribution recommended

### ⚠️ Not Supported
- Windows without WSL2 (native Windows development not supported)
- macOS 11 (Big Sur) or older
- 32-bit operating systems
- ChromeOS / ChromeOS Flex

---

---

## 🚀 Automated Installation (Ubuntu Only)

For Ubuntu users, we provide an automated installer that installs all prerequisites automatically:

```bash
# Clone repository
git clone https://github.com/ZeaZDev/ZeaZDev-Omega.git
cd ZeaZDev-Omega

# Run Ubuntu automated installer
chmod +x install-ubuntu.sh
./install-ubuntu.sh
```

This script will:
- Detect Ubuntu version and verify compatibility
- Install Docker and Docker Compose automatically
- Install Node.js 20 LTS automatically
- Install pnpm automatically
- Update Git if needed
- Set up the project environment
- Start all services

**For other operating systems**, continue with the manual installation below.

---

## 🛠️ Core Requirements

### 1. Docker Desktop

**Purpose**: PostgreSQL, Redis, and containerized services

**Installation**:

**macOS**:
```bash
brew install --cask docker
# Or download from https://www.docker.com/products/docker-desktop/
```

**Ubuntu/Debian**:
```bash
# Install Docker Engine
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt-get install docker-compose-plugin
```

**Windows (WSL2)**:
```bash
# Install Docker Desktop for Windows
# Download from https://www.docker.com/products/docker-desktop/
# Ensure "Use WSL 2 based engine" is enabled
```

**Verify**:
```bash
docker --version        # Should be 24.0+
docker compose version  # Should be 2.20+
```

**Resource Requirements**:
- Minimum: 4 GB RAM allocated
- Recommended: 8 GB RAM allocated
- Disk: 10 GB available space

---

### 2. Node.js

**Purpose**: JavaScript runtime for backend and frontend

**Version Required**: 18.x or 20.x LTS

**Installation**:

**macOS**:
```bash
# Using Homebrew
brew install node@20

# Or using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
nvm install 20
nvm use 20
```

**Ubuntu/Debian**:
```bash
# Using NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Or using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
nvm install 20
nvm use 20
```

**Windows (WSL2)**:
```bash
# Inside WSL2 terminal
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
nvm install 20
nvm use 20
```

**Verify**:
```bash
node --version   # Should be v18.x.x or v20.x.x
npm --version    # Should be 9.x.x or 10.x.x
```

---

### 3. pnpm

**Purpose**: Fast, disk space efficient package manager

**Version Required**: 8.x or later

**Installation**:
```bash
npm install -g pnpm@8

# Or using Corepack (recommended)
corepack enable
corepack prepare pnpm@8.11.0 --activate
```

**Verify**:
```bash
pnpm --version   # Should be 8.x.x
```

**Why pnpm?**
- 3x faster than npm
- Saves disk space via hard linking
- Better monorepo support
- Strict package resolution

---

### 4. Git

**Purpose**: Version control

**Version Required**: 2.30+

**Installation**:

**macOS**:
```bash
brew install git
```

**Ubuntu/Debian**:
```bash
sudo apt-get update
sudo apt-get install git
```

**Windows**:
```bash
# Git is usually pre-installed in WSL2
# If not:
sudo apt-get install git
```

**Configure**:
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

**Verify**:
```bash
git --version   # Should be 2.30+
```

---

## 🎮 Game Development (Optional)

### Unity Hub

**Purpose**: Game development and WebGL builds

**Required for**: Developing or modifying the slot game

**Installation**:

**Download**: https://unity.com/download

**Version Required**:
- Unity Hub 3.5+
- Unity Editor 2021.3 LTS or 2022.3 LTS

**Platform Support**:
- macOS (Intel & Apple Silicon)
- Windows 10/11
- Linux (AppImage)

**WebGL Build Module**:
```
Unity Hub → Installs → Add Modules → WebGL Build Support
```

**System Requirements**:
- RAM: 8 GB minimum, 16 GB recommended
- Disk: 20 GB for Unity + project
- GPU: Metal (macOS), DX11 (Windows), OpenGL 4.5+ (Linux)

**Note**: Not required if only working on backend/frontend

---

## 📱 Mobile Development (Optional)

### React Native Development

**For iOS Development** (macOS only):
```bash
# Install Xcode from App Store
xcode-select --install

# Install CocoaPods
sudo gem install cocoapods
```

**For Android Development** (All platforms):
```bash
# Install Android Studio
# Download from https://developer.android.com/studio

# Or using Homebrew (macOS)
brew install --cask android-studio
```

**Expo CLI** (Recommended):
```bash
pnpm add -g expo-cli
```

---

## 🗄️ Database Tools (Optional)

### PostgreSQL Client

**For direct database access**:

**macOS**:
```bash
brew install postgresql@16
# Or use GUI: Postico, TablePlus
```

**Ubuntu/Debian**:
```bash
sudo apt-get install postgresql-client-16
```

**Or use Docker** (recommended):
```bash
# Database runs in Docker, no local install needed
docker compose up postgres
```

---

## 🔧 Additional Tools (Recommended)

### Code Editors

**Visual Studio Code** (Recommended):
```bash
# macOS
brew install --cask visual-studio-code

# Ubuntu/Debian
sudo snap install code --classic

# Windows
# Download from https://code.visualstudio.com/
```

**Recommended VS Code Extensions**:
- ESLint
- Prettier
- Solidity
- Prisma
- Docker
- GitLens

### Terminal

**macOS**:
- iTerm2 (recommended): `brew install --cask iterm2`
- Warp: `brew install --cask warp`

**Ubuntu/Debian**:
- Terminator: `sudo apt-get install terminator`
- Tilix: `sudo apt-get install tilix`

**Windows**:
- Windows Terminal (pre-installed on Windows 11)
- Or use WSL2 terminal

---

## 💾 Hardware Requirements

### Minimum Specifications

**For Backend/Frontend Development**:
- CPU: 4 cores (Intel i5 / AMD Ryzen 5 / Apple M1)
- RAM: 8 GB
- Disk: 20 GB available space
- Network: Stable internet connection

**For Full Stack + Game Development**:
- CPU: 8 cores (Intel i7 / AMD Ryzen 7 / Apple M1 Pro)
- RAM: 16 GB
- Disk: 50 GB available space (SSD recommended)
- GPU: Dedicated GPU for Unity (optional but recommended)

### Recommended Specifications

**Professional Development**:
- CPU: 8+ cores (Intel i9 / AMD Ryzen 9 / Apple M1 Pro/Max)
- RAM: 32 GB
- Disk: 100 GB NVMe SSD
- GPU: RTX 3060 / M1 Pro or better (for Unity)
- Network: 100 Mbps+ internet

---

## 🌐 Network Requirements

### Ports Used

| Port | Service | Required |
|------|---------|----------|
| 3000 | Backend API | Yes |
| 5432 | PostgreSQL | Yes |
| 6379 | Redis | Yes |
| 8081 | Expo Dev Server | Yes (dev) |
| 19006 | Expo Web | Yes (dev) |
| 8545 | Hardhat Network | Optional |
| 8080 | Unity WebGL | Optional |

### Firewall Configuration

Allow outbound connections to:
- GitHub (git operations)
- npm registry (package downloads)
- Docker Hub (image pulls)
- Blockchain RPC endpoints (Optimism, etc.)
- World ID APIs

---

## ✅ Pre-Installation Checklist

Before running `install.sh`, ensure:

- [ ] Operating system is supported
- [ ] Docker Desktop installed and running
- [ ] Node.js 18+ installed
- [ ] pnpm 8+ installed
- [ ] Git 2.30+ installed
- [ ] At least 20 GB disk space available
- [ ] At least 8 GB RAM available
- [ ] Internet connection active
- [ ] (Optional) Unity Hub installed if developing game
- [ ] (Optional) Xcode/Android Studio for mobile development

---

## 🔍 Verification Script

Run this to verify all requirements:

```bash
#!/bin/bash

echo "=== ZeaZDev Requirements Check ==="

# Check Docker
if command -v docker &> /dev/null; then
    echo "✓ Docker: $(docker --version)"
else
    echo "✗ Docker: Not found"
fi

# Check Node.js
if command -v node &> /dev/null; then
    echo "✓ Node.js: $(node --version)"
else
    echo "✗ Node.js: Not found"
fi

# Check pnpm
if command -v pnpm &> /dev/null; then
    echo "✓ pnpm: $(pnpm --version)"
else
    echo "✗ pnpm: Not found"
fi

# Check Git
if command -v git &> /dev/null; then
    echo "✓ Git: $(git --version)"
else
    echo "✗ Git: Not found"
fi

# Check disk space
echo "✓ Available disk space: $(df -h . | awk 'NR==2 {print $4}')"

# Check RAM
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "✓ Total RAM: $(($(sysctl -n hw.memsize) / 1024 / 1024 / 1024)) GB"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "✓ Total RAM: $(free -h | awk 'NR==2 {print $2}')"
fi

echo "=== Check Complete ==="
```

Save as `check-requirements.sh`, make executable, and run:
```bash
chmod +x check-requirements.sh
./check-requirements.sh
```

---

## 🆘 Troubleshooting

### Docker not starting
- Ensure virtualization is enabled in BIOS
- Restart Docker Desktop
- Check Docker has enough resources allocated

### pnpm install fails
- Clear cache: `pnpm store prune`
- Delete node_modules: `rm -rf node_modules`
- Try again: `pnpm install`

### Port conflicts
- Check what's using port: `lsof -i :3000`
- Kill process: `kill -9 <PID>`
- Or change port in .env file

---

**Last Updated**: 2025-11-08
**Version**: 1.0.0
