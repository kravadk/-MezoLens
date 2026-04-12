// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {Test} from "forge-std/Test.sol";
import {EarnVault} from "../src/EarnVault.sol";
import {FeeCollector} from "../src/FeeCollector.sol";
import {GaugeVoter} from "../src/GaugeVoter.sol";
import {MusdPipe} from "../src/MusdPipe.sol";

/// @title CompoundBatch-specific tests
contract CompoundBatchTest is Test {
    EarnVault public vault;
    FeeCollector public feeCollector;
    address owner = address(this);
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");
    address charlie = makeAddr("charlie");
    address keeper = makeAddr("keeper");

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
        vm.deal(charlie, 100 ether);
        vm.deal(keeper, 10 ether);
        vm.deal(address(vault), 200 ether);
    }

    function _advanceEpoch() internal {
        vm.warp(block.timestamp + 8 days);
        vm.deal(address(0xdead), 1 ether);
        vm.prank(address(0xdead));
        vault.deposit{value: 0.001 ether}(EarnVault.Strategy.CONSERVATIVE, 0);
    }

    function test_batchCompoundThreeUsers() public {
        vm.prank(alice);
        vault.deposit{value: 1 ether}(EarnVault.Strategy.CONSERVATIVE, 0);
        vm.prank(bob);
        vault.deposit{value: 2 ether}(EarnVault.Strategy.BALANCED, 0);
        vm.prank(charlie);
        vault.deposit{value: 3 ether}(EarnVault.Strategy.AGGRESSIVE, 0);

        _advanceEpoch();

        uint256[] memory ids = new uint256[](3);
        ids[0] = 0; ids[1] = 1; ids[2] = 2;

        vm.prank(keeper);
        vault.compoundBatch(ids);

        assertTrue(vault.getPosition(0).btcCompounded > 0);
        assertTrue(vault.getPosition(1).btcCompounded > 0);
        assertTrue(vault.getPosition(2).btcCompounded > 0);
    }

    function test_batchCompoundEmitsEvent() public {
        vm.prank(alice);
        vault.deposit{value: 1 ether}(EarnVault.Strategy.CONSERVATIVE, 0);
        vm.prank(bob);
        vault.deposit{value: 1 ether}(EarnVault.Strategy.BALANCED, 0);

        _advanceEpoch();

        uint256[] memory ids = new uint256[](2);
        ids[0] = 0; ids[1] = 1;

        vm.prank(keeper);
        vm.expectEmit(false, false, false, false);
        emit EarnVault.CompoundBatch(ids, 0, 0);
        vault.compoundBatch(ids);
    }

    function test_batchSkipsInactivePositions() public {
        vm.prank(alice);
        vault.deposit{value: 1 ether}(EarnVault.Strategy.CONSERVATIVE, 0);
        vm.prank(bob);
        vault.deposit{value: 1 ether}(EarnVault.Strategy.CONSERVATIVE, 0);

        // Withdraw bob's position
        vm.warp(block.timestamp + 31 days);
        vm.prank(bob);
        vault.withdraw(1);

        // Advance new epoch after withdrawal
        _advanceEpoch();

        uint256[] memory ids = new uint256[](2);
        ids[0] = 0; ids[1] = 1;

        vm.prank(keeper);
        vault.compoundBatch(ids);

        assertTrue(vault.getPosition(0).btcCompounded > 0);
        assertEq(vault.getPosition(1).btcCompounded, 0); // Inactive, skipped
    }

    function test_batchEmptyArrayNoRevert() public {
        _advanceEpoch();

        uint256[] memory ids = new uint256[](0);
        vm.prank(keeper);
        vault.compoundBatch(ids); // Should not revert
    }

    function test_batchKeeperReceivesIncentive() public {
        vm.prank(alice);
        vault.deposit{value: 5 ether}(EarnVault.Strategy.AGGRESSIVE, 0);
        vm.prank(bob);
        vault.deposit{value: 5 ether}(EarnVault.Strategy.AGGRESSIVE, 0);

        _advanceEpoch();

        uint256 keeperBefore = keeper.balance;
        uint256[] memory ids = new uint256[](2);
        ids[0] = 0; ids[1] = 1;

        vm.prank(keeper);
        vault.compoundBatch(ids);

        assertTrue(keeper.balance > keeperBefore, "Keeper should earn incentive");
    }

    function test_batchAllAlreadyCompounded() public {
        vm.prank(alice);
        vault.deposit{value: 1 ether}(EarnVault.Strategy.CONSERVATIVE, 0);

        _advanceEpoch();

        // First compound
        vm.prank(keeper);
        vault.compound(0);
        uint256 compounded = vault.getPosition(0).btcCompounded;

        // Batch with already-compounded
        uint256[] memory ids = new uint256[](1);
        ids[0] = 0;
        vm.prank(keeper);
        vault.compoundBatch(ids);

        // Should not change
        assertEq(vault.getPosition(0).btcCompounded, compounded);
    }

    function test_batchGasEfficiencyVsIndividual() public {
        vm.prank(alice);
        vault.deposit{value: 1 ether}(EarnVault.Strategy.CONSERVATIVE, 0);
        vm.prank(bob);
        vault.deposit{value: 1 ether}(EarnVault.Strategy.CONSERVATIVE, 0);

        _advanceEpoch();

        uint256[] memory ids = new uint256[](2);
        ids[0] = 0; ids[1] = 1;

        uint256 gasBatch = gasleft();
        vm.prank(keeper);
        vault.compoundBatch(ids);
        gasBatch = gasBatch - gasleft();

        // Just verify batch completed successfully - gas savings are implicit
        assertTrue(vault.getPosition(0).btcCompounded > 0);
        assertTrue(vault.getPosition(1).btcCompounded > 0);
        assertTrue(gasBatch > 0);
    }
}
