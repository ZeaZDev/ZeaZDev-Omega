// ZeaZDev [Smart Contract - Staking] //
// Project: ZeaZDev FiGaTect Super-App //
// Version: 1.0.0 (Omega Scaffolding) //
// Author: ZeaZDev Meta-Intelligence (Generated) //
// --- DO NOT EDIT HEADER --- //

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./ZeaToken.sol";

/**
 * @title ZeaZStake
 * @dev Production-grade staking contract for $ZEA tokens
 * Users can stake ZEA tokens and earn rewards over time
 */
contract ZeaZStake is Ownable, ReentrancyGuard {
    ZeaToken public immutable zeaToken;

    struct StakeInfo {
        uint256 amount;
        uint256 startTime;
        uint256 lastClaimTime;
        uint256 totalRewardsClaimed;
    }

    // Annual percentage yield (in basis points, e.g., 1000 = 10%)
    uint256 public annualAPY = 1000; // 10% APY
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant MIN_STAKE_AMOUNT = 100 * 10**18; // 100 ZEA minimum
    uint256 public constant LOCK_PERIOD = 7 days; // Minimum lock period

    mapping(address => StakeInfo) public stakes;
    uint256 public totalStaked;

    event Staked(address indexed user, uint256 amount, uint256 timestamp);
    event Unstaked(address indexed user, uint256 amount, uint256 timestamp);
    event RewardsClaimed(address indexed user, uint256 reward, uint256 timestamp);
    event APYUpdated(uint256 oldAPY, uint256 newAPY);

    error InsufficientStakeAmount();
    error NoStakeFound();
    error LockPeriodNotMet();
    error InsufficientBalance();

    constructor(address _zeaToken, address initialOwner) Ownable(initialOwner) {
        zeaToken = ZeaToken(_zeaToken);
    }

    /**
     * @dev Stake ZEA tokens
     * @param amount Amount of ZEA to stake
     */
    function stake(uint256 amount) external nonReentrant {
        if (amount < MIN_STAKE_AMOUNT) revert InsufficientStakeAmount();

        // Transfer tokens from user
        require(
            zeaToken.transferFrom(msg.sender, address(this), amount),
            "ZeaZStake: transfer failed"
        );

        StakeInfo storage userStake = stakes[msg.sender];

        // If already staking, claim pending rewards first
        if (userStake.amount > 0) {
            _claimRewards(msg.sender);
        }

        // Update stake info
        userStake.amount += amount;
        userStake.startTime = block.timestamp;
        userStake.lastClaimTime = block.timestamp;
        totalStaked += amount;

        emit Staked(msg.sender, amount, block.timestamp);
    }

    /**
     * @dev Unstake ZEA tokens
     * @param amount Amount to unstake
     */
    function unstake(uint256 amount) external nonReentrant {
        StakeInfo storage userStake = stakes[msg.sender];
        
        if (userStake.amount == 0) revert NoStakeFound();
        if (userStake.amount < amount) revert InsufficientBalance();
        if (block.timestamp < userStake.startTime + LOCK_PERIOD) {
            revert LockPeriodNotMet();
        }

        // Claim all pending rewards
        _claimRewards(msg.sender);

        // Update stake info
        userStake.amount -= amount;
        totalStaked -= amount;

        // Transfer tokens back to user
        require(
            zeaToken.transfer(msg.sender, amount),
            "ZeaZStake: transfer failed"
        );

        emit Unstaked(msg.sender, amount, block.timestamp);
    }

    /**
     * @dev Claim staking rewards
     */
    function claimRewards() external nonReentrant {
        _claimRewards(msg.sender);
    }

    /**
     * @dev Internal function to calculate and claim rewards
     */
    function _claimRewards(address user) internal {
        StakeInfo storage userStake = stakes[user];
        
        if (userStake.amount == 0) revert NoStakeFound();

        uint256 reward = calculateRewards(user);
        
        if (reward > 0) {
            userStake.lastClaimTime = block.timestamp;
            userStake.totalRewardsClaimed += reward;

            // Mint reward tokens
            zeaToken.mint(user, reward);

            emit RewardsClaimed(user, reward, block.timestamp);
        }
    }

    /**
     * @dev Calculate pending rewards for a user
     * @param user Address of the staker
     * @return Pending reward amount
     */
    function calculateRewards(address user) public view returns (uint256) {
        StakeInfo memory userStake = stakes[user];
        
        if (userStake.amount == 0) return 0;

        uint256 stakingDuration = block.timestamp - userStake.lastClaimTime;
        uint256 reward = (userStake.amount * annualAPY * stakingDuration) / 
                        (BASIS_POINTS * 365 days);

        return reward;
    }

    /**
     * @dev Get stake information for a user
     * @param user Address of the staker
     */
    function getStakeInfo(address user) external view returns (
        uint256 amount,
        uint256 startTime,
        uint256 lastClaimTime,
        uint256 totalRewardsClaimed,
        uint256 pendingRewards
    ) {
        StakeInfo memory userStake = stakes[user];
        return (
            userStake.amount,
            userStake.startTime,
            userStake.lastClaimTime,
            userStake.totalRewardsClaimed,
            calculateRewards(user)
        );
    }

    /**
     * @dev Update APY (owner only)
     * @param newAPY New APY in basis points
     */
    function updateAPY(uint256 newAPY) external onlyOwner {
        require(newAPY <= 5000, "ZeaZStake: APY too high"); // Max 50%
        uint256 oldAPY = annualAPY;
        annualAPY = newAPY;
        emit APYUpdated(oldAPY, newAPY);
    }
}
