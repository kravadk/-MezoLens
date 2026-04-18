/**
 * MezoLens Keeper Alerts — ICR liquidation monitor
 *
 * Polls TroveManager for a list of addresses and sends alerts
 * when ICR drops below the configured threshold.
 *
 * Supports:
 *   - Discord webhook (DISCORD_WEBHOOK)
 *   - Telegram bot (TELEGRAM_TOKEN + TELEGRAM_CHAT_ID)
 *   - Custom HTTP webhook (WEBHOOK_URL)
 *   - Console-only (no env vars needed for dry run)
 *
 * Usage:
 *   WATCH=0xAddr1,0xAddr2 node keeper-alerts.mjs
 *   WATCH=0xAddr1 THRESHOLD=150 DISCORD_WEBHOOK=https://... node keeper-alerts.mjs
 *   WATCH=0xAddr1 TELEGRAM_TOKEN=bot_token TELEGRAM_CHAT_ID=123 node keeper-alerts.mjs
 *
 * Or add all settings to .env:
 *   WATCH=0xAddr1,0xAddr2
 *   THRESHOLD=150
 *   DISCORD_WEBHOOK=https://discord.com/api/webhooks/...
 *   POLL_INTERVAL=300
 */

import { createPublicClient, http, formatUnits } from 'viem';
import { readFileSync, existsSync } from 'fs';

function loadEnv() {
  const env = {};
  if (existsSync('.env')) {
    const raw = readFileSync('.env', 'utf-8');
    for (const line of raw.split('\n')) {
      const m = line.match(/^([A-Z_]+)\s*=\s*(.+)/);
      if (m) env[m[1]] = m[2].trim();
    }
  }
  return env;
}
const dotenv = loadEnv();
const getEnv = (key, def) => process.env[key] || dotenv[key] || def;

const WATCH_RAW       = getEnv('WATCH', '');
const THRESHOLD       = parseFloat(getEnv('THRESHOLD', '150'));   // ICR % to alert below
const POLL_INTERVAL_S = parseInt(getEnv('POLL_INTERVAL', '300'), 10);
const DISCORD_WEBHOOK = getEnv('DISCORD_WEBHOOK', '');
const TELEGRAM_TOKEN  = getEnv('TELEGRAM_TOKEN', '');
const TELEGRAM_CHAT   = getEnv('TELEGRAM_CHAT_ID', '');
const WEBHOOK_URL     = getEnv('WEBHOOK_URL', '');

const LABELS_RAW = getEnv('LABELS', ''); // comma-separated labels matching WATCH order

const watchList = WATCH_RAW ? WATCH_RAW.split(',').map(a => a.trim()).filter(Boolean) : [];
const labelList = LABELS_RAW ? LABELS_RAW.split(',').map(l => l.trim()) : [];

if (watchList.length === 0) {
  console.error('\n❌  No addresses to watch. Set WATCH=0xAddr1,0xAddr2 in .env or as env var.\n');
  console.error('Example: WATCH=0xYourAddress node keeper-alerts.mjs\n');
  process.exit(1);
}

const chain = {
  id: 31611,
  name: 'Mezo Testnet',
  nativeCurrency: { decimals: 18, name: 'Bitcoin', symbol: 'BTC' },
  rpcUrls: { default: { http: ['https://rpc.test.mezo.org'] } },
};
const client = createPublicClient({ chain, transport: http('https://rpc.test.mezo.org') });

const TM_ADDR    = '0xE47c80e8c23f6B4A1aE41c34837a0599D5D16bb0';
const PRICE_ADDR = '0x86bCF0841622a5dAC14A313a15f96A95421b9366';

const TM_ABI = [
  { name: 'getTroveStatus',       type: 'function', stateMutability: 'view', inputs: [{ name: '_borrower', type: 'address' }], outputs: [{ type: 'uint8' }] },
  { name: 'getEntireDebtAndColl', type: 'function', stateMutability: 'view', inputs: [{ name: '_borrower', type: 'address' }], outputs: [{ name: 'coll', type: 'uint256' }, { name: 'principal', type: 'uint256' }, { name: 'interest', type: 'uint256' }, { name: 'pendingCollateral', type: 'uint256' }, { name: 'pendingPrincipal', type: 'uint256' }, { name: 'pendingInterest', type: 'uint256' }] },
  { name: 'getCurrentICR',        type: 'function', stateMutability: 'view', inputs: [{ name: '_borrower', type: 'address' }, { name: '_price', type: 'uint256' }], outputs: [{ type: 'uint256' }] },
];
const PRICE_ABI = [{ name: 'fetchPrice', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] }];

const lastAlertTime = {};     // address → timestamp
const ALERT_COOLDOWN_MS = 30 * 60 * 1000; // don't re-alert same address for 30 min
const ts = () => new Date().toISOString().replace('T', ' ').slice(0, 19);

async function sendDiscord(message) {
  if (!DISCORD_WEBHOOK) return;
  try {
    await fetch(DISCORD_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: message, username: 'MezoLens Keeper' }),
    });
    console.log('  📨 Discord alert sent');
  } catch (e) {
    console.error('  ❌ Discord webhook failed:', e?.message);
  }
}

async function sendTelegram(message) {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT) return;
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT, text: message, parse_mode: 'Markdown' }),
    });
    console.log('  📨 Telegram alert sent');
  } catch (e) {
    console.error('  ❌ Telegram failed:', e?.message);
  }
}

