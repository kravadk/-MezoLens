// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

/// @title IGaugeController - Interface for Mezo Gauge Voting (PoolsVoter)
/// @notice Vote on gauges to direct emissions and earn boosted rewards
interface IGaugeController {
    struct GaugeInfo {
        address gauge;
        address pool;
        uint256 weight;
        uint256 apr;
        bool isAlive;
    }

    /// @notice Vote for a gauge with given weight
    /// @param gauge Address of the gauge to vote for
    /// @param weight Voting weight to allocate
    function vote(address gauge, uint256 weight) external;

    /// @notice Reset votes for the caller
    function reset() external;

    /// @notice Get all active gauges
    /// @return gauges Array of active gauge addresses
    function getActiveGauges() external view returns (address[] memory gauges);

    /// @notice Get gauge info
    /// @param gauge Address of the gauge
    /// @return info Gauge details including weight and APR
    function getGaugeInfo(address gauge) external view returns (GaugeInfo memory info);

    /// @notice Get the total voting weight across all gauges
    /// @return totalWeight Sum of all gauge weights
    function totalWeight() external view returns (uint256 totalWeight);

    /// @notice Get the weight allocated to a specific gauge
    /// @param gauge Address of the gauge
    /// @return weight Current weight of the gauge
    function gaugeWeight(address gauge) external view returns (uint256 weight);

    /// @notice Check if a gauge is alive (active)
    /// @param gauge Address of the gauge
    /// @return alive True if gauge is active
    function isAlive(address gauge) external view returns (bool alive);

    /// @notice Create a gauge for a pool
    /// @param poolFactory Factory that created the pool
    /// @param pool Pool address
    function createPoolGauge(address poolFactory, address pool) external;
}
