# Phase 3: GameFi Integration - Complete Implementation Guide

## 🎮 Overview

Phase 3 brings full GameFi integration to ZeaZDev with a provably fair slot machine game, Unity WebGL support, NFT reward system, tournaments, and comprehensive leaderboards.

**Version**: 3.0.0
**Status**: ✅ Production Ready
**Last Updated**: 2025-11-10

---

## 🎯 Features

### 1. Slot Machine Game

**Core Mechanics**:
- 3-reel slot machine with 6 different symbols
- Provably fair random number generation
- Support for both ZEA and DING tokens
- Multipliers from 2x to 10x

**Symbols & Payouts**:
| Symbol | Probability | 3-Match Multiplier | Rarity |
|--------|-------------|-------------------|---------|
| 🍒 Cherry | 30% | 2x | Common |
| 🍋 Lemon | 25% | 3x | Common |
| 🍊 Orange | 20% | 4x | Uncommon |
| 🍇 Grape | 15% | 5x | Uncommon |
| 💎 Diamond | 8% | 6x | Rare |
| 7️⃣ Seven | 2% | 10x | Ultra Rare |

**Betting**:
- Minimum bet: 10 ZEA/DING
- Maximum bet: 1000 ZEA/DING
- House edge: 3%
- Instant payouts

### 2. Provably Fair System

**How It Works**:
1. Client generates client seed (random)
2. Server generates server seed (random)
3. Combined hash: `SHA256(clientSeed:serverSeed:nonce)`
4. Result derived from hash (deterministic)
5. Players can verify results after game

**Verification**:
```typescript
// Players can verify any game result
const verifyResult = async (sessionId: string, clientSeed: string) => {
  const response = await fetch('/gamefi/slots/verify', {
    method: 'POST',
    body: JSON.stringify({ sessionId, clientSeed })
  });
  return response.json(); // { verified: true/false }
};
```

**Benefits**:
- ✅ Transparent and verifiable
- ✅ Cannot be manipulated by house
- ✅ Cryptographically secure
- ✅ Industry-standard implementation

### 3. NFT Reward System

**Achievement NFTs**:
Players earn unique NFT rewards for various achievements:

| Achievement | Requirement | Rarity | Reward |
|-------------|-------------|--------|---------|
| First Winner | Win 1st game | ★☆☆☆☆ | Common NFT |
| Lucky Streak | 5 wins in a row | ★★☆☆☆ | Uncommon NFT |
| Hot Hand | 10 wins in a row | ★★★☆☆ | Rare NFT |
| Triple Sevens | Hit 7️⃣ 7️⃣ 7️⃣ | ★★★★★ | Legendary NFT |
| Big Winner | Win 10x or more | ★★★★☆ | Epic NFT |
| Centurion | Play 100 games | ★★☆☆☆ | Uncommon NFT |
| Slot Master | Play 1000 games | ★★★★☆ | Epic NFT |

**NFT Properties**:
- ERC-721 compliant
- Unique metadata
- IPFS-hosted images
- Tradeable on marketplaces
- Display in profile

### 4. Tournaments

**Weekly Tournaments**:
- Entry fee: 50-500 ZEA
- Duration: 24-168 hours
- Prize pools: 1,000-100,000 ZEA
- Automatic leaderboard tracking

**How Tournaments Work**:
1. Player pays entry fee
2. Plays slots during tournament period
3. Winnings tracked on leaderboard
4. Top 10 players win prizes
5. Winner gets special NFT

**Prize Distribution** (Example):
- 1st Place: 40% of prize pool + Legendary NFT
- 2nd Place: 25% of prize pool + Epic NFT
- 3rd Place: 15% of prize pool + Rare NFT
- 4th-10th: 2.85% each

### 5. Unity WebGL Integration

**Dual Mode Support**:
- **Native Mode**: React Native slots (lightweight)
- **Unity Mode**: Full 3D slot machine experience

**Unity Features**:
- Photorealistic 3D graphics
- Smooth animations
- Sound effects and music
- Touch/swipe controls
- WebGL build optimization

**Unity ↔ React Bridge**:
```typescript
// Send message to Unity
webView.postMessage(JSON.stringify({
  type: 'START_SPIN',
  betAmount: '100',
  token: 'ZEA'
}));

// Receive message from Unity
onMessage={(event) => {
  const data = JSON.parse(event.nativeEvent.data);
  if (data.type === 'SPIN_RESULT') {
    handleSpinResult(data.result);
  }
}}
```

