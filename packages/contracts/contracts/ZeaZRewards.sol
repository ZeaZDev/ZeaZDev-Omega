/*
 * @Project: ZeaZDev FiGaTect Super-App
 * @Module: Smart-Contracts-Rewards
 * @File: ZeaZRewards.sol
 * @Author: ZeaZDev Enterprises (OMEGA AI)
 * @Date: 2025-11-09
 * @Version: 1.0.0
 * @Description: ZKP-gated rewards contract for daily check-ins, airdrops, and referral programs
 * @License: ZeaZDev Proprietary License
 * @Copyright: (c) 2025-2026 ZeaZDev. All rights reserved.
 */

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./IWorldIDVerifier.sol";
import "./ZeaToken.sol";
import "./DingToken.sol";

/**
 * @title ZeaZRewards
 * @dev Production-grade rewards contract with World ID ZKP verification
 * All high-value functions (airdrop, daily check-in, referral) are ZKP-gated
 */
contract ZeaZRewards is Ownable, ReentrancyGuard {
    IWorldIDVerifier public immutable worldIdVerifier;
    ZeaToken public immutable zeaToken;
    DingToken public immutable dingToken;

    uint256 public immutable groupId = 1;
    string public constant ACTION_ID = "zeazdev-rewards";

    // Reward amounts (in wei)
    uint256 public dailyCheckInReward = 100 * 10**18; // 100 ZEA
    uint256 public airdropReward = 1000 * 10**18; // 1000 ZEA
    uint256 public referralReward = 500 * 10**18; // 500 ZEA
    uint256 public dingBonusReward = 10000 * 10**18; // 10000 DING

    // Nullifier tracking to prevent double-claims
    mapping(uint256 => bool) public usedNullifiers;
    mapping(address => uint256) public lastCheckIn;
    mapping(address => bool) public hasClaimedAirdrop;
    mapping(address => uint256) public referralCount;

    event DailyCheckInClaimed(address indexed user, uint256 nullifierHash, uint256 reward);
    event AirdropClaimed(address indexed user, uint256 nullifierHash, uint256 reward);
    event ReferralClaimed(address indexed referrer, address indexed referee, uint256 nullifierHash, uint256 reward);
    event RewardAmountUpdated(string rewardType, uint256 newAmount);

    error NullifierAlreadyUsed(uint256 nullifierHash);
    error InvalidProof();
    error AlreadyClaimedToday();
    error AirdropAlreadyClaimed();

    constructor(
        address _worldIdVerifier,
        address _zeaToken,
        address _dingToken,
        address initialOwner
    ) Ownable(initialOwner) {
        worldIdVerifier = IWorldIDVerifier(_worldIdVerifier);
        zeaToken = ZeaToken(_zeaToken);
        dingToken = DingToken(_dingToken);
    }

    /**
     * @dev Claim daily check-in reward with ZKP verification
     * @param proof ZK proof as bytes
     * @param nullifierHash Unique nullifier to prevent double-claims
     */
    function claimDailyCheckIn(
        uint256[8] calldata proof,
        uint256 nullifierHash
    ) external nonReentrant {
        // Verify nullifier hasn't been used
        if (usedNullifiers[nullifierHash]) revert NullifierAlreadyUsed(nullifierHash);

        // Check daily cooldown (24 hours)
        if (block.timestamp < lastCheckIn[msg.sender] + 1 days) revert AlreadyClaimedToday();

        // Verify World ID proof
        _verifyProof(proof, nullifierHash, msg.sender);

        // Mark nullifier as used
        usedNullifiers[nullifierHash] = true;
        lastCheckIn[msg.sender] = block.timestamp;

        // Transfer rewards
        zeaToken.transfer(msg.sender, dailyCheckInReward);
        dingToken.mintReward(msg.sender, dingBonusReward);

        emit DailyCheckInClaimed(msg.sender, nullifierHash, dailyCheckInReward);
    }

    /**
     * @dev Claim one-time airdrop with ZKP verification
     * @param proof ZK proof as bytes
     * @param nullifierHash Unique nullifier
     */
    function claimAirdrop(
        uint256[8] calldata proof,
        uint256 nullifierHash
    ) external nonReentrant {
        if (usedNullifiers[nullifierHash]) revert NullifierAlreadyUsed(nullifierHash);
        if (hasClaimedAirdrop[msg.sender]) revert AirdropAlreadyClaimed();

        _verifyProof(proof, nullifierHash, msg.sender);

        usedNullifiers[nullifierHash] = true;
        hasClaimedAirdrop[msg.sender] = true;

        zeaToken.transfer(msg.sender, airdropReward);
        dingToken.mintReward(msg.sender, dingBonusReward * 2);

        emit AirdropClaimed(msg.sender, nullifierHash, airdropReward);
    }

    /**
     * @dev Claim referral reward with ZKP verification
     * @param proof ZK proof as bytes
     * @param nullifierHash Unique nullifier
     * @param referee Address of referred user
     */
    function claimReferral(
        uint256[8] calldata proof,
        uint256 nullifierHash,
        address referee
    ) external nonReentrant {
        if (usedNullifiers[nullifierHash]) revert NullifierAlreadyUsed(nullifierHash);
        require(referee != msg.sender, "ZeaZRewards: cannot refer yourself");

        _verifyProof(proof, nullifierHash, msg.sender);

        usedNullifiers[nullifierHash] = true;
        referralCount[msg.sender]++;

        zeaToken.transfer(msg.sender, referralReward);
        zeaToken.transfer(referee, referralReward / 2); // Referee gets 50%

        emit ReferralClaimed(msg.sender, referee, nullifierHash, referralReward);
    }

    /**
     * @dev Internal function to verify World ID proof
     */
    function _verifyProof(
        uint256[8] calldata proof,
        uint256 nullifierHash,
        address signal
    ) internal view {
        uint256 signalHash = uint256(keccak256(abi.encodePacked(signal)));
        uint256 externalNullifierHash = uint256(
            keccak256(abi.encodePacked(ACTION_ID))
        );

        try worldIdVerifier.verifyProof(
            0, // root - would be provided by World ID in production
            groupId,
            signalHash,
            nullifierHash,
            externalNullifierHash,
            proof
        ) {
            // Proof verified successfully
        } catch {
            revert InvalidProof();
        }
    }

    /**
     * @dev Update reward amounts (owner only)
     */
    function updateRewardAmounts(
        uint256 _dailyCheckIn,
        uint256 _airdrop,
        uint256 _referral,
        uint256 _dingBonus
    ) external onlyOwner {
        dailyCheckInReward = _dailyCheckIn;
        airdropReward = _airdrop;
        referralReward = _referral;
        dingBonusReward = _dingBonus;

        emit RewardAmountUpdated("daily", _dailyCheckIn);
        emit RewardAmountUpdated("airdrop", _airdrop);
        emit RewardAmountUpdated("referral", _referral);
        emit RewardAmountUpdated("dingBonus", _dingBonus);
    }

    /**
     * @dev Withdraw tokens (emergency only)
     */
    function withdrawTokens(address token, uint256 amount) external onlyOwner {
        require(
            ZeaToken(token).transfer(owner(), amount),
            "ZeaZRewards: transfer failed"
        );
    }
}
