/*
 * @Project: ZeaZDev FiGaTect Super-App
 * @Module: Backend-Game
 * @File: game.service.ts
 * @Author: ZeaZDev Enterprises (OMEGA AI)
 * @Date: 2025-11-10
 * @Version: 2.0.0 (Phase 7: Advanced GameFi)
 * @Description: Enhanced game service supporting multiple game types: slots, poker, roulette, and sports betting
 * @License: ZeaZDev Proprietary License
 * @Copyright: (c) 2025-2026 ZeaZDev. All rights reserved.
 */

import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

export interface GameStats {
  totalGames: number;
  totalWon: number;
  totalLost: number;
  totalWinnings: string;
  winRate: number;
}

export interface SportEvent {
  id: number;
  sport: string;
  teamA: string;
  teamB: string;
  startTime: Date;
  status: 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'CANCELLED';
  oddsTeamA: number;
  oddsTeamB: number;
  oddsDraw: number;
}

@Injectable()
export class GameService {
  constructor(private readonly prisma: PrismaService) {}

  async playSlots(
    userId: string,
    betAmount: string,
    tokenUsed: 'ZEA' | 'DING',
    txHash: string,
  ) {
    try {
      // Verify user exists
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      // Create game session
      const session = await this.prisma.gameSession.create({
        data: {
          sessionId: `session_${Date.now()}_${userId.slice(0, 8)}`,
          userId,
          gameType: 'slots',
          betAmount,
          tokenUsed,
          result: 'PENDING',
          status: 'playing',
          txHash,
        },
      });

      // Generate random result (mock slot game logic)
      const result = this.generateSlotResult(betAmount);

      return {
        success: true,
        sessionId: session.id,
        result,
        message: 'Slot game started',
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Failed to start game', HttpStatus.BAD_REQUEST);
    }
  }

  async completeSlots(
    sessionId: string,
    result: 'won' | 'lost',
    winAmount?: string,
  ) {
    try {
      const session = await this.prisma.gameSession.findUnique({
        where: { id: sessionId },
      });

      if (!session) {
        throw new HttpException('Session not found', HttpStatus.NOT_FOUND);
      }

      if (session.status !== 'playing') {
        throw new HttpException('Session already completed', HttpStatus.BAD_REQUEST);
      }

      // Update session
      const updatedSession = await this.prisma.gameSession.update({
        where: { id: sessionId },
        data: {
          status: result,
          winAmount: winAmount || '0',
          completedAt: new Date(),
        },
      });

      // Update leaderboard
      await this.updateLeaderboard(session.userId, session.gameType, result, winAmount);

      return {
        success: true,
        session: updatedSession,
        message: `Game ${result}`,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Failed to complete game', HttpStatus.BAD_REQUEST);
    }
  }

  async updateLeaderboard(
    userId: string,
    gameType: string,
    result: 'won' | 'lost',
    winAmount?: string,
  ) {
    try {
      // Get or create leaderboard entry
      let leaderboard = await this.prisma.gameLeaderboard.findUnique({
        where: {
          userId_gameType: { userId, gameType },
        },
      });

      if (!leaderboard) {
        leaderboard = await this.prisma.gameLeaderboard.create({
          data: {
            userId,
            gameType,
            totalWins: result === 'won' ? 1 : 0,
            totalLosses: result === 'lost' ? 1 : 0,
            totalWinnings: winAmount || '0',
            highestWin: winAmount || '0',
            winStreak: result === 'won' ? 1 : 0,
          },
        });
      } else {
        const newWinStreak = result === 'won' ? leaderboard.winStreak + 1 : 0;
        const newTotalWinnings = result === 'won'
          ? (BigInt(leaderboard.totalWinnings) + BigInt(winAmount || '0')).toString()
          : leaderboard.totalWinnings;
        const newHighestWin = result === 'won' && winAmount && BigInt(winAmount) > BigInt(leaderboard.highestWin)
          ? winAmount
          : leaderboard.highestWin;

        await this.prisma.gameLeaderboard.update({
          where: {
            userId_gameType: { userId, gameType },
          },
          data: {
            totalWins: result === 'won' ? leaderboard.totalWins + 1 : leaderboard.totalWins,
            totalLosses: result === 'lost' ? leaderboard.totalLosses + 1 : leaderboard.totalLosses,
            totalWinnings: newTotalWinnings,
            highestWin: newHighestWin,
            winStreak: newWinStreak,
          },
        });
      }
    } catch (error) {
      console.error('Failed to update leaderboard:', error);
    }
  }

  async getLeaderboard(gameType: string = 'slots', limit: number = 10) {
    const leaderboard = await this.prisma.gameLeaderboard.findMany({
      where: { gameType },
      orderBy: { totalWinnings: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            walletAddress: true,
            username: true,
          },
        },
      },
    });

    return {
      leaderboard: leaderboard.map((entry, index) => ({
        ...entry,
        rank: index + 1,
      })),
    };
  }

