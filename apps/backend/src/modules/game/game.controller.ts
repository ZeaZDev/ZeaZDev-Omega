/*
 * @Project: ZeaZDev FiGaTect Super-App
 * @Module: Backend-Game
 * @File: game.controller.ts
 * @Author: ZeaZDev Enterprises (OMEGA AI)
 * @Date: 2025-11-09
 * @Version: 1.0.0
 * @Description: Game controller handling slot machine game sessions and rewards
 * @License: ZeaZDev Proprietary License
 * @Copyright: (c) 2025-2026 ZeaZDev. All rights reserved.
 */

import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { GameService } from './game.service';

@Controller('game')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Post('slots/play')
  async playSlots(
    @Body() body: {
      userId: string;
      betAmount: string;
      tokenUsed: 'ZEA' | 'DING';
      txHash: string;
    },
  ) {
    return this.gameService.playSlots(
      body.userId,
      body.betAmount,
      body.tokenUsed,
      body.txHash,
    );
  }

  @Post('slots/complete')
  async completeSlots(
    @Body() body: {
      sessionId: string;
      result: 'won' | 'lost';
      winAmount?: string;
    },
  ) {
    return this.gameService.completeSlots(
      body.sessionId,
      body.result,
      body.winAmount,
    );
  }

  @Get('sessions/user/:userId')
  async getUserSessions(@Param('userId') userId: string) {
    return this.gameService.getUserSessions(userId);
  }

  @Get('sessions/:sessionId')
  async getSession(@Param('sessionId') sessionId: string) {
    return this.gameService.getSession(sessionId);
  }
}
