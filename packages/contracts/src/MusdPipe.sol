// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IMezoBorrow} from "./interfaces/IMezoBorrow.sol";
import {IMezoSwap} from "./interfaces/IMezoSwap.sol";

/// @title MusdPipe - BTC → MUSD → LP yield pipeline
/// @notice Handles borrowing MUSD against BTC collateral and deploying to LP pools
/// @dev Uses mock tracking when Mezo precompiles are unavailable
contract MusdPipe is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // --- External contracts ---
    IMezoBorrow public borrowerOperations;
    IMezoSwap public swapRouter;
    IERC20 public musdToken;

    // --- Mock state (fallback) ---
    bool public useMockData;

    struct CDPInfo {
        uint256 collateral;      // BTC collateral deposited
        uint256 debt;            // MUSD borrowed
        uint256 lpTokens;        // LP tokens held
        uint256 lpDeployed;      // MUSD deployed to LP
        uint256 totalYield;      // Total MUSD yield harvested
        bool active;
    }

    mapping(uint256 => CDPInfo) public cdps; // positionId => CDP

    // --- Constants ---
    uint256 public constant MIN_COLLATERAL_RATIO = 15000; // 150% in basis points
    uint256 public constant SAFE_COLLATERAL_RATIO = 18000; // 180% target
    uint256 public constant BPS_DENOMINATOR = 10_000;
    uint256 public constant MOCK_BTC_PRICE = 96_500e18; // Mock BTC/USD price
    uint256 public constant MOCK_LP_APR = 500; // 5% mock LP APR

    // --- Access control ---
    address public vault;

    // --- Events ---
    event CDPOpened(address indexed owner, uint256 btcCollateral, uint256 musdMinted);
    event LPDeployed(address indexed owner, uint256 musdAmount, uint256 lpTokens);
    event LPHarvested(address indexed owner, uint256 yield);
    event CDPClosed(address indexed owner, uint256 btcReturned);
    event VaultUpdated(address indexed vault);
    event RealModeEnabled(address indexed borrowerOps, address indexed musdToken);

    error OnlyVault();
    error CDPNotActive();
    error CDPAlreadyActive();
    error InsufficientCollateral();
    error UnsafeCollateralRatio();
    error TransferFailed();
    error ZeroAddress();
    error ZeroAmount();

    modifier onlyVault() {
        if (msg.sender != vault) revert OnlyVault();
        _;
    }

    constructor(
        address _owner,
        address _borrowerOperations,
        address _swapRouter,
        address _musdToken
    ) Ownable(_owner) {
        if (_borrowerOperations == address(0) || _musdToken == address(0)) {
            useMockData = true;
        } else {
            borrowerOperations = IMezoBorrow(_borrowerOperations);
            swapRouter = IMezoSwap(_swapRouter);
            musdToken = IERC20(_musdToken);
        }
    }

    // --- Core pipeline functions ---

    /// @notice Open a CDP: deposit BTC as collateral, mint MUSD
    /// @return musdMinted Amount of MUSD minted
    function openCDP() external payable onlyVault returns (uint256) {
        return openCDPFor(0);
    }

    function openCDPFor(uint256 positionId) public payable onlyVault nonReentrant returns (uint256 musdMinted) {
        if (msg.value == 0) revert ZeroAmount();
        if (cdps[positionId].active) revert CDPAlreadyActive();

        uint256 btcValueUsd = (msg.value * MOCK_BTC_PRICE) / 1e18;
        musdMinted = (btcValueUsd * BPS_DENOMINATOR) / SAFE_COLLATERAL_RATIO;

        if (!useMockData) {
            // Try real Mezo Borrow openTrove — 0.5% max fee, hints can be address(0)
            try borrowerOperations.openTrove{value: msg.value}(
                500, musdMinted, address(0), address(0)
            ) {} catch {
                // Fallback: BTC held as collateral in this contract, CDP tracked locally
            }
        }

        cdps[positionId] = CDPInfo({
            collateral: msg.value,
            debt: musdMinted,
            lpTokens: 0,
            lpDeployed: 0,
            totalYield: 0,
            active: true
        });

        emit CDPOpened(msg.sender, msg.value, musdMinted);
    }

    /// @notice Deploy MUSD to best LP pool
    /// @param musdAmount Amount of MUSD to deploy
    /// @return lpTokens LP tokens received
    function deployToLP(uint256 musdAmount) external onlyVault returns (uint256 lpTokens) {
        return deployToLPFor(0, musdAmount);
    }

    function deployToLPFor(uint256 positionId, uint256 musdAmount) public onlyVault nonReentrant returns (uint256 lpTokens) {
        if (musdAmount == 0) revert ZeroAmount();

        CDPInfo storage cdp = cdps[positionId];
        if (!cdp.active) revert CDPNotActive();

        if (!useMockData && address(swapRouter) != address(0) && address(musdToken) != address(0)) {
            // Real: approve and add liquidity to MUSD pool via Mezo Swap
            musdToken.safeApprove(address(swapRouter), musdAmount);
            try swapRouter.addLiquidity(address(musdToken), musdAmount, 0) returns (uint256 lp) {
                lpTokens = lp;
            } catch {
                // Swap unavailable — hold MUSD in contract, track deployment
                lpTokens = musdAmount;
            }
        } else {
            // Mock: 1:1 LP token tracking
            lpTokens = musdAmount;
        }
        cdp.lpTokens += lpTokens;
        cdp.lpDeployed += musdAmount;

        emit LPDeployed(msg.sender, musdAmount, lpTokens);
    }

    /// @notice Harvest LP rewards
    /// @return yield Yield earned in MUSD equivalent (as BTC value in wei)
    function harvestLP() external onlyVault returns (uint256 yield) {
        return harvestLPFor(0);
    }

    function harvestLPFor(uint256 positionId) public onlyVault nonReentrant returns (uint256 yield) {
        CDPInfo storage cdp = cdps[positionId];
        if (!cdp.active) revert CDPNotActive();

        if (!useMockData && address(swapRouter) != address(0) && cdp.lpTokens > 0) {
            // Real: harvest LP rewards from Mezo Swap pool
            try swapRouter.collectFees(address(musdToken), cdp.lpTokens) returns (uint256 harvested) {
                yield = harvested;
                cdp.totalYield += yield;
            } catch {
                yield = 0;
            }
        } else if (useMockData) {
            // Mock: 5% APR on deployed MUSD, distributed weekly
            yield = (cdp.lpDeployed * MOCK_LP_APR) / (BPS_DENOMINATOR * 52);
            cdp.totalYield += yield;
        }

        emit LPHarvested(msg.sender, yield);
    }

    /// @notice Close CDP: withdraw LP, repay MUSD, unlock BTC
    /// @return btcReturned BTC collateral returned
    function closeCDP() external onlyVault returns (uint256 btcReturned) {
        return closeCDPFor(0);
    }

    function closeCDPFor(uint256 positionId) public onlyVault nonReentrant returns (uint256 btcReturned) {
        CDPInfo storage cdp = cdps[positionId];
        if (!cdp.active) revert CDPNotActive();

        btcReturned = cdp.collateral;

        if (!useMockData) {
            borrowerOperations.closeTrove();
        }

        cdp.active = false;
        cdp.lpTokens = 0;
        cdp.lpDeployed = 0;

        if (btcReturned > 0) {
            (bool success,) = vault.call{value: btcReturned}("");
            if (!success) revert TransferFailed();
        }

        emit CDPClosed(msg.sender, btcReturned);
    }

    // --- Health monitoring ---

    /// @notice Get CDP health (legacy, uses position 0)
    /// @return ratio Collateral ratio in basis points
    /// @return liqPrice Liquidation price in USD
    /// @return safe True if ratio > MIN_COLLATERAL_RATIO
    function getHealth(address) external view returns (uint256, uint256, bool) {
        return getHealthFor(0);
    }

    function getHealthFor(uint256 positionId) public view returns (uint256 ratio, uint256 liqPrice, bool safe) {
        CDPInfo storage cdp = cdps[positionId];
        if (!cdp.active) return (0, 0, false);
        if (cdp.debt == 0) return (type(uint256).max, 0, true);

        uint256 collateralValueUsd = (cdp.collateral * MOCK_BTC_PRICE) / 1e18;
        ratio = (collateralValueUsd * BPS_DENOMINATOR) / cdp.debt;
        liqPrice = (cdp.debt * MIN_COLLATERAL_RATIO * 1e18) / (cdp.collateral * BPS_DENOMINATOR);
        safe = ratio > MIN_COLLATERAL_RATIO;
    }

    function getCDP(address) external view returns (CDPInfo memory) {
        return cdps[0];
    }

    function getCDPFor(uint256 positionId) external view returns (CDPInfo memory) {
        return cdps[positionId];
    }

    // --- Admin ---

    function setVault(address _vault) external onlyOwner {
        if (_vault == address(0)) revert ZeroAddress();
        vault = _vault;
        emit VaultUpdated(_vault);
    }

    /// @notice Switch from mock mode to real Mezo Borrow integration
    /// @param _borrowerOperations Mezo BorrowerOperations contract address
    /// @param _swapRouter Mezo Swap router (can be zero if LP not available)
    /// @param _musdToken MUSD token contract address
    function enableRealMode(
        address _borrowerOperations,
        address _swapRouter,
        address _musdToken
    ) external onlyOwner {
        require(_borrowerOperations != address(0), "Zero borrower ops");
        require(_musdToken != address(0), "Zero musd token");
        borrowerOperations = IMezoBorrow(_borrowerOperations);
        if (_swapRouter != address(0)) swapRouter = IMezoSwap(_swapRouter);
        musdToken = IERC20(_musdToken);
        useMockData = false;
        emit RealModeEnabled(_borrowerOperations, _musdToken);
    }

    receive() external payable {}
}
