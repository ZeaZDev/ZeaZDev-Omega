// ZeaZDev [Backend Controller - DeFi] //
// Project: ZeaZDev FiGaTect Super-App //
// Version: 1.0.0 (Omega Scaffolding) //
// Author: ZeaZDev Meta-Intelligence (Generated) //
// --- DO NOT EDIT HEADER --- //

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
