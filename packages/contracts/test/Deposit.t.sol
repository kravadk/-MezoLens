// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {Test} from "forge-std/Test.sol";
import {EarnVault} from "../src/EarnVault.sol";
import {FeeCollector} from "../src/FeeCollector.sol";
import {GaugeVoter} from "../src/GaugeVoter.sol";
import {MusdPipe} from "../src/MusdPipe.sol";

/// @title Deposit-specific tests (supplements EarnVaultTest)
contract DepositTest is Test {
    EarnVault public vault;
    address owner = address(this);
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");

    function setUp() public {
        FeeCollector fc = new FeeCollector(owner, 30, 10, 1000, 10);
        GaugeVoter gv = new GaugeVoter(owner, address(0));
        MusdPipe mp = new MusdPipe(owner, address(0), address(0), address(0));
        vault = new EarnVault(owner, address(fc), address(gv), address(mp), address(0), address(0), address(0));
        fc.setVault(address(vault));
        gv.setVault(address(vault));
        mp.setVault(address(vault));
        vm.deal(alice, 100 ether);
        vm.deal(bob, 100 ether);
        vm.deal(address(vault), 100 ether);
    }

    function test_depositEmitsEvent() public {
        vm.prank(alice);
        vm.expectEmit(true, false, false, true);
        emit EarnVault.Deposited(alice, EarnVault.Strategy.CONSERVATIVE, 1 ether, 0, 0);
        vault.deposit{value: 1 ether}(EarnVault.Strategy.CONSERVATIVE, 0);
    }

    function test_depositSetsLockTimestamp() public {
        vm.prank(alice);
        vault.deposit{value: 1 ether}(EarnVault.Strategy.CONSERVATIVE, 0);
        EarnVault.Position memory pos = vault.getPosition(0);
        assertEq(pos.lockStart, block.timestamp);
        assertEq(pos.lockDuration, 30 days);
    }

    function test_depositSetsLastCompoundEpoch() public {
        vm.prank(alice);
        vault.deposit{value: 1 ether}(EarnVault.Strategy.BALANCED, 0);
        EarnVault.Position memory pos = vault.getPosition(0);
        assertEq(pos.lastCompoundEpoch, vault.currentEpoch());
    }

    function test_depositIncreasesNextPositionId() public {
        vm.prank(alice);
        vault.deposit{value: 1 ether}(EarnVault.Strategy.CONSERVATIVE, 0);
        assertEq(vault.nextPositionId(), 1);
        vm.prank(alice);
        vault.deposit{value: 1 ether}(EarnVault.Strategy.BALANCED, 0);
        assertEq(vault.nextPositionId(), 2);
    }

    function test_depositTracksUserPositionIds() public {
        vm.startPrank(alice);
        vault.deposit{value: 0.5 ether}(EarnVault.Strategy.CONSERVATIVE, 0);
        vault.deposit{value: 0.3 ether}(EarnVault.Strategy.BALANCED, 0);
        vault.deposit{value: 0.2 ether}(EarnVault.Strategy.AGGRESSIVE, 0);
        vm.stopPrank();

        uint256[] memory ids = vault.getUserPositionIds(alice);
        assertEq(ids.length, 3);
        assertEq(ids[0], 0);
        assertEq(ids[1], 1);
        assertEq(ids[2], 2);
    }

    function test_depositMultiUserIsolation() public {
        vm.prank(alice);
        vault.deposit{value: 2 ether}(EarnVault.Strategy.AGGRESSIVE, 0);
        vm.prank(bob);
        vault.deposit{value: 1 ether}(EarnVault.Strategy.CONSERVATIVE, 0);

        assertEq(vault.getUserPositionIds(alice).length, 1);
        assertEq(vault.getUserPositionIds(bob).length, 1);
        assertEq(vault.getPosition(0).user, alice);
        assertEq(vault.getPosition(1).user, bob);
    }

    function test_depositAggressiveTriggersGaugeVote() public {
        vm.prank(alice);
        vault.deposit{value: 1 ether}(EarnVault.Strategy.AGGRESSIVE, 0);
        // No revert means gauge vote succeeded
        assertTrue(vault.getPosition(0).active);
    }

    function test_depositWhenPausedReverts() public {
        vault.pause();
        vm.prank(alice);
        vm.expectRevert();
        vault.deposit{value: 1 ether}(EarnVault.Strategy.CONSERVATIVE, 0);
    }

    function test_depositZeroValueReverts() public {
        vm.prank(alice);
        vm.expectRevert(EarnVault.BelowMinimumDeposit.selector);
        vault.deposit{value: 0}(EarnVault.Strategy.CONSERVATIVE, 0);
    }

    function test_depositExactMinimum() public {
        vm.prank(alice);
        vault.deposit{value: 0.001 ether}(EarnVault.Strategy.CONSERVATIVE, 0);
        assertTrue(vault.getPosition(0).active);
    }

    function testFuzz_depositStrategyBoost(uint8 strategyRaw) public {
        strategyRaw = uint8(bound(strategyRaw, 0, 2));
        EarnVault.Strategy strategy = EarnVault.Strategy(strategyRaw);
        uint256 expectedBoost = strategy == EarnVault.Strategy.AGGRESSIVE ? 500 : strategy == EarnVault.Strategy.BALANCED ? 200 : 100;

        vm.prank(alice);
        vault.deposit{value: 1 ether}(strategy, 0);
        assertEq(vault.getPosition(0).boostMultiplier, expectedBoost);
    }
}
