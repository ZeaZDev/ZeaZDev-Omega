# ZeaZDev-Omega

## 🌟 Overview

ZeaZDev is an **OMEGA-TIER production-grade** Multi-Platform FiGaTect Super-App that seamlessly integrates:

- **DeFi** (Decentralized Finance): Wallet, Swap, Stake, Trade
- **GameFi** (Game Finance): Unity-powered slots with crypto rewards
- **FinTech** (Financial Technology): Real card issuance & Thai bank integration

Built as a **MiniApp for World App**, ZeaZDev uses **World ID Zero-Knowledge Proof (ZKP)** as the foundational identity verification layer for all high-value functions.

## 🏗️ Architecture

```mermaid
graph TB
    subgraph "Frontend Layer"
        A[React Native/Expo MiniApp]
        A1[World ID Screen]
        A2[Wallet Screen]
        A3[DeFi Screen]
        A4[Reward Screen]
        A5[Game Screen]
        A6[FinTech Screen]
        A7[Bridge Screen]
        A8[Governance Screen]
        A9[Social Screen]
        A10[Analytics Screen]
    end

    subgraph "Backend Layer"
        B[NestJS API Server]
        B1[Auth Module - ZKP Verifier]
        B2[DeFi Module - Swap/Stake]
        B3[Rewards Module - Claims]
        B4[FinTech Module - Card/Bank]
        B5[Game Module - Slots/Poker/Roulette/Sports]
        B6[Bridge Module - Cross-Chain]
        B7[Governance Module - DAO]
        B8[Social Module - Profiles]
        B9[Analytics Module - Metrics]
        B10[Enterprise Module - White-Label]
    end

    subgraph "Blockchain Layer"
        C1[ZeaToken $ZEA - ERC20]
        C2[DingToken $DING - ERC20]
        C3[ZeaZRewards - ZKP Gated]
        C4[ZeaZStake - Staking]
        C5[World ID Verifier]
        C6[ZeaBridge - Cross-Chain]
        C7[ZeaLiquidityBridge - Bridge LP]
        C8[ZeaGovernance - DAO]
        C9[ZeaTreasury - Treasury]
        C10[Game Contracts - Slots/Poker/Roulette/Sports]
    end

    subgraph "Game Layer"
        D[Unity WebGL]
        D1[Slot Machine]
        D2[Poker]
        D3[Roulette]
        D4[Sports Betting]
        D5[Web3 Bridge]
    end

    subgraph "External Services"
        E1[World ID]
        E2[Uniswap]
        E3[Thai Banks]
        E4[Card Issuer API]
        E5[Multi-Chain Networks]
    end

    subgraph "Data Layer"
        F1[PostgreSQL]
        F2[Redis Cache]
    end

    A --> B
    A5 --> D
    B --> C1
    B --> C2
    B --> C3
    B --> C4
    B1 --> C5
    B1 --> E1
    B2 --> E2
    B4 --> E3
    B4 --> E4
    B6 --> C6
    B6 --> C7
    B6 --> E5
    B7 --> C8
    B7 --> C9
    B5 --> C10
    B --> F1
    B --> F2
    D5 --> B5
```

## 🛠️ Tech Stack

### Core Technologies
- **Monorepo**: pnpm workspaces with Turbo
- **Frontend**: React Native/Expo (Multi-platform: iOS, Android, Web)
- **Backend**: Node.js/NestJS (Production-grade API)
- **Game**: Unity WebGL (Crypto-integrated slots)
- **Contracts**: Solidity/Hardhat (Optimism L2)
- **Database**: PostgreSQL + Prisma ORM
- **Cache**: Redis
- **Identity**: World ID (Zero-Knowledge Proofs)

### Integrations
- **DeFi**: Uniswap V3, MetaMask
- **FinTech**: Stripe/Marqeta (Cards), Thai Bank Proxy
- **DevOps**: Docker, GitHub Actions

## 📦 Project Structure

