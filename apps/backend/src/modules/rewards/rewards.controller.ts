/*
 * @Project: ZeaZDev FiGaTect Super-App
 * @Module: Backend-Rewards
 * @File: rewards.controller.ts
 * @Author: ZeaZDev Enterprises (OMEGA AI)
 * @Date: 2025-11-09
 * @Version: 1.0.0
 * @Description: Rewards controller for ZKP-gated claim endpoints
 * @License: ZeaZDev Proprietary License
 * @Copyright: (c) 2025-2026 ZeaZDev. All rights reserved.
 */

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
