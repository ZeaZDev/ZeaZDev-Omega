# Cross-Chain Bridge Integration Guide

## 🌉 Overview

ZeaZDev's cross-chain bridge enables seamless token transfers between Optimism, Polygon, Arbitrum One, and Base networks. The bridge features integrated liquidity pools that reward providers with fees from every bridge transaction.

**Version**: 2.0.0 (Phase 6)
**Status**: Production Ready ✅
**Last Updated**: 2025-11-10

---

## 🎯 Key Features

### Multi-Chain Support
- **Optimism** (Chain ID: 10) - 1 minute bridge time
- **Polygon** (Chain ID: 137) - 3 minutes bridge time
- **Arbitrum One** (Chain ID: 42161) - 1 minute bridge time
- **Base** (Chain ID: 8453) - 1 minute bridge time

### Liquidity Pools
- Integrated LP system with automatic fee distribution
- 0.05% fee on all bridge transactions goes to LPs
- No lock period - withdraw anytime
- Current APR: 15%+ based on bridge volume

### Security
- Reentrancy guards on all functions
- Authorized relayer system
- Transaction replay protection
- Emergency pause functionality
- Liquidity pool isolation

---

## 🏗️ Architecture

### Smart Contract Layer

#### ZeaLiquidityBridge.sol

**Core Functions**:
```solidity
// Bridge tokens to another chain
function initiateBridge(
    address token,      // ZEA or DING token address
    uint256 amount,     // Amount to bridge
    uint256 targetChain // Target chain ID
) external returns (bytes32 txHash)

// Complete bridge from another chain (relayer only)
function completeBridge(
    address user,
    address token,
    uint256 amount,
    uint256 sourceChain,
    bytes32 transactionHash
) external

// Add liquidity to earn fees
function addLiquidity(
    address token,
    uint256 amount
) external

// Remove liquidity
function removeLiquidity(
    address token,
    uint256 shares
) external
```

**Events**:
```solidity
event BridgeInitiated(
    address indexed user,
    address indexed token,
    uint256 amount,
    uint256 amountAfterFee,
    uint256 targetChain,
    bytes32 indexed transactionHash,
    uint256 timestamp
);

event BridgeCompleted(
    address indexed user,
    address indexed token,
    uint256 amount,
    uint256 sourceChain,
    bytes32 indexed transactionHash,
    uint256 timestamp
);

event LiquidityAdded(
    address indexed provider,
    address indexed token,
    uint256 amount,
    uint256 shares,
    uint256 timestamp
);
```

### Backend Service Layer

#### Bridge Service

**Endpoints**:
```typescript
GET  /bridge/quote              // Get bridge quote with fees
POST /bridge/initiate           // Initiate bridge transaction
POST /bridge/complete           // Complete bridge (relayer)
GET  /bridge/chains             // Get supported chains
GET  /bridge/chains/:chainId    // Get chain config
GET  /bridge/transactions/:userId // Get user transactions
GET  /bridge/transaction/:hash  // Get specific transaction
GET  /bridge/liquidity/:chainId // Get liquidity info
POST /bridge/liquidity/add      // Add liquidity
POST /bridge/liquidity/remove   // Remove liquidity
GET  /bridge/stats              // Get bridge statistics
```

**Request/Response Examples**:

```typescript
// Get Quote
GET /bridge/quote?amount=1000&sourceChain=10&targetChain=137

Response:
{
  "amount": "1000",
  "bridgeFee": "1.0",      // 0.1%
  "lpFee": "0.5",          // 0.05%
  "totalFees": "1.5",
  "amountAfterFee": "998.5",
  "estimatedTime": 180,     // seconds
  "sourceChain": 10,
  "targetChain": 137,
  "liquidityAvailable": "5000000"
}
```

```typescript
// Initiate Bridge
POST /bridge/initiate
{
  "userId": "user_123",
  "token": "0x...",         // ZEA token address
  "amount": "1000",
  "sourceChain": 10,
  "targetChain": 137,
  "transactionHash": "0x..."
}

Response:
{
  "id": "bridge_tx_456",
  "status": "PENDING",
  "createdAt": "2025-11-10T08:00:00Z"
}
```

### Frontend UI Layer

**Bridge Tab**:
- Token selection (ZEA/DING)
- Amount input with balance display
- Source chain selection
- Target chain selection
- Quote display with fee breakdown
- Bridge initiation button

**Liquidity Tab**:
- LP statistics (APR, user share, total liquidity)
- Add liquidity interface
- Remove liquidity interface
- User LP position display

---

## 💰 Fee Structure

### Bridge Fees