  async getUserSessions(userId: string) {
    const sessions = await this.prisma.gameSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const stats = {
      totalGames: sessions.length,
      totalWon: sessions.filter((s) => s.status === 'won').length,
      totalLost: sessions.filter((s) => s.status === 'lost').length,
      totalWinnings: sessions
        .filter((s) => s.status === 'won')
        .reduce((sum, s) => sum + BigInt(s.winAmount || '0'), BigInt(0))
        .toString(),
    };

    return {
      sessions,
      stats,
    };
  }

  async getSession(sessionId: string) {
    const session = await this.prisma.gameSession.findUnique({
      where: { id: sessionId },
      include: {
        user: {
          select: {
            id: true,
            walletAddress: true,
            username: true,
          },
        },
      },
    });

    if (!session) {
      throw new HttpException('Session not found', HttpStatus.NOT_FOUND);
    }

    return { session };
  }

  /**
   * Generate slot game result (mock implementation)
   * In production, this would use provably fair algorithm
   */
  private generateSlotResult(betAmount: string) {
    const random = Math.random();
    
    // 30% chance to win
    if (random < 0.3) {
      const multiplier = Math.floor(Math.random() * 5) + 2; // 2x to 6x
      const winAmount = (BigInt(betAmount) * BigInt(multiplier)).toString();
      
      return {
        outcome: 'won',
        winAmount,
        multiplier,
        symbols: this.generateSymbols(true),
      };
    } else {
      return {
        outcome: 'lost',
        winAmount: '0',
        multiplier: 0,
        symbols: this.generateSymbols(false),
      };
    }
  }

  private generateSymbols(isWin: boolean): string[] {
    const symbols = ['🍒', '🍋', '🍊', '🍇', '💎', '7️⃣'];
    
    if (isWin) {
      const winSymbol = symbols[Math.floor(Math.random() * symbols.length)];
      return [winSymbol, winSymbol, winSymbol];
    } else {
      return [
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
      ];
    }
  }

  /**
   * POKER GAME METHODS
   */

  async createPokerGame(
    userId: string,
    smallBlind: string,
    bigBlind: string,
    token: 'ZEA' | 'DING'
  ) {
    try {
      // Create poker game session
      const session = await this.prisma.gameSession.create({
        data: {
          sessionId: `poker_${Date.now()}_${userId.slice(0, 8)}`,
          userId,
          gameType: 'poker',
          betAmount: bigBlind,
          tokenUsed: token,
          result: 'PENDING',
          status: 'waiting',
        },
      });

      return {
        success: true,
        sessionId: session.id,
        gameType: 'poker',
        smallBlind,
        bigBlind,
        message: 'Poker game created',
      };
    } catch (error) {
      throw new HttpException('Failed to create poker game', HttpStatus.BAD_REQUEST);
    }
  }

