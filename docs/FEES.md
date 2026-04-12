# MezoLens Fee Structure

## Fee Types

| Fee | Rate | When | From |
|---|---|---|---|
| Performance | 0.3% (30 bps) | Per compound | Yield only, never principal |
| Management | 0.1% (10 bps) | Annual, pro-rata at withdrawal | Total locked BTC |
| MUSD Spread | 10% (1000 bps) | Per MUSD harvest | Net MUSD yield only |
| Keeper Incentive | 0.1% (10 bps) | Per compound | Compounded amount |

## Fee Caps (On-Chain)

All fees have on-chain maximums enforced in FeeCollector:
- Performance: max 5% (500 bps)
- Management: max 1% (100 bps)
- MUSD Spread: max 20% (2000 bps)
- Keeper: max 0.5% (50 bps)

## Revenue Streams

1. **Performance fees** — base revenue from every compound
2. **Management fees** — recurring from locked BTC
3. **MUSD spread** — from MUSD yield strategy users
4. **Keeper margin** — 10% of keeper incentive pool

## Unit Economics

| TVL | Annual Revenue |
|---|---|
| $1.15M (5% of Mezo) | ~$1,400 |
| $5M | ~$6,100 |
| $15M | ~$23,600 |

Yearn model: low margin, scales linearly with TVL.

## Transparency

All fees are:
- Tracked on-chain in FeeCollector
- Visible per-epoch and all-time
- Viewable in the Transparency dashboard
- Broken down by type (performance/management/spread)
