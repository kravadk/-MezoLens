/**
 * MezoLens — Full end-to-end contract test with simulate-based debugging.
 *
 *   node test-full-debug.mjs
 *
 * Requires PRIVATE_KEY in .env (a testnet wallet with some BTC).
 * Covers:
 *   1. Chain + RPC health
 *   2. Wallet + balances (BTC, MUSD)
 *   3. PriceFeed, TroveManager, HintHelpers, SortedTroves reads
 *   4. EarnVault reads (getVaultStats, APR tiers, epoch, user positions)
 *   5. MusdPipe reads (mock mode, position data)
 *   6. FeeCollector reads
 *   7. BorrowerOperations: openTrove / addColl / repayMUSD / closeTrove
 *      - simulateContract first → exact revert reason from EVM
 *      - then real write if simulation passed
 *   8. MUSD approve + allowance
 *   9. EarnVault deposit / claimWithoutCompound / withdraw
 *
 * Debug features:
 *   - Each call prints: status, result / revert reason, gas estimate, tx hash, block.
 *   - SIMULATE stage does not send tx but uses eth_call so reverts show the real reason.
 *   - Wallet state diffed before/after each write.
 */

import {
  createPublicClient, createWalletClient, http,
  formatUnits, parseEther, parseUnits, keccak256, toHex, toBytes,
} from 'viem';

const ERROR_NAMES = [
  // EarnVault
  'BelowMinimumDeposit()', 'PositionNotActive()', 'NotPositionOwner()', 'LockNotExpired()',
  'NoNewEpoch()', 'InvalidStrategy()', 'StrategyChangeNotAllowed()', 'InvalidMusdPercent()',
  'TransferFailed()', 'ZeroAddress()',
  // FeeCollector
  'OnlyVault()', 'ExceedsFeeCap()', 'WithdrawalNotReady()', 'NoWithdrawalPending()',
  // GaugeVoter
  'NoActiveGauges()',
  // MusdPipe
  'CDPNotActive()', 'CDPAlreadyActive()', 'InsufficientCollateral()', 'UnsafeCollateralRatio()', 'ZeroAmount()',
  // OpenZeppelin / generic
  'ReentrancyGuardReentrantCall()', 'OwnableUnauthorizedAccount(address)', 'Paused()',
  'ERC20InsufficientBalance(address,uint256,uint256)', 'ERC20InsufficientAllowance(address,uint256,uint256)',
];
const ERROR_SELECTORS = {};
for (const n of ERROR_NAMES) {
  ERROR_SELECTORS[keccak256(toBytes(n)).slice(0, 10)] = n;
}
function decodeSelector(errMsg) {
  const m = typeof errMsg === 'string' && errMsg.match(/0x[0-9a-fA-F]{8}/);
  if (m && ERROR_SELECTORS[m[0].toLowerCase()]) return `${m[0]} → ${ERROR_SELECTORS[m[0].toLowerCase()]}`;
  return null;
}
import { privateKeyToAccount } from 'viem/accounts';
import { readFileSync, existsSync } from 'fs';

if (existsSync('.env')) {
  for (const line of readFileSync('.env', 'utf-8').split('\n')) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.+?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const RPC_URL = process.env.RPC_URL || 'https://rpc.test.mezo.org';
if (!PRIVATE_KEY || !PRIVATE_KEY.startsWith('0x')) {
  console.error('ERROR: PRIVATE_KEY missing in .env');
  process.exit(1);
}

const chain = {
  id: 31611,
  name: 'Mezo Testnet',
  nativeCurrency: { decimals: 18, name: 'Bitcoin', symbol: 'BTC' },
  rpcUrls: { default: { http: [RPC_URL] } },
};
const publicClient = createPublicClient({ chain, transport: http(RPC_URL) });
const account = privateKeyToAccount(PRIVATE_KEY);
const walletClient = createWalletClient({ account, chain, transport: http(RPC_URL) });

const C = {
  earnVault:          '0x961E1fc557c6A5Cf70070215190f9B57F719701D',
  feeCollector:       '0xeE9525392d1102234C4D1d2B7E0c29d87064000F',
  gaugeVoter:         '0x2Bf940Bc06A5161bfe18F64F1c7edb81d45ad81c',
  musdPipe:           '0x82251096716EcE27260F2D4f67b2131B95D9bA33',
  musdToken:          '0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503',
  borrowerOperations: '0xCdF7028ceAB81fA0C6971208e83fa7872994beE5',
  troveManager:       '0xE47c80e8c23f6B4A1aE41c34837a0599D5D16bb0',
  hintHelpers:        '0x4e4cBA3779d56386ED43631b4dCD6d8EacEcBCF6',
  sortedTroves:       '0x722E4D24FD6Ff8b0AC679450F3D91294607268fA',
  priceFeed:          '0x86bCF0841622a5dAC14A313a15f96A95421b9366',
};

const PRICE_ABI = [{ name: 'fetchPrice', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] }];

