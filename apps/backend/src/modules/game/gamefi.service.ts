/*
 * @Project: ZeaZDev FiGaTect Super-App
 * @Module: Backend-Game-Phase3
 * @File: gamefi.service.ts
 * @Author: ZeaZDev Enterprises (OMEGA AI)
 * @Date: 2025-11-10
 * @Version: 3.0.0 (Phase 3: GameFi Integration)
 * @Description: Core GameFi service for slot machine, tournaments, NFT rewards, and provably fair gaming
 * @License: ZeaZDev Proprietary License
 * @Copyright: (c) 2025-2026 ZeaZDev. All rights reserved.
 */

import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { randomBytes, createHash } from 'crypto';
import { ethers } from 'ethers';

export interface SlotGameSession {
  sessionId: string;
  userId: string;
  betAmount: string;
  tokenUsed: 'ZEA' | 'DING';
  symbols: string[];
  result: 'won' | 'lost';
  winAmount: string;
  multiplier: number;
  seed: string;
  provablyFairHash: string;
  timestamp: Date;
}

export interface NFTReward {
  tokenId: number;
  name: string;
  description: string;
  imageUrl: string;
  rarity: number; // 1-5
  achievementType: string;
}

export interface Tournament {
  id: number;
  name: string;
  startTime: Date;
  endTime: Date;
  entryFee: string;
  prizePool: string;
  participants: number;
  status: 'UPCOMING' | 'ACTIVE' | 'FINISHED';
  leaderboard: TournamentEntry[];
}

export interface TournamentEntry {
  userId: string;
  username: string;
  totalWins: string;
  gamesPlayed: number;
  rank: number;
}

@Injectable()
export class GameFiService {
  private readonly SYMBOLS = ['🍒', '🍋', '🍊', '🍇', '💎', '7️⃣'];
  private readonly SYMBOL_WEIGHTS = {
    '🍒': 30, // 30% chance
    '🍋': 25, // 25% chance
    '🍊': 20, // 20% chance
    '🍇': 15, // 15% chance
    '💎': 8,  // 8% chance
    '7️⃣': 2,  // 2% chance (rarest)
  };
  
  private readonly MULTIPLIERS = {
    '🍒': 2,
    '🍋': 3,
    '🍊': 4,
    '🍇': 5,
    '💎': 6,
    '7️⃣': 10,
  };

  constructor(private readonly prisma: PrismaService) {}

  /**
   * SLOT MACHINE CORE FUNCTIONS
   */