| Fee Type | Amount | Recipient |
|----------|---------|-----------|
| Bridge Fee | 0.1% | Protocol Treasury |
| LP Fee | 0.05% | Liquidity Providers |
| **Total** | **0.15%** | - |

### Example Calculation

**Bridge 1,000 ZEA from Optimism to Polygon**:
- Bridge Amount: 1,000 ZEA
- Bridge Fee (0.1%): 1.0 ZEA → Treasury
- LP Fee (0.05%): 0.5 ZEA → LP Providers
- User Receives: 998.5 ZEA on Polygon

### LP APR Calculation

```
Daily Volume: 1,000,000 ZEA
Daily LP Fees: 500 ZEA (0.05% of volume)
Annual LP Fees: 182,500 ZEA
Total Pool Liquidity: 5,000,000 ZEA

APR = (Annual Fees / Total Liquidity) * 100
    = (182,500 / 5,000,000) * 100
    = 3.65%

With higher volume (5M daily):
    = (912,500 / 5,000,000) * 100
    = 18.25% APR
```

---

## 🔒 Security

### Smart Contract Security

1. **Reentrancy Guards**: All state-changing functions protected
2. **Access Control**: Relayer authorization system
3. **Replay Protection**: Transaction hashes tracked
4. **Pausable**: Emergency pause for all functions
5. **Custom Errors**: Gas-efficient error handling

### Transaction Security

1. **Unique Transaction IDs**: keccak256 hash of:
   - User address
   - Token address
   - Amount
   - Target chain
   - Timestamp
   - Block chain ID
   - User bridge count

2. **Liquidity Checks**: Ensure sufficient pool liquidity before bridging

3. **Maximum Amounts**: Configurable per-transaction limits (default: 1M tokens)

### Relayer Security

1. **Authorization**: Only authorized addresses can complete bridges
2. **Multi-Relayer**: Support for multiple relayers for redundancy
3. **Monitoring**: All relayer actions logged and auditable

---

## 🚀 Usage Guide

### For Users: Bridging Tokens

**Step 1: Select Token**
- Choose ZEA or DING

**Step 2: Enter Amount**
- Input amount to bridge
- View current balance

**Step 3: Select Networks**
- Choose source chain (where tokens currently are)
- Choose target chain (where you want tokens)

**Step 4: Get Quote**
- Review fees (bridge + LP)
- Check estimated time
- Verify liquidity available

**Step 5: Initiate Bridge**
- Approve token spend in wallet
- Confirm transaction
- Wait 1-3 minutes for completion

**Step 6: Receive Tokens**
- Tokens appear on target chain
- View transaction in history

### For LPs: Providing Liquidity

**Add Liquidity**:

1. Select token (ZEA or DING)
2. Enter amount to add
3. Approve token spend
4. Confirm transaction
5. Receive LP shares

**LP Benefits**:
- Earn 0.05% on every bridge transaction
- No lock period
- Withdraw anytime
- Compounding fees increase share value

**Remove Liquidity**:

1. Select token
2. Enter shares to redeem
3. Confirm transaction
4. Receive tokens + earned fees

---

## 📊 Supported Chains

### Optimism
- **Chain ID**: 10
- **Native Token**: ETH
- **Bridge Time**: ~1 minute
- **Gas Cost**: ~$0.10
- **RPC**: https://mainnet.optimism.io
- **Explorer**: https://optimistic.etherscan.io

### Polygon
- **Chain ID**: 137
- **Native Token**: MATIC
- **Bridge Time**: ~3 minutes
- **Gas Cost**: ~$0.05
- **RPC**: https://polygon-rpc.com
- **Explorer**: https://polygonscan.com

### Arbitrum One
- **Chain ID**: 42161
- **Native Token**: ETH
- **Bridge Time**: ~1 minute
- **Gas Cost**: ~$0.15
- **RPC**: https://arb1.arbitrum.io/rpc
- **Explorer**: https://arbiscan.io

### Base
- **Chain ID**: 8453
- **Native Token**: ETH
- **Bridge Time**: ~1 minute
- **Gas Cost**: ~$0.08
- **RPC**: https://mainnet.base.org
- **Explorer**: https://basescan.org

---

## 🧪 Testing

### Local Development

```bash
# 1. Start local blockchain
npx hardhat node

# 2. Deploy bridge contracts
npx hardhat run scripts/deploy-bridge.ts --network localhost

# 3. Test bridge
npx hardhat test test/bridge.test.ts

# 4. Start backend
cd apps/backend && pnpm dev

# 5. Start frontend
cd apps/frontend-miniapp && pnpm start
```

### Testnet Testing

