/*
 * @Project: ZeaZDev FiGaTect Super-App
 * @Module: Backend-FinTech
 * @File: bank.thai.service.ts
 * @Author: ZeaZDev Enterprises (OMEGA AI)
 * @Date: 2025-11-09
 * @Version: 1.0.0
 * @Description: Thai bank integration service for THB deposits and withdrawals
 * @License: ZeaZDev Proprietary License
 * @Copyright: (c) 2025-2026 ZeaZDev. All rights reserved.
 */

import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import axios from 'axios';

@Injectable()
export class BankThaiService {
  private readonly apiUrl: string;
  private readonly apiKey: string;

  constructor(private readonly prisma: PrismaService) {
    this.apiUrl = process.env.THAI_BANK_PROXY_URL || 'https://api.thai-bank-proxy.com';
    this.apiKey = process.env.THAI_BANK_API_KEY || '';
  }

  async deposit(userId: string, amount: string, bankAccountNumber: string) {
    try {
      // Get or create FinTech user
      let fintechUser = await this.prisma.fintechUser.findUnique({
        where: { userId },
      });

      if (!fintechUser) {
        fintechUser = await this.prisma.fintechUser.create({
          data: {
            userId,
            bankAccountLinked: true,
          },
        });
      }

      // In production, call real Thai bank API
      // For now, create mock transaction
      const transaction = await this.prisma.fintechTransaction.create({
        data: {
          fintechUserId: fintechUser.id,
          type: 'deposit',
          amount,
          currency: 'THB',
          status: 'completed',
          externalRef: `DEPOSIT_${Date.now()}`,
          completedAt: new Date(),
        },
      });

      return {
        success: true,
        transaction,
        message: 'Deposit initiated successfully',
      };
    } catch (error) {
      throw new HttpException('Failed to process deposit', HttpStatus.BAD_REQUEST);
    }
  }

  async withdraw(userId: string, amount: string, bankAccountNumber: string) {
    try {
      const fintechUser = await this.prisma.fintechUser.findUnique({
        where: { userId },
      });

      if (!fintechUser) {
        throw new HttpException('FinTech user not found', HttpStatus.NOT_FOUND);
      }

      // In production, call real Thai bank API
      const transaction = await this.prisma.fintechTransaction.create({
        data: {
          fintechUserId: fintechUser.id,
          type: 'withdrawal',
          amount,
          currency: 'THB',
          status: 'pending',
          externalRef: `WITHDRAW_${Date.now()}`,
        },
      });

      // Mock API call
      if (this.apiKey) {
        try {
          await axios.post(
            `${this.apiUrl}/withdraw`,
            {
              accountNumber: bankAccountNumber,
              amount,
              reference: transaction.id,
            },
            {
              headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
              },
            },
          );
        } catch (apiError) {
          console.error('Thai Bank API error:', apiError);
        }
      }

      return {
        success: true,
        transaction,
        message: 'Withdrawal initiated successfully',
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Failed to process withdrawal', HttpStatus.BAD_REQUEST);
    }
  }

  async getUserTransactions(userId: string) {
    const fintechUser = await this.prisma.fintechUser.findUnique({
      where: { userId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!fintechUser) {
      return { transactions: [] };
    }

    return {
      transactions: fintechUser.transactions,
    };
  }

  /**
   * Verify Thai bank account (mock implementation)
   */
  async verifyBankAccount(accountNumber: string, accountName: string): Promise<boolean> {
    // In production, call Thai bank verification API
    return true;
  }
}
