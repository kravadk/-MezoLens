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

// Mezo Passport — SBT NFT (ERC-721) for user identity
// Address: update when official testnet address is published
export const MEZO_PASSPORT_ADDRESS = '0x0000000000000000000000000000000000000000' as `0x${string}`;
export const MEZO_PASSPORT_ABI = [
  { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'owner', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
  { name: 'tokenOfOwnerByIndex', type: 'function', stateMutability: 'view', inputs: [{ name: 'owner', type: 'address' }, { name: 'index', type: 'uint256' }], outputs: [{ name: '', type: 'uint256' }] },
] as const;

// MusdPipe ABI — CDP management
export const MUSD_PIPE_ABI = [
  { name: 'getCDPFor', type: 'function', stateMutability: 'view', inputs: [{ name: 'positionId', type: 'uint256' }], outputs: [{ name: '', type: 'tuple', components: [
    { name: 'collateral', type: 'uint256' }, { name: 'debt', type: 'uint256' },
    { name: 'lpTokens', type: 'uint256' }, { name: 'lpDeployed', type: 'uint256' },
    { name: 'totalYield', type: 'uint256' }, { name: 'active', type: 'bool' }
  ]}] },
  { name: 'getHealthFor', type: 'function', stateMutability: 'view', inputs: [{ name: 'positionId', type: 'uint256' }], outputs: [{ name: 'ratio', type: 'uint256' }, { name: 'liqPrice', type: 'uint256' }, { name: 'safe', type: 'bool' }] },
  { name: 'openCDPFor', type: 'function', stateMutability: 'payable', inputs: [{ name: 'positionId', type: 'uint256' }], outputs: [{ name: 'musdMinted', type: 'uint256' }] },
  { name: 'closeCDPFor', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'positionId', type: 'uint256' }], outputs: [{ name: 'btcReturned', type: 'uint256' }] },
  { name: 'harvestLPFor', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'positionId', type: 'uint256' }], outputs: [{ name: 'yield', type: 'uint256' }] },
  { name: 'useMockData', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'bool' }] },
] as const;

export const MEZO_BORROW_CONTRACTS = {
  musdToken:           '0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503' as `0x${string}`,
  borrowerOperations:  '0xCdF7028ceAB81fA0C6971208e83fa7872994beE5' as `0x${string}`,
  troveManager:        '0xE47c80e8c23f6B4A1aE41c34837a0599D5D16bb0' as `0x${string}`,
  hintHelpers:         '0x4e4cBA3779d56386ED43631b4dCD6d8EacEcBCF6' as `0x${string}`,
  sortedTroves:        '0x722E4D24FD6Ff8b0AC679450F3D91294607268fA' as `0x${string}`,
  priceFeed:           '0x86bCF0841622a5dAC14A313a15f96A95421b9366' as `0x${string}`,
} as const;

export const BORROWER_OPERATIONS_ABI = [
  { name: 'openTrove', type: 'function', stateMutability: 'payable', inputs: [
    { name: '_debtAmount', type: 'uint256' },
    { name: '_upperHint', type: 'address' },
    { name: '_lowerHint', type: 'address' },
  ], outputs: [] },
  { name: 'closeTrove', type: 'function', stateMutability: 'nonpayable', inputs: [], outputs: [] },
  { name: 'addColl', type: 'function', stateMutability: 'payable', inputs: [
    { name: '_upperHint', type: 'address' },
    { name: '_lowerHint', type: 'address' },
  ], outputs: [] },
  { name: 'repayMUSD', type: 'function', stateMutability: 'nonpayable', inputs: [
    { name: '_amount', type: 'uint256' },
    { name: '_upperHint', type: 'address' },
    { name: '_lowerHint', type: 'address' },
  ], outputs: [] },
  { name: 'withdrawColl', type: 'function', stateMutability: 'nonpayable', inputs: [
    { name: '_collWithdrawal', type: 'uint256' },
    { name: '_upperHint', type: 'address' },
    { name: '_lowerHint', type: 'address' },
  ], outputs: [] },
] as const;

export const TROVE_MANAGER_ABI = [
  { name: 'getTroveStatus', type: 'function', stateMutability: 'view', inputs: [
    { name: '_borrower', type: 'address' },
  ], outputs: [{ name: '', type: 'uint8' }] },
  { name: 'getEntireDebtAndColl', type: 'function', stateMutability: 'view', inputs: [
    { name: '_borrower', type: 'address' },
  ], outputs: [
    { name: 'coll', type: 'uint256' },
    { name: 'principal', type: 'uint256' },
    { name: 'interest', type: 'uint256' },
    { name: 'pendingCollateral', type: 'uint256' },
    { name: 'pendingPrincipal', type: 'uint256' },
    { name: 'pendingInterest', type: 'uint256' },
  ] },
  { name: 'getCurrentICR', type: 'function', stateMutability: 'view', inputs: [
    { name: '_borrower', type: 'address' },
    { name: '_price', type: 'uint256' },
  ], outputs: [{ name: '', type: 'uint256' }] },
  { name: 'getTroveInterestRate', type: 'function', stateMutability: 'view', inputs: [
    { name: '_borrower', type: 'address' },
  ], outputs: [{ name: '', type: 'uint16' }] },
] as const;

export const HINT_HELPERS_ABI = [
  { name: 'getApproxHint', type: 'function', stateMutability: 'view', inputs: [
    { name: '_CR', type: 'uint256' },
    { name: '_numTrials', type: 'uint256' },
    { name: '_inputRandomSeed', type: 'uint256' },
  ], outputs: [
    { name: 'hintAddress', type: 'address' },
    { name: 'diff', type: 'uint256' },
    { name: 'latestRandomSeed', type: 'uint256' },
  ] },
] as const;

export const SORTED_TROVES_ABI = [
  { name: 'findInsertPosition', type: 'function', stateMutability: 'view', inputs: [
    { name: '_NICR', type: 'uint256' },
    { name: '_prevId', type: 'address' },
    { name: '_nextId', type: 'address' },
  ], outputs: [
    { name: 'prevId', type: 'address' },
    { name: 'nextId', type: 'address' },
  ] },
] as const;

export const MEZO_PRICE_FEED_ABI = [
  { name: 'fetchPrice', type: 'function', stateMutability: 'view', inputs: [], outputs: [
    { name: '', type: 'uint256' },
  ] },
] as const;

export const MUSD_TOKEN_ABI = [
  { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [
    { name: 'account', type: 'address' },
  ], outputs: [{ name: '', type: 'uint256' }] },
  { name: 'approve', type: 'function', stateMutability: 'nonpayable', inputs: [
    { name: 'spender', type: 'address' },
    { name: 'amount', type: 'uint256' },
  ], outputs: [{ name: '', type: 'bool' }] },
  { name: 'allowance', type: 'function', stateMutability: 'view', inputs: [
    { name: 'owner', type: 'address' },
    { name: 'spender', type: 'address' },
  ], outputs: [{ name: '', type: 'uint256' }] },
] as const;

// FeeCollector ABI
export const FEE_COLLECTOR_ABI = [
  { name: 'getTotalCollected', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ name: 'performance', type: 'uint256' }, { name: 'management', type: 'uint256' }, { name: 'spread', type: 'uint256' }, { name: 'total', type: 'uint256' }] },
  { name: 'getCollectedThisEpoch', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ name: 'performance', type: 'uint256' }, { name: 'management', type: 'uint256' }, { name: 'spread', type: 'uint256' }, { name: 'total', type: 'uint256' }] },
] as const;
