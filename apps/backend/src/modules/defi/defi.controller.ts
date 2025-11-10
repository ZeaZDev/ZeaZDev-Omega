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

  @Get('swap/quote')
  async getSwapQuote(
    @Query('tokenIn') tokenIn: string,
    @Query('tokenOut') tokenOut: string,
    @Query('amountIn') amountIn: string,
  ) {
    return this.defiService.getSwapQuote(tokenIn, tokenOut, amountIn);
  }

  @Post('swap/execute')
  async executeSwap(
    @Body() body: {
      userAddress: string;
      tokenIn: string;
      tokenOut: string;
      amountIn: string;
      minAmountOut: string;
      deadline?: number;
    },
  ) {
    return this.defiService.executeSwap(
      body.userAddress,
      body.tokenIn,
      body.tokenOut,
      body.amountIn,
      body.minAmountOut,
      body.deadline,
    );
  }

  @Get('pool/liquidity')
  async getPoolLiquidity(
    @Query('tokenA') tokenA: string,
    @Query('tokenB') tokenB: string,
  ) {
    return this.defiService.getPoolLiquidity(tokenA, tokenB);
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

  @Post('stake/:id/unstake')
  async unstake(
    @Param('id') stakeId: string,
    @Body() body: { amount: string },
  ) {
    return this.defiService.unstake(stakeId, body.amount);
  }

  @Get('stake/user/:userId')
  async getUserStakes(@Param('userId') userId: string) {
    return this.defiService.getUserStakes(userId);
  }

  @Get('stake/analytics/:userId')
  async getStakeAnalytics(@Param('userId') userId: string) {
    return this.defiService.getStakeAnalytics(userId);
  }
}