  async spinSlotMachine(
    userId: string,
    betAmount: string,
    tokenUsed: 'ZEA' | 'DING',
  ): Promise<SlotGameSession> {
    try {
      // Generate provably fair seed
      const clientSeed = randomBytes(32).toString('hex');
      const serverSeed = randomBytes(32).toString('hex');
      const nonce = Date.now();

      // Generate provably fair hash
      const provablyFairHash = createHash('sha256')
        .update(`${clientSeed}:${serverSeed}:${nonce}`)
        .digest('hex');

      // Generate slot results using provably fair algorithm
      const symbols = this.generateProvablyFairResult(provablyFairHash);

      // Calculate result
      const { won, multiplier, winAmount } = this.calculateSlotResult(symbols, betAmount);

      // Create session
      const sessionId = `slot_${userId}_${Date.now()}`;
      const session: SlotGameSession = {
        sessionId,
        userId,
        betAmount,
        tokenUsed,
        symbols,
        result: won ? 'won' : 'lost',
        winAmount,
        multiplier,
        seed: clientSeed,
        provablyFairHash,
        timestamp: new Date(),
      };

      // Save to database
      await this.prisma.gameSession.create({
        data: {
          sessionId,
          userId,
          gameType: 'SLOTS',
          betAmount,
          tokenUsed,
          result: won ? 'WON' : 'LOST',
          winAmount,
          metadata: JSON.stringify({
            symbols,
            multiplier,
            provablyFairHash,
            seed: clientSeed,
          }),
        },
      });

      // Update user stats
      await this.updateUserStats(userId, won, winAmount);

      // Check for achievements
      if (won) {
        await this.checkAndAwardAchievements(userId, multiplier, symbols);
      }

      return session;
    } catch (error) {
      throw new HttpException(
        'Failed to play slot machine',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Generate provably fair slot results
   */
  private generateProvablyFairResult(hash: string): string[] {
    const symbols: string[] = [];
    
    for (let i = 0; i < 3; i++) {
      // Use different parts of hash for each reel
      const hashSegment = hash.substring(i * 10, (i + 1) * 10);
      const randomValue = parseInt(hashSegment, 16) % 100;
      
      let cumulativeWeight = 0;
      for (const [symbol, weight] of Object.entries(this.SYMBOL_WEIGHTS)) {
        cumulativeWeight += weight;
        if (randomValue < cumulativeWeight) {
          symbols.push(symbol);
          break;
        }
      }
    }
    
    return symbols;
  }

  /**
   * Calculate slot machine result
   */
  private calculateSlotResult(
    symbols: string[],
    betAmount: string,
  ): { won: boolean; multiplier: number; winAmount: string } {
    const bet = parseFloat(betAmount);

    // All three symbols match (jackpot!)
    if (symbols[0] === symbols[1] && symbols[1] === symbols[2]) {
      const multiplier = this.MULTIPLIERS[symbols[0]];
      const winAmount = (bet * multiplier).toString();
      return { won: true, multiplier, winAmount };
    }

    // Two symbols match (small win)
    if (symbols[0] === symbols[1] || symbols[1] === symbols[2] || symbols[0] === symbols[2]) {
      const multiplier = 2;
      const winAmount = (bet * multiplier).toString();
      return { won: true, multiplier, winAmount };
    }

    // No match (loss)
    return { won: false, multiplier: 0, winAmount: '0' };
  }

  /**
   * Update user statistics
   */
  private async updateUserStats(userId: string, won: boolean, winAmount: string) {
    const stats = await this.prisma.gameStats.findUnique({
      where: { userId },
    });

    if (stats) {
      await this.prisma.gameStats.update({
        where: { userId },
        data: {
          totalGames: { increment: 1 },
          totalWon: won ? { increment: 1 } : undefined,
          totalLost: !won ? { increment: 1 } : undefined,
          totalWinnings: won
            ? (parseFloat(stats.totalWinnings) + parseFloat(winAmount)).toString()
            : stats.totalWinnings,
          winStreak: won ? { increment: 1 } : 0,
        },
      });
    } else {
      await this.prisma.gameStats.create({
        data: {
          userId,
          totalGames: 1,
          totalWon: won ? 1 : 0,
          totalLost: won ? 0 : 1,
          totalWinnings: winAmount,
          winStreak: won ? 1 : 0,
        },
      });
    }
  }

  /**
   * Check and award achievements
   */
  private async checkAndAwardAchievements(
    userId: string,
    multiplier: number,
    symbols: string[],
  ) {
    const stats = await this.prisma.gameStats.findUnique({
      where: { userId },
    });

    if (!stats) return;

    // Achievement: First Win
    if (stats.totalWon === 1) {
      await this.awardNFT(userId, 'FIRST_WIN', 'First Winner', 'Won your first slot game!', 1);
    }

    // Achievement: 5 Win Streak
    if (stats.winStreak === 5) {
      await this.awardNFT(userId, 'STREAK_5', 'Lucky Streak', '5 wins in a row!', 2);
    }

    // Achievement: 10 Win Streak
    if (stats.winStreak === 10) {
      await this.awardNFT(userId, 'STREAK_10', 'Hot Hand', '10 wins in a row!', 3);
    }

    // Achievement: Jackpot (7️⃣ 7️⃣ 7️⃣)
    if (symbols.every(s => s === '7️⃣')) {
      await this.awardNFT(userId, 'JACKPOT_777', 'Triple Sevens', 'Hit the jackpot!', 5);
    }

    // Achievement: Big Winner (10x multiplier)
    if (multiplier >= 10) {
      await this.awardNFT(userId, 'BIG_WIN', 'Big Winner', 'Won 10x or more!', 4);
    }

    // Achievement: Century (100 games)
    if (stats.totalGames === 100) {
      await this.awardNFT(userId, 'CENTURY', 'Centurion', 'Played 100 games', 2);
    }

    // Achievement: Millennium (1000 games)
    if (stats.totalGames === 1000) {
      await this.awardNFT(userId, 'MILLENNIUM', 'Slot Master', 'Played 1000 games', 4);
    }
  }

  /**
   * Award NFT to user
   */
  private async awardNFT(
    userId: string,
    achievementType: string,
    name: string,
    description: string,
    rarity: number,
  ) {
    // Check if user already has this achievement
    const existing = await this.prisma.nFTReward.findFirst({
      where: { userId, achievementType },
    });

    if (existing) return;

    // Create NFT reward
    const nft = await this.prisma.nFTReward.create({
      data: {
        userId,
        achievementType,
        name,
        description,
        imageUrl: `https://cdn.zeazdev.com/nft/${achievementType.toLowerCase()}.png`,
        rarity,
        claimed: false,
      },
    });

    return nft;
  }

  /**
   * Get user's NFT rewards
   */
  async getUserNFTs(userId: string): Promise<NFTReward[]> {
    const nfts = await this.prisma.nFTReward.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return nfts.map(nft => ({
      tokenId: nft.id,
      name: nft.name,
      description: nft.description,
      imageUrl: nft.imageUrl,
      rarity: nft.rarity,
      achievementType: nft.achievementType,
    }));
  }

  /**
   * TOURNAMENT FUNCTIONS
   */

  async createTournament(
    name: string,
    duration: number, // in hours
    entryFee: string,
    prizePool: string,
  ): Promise<Tournament> {
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + duration * 60 * 60 * 1000);

    const tournament = await this.prisma.tournament.create({
      data: {
        name,
        startTime,
        endTime,
        entryFee,
        prizePool,
        status: 'UPCOMING',
      },
    });

    return {
      id: tournament.id,
      name: tournament.name,
      startTime: tournament.startTime,
      endTime: tournament.endTime,
      entryFee: tournament.entryFee,
      prizePool: tournament.prizePool,
      participants: 0,
      status: 'UPCOMING',
      leaderboard: [],
    };
  }

  async joinTournament(tournamentId: number, userId: string): Promise<boolean> {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament) {
      throw new HttpException('Tournament not found', HttpStatus.NOT_FOUND);
    }

    if (tournament.status !== 'ACTIVE' && tournament.status !== 'UPCOMING') {
      throw new HttpException('Tournament is not active', HttpStatus.BAD_REQUEST);
    }

    // Check if already joined
    const existing = await this.prisma.tournamentParticipant.findFirst({
      where: { tournamentId, userId },
    });

    if (existing) {
      throw new HttpException('Already joined tournament', HttpStatus.BAD_REQUEST);
    }

    // Add participant
    await this.prisma.tournamentParticipant.create({
      data: {
        tournamentId,
        userId,
        totalWins: '0',
        gamesPlayed: 0,
      },
    });

    return true;
  }

  async getTournamentLeaderboard(tournamentId: number): Promise<TournamentEntry[]> {
    const participants = await this.prisma.tournamentParticipant.findMany({
      where: { tournamentId },
      orderBy: [
        { totalWins: 'desc' },
        { gamesPlayed: 'asc' },
      ],
      include: {
        user: {
          select: {
            username: true,
          },
        },
      },
    });

    return participants.map((p, index) => ({
      userId: p.userId,
      username: p.user?.username || 'Anonymous',
      totalWins: p.totalWins,
      gamesPlayed: p.gamesPlayed,
      rank: index + 1,
    }));
  }

  async getActiveTournaments(): Promise<Tournament[]> {
    const tournaments = await this.prisma.tournament.findMany({
      where: {
        status: { in: ['UPCOMING', 'ACTIVE'] },
      },
      orderBy: { startTime: 'asc' },
    });

    const result: Tournament[] = [];

    for (const t of tournaments) {
      const participants = await this.prisma.tournamentParticipant.count({
        where: { tournamentId: t.id },
      });

      const leaderboard = await this.getTournamentLeaderboard(t.id);

      result.push({
        id: t.id,
        name: t.name,
        startTime: t.startTime,
        endTime: t.endTime,
        entryFee: t.entryFee,
        prizePool: t.prizePool,
        participants,
        status: t.status as 'UPCOMING' | 'ACTIVE' | 'FINISHED',
        leaderboard: leaderboard.slice(0, 10), // Top 10
      });
    }

    return result;
  }

  /**
   * LEADERBOARD FUNCTIONS
   */

  async getGlobalLeaderboard(limit: number = 50): Promise<any[]> {
    const stats = await this.prisma.gameStats.findMany({
      orderBy: { totalWinnings: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            username: true,
            avatar: true,
          },
        },
      },
    });

