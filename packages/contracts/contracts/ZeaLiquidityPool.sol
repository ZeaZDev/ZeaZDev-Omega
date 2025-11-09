// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title ZeaLiquidityPool
 * @notice Multi-chain liquidity pool for ZEA/DING trading
 * @dev Automated Market Maker (AMM) for cross-chain liquidity
 */
contract ZeaLiquidityPool is ERC20, Ownable, ReentrancyGuard {
    IERC20 public tokenA; // ZEA
    IERC20 public tokenB; // DING or other token

    uint256 public reserveA;
    uint256 public reserveB;

    // Fee: 0.3% (30 basis points)
    uint256 public constant SWAP_FEE = 30;
    uint256 public constant FEE_DENOMINATOR = 10000;

    // Minimum liquidity locked permanently
    uint256 public constant MINIMUM_LIQUIDITY = 1000;

    // Events
    event LiquidityAdded(
        address indexed provider,
        uint256 amountA,
        uint256 amountB,
        uint256 liquidity
    );

    event LiquidityRemoved(
        address indexed provider,
        uint256 amountA,
        uint256 amountB,
        uint256 liquidity
    );

    event Swap(
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );

    event ReservesUpdated(uint256 reserveA, uint256 reserveB);

    constructor(
        address _tokenA,
        address _tokenB,
        string memory _name,
        string memory _symbol
    ) ERC20(_name, _symbol) {
        require(_tokenA != address(0) && _tokenB != address(0), "Invalid token");
        tokenA = IERC20(_tokenA);
        tokenB = IERC20(_tokenB);
    }

    /**
     * @notice Add liquidity to the pool
     * @param amountA Amount of token A to add
     * @param amountB Amount of token B to add
     * @param minLiquidity Minimum liquidity tokens to receive
     */
    function addLiquidity(
        uint256 amountA,
        uint256 amountB,
        uint256 minLiquidity
    ) external nonReentrant returns (uint256 liquidity) {
        require(amountA > 0 && amountB > 0, "Invalid amounts");

        // Transfer tokens from user
        tokenA.transferFrom(msg.sender, address(this), amountA);
        tokenB.transferFrom(msg.sender, address(this), amountB);

        // Calculate liquidity to mint
        uint256 totalSupply = totalSupply();
        if (totalSupply == 0) {
            // First liquidity provider
            liquidity = sqrt(amountA * amountB);
            require(liquidity > MINIMUM_LIQUIDITY, "Insufficient liquidity");
            
            // Lock minimum liquidity permanently
            _mint(address(0), MINIMUM_LIQUIDITY);
            liquidity = liquidity - MINIMUM_LIQUIDITY;
        } else {
            // Subsequent providers
            liquidity = min(
                (amountA * totalSupply) / reserveA,
                (amountB * totalSupply) / reserveB
            );
        }

        require(liquidity >= minLiquidity, "Slippage too high");
        require(liquidity > 0, "Insufficient liquidity minted");

        // Mint LP tokens
        _mint(msg.sender, liquidity);

        // Update reserves
        _update(reserveA + amountA, reserveB + amountB);

        emit LiquidityAdded(msg.sender, amountA, amountB, liquidity);
    }

    /**
     * @notice Remove liquidity from the pool
     * @param liquidity Amount of LP tokens to burn
     * @param minAmountA Minimum amount of token A to receive
     * @param minAmountB Minimum amount of token B to receive
     */
    function removeLiquidity(
        uint256 liquidity,
        uint256 minAmountA,
        uint256 minAmountB
    ) external nonReentrant returns (uint256 amountA, uint256 amountB) {
        require(liquidity > 0, "Invalid liquidity");

        uint256 totalSupply = totalSupply();
        
        // Calculate amounts to return
        amountA = (liquidity * reserveA) / totalSupply;
        amountB = (liquidity * reserveB) / totalSupply;

        require(amountA >= minAmountA && amountB >= minAmountB, "Slippage too high");
        require(amountA > 0 && amountB > 0, "Insufficient liquidity burned");

        // Burn LP tokens
        _burn(msg.sender, liquidity);

        // Transfer tokens to user
        tokenA.transfer(msg.sender, amountA);
        tokenB.transfer(msg.sender, amountB);

        // Update reserves
        _update(reserveA - amountA, reserveB - amountB);

        emit LiquidityRemoved(msg.sender, amountA, amountB, liquidity);
    }

    /**
     * @notice Swap tokens
     * @param tokenIn Address of input token
     * @param amountIn Amount of input token
     * @param minAmountOut Minimum output amount (slippage protection)
     */
    function swap(
        address tokenIn,
        uint256 amountIn,
        uint256 minAmountOut
    ) external nonReentrant returns (uint256 amountOut) {
        require(amountIn > 0, "Invalid amount");
        require(
            tokenIn == address(tokenA) || tokenIn == address(tokenB),
            "Invalid token"
        );

        bool isTokenA = tokenIn == address(tokenA);
        (uint256 reserveIn, uint256 reserveOut) = isTokenA
            ? (reserveA, reserveB)
            : (reserveB, reserveA);

        // Calculate output amount (with fee)
        amountOut = getAmountOut(amountIn, reserveIn, reserveOut);
        require(amountOut >= minAmountOut, "Slippage too high");
        require(amountOut > 0, "Insufficient output amount");

        // Transfer input token from user
        IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);

        // Transfer output token to user
        address tokenOut = isTokenA ? address(tokenB) : address(tokenA);
        IERC20(tokenOut).transfer(msg.sender, amountOut);

        // Update reserves
        uint256 newReserveA = isTokenA ? reserveA + amountIn : reserveA - amountOut;
        uint256 newReserveB = isTokenA ? reserveB - amountOut : reserveB + amountIn;
        _update(newReserveA, newReserveB);

        emit Swap(msg.sender, tokenIn, tokenOut, amountIn, amountOut);
    }

    /**
     * @notice Get quote for swap
     * @param amountIn Input amount
     * @param reserveIn Input token reserve
     * @param reserveOut Output token reserve
     */
    function getAmountOut(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut
    ) public pure returns (uint256 amountOut) {
        require(amountIn > 0, "Invalid input");
        require(reserveIn > 0 && reserveOut > 0, "Insufficient liquidity");

        // Apply 0.3% fee
        uint256 amountInWithFee = amountIn * (FEE_DENOMINATOR - SWAP_FEE);
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = (reserveIn * FEE_DENOMINATOR) + amountInWithFee;
        amountOut = numerator / denominator;
    }

    /**
     * @notice Update reserves
     */
    function _update(uint256 _reserveA, uint256 _reserveB) private {
        reserveA = _reserveA;
        reserveB = _reserveB;
        emit ReservesUpdated(reserveA, reserveB);
    }

    /**
     * @notice Calculate square root (Babylonian method)
     */
    function sqrt(uint256 x) private pure returns (uint256 y) {
        if (x == 0) return 0;
        uint256 z = (x + 1) / 2;
        y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
    }

    /**
     * @notice Get minimum of two numbers
     */
    function min(uint256 a, uint256 b) private pure returns (uint256) {
        return a < b ? a : b;
    }

    /**
     * @notice Get current reserves
     */
    function getReserves() external view returns (uint256, uint256) {
        return (reserveA, reserveB);
    }
}