const TM_ABI = [
  { name: 'getTroveStatus',       type: 'function', stateMutability: 'view', inputs: [{ name: '_borrower', type: 'address' }], outputs: [{ type: 'uint8' }] },
  { name: 'getEntireDebtAndColl', type: 'function', stateMutability: 'view', inputs: [{ name: '_borrower', type: 'address' }], outputs: [{ name: 'coll', type: 'uint256' }, { name: 'principal', type: 'uint256' }, { name: 'interest', type: 'uint256' }, { name: 'pendingCollateral', type: 'uint256' }, { name: 'pendingPrincipal', type: 'uint256' }, { name: 'pendingInterest', type: 'uint256' }] },
  { name: 'getCurrentICR',        type: 'function', stateMutability: 'view', inputs: [{ name: '_borrower', type: 'address' }, { name: '_price', type: 'uint256' }], outputs: [{ type: 'uint256' }] },
  { name: 'getTroveInterestRate',  type: 'function', stateMutability: 'view', inputs: [{ name: '_borrower', type: 'address' }], outputs: [{ type: 'uint16' }] },
];

const HINT_ABI = [{ name: 'getApproxHint', type: 'function', stateMutability: 'view', inputs: [{ name: '_CR', type: 'uint256' }, { name: '_numTrials', type: 'uint256' }, { name: '_inputRandomSeed', type: 'uint256' }], outputs: [{ name: 'hintAddress', type: 'address' }, { name: 'diff', type: 'uint256' }, { name: 'latestRandomSeed', type: 'uint256' }] }];

const SORT_ABI = [{ name: 'findInsertPosition', type: 'function', stateMutability: 'view', inputs: [{ name: '_NICR', type: 'uint256' }, { name: '_prevId', type: 'address' }, { name: '_nextId', type: 'address' }], outputs: [{ name: 'prevId', type: 'address' }, { name: 'nextId', type: 'address' }] }];

const ERC20_ABI = [
  { name: 'balanceOf',   type: 'function', stateMutability: 'view',       inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'allowance',   type: 'function', stateMutability: 'view',       inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'approve',     type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }] },
  { name: 'symbol',      type: 'function', stateMutability: 'view',       inputs: [], outputs: [{ type: 'string' }] },
  { name: 'decimals',    type: 'function', stateMutability: 'view',       inputs: [], outputs: [{ type: 'uint8' }] },
  { name: 'totalSupply', type: 'function', stateMutability: 'view',       inputs: [], outputs: [{ type: 'uint256' }] },
];

const BOPS_ABI = [
  { name: 'openTrove',    type: 'function', stateMutability: 'payable',    inputs: [{ name: '_MUSDAmount', type: 'uint256' }, { name: '_upperHint', type: 'address' }, { name: '_lowerHint', type: 'address' }], outputs: [] },
  { name: 'closeTrove',   type: 'function', stateMutability: 'nonpayable', inputs: [], outputs: [] },
  { name: 'addColl',      type: 'function', stateMutability: 'payable',    inputs: [{ name: '_upperHint', type: 'address' }, { name: '_lowerHint', type: 'address' }], outputs: [] },
  { name: 'repayMUSD',    type: 'function', stateMutability: 'nonpayable', inputs: [{ name: '_amount', type: 'uint256' }, { name: '_upperHint', type: 'address' }, { name: '_lowerHint', type: 'address' }], outputs: [] },
  { name: 'withdrawColl', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: '_collWithdrawal', type: 'uint256' }, { name: '_upperHint', type: 'address' }, { name: '_lowerHint', type: 'address' }], outputs: [] },
];

