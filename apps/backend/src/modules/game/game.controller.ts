/*
 * @Project: ZeaZDev FiGaTect Super-App
 * @Module: Backend-Game
 * @File: game.controller.ts
 * @Author: ZeaZDev Enterprises (OMEGA AI)
 * @Date: 2025-11-10
 * @Version: 2.0.0 (Phase 7: Advanced GameFi)
 * @Description: Enhanced game controller supporting slots, poker, roulette, and sports betting
 * @License: ZeaZDev Proprietary License
 * @Copyright: (c) 2025-2026 ZeaZDev. All rights reserved.
 */

import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { GameService } from './game.service';

@Controller('game')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  /**
   * Get all available game types
   */
  @Get('types')
  async getGameTypes() {
    return this.gameService.getGameTypes();
  }

  /**
   * Get user game statistics
   */
  @Get('stats/:userId')
  async getGameStatistics(@Param('userId') userId: string) {
    return this.gameService.getGameStatistics(userId);
  }

  /**
   * SLOTS ENDPOINTS
   */
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

  /**
   * POKER ENDPOINTS
   */
  @Post('poker/create')
  async createPokerGame(
    @Body() body: {
      userId: string;
      smallBlind: string;
      bigBlind: string;
      token: 'ZEA' | 'DING';
    },
  ) {
    return this.gameService.createPokerGame(
      body.userId,
      body.smallBlind,
      body.bigBlind,
      body.token,
    );
  }

  @Post('poker/play')
  async playPokerHand(
    @Body() body: {
      sessionId: string;
      betAmount: string;
    },
  ) {
    return this.gameService.playPokerHand(
      body.sessionId,
      body.betAmount,
    );
  }

  /**
   * ROULETTE ENDPOINTS
   */
  @Post('roulette/play')
  async playRoulette(
    @Body() body: {
      userId: string;
      betAmount: string;
      betType: 'number' | 'color' | 'even-odd' | 'high-low';
      betValue: string | number;
      token: 'ZEA' | 'DING';
    },
  ) {
    return this.gameService.playRoulette(
      body.userId,
      body.betAmount,
      body.betType,
      body.betValue,
      body.token,
    );
  }

  /**
   * SPORTS BETTING ENDPOINTS
   */
  @Get('sports/events')
  async getSportsEvents(
    @Query('sport') sport?: string,
    @Query('status') status?: string,
  ) {
    return this.gameService.getSportsEvents(sport, status);
  }

  @Post('sports/bet')
  async placeSportsBet(
    @Body() body: {
      userId: string;
      eventId: number;
      prediction: 'TEAM_A' | 'TEAM_B' | 'DRAW';
      betAmount: string;
      token: 'ZEA' | 'DING';
    },
  ) {
    return this.gameService.placeSportsBet(
      body.userId,
      body.eventId,
      body.prediction,
      body.betAmount,
      body.token,
    );
  }

  /**
   * GENERAL ENDPOINTS
   */
  @Get('sessions/user/:userId')
  async getUserSessions(@Param('userId') userId: string) {
    return this.gameService.getUserSessions(userId);
  }

  @Get('sessions/:sessionId')
  async getSession(@Param('sessionId') sessionId: string) {
    return this.gameService.getSession(sessionId);
  }

  @Get('leaderboard/:gameType?')
  async getLeaderboard(
    @Param('gameType') gameType?: string,
  ) {
    return this.gameService.getLeaderboard(gameType || 'slots', 10);
  }
}
