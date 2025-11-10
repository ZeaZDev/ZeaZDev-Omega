/*
 * @Project: ZeaZDev FiGaTect Super-App
 * @Module: Backend-Bridge
 * @File: bridge.controller.ts
 * @Author: ZeaZDev Enterprises (OMEGA AI)
 * @Date: 2025-11-10
 * @Version: 2.0.0 (Phase 6: Cross-Chain Expansion)
 * @Description: Enhanced bridge controller with liquidity pool management
 * @License: ZeaZDev Proprietary License
 * @Copyright: (c) 2025-2026 ZeaZDev. All rights reserved.
 */

import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { BridgeService } from './bridge.service';

@Controller('bridge')
export class BridgeController {
  constructor(private readonly bridgeService: BridgeService) {}

  /**
   * Get bridge quote with detailed fee breakdown
   */
  @Get('quote')
  async getQuote(
    @Query('amount') amount: string,
    @Query('sourceChain') sourceChain: string,
    @Query('targetChain') targetChain: string,
  ) {
    return this.bridgeService.getQuote(
      amount,
      parseInt(sourceChain),
      parseInt(targetChain),
    );
  }

  /**
   * Initiate bridge transaction
   */
  @Post('initiate')
  async initiateBridge(@Body() body: {
    userId: string;
    token: string;
    amount: string;
    sourceChain: number;
    targetChain: number;
    transactionHash: string;
  }) {
    return this.bridgeService.initiateBridge(
      body.userId,
      body.token,
      body.amount,
      body.sourceChain,
      body.targetChain,
      body.transactionHash,
    );
  }

  /**
   * Complete bridge transaction
   */
  @Post('complete')
  async completeBridge(@Body() body: {
    transactionHash: string;
    completionTxHash: string;
  }) {
    return this.bridgeService.completeBridge(
      body.transactionHash,
      body.completionTxHash,
    );
  }

  /**
   * Get user's bridge transactions
   */
  @Get('transactions/:userId')
  async getUserTransactions(@Param('userId') userId: string) {
    return this.bridgeService.getUserBridgeTransactions(userId);
  }

  /**
   * Get specific bridge transaction
   */
  @Get('transaction/:hash')
  async getTransaction(@Param('hash') hash: string) {
    return this.bridgeService.getBridgeTransaction(hash);
  }

  /**
   * Get all supported chains
   */
  @Get('chains')
  async getSupportedChains() {
    return this.bridgeService.getSupportedChains();
  }

  /**
   * Get chain configuration
   */
  @Get('chains/:chainId')
  async getChainConfig(@Param('chainId') chainId: string) {
    return this.bridgeService.getChainConfig(parseInt(chainId));
  }

  /**
   * Get liquidity info for a token
   */
  @Get('liquidity/:chainId')
  async getLiquidityInfo(
    @Param('chainId') chainId: string,
    @Query('userId') userId: string,
    @Query('token') token: string,
  ) {
    return this.bridgeService.getLiquidityInfo(
      userId,
      token,
      parseInt(chainId),
    );
  }

  /**
   * Add liquidity to bridge pool
   */
  @Post('liquidity/add')
  async addLiquidity(@Body() body: {
    userId: string;
    token: string;
    amount: string;
    chainId: number;
  }) {
    return this.bridgeService.addLiquidity(
      body.userId,
      body.token,
      body.amount,
      body.chainId,
    );
  }

  /**
   * Remove liquidity from bridge pool
   */
  @Post('liquidity/remove')
  async removeLiquidity(@Body() body: {
    userId: string;
    token: string;
    shares: string;
    chainId: number;
  }) {
    return this.bridgeService.removeLiquidity(
      body.userId,
      body.token,
      body.shares,
      body.chainId,
    );
  }

  /**
   * Get overall bridge statistics
   */
  @Get('stats')
  async getBridgeStats() {
    return this.bridgeService.getBridgeStats();
  }
}
