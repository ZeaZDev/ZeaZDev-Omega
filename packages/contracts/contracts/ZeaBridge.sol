// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title ZeaBridge
 * @notice Cross-chain bridge for ZEA and DING tokens
 * @dev Supports Polygon, Arbitrum, and Base networks
 */
contract ZeaBridge is Ownable, ReentrancyGuard, Pausable {
    // Token addresses
    IERC20 public zeaToken;
    IERC20 public dingToken;

    // Supported chain IDs
    uint256 public constant ETHEREUM_CHAIN_ID = 1;
    uint256 public constant OPTIMISM_CHAIN_ID = 10;
    uint256 public constant POLYGON_CHAIN_ID = 137;
    uint256 public constant ARBITRUM_CHAIN_ID = 42161;
    uint256 public constant BASE_CHAIN_ID = 8453;

    // Bridge fee (0.1% = 10 basis points)
    uint256 public bridgeFee = 10;
    uint256 public constant FEE_DENOMINATOR = 10000;

    // Minimum bridge amount (prevent dust attacks)
    uint256 public minBridgeAmount = 1e18; // 1 token

    // Track bridge transactions
    mapping(bytes32 => bool) public processedTransactions;
    mapping(uint256 => bool) public supportedChains;
    mapping(address => uint256) public userBridgeCount;

    // Events
    event BridgeInitiated(
        address indexed user,
        address indexed token,
        uint256 amount,
        uint256 targetChain,
        bytes32 indexed transactionHash
    );

    event BridgeCompleted(
        address indexed user,
        address indexed token,
        uint256 amount,
        uint256 sourceChain,
        bytes32 indexed transactionHash
    );

    event BridgeFeeUpdated(uint256 oldFee, uint256 newFee);
    event ChainSupportUpdated(uint256 chainId, bool supported);
    event MinBridgeAmountUpdated(uint256 oldAmount, uint256 newAmount);

    constructor(address _zeaToken, address _dingToken) {
        zeaToken = IERC20(_zeaToken);
        dingToken = IERC20(_dingToken);

        // Enable supported chains by default
        supportedChains[OPTIMISM_CHAIN_ID] = true;
        supportedChains[POLYGON_CHAIN_ID] = true;
        supportedChains[ARBITRUM_CHAIN_ID] = true;
        supportedChains[BASE_CHAIN_ID] = true;
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
    ) external nonReentrant whenNotPaused {
        require(supportedChains[targetChain], "Chain not supported");
        require(amount >= minBridgeAmount, "Amount below minimum");
        require(
            token == address(zeaToken) || token == address(dingToken),
            "Invalid token"
        );

        // Calculate fee
        uint256 fee = (amount * bridgeFee) / FEE_DENOMINATOR;
        uint256 amountAfterFee = amount - fee;

        // Lock tokens in bridge contract
        IERC20(token).transferFrom(msg.sender, address(this), amount);

        // Generate transaction hash
        bytes32 txHash = keccak256(
            abi.encodePacked(
                msg.sender,
                token,
                amount,
                targetChain,
                block.timestamp,
                userBridgeCount[msg.sender]
            )
        );

        userBridgeCount[msg.sender]++;

        emit BridgeInitiated(
            msg.sender,
            token,
            amountAfterFee,
            targetChain,
            txHash
        );
    }

    /**
     * @notice Complete a bridge transaction from another chain
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
    ) external onlyOwner nonReentrant {
        require(supportedChains[sourceChain], "Chain not supported");
        require(!processedTransactions[transactionHash], "Already processed");
        require(
            token == address(zeaToken) || token == address(dingToken),
            "Invalid token"
        );

        processedTransactions[transactionHash] = true;

        // Release tokens to user
        IERC20(token).transfer(user, amount);

        emit BridgeCompleted(user, token, amount, sourceChain, transactionHash);
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
     * @notice Withdraw collected fees
     * @param token Token to withdraw
     * @param amount Amount to withdraw
     */
    function withdrawFees(address token, uint256 amount) external onlyOwner {
        require(
            token == address(zeaToken) || token == address(dingToken),
            "Invalid token"
        );
        IERC20(token).transfer(msg.sender, amount);
    }
}
