# MezoLens Architecture

## Overview

MezoLens is an auto-compound yield vault for Mezo Earn. It consists of 4 smart contracts and a React frontend.

## Smart Contracts

```
EarnVault.sol (main)
  ├── FeeCollector.sol (fee management)
  ├── GaugeVoter.sol (auto gauge voting)
  └── MusdPipe.sol (BTC→MUSD→LP pipeline)
```

### EarnVault.sol
Main vault contract. Accepts BTC/MEZO deposits, manages positions, executes auto-compound.
- 3 strategies: Conservative (1x), Balanced (2x), Aggressive (5x)
- Permissionless compound (anyone can trigger, keeper gets 0.1% incentive)
- Batch compound for gas efficiency
- MUSD yield routing (optional, balanced/aggressive only)

### FeeCollector.sol
Collects and tracks all protocol fees transparently.
- Performance fee: 0.3% per compound (from yield only)
- Management fee: 0.1% annual pro-rata (at withdrawal)
- MUSD spread: 10% of net MUSD yield
- All fees capped with on-chain maximums

### GaugeVoter.sol
Auto-votes on optimal gauge for aggressive strategy positions.
- Mock gauge data for testnet (3 default gauges)
- Falls back gracefully when Mezo gauge precompiles unavailable
- Re-votes when best gauge changes

### MusdPipe.sol
BTC → MUSD → LP yield pipeline.
- Opens CDPs via Mezo Borrow (Liquity-fork)
- Deploys MUSD to LP pools
- Harvests LP rewards
- Health monitoring (collateral ratio, liquidation price)

## 12 Mezo Integrations

1. veBTC - Lock BTC for fee earning
2. veMEZO - Lock MEZO for boost (2x-5x)
3. Gauge voting - Auto-vote on best gauge
4. Epoch rewards - Auto-claim per epoch
5. Mezo Borrow - MUSD strategy via BorrowerOperations
6. MUSD token - Mint/burn for yield strategy
7. Mezo Swap - BTC↔MUSD routing
8. LP pools - MUSD liquidity provision
9. Mezo Passport - Wallet connection SDK
10. Pyth Oracle - BTC/USD price feed
11. Mezo Testnet - Chain ID 31611
12. Mezo Explorer - Contract verification

## Frontend

React 18 + Vite + TypeScript + Tailwind CSS 4 + Framer Motion + Recharts + Zustand.

### Pages
- **Landing** - Hero, value prop, strategy comparison, FAQ
- **Dashboard** - Stats, compound advantage, epoch countdown
- **Deposit** - 4-step flow with MUSD yield toggle
- **Calculator** - Manual vs auto-compound comparison
- **Transparency** - Fee breakdown, compound history, MUSD health
- **My Positions** - Active/completed positions with compound info
- **Vault Stats** - Protocol metrics, keeper leaderboard

## Network

- **Mezo Testnet**: Chain ID 31611, RPC `https://rpc.test.mezo.org`
- **Native currency**: BTC (18 decimals)
- **EVM version**: london
