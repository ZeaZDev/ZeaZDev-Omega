/*
 * @Project: ZeaZDev FiGaTect Super-App
 * @Module: Smart-Contracts-Governance
 * @File: ZeaGovernance.sol
 * @Author: ZeaZDev Enterprises (OMEGA AI)
 * @Date: 2025-11-09
 * @Version: 1.0.0
 * @Description: DAO governance contract for ZEA token holders to vote on proposals
 * @License: ZeaZDev Proprietary License
 * @Copyright: (c) 2025-2026 ZeaZDev. All rights reserved.
 */

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./ZeaToken.sol";

/**
 * @title ZeaGovernance
 * @dev Production-grade DAO governance for ZEA token holders
 * Simplified implementation compatible with Solidity 0.8.23
 */
contract ZeaGovernance is Ownable, ReentrancyGuard {
    ZeaToken public immutable zeaToken;

    struct Proposal {
        uint256 id;
        address proposer;
        string title;
        string description;
        address[] targets;
        uint256[] values;
        bytes[] calldatas;
        uint256 startBlock;
        uint256 endBlock;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        bool executed;
        bool canceled;
        mapping(address => bool) hasVoted;
    }

    uint256 public proposalCount;
    uint256 public constant VOTING_PERIOD = 50400; // ~1 week in blocks
    uint256 public constant VOTING_DELAY = 1; // blocks
    uint256 public constant PROPOSAL_THRESHOLD = 100e18; // 100 ZEA
    uint256 public constant QUORUM_PERCENTAGE = 4; // 4%

    mapping(uint256 => Proposal) public proposals;

    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string title,
        uint256 startBlock,
        uint256 endBlock
    );
    event VoteCast(
        address indexed voter,
        uint256 indexed proposalId,
        uint8 support,
        uint256 weight
    );
    event ProposalExecuted(uint256 indexed proposalId);
    event ProposalCanceled(uint256 indexed proposalId);

    constructor(address _zeaToken, address initialOwner) Ownable(initialOwner) {
        zeaToken = ZeaToken(_zeaToken);
    }

    /**
     * @dev Create a new proposal
     */
    function propose(
        string memory title,
        string memory description,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas
    ) external returns (uint256) {
        require(
            zeaToken.balanceOf(msg.sender) >= PROPOSAL_THRESHOLD,
            "ZeaGovernance: proposer votes below threshold"
        );
        require(
            targets.length == values.length && targets.length == calldatas.length,
            "ZeaGovernance: proposal function information arity mismatch"
        );

        proposalCount++;
        uint256 proposalId = proposalCount;

        Proposal storage newProposal = proposals[proposalId];
        newProposal.id = proposalId;
        newProposal.proposer = msg.sender;
        newProposal.title = title;
        newProposal.description = description;
        newProposal.targets = targets;
        newProposal.values = values;
        newProposal.calldatas = calldatas;
        newProposal.startBlock = block.number + VOTING_DELAY;
        newProposal.endBlock = block.number + VOTING_DELAY + VOTING_PERIOD;

        emit ProposalCreated(
            proposalId,
            msg.sender,
            title,
            newProposal.startBlock,
            newProposal.endBlock
        );

        return proposalId;
    }

    /**
     * @dev Cast a vote
     * @param proposalId The proposal ID
     * @param support 0=against, 1=for, 2=abstain
     */
    function castVote(uint256 proposalId, uint8 support) external {
        require(support <= 2, "ZeaGovernance: invalid vote type");
        
        Proposal storage proposal = proposals[proposalId];
        require(
            block.number >= proposal.startBlock,
            "ZeaGovernance: voting not started"
        );
        require(
            block.number <= proposal.endBlock,
            "ZeaGovernance: voting ended"
        );
        require(
            !proposal.hasVoted[msg.sender],
            "ZeaGovernance: already voted"
        );

        uint256 weight = zeaToken.balanceOf(msg.sender);
        require(weight > 0, "ZeaGovernance: no voting power");

        proposal.hasVoted[msg.sender] = true;

        if (support == 0) {
            proposal.againstVotes += weight;
        } else if (support == 1) {
            proposal.forVotes += weight;
        } else {
            proposal.abstainVotes += weight;
        }

        emit VoteCast(msg.sender, proposalId, support, weight);
    }

    /**
     * @dev Execute a successful proposal
     */
    function execute(uint256 proposalId) external payable nonReentrant {
        Proposal storage proposal = proposals[proposalId];
        
        require(
            block.number > proposal.endBlock,
            "ZeaGovernance: voting not ended"
        );
        require(!proposal.executed, "ZeaGovernance: already executed");
        require(!proposal.canceled, "ZeaGovernance: proposal canceled");
        require(
            _quorumReached(proposalId) && _voteSucceeded(proposalId),
            "ZeaGovernance: proposal not successful"
        );

        proposal.executed = true;

        for (uint256 i = 0; i < proposal.targets.length; i++) {
            (bool success, ) = proposal.targets[i].call{value: proposal.values[i]}(
                proposal.calldatas[i]
            );
            require(success, "ZeaGovernance: transaction execution reverted");
        }

        emit ProposalExecuted(proposalId);
    }

    /**
     * @dev Cancel a proposal (only proposer or owner)
     */
    function cancel(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        require(
            msg.sender == proposal.proposer || msg.sender == owner(),
            "ZeaGovernance: not authorized"
        );
        require(!proposal.executed, "ZeaGovernance: already executed");

        proposal.canceled = true;
        emit ProposalCanceled(proposalId);
    }

    /**
     * @dev Get proposal state
     */
    function state(uint256 proposalId) public view returns (uint8) {
        Proposal storage proposal = proposals[proposalId];
        
        if (proposal.canceled) return 2; // Canceled
        if (proposal.executed) return 7; // Executed
        if (block.number < proposal.startBlock) return 0; // Pending
        if (block.number <= proposal.endBlock) return 1; // Active
        if (!_quorumReached(proposalId) || !_voteSucceeded(proposalId)) return 3; // Defeated
        
        return 4; // Succeeded
    }

    /**
     * @dev Check if quorum is reached
     */
    function _quorumReached(uint256 proposalId) internal view returns (bool) {
        Proposal storage proposal = proposals[proposalId];
        uint256 totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;
        uint256 totalSupply = zeaToken.totalSupply();
        return (totalVotes * 100) >= (totalSupply * QUORUM_PERCENTAGE);
    }

    /**
     * @dev Check if vote succeeded
     */
    function _voteSucceeded(uint256 proposalId) internal view returns (bool) {
        Proposal storage proposal = proposals[proposalId];
        return proposal.forVotes > proposal.againstVotes;
    }

    /**
     * @dev Get proposal details
     */
    function getProposal(uint256 proposalId)
        external
        view
        returns (
            address proposer,
            string memory title,
            string memory description,
            uint256 startBlock,
            uint256 endBlock,
            uint256 forVotes,
            uint256 againstVotes,
            uint256 abstainVotes,
            bool executed,
            bool canceled
        )
    {
        Proposal storage proposal = proposals[proposalId];
        return (
            proposal.proposer,
            proposal.title,
            proposal.description,
            proposal.startBlock,
            proposal.endBlock,
            proposal.forVotes,
            proposal.againstVotes,
            proposal.abstainVotes,
            proposal.executed,
            proposal.canceled
        );
    }

    receive() external payable {}
}