const VAULT_ABI = [
  { name: 'getVaultStats',      type: 'function', stateMutability: 'view',    inputs: [], outputs: [{ type: 'tuple', components: [{ name: 'totalBtcLocked', type: 'uint256' }, { name: 'totalMezoLocked', type: 'uint256' }, { name: 'totalPositions', type: 'uint256' }, { name: 'totalCompounded', type: 'uint256' }, { name: 'totalFeesCollected', type: 'uint256' }, { name: 'currentEpoch', type: 'uint256' }] }] },
  { name: 'getEstimatedAPR',    type: 'function', stateMutability: 'view',    inputs: [{ name: 'strategy', type: 'uint8' }], outputs: [{ type: 'uint256' }] },
  { name: 'getCurrentEpoch',    type: 'function', stateMutability: 'view',    inputs: [], outputs: [{ name: 'number', type: 'uint256' }, { name: 'start', type: 'uint256' }, { name: 'end', type: 'uint256' }] },
  { name: 'getUserPositionIds', type: 'function', stateMutability: 'view',    inputs: [{ name: 'user', type: 'address' }], outputs: [{ type: 'uint256[]' }] },
  { name: 'getPosition',        type: 'function', stateMutability: 'view',    inputs: [{ name: 'positionId', type: 'uint256' }], outputs: [{ type: 'tuple', components: [{ name: 'user', type: 'address' }, { name: 'strategy', type: 'uint8' }, { name: 'btcDeposited', type: 'uint256' }, { name: 'btcCompounded', type: 'uint256' }, { name: 'mezoLocked', type: 'uint256' }, { name: 'boostMultiplier', type: 'uint256' }, { name: 'lockStart', type: 'uint256' }, { name: 'lockDuration', type: 'uint256' }, { name: 'lastCompoundEpoch', type: 'uint256' }, { name: 'totalFeesPaid', type: 'uint256' }, { name: 'musdPercent', type: 'uint256' }, { name: 'active', type: 'bool' }] }] },
  { name: 'getPendingCompound', type: 'function', stateMutability: 'view',    inputs: [{ name: 'positionId', type: 'uint256' }], outputs: [{ type: 'uint256' }] },
  { name: 'deposit',            type: 'function', stateMutability: 'payable', inputs: [{ name: 'strategy', type: 'uint8' }, { name: 'mezoAmount', type: 'uint256' }], outputs: [] },
  { name: 'withdraw',           type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'positionId', type: 'uint256' }], outputs: [] },
  { name: 'claimWithoutCompound', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'positionId', type: 'uint256' }], outputs: [] },
  { name: 'compound',           type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'positionId', type: 'uint256' }], outputs: [] },
  { name: 'changeStrategy',     type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'positionId', type: 'uint256' }, { name: 'newStrategy', type: 'uint8' }], outputs: [] },
];

const PIPE_ABI = [
  { name: 'useMockData', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'bool' }] },
  { name: 'getCDPFor',   type: 'function', stateMutability: 'view', inputs: [{ name: 'positionId', type: 'uint256' }], outputs: [{ type: 'tuple', components: [{ name: 'collateral', type: 'uint256' }, { name: 'debt', type: 'uint256' }, { name: 'lpTokens', type: 'uint256' }, { name: 'lpDeployed', type: 'uint256' }, { name: 'totalYield', type: 'uint256' }, { name: 'active', type: 'bool' }] }] },
  { name: 'getHealthFor', type: 'function', stateMutability: 'view', inputs: [{ name: 'positionId', type: 'uint256' }], outputs: [{ name: 'ratio', type: 'uint256' }, { name: 'liqPrice', type: 'uint256' }, { name: 'safe', type: 'bool' }] },
];

