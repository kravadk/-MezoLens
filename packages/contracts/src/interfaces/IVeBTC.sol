// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

/// @title IVeBTC - Interface for Mezo vote-escrowed BTC
/// @notice Lock BTC to receive veBTC, earning protocol fees
interface IVeBTC {
    struct LockInfo {
        uint256 amount;
        uint256 unlockTime;
        uint256 weight;
    }

    /// @notice Lock BTC for a duration to receive veBTC
    /// @param duration Lock duration in seconds (max 30 days)
    function lock(uint256 duration) external payable;

    /// @notice Increase lock amount by adding more BTC
    function increaseLock() external payable;

    /// @notice Extend the lock duration
    /// @param newDuration New total lock duration in seconds
    function extendLock(uint256 newDuration) external;

    /// @notice Unlock expired veBTC and withdraw BTC
    function unlock() external;

    /// @notice Claim pending BTC rewards from protocol fees
    /// @return amount The amount of BTC rewards claimed
    function claimRewards() external returns (uint256 amount);

    /// @notice Get pending rewards for an account
    /// @param account The address to check
    /// @return amount Pending BTC rewards
    function pendingRewards(address account) external view returns (uint256 amount);

    /// @notice Get lock info for an account
    /// @param account The address to check
    /// @return info The lock details
    function getLock(address account) external view returns (LockInfo memory info);

    /// @notice Get the veBTC weight (voting power) for an account
    /// @param account The address to check
    /// @return weight The current voting weight
    function balanceOf(address account) external view returns (uint256 weight);

    /// @notice Get total veBTC supply (total voting weight)
    /// @return totalWeight Total voting weight across all locks
    function totalSupply() external view returns (uint256 totalWeight);
}