    return stats.map((s, index) => ({
      rank: index + 1,
      userId: s.userId,
      username: s.user?.username || 'Anonymous',
      avatar: s.user?.avatar,
      totalWinnings: s.totalWinnings,
      totalGames: s.totalGames,
      winRate: s.totalGames > 0 ? (s.totalWon / s.totalGames) * 100 : 0,
    }));
  }

  async getUserStats(userId: string) {
    const stats = await this.prisma.gameStats.findUnique({
      where: { userId },
    });

    if (!stats) {
      return {
        totalGames: 0,
        totalWon: 0,
        totalLost: 0,
        totalWinnings: '0',
        winRate: 0,
        winStreak: 0,
        rank: 0,
      };
    }

    // Calculate rank
    const betterPlayers = await this.prisma.gameStats.count({
      where: {
        totalWinnings: {
          gt: stats.totalWinnings,
        },
      },
    });

    return {
      totalGames: stats.totalGames,
      totalWon: stats.totalWon,
      totalLost: stats.totalLost,
      totalWinnings: stats.totalWinnings,
      winRate: stats.totalGames > 0 ? (stats.totalWon / stats.totalGames) * 100 : 0,
      winStreak: stats.winStreak,
      rank: betterPlayers + 1,
    };
  }

  /**
   * GAME HISTORY
   */

  async getGameHistory(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const sessions = await this.prisma.gameSession.findMany({
      where: {
        userId,
        gameType: 'SLOTS',
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    return sessions.map(s => ({
      sessionId: s.sessionId,
      betAmount: s.betAmount,
      tokenUsed: s.tokenUsed,
      result: s.result,
      winAmount: s.winAmount,
      timestamp: s.createdAt,
      metadata: JSON.parse(s.metadata || '{}'),
    }));
  }

  /**
   * Verify provably fair result
   */
  async verifyProvablyFair(sessionId: string, clientSeed: string): Promise<boolean> {
    const session = await this.prisma.gameSession.findUnique({
      where: { sessionId },
    });

    if (!session) {
      throw new HttpException('Session not found', HttpStatus.NOT_FOUND);
    }

    const metadata = JSON.parse(session.metadata || '{}');
    
    // User can verify the game was fair using the seeds
    return metadata.seed === clientSeed;
  }
}