```
zeazdev-omega/
├── apps/
│   ├── frontend-miniapp/         # React Native/Expo app
│   │   ├── src/
│   │   │   ├── screens/          # All UI screens
│   │   │   ├── config/           # i18n, constants
│   │   │   └── locales/          # EN/TH translations
│   │   └── package.json
│   └── backend/                  # NestJS API
│       ├── src/
│       │   ├── modules/          # Auth, DeFi, Rewards, FinTech, Game, Bridge, Governance, Social, Analytics, Enterprise
│       │   ├── main.ts
│       │   └── app.module.ts
│       ├── prisma/
│       │   └── schema.prisma     # Full DB schema
│       └── package.json
├── packages/
│   ├── contracts/                # Smart contracts
│   │   ├── contracts/
│   │   │   ├── ZeaToken.sol      # $ZEA ERC20
│   │   │   ├── DingToken.sol     # $DING ERC20
│   │   │   ├── ZeaZRewards.sol   # ZKP rewards
│   │   │   ├── ZeaZStake.sol     # Staking
│   │   │   ├── ZeaBridge.sol     # Cross-chain bridge
│   │   │   ├── ZeaLiquidityBridge.sol  # Bridge with LP
│   │   │   ├── ZeaLiquidityPool.sol    # Liquidity pools
│   │   │   ├── ZeaGovernance.sol       # DAO governance
│   │   │   ├── ZeaTreasury.sol         # Treasury management
│   │   │   ├── ZeaTradFiBridge.sol     # TradFi integration
│   │   │   ├── ZeaSlotMachine.sol      # Slot game
│   │   │   ├── ZeaPoker.sol            # Poker game
│   │   │   ├── ZeaRoulette.sol         # Roulette game
│   │   │   ├── ZeaSportsBetting.sol    # Sports betting
│   │   │   └── IWorldIDVerifier.sol    # World ID interface
│   │   ├── scripts/
│   │   │   └── deploy.ts
│   │   └── hardhat.config.ts
│   └── game-unity/               # Unity game
│       └── Assets/Scripts/
│           └── Web3Bridge.cs     # RN/Unity bridge
├── docker-compose.yml            # Postgres + Redis
├── package.json                  # Root workspace
├── turbo.json
├── .env.example
└── README.md
```

## 🚀 Features

### ✅ Core Features
- **World ID ZKP Verification**: Sybil-resistant identity for all rewards
- **Dual Tokenomics**: $ZEA (utility/governance) + $DING (game rewards)
- **MetaMask Integration**: Full wallet connectivity
- **Uniswap Swap**: Decentralized token exchange
- **Staking**: 10% APY on $ZEA
- **Daily Check-in**: ZKP-gated daily rewards
- **Airdrop**: One-time ZKP-gated claim
- **Referral Program**: Earn by inviting friends
- **Unity Slots**: Crypto-powered slot game
- **Real Card**: Apply for physical card
- **Thai Bank Integration**: Deposit/withdraw THB
- **PromptPay Top-Up**: Instant QR code payments for crypto top-up

### 🌉 Cross-Chain & Bridge
- **Multi-Chain Bridge**: Seamless token transfers between Optimism, Polygon, Arbitrum, and Base
- **Liquidity Pools**: Earn fees by providing bridge liquidity (15%+ APR)
- **TradFi Bridge**: Connect traditional finance with blockchain

### 🎮 GameFi Expansion
- **Slot Machine**: Unity-powered crypto slots with $DING rewards
- **Poker**: Multiplayer poker with crypto betting
- **Roulette**: Classic casino game with blockchain integration
- **Sports Betting**: Decentralized sports betting platform

### 🏛️ Governance & DAO
- **On-Chain Governance**: Participate in protocol decisions with $ZEA
- **Proposal System**: Create and vote on platform improvements
- **Treasury Management**: Community-controlled treasury

### 👥 Social Features
- **Social Profiles**: Connect with other users
- **Activity Feed**: Share and discover platform activities
- **Achievements**: Earn badges and rewards for platform engagement

### 📊 Analytics & Insights
- **Portfolio Tracking**: Monitor your assets across all chains
- **Performance Metrics**: Track your earnings and ROI
- **Market Analytics**: Real-time crypto market data

