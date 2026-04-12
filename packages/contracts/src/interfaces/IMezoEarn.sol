// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

/// @title IMezoEarn - Interface for Mezo Earn epoch and fee system
/// @notice Read epoch data and protocol fee accumulators
interface IMezoEarn {
    struct EpochInfo {
        uint256 number;
        uint256 startTime;
        uint256 endTime;
        uint256 totalFees;
    }

    struct FeeBreakdown {
        uint256 swapFees;
        uint256 borrowFees;
        uint256 bridgeFees;
        uint256 totalFees;
    }

    /// @notice Get current epoch info
    /// @return info Current epoch details
    function getCurrentEpoch() external view returns (EpochInfo memory info);

    /// @notice Get epoch info by number
    /// @param epochNumber The epoch number to query
    /// @return info Epoch details
    function getEpoch(uint256 epochNumber) external view returns (EpochInfo memory info);

    /// @notice Get accumulated fee breakdown for current epoch
    /// @return breakdown Fee breakdown by source
    function getFeeBreakdown() external view returns (FeeBreakdown memory breakdown);

    /// @notice Get the epoch duration in seconds
    /// @return duration Epoch duration
    function epochDuration() external view returns (uint256 duration);

    /// @notice Check if a new epoch has started since the given epoch number
    /// @param lastEpoch The last known epoch number
    /// @return hasNew True if current epoch > lastEpoch
    function hasNewEpoch(uint256 lastEpoch) external view returns (bool hasNew);
}
