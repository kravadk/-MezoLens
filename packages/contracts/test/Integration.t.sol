// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {Test} from "forge-std/Test.sol";
import {EarnVault} from "../src/EarnVault.sol";
import {FeeCollector} from "../src/FeeCollector.sol";
import {GaugeVoter} from "../src/GaugeVoter.sol";
import {MusdPipe} from "../src/MusdPipe.sol";

contract IntegrationTest is Test {
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
        vm.deal(address(vault), 200 ether);
    }

    /// @notice Full flow: deposit → compound 3 epochs → withdraw
    function test_fullFlowDepositCompoundWithdraw() public {
        // 1. Alice deposits 1 BTC conservative
        vm.prank(alice);
        vault.deposit{value: 1 ether}(EarnVault.Strategy.CONSERVATIVE, 0);

        EarnVault.Position memory pos = vault.getPosition(0);
        assertEq(pos.btcDeposited, 1 ether);
        assertTrue(pos.active);

        // 2. Advance 3 epochs, compound each time
        for (uint256 i = 0; i < 3; i++) {
            vm.warp(block.timestamp + 8 days);
            // Trigger epoch advance with small deposit
            vm.deal(address(0xdead), 1 ether);
            vm.prank(address(0xdead));
            vault.deposit{value: 0.001 ether}(EarnVault.Strategy.CONSERVATIVE, 0);

            // Keeper compounds
            vm.prank(keeper);
            vault.compound(0);

            pos = vault.getPosition(0);
            assertTrue(pos.btcCompounded > 0, "Should have compounded");
        }

        // 3. Check compound grew position
        pos = vault.getPosition(0);
        uint256 totalBtc = pos.btcDeposited + pos.btcCompounded;
        assertTrue(totalBtc > 1 ether, "Position should have grown");

        // 4. Withdraw after lock expires
        vm.warp(block.timestamp + 31 days);
        uint256 aliceBalBefore = alice.balance;
        vm.prank(alice);
        vault.withdraw(0);

        pos = vault.getPosition(0);
        assertFalse(pos.active);
        assertTrue(alice.balance > aliceBalBefore, "Alice should receive BTC back");

        // 5. Verify fees collected
        (uint256 perfFees, uint256 mgmtFees,, uint256 totalFees) = feeCollector.getTotalCollected();
        assertTrue(perfFees > 0, "Performance fees collected");
        assertTrue(mgmtFees > 0, "Management fees collected");
        assertTrue(totalFees > 0, "Total fees > 0");
    }

    /// @notice Multi-user scenario with keeper compounds
    function test_multiUserKeeperCompounds() public {
        // Alice deposits conservative
        vm.prank(alice);
        vault.deposit{value: 1 ether}(EarnVault.Strategy.CONSERVATIVE, 0);

        // Bob deposits aggressive
        vm.prank(bob);
        vault.deposit{value: 2 ether}(EarnVault.Strategy.AGGRESSIVE, 0);

        // Advance epoch
        vm.warp(block.timestamp + 8 days);
        vm.deal(address(0xdead), 1 ether);
        vm.prank(address(0xdead));
        vault.deposit{value: 0.001 ether}(EarnVault.Strategy.CONSERVATIVE, 0);

        // Keeper batch compounds both
        uint256 keeperBalBefore = keeper.balance;
        uint256[] memory ids = new uint256[](2);
        ids[0] = 0;
        ids[1] = 1;
        vm.prank(keeper);
        vault.compoundBatch(ids);

        // Both positions compounded
        assertTrue(vault.getPosition(0).btcCompounded > 0);
        assertTrue(vault.getPosition(1).btcCompounded > 0);

        // Bob's aggressive should compound more (5x boost vs 1x)
        assertTrue(
            vault.getPosition(1).btcCompounded > vault.getPosition(0).btcCompounded,
            "Aggressive should compound more than conservative"
        );

        // Keeper earned incentive
        assertTrue(keeper.balance > keeperBalBefore, "Keeper received incentive");
    }

    /// @notice Strategy change mid-lock with compound
    function test_strategyChangeMidLock() public {
        // Deposit conservative
        vm.prank(alice);
        vault.deposit{value: 1 ether}(EarnVault.Strategy.CONSERVATIVE, 0);

        // Advance epoch
        vm.warp(block.timestamp + 8 days);
        vm.deal(address(0xdead), 1 ether);
        vm.prank(address(0xdead));
        vault.deposit{value: 0.001 ether}(EarnVault.Strategy.CONSERVATIVE, 0);

        // Compound first
        vm.prank(keeper);
        vault.compound(0);

        uint256 compoundedBefore = vault.getPosition(0).btcCompounded;

        // Change to aggressive
        vm.prank(alice);
        vault.changeStrategy(0, EarnVault.Strategy.AGGRESSIVE);

        EarnVault.Position memory pos = vault.getPosition(0);
        assertEq(uint256(pos.strategy), uint256(EarnVault.Strategy.AGGRESSIVE));
        assertEq(pos.boostMultiplier, 500);
        assertEq(pos.btcCompounded, compoundedBefore); // Compound preserved

        // Advance another epoch and compound with new boost
        vm.warp(block.timestamp + 8 days);
        vm.deal(address(0xdead2), 1 ether);
        vm.prank(address(0xdead2));
        vault.deposit{value: 0.001 ether}(EarnVault.Strategy.CONSERVATIVE, 0);

        vm.prank(keeper);
        vault.compound(0);

        assertTrue(vault.getPosition(0).btcCompounded > compoundedBefore, "Should compound more with 5x boost");
    }

    /// @notice Emergency pause — withdrawals still work
    function test_emergencyPauseWithdrawalsOpen() public {
        // Deposit
        vm.prank(alice);
        vault.deposit{value: 1 ether}(EarnVault.Strategy.CONSERVATIVE, 0);

        // Owner pauses
        vault.pause();

        // New deposits blocked
        vm.prank(bob);
        vm.expectRevert();
        vault.deposit{value: 1 ether}(EarnVault.Strategy.CONSERVATIVE, 0);

        // Compounds blocked
        vm.warp(block.timestamp + 8 days);
        vm.prank(keeper);
        vm.expectRevert();
        vault.compound(0);

        // But withdrawals ALWAYS work (even when paused)
        vm.warp(block.timestamp + 31 days);
        vm.prank(alice);
        vault.withdraw(0);

        assertFalse(vault.getPosition(0).active);
        assertTrue(alice.balance > 99 ether, "Alice got BTC back despite pause");
    }

    /// @notice MUSD yield enable/disable flow
    function test_musdYieldEnableDisable() public {
        vm.prank(alice);
        vault.deposit{value: 1 ether}(EarnVault.Strategy.BALANCED, 0);

        // Enable MUSD yield
        vm.prank(alice);
        vault.enableMusdYield(0, 3000); // 30%

        EarnVault.Position memory pos = vault.getPosition(0);
        assertEq(pos.musdPercent, 3000);

        // Disable
        vm.prank(alice);
        vault.disableMusdYield(0);

        pos = vault.getPosition(0);
        assertEq(pos.musdPercent, 0);
    }

    /// @notice Cannot enable MUSD on conservative
    function test_musdYieldConservativeReverts() public {
        vm.prank(alice);
        vault.deposit{value: 1 ether}(EarnVault.Strategy.CONSERVATIVE, 0);

        vm.prank(alice);
        vm.expectRevert(EarnVault.InvalidStrategy.selector);
        vault.enableMusdYield(0, 2000);
    }

    /// @notice MUSD percentage bounds
    function test_musdYieldInvalidPercent() public {
        vm.prank(alice);
        vault.deposit{value: 1 ether}(EarnVault.Strategy.BALANCED, 0);

        vm.prank(alice);
        vm.expectRevert(EarnVault.InvalidMusdPercent.selector);
        vault.enableMusdYield(0, 5001); // > 50%
    }
}
