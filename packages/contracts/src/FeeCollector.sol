// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title FeeCollector - Collects and distributes MezoLens protocol fees
/// @notice Tracks performance fees, management fees, and MUSD spread separately
/// @dev All fees denominated in native BTC (wei)
contract FeeCollector is Ownable, ReentrancyGuard {
    // --- Fee parameters (basis points) ---
    uint256 public performanceFeeBps; // 0.3% = 30 bps
    uint256 public managementFeeBps;  // 0.1% = 10 bps
    uint256 public musdSpreadBps;     // 10% = 1000 bps
    uint256 public keeperIncentiveBps; // 0.1% = 10 bps

    // --- Fee caps ---
    uint256 public constant MAX_PERFORMANCE_BPS = 500;  // 5%
    uint256 public constant MAX_MANAGEMENT_BPS = 100;    // 1%
    uint256 public constant MAX_MUSD_SPREAD_BPS = 2000;  // 20%
    uint256 public constant MAX_KEEPER_BPS = 50;         // 0.5%
    uint256 public constant BPS_DENOMINATOR = 10_000;
    uint256 public constant SECONDS_PER_YEAR = 365 days;

    // --- Accumulated fees ---
    uint256 public totalPerformanceFees;
    uint256 public totalManagementFees;
    uint256 public totalMusdSpreadFees;
    uint256 public totalKeeperPaid;

    // --- Per-epoch tracking ---
    uint256 public currentEpochStart;
    uint256 public epochPerformanceFees;
    uint256 public epochManagementFees;
    uint256 public epochMusdSpreadFees;

    // --- Access control ---
    address public vault;

    // --- Withdrawal timelock ---
    uint256 public constant WITHDRAWAL_DELAY = 2 days;
    uint256 public pendingWithdrawalAmount;
    address public pendingWithdrawalTo;
    uint256 public withdrawalUnlockTime;

    // --- Events ---
    event PerformanceFeeCollected(uint256 amount, uint256 totalCollected);
    event ManagementFeeCollected(uint256 amount, uint256 totalCollected);
    event MusdSpreadCollected(uint256 amount, uint256 totalCollected);
    event KeeperPaid(address indexed keeper, uint256 amount);
    event FeesUpdated(uint256 performanceBps, uint256 managementBps, uint256 musdSpreadBps);
    event KeeperIncentiveUpdated(uint256 bps);
    event FeesWithdrawn(address indexed to, uint256 amount);
    event VaultUpdated(address indexed vault);
    event EpochReset(uint256 timestamp);

    error OnlyVault();
    error ExceedsFeeCap();
    error TransferFailed();
    error ZeroAddress();
    error WithdrawalNotReady();
    error NoWithdrawalPending();

    modifier onlyVault() {
        if (msg.sender != vault) revert OnlyVault();
        _;
    }

    constructor(
        address _owner,
        uint256 _performanceBps,
        uint256 _managementBps,
        uint256 _musdSpreadBps,
        uint256 _keeperBps
    ) Ownable(_owner) {
        if (_performanceBps > MAX_PERFORMANCE_BPS) revert ExceedsFeeCap();
        if (_managementBps > MAX_MANAGEMENT_BPS) revert ExceedsFeeCap();
        if (_musdSpreadBps > MAX_MUSD_SPREAD_BPS) revert ExceedsFeeCap();
        if (_keeperBps > MAX_KEEPER_BPS) revert ExceedsFeeCap();

        performanceFeeBps = _performanceBps;
        managementFeeBps = _managementBps;
        musdSpreadBps = _musdSpreadBps;
        keeperIncentiveBps = _keeperBps;
        currentEpochStart = block.timestamp;
    }

    // --- Fee collection (called by EarnVault) ---

    /// @notice Collect performance fee from compound yield
    /// @param amount The compound yield amount (before fee)
    /// @return fee The fee deducted
    function collectPerformanceFee(uint256 amount) external onlyVault returns (uint256 fee) {
        fee = (amount * performanceFeeBps) / BPS_DENOMINATOR;
        totalPerformanceFees += fee;
        epochPerformanceFees += fee;
        emit PerformanceFeeCollected(fee, totalPerformanceFees);
    }

    /// @notice Calculate and collect management fee on withdrawal
    /// @param btcLocked Total BTC that was locked
    /// @param duration Duration the BTC was locked (seconds)
    /// @return fee The management fee
    function collectManagementFee(uint256 btcLocked, uint256 duration) external onlyVault returns (uint256 fee) {
        fee = (btcLocked * managementFeeBps * duration) / (BPS_DENOMINATOR * SECONDS_PER_YEAR);
        totalManagementFees += fee;
        epochManagementFees += fee;
        emit ManagementFeeCollected(fee, totalManagementFees);
    }

    /// @notice Collect spread fee from MUSD yield
    /// @param netYield The net MUSD yield after borrow cost
    /// @return fee The spread fee
    function collectMusdSpread(uint256 netYield) external onlyVault returns (uint256 fee) {
        fee = (netYield * musdSpreadBps) / BPS_DENOMINATOR;
        totalMusdSpreadFees += fee;
        epochMusdSpreadFees += fee;
        emit MusdSpreadCollected(fee, totalMusdSpreadFees);
    }

    /// @notice Calculate keeper incentive for a compound
    /// @param compoundAmount The amount being compounded
    /// @return incentive The keeper reward
    function calculateKeeperIncentive(uint256 compoundAmount) external view returns (uint256 incentive) {
        incentive = (compoundAmount * keeperIncentiveBps) / BPS_DENOMINATOR;
    }

    /// @notice Record keeper payment
    /// @param keeper The keeper address
    /// @param amount The incentive paid
    function recordKeeperPayment(address keeper, uint256 amount) external onlyVault {
        totalKeeperPaid += amount;
        emit KeeperPaid(keeper, amount);
    }

    // --- Read functions ---

    /// @notice Get total fees collected across all categories
    function getTotalCollected()
        external
        view
        returns (uint256 performance, uint256 management, uint256 spread, uint256 total)
    {
        performance = totalPerformanceFees;
        management = totalManagementFees;
        spread = totalMusdSpreadFees;
        total = performance + management + spread;
    }

    /// @notice Get fees collected in current epoch
    function getCollectedThisEpoch()
        external
        view
        returns (uint256 performance, uint256 management, uint256 spread, uint256 total)
    {
        performance = epochPerformanceFees;
        management = epochManagementFees;
        spread = epochMusdSpreadFees;
        total = performance + management + spread;
    }

    /// @notice Reset epoch fee counters (called when new epoch starts)
    function resetEpoch() external onlyVault {
        epochPerformanceFees = 0;
        epochManagementFees = 0;
        epochMusdSpreadFees = 0;
        currentEpochStart = block.timestamp;
        emit EpochReset(block.timestamp);
    }

    // --- Admin ---

    /// @notice Update fee parameters
    function setFees(uint256 _performanceBps, uint256 _managementBps, uint256 _musdSpreadBps) external onlyOwner {
        if (_performanceBps > MAX_PERFORMANCE_BPS) revert ExceedsFeeCap();
        if (_managementBps > MAX_MANAGEMENT_BPS) revert ExceedsFeeCap();
        if (_musdSpreadBps > MAX_MUSD_SPREAD_BPS) revert ExceedsFeeCap();
        require(_performanceBps + _managementBps <= 200, "Aggregate fee cap 2%");

        performanceFeeBps = _performanceBps;
        managementFeeBps = _managementBps;
        musdSpreadBps = _musdSpreadBps;
        emit FeesUpdated(_performanceBps, _managementBps, _musdSpreadBps);
    }

    /// @notice Update keeper incentive
    function setKeeperIncentive(uint256 _bps) external onlyOwner {
        if (_bps > MAX_KEEPER_BPS) revert ExceedsFeeCap();
        keeperIncentiveBps = _bps;
        emit KeeperIncentiveUpdated(_bps);
    }

    /// @notice Set the vault address (one-time or update)
    function setVault(address _vault) external onlyOwner {
        if (_vault == address(0)) revert ZeroAddress();
        vault = _vault;
        emit VaultUpdated(_vault);
    }

    /// @notice Request fee withdrawal (starts 2-day timelock)
    function requestWithdrawal(address to) external onlyOwner {
        if (to == address(0)) revert ZeroAddress();
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");

        pendingWithdrawalAmount = balance;
        pendingWithdrawalTo = to;
        withdrawalUnlockTime = block.timestamp + WITHDRAWAL_DELAY;
        emit WithdrawalRequested(to, balance, withdrawalUnlockTime);
    }

    /// @notice Execute withdrawal after timelock expires
    function executeWithdrawal() external onlyOwner nonReentrant {
        if (pendingWithdrawalTo == address(0)) revert NoWithdrawalPending();
        if (block.timestamp < withdrawalUnlockTime) revert WithdrawalNotReady();

        address to = pendingWithdrawalTo;
        uint256 amount = pendingWithdrawalAmount;

        pendingWithdrawalTo = address(0);
        pendingWithdrawalAmount = 0;
        withdrawalUnlockTime = 0;

        (bool success,) = to.call{value: amount}("");
        if (!success) revert TransferFailed();
        emit FeesWithdrawn(to, amount);
    }

    /// @notice Cancel pending withdrawal
    function cancelWithdrawal() external onlyOwner {
        pendingWithdrawalTo = address(0);
        pendingWithdrawalAmount = 0;
        withdrawalUnlockTime = 0;
    }

    event WithdrawalRequested(address indexed to, uint256 amount, uint256 unlockTime);

    receive() external payable {}
}
