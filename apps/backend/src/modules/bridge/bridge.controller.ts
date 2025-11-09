import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { BridgeService } from './bridge.service';

@Controller('bridge')
export class BridgeController {
  constructor(private readonly bridgeService: BridgeService) {}

  @Get('quote')
  async getQuote(
    @Query('amount') amount: string,
    @Query('targetChain') targetChain: string,
  ) {
    return this.bridgeService.getQuote(amount, parseInt(targetChain));
  }

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

  @Get('transactions/:userId')
  async getUserTransactions(@Param('userId') userId: string) {
    return this.bridgeService.getUserBridgeTransactions(userId);
  }

  @Get('transaction/:hash')
  async getTransaction(@Param('hash') hash: string) {
    return this.bridgeService.getBridgeTransaction(hash);
  }

  @Get('chains')
  async getSupportedChains() {
    return this.bridgeService.getSupportedChains();
  }
}
