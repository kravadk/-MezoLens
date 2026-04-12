# Auto-Compound Mechanics

## How It Works

1. User deposits BTC → locked as veBTC
2. Every epoch (~7 days), veBTC earns protocol fees
3. **compound()** is called (by anyone — permissionless):
   - Claims pending rewards
   - Deducts 0.3% performance fee
   - Deducts 0.1% keeper incentive
   - Re-locks remainder as veBTC (adds to `btcCompounded`)
   - For aggressive: re-evaluates and votes on best gauge
4. User's BTC balance grows each epoch without any action

## Compound Math

```
Weekly reward = totalBTC × (APR / 52) × boostMultiplier
After fees:   reward × (1 - 0.003 - 0.001) = reward × 0.996
Re-locked:    added to btcCompounded
```

Compound effect: each epoch compounds on top of previous compounded amount.

## Keeper System

- `compound(positionId)` — anyone can call
- `compoundBatch(positionIds[])` — batch for gas efficiency
- Keeper earns 0.1% of compounded amount as incentive
- Economics: profitable when incentive > gas cost

## Example

| Epoch | Starting | Reward | Fee | Keeper | Re-locked | Total |
|---|---|---|---|---|---|---|
| 1 | 0.250 | 0.003 | 0.000009 | 0.000003 | 0.002988 | 0.252988 |
| 2 | 0.253 | 0.003 | 0.000009 | 0.000003 | 0.002988 | 0.255976 |
| ... | ... | ... | ... | ... | ... | ... |
| 8 | 0.271 | 0.003 | 0.000009 | 0.000003 | 0.002988 | 0.273904 |

After 8 epochs: **+9.6%** more than without compounding.