const FEE_ABI = [
  { name: 'getTotalCollected',       type: 'function', stateMutability: 'view', inputs: [], outputs: [{ name: 'performance', type: 'uint256' }, { name: 'management', type: 'uint256' }, { name: 'spread', type: 'uint256' }, { name: 'total', type: 'uint256' }] },
  { name: 'getCollectedThisEpoch',   type: 'function', stateMutability: 'view', inputs: [], outputs: [{ name: 'performance', type: 'uint256' }, { name: 'management', type: 'uint256' }, { name: 'spread', type: 'uint256' }, { name: 'total', type: 'uint256' }] },
];

const ZERO = '0x0000000000000000000000000000000000000000';
const GAS_COMP = 200n * 10n ** 18n;
const EXPLORER = 'https://explorer.test.mezo.org/tx/';

const c = { g:'\x1b[32m', r:'\x1b[31m', y:'\x1b[33m', b:'\x1b[36m', m:'\x1b[35m', d:'\x1b[2m', x:'\x1b[0m' };
const pass = (l, v)   => console.log(`  ${c.g}PASS${c.x}  ${l}${v !== undefined ? ': ' + v : ''}`);
const fail = (l, e)   => {
  const raw = e?.shortMessage || e?.details || e?.message || String(e);
  const decoded = decodeSelector(raw);
  console.log(`  ${c.r}FAIL${c.x}  ${l}: ${c.r}${raw}${c.x}${decoded ? `\n        ${c.y}decoded: ${decoded}${c.x}` : ''}${e?.metaMessages ? '\n        ' + e.metaMessages.slice(0,3).join('\n        ') : ''}`);
};
const skip = (l, r)   => console.log(`  ${c.y}SKIP${c.x}  ${l}: ${r}`);
const info = (l, v)   => {
  const s = v === undefined ? '' : ': ' + v;
  const decoded = decodeSelector(String(v));
  console.log(`  ${c.b}INFO${c.x}  ${l}${s}${decoded ? `\n        ${c.y}decoded: ${decoded}${c.x}` : ''}`);
};
const dbg  = (...a)   => console.log(`  ${c.d}${a.join(' ')}${c.x}`);
const hdr  = (t)      => console.log(`\n${c.m}═══ ${t} ═══${c.x}`);

async function computeHints(collWei, debtWei) {
  const totalDebt = debtWei + GAS_COMP;
  const nicr = (collWei * 10n ** 20n) / totalDebt;
  const hint = await publicClient.readContract({ address: C.hintHelpers, abi: HINT_ABI, functionName: 'getApproxHint', args: [nicr, 15n, 42069n] });
  const pos = await publicClient.readContract({ address: C.sortedTroves, abi: SORT_ABI, functionName: 'findInsertPosition', args: [nicr, hint[0], hint[0]] });
  return { upper: pos[0], lower: pos[1], nicr };
}

async function simulateAndWrite(label, req) {
  // 1. simulate (eth_call) — real EVM, shows exact revert
  let sim;
  try {
    sim = await publicClient.simulateContract({ ...req, account });
    pass(`${label} [simulate]`, 'would succeed');
  } catch (e) {
    fail(`${label} [simulate]`, e);
    return null;
  }
  // 2. gas estimate
  try {
    const gas = await publicClient.estimateContractGas({ ...req, account });
    dbg(`gas estimate: ${gas.toString()} wei units`);
  } catch (e) {
    dbg(`gas estimate failed: ${e?.shortMessage || e?.message}`);
  }
  // 3. send
  try {
    const hash = await walletClient.writeContract(sim.request);
    pass(`${label} [tx sent]`, hash);
    info('explorer', EXPLORER + hash);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    const status = receipt.status === 'success' ? `${c.g}${receipt.status}${c.x}` : `${c.r}${receipt.status}${c.x}`;
    pass(`${label} [receipt]`, `block #${receipt.blockNumber} · gas=${receipt.gasUsed} · status=${status}`);
    return receipt;
  } catch (e) {
    fail(`${label} [write]`, e);
    return null;
  }
}

console.log(`\n${c.m}╔════════════════════════════════════════════════╗${c.x}`);
console.log(`${c.m}║ MezoLens Full End-to-End Test (Mezo Testnet)  ║${c.x}`);
console.log(`${c.m}╚════════════════════════════════════════════════╝${c.x}`);
info('Address', account.address);
info('RPC', RPC_URL);

