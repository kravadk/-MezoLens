# MezoLens — Self-Service Bitcoin Banking on Mezo

> Deposit BTC as collateral. Borrow MUSD at 1% fixed. Earn LP yield that covers the cost. Auto-compound every epoch. One decision, then the protocol handles the rest.

[![Mezo Testnet](https://img.shields.io/badge/Network-Mezo%20Testnet-orange)](https://explorer.test.mezo.org)
[![Chain ID](https://img.shields.io/badge/Chain%20ID-31611-blue)](https://explorer.test.mezo.org)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.25-gray)](https://soliditylang.org)
[![Tests](https://img.shields.io/badge/Forge%20tests-138-brightgreen)](#testing)
[![Track](https://img.shields.io/badge/Track-MEZO%20Utilization-purple)](#)

---

## Problem

Bitcoin is the largest store of value on earth, yet less than 2% of it earns any yield. On Mezo, BTC can already be borrowed against and deployed to liquidity pools — but extracting optimal yield is a chore: open a trove, monitor the ICR, claim rewards every epoch, re-lock veBTC, pick the best gauge, mint MUSD into the right pool, repeat. Miss a week and the compounding curve flattens; misjudge the ICR and you get liquidated.

Most users either leave the yield on the table or avoid MUSD entirely.

## Idea

MezoLens is a single front-end that turns a six-step weekly workflow into one decision: choose a strategy, deposit BTC, done. Under the hood it wires together every primitive Mezo already provides — BorrowerOperations for the CDP, PriceFeed and HintHelpers for safe openings, MusdPipe for MUSD-to-LP routing, EarnVault for the auto-compound loop — and exposes them through a consistent React UI with live on-chain reads, live price, live ICR and live health.

Everything the UI shows is pulled from a deployed testnet contract at read time. No mock data paths in the runtime.

## Approach

- **Frontend:** React 19 + Vite + TypeScript, Wagmi v3 + Viem v2 for contract reads, Tailwind v4 + Framer Motion for the UI.
- **Borrow layer:** direct calls into the Mezo Borrow contracts (BorrowerOperations / TroveManager / SortedTroves / HintHelpers / PriceFeed / MUSD ERC-20). `openTrove` computes hints off-chain, enforces MCR 110% client-side before sending, and renders the tx hash into the Mezo explorer.
- **Yield layer:** MezoLens' own `EarnVault.sol` (Liquity-style position accounting), `MusdPipe.sol` (CDP → LP pipeline), `FeeCollector.sol` (timelocked), `GaugeVoter.sol` (auto-vote). All four are deployed to testnet.
- **Testing:** 138 Foundry tests across 10 contract files, plus a single on-chain integration script (`test-full-debug.mjs`) that runs the whole flow against live testnet with a real private key.

## Key Features

| | What it does | Where |
|---|---|---|
| **MUSD Banking** | Open, add collateral to, repay, and close a trove against native Mezo Borrow. Live ICR, liquidation price, MUSD balance, gas-compensation aware. | `Banking.tsx`, `useBorrowerOps.ts`, `useTroveData.ts` |
| **EarnVault** | Deposit BTC with one of three strategies (conservative / balanced / aggressive), each a different boost multiplier and auto-compound policy. | `Deposit.tsx`, `MyPositions.tsx`, `useEarnVault.ts` |
| **Auto-compound** | Permissionless `compound(positionId)` — anyone can call, earns a keeper incentive. Batch version for multiple positions in one tx. | `useCompound.ts`, `Dashboard.tsx` |
| **MUSD yield routing** | Opt-in per position: route X% of future compounds into MUSD LP instead of BTC. CDP health is monitored inside the same vault read. | `MusdYieldModal.tsx`, `useMusdCdp.ts`, `useMusdHealth.ts` |
| **Analytics** | Live 12-month projection, breakeven calculator, compound history, epoch snapshots — all pulled from on-chain state and PriceFeed. | `Analytics.tsx`, `Calculator.tsx` |
| **Watchlist** | Monitor external troves (other wallets) with liquidation-risk banding (danger <120%, caution 120–150%). | `Watchlist.tsx`, `useWatchlist.ts` |
| **Transparency** | Fees collected, keeper leaderboard, strategy distribution — live from FeeCollector and EarnVault. | `Transparency.tsx`, `VaultStats.tsx` |

## Expected User Outcome

A Mezo user holding BTC opens MezoLens, connects a wallet, picks **Balanced**, and deposits. From that moment on:

1. BTC is locked as veBTC collateral (never sold).
2. MUSD is borrowed at a **fixed 1%** rate and deployed to a Mezo Swap LP.
3. Every epoch, a permissionless `compound` re-locks rewards — no weekly clicking.
4. If BTC drops toward the liquidation price, the UI shows a warning with one-click **Add Collateral**.
5. The user can close the trove at any time; no surprise fees beyond the caps hard-coded in Solidity.

Net effect: BTC generates yield without being sold, users avoid the manual-claim grind, and MUSD borrows are positive-carry in all three strategies so long as LP APR > 1%.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, TypeScript 5.8 |
| Styling | Tailwind CSS v4, Framer Motion |
| Web3 | Wagmi v3, Viem v2 |
| State | Zustand, TanStack Query |
| Charts | Recharts |
| Price | Mezo PriceFeed (primary), Pyth (fallback) |
| Contracts | Solidity 0.8.25, OpenZeppelin v5 |
| Tests | Foundry — 138 tests across 10 files |
| Network | Mezo Testnet (Chain ID 31611) |

## Deployed Contracts — Mezo Testnet

### MezoLens (custom)
| Contract | Address |
|---|---|
| EarnVault | [`0x961E1fc557c6A5Cf70070215190f9B57F719701D`](https://explorer.test.mezo.org/address/0x961E1fc557c6A5Cf70070215190f9B57F719701D) |
| FeeCollector | [`0xeE9525392d1102234C4D1d2B7E0c29d87064000F`](https://explorer.test.mezo.org/address/0xeE9525392d1102234C4D1d2B7E0c29d87064000F) |
| GaugeVoter | [`0x2Bf940Bc06A5161bfe18F64F1c7edb81d45ad81c`](https://explorer.test.mezo.org/address/0x2Bf940Bc06A5161bfe18F64F1c7edb81d45ad81c) |
| MusdPipe | [`0x82251096716EcE27260F2D4f67b2131B95D9bA33`](https://explorer.test.mezo.org/address/0x82251096716EcE27260F2D4f67b2131B95D9bA33) |

### Mezo Protocol (native — Banking tab reads/writes these directly)
| Contract | Address |
|---|---|
| BorrowerOperations | [`0xCdF7028ceAB81fA0C6971208e83fa7872994beE5`](https://explorer.test.mezo.org/address/0xCdF7028ceAB81fA0C6971208e83fa7872994beE5) |
| TroveManager | [`0xE47c80e8c23f6B4A1aE41c34837a0599D5D16bb0`](https://explorer.test.mezo.org/address/0xE47c80e8c23f6B4A1aE41c34837a0599D5D16bb0) |
| HintHelpers | [`0x4e4cBA3779d56386ED43631b4dCD6d8EacEcBCF6`](https://explorer.test.mezo.org/address/0x4e4cBA3779d56386ED43631b4dCD6d8EacEcBCF6) |
| SortedTroves | [`0x722E4D24FD6Ff8b0AC679450F3D91294607268fA`](https://explorer.test.mezo.org/address/0x722E4D24FD6Ff8b0AC679450F3D91294607268fA) |
| PriceFeed | [`0x86bCF0841622a5dAC14A313a15f96A95421b9366`](https://explorer.test.mezo.org/address/0x86bCF0841622a5dAC14A313a15f96A95421b9366) |
| MUSD Token | [`0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503`](https://explorer.test.mezo.org/address/0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503) |

## Local Setup

Prerequisites: Node 20+, npm, Foundry (`curl -L https://foundry.paradigm.xyz | bash`).

```bash
git clone https://github.com/kravadk/mezolens
cd mezolens
npm install
npm run dev        # http://localhost:3000
```

Wallet: Mezo Testnet, chainId **31611**, RPC `https://rpc.test.mezo.org`. Get testnet BTC from [faucet.test.mezo.org](https://faucet.test.mezo.org).

## Testing

### Foundry (contract unit / integration)
```bash
cd packages/contracts
forge build
forge test -vv
```
138 tests cover deposit/withdraw/compound/strategy/fee logic plus integration paths across EarnVault, MusdPipe, FeeCollector, GaugeVoter.

### Live on-chain integration
A single script runs the whole flow against live testnet using a real wallet:

```bash
cp .env.example .env            # then fill PRIVATE_KEY with a funded testnet key
node test-full-debug.mjs
```

What it does:
- Verifies RPC + bytecode presence for all 10 contracts.
- Reads PriceFeed, EarnVault stats, per-strategy APR, epoch, FeeCollector, MusdPipe, TroveManager.
- Computes hints + NICR, previews ICR client-side.
- `simulateContract` every write before sending — if simulation reverts, the script decodes the custom error selector against `EarnVault.sol`, `MusdPipe.sol`, `FeeCollector.sol`, `GaugeVoter.sol`, OpenZeppelin, and prints the matched name.
- Sends real transactions: `openTrove` / `addColl` / `repayMUSD` / `closeTrove`, `deposit` per strategy, `claimWithoutCompound`, `changeStrategy`, `compound`.
- Diffs BTC + MUSD balance pre/post and prints every tx hash with an explorer link.

Run output includes gas estimates and a final `BTC start → end · Δ` / `MUSD start → end · Δ` diff.

## Security

- Non-custodial — users retain withdrawal rights once the BTC lock expires.
- Immutable — no upgradeable proxy; contracts cannot be changed post-deployment.
- Reentrancy guards on all state-changing functions (OpenZeppelin `ReentrancyGuard`).
- Hardcoded fee caps at the Solidity level (performance ≤5%, management ≤1%, MUSD spread ≤20%).
- 2-day timelock on FeeCollector withdrawals.
- `.env` is in `.gitignore`; no secrets are read from source code, only from the environment.

## Roadmap

- Mainnet deployment once Mezo Borrow goes live.
- Keeper SDK + public keeper leaderboard with on-chain incentive distribution.
- Multi-collateral support (tBTC, stBTC).
- Mobile-first layout for the banking tab.

---

*Built for the Mezo Hackathon — MEZO Utilization track.*
