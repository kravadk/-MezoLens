# MezoLens Strategies

## Conservative (1x Boost)

- **APR**: 5-7%
- **Risk**: Low
- **What it does**: Lock BTC → veBTC. Auto-compound rewards every epoch.
- **Mezo integrations**: veBTC, epoch rewards
- **MUSD yield**: Not available
- **Best for**: Passive BTC holders who want simple, safe yield

## Balanced (2x Boost)

- **APR**: 7-10%
- **Risk**: Medium
- **What it does**: Lock BTC + MEZO. veMEZO provides 2x boost. Auto-compound.
- **Mezo integrations**: veBTC, veMEZO, epoch rewards, optional MUSD yield
- **MUSD yield**: Available (10-50% allocation)
- **Best for**: Users with both BTC and MEZO who want boosted yield

## Aggressive (5x Boost)

- **APR**: 10-15%
- **Risk**: Higher
- **What it does**: Max lock duration, 5x veMEZO boost, auto gauge voting.
- **Mezo integrations**: veBTC, veMEZO, gauge voting, epoch rewards, MUSD yield
- **MUSD yield**: Available (10-50% allocation)
- **Best for**: Active DeFi users maximizing yield on Mezo

## Strategy Comparison

| Feature | Conservative | Balanced | Aggressive |
|---|---|---|---|
| veBTC locking | Yes | Yes | Yes |
| Auto-compound | Yes | Yes | Yes |
| veMEZO boost | No | 2x | 5x |
| Auto gauge voting | No | No | Yes |
| MUSD yield option | No | Yes | Yes |
| MEZO required | No | Optional | Optional |
| Lock duration | 30 days | 30 days | 30 days |

## Changing Strategy

- Upgrade (conservative→balanced): requires MEZO approval
- Downgrade (aggressive→conservative): stops auto-vote, resets boost
- Cannot change within first epoch of position
