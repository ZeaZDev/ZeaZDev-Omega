// ZeaZDev [Backend Service - Game] //
// Project: ZeaZDev FiGaTect Super-App //
// Version: 1.0.0 (Omega Scaffolding) //
// Author: ZeaZDev Meta-Intelligence (Generated) //
// --- DO NOT EDIT HEADER --- //

import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

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
          userId,
          gameType: 'slots',
          betAmount,
          tokenUsed,
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
}