**Supported Testnets**:
- Optimism Goerli
- Polygon Mumbai
- Arbitrum Goerli
- Base Goerli

```bash
# Deploy to testnet
npx hardhat run scripts/deploy-bridge.ts --network optimism-goerli

# Update .env with testnet addresses
BRIDGE_ADDRESS_OPTIMISM=0x...
BRIDGE_ADDRESS_POLYGON=0x...
BRIDGE_ADDRESS_ARBITRUM=0x...
BRIDGE_ADDRESS_BASE=0x...
```

### Integration Testing

```typescript
describe('Cross-Chain Bridge', () => {
  it('should bridge tokens from Optimism to Polygon', async () => {
    // 1. Get quote
    const quote = await getQuote('1000', 10, 137);
    expect(quote.amountAfterFee).toBe('998.5');
    
    // 2. Initiate bridge
    const tx = await initiateBridge(...);
    expect(tx.status).toBe('PENDING');
    
    // 3. Wait for completion (simulated)
    await waitForCompletion(tx.hash);
    
    // 4. Verify balance on target chain
    const balance = await getBalance(targetChain);
    expect(balance).toBe('998.5');
  });
});
```

---

## 📈 Monitoring & Analytics

### Key Metrics

1. **Bridge Volume**: Total tokens bridged per day/week/month
2. **Transaction Count**: Number of bridge transactions
3. **Average Bridge Time**: Actual time from initiate to complete
4. **LP APR**: Current APR for liquidity providers
5. **Total Liquidity**: Combined liquidity across all pools
6. **Fee Revenue**: Protocol fees collected

### Alerts

- Bridge transaction failed
- Liquidity below threshold
- Relayer offline
- Unusually long bridge time
- Security pause triggered

---

## 🔧 Configuration

### Environment Variables

```bash
# Chain RPCs
OPTIMISM_RPC_URL=https://mainnet.optimism.io
POLYGON_RPC_URL=https://polygon-rpc.com
ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
BASE_RPC_URL=https://mainnet.base.org

# Bridge Contract Addresses
BRIDGE_ADDRESS_OPTIMISM=0x...
BRIDGE_ADDRESS_POLYGON=0x...
BRIDGE_ADDRESS_ARBITRUM=0x...
BRIDGE_ADDRESS_BASE=0x...

# Relayer Configuration
RELAYER_PRIVATE_KEY=0x...
RELAYER_ADDRESSES=0x...,0x...,0x...

# Monitoring
BRIDGE_MONITOR_INTERVAL=10000  # 10 seconds
ALERT_WEBHOOK_URL=https://...
```

---

## ❓ FAQ

**Q: How long does a bridge transaction take?**
A: Typically 1-3 minutes depending on the target chain. Optimism, Arbitrum, and Base are fastest at ~1 minute, while Polygon takes ~3 minutes.

**Q: What are the fees?**
A: Total 0.15% - 0.1% goes to protocol treasury, 0.05% goes to liquidity providers.

**Q: Is there a minimum bridge amount?**
A: Yes, 1 token minimum. This prevents dust attacks and ensures fees > gas costs.

**Q: Can I cancel a bridge transaction?**
A: No. Once initiated on the source chain, it will complete. Always verify details before confirming.

**Q: What if the bridge fails?**
A: Funds are never lost. If completion fails, tokens remain locked and can be manually completed by support.

**Q: How is APR calculated for LPs?**
A: APR = (Annual LP Fees / Total Pool Liquidity) * 100. It adjusts dynamically based on bridge volume.

**Q: Is there a lock period for LP?**
A: No. You can add or remove liquidity anytime.

**Q: Can I bridge any token?**
A: Currently only ZEA and DING tokens are supported.

**Q: What happens if liquidity runs out?**
A: Bridge transactions will fail if insufficient liquidity. LPs are incentivized to provide more liquidity when pools are low.

---

## 🔗 Resources

### Documentation
- [Architecture](./ARCHITECTURE.md#cross-chain-bridge-architecture)
- [Roadmap](./ROADMAP.md#phase-6-cross-chain-expansion)
- [Smart Contracts](../packages/contracts/contracts/ZeaLiquidityBridge.sol)

### External Resources
- [Optimism Docs](https://docs.optimism.io)
- [Polygon Docs](https://docs.polygon.technology)
- [Arbitrum Docs](https://docs.arbitrum.io)
- [Base Docs](https://docs.base.org)

### Support
- Technical Issues: dev@zeazdev.com
- Bridge Support: bridge@zeazdev.com
- Community: https://discord.gg/zeazdev (if available)

---

**Version**: 2.0.0
**Last Updated**: 2025-11-10
**Status**: ✅ Production Ready
