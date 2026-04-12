// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {Test, console} from "forge-std/Test.sol";
import {EarnVault} from "../src/EarnVault.sol";
import {FeeCollector} from "../src/FeeCollector.sol";
import {GaugeVoter} from "../src/GaugeVoter.sol";
import {MusdPipe} from "../src/MusdPipe.sol";

contract EarnVaultTest is Test {
    EarnVault public vault;
    FeeCollector public feeCollector;
    GaugeVoter public gaugeVoter;
    MusdPipe public musdPipe;

    address owner = address(this);
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");
    address keeper = makeAddr("keeper");

    uint256 constant MIN_BTC = 0.000001 ether;
    uint256 constant ONE_BTC = 1 ether;

    function setUp() public {
        feeCollector = new FeeCollector(owner, 30, 10, 1000, 10);
        gaugeVoter = new GaugeVoter(owner, address(0));
        musdPipe = new MusdPipe(owner, address(0), address(0), address(0));

        vault = new EarnVault(
            owner,
            address(feeCollector),
            address(gaugeVoter),
            address(musdPipe),
            address(0), address(0), address(0)
        );

        feeCollector.setVault(address(vault));
        gaugeVoter.setVault(address(vault));
        musdPipe.setVault(address(vault));

        vm.deal(alice, 100 ether);
        vm.deal(bob, 100 ether);
        vm.deal(keeper, 10 ether);
        vm.deal(address(vault), 100 ether); // fund vault for rewards
    }

    // ═══════ DEPOSIT TESTS ═══════

    function test_depositConservative() public {
        vm.prank(alice);
        vault.deposit{value: ONE_BTC}(EarnVault.Strategy.CONSERVATIVE, 0);

        EarnVault.Position memory pos = vault.getPosition(0);
        assertEq(pos.user, alice);
        assertEq(pos.btcDeposited, ONE_BTC);
        assertEq(pos.boostMultiplier, 100);
        assertTrue(pos.active);
        assertEq(uint256(pos.strategy), uint256(EarnVault.Strategy.CONSERVATIVE));
    }

    function test_depositBalanced() public {
        vm.prank(alice);
        vault.deposit{value: ONE_BTC}(EarnVault.Strategy.BALANCED, 0);

        EarnVault.Position memory pos = vault.getPosition(0);
        assertEq(pos.boostMultiplier, 200);
    }

    function test_depositAggressive() public {
        vm.prank(alice);
        vault.deposit{value: ONE_BTC}(EarnVault.Strategy.AGGRESSIVE, 0);

        EarnVault.Position memory pos = vault.getPosition(0);
        assertEq(pos.boostMultiplier, 500);
    }

    function test_depositBelowMinimumReverts() public {
        vm.prank(alice);
        vm.expectRevert(EarnVault.BelowMinimumDeposit.selector);
        vault.deposit{value: 0.0000001 ether}(EarnVault.Strategy.CONSERVATIVE, 0);
    }

    function test_depositBelowMinimumConservative() public {
        vm.prank(alice);
        vm.expectRevert(EarnVault.BelowMinimumDeposit.selector);
        vault.deposit{value: 0.0000005 ether}(EarnVault.Strategy.CONSERVATIVE, 0);
    }

    function test_depositBelowMinimumBalanced() public {
        vm.prank(alice);
        vm.expectRevert(EarnVault.BelowMinimumDeposit.selector);
        vault.deposit{value: 0}(EarnVault.Strategy.BALANCED, 0);
    }

    function test_depositUpdatesVaultStats() public {
        vm.prank(alice);
        vault.deposit{value: ONE_BTC}(EarnVault.Strategy.CONSERVATIVE, 0);

        assertEq(vault.totalBtcLocked(), ONE_BTC);
        assertEq(vault.nextPositionId(), 1);
    }

    function test_multipleDeposits() public {
        vm.prank(alice);
        vault.deposit{value: ONE_BTC}(EarnVault.Strategy.CONSERVATIVE, 0);
        vm.prank(alice);
        vault.deposit{value: 0.5 ether}(EarnVault.Strategy.BALANCED, 0);

        uint256[] memory ids = vault.getUserPositionIds(alice);
        assertEq(ids.length, 2);
        assertEq(vault.totalBtcLocked(), 1.5 ether);
    }

    function test_multipleUsers() public {
        vm.prank(alice);
        vault.deposit{value: ONE_BTC}(EarnVault.Strategy.CONSERVATIVE, 0);
        vm.prank(bob);
        vault.deposit{value: 2 ether}(EarnVault.Strategy.AGGRESSIVE, 0);

        assertEq(vault.totalBtcLocked(), 3 ether);

        EarnVault.Position memory posA = vault.getPosition(0);
        EarnVault.Position memory posB = vault.getPosition(1);
        assertEq(posA.user, alice);
        assertEq(posB.user, bob);
    }

    // ═══════ WITHDRAW TESTS ═══════

    function test_withdrawAfterLockExpiry() public {
        vm.prank(alice);
        vault.deposit{value: ONE_BTC}(EarnVault.Strategy.CONSERVATIVE, 0);

        vm.warp(block.timestamp + 31 days);
        uint256 balBefore = alice.balance;
        vm.prank(alice);
        vault.withdraw(0);

        EarnVault.Position memory pos = vault.getPosition(0);
        assertFalse(pos.active);
        assertTrue(alice.balance > balBefore);
    }

    function test_withdrawBeforeLockReverts() public {
        vm.prank(alice);
        vault.deposit{value: ONE_BTC}(EarnVault.Strategy.CONSERVATIVE, 0);

        vm.prank(alice);
        vm.expectRevert(EarnVault.LockNotExpired.selector);
        vault.withdraw(0);
    }

    function test_withdrawNotOwnerReverts() public {
        vm.prank(alice);
        vault.deposit{value: ONE_BTC}(EarnVault.Strategy.CONSERVATIVE, 0);

        vm.warp(block.timestamp + 31 days);
        vm.prank(bob);
        vm.expectRevert(EarnVault.NotPositionOwner.selector);
        vault.withdraw(0);
    }

    function test_withdrawDeductsManagementFee() public {
        vm.prank(alice);
        vault.deposit{value: 10 ether}(EarnVault.Strategy.CONSERVATIVE, 0);

        vm.warp(block.timestamp + 365 days);
        vm.prank(alice);
        vault.withdraw(0);

        // Management fee = 0.1% annual on 10 BTC = 0.01 BTC
        (,,, uint256 totalFees) = feeCollector.getTotalCollected();
        assertTrue(totalFees > 0, "Management fee should be collected");
    }

    function test_withdrawInactivePositionReverts() public {
        vm.prank(alice);
        vault.deposit{value: ONE_BTC}(EarnVault.Strategy.CONSERVATIVE, 0);

        vm.warp(block.timestamp + 31 days);
        vm.prank(alice);
        vault.withdraw(0);

        vm.prank(alice);
        vm.expectRevert(EarnVault.PositionNotActive.selector);
        vault.withdraw(0);
    }

    // ═══════ STRATEGY CHANGE TESTS ═══════

    function test_changeStrategyConservativeToBalanced() public {
        vm.prank(alice);
        vault.deposit{value: ONE_BTC}(EarnVault.Strategy.CONSERVATIVE, 0);

        // Advance epoch first
        vm.warp(block.timestamp + 8 days);
        vm.prank(alice);
        vault.deposit{value: MIN_BTC}(EarnVault.Strategy.CONSERVATIVE, 0); // trigger epoch advance

        vm.prank(alice);
        vault.changeStrategy(0, EarnVault.Strategy.BALANCED);

        EarnVault.Position memory pos = vault.getPosition(0);
        assertEq(uint256(pos.strategy), uint256(EarnVault.Strategy.BALANCED));
        assertEq(pos.boostMultiplier, 200);
    }

    function test_changeStrategyToAggressive() public {
        vm.prank(alice);
        vault.deposit{value: ONE_BTC}(EarnVault.Strategy.CONSERVATIVE, 0);

        vm.warp(block.timestamp + 8 days);
        vm.prank(alice);
        vault.deposit{value: MIN_BTC}(EarnVault.Strategy.CONSERVATIVE, 0);

        vm.prank(alice);
        vault.changeStrategy(0, EarnVault.Strategy.AGGRESSIVE);

        EarnVault.Position memory pos = vault.getPosition(0);
        assertEq(pos.boostMultiplier, 500);
    }

    function test_changeStrategySameReverts() public {
        vm.prank(alice);
        vault.deposit{value: ONE_BTC}(EarnVault.Strategy.CONSERVATIVE, 0);

        vm.warp(block.timestamp + 8 days);
        vm.prank(alice);
        vault.deposit{value: MIN_BTC}(EarnVault.Strategy.CONSERVATIVE, 0);

        vm.prank(alice);
        vm.expectRevert(EarnVault.InvalidStrategy.selector);
        vault.changeStrategy(0, EarnVault.Strategy.CONSERVATIVE);
    }

    function test_changeStrategyDowngradeResetsBoost() public {
        vm.prank(alice);
        vault.deposit{value: ONE_BTC}(EarnVault.Strategy.AGGRESSIVE, 0);

        vm.warp(block.timestamp + 8 days);
        vm.prank(alice);
        vault.deposit{value: MIN_BTC}(EarnVault.Strategy.CONSERVATIVE, 0);

        vm.prank(alice);
        vault.changeStrategy(0, EarnVault.Strategy.CONSERVATIVE);

        EarnVault.Position memory pos = vault.getPosition(0);
        assertEq(pos.boostMultiplier, 100);
    }

    // ═══════ PAUSE TESTS ═══════

    function test_pauseBlocksDeposits() public {
        vault.pause();

        vm.prank(alice);
        vm.expectRevert();
        vault.deposit{value: ONE_BTC}(EarnVault.Strategy.CONSERVATIVE, 0);
    }

    function test_unpauseAllowsDeposits() public {
        vault.pause();
        vault.unpause();

        vm.prank(alice);
        vault.deposit{value: ONE_BTC}(EarnVault.Strategy.CONSERVATIVE, 0);
        assertEq(vault.nextPositionId(), 1);
    }

    function test_pauseOnlyOwner() public {
        vm.prank(alice);
        vm.expectRevert();
        vault.pause();
    }

    // ═══════ READ FUNCTION TESTS ═══════

    function test_getVaultStats() public {
        vm.prank(alice);
        vault.deposit{value: ONE_BTC}(EarnVault.Strategy.CONSERVATIVE, 0);

        EarnVault.VaultStats memory stats = vault.getVaultStats();
        assertEq(stats.totalBtcLocked, ONE_BTC);
        assertEq(stats.totalPositions, 1);
    }

    function test_getEstimatedAPR() public view {
        uint256 conservativeApr = vault.getEstimatedAPR(EarnVault.Strategy.CONSERVATIVE);
        uint256 balancedApr = vault.getEstimatedAPR(EarnVault.Strategy.BALANCED);
        uint256 aggressiveApr = vault.getEstimatedAPR(EarnVault.Strategy.AGGRESSIVE);

        assertTrue(conservativeApr > 0);
        assertTrue(balancedApr > conservativeApr);
        assertTrue(aggressiveApr > balancedApr);
    }

    function test_getUserShare() public {
        vm.prank(alice);
        vault.deposit{value: ONE_BTC}(EarnVault.Strategy.CONSERVATIVE, 0);

        (uint256 weight, uint256 totalWeight, uint256 sharePercent) = vault.getUserShare(0);
        assertTrue(weight > 0);
        assertTrue(totalWeight > 0);
        assertEq(sharePercent, 10_000); // 100% (only position)
    }

    function test_getCurrentEpoch() public view {
        (uint256 number, uint256 start, uint256 end) = vault.getCurrentEpoch();
        assertEq(number, 1);
        assertTrue(start > 0);
        assertEq(end, start + 7 days);
    }

    // ═══════ FEE CALCULATIONS ═══════

    function test_feeCalculationsAccuracy() public {
        vm.prank(alice);
        vault.deposit{value: 10 ether}(EarnVault.Strategy.CONSERVATIVE, 0);

        // Performance fee: 30 bps of 1 BTC = 0.003 BTC
        vm.prank(address(vault));
        uint256 fee = feeCollector.collectPerformanceFee(ONE_BTC);
        assertEq(fee, 0.003 ether);
    }

    function test_managementFeeProRata() public {
        vm.prank(alice);
        vault.deposit{value: 10 ether}(EarnVault.Strategy.CONSERVATIVE, 0);

        // 0.1% annual on 10 BTC for 182.5 days = 0.005 BTC
        vm.prank(address(vault));
        uint256 fee = feeCollector.collectManagementFee(10 ether, 182.5 days);
        assertEq(fee, 0.005 ether);
    }

    function test_feeCapsEnforced() public {
        vm.expectRevert(FeeCollector.ExceedsFeeCap.selector);
        new FeeCollector(owner, 501, 10, 1000, 10); // > MAX_PERFORMANCE_BPS
    }

    // ═══════ FUZZ TESTS ═══════

    function testFuzz_depositAmount(uint256 amount) public {
        amount = bound(amount, MIN_BTC, 50 ether);
        vm.deal(alice, amount + 1 ether);

        vm.prank(alice);
        vault.deposit{value: amount}(EarnVault.Strategy.CONSERVATIVE, 0);

        EarnVault.Position memory pos = vault.getPosition(0);
        assertEq(pos.btcDeposited, amount);
    }

    function testFuzz_depositAmountBalanced(uint256 amount) public {
        amount = bound(amount, MIN_BTC, 50 ether);
        vm.deal(alice, amount + 1 ether);

        vm.prank(alice);
        vault.deposit{value: amount}(EarnVault.Strategy.BALANCED, 0);

        EarnVault.Position memory pos = vault.getPosition(0);
        assertEq(pos.btcDeposited, amount);
        assertEq(pos.boostMultiplier, 200);
    }

    function testFuzz_depositAmountAggressive(uint256 amount) public {
        amount = bound(amount, MIN_BTC, 50 ether);
        vm.deal(alice, amount + 1 ether);

        vm.prank(alice);
        vault.deposit{value: amount}(EarnVault.Strategy.AGGRESSIVE, 0);

        EarnVault.Position memory pos = vault.getPosition(0);
        assertEq(pos.btcDeposited, amount);
        assertEq(pos.boostMultiplier, 500);
    }

    function testFuzz_withdrawalTiming(uint256 extraTime) public {
        extraTime = bound(extraTime, 1, 365 days);

        vm.prank(alice);
        vault.deposit{value: ONE_BTC}(EarnVault.Strategy.CONSERVATIVE, 0);

        // Lock duration is 30 days, warp past it
        vm.warp(block.timestamp + 30 days + extraTime);

        vm.prank(alice);
        vault.withdraw(0);
        assertFalse(vault.getPosition(0).active);
    }
}