hdr('1. Chain');
const blockNum = await publicClient.getBlockNumber();
pass('block number', '#' + blockNum);
const chainId = await publicClient.getChainId();
pass('chainId', chainId);

hdr('2. Bytecode presence');
for (const [k, v] of Object.entries(C)) {
  const code = await publicClient.getBytecode({ address: v });
  if (code && code.length > 2) pass(k, `${code.length} bytes  @ ${v}`);
  else fail(k, `NO BYTECODE at ${v}`);
}

hdr('3. Wallet balances');
const btcBal = await publicClient.getBalance({ address: account.address });
pass('BTC', parseFloat(formatUnits(btcBal, 18)).toFixed(8));
let musdBal = 0n;
try {
  musdBal = await publicClient.readContract({ address: C.musdToken, abi: ERC20_ABI, functionName: 'balanceOf', args: [account.address] });
  pass('MUSD', parseFloat(formatUnits(musdBal, 18)).toFixed(4));
} catch (e) { fail('MUSD balanceOf', e); }

hdr('4. PriceFeed');
let priceWei = 70000n * 10n ** 18n;
try {
  priceWei = await publicClient.readContract({ address: C.priceFeed, abi: PRICE_ABI, functionName: 'fetchPrice' });
  pass('fetchPrice', '$' + parseFloat(formatUnits(priceWei, 18)).toFixed(2));
} catch (e) { fail('fetchPrice', e); }

hdr('5. MUSD Token meta');
try { pass('symbol',      await publicClient.readContract({ address: C.musdToken, abi: ERC20_ABI, functionName: 'symbol' })); }      catch(e) { fail('symbol', e); }
try { pass('decimals',    await publicClient.readContract({ address: C.musdToken, abi: ERC20_ABI, functionName: 'decimals' })); }    catch(e) { fail('decimals', e); }
try { const s = await publicClient.readContract({ address: C.musdToken, abi: ERC20_ABI, functionName: 'totalSupply' }); pass('totalSupply', parseFloat(formatUnits(s, 18)).toLocaleString() + ' MUSD'); } catch(e) { fail('totalSupply', e); }

hdr('6. EarnVault reads');
try {
  const s = await publicClient.readContract({ address: C.earnVault, abi: VAULT_ABI, functionName: 'getVaultStats' });
  pass('getVaultStats.totalPositions', Number(s.totalPositions));
  pass('getVaultStats.btcLocked',      parseFloat(formatUnits(s.totalBtcLocked, 18)).toFixed(6) + ' BTC');
  pass('getVaultStats.compounded',     parseFloat(formatUnits(s.totalCompounded, 18)).toFixed(6) + ' BTC');
  pass('getVaultStats.feesCollected',  parseFloat(formatUnits(s.totalFeesCollected, 18)).toFixed(6));
  pass('getVaultStats.currentEpoch',   Number(s.currentEpoch));
} catch (e) { fail('getVaultStats', e); }
try {
  const ep = await publicClient.readContract({ address: C.earnVault, abi: VAULT_ABI, functionName: 'getCurrentEpoch' });
  pass('getCurrentEpoch', `#${ep[0]} ${new Date(Number(ep[1])*1000).toISOString().slice(0,10)} → ${new Date(Number(ep[2])*1000).toISOString().slice(0,10)}`);
} catch (e) { fail('getCurrentEpoch', e); }
for (const [n, i] of [['conservative', 0], ['balanced', 1], ['aggressive', 2]]) {
  try { const apr = await publicClient.readContract({ address: C.earnVault, abi: VAULT_ABI, functionName: 'getEstimatedAPR', args: [i] }); pass(`APR(${n})`, (Number(apr) / 10000).toFixed(2) + '%'); }
  catch (e) { fail(`APR(${n})`, e); }
}
let userPositions = [];
try {
  userPositions = await publicClient.readContract({ address: C.earnVault, abi: VAULT_ABI, functionName: 'getUserPositionIds', args: [account.address] });
  pass('getUserPositionIds', JSON.stringify(userPositions.map(String)));
} catch (e) { fail('getUserPositionIds', e); }
for (const pid of userPositions.slice(0, 3)) {
  try { const p = await publicClient.readContract({ address: C.earnVault, abi: VAULT_ABI, functionName: 'getPosition', args: [pid] }); pass(`position #${pid}`, `strat=${p.strategy} btc=${formatUnits(p.btcDeposited, 18)} active=${p.active}`); }
  catch (e) { fail(`position #${pid}`, e); }
  try { const pc = await publicClient.readContract({ address: C.earnVault, abi: VAULT_ABI, functionName: 'getPendingCompound', args: [pid] }); pass(`pendingCompound #${pid}`, formatUnits(pc, 18)); }
  catch (e) { fail(`pendingCompound #${pid}`, e); }
}

