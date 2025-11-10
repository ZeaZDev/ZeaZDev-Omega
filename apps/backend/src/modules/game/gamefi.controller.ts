/*
 * @Project: ZeaZDev FiGaTect Super-App
 * @Module: Backend-Game-Phase3
 * @File: gamefi.controller.ts
 * @Author: ZeaZDev Enterprises (OMEGA AI)
 * @Date: 2025-11-10
 * @Version: 3.0.0 (Phase 3: GameFi Integration)
 * @Description: GameFi controller for slot machine, tournaments, and NFT rewards
 * @License: ZeaZDev Proprietary License
 * @Copyright: (c) 2025-2026 ZeaZDev. All rights reserved.
 */

import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { GameFiService } from './gamefi.service';

@Controller('gamefi')
export class GameFiController {
  constructor(private readonly gameFiService: GameFiService) {}

  /**
   * SLOT MACHINE ENDPOINTS
   */

  @Post('slots/spin')
  async spinSlots(
    @Body()
    body: {
      userId: string;
      betAmount: string;
      tokenUsed: 'ZEA' | 'DING';
    },
  ) {
    return this.gameFiService.spinSlotMachine(
      body.userId,
      body.betAmount,
      body.tokenUsed,
    );
  }

  @Get('slots/history/:userId')
  async getSlotHistory(
    @Param('userId') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.gameFiService.getGameHistory(
      userId,
      page || 1,
      limit || 20,
    );
  }

  @Post('slots/verify')
  async verifyProvablyFair(
    @Body() body: { sessionId: string; clientSeed: string },
  ) {
    return this.gameFiService.verifyProvablyFair(
      body.sessionId,
      body.clientSeed,
    );
  }

  /**
   * NFT REWARDS ENDPOINTS
   */

  @Get('nfts/:userId')
  async getUserNFTs(@Param('userId') userId: string) {
    return this.gameFiService.getUserNFTs(userId);
  }

  /**
   * TOURNAMENT ENDPOINTS
   */

  @Post('tournaments/create')
  async createTournament(
    @Body()
    body: {
      name: string;
      duration: number;
      entryFee: string;
      prizePool: string;
    },
  ) {
    return this.gameFiService.createTournament(
      body.name,
      body.duration,
      body.entryFee,
      body.prizePool,
    );
  }

  @Post('tournaments/join')
  async joinTournament(
    @Body() body: { tournamentId: number; userId: string },
  ) {
    return this.gameFiService.joinTournament(
      body.tournamentId,
      body.userId,
    );
  }

  @Get('tournaments/active')
  async getActiveTournaments() {
    return this.gameFiService.getActiveTournaments();
  }

  @Get('tournaments/:tournamentId/leaderboard')
  async getTournamentLeaderboard(@Param('tournamentId') tournamentId: string) {
    return this.gameFiService.getTournamentLeaderboard(parseInt(tournamentId));
  }

  /**
   * LEADERBOARD & STATS ENDPOINTS
   */

  @Get('leaderboard')
  async getGlobalLeaderboard(@Query('limit') limit?: number) {
    return this.gameFiService.getGlobalLeaderboard(limit || 50);
  }

  @Get('stats/:userId')
  async getUserStats(@Param('userId') userId: string) {
    return this.gameFiService.getUserStats(userId);
  }
}
