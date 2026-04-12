// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {Test} from "forge-std/Test.sol";
import {MusdPipe} from "../src/MusdPipe.sol";

contract MusdPipeTest is Test {
    MusdPipe public pipe;
    address owner = address(this);
    address vault = makeAddr("vault");
    address alice = makeAddr("alice");

    function setUp() public {
        pipe = new MusdPipe(owner, address(0), address(0), address(0)); // mock mode
        pipe.setVault(vault);
        vm.deal(vault, 100 ether);
    }

    function test_openCDPCollateralRatio() public {
        vm.prank(vault);
        uint256 musdMinted = pipe.openCDP{value: 1 ether}();

        // At 96500 USD/BTC with 180% target: musdMinted = 96500 * 10000 / 18000 ≈ 53611
        assertTrue(musdMinted > 0, "Should mint MUSD");

        (uint256 ratio,, bool safe) = pipe.getHealth(vault);
        assertEq(ratio, 18000); // 180% target
        assertTrue(safe);
    }

    function test_openCDPCorrectDebt() public {
        vm.prank(vault);
        pipe.openCDP{value: 1 ether}();

        MusdPipe.CDPInfo memory cdpInfo = pipe.getCDP(vault);
        assertTrue(cdpInfo.active);
        assertEq(cdpInfo.collateral, 1 ether);
        assertTrue(cdpInfo.debt > 0);
    }

    function test_deployToLP() public {
        vm.prank(vault);
        pipe.openCDP{value: 1 ether}();

        vm.prank(vault);
        uint256 lpTokens = pipe.deployToLP(1000e18);

        assertEq(lpTokens, 1000e18); // Mock: 1:1
        MusdPipe.CDPInfo memory cdpInfo = pipe.getCDP(vault);
        assertEq(cdpInfo.lpTokens, 1000e18);
        assertEq(cdpInfo.lpDeployed, 1000e18);
    }

    function test_harvestLP() public {
        vm.prank(vault);
        pipe.openCDP{value: 1 ether}();

        vm.prank(vault);
        pipe.deployToLP(1000e18);

        vm.prank(vault);
        uint256 yield = pipe.harvestLP();

        // Yield = 1000e18 * 500 / (10000 * 52) ≈ 0.96e18
        assertTrue(yield > 0, "Should have yield");
    }

    function test_closeCDPFullFlow() public {
        vm.prank(vault);
        pipe.openCDP{value: 1 ether}();

        vm.prank(vault);
        pipe.deployToLP(1000e18);

        vm.prank(vault);
        uint256 btcReturned = pipe.closeCDP();

        assertEq(btcReturned, 1 ether);
        MusdPipe.CDPInfo memory cdpInfo = pipe.getCDP(vault);
        assertFalse(cdpInfo.active);
    }

    function test_closeCDPReturnsCollateral() public {
        vm.prank(vault);
        pipe.openCDP{value: 1 ether}();

        uint256 vaultBalBefore = vault.balance;
        vm.prank(vault);
        pipe.closeCDP();

        assertEq(vault.balance, vaultBalBefore + 1 ether); // Got collateral back
    }

    function test_healthMonitoringAccuracy() public {
        vm.prank(vault);
        pipe.openCDP{value: 1 ether}();

        (uint256 ratio, uint256 liqPrice, bool safe) = pipe.getHealth(vault);
        assertEq(ratio, 18000); // 180%
        assertTrue(liqPrice > 0);
        assertTrue(safe);
        assertTrue(liqPrice < 96500e18); // Liq price should be below current
    }

    function test_healthAboveLiquidation() public {
        vm.prank(vault);
        pipe.openCDP{value: 1 ether}();

        (uint256 ratio,, bool safe) = pipe.getHealth(vault);
        assertTrue(ratio > 15000, "Should be above 150% min ratio");
        assertTrue(safe);
    }

    function test_healthInactiveCDP() public view {
        (uint256 ratio,, bool safe) = pipe.getHealth(alice);
        assertEq(ratio, 0);
        assertFalse(safe);
    }

    function test_openCDPZeroAmountReverts() public {
        vm.prank(vault);
        vm.expectRevert(MusdPipe.ZeroAmount.selector);
        pipe.openCDP{value: 0}();
    }

    function test_closeCDPNotActiveReverts() public {
        vm.prank(vault);
        vm.expectRevert(MusdPipe.CDPNotActive.selector);
        pipe.closeCDP();
    }

    function test_deployToLPNotActiveReverts() public {
        vm.prank(vault);
        vm.expectRevert(MusdPipe.CDPNotActive.selector);
        pipe.deployToLP(1000e18);
    }

    function test_onlyVaultCanOpenCDP() public {
        vm.deal(alice, 1 ether);
        vm.prank(alice);
        vm.expectRevert(MusdPipe.OnlyVault.selector);
        pipe.openCDP{value: 1 ether}();
    }

    function testFuzz_btcPriceImpactOnHealth(uint256 amount) public {
        amount = bound(amount, 0.01 ether, 100 ether);
        vm.deal(vault, amount + 1 ether);

        vm.prank(vault);
        pipe.openCDP{value: amount}();

        (uint256 ratio,, bool safe) = pipe.getHealth(vault);
        assertEq(ratio, 18000); // Always 180% target regardless of amount
        assertTrue(safe);
    }

    function testFuzz_btcCollateralAmount(uint256 amount) public {
        amount = bound(amount, 0.001 ether, 50 ether);
        vm.deal(vault, amount + 1 ether);

        vm.prank(vault);
        uint256 musd = pipe.openCDP{value: amount}();

        assertTrue(musd > 0);
        MusdPipe.CDPInfo memory cdpInfo = pipe.getCDP(vault);
        assertEq(cdpInfo.collateral, amount);
    }
}
