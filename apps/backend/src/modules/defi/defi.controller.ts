/*
 * @Project: ZeaZDev FiGaTect Super-App
 * @Module: Backend-DeFi
 * @File: defi.controller.ts
 * @Author: ZeaZDev Enterprises (OMEGA AI)
 * @Date: 2025-11-09
 * @Version: 1.0.0
 * @Description: DeFi controller handling swap, stake, and trading endpoints
 * @License: ZeaZDev Proprietary License
 * @Copyright: (c) 2025-2026 ZeaZDev. All rights reserved.
 */

import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { DefiService } from './defi.service';

@Controller('defi')
export class DefiController {
  constructor(private readonly defiService: DefiService) {}

  @Post('swap/quote')
  async getSwapQuote(
    @Body() body: {
      tokenIn: string;
      tokenOut: string;
      amountIn: string;
    },
  ) {
    return this.defiService.getSwapQuote(
      body.tokenIn,
      body.tokenOut,
      body.amountIn,
    );
  }

  @Post('stake')
  async stake(
    @Body() body: {
      userId: string;
      amount: string;
      txHash: string;
    },
  ) {
    return this.defiService.createStake(body.userId, body.amount, body.txHash);
  }

  @Post('stake/:id/claim')
  async claimRewards(@Param('id') stakeId: string) {
    return this.defiService.claimStakeRewards(stakeId);
  }

  @Get('stake/user/:userId')
  async getUserStakes(@Param('userId') userId: string) {
    return this.defiService.getUserStakes(userId);
  }
}