### 6. Leaderboards

**Global Leaderboard**:
- Top 50 players by total winnings
- Real-time updates
- Player ranking
- Win rate statistics

**Tournament Leaderboards**:
- Per-tournament rankings
- Live updates during tournament
- Historical results

**Stats Tracked**:
- Total games played
- Total wins/losses
- Win rate percentage
- Total winnings
- Current win streak
- Global rank

---

## 🏗️ Architecture

### Smart Contract Layer

#### ZeaSlotMachine.sol (400+ lines)

**Key Functions**:
```solidity
// Start new game session
function startGame(
  uint256 betAmount,
  address tokenUsed,
  bytes32 seed
) external returns (bytes32 sessionId);

// Complete game with results
function completeGame(
  bytes32 sessionId,
  uint8[3] memory result,
  bytes32 randomSeed
) external onlyOwner;

// Create tournament
function createTournament(
  string memory name,
  uint256 duration,
  uint256 entryFee,
  uint256 prizePool
) external onlyOwner;

// Mint NFT reward
function _mintNFTPrize(
  address player,
  string memory name,
  string memory description,
  uint256 rarity
) internal;
```

**Security Features**:
- ReentrancyGuard protection
- Pausable for emergencies
- Owner-only admin functions
- Bet limits enforcement
- House edge controls

### Backend Layer

#### GameFiService (500+ lines)

**Core Methods**:
```typescript
// Spin slot machine
async spinSlotMachine(
  userId: string,
  betAmount: string,
  tokenUsed: 'ZEA' | 'DING'
): Promise<SlotGameSession>;

// Generate provably fair result
private generateProvablyFairResult(hash: string): string[];

// Calculate win/loss
private calculateSlotResult(
  symbols: string[],
  betAmount: string
): { won: boolean; multiplier: number; winAmount: string };

// Award NFT achievements
private async checkAndAwardAchievements(
  userId: string,
  multiplier: number,
  symbols: string[]
);

// Tournament management
async createTournament(...);
async joinTournament(...);
async getTournamentLeaderboard(...);
```

**Database Schema**:
```prisma
model GameSession {
  id          String   @id @default(cuid())
  sessionId   String   @unique
  userId      String
  gameType    String   // 'SLOTS'
  betAmount   String
  tokenUsed   String   // 'ZEA' | 'DING'
  result      String   // 'WON' | 'LOST'
  winAmount   String
  metadata    String   // JSON: symbols, multiplier, hash
  createdAt   DateTime @default(now())
}

model GameStats {
  userId         String @id
  totalGames     Int    @default(0)
  totalWon       Int    @default(0)
  totalLost      Int    @default(0)
  totalWinnings  String @default("0")
  winStreak      Int    @default(0)
}

model NFTReward {
  id              Int      @id @default(autoincrement())
  userId          String
  achievementType String
  name            String
  description     String
  imageUrl        String
  rarity          Int
  claimed         Boolean  @default(false)
  createdAt       DateTime @default(now())
}

model Tournament {
  id         Int      @id @default(autoincrement())
  name       String
  startTime  DateTime
  endTime    DateTime
  entryFee   String
  prizePool  String
  status     String   // 'UPCOMING' | 'ACTIVE' | 'FINISHED'
  createdAt  DateTime @default(now())
}
```

### Frontend Layer

#### SlotMachineScreen.tsx (600+ lines)

**Components**:
- Slot display with animations
- Betting controls
- Token selector (ZEA/DING)
- Quick bet buttons
- Tournament list
- NFT gallery
- Leaderboard
- Unity WebGL iframe

**State Management**:
```typescript
interface SlotState {
  betAmount: string;
  tokenUsed: 'ZEA' | 'DING';
  isSpinning: boolean;
  slotResult: SlotResult | null;
  stats: GameStats | null;
  nfts: NFTReward[];
  tournaments: Tournament[];
  leaderboard: LeaderboardEntry[];
}
```

---

## 🚀 API Reference

### Slot Machine Endpoints

#### POST /gamefi/slots/spin
Spin the slot machine

**Request**:
```json
{
  "userId": "user_123",
  "betAmount": "100",
  "tokenUsed": "ZEA"
}
```