hdr('7. MusdPipe reads');
try { pass('useMockData', await publicClient.readContract({ address: C.musdPipe, abi: PIPE_ABI, functionName: 'useMockData' })); }
catch (e) { fail('useMockData', e); }
try { const cdp = await publicClient.readContract({ address: C.musdPipe, abi: PIPE_ABI, functionName: 'getCDPFor', args: [1n] }); pass('getCDPFor(1)', `coll=${formatUnits(cdp.collateral, 18)} debt=${formatUnits(cdp.debt, 18)} active=${cdp.active}`); }
catch (e) { fail('getCDPFor(1)', e); }
try { const h = await publicClient.readContract({ address: C.musdPipe, abi: PIPE_ABI, functionName: 'getHealthFor', args: [1n] }); pass('getHealthFor(1)', `ratio=${h[0]} liqPrice=${h[1]} safe=${h[2]}`); }
catch (e) { fail('getHealthFor(1)', e); }

hdr('8. FeeCollector reads');
try {
  const t = await publicClient.readContract({ address: C.feeCollector, abi: FEE_ABI, functionName: 'getTotalCollected' });
  // viem returns multi-named outputs as array, not object
  const [perf, mgmt, spread, total] = Array.isArray(t) ? t : [t.performance, t.management, t.spread, t.total];
  pass('getTotalCollected', `perf=${formatUnits(perf,18)} mgmt=${formatUnits(mgmt,18)} spread=${formatUnits(spread,18)} total=${formatUnits(total,18)}`);
} catch (e) { fail('getTotalCollected', e); }
try {
  const t = await publicClient.readContract({ address: C.feeCollector, abi: FEE_ABI, functionName: 'getCollectedThisEpoch' });
  const [perf, mgmt, spread, total] = Array.isArray(t) ? t : [t.performance, t.management, t.spread, t.total];
  pass('getCollectedThisEpoch', `perf=${formatUnits(perf,18)} mgmt=${formatUnits(mgmt,18)} spread=${formatUnits(spread,18)} total=${formatUnits(total,18)}`);
} catch (e) { fail('getCollectedThisEpoch', e); }

hdr('9. Trove state for current wallet');
let troveStatus = 0;
try {
  troveStatus = Number(await publicClient.readContract({ address: C.troveManager, abi: TM_ABI, functionName: 'getTroveStatus', args: [account.address] }));
  const labels = ['nonExistent', 'active', 'closedByOwner', 'closedByLiquidation', 'closedByRedemption'];
  pass('getTroveStatus(self)', `${troveStatus} (${labels[troveStatus]})`);
} catch (e) { fail('getTroveStatus(self)', e); }
if (troveStatus === 1) {
  try {
    const dc = await publicClient.readContract({ address: C.troveManager, abi: TM_ABI, functionName: 'getEntireDebtAndColl', args: [account.address] });
    pass('trove.coll',      formatUnits(dc[0], 18) + ' BTC');
    pass('trove.principal', formatUnits(dc[1], 18) + ' MUSD');
    pass('trove.interest',  formatUnits(dc[2], 18));
  } catch (e) { fail('getEntireDebtAndColl', e); }
  try { const icr = await publicClient.readContract({ address: C.troveManager, abi: TM_ABI, functionName: 'getCurrentICR', args: [account.address, priceWei] }); pass('ICR', (parseFloat(formatUnits(icr, 18)) * 100).toFixed(2) + '%'); }
  catch (e) { fail('ICR', e); }
}

