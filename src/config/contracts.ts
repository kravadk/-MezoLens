// MezoLens Deployed Contract Addresses (Mezo Testnet)
// These will be updated after deployment

export const MEZOLENS_CONTRACTS = {
  earnVault: '0x961E1fc557c6A5Cf70070215190f9B57F719701D' as `0x${string}`,
  feeCollector: '0xeE9525392d1102234C4D1d2B7E0c29d87064000F' as `0x${string}`,
  gaugeVoter: '0x2Bf940Bc06A5161bfe18F64F1c7edb81d45ad81c' as `0x${string}`,
  musdPipe: '0x82251096716EcE27260F2D4f67b2131B95D9bA33' as `0x${string}`,
} as const;

// EarnVault ABI (key functions for frontend)
export const EARN_VAULT_ABI = [
  // Core user functions
  { name: 'deposit', type: 'function', stateMutability: 'payable', inputs: [{ name: 'strategy', type: 'uint8' }, { name: 'mezoAmount', type: 'uint256' }], outputs: [] },
  { name: 'withdraw', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'positionId', type: 'uint256' }], outputs: [] },
  { name: 'claimWithoutCompound', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'positionId', type: 'uint256' }], outputs: [] },
  { name: 'changeStrategy', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'positionId', type: 'uint256' }, { name: 'newStrategy', type: 'uint8' }], outputs: [] },

  // Auto-compound
  { name: 'compound', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'positionId', type: 'uint256' }], outputs: [] },
  { name: 'compoundBatch', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'positionIds', type: 'uint256[]' }], outputs: [] },

  // MUSD yield
  { name: 'enableMusdYield', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'positionId', type: 'uint256' }, { name: 'percentage', type: 'uint256' }], outputs: [] },
  { name: 'disableMusdYield', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'positionId', type: 'uint256' }], outputs: [] },

  // Read functions
  { name: 'getPosition', type: 'function', stateMutability: 'view', inputs: [{ name: 'positionId', type: 'uint256' }], outputs: [{ name: '', type: 'tuple', components: [
    { name: 'user', type: 'address' }, { name: 'strategy', type: 'uint8' },
    { name: 'btcDeposited', type: 'uint256' }, { name: 'btcCompounded', type: 'uint256' },
    { name: 'mezoLocked', type: 'uint256' }, { name: 'boostMultiplier', type: 'uint256' },
    { name: 'lockStart', type: 'uint256' }, { name: 'lockDuration', type: 'uint256' },
    { name: 'lastCompoundEpoch', type: 'uint256' }, { name: 'totalFeesPaid', type: 'uint256' },
    { name: 'musdPercent', type: 'uint256' }, { name: 'active', type: 'bool' }
  ]}] },
  { name: 'getUserPositionIds', type: 'function', stateMutability: 'view', inputs: [{ name: 'user', type: 'address' }], outputs: [{ name: '', type: 'uint256[]' }] },
  { name: 'getVaultStats', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'tuple', components: [
    { name: 'totalBtcLocked', type: 'uint256' }, { name: 'totalMezoLocked', type: 'uint256' },
    { name: 'totalPositions', type: 'uint256' }, { name: 'totalCompounded', type: 'uint256' },
    { name: 'totalFeesCollected', type: 'uint256' }, { name: 'currentEpoch', type: 'uint256' }
  ]}] },
  { name: 'getEstimatedAPR', type: 'function', stateMutability: 'view', inputs: [{ name: 'strategy', type: 'uint8' }], outputs: [{ name: '', type: 'uint256' }] },
  { name: 'getPendingCompound', type: 'function', stateMutability: 'view', inputs: [{ name: 'positionId', type: 'uint256' }], outputs: [{ name: '', type: 'uint256' }] },
  { name: 'getCurrentEpoch', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ name: 'number', type: 'uint256' }, { name: 'start', type: 'uint256' }, { name: 'end', type: 'uint256' }] },
  { name: 'getUserShare', type: 'function', stateMutability: 'view', inputs: [{ name: 'positionId', type: 'uint256' }], outputs: [{ name: 'weight', type: 'uint256' }, { name: 'totalWeight', type: 'uint256' }, { name: 'sharePercent', type: 'uint256' }] },
  { name: 'getCompoundHistory', type: 'function', stateMutability: 'view', inputs: [{ name: 'positionId', type: 'uint256' }], outputs: [{ name: '', type: 'tuple[]', components: [
    { name: 'positionId', type: 'uint256' }, { name: 'amount', type: 'uint256' },
    { name: 'fee', type: 'uint256' }, { name: 'callerIncentive', type: 'uint256' },
    { name: 'epoch', type: 'uint256' }, { name: 'timestamp', type: 'uint256' }
  ]}] },
  { name: 'getMusdHealth', type: 'function', stateMutability: 'view', inputs: [{ name: 'positionId', type: 'uint256' }], outputs: [{ name: 'collateralRatio', type: 'uint256' }, { name: 'liquidationPrice', type: 'uint256' }, { name: 'safe', type: 'bool' }] },

  // Events
  { name: 'Deposited', type: 'event', inputs: [{ name: 'user', type: 'address', indexed: true }, { name: 'strategy', type: 'uint8' }, { name: 'btcAmount', type: 'uint256' }, { name: 'mezoAmount', type: 'uint256' }, { name: 'positionId', type: 'uint256' }] },
  { name: 'Compounded', type: 'event', inputs: [{ name: 'positionId', type: 'uint256', indexed: true }, { name: 'amount', type: 'uint256' }, { name: 'fee', type: 'uint256' }, { name: 'callerIncentive', type: 'uint256' }, { name: 'epoch', type: 'uint256' }] },
  { name: 'Withdrawn', type: 'event', inputs: [{ name: 'user', type: 'address', indexed: true }, { name: 'positionId', type: 'uint256' }, { name: 'btcReturned', type: 'uint256' }, { name: 'mezoReturned', type: 'uint256' }, { name: 'feesPaid', type: 'uint256' }] },
] as const;

// FeeCollector ABI
export const FEE_COLLECTOR_ABI = [
  { name: 'getTotalCollected', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ name: 'performance', type: 'uint256' }, { name: 'management', type: 'uint256' }, { name: 'spread', type: 'uint256' }, { name: 'total', type: 'uint256' }] },
  { name: 'getCollectedThisEpoch', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ name: 'performance', type: 'uint256' }, { name: 'management', type: 'uint256' }, { name: 'spread', type: 'uint256' }, { name: 'total', type: 'uint256' }] },
] as const;
