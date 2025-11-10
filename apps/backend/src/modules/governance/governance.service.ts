/*
 * @Project: ZeaZDev FiGaTect Super-App
 * @Module: Backend-Governance
 * @File: governance.service.ts
 * @Author: ZeaZDev Enterprises (OMEGA AI)
 * @Date: 2025-11-09
 * @Version: 1.0.0
 * @Description: Governance service for DAO proposals and voting
 * @License: ZeaZDev Proprietary License
 * @Copyright: (c) 2025-2026 ZeaZDev. All rights reserved.
 */

import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { ethers } from 'ethers';

export interface Proposal {
  id: string;
  proposalId: string;
  proposer: string;
  title: string;
  description: string;
  targets: string[];
  values: string[];
  calldatas: string[];
  startBlock: number;
  endBlock: number;
  status: 'pending' | 'active' | 'succeeded' | 'defeated' | 'executed' | 'canceled';
  forVotes: string;
  againstVotes: string;
  abstainVotes: string;
  createdAt: Date;
}

@Injectable()
export class GovernanceService {
  private provider: ethers.Provider;
  private governanceContract: ethers.Contract;

  constructor(private readonly prisma: PrismaService) {
    this.provider = new ethers.JsonRpcProvider(
      process.env.RPC_URL || 'https://mainnet.optimism.io',
    );

    // Governance contract ABI (minimal)
    const governanceAbi = [
      'function propose(address[] memory targets, uint256[] memory values, bytes[] memory calldatas, string memory description) public returns (uint256)',
      'function castVote(uint256 proposalId, uint8 support) public returns (uint256)',
      'function state(uint256 proposalId) public view returns (uint8)',
      'function proposalVotes(uint256 proposalId) public view returns (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes)',
    ];

    const governanceAddress = process.env.GOVERNANCE_CONTRACT_ADDRESS || '';
    
    if (governanceAddress) {
      this.governanceContract = new ethers.Contract(
        governanceAddress,
        governanceAbi,
        this.provider,
      );
    }
  }

