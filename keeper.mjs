/**
 * MezoLens Keeper Bot — EarnVault compound() trigger
 *
 * Monitors all EarnVault positions and calls compound() when available.
 * Earns 0.1% keeper incentive per successful compound.
 *
 * Requirements:
 *   - PRIVATE_KEY in .env or environment
 *   - Testnet BTC for gas
 *
 * Usage:
 *   PRIVATE_KEY=0x... node keeper.mjs
 *   PRIVATE_KEY=0x... POLL_INTERVAL=300 node keeper.mjs   # poll every 5 min
 *   PRIVATE_KEY=0x... MAX_POSITIONS=50 node keeper.mjs    # check first 50 positions
 */

import { createPublicClient, createWalletClient, http, formatUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { readFileSync, existsSync } from 'fs';

let PRIVATE_KEY = process.env.PRIVATE_KEY;
if (!PRIVATE_KEY && existsSync('.env')) {
  const env = readFileSync('.env', 'utf-8');
  for (const line of env.split('\n')) {
    const m = line.match(/^PRIVATE_KEY\s*=\s*(.+)/);
    if (m) PRIVATE_KEY = m[1].trim();
  }
}

if (!PRIVATE_KEY || PRIVATE_KEY === '0x_your_testnet_private_key_here') {
  console.error('\n❌  PRIVATE_KEY not set. Add it to .env or export it as env var.\n');
  process.exit(1);
}

const POLL_INTERVAL_S = parseInt(process.env.POLL_INTERVAL || '300', 10); // 5 min default
const MAX_POSITIONS   = parseInt(process.env.MAX_POSITIONS || '100', 10);
const DRY_RUN         = process.env.DRY_RUN === '1';

const chain = {
  id: 31611,
  name: 'Mezo Testnet',
  nativeCurrency: { decimals: 18, name: 'Bitcoin', symbol: 'BTC' },
  rpcUrls: { default: { http: ['https://rpc.test.mezo.org'] } },
};
const RPC = 'https://rpc.test.mezo.org';
const publicClient = createPublicClient({ chain, transport: http(RPC) });
const account = privateKeyToAccount(PRIVATE_KEY);
const walletClient = createWalletClient({ account, chain, transport: http(RPC) });

const EARN_VAULT = '0x961E1fc557c6A5Cf70070215190f9B57F719701D';
const EXPLORER   = 'https://explorer.test.mezo.org/tx/';

const VAULT_ABI = [
  {
    name: 'getVaultStats',
    type: 'function', stateMutability: 'view', inputs: [],
    outputs: [{ type: 'tuple', components: [
      { name: 'totalBtcLocked',    type: 'uint256' },
      { name: 'totalMezoLocked',  type: 'uint256' },
      { name: 'totalPositions',   type: 'uint256' },
      { name: 'totalCompounded',  type: 'uint256' },
      { name: 'totalFeesCollected', type: 'uint256' },
      { name: 'currentEpoch',     type: 'uint256' },
    ]}],
  },
  {
    name: 'getPosition',
    type: 'function', stateMutability: 'view',
    inputs: [{ name: 'positionId', type: 'uint256' }],
    outputs: [{ type: 'tuple', components: [
      { name: 'owner',        type: 'address' },
      { name: 'btcDeposited', type: 'uint256' },
      { name: 'btcCompounded', type: 'uint256' },
      { name: 'mezoStaked',   type: 'uint256' },
      { name: 'strategy',     type: 'uint8' },
      { name: 'lockEnd',      type: 'uint256' },
      { name: 'lastCompound', type: 'uint256' },
      { name: 'musdEnabled',  type: 'bool' },
      { name: 'musdPercent',  type: 'uint256' },
    ]}],
  },
  {
    name: 'getPendingCompound',
    type: 'function', stateMutability: 'view',
    inputs: [{ name: 'positionId', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'compound',
    type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'positionId', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'compoundBatch',
    type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'positionIds', type: 'uint256[]' }],
    outputs: [],
  },
  {
    name: 'COMPOUND_COOLDOWN',
    type: 'function', stateMutability: 'view', inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
];

const fmt = (v) => `${parseFloat(formatUnits(v, 18)).toFixed(6)} BTC`;
const ts  = () => new Date().toISOString().replace('T', ' ').slice(0, 19);

let totalEarned = 0n;
let compoundsDone = 0;

async function scanAndCompound() {
  console.log(`\n[${ts()}] Scanning EarnVault positions…`);

  // Get total position count
  let totalPositions = 0n;
  try {
    const stats = await publicClient.readContract({ address: EARN_VAULT, abi: VAULT_ABI, functionName: 'getVaultStats' });
    totalPositions = stats.totalPositions;
    console.log(`  Total positions: ${totalPositions} · checking first ${Math.min(Number(totalPositions), MAX_POSITIONS)}`);
  } catch (e) {
    console.error('  ❌ Failed to get vault stats:', e?.shortMessage || e?.message);
    return;
  }

  const limit = Math.min(Number(totalPositions), MAX_POSITIONS);
  const compoundable = [];

  // Check each position
  for (let id = 0; id < limit; id++) {
    try {
      const pending = await publicClient.readContract({
        address: EARN_VAULT, abi: VAULT_ABI, functionName: 'getPendingCompound', args: [BigInt(id)],
      });
      if (pending > 0n) {
        compoundable.push(id);
        console.log(`  Position #${id}: ${fmt(pending)} pending`);
      }
    } catch {
      // Position may not exist, skip
    }
  }

  if (compoundable.length === 0) {
    console.log('  ✓ No compoundable positions found');
    return;
  }

  console.log(`  Found ${compoundable.length} compoundable position(s)`);

  if (DRY_RUN) {
    console.log('  DRY RUN — not sending transactions');
    return;
  }

  // Check keeper's gas balance
  const balance = await publicClient.getBalance({ address: account.address });
  console.log(`  Keeper balance: ${parseFloat(formatUnits(balance, 18)).toFixed(6)} BTC`);
  if (balance < BigInt(1e14)) { // < 0.0001 BTC
    console.warn('  ⚠️  Low BTC balance — may not have enough for gas');
  }

  // Compound in batch if multiple, otherwise one-by-one
  if (compoundable.length > 1) {
    try {
      const hash = await walletClient.writeContract({
        address: EARN_VAULT, abi: VAULT_ABI, functionName: 'compoundBatch',
        args: [compoundable.map(BigInt)],
      });
      console.log(`  📤 compoundBatch(${compoundable.join(',')}) → ${hash}`);
      console.log(`  🔗 ${EXPLORER}${hash}`);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status === 'success') {
        compoundsDone += compoundable.length;
        console.log(`  ✅ compoundBatch confirmed (block #${receipt.blockNumber})`);
      } else {
        console.log('  ❌ compoundBatch reverted');
      }
    } catch (e) {
      // Batch failed, try individually
      console.warn('  Batch failed, trying individual compounds…');
      for (const id of compoundable) await compoundOne(id);
    }
  } else {
    await compoundOne(compoundable[0]);
  }
}

async function compoundOne(positionId) {
  try {
    const hash = await walletClient.writeContract({
      address: EARN_VAULT, abi: VAULT_ABI, functionName: 'compound',
      args: [BigInt(positionId)],
    });
    console.log(`  📤 compound(${positionId}) → ${hash}`);
    console.log(`  🔗 ${EXPLORER}${hash}`);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    if (receipt.status === 'success') {
      compoundsDone++;
      console.log(`  ✅ compound(${positionId}) confirmed (block #${receipt.blockNumber})`);
    } else {
      console.log(`  ❌ compound(${positionId}) reverted`);
    }
  } catch (e) {
    console.error(`  ❌ compound(${positionId}) failed:`, e?.shortMessage || e?.message);
  }
}

console.log('╔══════════════════════════════════════════════╗');
console.log('║  MezoLens Keeper Bot                        ║');
console.log('║  EarnVault auto-compound runner             ║');
console.log('╚══════════════════════════════════════════════╝');
console.log(`\n  Keeper address: ${account.address}`);
console.log(`  Poll interval:  ${POLL_INTERVAL_S}s (${(POLL_INTERVAL_S / 60).toFixed(1)} min)`);
console.log(`  Max positions:  ${MAX_POSITIONS}`);
console.log(`  Dry run:        ${DRY_RUN ? 'YES — no txs sent' : 'NO — live mode'}`);
console.log(`  EarnVault:      ${EARN_VAULT}`);
console.log('\n  Earning 0.1% keeper incentive per compound.');
console.log('  Ctrl+C to stop.\n');

// Run immediately then on interval
await scanAndCompound();
const interval = setInterval(async () => {
  await scanAndCompound();
  console.log(`\n  Stats: ${compoundsDone} compounds done this session`);
}, POLL_INTERVAL_S * 1000);

// Graceful shutdown
process.on('SIGINT', () => {
  clearInterval(interval);
  console.log(`\n\n  Keeper stopped. Total compounds: ${compoundsDone}\n`);
  process.exit(0);
});
