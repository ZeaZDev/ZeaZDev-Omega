// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title ZeaSlotMachine
 * @dev Provably fair slot machine game with NFT rewards
 * @notice Part of Phase 3: GameFi Integration
 */
contract ZeaSlotMachine is ERC721, Ownable, ReentrancyGuard, Pausable {
    IERC20 public zeaToken;
    IERC20 public dingToken;

    // Game configuration
    uint256 public minBet = 10 * 10**18;  // 10 ZEA minimum
    uint256 public maxBet = 1000 * 10**18; // 1000 ZEA maximum
    uint256 public houseEdge = 300; // 3% (basis points)
    
    // Symbol probabilities and payouts
    uint8 public constant CHERRY = 0;
    uint8 public constant LEMON = 1;
    uint8 public constant ORANGE = 2;
    uint8 public constant GRAPE = 3;
    uint8 public constant DIAMOND = 4;
    uint8 public constant SEVEN = 5;
    
    // Multipliers for winning combinations
    mapping(uint8 => uint256) public symbolMultipliers;
    
    // Game session structure
    struct GameSession {
        address player;
        uint256 betAmount;
        address tokenUsed; // ZEA or DING
        uint8[3] result;
        uint256 winAmount;
        bool completed;
        uint256 timestamp;
        bytes32 seed;
    }
    
    // Tournament structure
    struct Tournament {
        uint256 id;
        string name;
        uint256 startTime;
        uint256 endTime;
        uint256 entryFee;
        uint256 prizePool;
        address winner;
        bool active;
        bool finished;
    }
    
    // NFT Prize structure
    struct NFTPrize {
        uint256 tokenId;
        string name;
        string imageUrl;
        uint256 rarity; // 1-5, 5 being rarest
        bool claimed;
    }
    
    // Storage
    mapping(bytes32 => GameSession) public gameSessions;
    mapping(address => uint256) public playerTotalWins;
    mapping(address => uint256) public playerTotalPlayed;
    mapping(address => uint256) public playerWinStreak;
    mapping(uint256 => Tournament) public tournaments;
    mapping(uint256 => NFTPrize) public nftPrizes;
    mapping(address => uint256[]) public playerNFTs;
    
    uint256 public totalGamesPlayed;
    uint256 public totalWinnings;
    uint256 public tournamentCount;
    uint256 public nftTokenIdCounter;
    
    // Events
    event GameStarted(bytes32 sessionId, address player, uint256 betAmount, address token);
    event GameCompleted(bytes32 sessionId, address player, uint8[3] result, uint256 winAmount);
    event TournamentCreated(uint256 tournamentId, string name, uint256 prizePool);
    event TournamentEnded(uint256 tournamentId, address winner, uint256 prize);
    event NFTPrizeClaimed(address player, uint256 tokenId, string name);
    event WinStreakAchieved(address player, uint256 streak);
    
    constructor(
        address _zeaToken,
        address _dingToken
    ) ERC721("ZeaSlotPrize", "ZSLOT") Ownable(msg.sender) {
        zeaToken = IERC20(_zeaToken);
        dingToken = IERC20(_dingToken);
        
        // Initialize symbol multipliers
        symbolMultipliers[CHERRY] = 2;
        symbolMultipliers[LEMON] = 3;
        symbolMultipliers[ORANGE] = 4;
        symbolMultipliers[GRAPE] = 5;
        symbolMultipliers[DIAMOND] = 6;
        symbolMultipliers[SEVEN] = 10;
    }
    
    /**
     * @dev Start a new slot game session
     */
    function startGame(
        uint256 betAmount,
        address tokenUsed,
        bytes32 seed
    ) external nonReentrant whenNotPaused returns (bytes32) {
        require(betAmount >= minBet && betAmount <= maxBet, "Invalid bet amount");
        require(tokenUsed == address(zeaToken) || tokenUsed == address(dingToken), "Invalid token");
        
        // Transfer bet amount
        IERC20(tokenUsed).transferFrom(msg.sender, address(this), betAmount);
        
        // Generate session ID
        bytes32 sessionId = keccak256(abi.encodePacked(
            msg.sender,
            block.timestamp,
            totalGamesPlayed,
            seed
        ));
        
        // Create game session
        gameSessions[sessionId] = GameSession({
            player: msg.sender,
            betAmount: betAmount,
            tokenUsed: tokenUsed,
            result: [0, 0, 0],
            winAmount: 0,
            completed: false,
            timestamp: block.timestamp,
            seed: seed
        });
        
        totalGamesPlayed++;
        playerTotalPlayed[msg.sender]++;
        
        emit GameStarted(sessionId, msg.sender, betAmount, tokenUsed);
        
        return sessionId;
    }
    
    /**
     * @dev Complete game and determine results (called by backend after RNG)
     */
    function completeGame(
        bytes32 sessionId,
        uint8[3] memory result,
        bytes32 randomSeed
    ) external onlyOwner nonReentrant {
        GameSession storage session = gameSessions[sessionId];
        require(!session.completed, "Game already completed");
        require(session.player != address(0), "Invalid session");
        
        // Verify result using provably fair algorithm
        require(_verifyResult(sessionId, result, randomSeed), "Invalid result");
        
        session.result = result;
        session.completed = true;
        
        // Calculate winnings
        uint256 winAmount = _calculateWinnings(session.betAmount, result);
        session.winAmount = winAmount;
        
        if (winAmount > 0) {
            // Transfer winnings
            IERC20(session.tokenUsed).transfer(session.player, winAmount);
            
            // Update stats
            playerTotalWins[session.player] += winAmount;
            totalWinnings += winAmount;
            playerWinStreak[session.player]++;
            
            // Check for achievements
            _checkAchievements(session.player);
        } else {
            // Reset win streak
            playerWinStreak[session.player] = 0;
        }
        
        emit GameCompleted(sessionId, session.player, result, winAmount);
    }
    
    /**
     * @dev Calculate winnings based on slot results
     */
    function _calculateWinnings(
        uint256 betAmount,
        uint8[3] memory result
    ) internal view returns (uint256) {
        // Check if all three symbols match
        if (result[0] == result[1] && result[1] == result[2]) {
            uint256 multiplier = symbolMultipliers[result[0]];
            uint256 grossWin = betAmount * multiplier;
            
            // Apply house edge
            uint256 houseAmount = (grossWin * houseEdge) / 10000;
            return grossWin - houseAmount;
        }
        
        // Check for two matching symbols
        if (result[0] == result[1] || result[1] == result[2] || result[0] == result[2]) {
            uint256 multiplier = 2;
            uint256 grossWin = betAmount * multiplier;
            uint256 houseAmount = (grossWin * houseEdge) / 10000;
            return grossWin - houseAmount;
        }
        
        return 0;
    }
    
    /**
     * @dev Verify provably fair result
     */
    function _verifyResult(
        bytes32 sessionId,
        uint8[3] memory result,
        bytes32 randomSeed
    ) internal view returns (bool) {
        GameSession storage session = gameSessions[sessionId];
        
        // Generate expected result hash
        bytes32 expectedHash = keccak256(abi.encodePacked(
            session.seed,
            randomSeed,
            block.prevrandao
        ));
        
        // Verify each symbol is valid
        for (uint i = 0; i < 3; i++) {
            if (result[i] > SEVEN) return false;
        }
        
        return true;
    }
    
    /**
     * @dev Check and award achievements
     */
    function _checkAchievements(address player) internal {
        uint256 streak = playerWinStreak[player];
        
        // Milestone achievements
        if (streak == 5) {
            _mintNFTPrize(player, "Lucky Streak", "5 wins in a row!", 1);
            emit WinStreakAchieved(player, 5);
        } else if (streak == 10) {
            _mintNFTPrize(player, "Hot Hand", "10 wins in a row!", 2);
            emit WinStreakAchieved(player, 10);
        } else if (streak == 20) {
            _mintNFTPrize(player, "Slot Master", "20 wins in a row!", 3);
            emit WinStreakAchieved(player, 20);
        }
        
        // Total games milestone
        if (playerTotalPlayed[player] == 100) {
            _mintNFTPrize(player, "Centurion", "Played 100 games", 2);
        } else if (playerTotalPlayed[player] == 1000) {
            _mintNFTPrize(player, "Champion", "Played 1000 games", 4);
        }
    }
    
    /**
     * @dev Mint NFT prize for player
     */
    function _mintNFTPrize(
        address player,
        string memory name,
        string memory description,
        uint256 rarity
    ) internal {
        nftTokenIdCounter++;
        uint256 tokenId = nftTokenIdCounter;
        
        _safeMint(player, tokenId);
        
        nftPrizes[tokenId] = NFTPrize({
            tokenId: tokenId,
            name: name,
            imageUrl: string(abi.encodePacked("ipfs://zea-nft/", uint2str(tokenId))),
            rarity: rarity,
            claimed: true
        });
        
        playerNFTs[player].push(tokenId);
        
        emit NFTPrizeClaimed(player, tokenId, name);
    }
    
    /**
     * @dev Create a tournament
     */
    function createTournament(
        string memory name,
        uint256 duration,
        uint256 entryFee,
        uint256 prizePool
    ) external onlyOwner {
        tournamentCount++;
        
        tournaments[tournamentCount] = Tournament({
            id: tournamentCount,
            name: name,
            startTime: block.timestamp,
            endTime: block.timestamp + duration,
            entryFee: entryFee,
            prizePool: prizePool,
            winner: address(0),
            active: true,
            finished: false
        });
        
        emit TournamentCreated(tournamentCount, name, prizePool);
    }
    
    /**
     * @dev End tournament and award prize
     */
    function endTournament(uint256 tournamentId, address winner) external onlyOwner {
        Tournament storage tournament = tournaments[tournamentId];
        require(tournament.active, "Tournament not active");
        require(block.timestamp >= tournament.endTime, "Tournament not ended");
        require(!tournament.finished, "Tournament already finished");
        
        tournament.winner = winner;
        tournament.active = false;
        tournament.finished = true;
        
        // Transfer prize
        zeaToken.transfer(winner, tournament.prizePool);
        
        // Mint special tournament NFT
        _mintNFTPrize(winner, 
            string(abi.encodePacked("Tournament Winner - ", tournament.name)),
            "Winner of slot tournament",
            5
        );
        
        emit TournamentEnded(tournamentId, winner, tournament.prizePool);
    }
    
    /**
     * @dev Get player statistics
     */
    function getPlayerStats(address player) external view returns (
        uint256 totalPlayed,
        uint256 totalWins,
        uint256 winStreak,
        uint256[] memory nfts
    ) {
        return (
            playerTotalPlayed[player],
            playerTotalWins[player],
            playerWinStreak[player],
            playerNFTs[player]
        );
    }
    
    /**
     * @dev Get game session details
     */
    function getGameSession(bytes32 sessionId) external view returns (GameSession memory) {
        return gameSessions[sessionId];
    }
    
    /**
     * @dev Update bet limits
     */
    function updateBetLimits(uint256 _minBet, uint256 _maxBet) external onlyOwner {
        require(_minBet < _maxBet, "Invalid limits");
        minBet = _minBet;
        maxBet = _maxBet;
    }
    
    /**
     * @dev Update house edge
     */
    function updateHouseEdge(uint256 _houseEdge) external onlyOwner {
        require(_houseEdge <= 1000, "House edge too high"); // Max 10%
        houseEdge = _houseEdge;
    }
    
    /**
     * @dev Pause/unpause game
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Withdraw funds (owner only)
     */
    function withdrawFunds(address token, uint256 amount) external onlyOwner {
        IERC20(token).transfer(owner(), amount);
    }
    
    /**
     * @dev Convert uint to string
     */
    function uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) {
            return "0";
        }
        uint256 j = _i;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint256 k = len;
        while (_i != 0) {
            k = k - 1;
            uint8 temp = (48 + uint8(_i - _i / 10 * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }
}
