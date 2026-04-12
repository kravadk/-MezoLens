// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

/// @title IMezoSwap - Interface for Mezo AMM Router (Velodrome-based)
/// @notice Swap tokens and add/remove liquidity on Mezo pools
interface IMezoSwap {
    struct Route {
        address from;
        address to;
        bool stable;
    }

    /// @notice Swap exact tokens for tokens
    /// @param amountIn Amount of input token
    /// @param amountOutMin Minimum output amount
    /// @param routes Array of swap routes
    /// @param to Recipient address
    /// @param deadline Transaction deadline timestamp
    /// @return amounts Output amounts per route
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        Route[] calldata routes,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);

    /// @notice Add liquidity to a pool
    /// @param tokenA First token address
    /// @param tokenB Second token address
    /// @param stable Whether the pool is stable or volatile
    /// @param amountADesired Desired amount of tokenA
    /// @param amountBDesired Desired amount of tokenB
    /// @param amountAMin Minimum amount of tokenA
    /// @param amountBMin Minimum amount of tokenB
    /// @param to LP token recipient
    /// @param deadline Transaction deadline
    /// @return amountA Actual tokenA deposited
    /// @return amountB Actual tokenB deposited
    /// @return liquidity LP tokens minted
    function addLiquidity(
        address tokenA,
        address tokenB,
        bool stable,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external returns (uint256 amountA, uint256 amountB, uint256 liquidity);

    /// @notice Remove liquidity from a pool
    /// @param tokenA First token address
    /// @param tokenB Second token address
    /// @param stable Whether the pool is stable or volatile
    /// @param liquidity LP tokens to burn
    /// @param amountAMin Minimum tokenA to receive
    /// @param amountBMin Minimum tokenB to receive
    /// @param to Recipient address
    /// @param deadline Transaction deadline
    /// @return amountA TokenA received
    /// @return amountB TokenB received
    function removeLiquidity(
        address tokenA,
        address tokenB,
        bool stable,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external returns (uint256 amountA, uint256 amountB);

    /// @notice Get amount out for a swap
    /// @param amountIn Input amount
    /// @param tokenIn Input token
    /// @param tokenOut Output token
    /// @return amount Output amount
    /// @return stable Whether routed through stable pool
    function getAmountOut(
        uint256 amountIn,
        address tokenIn,
        address tokenOut
    ) external view returns (uint256 amount, bool stable);
}
