// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title ZeaPoker
 * @notice Decentralized poker game with ZEA/DING betting
 * @dev Texas Hold'em style poker game
 */
contract ZeaPoker is Ownable, ReentrancyGuard, Pausable {
    IERC20 public zeaToken;
    IERC20 public dingToken;

    // Game states
    enum GameState {
        WAITING,
        PREFLOP,
        FLOP,
        TURN,
        RIVER,
        SHOWDOWN,
        ENDED
    }

    // Player in a game
    struct Player {
        address addr;
        uint256 chips;
        uint256 currentBet;
        bool folded;
        bool allIn;
        uint8[2] holeCards;
    }

    // Poker game
    struct Game {
        uint256 id;
        address[] players;
        uint256 pot;
        uint256 smallBlind;
        uint256 bigBlind;
        uint256 minBuyIn;
        uint256 maxBuyIn;
        GameState state;
        uint8[5] communityCards;
        uint8 communityCardCount;
        address currentPlayer;
        address dealer;
        bool isActive;
        address token; // ZEA or DING
    }

    // Game tracking
    uint256 public nextGameId = 1;
    mapping(uint256 => Game) public games;
    mapping(uint256 => mapping(address => Player)) public gamePlayers;
    mapping(address => uint256[]) public userGames;

    // House edge (2%)
    uint256 public houseEdge = 200; // 2% in basis points
    uint256 public constant FEE_DENOMINATOR = 10000;

    // Events
    event GameCreated(
        uint256 indexed gameId,
        address indexed creator,
        uint256 smallBlind,
        uint256 bigBlind,
        address token
    );

    event PlayerJoined(uint256 indexed gameId, address indexed player, uint256 buyIn);
    event PlayerFolded(uint256 indexed gameId, address indexed player);
    event PlayerBet(uint256 indexed gameId, address indexed player, uint256 amount);
    event GameStateChanged(uint256 indexed gameId, GameState newState);
    event GameEnded(uint256 indexed gameId, address indexed winner, uint256 pot);

    constructor(address _zeaToken, address _dingToken) {
        zeaToken = IERC20(_zeaToken);
        dingToken = IERC20(_dingToken);
    }

    /**
     * @notice Create a new poker game
     */
    function createGame(
        uint256 smallBlind,
        uint256 bigBlind,
        uint256 minBuyIn,
        uint256 maxBuyIn,
        address token
    ) external nonReentrant whenNotPaused returns (uint256) {
        require(
            token == address(zeaToken) || token == address(dingToken),
            "Invalid token"
        );
        require(smallBlind > 0 && bigBlind > smallBlind, "Invalid blinds");
        require(minBuyIn >= bigBlind * 20, "Min buy-in too low");
        require(maxBuyIn >= minBuyIn, "Invalid buy-in range");

        uint256 gameId = nextGameId++;

        Game storage game = games[gameId];
        game.id = gameId;
        game.smallBlind = smallBlind;
        game.bigBlind = bigBlind;
        game.minBuyIn = minBuyIn;
        game.maxBuyIn = maxBuyIn;
        game.state = GameState.WAITING;
        game.isActive = true;
        game.token = token;

        emit GameCreated(gameId, msg.sender, smallBlind, bigBlind, token);

        return gameId;
    }

    /**
     * @notice Join a poker game
     */
    function joinGame(uint256 gameId, uint256 buyIn) external nonReentrant whenNotPaused {
        Game storage game = games[gameId];
        require(game.isActive, "Game not active");
        require(game.state == GameState.WAITING, "Game already started");
        require(game.players.length < 9, "Game full");
        require(
            buyIn >= game.minBuyIn && buyIn <= game.maxBuyIn,
            "Invalid buy-in"
        );

        // Check player not already in game
        for (uint256 i = 0; i < game.players.length; i++) {
            require(game.players[i] != msg.sender, "Already joined");
        }

        // Transfer buy-in
        IERC20(game.token).transferFrom(msg.sender, address(this), buyIn);

        // Add player
        game.players.push(msg.sender);
        gamePlayers[gameId][msg.sender] = Player({
            addr: msg.sender,
            chips: buyIn,
            currentBet: 0,
            folded: false,
            allIn: false,
            holeCards: [0, 0]
        });

        userGames[msg.sender].push(gameId);

        emit PlayerJoined(gameId, msg.sender, buyIn);

        // Start game if enough players
        if (game.players.length >= 2) {
            _startGame(gameId);
        }
    }

    /**
     * @notice Fold hand
     */
    function fold(uint256 gameId) external nonReentrant {
        Game storage game = games[gameId];
        Player storage player = gamePlayers[gameId][msg.sender];

        require(game.isActive, "Game not active");
        require(!player.folded, "Already folded");
        require(game.currentPlayer == msg.sender, "Not your turn");

        player.folded = true;

        emit PlayerFolded(gameId, msg.sender);

        _checkRoundEnd(gameId);
    }

    /**
     * @notice Place bet
     */
    function bet(uint256 gameId, uint256 amount) external nonReentrant {
        Game storage game = games[gameId];
        Player storage player = gamePlayers[gameId][msg.sender];

        require(game.isActive, "Game not active");
        require(!player.folded, "Already folded");
        require(game.currentPlayer == msg.sender, "Not your turn");
        require(amount <= player.chips, "Insufficient chips");

        player.chips -= amount;
        player.currentBet += amount;
        game.pot += amount;

        if (player.chips == 0) {
            player.allIn = true;
        }

        emit PlayerBet(gameId, msg.sender, amount);

        _checkRoundEnd(gameId);
    }

    /**
     * @notice Start game (internal)
     */
    function _startGame(uint256 gameId) private {
        Game storage game = games[gameId];
        game.state = GameState.PREFLOP;
        game.dealer = game.players[0];
        game.currentPlayer = game.players[1 % game.players.length];

        emit GameStateChanged(gameId, GameState.PREFLOP);
    }

    /**
     * @notice Check if round should end
     */
    function _checkRoundEnd(uint256 gameId) private {
        Game storage game = games[gameId];

        // Count active players
        uint256 activePlayers = 0;
        address lastActivePlayer;

        for (uint256 i = 0; i < game.players.length; i++) {
            address playerAddr = game.players[i];
            Player storage player = gamePlayers[gameId][playerAddr];

            if (!player.folded) {
                activePlayers++;
                lastActivePlayer = playerAddr;
            }
        }

        // If only one player left, they win
        if (activePlayers == 1) {
            _endGame(gameId, lastActivePlayer);
        }
    }

    /**
     * @notice End game and distribute pot
     */
    function _endGame(uint256 gameId, address winner) private {
        Game storage game = games[gameId];

        // Calculate house fee
        uint256 fee = (game.pot * houseEdge) / FEE_DENOMINATOR;
        uint256 payout = game.pot - fee;

        // Transfer winnings
        IERC20(game.token).transfer(winner, payout);

        game.state = GameState.ENDED;
        game.isActive = false;

        emit GameEnded(gameId, winner, payout);
    }

    /**
     * @notice Get game details
     */
    function getGame(uint256 gameId)
        external
        view
        returns (
            uint256 id,
            uint256 pot,
            GameState state,
            uint256 playerCount,
            address token
        )
    {
        Game storage game = games[gameId];
        return (game.id, game.pot, game.state, game.players.length, game.token);
    }

    /**
     * @notice Get player in game
     */
    function getPlayer(uint256 gameId, address playerAddr)
        external
        view
        returns (
            uint256 chips,
            uint256 currentBet,
            bool folded
        )
    {
        Player storage player = gamePlayers[gameId][playerAddr];
        return (player.chips, player.currentBet, player.folded);
    }

    /**
     * @notice Update house edge
     */
    function updateHouseEdge(uint256 newEdge) external onlyOwner {
        require(newEdge <= 500, "Edge too high"); // Max 5%
        houseEdge = newEdge;
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
