// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {Test} from "forge-std/Test.sol";
import {EarnVault} from "../src/EarnVault.sol";
import {FeeCollector} from "../src/FeeCollector.sol";
import {GaugeVoter} from "../src/GaugeVoter.sol";
import {MusdPipe} from "../src/MusdPipe.sol";

contract CompoundTest is Test {
    EarnVault public vault;
    FeeCollector public feeCollector;
    GaugeVoter public gaugeVoter;
    MusdPipe public musdPipe;

    address owner = address(this);
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");
    address keeper = makeAddr("keeper");

    function setUp() public {
        feeCollector = new FeeCollector(owner, 30, 10, 1000, 10);
        gaugeVoter = new GaugeVoter(owner, address(0));
        musdPipe = new MusdPipe(owner, address(0), address(0), address(0));
        vault = new EarnVault(owner, address(feeCollector), address(gaugeVoter), address(musdPipe), address(0), address(0), address(0));

        feeCollector.setVault(address(vault));
        gaugeVoter.setVault(address(vault));
        musdPipe.setVault(address(vault));

        vm.deal(alice, 100 ether);
        vm.deal(bob, 100 ether);
        vm.deal(keeper, 10 ether);
        vm.deal(address(vault), 100 ether);
    }

    function _depositAndAdvanceEpoch(address user, EarnVault.Strategy strategy) internal {
        vm.prank(user);
        vault.deposit{value: 1 ether}(strategy, 0);
        vm.warp(block.timestamp + 8 days);
        // Trigger epoch advance
        vm.deal(address(0xdead), 1 ether);
        vm.prank(address(0xdead));
        vault.deposit{value: 0.001 ether}(EarnVault.Strategy.CONSERVATIVE, 0);
    }


    function test_compoundConservative() public {
        _depositAndAdvanceEpoch(alice, EarnVault.Strategy.CONSERVATIVE);

        uint256 pending = vault.getPendingCompound(0);
        assertTrue(pending > 0, "Should have pending rewards");

        vm.prank(keeper);
        vault.compound(0);

        EarnVault.Position memory pos = vault.getPosition(0);
        assertTrue(pos.btcCompounded > 0, "Should have compounded BTC");
    }

    function test_compoundBalanced() public {
        _depositAndAdvanceEpoch(alice, EarnVault.Strategy.BALANCED);

        vm.prank(keeper);
        vault.compound(0);

        EarnVault.Position memory pos = vault.getPosition(0);
        assertTrue(pos.btcCompounded > 0);
    }

    function test_compoundAggressive() public {
        _depositAndAdvanceEpoch(alice, EarnVault.Strategy.AGGRESSIVE);

        vm.prank(keeper);
        vault.compound(0);

        EarnVault.Position memory pos = vault.getPosition(0);
        assertTrue(pos.btcCompounded > 0);
    }


    function test_compoundBeforeNewEpochReverts() public {
        vm.prank(alice);
        vault.deposit{value: 1 ether}(EarnVault.Strategy.CONSERVATIVE, 0);

        vm.prank(keeper);
        vm.expectRevert(EarnVault.NoNewEpoch.selector);
        vault.compound(0);
    }

    function test_compoundPermissionless() public {
        _depositAndAdvanceEpoch(alice, EarnVault.Strategy.CONSERVATIVE);

        // Anyone can call compound (keeper is not the position owner)
        vm.prank(keeper);
        vault.compound(0);

        EarnVault.Position memory pos = vault.getPosition(0);
        assertTrue(pos.btcCompounded > 0);
    }


    function test_compoundFeeDeductionAccuracy() public {
        _depositAndAdvanceEpoch(alice, EarnVault.Strategy.CONSERVATIVE);

        uint256 pendingBefore = vault.getPendingCompound(0);

        vm.prank(keeper);
        vault.compound(0);

        EarnVault.Position memory pos = vault.getPosition(0);
        // Compounded = pending - fees - keeper incentive
        assertTrue(pos.btcCompounded < pendingBefore, "Compounded should be less than pending (fees deducted)");
        assertTrue(pos.totalFeesPaid > 0, "Fees should be recorded");
    }

    function test_compoundFeePercentage() public {
        _depositAndAdvanceEpoch(alice, EarnVault.Strategy.CONSERVATIVE);

        uint256 pending = vault.getPendingCompound(0);
        uint256 expectedFee = (pending * 30) / 10_000; // 0.3%

        vm.prank(keeper);
        vault.compound(0);

        (uint256 perfFees,,,) = feeCollector.getTotalCollected();
        assertEq(perfFees, expectedFee, "Performance fee should be exactly 0.3%");
    }

    function test_compoundRelockAmountCorrectConservative() public {
        _depositAndAdvanceEpoch(alice, EarnVault.Strategy.CONSERVATIVE);

        uint256 pending = vault.getPendingCompound(0);
        uint256 fee = (pending * 30) / 10_000;
        uint256 keeperIncentive = (pending * 10) / 10_000;
        uint256 expectedCompound = pending - fee - keeperIncentive;

        vm.prank(keeper);
        vault.compound(0);

        EarnVault.Position memory pos = vault.getPosition(0);
        assertEq(pos.btcCompounded, expectedCompound);
    }

    function test_compoundRelockAmountCorrectBalanced() public {
        _depositAndAdvanceEpoch(alice, EarnVault.Strategy.BALANCED);

        uint256 pending = vault.getPendingCompound(0);
        uint256 fee = (pending * 30) / 10_000;
        uint256 keeperIncentive = (pending * 10) / 10_000;
        uint256 expectedCompound = pending - fee - keeperIncentive;

        vm.prank(keeper);
        vault.compound(0);

        EarnVault.Position memory pos = vault.getPosition(0);
        assertEq(pos.btcCompounded, expectedCompound);
    }

    function test_compoundRelockAmountCorrectAggressive() public {
        _depositAndAdvanceEpoch(alice, EarnVault.Strategy.AGGRESSIVE);

        uint256 pending = vault.getPendingCompound(0);
        uint256 fee = (pending * 30) / 10_000;
        uint256 keeperIncentive = (pending * 10) / 10_000;
        uint256 expectedCompound = pending - fee - keeperIncentive;

        vm.prank(keeper);
        vault.compound(0);

        EarnVault.Position memory pos = vault.getPosition(0);
        assertEq(pos.btcCompounded, expectedCompound);
    }


    function test_compoundBatchMultiplePositions() public {
        vm.prank(alice);
        vault.deposit{value: 1 ether}(EarnVault.Strategy.CONSERVATIVE, 0);
        vm.prank(bob);
        vault.deposit{value: 2 ether}(EarnVault.Strategy.BALANCED, 0);

        vm.warp(block.timestamp + 8 days);
        vm.deal(address(0xdead), 1 ether);
        vm.prank(address(0xdead));
        vault.deposit{value: 0.001 ether}(EarnVault.Strategy.CONSERVATIVE, 0);

        uint256[] memory ids = new uint256[](2);
        ids[0] = 0;
        ids[1] = 1;

        vm.prank(keeper);
        vault.compoundBatch(ids);

        assertTrue(vault.getPosition(0).btcCompounded > 0);
        assertTrue(vault.getPosition(1).btcCompounded > 0);
    }

    function test_compoundBatchSkipsAlreadyCompounded() public {
        vm.prank(alice);
        vault.deposit{value: 1 ether}(EarnVault.Strategy.CONSERVATIVE, 0);

        vm.warp(block.timestamp + 8 days);
        vm.deal(address(0xdead), 1 ether);
        vm.prank(address(0xdead));
        vault.deposit{value: 0.001 ether}(EarnVault.Strategy.CONSERVATIVE, 0);

        // First compound
        vm.prank(keeper);
        vault.compound(0);

        uint256 compoundedAfterFirst = vault.getPosition(0).btcCompounded;

        // Batch with already-compounded position (should skip)
        uint256[] memory ids = new uint256[](1);
        ids[0] = 0;
        vm.prank(keeper);
        vault.compoundBatch(ids);

        assertEq(vault.getPosition(0).btcCompounded, compoundedAfterFirst);
    }


    function test_keeperIncentiveCalculation() public {
        uint256 incentive = feeCollector.calculateKeeperIncentive(1 ether);
        assertEq(incentive, 0.001 ether); // 0.1% = 10 bps
    }

    function test_keeperGetsIncentiveOnCompound() public {
        _depositAndAdvanceEpoch(alice, EarnVault.Strategy.CONSERVATIVE);

        uint256 keeperBalBefore = keeper.balance;
        vm.prank(keeper);
        vault.compound(0);

        assertTrue(keeper.balance > keeperBalBefore, "Keeper should receive incentive");
    }


    function test_compoundHistoryRecorded() public {
        _depositAndAdvanceEpoch(alice, EarnVault.Strategy.CONSERVATIVE);

        vm.prank(keeper);
        vault.compound(0);

        EarnVault.CompoundEvent[] memory history = vault.getCompoundHistory(0);
        assertEq(history.length, 1);
        assertTrue(history[0].amount > 0);
        assertTrue(history[0].fee > 0);
    }


    function testFuzz_compoundAmounts(uint256 depositAmount) public {
        depositAmount = bound(depositAmount, 0.001 ether, 50 ether);
        vm.deal(alice, depositAmount + 1 ether);

        vm.prank(alice);
        vault.deposit{value: depositAmount}(EarnVault.Strategy.CONSERVATIVE, 0);

        vm.warp(block.timestamp + 8 days);
        vm.deal(address(0xdead), 1 ether);
        vm.prank(address(0xdead));
        vault.deposit{value: 0.001 ether}(EarnVault.Strategy.CONSERVATIVE, 0);

        uint256 pending = vault.getPendingCompound(0);
        assertTrue(pending > 0);

        vm.prank(keeper);
        vault.compound(0);

        assertTrue(vault.getPosition(0).btcCompounded > 0);
    }

    function testFuzz_compoundBalancedAmounts(uint256 depositAmount) public {
        depositAmount = bound(depositAmount, 0.001 ether, 50 ether);
        vm.deal(alice, depositAmount + 1 ether);

        vm.prank(alice);
        vault.deposit{value: depositAmount}(EarnVault.Strategy.BALANCED, 0);

        vm.warp(block.timestamp + 8 days);
        vm.deal(address(0xdead), 1 ether);
        vm.prank(address(0xdead));
        vault.deposit{value: 0.001 ether}(EarnVault.Strategy.CONSERVATIVE, 0);

        vm.prank(keeper);
        vault.compound(0);
        assertTrue(vault.getPosition(0).btcCompounded > 0);
    }

    function testFuzz_compoundAggressiveAmounts(uint256 depositAmount) public {
        depositAmount = bound(depositAmount, 0.001 ether, 50 ether);
        vm.deal(alice, depositAmount + 1 ether);

        vm.prank(alice);
        vault.deposit{value: depositAmount}(EarnVault.Strategy.AGGRESSIVE, 0);

        vm.warp(block.timestamp + 8 days);
        vm.deal(address(0xdead), 1 ether);
        vm.prank(address(0xdead));
        vault.deposit{value: 0.001 ether}(EarnVault.Strategy.CONSERVATIVE, 0);

        vm.prank(keeper);
        vault.compound(0);
        assertTrue(vault.getPosition(0).btcCompounded > 0);
    }

    function testFuzz_keeperIncentive(uint256 amount) public {
        amount = bound(amount, 1, 100 ether);
        uint256 incentive = feeCollector.calculateKeeperIncentive(amount);
        assertEq(incentive, (amount * 10) / 10_000);
    }
}
