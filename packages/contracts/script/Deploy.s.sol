// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {Script, console} from "forge-std/Script.sol";
import {EarnVault} from "../src/EarnVault.sol";
import {FeeCollector} from "../src/FeeCollector.sol";
import {GaugeVoter} from "../src/GaugeVoter.sol";
import {MusdPipe} from "../src/MusdPipe.sol";

/// @title Deploy - Deploys all MezoLens contracts to Mezo Testnet
contract Deploy is Script {
    // Mezo Testnet addresses
    address constant BORROWER_OPERATIONS = 0xCdF7028ceAB81fA0C6971208e83fa7872994beE5;
    address constant MUSD_TOKEN = 0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503;
    address constant SWAP_ROUTER = address(0); // Testnet may not have router
    address constant GAUGE_CONTROLLER = address(0); // Use mock gauges

    // Fee configuration (basis points)
    uint256 constant PERFORMANCE_FEE = 30;   // 0.3%
    uint256 constant MANAGEMENT_FEE = 10;     // 0.1%
    uint256 constant MUSD_SPREAD = 1000;      // 10%
    uint256 constant KEEPER_INCENTIVE = 10;   // 0.1%

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying MezoLens contracts...");
        console.log("Deployer:", deployer);
        console.log("Chain ID:", block.chainid);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy FeeCollector
        FeeCollector feeCollector = new FeeCollector(
            deployer,
            PERFORMANCE_FEE,
            MANAGEMENT_FEE,
            MUSD_SPREAD,
            KEEPER_INCENTIVE
        );
        console.log("FeeCollector deployed:", address(feeCollector));

        // 2. Deploy GaugeVoter (mock mode - no gauge controller on testnet)
        GaugeVoter gaugeVoter = new GaugeVoter(deployer, GAUGE_CONTROLLER);
        console.log("GaugeVoter deployed:", address(gaugeVoter));

        // 3. Deploy MusdPipe
        MusdPipe musdPipe = new MusdPipe(
            deployer,
            BORROWER_OPERATIONS,
            SWAP_ROUTER,
            MUSD_TOKEN
        );
        console.log("MusdPipe deployed:", address(musdPipe));

        // 4. Deploy EarnVault (main contract)
        EarnVault earnVault = new EarnVault(
            deployer,
            address(feeCollector),
            address(gaugeVoter),
            address(musdPipe),
            address(0), // MEZO token (not available on testnet yet)
            address(0), // veBTC precompile (mock mode)
            address(0)  // veMEZO precompile (mock mode)
        );
        console.log("EarnVault deployed:", address(earnVault));

        // 5. Wire up access: set vault address on all sub-contracts
        feeCollector.setVault(address(earnVault));
        gaugeVoter.setVault(address(earnVault));
        musdPipe.setVault(address(earnVault));

        console.log("All contracts wired. Deployment complete!");

        vm.stopBroadcast();

        // Summary
        console.log("\n=== MezoLens Deployment Summary ===");
        console.log("EarnVault:    ", address(earnVault));
        console.log("FeeCollector: ", address(feeCollector));
        console.log("GaugeVoter:   ", address(gaugeVoter));
        console.log("MusdPipe:     ", address(musdPipe));
        console.log("Network:       Mezo Testnet (Chain ID: 31611)");
    }
}
