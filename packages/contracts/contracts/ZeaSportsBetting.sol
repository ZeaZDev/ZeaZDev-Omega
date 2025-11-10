// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title ZeaSportsBetting
 * @notice Decentralized sports betting platform with ZEA/DING wagering
 * @dev Supports multiple sports, events, and bet types
 * @author ZeaZDev Enterprises (OMEGA AI)
 * @custom:version 2.0.0 (Phase 7: Advanced GameFi)
 */
contract ZeaSportsBetting is Ownable, ReentrancyGuard, Pausable {
    IERC20 public immutable zeaToken;
    IERC20 public immutable dingToken;

    // Sports types
    enum Sport {
        FOOTBALL,
        BASKETBALL,
        ESPORTS,
        TENNIS,
        BASEBALL,
        MMA
    }

    // Event status
    enum EventStatus {
        SCHEDULED,
        LIVE,
        FINISHED,
        CANCELLED
    }

    // Bet outcome
    enum Outcome {
        TEAM_A_WIN,
        TEAM_B_WIN,
        DRAW
    }

    // Sports event
    struct Event {
        uint256 id;
        Sport sport;
        string teamA;
        string teamB;
        uint256 startTime;
        EventStatus status;
        Outcome result;
        uint256 oddsTeamA; // In basis points (e.g., 15000 = 1.5x)
        uint256 oddsTeamB;
        uint256 oddsDraw;
        uint256 totalBetsTeamA;
        uint256 totalBetsTeamB;
        uint256 totalBetsDraw;
        bool settled;
    }

    // User bet
    struct Bet {
        uint256 id;
        uint256 eventId;
        address bettor;
        address token;
        uint256 amount;
        Outcome prediction;
        uint256 odds;
        uint256 potentialPayout;
        bool settled;
        bool won;
        uint256 payout;
    }

    // Tracking
    uint256 public nextEventId = 1;
    uint256 public nextBetId = 1;
    mapping(uint256 => Event) public events;
    mapping(uint256 => Bet) public bets;
    mapping(address => uint256[]) public userBets;
    mapping(uint256 => uint256[]) public eventBets;

    // Limits
    uint256 public minBet = 1e18; // 1 token
    uint256 public maxBet = 10000e18; // 10,000 tokens
    uint256 public maxPayout = 100000e18; // 100,000 tokens

    // House edge (5%)
    uint256 public houseEdge = 500; // 5% in basis points
    uint256 public constant FEE_DENOMINATOR = 10000;
    uint256 public constant ODDS_DENOMINATOR = 10000;

    // Oracle management
    mapping(address => bool) public authorizedOracles;
    uint256 public oracleCount;

    // Events
    event EventCreated(
        uint256 indexed eventId,
        Sport sport,
        string teamA,
        string teamB,
        uint256 startTime
    );

    event BetPlaced(
        uint256 indexed betId,
        uint256 indexed eventId,
        address indexed bettor,
        Outcome prediction,
        uint256 amount,
        uint256 potentialPayout
    );

    event EventStatusUpdated(
        uint256 indexed eventId,
        EventStatus oldStatus,
        EventStatus newStatus
    );

    event EventSettled(
        uint256 indexed eventId,
        Outcome result,
        uint256 totalPaidOut
    );

    event BetSettled(
        uint256 indexed betId,
        bool won,
        uint256 payout
    );

    event OracleUpdated(address indexed oracle, bool authorized);

    // Custom errors
    error InvalidToken();
    error InvalidOdds();
    error EventNotScheduled();
    error EventAlreadyStarted();
    error EventNotFinished();
    error BetTooLow();
    error BetTooHigh();
    error PayoutExceedsMax();
    error EventNotFound();
    error BetNotFound();
    error AlreadySettled();
    error UnauthorizedOracle();
    error EventCancelled();

    constructor(
        address _zeaToken,
        address _dingToken,
        address initialOwner
    ) Ownable(initialOwner) {
        zeaToken = IERC20(_zeaToken);
        dingToken = IERC20(_dingToken);
    }

    /**
     * @notice Create a new sports event (oracle only)
     */
    function createEvent(
        Sport sport,
        string memory teamA,
        string memory teamB,
        uint256 startTime,
        uint256 oddsTeamA,
        uint256 oddsTeamB,
        uint256 oddsDraw
    ) external returns (uint256) {
        if (!authorizedOracles[msg.sender] && msg.sender != owner()) {
            revert UnauthorizedOracle();
        }
        if (oddsTeamA == 0 || oddsTeamB == 0) revert InvalidOdds();
        if (startTime <= block.timestamp) revert EventAlreadyStarted();

        uint256 eventId = nextEventId++;

        events[eventId] = Event({
            id: eventId,
            sport: sport,
            teamA: teamA,
            teamB: teamB,
            startTime: startTime,
            status: EventStatus.SCHEDULED,
            result: Outcome.TEAM_A_WIN, // Default, will be updated
            oddsTeamA: oddsTeamA,
            oddsTeamB: oddsTeamB,
            oddsDraw: oddsDraw,
            totalBetsTeamA: 0,
            totalBetsTeamB: 0,
            totalBetsDraw: 0,
            settled: false
        });

        emit EventCreated(eventId, sport, teamA, teamB, startTime);
        return eventId;
    }

    /**
     * @notice Place a bet on a sports event
     */
    function placeBet(
        uint256 eventId,
        address token,
        uint256 amount,
        Outcome prediction
    ) external nonReentrant whenNotPaused returns (uint256) {
        Event storage evt = events[eventId];
        if (evt.id == 0) revert EventNotFound();
        if (evt.status == EventStatus.CANCELLED) revert EventCancelled();
        if (evt.status != EventStatus.SCHEDULED && evt.status != EventStatus.LIVE) {
            revert EventAlreadyStarted();
        }
        if (block.timestamp >= evt.startTime) revert EventAlreadyStarted();
        if (token != address(zeaToken) && token != address(dingToken)) {
            revert InvalidToken();
        }
        if (amount < minBet) revert BetTooLow();
        if (amount > maxBet) revert BetTooHigh();

        // Get odds for prediction
        uint256 odds;
        if (prediction == Outcome.TEAM_A_WIN) {
            odds = evt.oddsTeamA;
            evt.totalBetsTeamA += amount;
        } else if (prediction == Outcome.TEAM_B_WIN) {
            odds = evt.oddsTeamB;
            evt.totalBetsTeamB += amount;
        } else {
            odds = evt.oddsDraw;
            evt.totalBetsDraw += amount;
        }

        // Calculate potential payout (amount * odds / ODDS_DENOMINATOR)
        uint256 grossPayout = (amount * odds) / ODDS_DENOMINATOR;
        uint256 fee = (grossPayout * houseEdge) / FEE_DENOMINATOR;
        uint256 potentialPayout = grossPayout - fee;

        if (potentialPayout > maxPayout) revert PayoutExceedsMax();

        // Transfer tokens from bettor
        IERC20(token).transferFrom(msg.sender, address(this), amount);

        // Create bet
        uint256 betId = nextBetId++;
        bets[betId] = Bet({
            id: betId,
            eventId: eventId,
            bettor: msg.sender,
            token: token,
            amount: amount,
            prediction: prediction,
            odds: odds,
            potentialPayout: potentialPayout,
            settled: false,
            won: false,
            payout: 0
        });

        userBets[msg.sender].push(betId);
        eventBets[eventId].push(betId);

        emit BetPlaced(
            betId,
            eventId,
            msg.sender,
            prediction,
            amount,
            potentialPayout
        );

        return betId;
    }

    /**
     * @notice Update event status (oracle only)
     */
    function updateEventStatus(uint256 eventId, EventStatus newStatus)
        external
    {
        if (!authorizedOracles[msg.sender] && msg.sender != owner()) {
            revert UnauthorizedOracle();
        }

        Event storage evt = events[eventId];
        if (evt.id == 0) revert EventNotFound();

        EventStatus oldStatus = evt.status;
        evt.status = newStatus;

        emit EventStatusUpdated(eventId, oldStatus, newStatus);
    }

    /**
     * @notice Settle an event and pay out winning bets (oracle only)
     */
    function settleEvent(uint256 eventId, Outcome result)
        external
        nonReentrant
    {
        if (!authorizedOracles[msg.sender] && msg.sender != owner()) {
            revert UnauthorizedOracle();
        }

        Event storage evt = events[eventId];
        if (evt.id == 0) revert EventNotFound();
        if (evt.settled) revert AlreadySettled();
        if (evt.status != EventStatus.FINISHED) revert EventNotFinished();

        evt.result = result;
        evt.settled = true;

        uint256 totalPaidOut = 0;
        uint256[] memory eventBetIds = eventBets[eventId];

        // Settle all bets for this event
        for (uint256 i = 0; i < eventBetIds.length; i++) {
            Bet storage bet = bets[eventBetIds[i]];
            if (!bet.settled) {
                bet.settled = true;

                if (bet.prediction == result) {
                    bet.won = true;
                    bet.payout = bet.potentialPayout;
                    totalPaidOut += bet.payout;

                    // Transfer payout to bettor
                    IERC20(bet.token).transfer(bet.bettor, bet.payout);

                    emit BetSettled(bet.id, true, bet.payout);
                } else {
                    bet.won = false;
                    bet.payout = 0;

                    emit BetSettled(bet.id, false, 0);
                }
            }
        }

        emit EventSettled(eventId, result, totalPaidOut);
    }

    /**
     * @notice Cancel an event and refund all bets (oracle only)
     */
    function cancelEvent(uint256 eventId) external nonReentrant {
        if (!authorizedOracles[msg.sender] && msg.sender != owner()) {
            revert UnauthorizedOracle();
        }

        Event storage evt = events[eventId];
        if (evt.id == 0) revert EventNotFound();
        if (evt.settled) revert AlreadySettled();

        evt.status = EventStatus.CANCELLED;
        evt.settled = true;

        uint256[] memory eventBetIds = eventBets[eventId];

        // Refund all bets
        for (uint256 i = 0; i < eventBetIds.length; i++) {
            Bet storage bet = bets[eventBetIds[i]];
            if (!bet.settled) {
                bet.settled = true;
                bet.won = false;
                bet.payout = bet.amount; // Full refund

                IERC20(bet.token).transfer(bet.bettor, bet.amount);

                emit BetSettled(bet.id, false, bet.amount);
            }
        }

        emit EventSettled(eventId, evt.result, 0);
    }

    /**
     * @notice Update oracle authorization (owner only)
     */
    function updateOracle(address oracle, bool authorized)
        external
        onlyOwner
    {
        if (authorizedOracles[oracle] != authorized) {
            authorizedOracles[oracle] = authorized;
            oracleCount = authorized ? oracleCount + 1 : oracleCount - 1;
            emit OracleUpdated(oracle, authorized);
        }
    }

    /**
     * @notice Update bet limits (owner only)
     */
    function updateBetLimits(
        uint256 newMinBet,
        uint256 newMaxBet,
        uint256 newMaxPayout
    ) external onlyOwner {
        minBet = newMinBet;
        maxBet = newMaxBet;
        maxPayout = newMaxPayout;
    }

    /**
     * @notice Update house edge (owner only)
     */
    function updateHouseEdge(uint256 newHouseEdge) external onlyOwner {
        require(newHouseEdge <= 1000, "House edge too high"); // Max 10%
        houseEdge = newHouseEdge;
    }

    /**
     * @notice Get user's bets
     */
    function getUserBets(address user)
        external
        view
        returns (uint256[] memory)
    {
        return userBets[user];
    }

    /**
     * @notice Get event's bets
     */
    function getEventBets(uint256 eventId)
        external
        view
        returns (uint256[] memory)
    {
        return eventBets[eventId];
    }

    /**
     * @notice Get event details with betting stats
     */
    function getEventStats(uint256 eventId)
        external
        view
        returns (
            uint256 totalVolume,
            uint256 teamAVolume,
            uint256 teamBVolume,
            uint256 drawVolume,
            uint256 betCount
        )
    {
        Event memory evt = events[eventId];
        return (
            evt.totalBetsTeamA + evt.totalBetsTeamB + evt.totalBetsDraw,
            evt.totalBetsTeamA,
            evt.totalBetsTeamB,
            evt.totalBetsDraw,
            eventBets[eventId].length
        );
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
     * @notice Withdraw house fees (owner only)
     */
    function withdrawFees(address token, uint256 amount)
        external
        onlyOwner
    {
        if (token != address(zeaToken) && token != address(dingToken)) {
            revert InvalidToken();
        }
        IERC20(token).transfer(owner(), amount);
    }
}
