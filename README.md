# MezoLens — Self-Service Bitcoin Banking on Mezo

> **Deposit BTC. Borrow MUSD at 1% fixed. Earn LP yield. Auto-compound everything — every epoch, on-chain, no intermediaries.**

[![Mezo Testnet](https://img.shields.io/badge/Network-Mezo%20Testnet-orange)](https://explorer.test.mezo.org)
[![Chain ID](https://img.shields.io/badge/Chain%20ID-31611-blue)](https://explorer.test.mezo.org)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.25-gray)](https://soliditylang.org)
[![Tests](https://img.shields.io/badge/Tests-152%20passing-brightgreen)](#testing)
[![Track](https://img.shields.io/badge/Track-MEZO%20Utilization-purple)](#)

---

## The Problem

Bitcoin is the world's largest store of value — yet most BTC sits completely idle. Mezo unlocks Bitcoin DeFi, but using it optimally requires constant manual action: claim rewards, re-lock veBTC, adjust gauge votes, manage MUSD CDPs. Miss a week? You left yield on the table.

## The Solution

**MezoLens** is self-service Bitcoin banking infrastructure built on Mezo. The core flow:

1. **Deposit BTC** → locked as veBTC collateral on Mezo
2. **Borrow MUSD at 1% fixed** → MezoLens opens a CDP via Mezo Borrow
3. **MUSD earns LP yield** → deployed to Mezo Swap liquidity pools
4. **Auto-compound everything** → rewards + LP yield re-locked every epoch automatically

**Mezo Passport** is integrated for on-chain identity verification, required for full banking access.

One deposit. Three strategies. Perpetual compounding. No intermediaries.

---

## Strategies

| Strategy | Boost | MUSD at 1% | Auto-vote | Best For |
|---|---|---|---|---|
| **Conservative** | 1× | ✅ Core feature | ❌ | Passive holders, low risk |
| **Balanced** | 2× | ✅ Core feature | ❌ | Regular DeFi users |
| **Aggressive** | 5× | ✅ Core feature | ✅ | Yield maximizers |

All strategies borrow MUSD at **1% fixed rate** and deploy it to Mezo Swap LP pools. Net yield from LP fees exceeds the 1% borrow cost — making MUSD a positive-carry instrument in all strategies.

Over 12 months at 9% base APR with weekly compounding, the Aggressive strategy earns **~18.4% more yield** than manual claiming.

---

## Architecture

```
User Deposit (BTC + optional MEZO)
         │
         ▼
    ┌─────────────────────────────────────────┐
    │              EarnVault.sol              │
    │                                         │
    │  ┌─────────┐  ┌─────────┐  ┌────────┐  │
    │  │veBTC    │  │veMEZO   │  │Gauge   │  │
    │  │Precomp. │  │Precomp. │  │Voter   │  │
    │  └─────────┘  └─────────┘  └────────┘  │
    │                                         │
    │  ┌────────────────────────────────────┐ │
    │  │         MusdPipe.sol               │ │
    │  │  CDP Open → MUSD mint → LP deploy  │ │
    │  └────────────────────────────────────┘ │
    │                                         │
    │  ┌────────────────────────────────────┐ │
    │  │        FeeCollector.sol            │ │
    │  │  2-day timelock on withdrawals     │ │
    │  └────────────────────────────────────┘ │
    └─────────────────────────────────────────┘
             │              │
    Keepers (anyone)    User (withdraw)
    trigger compound    after lock expires
```

### Compound Flow

1. Keeper (anyone) calls `compound(positionId)` after the 1-hour cooldown
2. EarnVault reads pending Mezo Earn rewards via veBTC precompile
3. Rewards split: performance fee collected, keeper incentive paid to caller, remainder re-locked as veBTC
4. If MUSD yield is enabled: allocated % opens or tops up a CDP, mints MUSD, deploys to LP
5. `position.btcCompounded` and boost multiplier are updated on-chain

---

## Mezo Protocol Integrations (12)

| # | Integration | Where Used | Purpose |
|---|---|---|---|
| 1 | **veBTC Precompile** | EarnVault | Lock BTC, receive voting escrow weight |
| 2 | **veMEZO Precompile** | EarnVault | Lock MEZO for 2×/5× boost multiplier |
| 3 | **Gauge Voting** | GaugeVoter.sol | Auto-vote highest-APR gauge each epoch |
| 4 | **Mezo Borrow (IMezoBorrow)** | EarnVault | Open CDPs against BTC collateral |
| 5 | **Mezo Swap (IMezoSwap)** | MusdPipe.sol | Deploy MUSD into liquidity pools |
| 6 | **MUSD Token** | MusdPipe.sol | Mint/repay stablecoin in CDP lifecycle |
| 7 | **Epoch System** | EarnVault | 7-day epochs for compound tracking and snapshots |
| 8 | **Gauge APR Oracle** | GaugeVoter.sol | Read live gauge APRs to select best allocation |
| 9 | **CDP Health Monitoring** | EarnVault | Track collateral ratio and liquidation price |
| 10 | **Mezo Explorer** | Frontend | Link every transaction to the block explorer |
| 11 | **Pyth Price Oracle** | useBtcPrice.ts | Live BTC/USD price feed for USD value display |
| 12 | **Keeper Incentive System** | EarnVault | Permissionless compound execution with on-chain rewards |

---

## Fee Structure

| Fee | Rate | Description |
|---|---|---|
| Performance Fee | **0.3%** | Deducted from each compound yield event |
| Management Fee | **0.1% / year** | Pro-rated over BTC lock duration |
| Keeper Incentive | **0.1%** | Paid to whoever triggers the compound transaction |
| MUSD Spread | **10%** | Applied to net yield from CDP/LP operations |

**Hardcoded caps:** Performance ≤ 5%, Management ≤ 1%, combined ≤ 2%, MUSD spread ≤ 20%.

Fee collection is protected by a **2-day timelock** — no immediate withdrawal from the FeeCollector contract.

---

## Deployed Contracts — Mezo Testnet (Chain ID: 31611)

| Contract | Address |
|---|---|
| EarnVault | [`0x961E1fc557c6A5Cf70070215190f9B57F719701D`](https://explorer.test.mezo.org/address/0x961E1fc557c6A5Cf70070215190f9B57F719701D) |
| FeeCollector | [`0xeE9525392d1102234C4D1d2B7E0c29d87064000F`](https://explorer.test.mezo.org/address/0xeE9525392d1102234C4D1d2B7E0c29d87064000F) |
| GaugeVoter | [`0x2Bf940Bc06A5161bfe18F64F1c7edb81d45ad81c`](https://explorer.test.mezo.org/address/0x2Bf940Bc06A5161bfe18F64F1c7edb81d45ad81c) |
| MusdPipe | [`0x82251096716EcE27260F2D4f67b2131B95D9bA33`](https://explorer.test.mezo.org/address/0x82251096716EcE27260F2D4f67b2131B95D9bA33) |

---

## Smart Contract Overview

| Contract | Purpose |
|---|---|
| `EarnVault.sol` | Core vault: deposits, withdrawals, auto-compound, strategy management, MUSD routing |
| `FeeCollector.sol` | Transparent fee accumulation with 2-day timelock on withdrawals |
| `GaugeVoter.sol` | Automatic gauge analysis and vote allocation for maximum APR |
| `MusdPipe.sol` | BTC → CDP → MUSD → LP yield pipeline with collateral health monitoring |

### Key User Functions

```solidity
// Open a new position
deposit(Strategy strategy, uint256 mezoAmount) payable

// Close position after lock expires
withdraw(uint256 positionId)

// Change strategy on an existing position
changeStrategy(uint256 positionId, Strategy newStrategy)

// Route X% of future compounds to MUSD LP yield (0-50%)
enableMusdYield(uint256 positionId, uint256 percentage)
disableMusdYield(uint256 positionId)

// Anyone can trigger a compound and earn the keeper incentive
compound(uint256 positionId)
compoundBatch(uint256[] calldata positionIds)
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite + TypeScript 5.8 |
| Styling | Tailwind CSS v4 + Framer Motion |
| Web3 | Wagmi v3 + Viem v2 |
| State | Zustand + TanStack Query |
| Charts | Recharts |
| Price Oracle | Pyth Network |
| Contracts | Solidity 0.8.25 + OpenZeppelin v5 |
| Testing | Foundry — 152 tests |
| Deployment | Mezo Testnet (Chain ID: 31611) |

---

## Project Structure

```
mezolens/
├── packages/contracts/
│   ├── src/
│   │   ├── EarnVault.sol       # Core vault logic
│   │   ├── FeeCollector.sol    # Fee accumulation with timelock
│   │   ├── GaugeVoter.sol      # Auto gauge voting
│   │   └── MusdPipe.sol        # MUSD CDP + LP yield routing
│   └── test/
│       └── EarnVault.t.sol     # 152 unit + integration tests
└── src/
    ├── components/
    │   ├── landing/            # Hero, features, metrics, CTA
    │   └── app/                # Dashboard, deposit modal, positions
    ├── hooks/
    │   ├── useEarnVault.ts     # Vault transactions + stats
    │   ├── usePositions.ts     # User positions (30s polling)
    │   ├── useCompound.ts      # Compound execution + history
    │   ├── useBtcPrice.ts      # Pyth oracle integration
    │   └── useEstimatedAPR.ts  # Per-strategy APR reads
    ├── store/
    │   ├── walletStore.ts      # Wallet + BTC/MEZO balances
    │   └── uiStore.ts          # Modal and page state
    ├── config/contracts.ts     # ABIs + contract addresses
    └── lib/wagmi.ts            # Wagmi config with Mezo Testnet
```

---

## Local Setup

**Prerequisites:** Node.js 20+, pnpm, Foundry

```bash
# Clone and install
git clone <repo-url>
cd mezolens
pnpm install

# Run the frontend
pnpm dev
# → http://localhost:3000

# Build and test contracts
cd packages/contracts
forge build
forge test -v
```

**Connect your wallet:**
1. Add Mezo Testnet — Chain ID **31611**, RPC: `https://rpc.test.mezo.org`
2. Get testnet BTC from the [Mezo faucet](https://faucet.test.mezo.org)
3. Get your [Mezo Passport](https://mezo.org/passport) (required for banking features)
4. Connect in MezoLens (Rabby or MetaMask), choose a strategy, deposit

**Enable MUSD Banking:**
After depositing, go to **Banking** tab → enable MUSD Yield → MezoLens automatically opens a CDP and deploys MUSD to LP pools.

**Switch to real Mezo Borrow (production):**
```solidity
// Call on MusdPipe after Mezo Borrow launches on testnet:
musdPipe.enableRealMode(borrowerOperationsAddress, swapRouterAddress, musdTokenAddress)
```

---

## Testing

```bash
cd packages/contracts && forge test -v
```

152 tests cover:
- Deposit flows for all three strategies
- Auto-compound mechanics with fee calculations
- MUSD yield routing — enable, disable, CDP health
- Gauge voting logic and APR selection
- Fee collection and timelock enforcement
- Access control and reentrancy guards
- Edge cases: zero deposits, below-minimum, strategy changes mid-position

---

## Security

- **Non-custodial** — users retain withdrawal rights at all times after lock expiry
- **Immutable** — no upgradeable proxy; contracts cannot be modified post-deployment
- **Reentrancy guards** — all state-changing functions use OpenZeppelin `ReentrancyGuard`
- **Hardcoded fee caps** — maximums enforced at the Solidity level, cannot be overridden by owner
- **FeeCollector timelock** — 2-day delay prevents immediate fee extraction
- **CDP collateral floor** — 150% minimum ratio; positions are monitored against liquidation price

---

## Why MezoLens

Mezo Earn is powerful, but most users leave money on the table because optimal yield requires constant manual action. MezoLens removes every friction point — one deposit decision, then the protocol handles everything.

With 12 Mezo protocol integrations, 4 live revenue streams, and a complete frontend + tested contract suite, MezoLens is production-grade Mezo-native DeFi infrastructure.

---

*Built for the Mezo Hackathon — MEZO Utilization track. Self-service Bitcoin banking: deposit BTC, borrow MUSD at 1%, earn yield, auto-compound everything.*