hdr('10. Hint computation');
const testColl = parseEther('0.03');
const testDebt = parseUnits('1800', 18);
let hints;
try {
  hints = await computeHints(testColl, testDebt);
  pass('hint.upper', hints.upper);
  pass('hint.lower', hints.lower);
  pass('NICR',       hints.nicr.toString());
} catch (e) { fail('computeHints', e); }

hdr('11. BorrowerOperations write (simulate → tx)');

if (troveStatus === 1) {
  skip('openTrove', 'wallet already has active trove — will test addColl/repay/close');

  if (btcBal > parseEther('0.002')) {
    await simulateAndWrite('addColl(0.001 BTC)', {
      address: C.borrowerOperations, abi: BOPS_ABI,
      functionName: 'addColl', args: [ZERO, ZERO], value: parseEther('0.001'),
    });
  } else skip('addColl', 'not enough BTC');

  if (musdBal >= parseUnits('100', 18)) {
    await simulateAndWrite('repayMUSD(100)', {
      address: C.borrowerOperations, abi: BOPS_ABI,
      functionName: 'repayMUSD', args: [parseUnits('100', 18), ZERO, ZERO],
    });
  } else skip('repayMUSD', `need ≥100 MUSD, have ${formatUnits(musdBal, 18)}`);

  try {
    const dc = await publicClient.readContract({ address: C.troveManager, abi: TM_ABI, functionName: 'getEntireDebtAndColl', args: [account.address] });
    const needed = dc[1] + dc[2];
    const cur = await publicClient.readContract({ address: C.musdToken, abi: ERC20_ABI, functionName: 'balanceOf', args: [account.address] });
    if (cur < needed) {
      skip('closeTrove', `need ${formatUnits(needed,18)} MUSD, have ${formatUnits(cur,18)}`);
    } else {
      const allowance = await publicClient.readContract({ address: C.musdToken, abi: ERC20_ABI, functionName: 'allowance', args: [account.address, C.borrowerOperations] });
      if (allowance < needed) {
        await simulateAndWrite('MUSD.approve(BorrowerOps)', {
          address: C.musdToken, abi: ERC20_ABI,
          functionName: 'approve', args: [C.borrowerOperations, 2n ** 255n],
        });
      } else info('MUSD allowance', 'sufficient');
      await simulateAndWrite('closeTrove', {
        address: C.borrowerOperations, abi: BOPS_ABI,
        functionName: 'closeTrove', args: [],
      });
    }
  } catch (e) { fail('closeTrove prep', e); }

} else {
  // ── openTrove flow ──
  const debtUsd = 1800;
  const collBtc = 0.03;
  const collUsd = collBtc * parseFloat(formatUnits(priceWei, 18));
  const icrPct  = (collUsd / (debtUsd + 200)) * 100;
  info('preview', `${collBtc} BTC (~$${collUsd.toFixed(0)}) / ${debtUsd} MUSD → ICR ${icrPct.toFixed(1)}%`);
  if (icrPct < 110) {
    fail('openTrove preview', `ICR ${icrPct.toFixed(1)}% < 110% MCR`);
  } else if (btcBal < testColl + parseEther('0.002')) {
    skip('openTrove', `need ≥${formatUnits(testColl + parseEther('0.002'), 18)} BTC, have ${formatUnits(btcBal, 18)}`);
  } else {
    await simulateAndWrite('openTrove(0.03 BTC / 1800 MUSD)', {
      address: C.borrowerOperations, abi: BOPS_ABI,
      functionName: 'openTrove', args: [testDebt, hints.upper, hints.lower], value: testColl,
    });
  }
}

hdr('12. EarnVault write — real tx per strategy (tiny amount)');

// Guard check: deposit(0,0) must revert → proves BelowMinimumDeposit() fires
try {
  await publicClient.simulateContract({ address: C.earnVault, abi: VAULT_ABI, functionName: 'deposit', args: [0, 0n], value: 0n, account });
  fail('deposit(0,0) simulate', 'should have reverted');
} catch (e) { pass('deposit(0,0) reverts (expected)', e?.shortMessage || 'reverted'); }

const TINY = parseEther('0.00005');         // 0.00005 BTC ≈ $3.78
const GAS_PER_TX = parseEther('0.00006');   // observed gas ~0.000035 BTC per deposit

