# ZeaZDev Tokenomics

## 💎 Dual Token System

ZeaZDev implements a sophisticated dual-token economic model:

1. **$ZEA** - Primary utility and governance token
2. **$DING** - In-game reward and entertainment token

---

## 🪙 ZEA Token ($ZEA)

### Token Specification

| Property | Value |
|----------|-------|
| **Name** | ZeaToken |
| **Symbol** | ZEA |
| **Type** | ERC-20 |
| **Decimals** | 18 |
| **Initial Supply** | 1,000,000,000 (1 Billion) |
| **Max Supply** | 10,000,000,000 (10 Billion) |
| **Network** | Optimism (L2) |
| **Standard** | OpenZeppelin ERC20, Burnable, Permit |

### Utility

**Primary Functions**:
1. **Governance**: Vote on protocol upgrades and proposals
2. **Staking**: Lock ZEA to earn rewards (10% APY)
3. **Trading**: Swap on Uniswap and other DEXs
4. **Payment**: Pay for game entry fees
5. **Collateral**: Secure loans (future)
6. **Rewards**: Receive from daily check-ins, airdrops, referrals

**Smart Contract Features**:
- Mintable (controlled by owner/minters)
- Burnable (deflationary mechanism)
- Permit (gasless approvals via EIP-2612)
- Access control (minter role management)

### Token Allocation

```
Total Supply: 1,000,000,000 ZEA (Initial)

├── Team & Advisors (20%)      200,000,000 ZEA
│   └── 4-year vesting, 1-year cliff
├── Community Rewards (30%)    300,000,000 ZEA
│   ├── Daily Check-ins
│   ├── Airdrops
│   └── Referral Program
├── Staking Rewards (25%)      250,000,000 ZEA
│   └── Distributed over 10 years
├── Liquidity Pools (15%)      150,000,000 ZEA
│   ├── Uniswap V3 ZEA/ETH
│   └── Uniswap V3 ZEA/USDC
├── Treasury (5%)               50,000,000 ZEA
│   └── DAO-controlled reserves
└── Public Sale (5%)            50,000,000 ZEA
    └── Fair launch IDO
```

### Vesting Schedule

**Team & Advisors**:
- Total: 200M ZEA
- Cliff: 12 months
- Vesting: Linear over 48 months
- Monthly unlock: ~4.17M ZEA (after cliff)

**Community Rewards**:
- Total: 300M ZEA
- Distribution: 5 years
- Monthly allocation: 5M ZEA
- Mechanisms: Check-in, Airdrop, Referral (all ZKP-gated)

**Staking Rewards**:
- Total: 250M ZEA
- Distribution: 10 years
- Annual: 25M ZEA
- APY: 10% (initial, adjustable)

### Deflationary Mechanics

**Burn Mechanisms**:
1. **Transaction Fee Burn**: 0.1% of all swaps
2. **Game Entry Burn**: 5% of game bets
3. **Card Issuance Burn**: 100 ZEA per card
4. **Governance Proposal Burn**: 1,000 ZEA per proposal

**Target Burn Rate**: 2-5% annually

---

## 🎮 DING Token ($DING)

### Token Specification

| Property | Value |
|----------|-------|
| **Name** | DingToken |
| **Symbol** | DING |
| **Type** | ERC-20 |
| **Decimals** | 18 |
| **Initial Supply** | 0 (Minted as rewards) |
| **Max Supply** | 100,000,000,000 (100 Billion) |
| **Network** | Optimism (L2) |
| **Standard** | OpenZeppelin ERC20, Burnable, Pausable |

### Utility

**Primary Functions**:
1. **Game Currency**: Play slots and other games
2. **Reward Token**: Earn from game wins
3. **Bonus Multiplier**: Stack with ZEA rewards
4. **In-Game Purchases**: Buy power-ups, skins
5. **Convertible**: Swap DING → ZEA (future)

**Smart Contract Features**:
- Mintable (only by game contracts)
- Burnable (for in-game purchases)
- Pausable (emergency control)
- Game contract whitelist

### Emission Schedule

**Reward Distribution**:
- Daily Check-in Bonus: 10,000 DING
- Airdrop Bonus: 20,000 DING (one-time)
- Game Wins: Variable (2x-6x bet amount)
- Tournament Prizes: Up to 1,000,000 DING

**Emission Rate**:
- Year 1: 20B DING (~55M per day)
- Year 2: 15B DING (~41M per day)
- Year 3: 10B DING (~27M per day)
- Year 4-5: 5B DING per year

**Max Cap**: Emission stops at 100B DING

### Burn Mechanisms

**DING Sinks**:
1. **In-Game Purchases**: 100% burned
2. **NFT Minting**: 50,000 DING per NFT
3. **Tournament Entry**: 10,000 DING (50% burned)
4. **Booster Packs**: Variable (all burned)

**Target Burn**: Match or exceed emission

---

## 🔄 Token Flow

### ZEA Flow
```
User Wallet → Staking Contract → Earn Rewards
User Wallet → Uniswap → Swap to ETH/USDC
User Wallet → Game Contract → Pay Entry (5% burned)
User Wallet → Rewards Contract → Claim via ZKP
```

### DING Flow
```
Game Win → Mint DING → User Wallet
User Wallet → Game Contract → Play Slots
User Wallet → In-Game Store → Buy Items (burned)
User Wallet → Swap → Convert to ZEA (future)
```

---

## 📈 Value Accrual

### ZEA Value Drivers
1. **Staking Demand**: 10% APY attracts holders
2. **Governance Rights**: DAO participation
3. **Deflationary Pressure**: Continuous burns
4. **Utility Growth**: More use cases = more demand
5. **Liquidity Incentives**: LP rewards

### DING Value Drivers
1. **Game Demand**: More players = more DING needed
2. **Win Payouts**: Players want DING to play more
3. **Burn Rate**: Aggressive sinks maintain scarcity
4. **Entertainment Value**: Fun > speculation

---

## 🛡️ Economic Security

### Anti-Manipulation Measures
- **ZKP-Gated Rewards**: Prevents Sybil attacks
- **Vesting Schedules**: Prevents team dumps
- **Max Supply Caps**: No infinite inflation
- **Emergency Pause**: Can halt malicious activity
- **Timelock Governance**: 48-hour delay on changes

### Liquidity Safeguards
- **Initial Liquidity**: 150M ZEA + 500 ETH
- **Locked Liquidity**: 80% locked for 2 years
- **Slippage Protection**: Max 5% price impact
- **MEV Protection**: Flashbots integration

---

## 📊 Price Discovery

### Launch Strategy
1. **Fair Launch**: No presale or private rounds
2. **IDO**: Public sale on World App
3. **Uniswap Listing**: Immediate DEX availability
4. **Initial Price**: $0.01 per ZEA
5. **FDV**: $10M at launch

### Long-Term Targets
- **6 Months**: $50M FDV ($0.05/ZEA)
- **1 Year**: $200M FDV ($0.20/ZEA)
- **2 Years**: $1B FDV ($1.00/ZEA)
- **5 Years**: $10B FDV ($10.00/ZEA)

*Note: Targets are aspirational, not guaranteed*

---

**Last Updated**: 2025-11-08
**Version**: 1.0.0
