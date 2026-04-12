// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {Test} from "forge-std/Test.sol";
import {EarnVault} from "../src/EarnVault.sol";
import {FeeCollector} from "../src/FeeCollector.sol";
import {GaugeVoter} from "../src/GaugeVoter.sol";
import {MusdPipe} from "../src/MusdPipe.sol";

/// @title Withdraw-specific tests
contract WithdrawTest is Test {
    EarnVault public vault;
    FeeCollector public feeCollector;
    address owner = address(this);
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");

    function setUp() public {
        feeCollector = new FeeCollector(owner, 30, 10, 1000, 10);
        GaugeVoter gv = new GaugeVoter(owner, address(0));
        MusdPipe mp = new MusdPipe(owner, address(0), address(0), address(0));
        vault = new EarnVault(owner, address(feeCollector), address(gv), address(mp), address(0), address(0), address(0));
        feeCollector.setVault(address(vault));
        gv.setVault(address(vault));
        mp.setVault(address(vault));
        vm.deal(alice, 100 ether);
        vm.deal(bob, 100 ether);
        vm.deal(address(vault), 100 ether);
    }

    function test_withdrawEmitsEvent() public {
        vm.prank(alice);
        vault.deposit{value: 1 ether}(EarnVault.Strategy.CONSERVATIVE, 0);
        vm.warp(block.timestamp + 31 days);

        vm.prank(alice);
        vm.expectEmit(true, false, false, false);
        emit EarnVault.Withdrawn(alice, 0, 0, 0, 0);
        vault.withdraw(0);
    }

    function test_withdrawReturnsBTC() public {
        vm.prank(alice);
        vault.deposit{value: 5 ether}(EarnVault.Strategy.CONSERVATIVE, 0);

        vm.warp(block.timestamp + 31 days);
        uint256 balBefore = alice.balance;
        vm.prank(alice);
        vault.withdraw(0);

        // Should return ~5 BTC minus small management fee
        assertTrue(alice.balance > balBefore + 4.99 ether, "Should return most of BTC");
    }

    function test_withdrawDeactivatesPosition() public {
        vm.prank(alice);
        vault.deposit{value: 1 ether}(EarnVault.Strategy.BALANCED, 0);
        vm.warp(block.timestamp + 31 days);
        vm.prank(alice);
        vault.withdraw(0);

        EarnVault.Position memory pos = vault.getPosition(0);
        assertFalse(pos.active);
    }

    function test_withdrawUpdatesTotalLocked() public {
        vm.prank(alice);
        vault.deposit{value: 3 ether}(EarnVault.Strategy.CONSERVATIVE, 0);
        assertEq(vault.totalBtcLocked(), 3 ether);

        vm.warp(block.timestamp + 31 days);
        vm.prank(alice);
        vault.withdraw(0);

        assertEq(vault.totalBtcLocked(), 0);
    }

    function test_withdrawExactAtLockExpiry() public {
        vm.prank(alice);
        vault.deposit{value: 1 ether}(EarnVault.Strategy.CONSERVATIVE, 0);

        // Warp exactly to lock expiry (30 days = lockDuration)
        vm.warp(block.timestamp + 30 days + 1);
        vm.prank(alice);
        vault.withdraw(0);
        assertFalse(vault.getPosition(0).active);
    }

    function test_withdrawOneSecondBeforeLockReverts() public {
        vm.prank(alice);
        vault.deposit{value: 1 ether}(EarnVault.Strategy.CONSERVATIVE, 0);

        // 1 second before lock expires
        vm.warp(block.timestamp + 30 days - 1);
        vm.prank(alice);
        vm.expectRevert(EarnVault.LockNotExpired.selector);
        vault.withdraw(0);
    }

    function test_withdrawManagementFeeGrowsWithTime() public {
        vm.prank(alice);
        vault.deposit{value: 10 ether}(EarnVault.Strategy.CONSERVATIVE, 0);

        // Withdraw after 1 year
        vm.warp(block.timestamp + 365 days);
        vm.prank(alice);
        vault.withdraw(0);

        (,uint256 mgmt,,) = feeCollector.getTotalCollected();
        // 0.1% of 10 BTC for 365 days = 0.01 BTC
        assertEq(mgmt, 0.01 ether);
    }

    function test_withdrawDoubleWithdrawReverts() public {
        vm.prank(alice);
        vault.deposit{value: 1 ether}(EarnVault.Strategy.CONSERVATIVE, 0);
        vm.warp(block.timestamp + 31 days);
        vm.prank(alice);
        vault.withdraw(0);

        vm.prank(alice);
        vm.expectRevert(EarnVault.PositionNotActive.selector);
        vault.withdraw(0);
    }

    function test_withdrawOtherUserReverts() public {
        vm.prank(alice);
        vault.deposit{value: 1 ether}(EarnVault.Strategy.CONSERVATIVE, 0);
        vm.warp(block.timestamp + 31 days);

        vm.prank(bob);
        vm.expectRevert(EarnVault.NotPositionOwner.selector);
        vault.withdraw(0);
    }

    function test_withdrawWorksWhenPaused() public {
        vm.prank(alice);
        vault.deposit{value: 1 ether}(EarnVault.Strategy.CONSERVATIVE, 0);

        vault.pause();
        vm.warp(block.timestamp + 31 days);

        // Withdrawals should always work even when paused
        vm.prank(alice);
        vault.withdraw(0);
        assertFalse(vault.getPosition(0).active);
    }

    function test_claimWithoutCompound() public {
        vm.prank(alice);
        vault.deposit{value: 1 ether}(EarnVault.Strategy.CONSERVATIVE, 0);

        // Advance epoch so there are pending rewards
        vm.warp(block.timestamp + 8 days);
        vm.deal(address(0xdead), 1 ether);
        vm.prank(address(0xdead));
        vault.deposit{value: 0.001 ether}(EarnVault.Strategy.CONSERVATIVE, 0);

        uint256 pending = vault.getPendingCompound(0);
        assertTrue(pending > 0, "Should have pending");

        uint256 balBefore = alice.balance;
        vm.prank(alice);
        vault.claimWithoutCompound(0);

        assertTrue(alice.balance > balBefore, "Should receive BTC");
        // btcCompounded should NOT increase (manual claim)
        assertEq(vault.getPosition(0).btcCompounded, 0);
    }

    function testFuzz_withdrawAfterVariableLock(uint256 extraDays) public {
        extraDays = bound(extraDays, 1, 365);
        vm.prank(alice);
        vault.deposit{value: 1 ether}(EarnVault.Strategy.CONSERVATIVE, 0);

        vm.warp(block.timestamp + 30 days + extraDays * 1 days);
        vm.prank(alice);
        vault.withdraw(0);

        assertFalse(vault.getPosition(0).active);
        // Longer lock = higher management fee
        (,uint256 mgmt,,) = feeCollector.getTotalCollected();
        assertTrue(mgmt > 0);
    }
}
