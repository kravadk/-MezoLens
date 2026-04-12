// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

/// @title IVeMEZO - Interface for Mezo vote-escrowed MEZO
/// @notice Lock MEZO tokens to receive veMEZO for boost multiplier
interface IVeMEZO {
    struct LockInfo {
        uint256 amount;
        uint256 unlockTime;
        uint256 boostMultiplier; // 100 = 1x, 200 = 2x, 500 = 5x
    }

    /// @notice Lock MEZO tokens to receive veMEZO and boost
    /// @param amount Amount of MEZO tokens to lock
    /// @param duration Lock duration in seconds
    function lock(uint256 amount, uint256 duration) external;

    /// @notice Increase locked MEZO amount
    /// @param additionalAmount Additional MEZO to lock
    function increaseLock(uint256 additionalAmount) external;

    /// @notice Unlock expired veMEZO and withdraw MEZO
    function unlock() external;

    /// @notice Get current boost multiplier for an account
    /// @param account The address to check
    /// @return multiplier Boost multiplier (100 = 1x, 500 = 5x)
    function getBoost(address account) external view returns (uint256 multiplier);

    /// @notice Get lock info for an account
    /// @param account The address to check
    /// @return info The lock details including boost
    function getLock(address account) external view returns (LockInfo memory info);

    /// @notice Get veMEZO balance (voting power)
    /// @param account The address to check
    /// @return balance The veMEZO balance
    function balanceOf(address account) external view returns (uint256 balance);

    /// @notice MEZO token address
    function mezoToken() external view returns (address);
}
