# MezoLens Deployment Guide

## Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation) installed
- Mezo Testnet BTC (from [faucet](https://faucet.test.mezo.org/))
- Private key with testnet BTC

## Deploy Contracts

```bash
# Install dependencies
cd packages/contracts
forge install

# Run tests
forge test -vvv

# Deploy to Mezo Testnet
export PRIVATE_KEY=0x...your_key
forge script script/Deploy.s.sol \
  --rpc-url https://rpc.test.mezo.org \
  --broadcast \
  --verify

# Note the deployed addresses from the output
```

## Verify on Explorer

Contracts are automatically verified via the deploy script. Check:
https://explorer.test.mezo.org

## Update Frontend

After deployment, update the contract addresses in:
- `src/config/contracts.ts` — `MEZOLENS_CONTRACTS` object
- `.env` — `VITE_EARN_VAULT_ADDRESS` etc.

## Network Details

| Property | Value |
|---|---|
| Network | Mezo Testnet |
| Chain ID | 31611 |
| RPC | https://rpc.test.mezo.org |
| Explorer | https://explorer.test.mezo.org |
| Native | BTC (18 decimals) |
| EVM | london |

## Deployed Contracts

| Contract | Address | Purpose |
|---|---|---|
| EarnVault | `0x8722BeBc218F89455E4E21D75C09B0D5bf1313C6` | Main vault, deposits, compounds |
| FeeCollector | `0xF4BFd93061B160Fa376c7F66De207a00225B4e70` | Fee collection & transparency |
| GaugeVoter | `0x24Cb6d1bE131006e8CB2cb7fBa5675725f9E6Da8` | Auto gauge voting |
| MusdPipe | `0xA8302734081F26b8a3E42f90DCf07b3E063441de` | BTC→MUSD→LP pipeline |