async function sendWebhook(payload) {
  if (!WEBHOOK_URL) return;
  try {
    await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    console.log('  📨 Custom webhook sent');
  } catch (e) {
    console.error('  ❌ Custom webhook failed:', e?.message);
  }
}

async function sendAlert({ address, label, icr, coll, debt, liqPrice, btcPrice, severity }) {
  const now = Date.now();
  if (lastAlertTime[address] && now - lastAlertTime[address] < ALERT_COOLDOWN_MS) return;
  lastAlertTime[address] = now;

  const emoji = severity === 'critical' ? '🚨' : '⚠️';
  const severityLabel = severity === 'critical' ? 'CRITICAL' : 'WARNING';
  const shortAddr = `${address.slice(0, 8)}…${address.slice(-4)}`;
  const displayName = label || shortAddr;
  const explorer = `https://explorer.test.mezo.org/address/${address}`;

  const msg = [
    `${emoji} MezoLens ${severityLabel} — ${displayName}`,
    ``,
    `ICR: ${icr.toFixed(1)}% (threshold: ${THRESHOLD}%) — LIQUIDATION RISK`,
    `Collateral: ${coll.toFixed(5)} BTC`,
    `Debt: ${debt.toFixed(0)} MUSD`,
    `Liq. Price: $${liqPrice.toFixed(0)} (BTC now: $${btcPrice.toFixed(0)})`,
    ``,
    `Add collateral to raise ICR above ${THRESHOLD}%`,
    `Explorer: ${explorer}`,
  ].join('\n');

  console.log('\n' + msg + '\n');

  await Promise.all([
    sendDiscord(msg),
    sendTelegram(msg),
    sendWebhook({
      type: 'liquidation_risk',
      severity,
      address,
      label: label || '',
      icr,
      threshold: THRESHOLD,
      coll,
      debt,
      liqPrice,
      btcPrice,
      timestamp: new Date().toISOString(),
      explorer,
    }),
  ]);
}

async function scan() {
  console.log(`\n[${ts()}] Scanning ${watchList.length} address(es) · threshold ${THRESHOLD}%`);

  // Fetch BTC price
  let priceWei = 70000n * 10n ** 18n;
  try {
    priceWei = await client.readContract({ address: PRICE_ADDR, abi: PRICE_ABI, functionName: 'fetchPrice' });
  } catch {}
  const btcPrice = parseFloat(formatUnits(priceWei, 18));
  console.log(`  BTC price: $${btcPrice.toFixed(2)}`);

  for (let i = 0; i < watchList.length; i++) {
    const address = watchList[i];
    const label   = labelList[i] || '';
    const displayName = label || `${address.slice(0, 8)}…`;

    try {
      const status = Number(await client.readContract({ address: TM_ADDR, abi: TM_ABI, functionName: 'getTroveStatus', args: [address] }));

      if (status !== 1) {
        console.log(`  ${displayName}: no active trove`);
        continue;
      }

      const [dcRaw, icrRaw] = await Promise.all([
        client.readContract({ address: TM_ADDR, abi: TM_ABI, functionName: 'getEntireDebtAndColl', args: [address] }),
        client.readContract({ address: TM_ADDR, abi: TM_ABI, functionName: 'getCurrentICR', args: [address, priceWei] }),
      ]);

      const coll      = parseFloat(formatUnits(dcRaw[0], 18));
      const principal = parseFloat(formatUnits(dcRaw[1], 18));
      const interest  = parseFloat(formatUnits(dcRaw[2], 18));
      const debt      = principal + interest;
      const icr       = parseFloat(formatUnits(icrRaw, 18)) * 100;
      const liqPrice  = coll > 0 ? (debt * 1.1) / coll : 0;

      const marker = icr < THRESHOLD ? (icr < 120 ? '🚨' : '⚠️') : '✅';
      console.log(`  ${marker} ${displayName}: ICR=${icr.toFixed(1)}% · ${coll.toFixed(5)} BTC · ${debt.toFixed(0)} MUSD · liq $${liqPrice.toFixed(0)}`);

      if (icr < THRESHOLD) {
        const severity = icr < 120 ? 'critical' : 'warning';
        await sendAlert({ address, label, icr, coll, debt, liqPrice, btcPrice, severity });
      }
    } catch (e) {
      console.error(`  ❌ Error reading ${displayName}:`, e?.shortMessage || e?.message);
    }
  }
}

console.log('╔══════════════════════════════════════════════╗');
console.log('║  MezoLens ICR Alert Monitor                 ║');
console.log('╚══════════════════════════════════════════════╝');
console.log(`\n  Watching ${watchList.length} address(es):`);
watchList.forEach((a, i) => console.log(`    #${i + 1} ${labelList[i] || ''} ${a}`));
console.log(`\n  ICR threshold:  ${THRESHOLD}% (alert when below)`);
console.log(`  Poll interval:  ${POLL_INTERVAL_S}s (${(POLL_INTERVAL_S / 60).toFixed(1)} min)`);
console.log(`  Discord:        ${DISCORD_WEBHOOK ? 'configured' : 'not set'}`);
console.log(`  Telegram:       ${TELEGRAM_TOKEN ? 'configured' : 'not set'}`);
console.log(`  Custom webhook: ${WEBHOOK_URL ? 'configured' : 'not set'}`);
console.log('\n  Ctrl+C to stop.\n');

await scan();
const interval = setInterval(scan, POLL_INTERVAL_S * 1000);

process.on('SIGINT', () => {
  clearInterval(interval);
  console.log('\n  Alert monitor stopped.\n');
  process.exit(0);
});
