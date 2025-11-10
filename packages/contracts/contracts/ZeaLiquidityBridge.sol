// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title ZeaLiquidityBridge
 * @notice Enhanced cross-chain bridge with integrated liquidity pools
 * @dev Supports Polygon, Arbitrum, and Base with automated liquidity management
 * @author ZeaZDev Enterprises (OMEGA AI)
 * @custom:version 2.0.0
 */
contract ZeaLiquidityBridge is Ownable, ReentrancyGuard, Pausable {
    // Token addresses
    IERC20 public immutable zeaToken;
    IERC20 public immutable dingToken;

    // Supported chain IDs
    uint256 public constant ETHEREUM_CHAIN_ID = 1;
    uint256 public constant OPTIMISM_CHAIN_ID = 10;
    uint256 public constant POLYGON_CHAIN_ID = 137;
    uint256 public constant ARBITRUM_CHAIN_ID = 42161;
    uint256 public constant BASE_CHAIN_ID = 8453;

    // Bridge parameters
    uint256 public bridgeFee = 10; // 0.1% = 10 basis points
    uint256 public constant FEE_DENOMINATOR = 10000;
    uint256 public minBridgeAmount = 1e18; // 1 token
    uint256 public maxBridgeAmount = 1000000e18; // 1M tokens

    // Liquidity pool parameters
    uint256 public constant LP_FEE_BPS = 5; // 0.05% LP fee
    uint256 public totalLiquidityZEA;
    uint256 public totalLiquidityDING;
    
    // LP token tracking
    mapping(address => uint256) public lpSharesZEA;
    mapping(address => uint256) public lpSharesDING;
    uint256 public totalLPSharesZEA;
    uint256 public totalLPSharesDING;

    // Relayer management
    mapping(address => bool) public authorizedRelayers;
    uint256 public relayerCount;

    // Track bridge transactions
    mapping(bytes32 => bool) public processedTransactions;
    mapping(uint256 => bool) public supportedChains;
    mapping(address => uint256) public userBridgeCount;
    mapping(uint256 => uint256) public chainLiquidityZEA;
    mapping(uint256 => uint256) public chainLiquidityDING;

    // Events
    event BridgeInitiated(
        address indexed user,
        address indexed token,
        uint256 amount,
        uint256 amountAfterFee,
        uint256 targetChain,
        bytes32 indexed transactionHash,
        uint256 timestamp
    );

    event BridgeCompleted(
        address indexed user,
        address indexed token,
        uint256 amount,
        uint256 sourceChain,
        bytes32 indexed transactionHash,
        uint256 timestamp
    );

    event LiquidityAdded(
        address indexed provider,
        address indexed token,
        uint256 amount,
        uint256 shares,
        uint256 timestamp
    );

    event LiquidityRemoved(
        address indexed provider,
        address indexed token,
        uint256 amount,
        uint256 shares,
        uint256 timestamp
    );

    event RelayerUpdated(address indexed relayer, bool authorized);
    event BridgeFeeUpdated(uint256 oldFee, uint256 newFee);
    event ChainSupportUpdated(uint256 chainId, bool supported);
    event MinBridgeAmountUpdated(uint256 oldAmount, uint256 newAmount);
    event MaxBridgeAmountUpdated(uint256 oldAmount, uint256 newAmount);

    // Custom errors
    error ChainNotSupported();
    error AmountBelowMinimum();
    error AmountAboveMaximum();
    error InvalidToken();
    error InsufficientLiquidity();
    error AlreadyProcessed();
    error UnauthorizedRelayer();
    error InvalidAmount();
    error SameChain();

    constructor(
        address _zeaToken,
        address _dingToken,
        address initialOwner
    ) Ownable(initialOwner) {
        zeaToken = IERC20(_zeaToken);
        dingToken = IERC20(_dingToken);

        // Enable supported chains by default
        supportedChains[OPTIMISM_CHAIN_ID] = true;
        supportedChains[POLYGON_CHAIN_ID] = true;
        supportedChains[ARBITRUM_CHAIN_ID] = true;
        supportedChains[BASE_CHAIN_ID] = true;
    }

    /**
     * @notice Add liquidity to the bridge pool
     * @param token Address of token (ZEA or DING)
     * @param amount Amount of tokens to add
     */
    function addLiquidity(address token, uint256 amount)
        external
        nonReentrant
        whenNotPaused
    {
        if (amount == 0) revert InvalidAmount();
        if (token != address(zeaToken) && token != address(dingToken)) {
            revert InvalidToken();
        }

        // Transfer tokens from provider
        IERC20(token).transferFrom(msg.sender, address(this), amount);

        uint256 shares;
        if (token == address(zeaToken)) {
            // Calculate shares based on current pool size
            if (totalLPSharesZEA == 0) {
                shares = amount;
            } else {
                shares = (amount * totalLPSharesZEA) / totalLiquidityZEA;
            }
            
            lpSharesZEA[msg.sender] += shares;
            totalLPSharesZEA += shares;
            totalLiquidityZEA += amount;
        } else {
            if (totalLPSharesDING == 0) {
                shares = amount;
            } else {
                shares = (amount * totalLPSharesDING) / totalLiquidityDING;
            }
            
            lpSharesDING[msg.sender] += shares;
            totalLPSharesDING += shares;
            totalLiquidityDING += amount;
        }

        emit LiquidityAdded(msg.sender, token, amount, shares, block.timestamp);
    }

    /**
     * @notice Remove liquidity from the bridge pool
     * @param token Address of token (ZEA or DING)
     * @param shares Amount of LP shares to redeem
     */
    function removeLiquidity(address token, uint256 shares)
        external
        nonReentrant
    {
        if (shares == 0) revert InvalidAmount();
        if (token != address(zeaToken) && token != address(dingToken)) {
            revert InvalidToken();
        }

        uint256 amount;
        if (token == address(zeaToken)) {
            if (lpSharesZEA[msg.sender] < shares) revert InvalidAmount();
            
            // Calculate token amount
            amount = (shares * totalLiquidityZEA) / totalLPSharesZEA;
            
            lpSharesZEA[msg.sender] -= shares;
            totalLPSharesZEA -= shares;
            totalLiquidityZEA -= amount;
        } else {
            if (lpSharesDING[msg.sender] < shares) revert InvalidAmount();
            
            amount = (shares * totalLiquidityDING) / totalLPSharesDING;
            
            lpSharesDING[msg.sender] -= shares;
            totalLPSharesDING -= shares;
            totalLiquidityDING -= amount;
        }

        // Transfer tokens back to provider
        IERC20(token).transfer(msg.sender, amount);

        emit LiquidityRemoved(msg.sender, token, amount, shares, block.timestamp);
    }

    /**
     * @notice Initiate a bridge transaction to another chain
     * @param token Address of token to bridge (ZEA or DING)
     * @param amount Amount to bridge
     * @param targetChain Target chain ID
     */
    function initiateBridge(
        address token,
        uint256 amount,
        uint256 targetChain
    ) external nonReentrant whenNotPaused returns (bytes32) {
        if (!supportedChains[targetChain]) revert ChainNotSupported();
        if (amount < minBridgeAmount) revert AmountBelowMinimum();
        if (amount > maxBridgeAmount) revert AmountAboveMaximum();
        if (token != address(zeaToken) && token != address(dingToken)) {
            revert InvalidToken();
        }
        if (targetChain == block.chainid) revert SameChain();

        // Check liquidity on target chain (simulated check)
        uint256 requiredLiquidity = token == address(zeaToken)
            ? totalLiquidityZEA / 10 // Require 10% of pool
            : totalLiquidityDING / 10;
        
        if (amount > requiredLiquidity) revert InsufficientLiquidity();

        // Calculate fees
        uint256 bridgeFeeAmount = (amount * bridgeFee) / FEE_DENOMINATOR;
        uint256 lpFeeAmount = (amount * LP_FEE_BPS) / FEE_DENOMINATOR;
        uint256 totalFees = bridgeFeeAmount + lpFeeAmount;
        uint256 amountAfterFee = amount - totalFees;

        // Lock tokens in bridge contract
        IERC20(token).transferFrom(msg.sender, address(this), amount);

        // Distribute LP fees to liquidity pool
        if (token == address(zeaToken)) {
            totalLiquidityZEA += lpFeeAmount;
        } else {
            totalLiquidityDING += lpFeeAmount;
        }

        // Generate transaction hash
        bytes32 txHash = keccak256(
            abi.encodePacked(
                msg.sender,
                token,
                amount,
                targetChain,
                block.timestamp,
                block.chainid,
                userBridgeCount[msg.sender]
            )
        );

        userBridgeCount[msg.sender]++;

        emit BridgeInitiated(
            msg.sender,
            token,
            amount,
            amountAfterFee,
            targetChain,
            txHash,
            block.timestamp
        );

        return txHash;
    }

    /**
     * @notice Complete a bridge transaction from another chain (relayer only)
     * @param user User receiving tokens
     * @param token Token address
     * @param amount Amount to release
     * @param sourceChain Source chain ID
     * @param transactionHash Original transaction hash
     */
    function completeBridge(
        address user,
        address token,
        uint256 amount,
        uint256 sourceChain,
        bytes32 transactionHash
    ) external nonReentrant {
        if (!authorizedRelayers[msg.sender]) revert UnauthorizedRelayer();
        if (!supportedChains[sourceChain]) revert ChainNotSupported();
        if (processedTransactions[transactionHash]) revert AlreadyProcessed();
        if (token != address(zeaToken) && token != address(dingToken)) {
            revert InvalidToken();
        }

        // Check liquidity
        uint256 currentLiquidity = token == address(zeaToken)
            ? totalLiquidityZEA
            : totalLiquidityDING;
        
        if (amount > currentLiquidity) revert InsufficientLiquidity();

        processedTransactions[transactionHash] = true;

        // Deduct from liquidity
        if (token == address(zeaToken)) {
            totalLiquidityZEA -= amount;
        } else {
            totalLiquidityDING -= amount;
        }

        // Release tokens to user
        IERC20(token).transfer(user, amount);

        emit BridgeCompleted(
            user,
            token,
            amount,
            sourceChain,
            transactionHash,
            block.timestamp
        );
    }

    /**
     * @notice Get LP value for a provider
     * @param provider Address of LP provider
     * @param token Token address
     */
    function getLPValue(address provider, address token)
        external
        view
        returns (uint256 shares, uint256 value)
    {
        if (token == address(zeaToken)) {
            shares = lpSharesZEA[provider];
            if (totalLPSharesZEA > 0) {
                value = (shares * totalLiquidityZEA) / totalLPSharesZEA;
            }
        } else if (token == address(dingToken)) {
            shares = lpSharesDING[provider];
            if (totalLPSharesDING > 0) {
                value = (shares * totalLiquidityDING) / totalLPSharesDING;
            }
        }
    }

    /**
     * @notice Update relayer authorization (owner only)
     * @param relayer Address of relayer
     * @param authorized Whether relayer is authorized
     */
    function updateRelayer(address relayer, bool authorized)
        external
        onlyOwner
    {
        if (authorizedRelayers[relayer] != authorized) {
            authorizedRelayers[relayer] = authorized;
            relayerCount = authorized ? relayerCount + 1 : relayerCount - 1;
            emit RelayerUpdated(relayer, authorized);
        }
    }

    /**
     * @notice Update bridge fee (owner only)
     * @param newFee New fee in basis points
     */
    function updateBridgeFee(uint256 newFee) external onlyOwner {
        require(newFee <= 100, "Fee too high"); // Max 1%
        uint256 oldFee = bridgeFee;
        bridgeFee = newFee;
        emit BridgeFeeUpdated(oldFee, newFee);
    }

    /**
     * @notice Update chain support status
     * @param chainId Chain ID to update
     * @param supported Whether chain is supported
     */
    function updateChainSupport(uint256 chainId, bool supported)
        external
        onlyOwner
    {
        supportedChains[chainId] = supported;
        emit ChainSupportUpdated(chainId, supported);
    }

    /**
     * @notice Update minimum bridge amount
     * @param newMinAmount New minimum amount
     */
    function updateMinBridgeAmount(uint256 newMinAmount) external onlyOwner {
        uint256 oldAmount = minBridgeAmount;
        minBridgeAmount = newMinAmount;
        emit MinBridgeAmountUpdated(oldAmount, newMinAmount);
    }

    /**
     * @notice Update maximum bridge amount
     * @param newMaxAmount New maximum amount
     */
    function updateMaxBridgeAmount(uint256 newMaxAmount) external onlyOwner {
        uint256 oldAmount = maxBridgeAmount;
        maxBridgeAmount = newMaxAmount;
        emit MaxBridgeAmountUpdated(oldAmount, newMaxAmount);
    }

    /**
     * @notice Emergency pause
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Withdraw collected fees (owner only)
     * @param token Token to withdraw
     * @param amount Amount to withdraw
     */
    function withdrawFees(address token, uint256 amount) external onlyOwner {
        if (token != address(zeaToken) && token != address(dingToken)) {
            revert InvalidToken();
        }
        
        // Ensure we don't withdraw liquidity pool funds
        uint256 available = IERC20(token).balanceOf(address(this));
        uint256 locked = token == address(zeaToken)
            ? totalLiquidityZEA
            : totalLiquidityDING;
        
        require(available - locked >= amount, "Insufficient fees");
        IERC20(token).transfer(msg.sender, amount);
    }

    /**
     * @notice Get bridge statistics
     */
    function getBridgeStats()
        external
        view
        returns (
            uint256 zeaLiquidity,
            uint256 dingLiquidity,
            uint256 zeaLPShares,
            uint256 dingLPShares,
            uint256 activeBridgeRelayers
        )
    {
        return (
            totalLiquidityZEA,
            totalLiquidityDING,
            totalLPSharesZEA,
            totalLPSharesDING,
            relayerCount
        );
    }
}
