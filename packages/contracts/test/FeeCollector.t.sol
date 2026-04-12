// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {Test} from "forge-std/Test.sol";
import {FeeCollector} from "../src/FeeCollector.sol";

contract FeeCollectorTest is Test {
    FeeCollector public fc;
    address owner = address(this);
    address vault = makeAddr("vault");
    address treasury = makeAddr("treasury");

    function setUp() public {
        fc = new FeeCollector(owner, 30, 10, 1000, 10);
        fc.setVault(vault);
        vm.deal(address(fc), 10 ether);
    }

    function test_performanceFeeAccuracy() public {
        vm.prank(vault);
        uint256 fee = fc.collectPerformanceFee(1 ether);
        assertEq(fee, 0.003 ether); // 30 bps = 0.3%
    }

    function test_performanceFeeSmallAmount() public {
        vm.prank(vault);
        uint256 fee = fc.collectPerformanceFee(0.01 ether);
        assertEq(fee, 0.00003 ether);
    }

    function test_managementFeeProRata() public {
        vm.prank(vault);
        uint256 fee = fc.collectManagementFee(10 ether, 365 days);
        assertEq(fee, 0.01 ether); // 10 bps annual on 10 BTC
    }

    function test_managementFeeHalfYear() public {
        vm.prank(vault);
        uint256 fee = fc.collectManagementFee(10 ether, 182.5 days);
        assertEq(fee, 0.005 ether);
    }

    function test_musdSpreadCalculation() public {
        vm.prank(vault);
        uint256 fee = fc.collectMusdSpread(1 ether);
        assertEq(fee, 0.1 ether); // 1000 bps = 10%
    }

    function test_musdSpreadSmall() public {
        vm.prank(vault);
        uint256 fee = fc.collectMusdSpread(0.05 ether);
        assertEq(fee, 0.005 ether);
    }

    function test_totalCollectedTracking() public {
        vm.startPrank(vault);
        fc.collectPerformanceFee(1 ether);
        fc.collectManagementFee(10 ether, 365 days);
        fc.collectMusdSpread(0.5 ether);
        vm.stopPrank();

        (uint256 perf, uint256 mgmt, uint256 spread, uint256 total) = fc.getTotalCollected();
        assertEq(perf, 0.003 ether);
        assertEq(mgmt, 0.01 ether);
        assertEq(spread, 0.05 ether);
        assertEq(total, perf + mgmt + spread);
    }

    function test_withdrawFeesTimelocked() public {
        // Request withdrawal
        fc.requestWithdrawal(treasury);

        // Cannot execute before delay
        vm.expectRevert(FeeCollector.WithdrawalNotReady.selector);
        fc.executeWithdrawal();

        // Warp past delay
        vm.warp(block.timestamp + 2 days + 1);
        fc.executeWithdrawal();
        assertEq(treasury.balance, 10 ether);
    }

    function test_feeCapsEnforcedPerformance() public {
        vm.expectRevert(FeeCollector.ExceedsFeeCap.selector);
        fc.setFees(501, 10, 1000); // > MAX_PERFORMANCE_BPS (500)
    }

    function test_feeCapsEnforcedManagement() public {
        vm.expectRevert(FeeCollector.ExceedsFeeCap.selector);
        fc.setFees(30, 101, 1000); // > MAX_MANAGEMENT_BPS (100)
    }

    function test_feeCapsEnforcedMusdSpread() public {
        vm.expectRevert(FeeCollector.ExceedsFeeCap.selector);
        fc.setFees(30, 10, 2001); // > MAX_MUSD_SPREAD_BPS (2000)
    }

    function test_keeperIncentiveCap() public {
        vm.expectRevert(FeeCollector.ExceedsFeeCap.selector);
        fc.setKeeperIncentive(51); // > MAX_KEEPER_BPS (50)
    }

    function test_onlyVaultCanCollect() public {
        vm.prank(address(0xbad));
        vm.expectRevert(FeeCollector.OnlyVault.selector);
        fc.collectPerformanceFee(1 ether);
    }

    function test_setVaultZeroAddressReverts() public {
        vm.expectRevert(FeeCollector.ZeroAddress.selector);
        fc.setVault(address(0));
    }

    function test_epochResetClearsCounters() public {
        vm.startPrank(vault);
        fc.collectPerformanceFee(1 ether);
        fc.resetEpoch();
        vm.stopPrank();

        (uint256 perf,,,) = fc.getCollectedThisEpoch();
        assertEq(perf, 0);
    }
}