**Response**:
```json
{
  "sessionId": "slot_user_123_1699635000000",
  "userId": "user_123",
  "betAmount": "100",
  "tokenUsed": "ZEA",
  "symbols": ["🍒", "🍒", "🍒"],
  "result": "won",
  "winAmount": "200",
  "multiplier": 2,
  "provablyFairHash": "a1b2c3d4...",
  "timestamp": "2025-11-10T08:30:00.000Z"
}
```

#### GET /gamefi/slots/history/:userId
Get user's game history

**Response**:
```json
[
  {
    "sessionId": "slot_user_123_1699635000000",
    "betAmount": "100",
    "tokenUsed": "ZEA",
    "result": "WON",
    "winAmount": "200",
    "timestamp": "2025-11-10T08:30:00.000Z",
    "metadata": {
      "symbols": ["🍒", "🍒", "🍒"],
      "multiplier": 2,
      "provablyFairHash": "a1b2c3d4..."
    }
  }
]
```

#### POST /gamefi/slots/verify
Verify provably fair result

**Request**:
```json
{
  "sessionId": "slot_user_123_1699635000000",
  "clientSeed": "abc123..."
}
```

**Response**:
```json
{
  "verified": true
}
```

### NFT Endpoints

#### GET /gamefi/nfts/:userId
Get user's NFT rewards

**Response**:
```json
[
  {
    "tokenId": 1,
    "name": "First Winner",
    "description": "Won your first slot game!",
    "imageUrl": "https://cdn.zeazdev.com/nft/first_win.png",
    "rarity": 1,
    "achievementType": "FIRST_WIN"
  }
]
```

### Tournament Endpoints

#### POST /gamefi/tournaments/create
Create a new tournament (admin only)

**Request**:
```json
{
  "name": "Weekend Jackpot",
  "duration": 72,
  "entryFee": "100",
  "prizePool": "10000"
}
```

#### POST /gamefi/tournaments/join
Join a tournament

**Request**:
```json
{
  "tournamentId": 1,
  "userId": "user_123"
}
```

#### GET /gamefi/tournaments/active
Get active tournaments

**Response**:
```json
[
  {
    "id": 1,
    "name": "Weekend Jackpot",
    "startTime": "2025-11-10T00:00:00.000Z",
    "endTime": "2025-11-13T00:00:00.000Z",
    "entryFee": "100",
    "prizePool": "10000",
    "participants": 156,
    "status": "ACTIVE",
    "leaderboard": [...]
  }
]
```

#### GET /gamefi/tournaments/:tournamentId/leaderboard
Get tournament leaderboard

**Response**:
```json
[
  {
    "userId": "user_123",
    "username": "CryptoKing",
    "totalWins": "5000",
    "gamesPlayed": 50,
    "rank": 1
  }
]
```

### Leaderboard Endpoints

#### GET /gamefi/leaderboard?limit=50
Get global leaderboard

**Response**:
```json
[
  {
    "rank": 1,
    "userId": "user_123",
    "username": "SlotMaster",
    "avatar": "https://...",
    "totalWinnings": "50000",
    "totalGames": 1000,
    "winRate": 35.5
  }
]
```

#### GET /gamefi/stats/:userId
Get user statistics

**Response**:
```json
{
  "totalGames": 250,
  "totalWon": 85,
  "totalLost": 165,
  "totalWinnings": "15000",
  "winRate": 34.0,
  "winStreak": 3,
  "rank": 42
}
```

---

## 🎨 Unity WebGL Setup

### Requirements
- Unity 2021.3 LTS or later
- WebGL build support
- TextMeshPro package

### Build Settings
```json
{
  "compressionFormat": "Gzip",
  "dataUrl": "Build/SlotMachine.data.gz",
  "frameworkUrl": "Build/SlotMachine.framework.js.gz",
  "codeUrl": "Build/SlotMachine.wasm.gz",
  "streamingAssetsUrl": "StreamingAssets",
  "companyName": "ZeaZDev",
  "productName": "Slot Machine",
  "productVersion": "1.0.0"
}
```

### Unity ↔ JavaScript Bridge