// Run a real deposit per strategy (0 conservative, 1 balanced, 2 aggressive)
for (const [strat, label] of [[0, 'conservative'], [1, 'balanced'], [2, 'aggressive']]) {
  const cur = await publicClient.getBalance({ address: account.address });
  if (cur < TINY + GAS_PER_TX) {
    skip(`deposit(${label})`, `need ≥${formatUnits(TINY + GAS_PER_TX, 18)} BTC, have ${formatUnits(cur, 18)}`);
    continue;
  }
  await simulateAndWrite(`deposit(strategy=${strat} ${label}, ${formatUnits(TINY, 18)} BTC)`, {
    address: C.earnVault, abi: VAULT_ABI,
    functionName: 'deposit', args: [strat, 0n], value: TINY,
  });
}

// Verify positions, simulate compound/withdraw guards, find a position with pending rewards to claim for real
let finalIds = [];
try {
  finalIds = await publicClient.readContract({ address: C.earnVault, abi: VAULT_ABI, functionName: 'getUserPositionIds', args: [account.address] });
  pass('positions after deposits', JSON.stringify(finalIds.map(String)));
} catch (e) { fail('positions re-read', e); }

if (finalIds.length > 0) {
  const lastId = finalIds[finalIds.length - 1];
  for (const fn of ['claimWithoutCompound', 'compound', 'withdraw']) {
    try {
      await publicClient.simulateContract({ address: C.earnVault, abi: VAULT_ABI, functionName: fn, args: [lastId], account });
      pass(`${fn}(#${lastId}) [simulate]`, 'would succeed');
    } catch (e) { info(`${fn}(#${lastId}) [simulate]`, e?.shortMessage || e?.message); }
  }

  // Try real claimWithoutCompound on a position that has pending rewards
  for (const pid of finalIds) {
    const pc = await publicClient.readContract({ address: C.earnVault, abi: VAULT_ABI, functionName: 'getPendingCompound', args: [pid] });
    if (pc > 0n) {
      try {
        await publicClient.simulateContract({ address: C.earnVault, abi: VAULT_ABI, functionName: 'claimWithoutCompound', args: [pid], account });
        info('claim candidate', `position #${pid} has pending ${formatUnits(pc, 18)} BTC — sending real tx`);
        await simulateAndWrite(`claimWithoutCompound(#${pid})`, {
          address: C.earnVault, abi: VAULT_ABI, functionName: 'claimWithoutCompound', args: [pid],
        });
        break;
      } catch (e) {
        info(`claim candidate #${pid}`, `simulate reverts: ${e?.shortMessage || 'n/a'}`);
      }
    }
  }

  // changeStrategy on the last deposited position — needs current strategy ≠ new one
  // If our last deposit was to strategy=2 (aggressive), try changing to balanced
  try {
    const p = await publicClient.readContract({ address: C.earnVault, abi: VAULT_ABI, functionName: 'getPosition', args: [lastId] });
    const curStrat = Number(p.strategy);
    const newStrat = curStrat === 1 ? 0 : 1;
    await simulateAndWrite(`changeStrategy(#${lastId}, ${curStrat} → ${newStrat})`, {
      address: C.earnVault, abi: VAULT_ABI,
      functionName: 'changeStrategy', args: [lastId, newStrat],
    });
  } catch (e) { fail('changeStrategy probe', e); }
}

hdr('13. Final state');
const btcAfter  = await publicClient.getBalance({ address: account.address });
const musdAfter = await publicClient.readContract({ address: C.musdToken, abi: ERC20_ABI, functionName: 'balanceOf', args: [account.address] });
info('BTC  (start → end)',  `${formatUnits(btcBal, 18)} → ${formatUnits(btcAfter, 18)}   Δ ${formatUnits(btcAfter - btcBal, 18)}`);
info('MUSD (start → end)', `${formatUnits(musdBal, 18)} → ${formatUnits(musdAfter, 18)}  Δ ${formatUnits(musdAfter - musdBal, 18)}`);

console.log(`\n${c.m}╚════════════════════════════════════════════════╝${c.x}`);
console.log(`Done. Explorer: https://explorer.test.mezo.org/address/${account.address}\n`);
