// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {Test} from "forge-std/Test.sol";
import {EarnVault} from "../src/EarnVault.sol";
import {FeeCollector} from "../src/FeeCollector.sol";
import {GaugeVoter} from "../src/GaugeVoter.sol";
import {MusdPipe} from "../src/MusdPipe.sol";

/// @title Strategy-specific tests
contract StrategyTest is Test {
    EarnVault public vault;
    FeeCollector public feeCollector;

    address owner = address(this);
    address alice = makeAddr("alice");

    function setUp() public {
        feeCollector = new FeeCollector(owner, 30, 10, 1000, 10);
        GaugeVoter gaugeVoter = new GaugeVoter(owner, address(0));
        MusdPipe musdPipe = new MusdPipe(owner, address(0), address(0), address(0));
        vault = new EarnVault(owner, address(feeCollector), address(gaugeVoter), address(musdPipe), address(0), address(0), address(0));
        feeCollector.setVault(address(vault));
        gaugeVoter.setVault(address(vault));
        musdPipe.setVault(address(vault));
        vm.deal(alice, 100 ether);
        vm.deal(address(vault), 100 ether);
    }

    function test_conservativeAPRLowest() public view {
        uint256 conservative = vault.getEstimatedAPR(EarnVault.Strategy.CONSERVATIVE);
        uint256 balanced = vault.getEstimatedAPR(EarnVault.Strategy.BALANCED);
        assertTrue(conservative < balanced, "Conservative APR should be lowest");
    }

    function test_aggressiveAPRHighest() public view {
        uint256 balanced = vault.getEstimatedAPR(EarnVault.Strategy.BALANCED);
        uint256 aggressive = vault.getEstimatedAPR(EarnVault.Strategy.AGGRESSIVE);
        assertTrue(aggressive > balanced, "Aggressive APR should be highest");
    }

    function test_boostMultiplierConservative() public {
        vm.prank(alice);
        vault.deposit{value: 1 ether}(EarnVault.Strategy.CONSERVATIVE, 0);
        assertEq(vault.getPosition(0).boostMultiplier, 100);
    }

    function test_boostMultiplierBalanced() public {
        vm.prank(alice);
        vault.deposit{value: 1 ether}(EarnVault.Strategy.BALANCED, 0);
        assertEq(vault.getPosition(0).boostMultiplier, 200);
    }

    function test_boostMultiplierAggressive() public {
        vm.prank(alice);
        vault.deposit{value: 1 ether}(EarnVault.Strategy.AGGRESSIVE, 0);
        assertEq(vault.getPosition(0).boostMultiplier, 500);
    }

    function test_aggressiveCompoundsMoreThanConservative() public {
        // Deposit same amount in both strategies
        vm.prank(alice);
        vault.deposit{value: 1 ether}(EarnVault.Strategy.CONSERVATIVE, 0);
        vm.prank(alice);
        vault.deposit{value: 1 ether}(EarnVault.Strategy.AGGRESSIVE, 0);

        // Advance epoch
        vm.warp(block.timestamp + 8 days);
        vm.deal(address(0xdead), 1 ether);
        vm.prank(address(0xdead));
        vault.deposit{value: 0.001 ether}(EarnVault.Strategy.CONSERVATIVE, 0);

        uint256 pendingConservative = vault.getPendingCompound(0);
        uint256 pendingAggressive = vault.getPendingCompound(1);

        assertTrue(pendingAggressive > pendingConservative, "Aggressive should earn more");
        // Aggressive (5x) should earn 5x more than conservative (1x)
        assertEq(pendingAggressive, pendingConservative * 5);
    }

    function test_musdYieldOnlyForBalancedAggressive() public {
        vm.prank(alice);
        vault.deposit{value: 1 ether}(EarnVault.Strategy.CONSERVATIVE, 0);
        vm.prank(alice);
        vault.deposit{value: 1 ether}(EarnVault.Strategy.BALANCED, 0);

        // Conservative should fail
        vm.prank(alice);
        vm.expectRevert(EarnVault.InvalidStrategy.selector);
        vault.enableMusdYield(0, 2000);

        // Balanced should work
        vm.prank(alice);
        vault.enableMusdYield(1, 2000);
        assertEq(vault.getPosition(1).musdPercent, 2000);
    }

    function test_musdPercentBounds() public {
        vm.prank(alice);
        vault.deposit{value: 1 ether}(EarnVault.Strategy.AGGRESSIVE, 0);

        // 0% should fail
        vm.prank(alice);
        vm.expectRevert(EarnVault.InvalidMusdPercent.selector);
        vault.enableMusdYield(0, 0);

        // >50% should fail
        vm.prank(alice);
        vm.expectRevert(EarnVault.InvalidMusdPercent.selector);
        vault.enableMusdYield(0, 5001);

        // 50% should work
        vm.prank(alice);
        vault.enableMusdYield(0, 5000);
        assertEq(vault.getPosition(0).musdPercent, 5000);
    }
}