### 🏢 Enterprise Solutions
- **White-Label Platform**: Deploy branded versions of ZeaZDev
- **API Marketplace**: Access premium APIs and services
- **SDK Support**: JavaScript, Python, and Go SDKs
- **Plugin Ecosystem**: Extend functionality with community plugins

### 🔐 Security
- **ZKP Verification**: World ID nullifier hash tracking
- **Reentrancy Guards**: All critical functions protected
- **Pausable Tokens**: Emergency controls
- **Production Hardened**: No placeholders or demo code

## 📥 Installation

### Prerequisites
- Docker Desktop
- Node.js 18+
- pnpm 8+
- Git
- Unity Hub (for game development)

### Quick Start

#### Ubuntu (Automated Installation)

```bash
# 1. Clone repository
git clone https://github.com/ZeaZDev/ZeaZDev-Omega.git
cd ZeaZDev-Omega

# 2. Run Ubuntu automated installer (installs all dependencies)
chmod +x install-ubuntu.sh
./install-ubuntu.sh

# 3. Access services
# - Frontend: http://localhost:8081
# - Backend: http://localhost:3000
# - Postgres: localhost:5432
# - Redis: localhost:6379
```

#### macOS / Other Linux / Windows (WSL2)

```bash
# 1. Clone repository
git clone https://github.com/ZeaZDev/ZeaZDev-Omega.git
cd ZeaZDev-Omega

# 2. Run automated installer (requires prerequisites installed)
chmod +x install.sh
./install.sh

# 3. Access services
# - Frontend: http://localhost:8081
# - Backend: http://localhost:3000
# - Postgres: localhost:5432
# - Redis: localhost:6379
```

### Manual Installation

```bash
# 1. Install dependencies
pnpm install

# 2. Start Docker services
docker compose up -d

# 3. Setup environment
cp .env.example .env
# Edit .env with your values

# 4. Run database migrations
pnpm db:migrate

# 5. Compile contracts (optional)
pnpm contracts:compile

# 6. Start development servers
pnpm dev
```

## 🎯 Usage

### Deploy Smart Contracts

```bash
cd packages/contracts
pnpm hardhat run scripts/deploy.ts --network optimism
# Update .env with deployed addresses
```

### Run Backend

```bash
cd apps/backend
pnpm dev
# API available at http://localhost:3000/api
```

### Run Frontend

```bash
cd apps/frontend-miniapp
pnpm start
# Expo dev server starts
```

### Build for Production

```bash
# Build all packages
pnpm build

# Build iOS
cd apps/frontend-miniapp
eas build --platform ios

# Build Android
eas build --platform android
```

## 🌐 Multi-Language Support

ZeaZDev supports:
- 🇬🇧 English (en)
- 🇹🇭 Thai (th)

Powered by react-i18next with dynamic language switching.

## 📚 Documentation

### Core Documentation
- [Architecture Deep Dive](./ARCHITECTURE.md)
- [Tokenomics](./TOKENOMICS.md)
- [Roadmap](./ROADMAP.md)
- [Contributing Guidelines](./CONTRIBUTING.md)
- [GitHub Setup Guide](./GITHUB-SETUP.md)
- [OS Requirements](./INSTALLER_OS_REQUIREMENTS.md)

### Feature-Specific Guides
- [API Documentation](./API_DOCUMENTATION.md)
- [Cross-Chain Bridge Integration](./BRIDGE_INTEGRATION.md)
- [Enterprise Features](./ENTERPRISE_FEATURES.md)
- [GameFi Integration](./GAMEFI_INTEGRATION.md)
- [PromptPay Integration](./PROMPTPAY_INTEGRATION.md)

## 🔗 Links

- **GitHub**: https://github.com/ZeaZDev/ZeaZDev-Omega
- **Documentation**: Coming soon
- **Community**: Coming soon

## 📄 License

Proprietary - All Rights Reserved

## 👥 Authors

**ZeaZDev Meta-Intelligence** (AI-Generated Omega Architecture)

---

**Version**: 2.0.0 (Omega Complete)
**Status**: ✅ Production-Ready - All Phases Complete
**Last Updated**: 2025-11-10