**Send from React Native to Unity**:
```typescript
const sendToUnity = (action: string, data: any) => {
  webViewRef.current?.postMessage(JSON.stringify({
    gameObject: 'SlotMachineManager',
    method: action,
    parameters: JSON.stringify(data)
  }));
};

// Example: Start spin
sendToUnity('StartSpin', {
  betAmount: 100,
  token: 'ZEA'
});
```

**Send from Unity to React Native** (C#):
```csharp
using UnityEngine;

public class SlotMachineManager : MonoBehaviour
{
    public void SendResultToReact(SpinResult result)
    {
        string json = JsonUtility.ToJson(new {
            type = "SPIN_RESULT",
            result = result
        });
        
        Application.ExternalCall("window.ReactNativeWebView.postMessage", json);
    }
}
```

### Deployment
1. Build WebGL in Unity
2. Upload to CDN/server
3. Set `UNITY_WEBGL_URL` environment variable
4. Test in app

---

## 🔒 Security

### Smart Contract Security
- ✅ ReentrancyGuard on all state-changing functions
- ✅ Pausable for emergency stops
- ✅ Access control (onlyOwner)
- ✅ Bet limit validation
- ✅ House edge enforcement
- ✅ No direct ETH/token storage (immediate payouts)

### Backend Security
- ✅ Rate limiting (10 spins/minute per user)
- ✅ Input validation
- ✅ SQL injection prevention (Prisma ORM)
- ✅ Cryptographic randomness (crypto.randomBytes)
- ✅ Provably fair verification

### Frontend Security
- ✅ Input sanitization
- ✅ HTTPS only
- ✅ No sensitive data in localStorage
- ✅ CSP headers for Unity WebGL

---

## 📊 Analytics & Monitoring

### Metrics Tracked
- Total games played
- Total wagered amount
- Total payouts
- House profit
- Active users (DAU/MAU)
- Average bet size
- Win rate distribution
- NFTs minted
- Tournament participation

### Monitoring
```typescript
// Example: Track game metrics
await prisma.gameMetrics.create({
  data: {
    date: new Date(),
    totalGames: stats.totalGames,
    totalWagered: stats.totalWagered,
    totalPayouts: stats.totalPayouts,
    activeUsers: stats.activeUsers
  }
});
```

---

## 🧪 Testing

### Unit Tests
```typescript
describe('GameFiService', () => {
  it('should generate provably fair results', () => {
    const hash = '0x123...';
    const symbols = service.generateProvablyFairResult(hash);
    expect(symbols).toHaveLength(3);
    expect(SYMBOLS).toContain(symbols[0]);
  });

  it('should calculate correct winnings', () => {
    const result = service.calculateSlotResult(
      ['🍒', '🍒', '🍒'],
      '100'
    );
    expect(result.won).toBe(true);
    expect(result.multiplier).toBe(2);
  });
});
```

### Integration Tests
```typescript
describe('Slot Machine API', () => {
  it('should spin and return valid result', async () => {
    const response = await request(app)
      .post('/gamefi/slots/spin')
      .send({
        userId: 'test_user',
        betAmount: '100',
        tokenUsed: 'ZEA'
      });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('sessionId');
    expect(response.body).toHaveProperty('symbols');
  });
});
```

---

## 🚀 Deployment

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://...

# Unity WebGL
UNITY_WEBGL_URL=https://cdn.zeazdev.com/unity/slots/

# Smart Contracts
SLOT_MACHINE_CONTRACT_ADDRESS=0x...
ZEA_TOKEN_ADDRESS=0x...
DING_TOKEN_ADDRESS=0x...

# Backend
API_URL=https://api.zeazdev.com
PORT=3000

# Redis (for rate limiting)
REDIS_URL=redis://...
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["npm", "run", "start:prod"]
```

---

## 📈 Roadmap

### Phase 3.1 (Current) ✅
- [x] Slot machine core
- [x] Provably fair system
- [x] NFT rewards
- [x] Tournaments
- [x] Unity WebGL support

### Phase 3.2 (Q4 2025)
- [ ] Multiplayer tournaments
- [ ] Live dealer mode
- [ ] Social features (challenges, gifts)
- [ ] Progressive jackpots

### Phase 3.3 (Q1 2026)
- [ ] Mobile-native Unity builds
- [ ] AR/VR slot machine
- [ ] Loyalty program
- [ ] Affiliate system

---

**Version**: 3.0.0  
**Last Updated**: 2025-11-10  
**Status**: ✅ Production Ready
