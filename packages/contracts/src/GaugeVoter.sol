// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IGaugeController} from "./interfaces/IGaugeController.sol";

/// @title GaugeVoter - Auto-votes on optimal gauge for aggressive strategy
/// @notice Analyzes gauges and votes on the highest-APR option
/// @dev Uses mock gauge data when Mezo gauge precompiles are unavailable
contract GaugeVoter is Ownable {
    // --- State ---
    IGaugeController public gaugeController;
    address public vault;

    // --- Mock gauge data (fallback when precompiles unavailable) ---
    struct MockGauge {
        address gauge;
        address pool;
        uint256 weight;
        uint256 apr; // basis points (e.g., 1200 = 12%)
        bool isAlive;
    }

    MockGauge[] public mockGauges;
    mapping(address => uint256) public mockGaugeIndex;
    bool public useMockData;

    address public lastVotedGauge;
    uint256 public lastVoteEpoch;

    // --- Events ---
    event GaugeVoted(address indexed gauge, uint256 weight, uint256 epoch);
    event BestGaugeChanged(address indexed oldGauge, address indexed newGauge, uint256 newApr);
    event MockGaugeAdded(address indexed gauge, uint256 apr);
    event VaultUpdated(address indexed vault);

    error OnlyVault();
    error NoActiveGauges();
    error ZeroAddress();

    modifier onlyVault() {
        if (msg.sender != vault) revert OnlyVault();
        _;
    }

    constructor(address _owner, address _gaugeController) Ownable(_owner) {
        if (_gaugeController != address(0)) {
            gaugeController = IGaugeController(_gaugeController);
        } else {
            useMockData = true;
            _initMockGauges();
        }
    }

    // --- Core functions ---

    /// @notice Get all active gauges with their APRs
    /// @return gauges Array of mock gauge structs
    function getActiveGauges() external view returns (MockGauge[] memory gauges) {
        if (useMockData) {
            uint256 count;
            for (uint256 i; i < mockGauges.length; i++) {
                if (mockGauges[i].isAlive) count++;
            }
            gauges = new MockGauge[](count);
            uint256 idx;
            for (uint256 i; i < mockGauges.length; i++) {
                if (mockGauges[i].isAlive) {
                    gauges[idx++] = mockGauges[i];
                }
            }
            return gauges;
        }
        // Real implementation would query gaugeController
        revert NoActiveGauges();
    }

    /// @notice Get APR for a specific gauge
    /// @param gauge The gauge address
    /// @return apr APR in basis points
    function getGaugeAPR(address gauge) external view returns (uint256 apr) {
        if (useMockData) {
            uint256 idx = mockGaugeIndex[gauge];
            if (idx < mockGauges.length && mockGauges[idx].gauge == gauge) {
                return mockGauges[idx].apr;
            }
            return 0;
        }
        // Real: query gauge controller
        return 0;
    }

    /// @notice Find the gauge with highest APR
    /// @return bestGauge Address of the best gauge
    /// @return bestApr APR of the best gauge
    function getBestGauge() public view returns (address bestGauge, uint256 bestApr) {
        if (useMockData) {
            for (uint256 i; i < mockGauges.length; i++) {
                if (mockGauges[i].isAlive && mockGauges[i].apr > bestApr) {
                    bestApr = mockGauges[i].apr;
                    bestGauge = mockGauges[i].gauge;
                }
            }
            return (bestGauge, bestApr);
        }
        // Real implementation would iterate gaugeController.getActiveGauges()
        revert NoActiveGauges();
    }

    /// @notice Vote on the best gauge with given weight
    /// @param veBtcWeight The veBTC weight to vote with
    /// @param epoch Current epoch number
    function voteForBest(uint256 veBtcWeight, uint256 epoch) external onlyVault {
        (address best, uint256 bestApr) = getBestGauge();
        if (best == address(0)) revert NoActiveGauges();

        // Only re-vote if gauge changed or new epoch
        if (best != lastVotedGauge) {
            emit BestGaugeChanged(lastVotedGauge, best, bestApr);
        }

        if (!useMockData) {
            gaugeController.vote(best, veBtcWeight);
        }

        lastVotedGauge = best;
        lastVoteEpoch = epoch;
        emit GaugeVoted(best, veBtcWeight, epoch);
    }

    // --- Admin ---

    function setVault(address _vault) external onlyOwner {
        if (_vault == address(0)) revert ZeroAddress();
        vault = _vault;
        emit VaultUpdated(_vault);
    }

    function addMockGauge(address _gauge, address _pool, uint256 _apr) external onlyOwner {
        mockGaugeIndex[_gauge] = mockGauges.length;
        mockGauges.push(MockGauge({
            gauge: _gauge,
            pool: _pool,
            weight: 0,
            apr: _apr,
            isAlive: true
        }));
        emit MockGaugeAdded(_gauge, _apr);
    }

    function setMockGaugeAPR(address _gauge, uint256 _apr) external onlyOwner {
        uint256 idx = mockGaugeIndex[_gauge];
        require(idx < mockGauges.length && mockGauges[idx].gauge == _gauge, "Gauge not found");
        mockGauges[idx].apr = _apr;
    }

    function setMockGaugeAlive(address _gauge, bool _alive) external onlyOwner {
        uint256 idx = mockGaugeIndex[_gauge];
        require(idx < mockGauges.length && mockGauges[idx].gauge == _gauge, "Gauge not found");
        mockGauges[idx].isAlive = _alive;
    }

    // --- Internal ---

    function _initMockGauges() internal {
        // Default mock gauges for testnet
        mockGauges.push(MockGauge({
            gauge: address(0x1001),
            pool: address(0x2001),
            weight: 4500,
            apr: 1240, // 12.4%
            isAlive: true
        }));
        mockGaugeIndex[address(0x1001)] = 0;

        mockGauges.push(MockGauge({
            gauge: address(0x1002),
            pool: address(0x2002),
            weight: 3200,
            apr: 980, // 9.8%
            isAlive: true
        }));
        mockGaugeIndex[address(0x1002)] = 1;

        mockGauges.push(MockGauge({
            gauge: address(0x1003),
            pool: address(0x2003),
            weight: 2300,
            apr: 720, // 7.2%
            isAlive: true
        }));
        mockGaugeIndex[address(0x1003)] = 2;
    }
}