  async createProposal(
    proposer: string,
    title: string,
    description: string,
    targets: string[],
    values: string[],
    calldatas: string[],
  ): Promise<{ proposalId: string; success: boolean }> {
    try {
      // Generate unique proposal ID
      const proposalId = ethers.id(
        `${proposer}-${title}-${Date.now()}`,
      );

      const currentBlock = await this.provider.getBlockNumber();
      
      // Store proposal in database
      await this.prisma.governanceProposal.create({
        data: {
          proposalId,
          proposer,
          title,
          description,
          targets,
          values,
          calldatas,
          startBlock: currentBlock + 1,
          endBlock: currentBlock + 50400, // ~1 week (50,400 blocks)
          status: 'pending',
          forVotes: '0',
          againstVotes: '0',
          abstainVotes: '0',
        },
      });

      return {
        proposalId,
        success: true,
      };
    } catch (error) {
      throw new HttpException(
        'Failed to create proposal',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async vote(
    proposalId: string,
    voter: string,
    support: 0 | 1 | 2, // 0 = against, 1 = for, 2 = abstain
    votingPower: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Get proposal
      const proposal = await this.prisma.governanceProposal.findUnique({
        where: { proposalId },
      });

      if (!proposal) {
        throw new HttpException('Proposal not found', HttpStatus.NOT_FOUND);
      }

      // Check if already voted
      const existingVote = await this.prisma.governanceVote.findUnique({
        where: {
          proposalId_voter: {
            proposalId,
            voter,
          },
        },
      });

      if (existingVote) {
        throw new HttpException('Already voted on this proposal', HttpStatus.BAD_REQUEST);
      }

      // Check if proposal is active
      const currentBlock = await this.provider.getBlockNumber();
      if (currentBlock < proposal.startBlock || currentBlock > proposal.endBlock) {
        throw new HttpException('Proposal not active', HttpStatus.BAD_REQUEST);
      }

      // Record vote
      await this.prisma.governanceVote.create({
        data: {
          proposalId,
          voter,
          support,
          votingPower,
        },
      });

      // Update proposal vote counts
      const voteAmount = BigInt(votingPower);
      const currentForVotes = BigInt(proposal.forVotes);
      const currentAgainstVotes = BigInt(proposal.againstVotes);
      const currentAbstainVotes = BigInt(proposal.abstainVotes);

      await this.prisma.governanceProposal.update({
        where: { proposalId },
        data: {
          forVotes: support === 1 ? (currentForVotes + voteAmount).toString() : proposal.forVotes,
          againstVotes: support === 0 ? (currentAgainstVotes + voteAmount).toString() : proposal.againstVotes,
          abstainVotes: support === 2 ? (currentAbstainVotes + voteAmount).toString() : proposal.abstainVotes,
        },
      });
      
      return {
        success: true,
        message: `Vote cast: ${support === 0 ? 'Against' : support === 1 ? 'For' : 'Abstain'}`,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Failed to cast vote', HttpStatus.BAD_REQUEST);
    }
  }

  async getProposal(proposalId: string): Promise<Proposal | null> {
    try {
      const proposal = await this.prisma.governanceProposal.findUnique({
        where: { proposalId },
        include: {
          votes: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!proposal) {
        return null;
      }

      // Update status based on current block
      const currentBlock = await this.provider.getBlockNumber();
      let status = proposal.status;

      if (currentBlock < proposal.startBlock) {
        status = 'pending';
      } else if (currentBlock <= proposal.endBlock) {
        status = 'active';
      } else if (status === 'active' || status === 'pending') {
        // Calculate if proposal passed
        const totalVotes = BigInt(proposal.forVotes) + BigInt(proposal.againstVotes) + BigInt(proposal.abstainVotes);
        const forVotes = BigInt(proposal.forVotes);
        const quorumMet = totalVotes > BigInt(0); // Simplified quorum check
        
        if (quorumMet && forVotes > BigInt(proposal.againstVotes)) {
          status = 'succeeded';
        } else {
          status = 'defeated';
        }

        // Update status in DB if changed
        if (status !== proposal.status) {
          await this.prisma.governanceProposal.update({
            where: { proposalId },
            data: { status },
          });
        }
      }

      return {
        id: proposal.id,
        proposalId: proposal.proposalId,
        proposer: proposal.proposer,
        title: proposal.title,
        description: proposal.description,
        targets: proposal.targets,
        values: proposal.values,
        calldatas: proposal.calldatas,
        startBlock: proposal.startBlock,
        endBlock: proposal.endBlock,
        status: status as any,
        forVotes: proposal.forVotes,
        againstVotes: proposal.againstVotes,
        abstainVotes: proposal.abstainVotes,
        createdAt: proposal.createdAt,
      };
    } catch (error) {
      throw new HttpException(
        'Failed to get proposal',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async getProposals(
    status?: string,
    limit: number = 10,
  ): Promise<Proposal[]> {
    try {
      const whereClause = status ? { status } : {};

      const proposals = await this.prisma.governanceProposal.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          votes: true,
        },
      });

      return proposals.map(p => ({
        id: p.id,
        proposalId: p.proposalId,
        proposer: p.proposer,
        title: p.title,
        description: p.description,
        targets: p.targets,
        values: p.values,
        calldatas: p.calldatas,
        startBlock: p.startBlock,
        endBlock: p.endBlock,
        status: p.status as any,
        forVotes: p.forVotes,
        againstVotes: p.againstVotes,
        abstainVotes: p.abstainVotes,
        createdAt: p.createdAt,
      }));
    } catch (error) {
      throw new HttpException(
        'Failed to get proposals',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async getVotingPower(address: string): Promise<string> {
    try {
      // In production, query ZEA token contract for user's balance (voting power)
      // For now, return a placeholder
      // This would call: zeaToken.balanceOf(address)
      return '0';
    } catch (error) {
      throw new HttpException(
        'Failed to get voting power',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async executeProposal(proposalId: string): Promise<{ success: boolean; message: string }> {
    try {
      const proposal = await this.prisma.governanceProposal.findUnique({
        where: { proposalId },
      });

      if (!proposal) {
        throw new HttpException('Proposal not found', HttpStatus.NOT_FOUND);
      }

      if (proposal.status !== 'succeeded') {
        throw new HttpException('Proposal not in succeeded state', HttpStatus.BAD_REQUEST);
      }

      // In production, this would execute the proposal on-chain via governance contract
      // For now, just mark as executed
      await this.prisma.governanceProposal.update({
        where: { proposalId },
        data: { status: 'executed' },
      });

      return {
        success: true,
        message: 'Proposal executed successfully',
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Failed to execute proposal', HttpStatus.BAD_REQUEST);
    }
  }

  async cancelProposal(proposalId: string, canceller: string): Promise<{ success: boolean; message: string }> {
    try {
      const proposal = await this.prisma.governanceProposal.findUnique({
        where: { proposalId },
      });

      if (!proposal) {
        throw new HttpException('Proposal not found', HttpStatus.NOT_FOUND);
      }

      // Only proposer can cancel
      if (proposal.proposer !== canceller) {
        throw new HttpException('Only proposer can cancel proposal', HttpStatus.FORBIDDEN);
      }

      if (proposal.status === 'executed') {
        throw new HttpException('Cannot cancel executed proposal', HttpStatus.BAD_REQUEST);
      }

      await this.prisma.governanceProposal.update({
        where: { proposalId },
        data: { status: 'canceled' },
      });

      return {
        success: true,
        message: 'Proposal canceled successfully',
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Failed to cancel proposal', HttpStatus.BAD_REQUEST);
    }
  }
}
