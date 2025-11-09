/*
 * @Project: ZeaZDev FiGaTect Super-App
 * @Module: Backend-Governance
 * @File: governance.controller.ts
 * @Author: ZeaZDev Enterprises (OMEGA AI)
 * @Date: 2025-11-09
 * @Version: 1.0.0
 * @Description: Governance controller for DAO proposal and voting endpoints
 * @License: ZeaZDev Proprietary License
 * @Copyright: (c) 2025-2026 ZeaZDev. All rights reserved.
 */

import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { GovernanceService } from './governance.service';

@Controller('governance')
export class GovernanceController {
  constructor(private readonly governanceService: GovernanceService) {}

  @Post('proposal')
  async createProposal(
    @Body()
    body: {
      proposer: string;
      title: string;
      description: string;
      targets: string[];
      values: string[];
      calldatas: string[];
    },
  ) {
    return this.governanceService.createProposal(
      body.proposer,
      body.title,
      body.description,
      body.targets,
      body.values,
      body.calldatas,
    );
  }

  @Post('vote')
  async vote(
    @Body()
    body: {
      proposalId: string;
      voter: string;
      support: 0 | 1 | 2;
      votingPower: string;
    },
  ) {
    return this.governanceService.vote(
      body.proposalId,
      body.voter,
      body.support,
      body.votingPower,
    );
  }

  @Get('proposal/:id')
  async getProposal(@Param('id') proposalId: string) {
    return this.governanceService.getProposal(proposalId);
  }

  @Get('proposals')
  async getProposals(
    @Query('status') status?: string,
    @Query('limit') limit?: string,
  ) {
    return this.governanceService.getProposals(
      status,
      limit ? parseInt(limit) : 10,
    );
  }

  @Get('voting-power/:address')
  async getVotingPower(@Param('address') address: string) {
    const votingPower = await this.governanceService.getVotingPower(address);
    return { address, votingPower };
  }
}
