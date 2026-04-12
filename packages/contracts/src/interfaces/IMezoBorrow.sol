// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

/// @title IMezoBorrow - Interface for Mezo Borrow (Liquity-fork BorrowerOperations)
/// @notice Open/adjust/close troves to borrow MUSD against BTC collateral
interface IMezoBorrow {
    /// @notice Open a new trove (CDP) depositing BTC and borrowing MUSD
    /// @param maxFeePercentage Max fee percentage (e.g., 500 = 5%)
    /// @param musdAmount Amount of MUSD to borrow
    /// @param upperHint Address hint for sorted troves insertion
    /// @param lowerHint Address hint for sorted troves insertion
    function openTrove(
        uint256 maxFeePercentage,
        uint256 musdAmount,
        address upperHint,
        address lowerHint
    ) external payable;

    /// @notice Adjust an existing trove
    /// @param maxFeePercentage Max fee percentage
    /// @param collWithdrawal Amount of collateral to withdraw (0 if adding)
    /// @param musdChange Amount of MUSD to borrow/repay
    /// @param isDebtIncrease True if borrowing more, false if repaying
    /// @param upperHint Sorted troves hint
    /// @param lowerHint Sorted troves hint
    function adjustTrove(
        uint256 maxFeePercentage,
        uint256 collWithdrawal,
        uint256 musdChange,
        bool isDebtIncrease,
        address upperHint,
        address lowerHint
    ) external payable;

    /// @notice Close a trove by repaying all MUSD debt
    function closeTrove() external;

    /// @notice Get the nominal ICR of a trove
    /// @param borrower The trove owner
    /// @return NICR in 1e18 precision
    function getNominalICR(address borrower) external view returns (uint256);
}
