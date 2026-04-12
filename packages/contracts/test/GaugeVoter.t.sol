// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {Test} from "forge-std/Test.sol";
import {GaugeVoter} from "../src/GaugeVoter.sol";

contract GaugeVoterTest is Test {
    GaugeVoter public voter;
    address owner = address(this);
    address vault = makeAddr("vault");

    function setUp() public {
        voter = new GaugeVoter(owner, address(0)); // mock mode
        voter.setVault(vault);
    }

    function test_getActiveGaugesReturnsData() public view {
        GaugeVoter.MockGauge[] memory gauges = voter.getActiveGauges();
        assertEq(gauges.length, 3); // 3 default mock gauges
    }

    function test_getBestGaugeSelectsHighestAPR() public view {
        (address best, uint256 bestApr) = voter.getBestGauge();
        assertEq(best, address(0x1001)); // highest APR mock gauge
        assertEq(bestApr, 1240); // 12.4%
    }

    function test_getBestGaugeAfterAPRChange() public {
        // Make gauge 0x1002 the best
        voter.setMockGaugeAPR(address(0x1002), 1500); // 15%

        (address best, uint256 bestApr) = voter.getBestGauge();
        assertEq(best, address(0x1002));
        assertEq(bestApr, 1500);
    }

    function test_voteForBest() public {
        vm.prank(vault);
        voter.voteForBest(1 ether, 1);

        assertEq(voter.lastVotedGauge(), address(0x1001));
        assertEq(voter.lastVoteEpoch(), 1);
    }

    function test_voteForBestEmitsEvent() public {
        vm.prank(vault);
        vm.expectEmit(true, false, false, true);
        emit GaugeVoter.GaugeVoted(address(0x1001), 1 ether, 1);
        voter.voteForBest(1 ether, 1);
    }

    function test_revoteWhenBestGaugeChanges() public {
        vm.prank(vault);
        voter.voteForBest(1 ether, 1);
        assertEq(voter.lastVotedGauge(), address(0x1001));

        voter.setMockGaugeAPR(address(0x1003), 2000);

        vm.prank(vault);
        voter.voteForBest(1 ether, 2);
        assertEq(voter.lastVotedGauge(), address(0x1003));
    }

    function test_noopWhenBestGaugeSame() public {
        vm.prank(vault);
        voter.voteForBest(1 ether, 1);

        vm.prank(vault);
        voter.voteForBest(1 ether, 2);

        assertEq(voter.lastVotedGauge(), address(0x1001)); // Same gauge
        assertEq(voter.lastVoteEpoch(), 2);
    }

    function test_addMockGauge() public {
        voter.addMockGauge(address(0x1004), address(0x2004), 900);

        GaugeVoter.MockGauge[] memory gauges = voter.getActiveGauges();
        assertEq(gauges.length, 4);
    }

    function test_deactivateGauge() public {
        voter.setMockGaugeAlive(address(0x1001), false);

        GaugeVoter.MockGauge[] memory gauges = voter.getActiveGauges();
        assertEq(gauges.length, 2);
    }

    function test_onlyVaultCanVote() public {
        vm.prank(address(0xbad));
        vm.expectRevert(GaugeVoter.OnlyVault.selector);
        voter.voteForBest(1 ether, 1);
    }

    function testFuzz_gaugeAPRInputs(uint256 apr1, uint256 apr2) public {
        apr1 = bound(apr1, 1, 10000);
        apr2 = bound(apr2, 1, 10000);

        voter.setMockGaugeAPR(address(0x1001), apr1);
        voter.setMockGaugeAPR(address(0x1002), apr2);

        (address best, uint256 bestApr) = voter.getBestGauge();
        assertTrue(bestApr >= apr1 || bestApr >= apr2);
        assertTrue(best != address(0));
    }

    function testFuzz_gaugeAPRInputsWithThird(uint256 apr) public {
        apr = bound(apr, 1, 50000);
        voter.setMockGaugeAPR(address(0x1003), apr);

        (address best, uint256 bestApr) = voter.getBestGauge();
        assertTrue(best != address(0));
        assertTrue(bestApr > 0);
    }
}
