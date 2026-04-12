// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IVeBTC} from "./interfaces/IVeBTC.sol";
import {IVeMEZO} from "./interfaces/IVeMEZO.sol";
import {FeeCollector} from "./FeeCollector.sol";
import {GaugeVoter} from "./GaugeVoter.sol";
import {MusdPipe} from "./MusdPipe.sol";

/// @title EarnVault - Auto-compound yield vault for Mezo Earn
/// @notice Accepts BTC/MEZO deposits, manages positions, and executes auto-compound
/// @dev Uses mock internal tracking when Mezo precompiles are unavailable
contract EarnVault is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // --- Enums ---
    enum Strategy {
        CONSERVATIVE, // lock BTC → veBTC, earn base fees, auto-compound
        BALANCED,     // + lock MEZO → veMEZO, 2x boost, auto-compound
        AGGRESSIVE    // + max lock, 5x boost, auto gauge vote, auto-compound
    }

    // --- Structs ---
    struct Position {
        address user;
        Strategy strategy;
        uint256 btcDeposited;
        uint256 btcCompounded;
        uint256 mezoLocked;
        uint256 boostMultiplier; // 100 = 1x, 200 = 2x, 500 = 5x
        uint256 lockStart;
        uint256 lockDuration;
        uint256 lastCompoundEpoch;
        uint256 totalFeesPaid;
        uint256 musdPercent;     // 0-5000 bps (0-50%) for MUSD yield
        bool active;
    }

    struct VaultStats {
        uint256 totalBtcLocked;
        uint256 totalMezoLocked;
        uint256 totalPositions;
        uint256 totalCompounded;
        uint256 totalFeesCollected;
        uint256 currentEpoch;
    }

    struct CompoundEvent {
        uint256 positionId;
        uint256 amount;
        uint256 fee;
        uint256 callerIncentive;
        uint256 epoch;
        uint256 timestamp;
    }

    struct EpochSnapshot {
        uint256 epochNumber;
        uint256 totalFees;
        uint256 swapFees;
        uint256 borrowFees;
        uint256 bridgeFees;
        uint256 compoundedAmount;
        uint256 timestamp;
    }

    // --- State ---
    FeeCollector public feeCollector;
    GaugeVoter public gaugeVoter;
    MusdPipe public musdPipe;
    IERC20 public mezoToken;

    // Optional precompile interfaces (may be zero address on testnet)
    IVeBTC public veBTC;
    IVeMEZO public veMEZO;

    // Position tracking
    mapping(uint256 => Position) public positions;
    mapping(address => uint256[]) public userPositions;
    uint256 public nextPositionId;

    // Compound history
    mapping(uint256 => CompoundEvent[]) public compoundHistory; // positionId => events

    // Epoch tracking (mock)
    uint256 public currentEpoch;
    uint256 public epochStartTime;
    uint256 public constant EPOCH_DURATION = 7 days;

    // Epoch snapshots
    mapping(uint256 => EpochSnapshot) public epochSnapshots;

    // Vault totals
    uint256 public totalBtcLocked;
    uint256 public totalMezoLocked;
    uint256 public totalCompounded;

    // Minimum deposits
    uint256 public constant MIN_BTC_DEPOSIT = 0.000001 ether; // 0.000001 BTC
    uint256 public constant MIN_MEZO_DEPOSIT = 0;            // No minimum MEZO
    uint256 public constant DEFAULT_LOCK_DURATION = 30 days;

    // Mock reward rate (BTC per BTC locked per epoch, in basis points)
    uint256 public mockRewardRate = 120; // ~1.2% per epoch = ~62% APR (for testing)

    // Compound cooldown per position (prevents MEV rapid-fire)
    uint256 public constant COMPOUND_COOLDOWN = 1 hours;
    mapping(uint256 => uint256) public lastCompoundTimestamp;

    // --- Events ---
    event Deposited(address indexed user, Strategy strategy, uint256 btcAmount, uint256 mezoAmount, uint256 positionId);
    event Withdrawn(address indexed user, uint256 positionId, uint256 btcReturned, uint256 mezoReturned, uint256 feesPaid);
    event Compounded(uint256 indexed positionId, uint256 amount, uint256 fee, uint256 callerIncentive, uint256 epoch);
    event CompoundBatch(uint256[] positionIds, uint256 totalCompounded, uint256 totalFees);
    event ManualClaim(address indexed user, uint256 positionId, uint256 amount, uint256 fee);
    event StrategyChanged(address indexed user, uint256 positionId, Strategy oldStrategy, Strategy newStrategy);
    event MusdYieldEnabled(uint256 indexed positionId, uint256 percentage);
    event MusdYieldDisabled(uint256 indexed positionId);
    event EpochAdvanced(uint256 newEpoch, uint256 timestamp);

    // --- Errors ---
    error BelowMinimumDeposit();
    error PositionNotActive();
    error NotPositionOwner();
    error LockNotExpired();
    error NoNewEpoch();
    error InvalidStrategy();
    error StrategyChangeNotAllowed();
    error InvalidMusdPercent();
    error TransferFailed();
    error ZeroAddress();

    constructor(
        address _owner,
        address _feeCollector,
        address _gaugeVoter,
        address _musdPipe,
        address _mezoToken,
        address _veBTC,
        address _veMEZO
    ) Ownable(_owner) {
        feeCollector = FeeCollector(payable(_feeCollector));
        gaugeVoter = GaugeVoter(_gaugeVoter);
        musdPipe = MusdPipe(payable(_musdPipe));

        if (_mezoToken != address(0)) mezoToken = IERC20(_mezoToken);
        if (_veBTC != address(0)) veBTC = IVeBTC(_veBTC);
        if (_veMEZO != address(0)) veMEZO = IVeMEZO(_veMEZO);

        currentEpoch = 1;
        epochStartTime = block.timestamp;
    }

    // ═══════════════════════════════════════════
    //  CORE USER FUNCTIONS
    // ═══════════════════════════════════════════

    /// @notice Deposit BTC (and optionally MEZO) to open a new position
    /// @param strategy The yield strategy to use
    /// @param mezoAmount Amount of MEZO tokens (0 for conservative)
    function deposit(Strategy strategy, uint256 mezoAmount) external payable whenNotPaused nonReentrant {
        if (msg.value < MIN_BTC_DEPOSIT) revert BelowMinimumDeposit();

        // Validate MEZO requirements per strategy
        uint256 boost = 100; // 1x default
        if (strategy == Strategy.BALANCED) {
            boost = 200; // 2x
            if (mezoAmount > 0 && address(mezoToken) != address(0)) {
                mezoToken.safeTransferFrom(msg.sender, address(this), mezoAmount);
            }
        } else if (strategy == Strategy.AGGRESSIVE) {
            boost = 500; // 5x
            if (mezoAmount > 0 && address(mezoToken) != address(0)) {
                mezoToken.safeTransferFrom(msg.sender, address(this), mezoAmount);
            }
        }

        // Try to lock BTC as veBTC (mock fallback if precompile unavailable)
        _tryLockVeBTC(msg.value);

        // Try to lock MEZO as veMEZO for boost
        if (mezoAmount > 0 && strategy != Strategy.CONSERVATIVE) {
            _tryLockVeMEZO(mezoAmount);
        }

        // Create position
        uint256 positionId = nextPositionId++;
        positions[positionId] = Position({
            user: msg.sender,
            strategy: strategy,
            btcDeposited: msg.value,
            btcCompounded: 0,
            mezoLocked: mezoAmount,
            boostMultiplier: boost,
            lockStart: block.timestamp,
            lockDuration: DEFAULT_LOCK_DURATION,
            lastCompoundEpoch: currentEpoch,
            totalFeesPaid: 0,
            musdPercent: 0,
            active: true
        });
        userPositions[msg.sender].push(positionId);

        totalBtcLocked += msg.value;
        totalMezoLocked += mezoAmount;

        // Auto-vote on best gauge for aggressive strategy
        if (strategy == Strategy.AGGRESSIVE) {
            gaugeVoter.voteForBest(msg.value, currentEpoch);
        }

        _checkAdvanceEpoch();

        emit Deposited(msg.sender, strategy, msg.value, mezoAmount, positionId);
    }

    /// @notice Withdraw a position after lock expires
    /// @param positionId The position to withdraw
    function withdraw(uint256 positionId) external nonReentrant {
        Position storage pos = positions[positionId];
        if (!pos.active) revert PositionNotActive();
        if (pos.user != msg.sender) revert NotPositionOwner();
        if (block.timestamp < pos.lockStart + pos.lockDuration) revert LockNotExpired();

        // Calculate management fee
        uint256 totalBtc = pos.btcDeposited + pos.btcCompounded;
        uint256 duration = block.timestamp - pos.lockStart;
        uint256 mgmtFee = feeCollector.collectManagementFee(totalBtc, duration);

        // Close MUSD pipe if active
        if (pos.musdPercent > 0) {
            musdPipe.closeCDP();
        }

        uint256 btcToReturn = totalBtc - mgmtFee;
        uint256 mezoToReturn = pos.mezoLocked;

        // Deactivate position
        pos.active = false;
        pos.totalFeesPaid += mgmtFee;
        totalBtcLocked -= pos.btcDeposited;
        totalMezoLocked -= pos.mezoLocked;

        // Send management fee to FeeCollector
        if (mgmtFee > 0) {
            (bool feeSuccess,) = address(feeCollector).call{value: mgmtFee}("");
            if (!feeSuccess) revert TransferFailed();
        }

        // Return BTC to user
        if (btcToReturn > 0) {
            (bool success,) = msg.sender.call{value: btcToReturn}("");
            if (!success) revert TransferFailed();
        }

        // Return MEZO to user
        if (mezoToReturn > 0 && address(mezoToken) != address(0)) {
            mezoToken.safeTransfer(msg.sender, mezoToReturn);
        }

        emit Withdrawn(msg.sender, positionId, btcToReturn, mezoToReturn, mgmtFee);
    }

    /// @notice Claim rewards without auto-compounding (manual claim)
    /// @param positionId The position to claim from
    function claimWithoutCompound(uint256 positionId) external nonReentrant {
        Position storage pos = positions[positionId];
        if (!pos.active) revert PositionNotActive();
        if (pos.user != msg.sender) revert NotPositionOwner();

        uint256 pendingReward = _calculatePendingReward(positionId);
        if (pendingReward == 0) return;

        // Deduct performance fee
        uint256 fee = feeCollector.collectPerformanceFee(pendingReward);
        uint256 claimAmount = pendingReward - fee;

        pos.lastCompoundEpoch = currentEpoch;
        pos.totalFeesPaid += fee;

        // Send fee to collector
        if (fee > 0) {
            (bool feeSuccess,) = address(feeCollector).call{value: fee}("");
            if (!feeSuccess) revert TransferFailed();
        }

        // Send rewards to user
        if (claimAmount > 0) {
            (bool success,) = msg.sender.call{value: claimAmount}("");
            if (!success) revert TransferFailed();
        }

        emit ManualClaim(msg.sender, positionId, claimAmount, fee);
    }

    /// @notice Change strategy on an existing position
    /// @param positionId The position to modify
    /// @param newStrategy The new strategy
    function changeStrategy(uint256 positionId, Strategy newStrategy) external nonReentrant {
        Position storage pos = positions[positionId];
        if (!pos.active) revert PositionNotActive();
        if (pos.user != msg.sender) revert NotPositionOwner();
        // Strategy change allowed anytime

        Strategy oldStrategy = pos.strategy;
        if (oldStrategy == newStrategy) revert InvalidStrategy();

        // Handle upgrades (conservative → balanced/aggressive)
        if (newStrategy == Strategy.BALANCED && oldStrategy == Strategy.CONSERVATIVE) {
            pos.boostMultiplier = 200;
        } else if (newStrategy == Strategy.AGGRESSIVE) {
            pos.boostMultiplier = 500;
            gaugeVoter.voteForBest(pos.btcDeposited + pos.btcCompounded, currentEpoch);
        }

        // Handle downgrades
        if (newStrategy == Strategy.CONSERVATIVE) {
            pos.boostMultiplier = 100;
            if (pos.musdPercent > 0) {
                pos.musdPercent = 0;
                emit MusdYieldDisabled(positionId);
            }
        } else if (newStrategy == Strategy.BALANCED && oldStrategy == Strategy.AGGRESSIVE) {
            pos.boostMultiplier = 200;
        }

        pos.strategy = newStrategy;
        emit StrategyChanged(msg.sender, positionId, oldStrategy, newStrategy);
    }

    // ═══════════════════════════════════════════
    //  AUTO-COMPOUND (CORE FEATURE)
    // ═══════════════════════════════════════════

    /// @notice Auto-compound a position — PERMISSIONLESS, anyone can call
    /// @param positionId The position to compound
    function compound(uint256 positionId) external whenNotPaused nonReentrant {
        _checkAdvanceEpoch();

        Position storage pos = positions[positionId];
        if (!pos.active) revert PositionNotActive();
        if (pos.lastCompoundEpoch >= currentEpoch) revert NoNewEpoch();
        require(block.timestamp >= lastCompoundTimestamp[positionId] + COMPOUND_COOLDOWN, "Compound cooldown");
        lastCompoundTimestamp[positionId] = block.timestamp;

        uint256 pendingReward = _calculatePendingReward(positionId);
        if (pendingReward == 0) return;

        // Step 1: Deduct performance fee
        uint256 fee = feeCollector.collectPerformanceFee(pendingReward);

        // Step 2: Calculate keeper incentive
        uint256 keeperIncentive = feeCollector.calculateKeeperIncentive(pendingReward);

        // Step 3: Re-lock remainder as veBTC (safe underflow check)
        uint256 deductions = fee + keeperIncentive;
        if (deductions > pendingReward) deductions = pendingReward;
        uint256 toCompound = pendingReward - deductions;
        pos.btcCompounded += toCompound;
        totalCompounded += toCompound;

        // Step 4: Update tracking
        pos.lastCompoundEpoch = currentEpoch;
        pos.totalFeesPaid += fee;

        // Step 5: Auto gauge vote for aggressive
        if (pos.strategy == Strategy.AGGRESSIVE) {
            gaugeVoter.voteForBest(pos.btcDeposited + pos.btcCompounded, currentEpoch);
        }

        // Step 6: Handle MUSD yield routing (only deduct if successful)
        if (pos.musdPercent > 0 && address(musdPipe) != address(0)) {
            uint256 musdShare = (toCompound * pos.musdPercent) / 10_000;
            try musdPipe.openCDPFor{value: musdShare}(positionId) {
                toCompound -= musdShare;
            } catch {
                // openCDP failed — keep full toCompound, no BTC lost
            }
        }

        // Record compound event
        compoundHistory[positionId].push(CompoundEvent({
            positionId: positionId,
            amount: toCompound,
            fee: fee,
            callerIncentive: keeperIncentive,
            epoch: currentEpoch,
            timestamp: block.timestamp
        }));

        // Pay fee to collector
        if (fee > 0) {
            (bool feeSuccess,) = address(feeCollector).call{value: fee}("");
            if (!feeSuccess) revert TransferFailed();
        }

        // Pay keeper incentive
        if (keeperIncentive > 0) {
            feeCollector.recordKeeperPayment(msg.sender, keeperIncentive);
            (bool keeperSuccess,) = msg.sender.call{value: keeperIncentive}("");
            if (!keeperSuccess) revert TransferFailed();
        }

        emit Compounded(positionId, toCompound, fee, keeperIncentive, currentEpoch);
    }

    /// @notice Batch compound multiple positions in one tx
    /// @param positionIds Array of position IDs to compound
    function compoundBatch(uint256[] calldata positionIds) external whenNotPaused nonReentrant {
        _checkAdvanceEpoch();

        uint256 batchCompounded;
        uint256 batchFees;

        for (uint256 i; i < positionIds.length; i++) {
            uint256 pid = positionIds[i];
            Position storage pos = positions[pid];

            if (!pos.active || pos.lastCompoundEpoch >= currentEpoch) continue;
            if (block.timestamp < lastCompoundTimestamp[pid] + COMPOUND_COOLDOWN) continue;

            uint256 pendingReward = _calculatePendingReward(pid);
            if (pendingReward == 0) continue;

            lastCompoundTimestamp[pid] = block.timestamp;

            uint256 fee = feeCollector.collectPerformanceFee(pendingReward);
            uint256 keeperIncentive = feeCollector.calculateKeeperIncentive(pendingReward);
            uint256 deductions = fee + keeperIncentive;
            if (deductions > pendingReward) deductions = pendingReward;
            uint256 toCompound = pendingReward - deductions;

            pos.btcCompounded += toCompound;
            pos.lastCompoundEpoch = currentEpoch;
            pos.totalFeesPaid += fee;

            batchCompounded += toCompound;
            batchFees += fee;

            if (pos.strategy == Strategy.AGGRESSIVE) {
                gaugeVoter.voteForBest(pos.btcDeposited + pos.btcCompounded, currentEpoch);
            }

            compoundHistory[pid].push(CompoundEvent({
                positionId: pid,
                amount: toCompound,
                fee: fee,
                callerIncentive: keeperIncentive,
                epoch: currentEpoch,
                timestamp: block.timestamp
            }));

            emit Compounded(pid, toCompound, fee, keeperIncentive, currentEpoch);
        }

        totalCompounded += batchCompounded;

        // Pay total fees + incentives
        uint256 totalKeeperIncentive = feeCollector.calculateKeeperIncentive(batchCompounded);
        if (batchFees > 0) {
            (bool feeSuccess,) = address(feeCollector).call{value: batchFees}("");
            if (!feeSuccess) revert TransferFailed();
        }
        if (totalKeeperIncentive > 0) {
            feeCollector.recordKeeperPayment(msg.sender, totalKeeperIncentive);
            (bool keeperSuccess,) = msg.sender.call{value: totalKeeperIncentive}("");
            if (!keeperSuccess) revert TransferFailed();
        }

        emit CompoundBatch(positionIds, batchCompounded, batchFees);
    }

    // ═══════════════════════════════════════════
    //  MUSD YIELD
    // ═══════════════════════════════════════════

    /// @notice Enable MUSD yield routing for a position
    /// @param positionId The position to modify
    /// @param percentage MUSD allocation percentage (0-5000 = 0-50% in bps)
    function enableMusdYield(uint256 positionId, uint256 percentage) external nonReentrant {
        Position storage pos = positions[positionId];
        if (!pos.active) revert PositionNotActive();
        if (pos.user != msg.sender) revert NotPositionOwner();
        if (pos.strategy == Strategy.CONSERVATIVE) revert InvalidStrategy();
        if (percentage == 0 || percentage > 5000) revert InvalidMusdPercent();

        pos.musdPercent = percentage;
        emit MusdYieldEnabled(positionId, percentage);
    }

    /// @notice Disable MUSD yield routing
    /// @param positionId The position to modify
    function disableMusdYield(uint256 positionId) external nonReentrant {
        Position storage pos = positions[positionId];
        if (!pos.active) revert PositionNotActive();
        if (pos.user != msg.sender) revert NotPositionOwner();

        if (pos.musdPercent > 0) {
            // Try to close any active CDP (may not exist yet if no compound happened)
            try musdPipe.closeCDPFor(positionId) {} catch {
                // CDP may not exist if no compound happened yet
            }
        }

        pos.musdPercent = 0;
        emit MusdYieldDisabled(positionId);
    }

    // ═══════════════════════════════════════════
    //  READ FUNCTIONS
    // ═══════════════════════════════════════════

    function getPosition(uint256 positionId) external view returns (Position memory) {
        return positions[positionId];
    }

    function getPositions(address user) external view returns (Position[] memory) {
        uint256[] storage ids = userPositions[user];
        Position[] memory result = new Position[](ids.length);
        for (uint256 i; i < ids.length; i++) {
            result[i] = positions[ids[i]];
        }
        return result;
    }

    function getUserPositionIds(address user) external view returns (uint256[] memory) {
        return userPositions[user];
    }

    function getVaultStats() external view returns (VaultStats memory) {
        uint256 activeCount;
        for (uint256 i; i < nextPositionId; i++) {
            if (positions[i].active) activeCount++;
        }

        (,,, uint256 totalFees) = feeCollector.getTotalCollected();

        return VaultStats({
            totalBtcLocked: totalBtcLocked,
            totalMezoLocked: totalMezoLocked,
            totalPositions: activeCount,
            totalCompounded: totalCompounded,
            totalFeesCollected: totalFees,
            currentEpoch: currentEpoch
        });
    }

    /// @notice Estimated APR for a strategy (in basis points)
    function getEstimatedAPR(Strategy strategy) external view returns (uint256) {
        uint256 baseApr = (mockRewardRate * 52 * 100); // weekly rate * 52 weeks * 100 for bps
        if (strategy == Strategy.BALANCED) return (baseApr * 200) / 100;
        if (strategy == Strategy.AGGRESSIVE) return (baseApr * 500) / 100;
        return baseApr;
    }

    /// @notice Get pending compound amount for a position
    function getPendingCompound(uint256 positionId) external view returns (uint256) {
        return _calculatePendingReward(positionId);
    }

    /// @notice Get current epoch info
    function getCurrentEpoch() external view returns (uint256 number, uint256 start, uint256 end) {
        number = currentEpoch;
        start = epochStartTime;
        end = epochStartTime + EPOCH_DURATION;
    }

    /// @notice Get user's share weight
    function getUserShare(uint256 positionId) external view returns (uint256 weight, uint256 totalWeight, uint256 sharePercent) {
        Position storage pos = positions[positionId];
        if (!pos.active) return (0, 0, 0);

        weight = (pos.btcDeposited + pos.btcCompounded) * pos.boostMultiplier / 100;
        totalWeight = totalBtcLocked; // Simplified
        if (totalWeight > 0) {
            sharePercent = (weight * 10_000) / totalWeight;
        }
    }

    /// @notice Get compound history for a position
    function getCompoundHistory(uint256 positionId) external view returns (CompoundEvent[] memory) {
        return compoundHistory[positionId];
    }

    /// @notice Get epoch snapshot
    function getEpochSnapshot(uint256 epochNumber) external view returns (EpochSnapshot memory) {
        return epochSnapshots[epochNumber];
    }

    /// @notice Get MUSD health for a position
    function getMusdHealth(uint256 positionId) external view returns (uint256 collateralRatio, uint256 liquidationPrice, bool safe) {
        Position storage pos = positions[positionId];
        if (!pos.active || pos.musdPercent == 0) return (0, 0, false);
        return musdPipe.getHealth(pos.user);
    }

    // ═══════════════════════════════════════════
    //  ADMIN
    // ═══════════════════════════════════════════

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function setMockRewardRate(uint256 _rate) external onlyOwner {
        require(_rate <= 1000, "Rate too high"); // Max 10% per epoch
        mockRewardRate = _rate;
        emit MockRewardRateUpdated(_rate);
    }
    event MockRewardRateUpdated(uint256 newRate);

    // ═══════════════════════════════════════════
    //  INTERNAL
    // ═══════════════════════════════════════════

    function _calculatePendingReward(uint256 positionId) internal view returns (uint256) {
        Position storage pos = positions[positionId];
        if (!pos.active || pos.lastCompoundEpoch >= currentEpoch) return 0;

        uint256 totalBtc = pos.btcDeposited + pos.btcCompounded;
        uint256 epochsElapsed = currentEpoch - pos.lastCompoundEpoch;

        // Mock: reward = totalBtc * rate * boost * epochs / 10000
        uint256 reward = (totalBtc * mockRewardRate * pos.boostMultiplier * epochsElapsed) / (10_000 * 100);
        return reward;
    }

    function _tryLockVeBTC(uint256 amount) internal {
        if (address(veBTC) != address(0)) {
            try veBTC.lock{value: amount}(DEFAULT_LOCK_DURATION) {} catch {
                // Fallback: internal tracking (BTC stays in this contract)
            }
        }
        // If no precompile, BTC stays in contract (mock mode)
    }

    function _tryLockVeMEZO(uint256 amount) internal {
        if (address(veMEZO) != address(0)) {
            mezoToken.approve(address(veMEZO), amount);
            try veMEZO.lock(amount, DEFAULT_LOCK_DURATION) {} catch {
                // Fallback: internal tracking
            }
        }
    }

    function _checkAdvanceEpoch() internal {
        if (block.timestamp >= epochStartTime + EPOCH_DURATION) {
            // Save snapshot
            (,,, uint256 epochFees) = feeCollector.getCollectedThisEpoch();
            epochSnapshots[currentEpoch] = EpochSnapshot({
                epochNumber: currentEpoch,
                totalFees: epochFees,
                swapFees: (epochFees * 58) / 100, // Mock split
                borrowFees: (epochFees * 31) / 100,
                bridgeFees: (epochFees * 11) / 100,
                compoundedAmount: totalCompounded,
                timestamp: block.timestamp
            });

            feeCollector.resetEpoch();
            currentEpoch++;
            epochStartTime = block.timestamp;
            emit EpochAdvanced(currentEpoch, block.timestamp);
        }
    }

    receive() external payable {}
}