  async playPokerHand(
    sessionId: string,
    betAmount: string
  ) {
    try {
      const session = await this.prisma.gameSession.findUnique({
        where: { id: sessionId },
      });

      if (!session) {
        throw new HttpException('Session not found', HttpStatus.NOT_FOUND);
      }

      // Generate poker hand result (mock)
      const result = this.generatePokerResult(betAmount);

      return {
        success: true,
        sessionId: session.id,
        result,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Failed to play poker hand', HttpStatus.BAD_REQUEST);
    }
  }

  private generatePokerResult(betAmount: string) {
    const hands = [
      { name: 'Royal Flush', multiplier: 250 },
      { name: 'Straight Flush', multiplier: 50 },
      { name: 'Four of a Kind', multiplier: 25 },
      { name: 'Full House', multiplier: 9 },
      { name: 'Flush', multiplier: 6 },
      { name: 'Straight', multiplier: 4 },
      { name: 'Three of a Kind', multiplier: 3 },
      { name: 'Two Pair', multiplier: 2 },
      { name: 'Pair', multiplier: 1 },
      { name: 'High Card', multiplier: 0 },
    ];

    const random = Math.random();
    let selectedHand;

    // Probability distribution
    if (random < 0.01) selectedHand = hands[0]; // Royal Flush 1%
    else if (random < 0.03) selectedHand = hands[1]; // Straight Flush 2%
    else if (random < 0.08) selectedHand = hands[2]; // Four of a Kind 5%
    else if (random < 0.15) selectedHand = hands[3]; // Full House 7%
    else if (random < 0.25) selectedHand = hands[4]; // Flush 10%
    else if (random < 0.35) selectedHand = hands[5]; // Straight 10%
    else if (random < 0.50) selectedHand = hands[6]; // Three of a Kind 15%
    else if (random < 0.70) selectedHand = hands[7]; // Two Pair 20%
    else if (random < 0.85) selectedHand = hands[8]; // Pair 15%
    else selectedHand = hands[9]; // High Card 15%

    const isWin = selectedHand.multiplier > 0;
    const winAmount = isWin
      ? (BigInt(betAmount) * BigInt(selectedHand.multiplier)).toString()
      : '0';

    return {
      outcome: isWin ? 'won' : 'lost',
      hand: selectedHand.name,
      multiplier: selectedHand.multiplier,
      winAmount,
      cards: this.generatePokerCards(),
    };
  }

  private generatePokerCards() {
    const suits = ['♠️', '♥️', '♦️', '♣️'];
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const cards = [];

    for (let i = 0; i < 5; i++) {
      const suit = suits[Math.floor(Math.random() * suits.length)];
      const rank = ranks[Math.floor(Math.random() * ranks.length)];
      cards.push(`${rank}${suit}`);
    }

    return cards;
  }

  /**
   * ROULETTE GAME METHODS
   */

  async playRoulette(
    userId: string,
    betAmount: string,
    betType: 'number' | 'color' | 'even-odd' | 'high-low',
    betValue: string | number,
    token: 'ZEA' | 'DING'
  ) {
    try {
      const session = await this.prisma.gameSession.create({
        data: {
          sessionId: `roulette_${Date.now()}_${userId.slice(0, 8)}`,
          userId,
          gameType: 'roulette',
          betAmount,
          tokenUsed: token,
          result: 'PENDING',
          status: 'playing',
        },
      });

      const result = this.generateRouletteResult(betAmount, betType, betValue);

      // Update session with result
      await this.prisma.gameSession.update({
        where: { id: session.id },
        data: {
          status: result.outcome,
          winAmount: result.winAmount,
          completedAt: new Date(),
        },
      });

      await this.updateLeaderboard(userId, 'roulette', result.outcome as 'won' | 'lost', result.winAmount);

      return {
        success: true,
        sessionId: session.id,
        result,
      };
    } catch (error) {
      throw new HttpException('Failed to play roulette', HttpStatus.BAD_REQUEST);
    }
  }

  private generateRouletteResult(
    betAmount: string,
    betType: string,
    betValue: string | number
  ) {
    const spinResult = Math.floor(Math.random() * 37); // 0-36 (European)
    const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
    const isRed = redNumbers.includes(spinResult);
    const isEven = spinResult % 2 === 0 && spinResult !== 0;

    let isWin = false;
    let multiplier = 0;

    if (betType === 'number' && spinResult === Number(betValue)) {
      isWin = true;
      multiplier = 35;
    } else if (betType === 'color') {
      if (betValue === 'red' && isRed) {
        isWin = true;
        multiplier = 1;
      } else if (betValue === 'black' && !isRed && spinResult !== 0) {
        isWin = true;
        multiplier = 1;
      }
    } else if (betType === 'even-odd') {
      if (betValue === 'even' && isEven) {
        isWin = true;
        multiplier = 1;
      } else if (betValue === 'odd' && !isEven && spinResult !== 0) {
        isWin = true;
        multiplier = 1;
      }
    } else if (betType === 'high-low') {
      if (betValue === 'low' && spinResult >= 1 && spinResult <= 18) {
        isWin = true;
        multiplier = 1;
      } else if (betValue === 'high' && spinResult >= 19 && spinResult <= 36) {
        isWin = true;
        multiplier = 1;
      }
    }

    const winAmount = isWin
      ? (BigInt(betAmount) * BigInt(multiplier + 1)).toString()
      : '0';

    return {
      outcome: isWin ? 'won' : 'lost',
      spinResult,
      isRed,
      isEven,
      winAmount,
      multiplier,
    };
  }

  /**
   * SPORTS BETTING METHODS
   */

  async getSportsEvents(sport?: string, status?: string) {
    // Mock sports events
    const events: SportEvent[] = [
      {
        id: 1,
        sport: 'FOOTBALL',
        teamA: 'Manchester United',
        teamB: 'Liverpool',
        startTime: new Date(Date.now() + 86400000), // Tomorrow
        status: 'SCHEDULED',
        oddsTeamA: 2.5,
        oddsTeamB: 1.8,
        oddsDraw: 3.2,
      },
      {
        id: 2,
        sport: 'BASKETBALL',
        teamA: 'LA Lakers',
        teamB: 'Boston Celtics',
        startTime: new Date(Date.now() + 172800000), // 2 days
        status: 'SCHEDULED',
        oddsTeamA: 1.9,
        oddsTeamB: 2.1,
        oddsDraw: 0,
      },
      {
        id: 3,
        sport: 'ESPORTS',
        teamA: 'Team Liquid',
        teamB: 'Cloud9',
        startTime: new Date(Date.now() + 43200000), // 12 hours
        status: 'SCHEDULED',
        oddsTeamA: 1.7,
        oddsTeamB: 2.3,
        oddsDraw: 0,
      },
    ];

    let filtered = events;
    if (sport) {
      filtered = filtered.filter(e => e.sport === sport.toUpperCase());
    }
    if (status) {
      filtered = filtered.filter(e => e.status === status.toUpperCase());
    }

    return { events: filtered };
  }

  async placeSportsBet(
    userId: string,
    eventId: number,
    prediction: 'TEAM_A' | 'TEAM_B' | 'DRAW',
    betAmount: string,
    token: 'ZEA' | 'DING'
  ) {
    try {
      const { events } = await this.getSportsEvents();
      const event = events.find(e => e.id === eventId);

      if (!event) {
        throw new HttpException('Event not found', HttpStatus.NOT_FOUND);
      }

      if (event.status !== 'SCHEDULED') {
        throw new HttpException('Event is not open for betting', HttpStatus.BAD_REQUEST);
      }

      let odds = 0;
      if (prediction === 'TEAM_A') odds = event.oddsTeamA;
      else if (prediction === 'TEAM_B') odds = event.oddsTeamB;
      else odds = event.oddsDraw;

      const potentialPayout = (parseFloat(betAmount) * odds).toFixed(4);

      const session = await this.prisma.gameSession.create({
        data: {
          sessionId: `sports_${Date.now()}_${userId.slice(0, 8)}`,
          userId,
          gameType: 'sports',
          betAmount,
          tokenUsed: token,
          result: 'PENDING',
          status: 'pending',
        },
      });

      return {
        success: true,
        sessionId: session.id,
        event,
        prediction,
        odds,
        betAmount,
        potentialPayout,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Failed to place sports bet', HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * Get all supported game types
   */
  async getGameTypes() {
    return {
      games: [
        { id: 'slots', name: 'Slots', icon: '🎰', available: true },
        { id: 'poker', name: 'Poker', icon: '🃏', available: true },
        { id: 'roulette', name: 'Roulette', icon: '🎡', available: true },
        { id: 'sports', name: 'Sports Betting', icon: '⚽', available: true },
      ],
    };
  }

  /**
   * Get comprehensive game statistics
   */
  async getGameStatistics(userId: string): Promise<GameStats> {
    const sessions = await this.prisma.gameSession.findMany({
      where: { userId },
    });

    const totalWon = sessions.filter(s => s.status === 'won').length;
    const totalLost = sessions.filter(s => s.status === 'lost').length;
    const totalGames = totalWon + totalLost;

    return {
      totalGames,
      totalWon,
      totalLost,
      totalWinnings: sessions
        .filter(s => s.status === 'won')
        .reduce((sum, s) => sum + BigInt(s.winAmount || '0'), BigInt(0))
        .toString(),
      winRate: totalGames > 0 ? (totalWon / totalGames) * 100 : 0,
    };
  }
}
