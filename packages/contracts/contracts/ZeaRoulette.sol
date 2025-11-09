// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title ZeaRoulette
 * @notice Decentralized roulette game with ZEA/DING betting
 * @dev European roulette (0-36)
 */
contract ZeaRoulette is Ownable, ReentrancyGuard, Pausable {
    IERC20 public zeaToken;
    IERC20 public dingToken;

    // Bet types
    enum BetType {
        STRAIGHT, // Single number (35:1)
        SPLIT, // Two numbers (17:1)
        STREET, // Three numbers (11:1)
        CORNER, // Four numbers (8:1)
        SIX_LINE, // Six numbers (5:1)
        DOZEN, // First/Second/Third dozen (2:1)
        COLUMN, // Column (2:1)
        RED_BLACK, // Red or Black (1:1)
        EVEN_ODD, // Even or Odd (1:1)
        HIGH_LOW // 1-18 or 19-36 (1:1)
    }

    // Bet structure
    struct Bet {
        address player;
        address token;
        uint256 amount;
        BetType betType;
        uint8[] numbers;
        uint256 timestamp;
        bool settled;
        bool won;
        uint256 payout;
    }

    // Spin result
    struct Spin {
        uint256 id;
        address player;
        uint8 result;
        uint256 timestamp;
        uint256 totalBets;
        uint256 totalPayout;
    }

    // Tracking
    uint256 public nextSpinId = 1;
    mapping(uint256 => Spin) public spins;
    mapping(uint256 => Bet[]) public spinBets;
    mapping(address => uint256[]) public userSpins;
    mapping(address => uint256) public userTotalWagered;
    mapping(address => uint256) public userTotalWon;

    // Payouts for each bet type
    mapping(BetType => uint256) public payouts;

    // Minimum and maximum bets
    uint256 public minBet = 1e18; // 1 token
    uint256 public maxBet = 1000e18; // 1000 tokens

    // House edge (2.7% for European roulette)
    uint256 public houseEdge = 270; // 2.7% in basis points
    uint256 public constant FEE_DENOMINATOR = 10000;

    // Red numbers in roulette
    uint8[] private redNumbers = [
        1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36
    ];

    // Events
    event BetPlaced(
        uint256 indexed spinId,
        address indexed player,
        BetType betType,
        uint256 amount,
        uint8[] numbers
    );

    event SpinCompleted(
        uint256 indexed spinId,
        address indexed player,
        uint8 result,
        uint256 totalPayout
    );

    event BetSettled(
        uint256 indexed spinId,
        uint256 betIndex,
        bool won,
        uint256 payout
    );

    constructor(address _zeaToken, address _dingToken) {
        zeaToken = IERC20(_zeaToken);
        dingToken = IERC20(_dingToken);

        // Initialize payouts
        payouts[BetType.STRAIGHT] = 35;
        payouts[BetType.SPLIT] = 17;
        payouts[BetType.STREET] = 11;
        payouts[BetType.CORNER] = 8;
        payouts[BetType.SIX_LINE] = 5;
        payouts[BetType.DOZEN] = 2;
        payouts[BetType.COLUMN] = 2;
        payouts[BetType.RED_BLACK] = 1;
        payouts[BetType.EVEN_ODD] = 1;
        payouts[BetType.HIGH_LOW] = 1;
    }

    /**
     * @notice Place a bet on the roulette table
     */
    function placeBet(
        address token,
        uint256 amount,
        BetType betType,
        uint8[] calldata numbers
    ) external nonReentrant whenNotPaused returns (uint256 spinId) {
        require(
            token == address(zeaToken) || token == address(dingToken),
            "Invalid token"
        );
        require(amount >= minBet && amount <= maxBet, "Invalid bet amount");
        require(_validateBet(betType, numbers), "Invalid bet");

        // Create new spin if needed
        spinId = _getOrCreateSpin(msg.sender);

        // Transfer bet amount
        IERC20(token).transferFrom(msg.sender, address(this), amount);

        // Record bet
        spinBets[spinId].push(
            Bet({
                player: msg.sender,
                token: token,
                amount: amount,
                betType: betType,
                numbers: numbers,
                timestamp: block.timestamp,
                settled: false,
                won: false,
                payout: 0
            })
        );

        spins[spinId].totalBets += amount;
        userTotalWagered[msg.sender] += amount;

        emit BetPlaced(spinId, msg.sender, betType, amount, numbers);

        return spinId;
    }

    /**
     * @notice Spin the roulette wheel
     */
    function spin(uint256 spinId) external nonReentrant {
        Spin storage spinData = spins[spinId];
        require(spinData.player == msg.sender, "Not your spin");
        require(spinData.result == 0 && spinData.timestamp == 0, "Already spun");
        require(spinBets[spinId].length > 0, "No bets placed");

        // Generate random number (0-36)
        // Note: This is simplified. In production, use Chainlink VRF or similar
        uint8 result = uint8(
            uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, msg.sender))) % 37
        );

        spinData.result = result;
        spinData.timestamp = block.timestamp;

        // Settle all bets
        uint256 totalPayout = 0;
        for (uint256 i = 0; i < spinBets[spinId].length; i++) {
            uint256 payout = _settleBet(spinId, i, result);
            totalPayout += payout;
        }

        spinData.totalPayout = totalPayout;
        userTotalWon[msg.sender] += totalPayout;

        emit SpinCompleted(spinId, msg.sender, result, totalPayout);
    }

    /**
     * @notice Settle a single bet
     */
    function _settleBet(
        uint256 spinId,
        uint256 betIndex,
        uint8 result
    ) private returns (uint256 payout) {
        Bet storage bet = spinBets[spinId][betIndex];
        require(!bet.settled, "Bet already settled");

        bool won = _checkWin(bet.betType, bet.numbers, result);
        bet.settled = true;
        bet.won = won;

        if (won) {
            // Calculate payout (original bet + winnings)
            uint256 multiplier = payouts[bet.betType] + 1;
            payout = bet.amount * multiplier;

            // Apply house edge
            uint256 fee = (payout * houseEdge) / FEE_DENOMINATOR;
            payout -= fee;

            bet.payout = payout;

            // Transfer payout
            IERC20(bet.token).transfer(bet.player, payout);
        }

        emit BetSettled(spinId, betIndex, won, payout);

        return payout;
    }

    /**
     * @notice Check if a bet won
     */
    function _checkWin(
        BetType betType,
        uint8[] memory numbers,
        uint8 result
    ) private view returns (bool) {
        if (betType == BetType.STRAIGHT) {
            return numbers[0] == result;
        } else if (betType == BetType.RED_BLACK) {
            // numbers[0] = 0 for red, 1 for black
            if (result == 0) return false; // Green zero
            bool isRed = _isRedNumber(result);
            return (numbers[0] == 0 && isRed) || (numbers[0] == 1 && !isRed);
        } else if (betType == BetType.EVEN_ODD) {
            // numbers[0] = 0 for even, 1 for odd
            if (result == 0) return false; // Zero is neither
            return (numbers[0] == 0 && result % 2 == 0) || (numbers[0] == 1 && result % 2 == 1);
        } else if (betType == BetType.HIGH_LOW) {
            // numbers[0] = 0 for low (1-18), 1 for high (19-36)
            if (result == 0) return false;
            return (numbers[0] == 0 && result <= 18) || (numbers[0] == 1 && result >= 19);
        } else if (betType == BetType.DOZEN) {
            // numbers[0] = 0 for 1st, 1 for 2nd, 2 for 3rd dozen
            if (result == 0) return false;
            uint8 dozen = (result - 1) / 12;
            return dozen == numbers[0];
        } else if (betType == BetType.COLUMN) {
            // numbers[0] = 0, 1, or 2 for column
            if (result == 0) return false;
            return (result - 1) % 3 == numbers[0];
        } else {
            // For other bet types, check if result is in numbers array
            for (uint256 i = 0; i < numbers.length; i++) {
                if (numbers[i] == result) return true;
            }
            return false;
        }
    }

    /**
     * @notice Check if number is red
     */
    function _isRedNumber(uint8 number) private view returns (bool) {
        for (uint256 i = 0; i < redNumbers.length; i++) {
            if (redNumbers[i] == number) return true;
        }
        return false;
    }

    /**
     * @notice Validate bet parameters
     */
    function _validateBet(BetType betType, uint8[] calldata numbers)
        private
        pure
        returns (bool)
    {
        if (betType == BetType.STRAIGHT) {
            return numbers.length == 1 && numbers[0] <= 36;
        } else if (betType == BetType.SPLIT) {
            return numbers.length == 2;
        } else if (betType == BetType.STREET) {
            return numbers.length == 3;
        } else if (betType == BetType.CORNER) {
            return numbers.length == 4;
        } else if (betType == BetType.SIX_LINE) {
            return numbers.length == 6;
        } else if (
            betType == BetType.DOZEN ||
            betType == BetType.COLUMN ||
            betType == BetType.RED_BLACK ||
            betType == BetType.EVEN_ODD ||
            betType == BetType.HIGH_LOW
        ) {
            return numbers.length == 1 && numbers[0] <= 2;
        }
        return false;
    }

    /**
     * @notice Get or create spin for player
     */
    function _getOrCreateSpin(address player) private returns (uint256) {
        // Check if player has an active spin (not yet spun)
        uint256[] storage playerSpins = userSpins[player];
        if (playerSpins.length > 0) {
            uint256 lastSpinId = playerSpins[playerSpins.length - 1];
            if (spins[lastSpinId].timestamp == 0) {
                return lastSpinId;
            }
        }

        // Create new spin
        uint256 spinId = nextSpinId++;
        spins[spinId] = Spin({
            id: spinId,
            player: player,
            result: 0,
            timestamp: 0,
            totalBets: 0,
            totalPayout: 0
        });

        userSpins[player].push(spinId);

        return spinId;
    }

    /**
     * @notice Get spin details
     */
    function getSpin(uint256 spinId)
        external
        view
        returns (
            address player,
            uint8 result,
            uint256 timestamp,
            uint256 totalBets,
            uint256 totalPayout,
            uint256 betCount
        )
    {
        Spin storage spinData = spins[spinId];
        return (
            spinData.player,
            spinData.result,
            spinData.timestamp,
            spinData.totalBets,
            spinData.totalPayout,
            spinBets[spinId].length
        );
    }

    /**
     * @notice Get user statistics
     */
    function getUserStats(address user)
        external
        view
        returns (
            uint256 totalWagered,
            uint256 totalWon,
            uint256 spinCount
        )
    {
        return (userTotalWagered[user], userTotalWon[user], userSpins[user].length);
    }

    /**
     * @notice Update bet limits
     */
    function updateBetLimits(uint256 newMin, uint256 newMax) external onlyOwner {
        require(newMin > 0 && newMax > newMin, "Invalid limits");
        minBet = newMin;
        maxBet = newMax;
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
}
