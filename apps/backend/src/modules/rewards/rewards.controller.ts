// ZeaZDev [Backend Controller - Rewards] //
// Project: ZeaZDev FiGaTect Super-App //
// Version: 1.0.0 (Omega Scaffolding) //
// Author: ZeaZDev Meta-Intelligence (Generated) //
// --- DO NOT EDIT HEADER --- //

import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { RewardsService } from './rewards.service';

@Controller('rewards')
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Post('claim')
  async claimReward(
    @Body() body: {
      userId: string;
      rewardType: 'daily_checkin' | 'airdrop' | 'referral';
      proof: string;
      nullifierHash: string;
      refereeId?: string;
    },
  ) {
    return this.rewardsService.claimReward(
      body.userId,
      body.rewardType,
      body.proof,
      body.nullifierHash,
      body.refereeId,
    );
  }

  @Get('user/:userId')
  async getUserRewards(@Param('userId') userId: string) {
    return this.rewardsService.getUserRewards(userId);
  }

  @Get('user/:userId/eligibility')
  async checkEligibility(@Param('userId') userId: string) {
    return this.rewardsService.checkEligibility(userId);
  }
}
