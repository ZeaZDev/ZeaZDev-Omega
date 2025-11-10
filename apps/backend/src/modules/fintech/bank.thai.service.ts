/*
 * @Project: ZeaZDev FiGaTect Super-App
 * @Module: Backend-FinTech
 * @File: bank.thai.service.ts
 * @Author: ZeaZDev Enterprises (OMEGA AI)
 * @Date: 2025-11-09
 * @Version: 2.0.0
 * @Description: Thai bank integration service with PromptPay support for THB deposits and withdrawals
 * @License: ZeaZDev Proprietary License
 * @Copyright: (c) 2025-2026 ZeaZDev. All rights reserved.
 */

import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import axios from 'axios';
import * as crypto from 'crypto';

interface PromptPayQRData {
  qrCode: string;
  amount: string;
  reference: string;
  expiresAt: Date;
}

interface PromptPayPaymentStatus {
  transactionId: string;
  status: 'pending' | 'completed' | 'failed' | 'expired';
  amount: string;
  paidAt?: Date;
}

@Injectable()
export class BankThaiService {
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly promptPayId: string;
  private readonly promptPayEnabled: boolean;

  constructor(private readonly prisma: PrismaService) {
    this.apiUrl = process.env.THAI_BANK_PROXY_URL || 'https://api.thai-bank-proxy.com';
    this.apiKey = process.env.THAI_BANK_API_KEY || '';
    this.promptPayId = process.env.PROMPTPAY_ID || '';
    this.promptPayEnabled = process.env.PROMPTPAY_ENABLED === 'true';
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

  /**
   * Generate PromptPay QR code for deposit
   * PromptPay is Thailand's national payment system for instant transfers
   */
  async generatePromptPayQR(
    userId: string,
    amount: string,
    currency: string = 'THB'
  ): Promise<PromptPayQRData> {
    try {
      if (!this.promptPayEnabled) {
        throw new HttpException('PromptPay is not enabled', HttpStatus.SERVICE_UNAVAILABLE);
      }

      // Generate unique reference for this transaction
      const reference = `TOPUP_${userId}_${Date.now()}`;
      
      // Create pending transaction
      let fintechUser = await this.prisma.fintechUser.findUnique({
        where: { userId },
      });

      if (!fintechUser) {
        fintechUser = await this.prisma.fintechUser.create({
          data: {
            userId,
            bankAccountLinked: false,
          },
        });
      }

      const transaction = await this.prisma.fintechTransaction.create({
        data: {
          fintechUserId: fintechUser.id,
          type: 'deposit',
          amount,
          currency,
          status: 'pending',
          externalRef: reference,
        },
      });

      // Generate PromptPay QR Code payload
      const qrPayload = this.generatePromptPayPayload(
        this.promptPayId,
        amount,
        reference
      );

      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15); // QR expires in 15 minutes

      return {
        qrCode: qrPayload,
        amount,
        reference: transaction.id,
        expiresAt,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Failed to generate PromptPay QR code',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Generate PromptPay QR code payload using EMV standard
   * This creates a standard PromptPay QR code that can be scanned by any Thai banking app
   */
  private generatePromptPayPayload(
    promptPayId: string,
    amount: string,
    reference: string
  ): string {
    // PromptPay uses EMV QR Code format
    // For production, use a proper PromptPay QR generation library
    // This is a simplified implementation
    
    const payload = [
      '00', // Payload Format Indicator
      '020101', // Point of Initiation Method (11 = static, 12 = dynamic)
      '29', // Merchant Account Information - PromptPay
      this.formatPromptPayTag(promptPayId),
      '53', // Transaction Currency (764 = THB)
      '0764',
      '54', // Transaction Amount
      amount,
      '58', // Country Code
      'TH',
      '62', // Additional Data
      this.formatReferenceTag(reference),
      '63', // CRC
      '0000' // Will be calculated
    ].join('');

    // Calculate CRC16 checksum (simplified)
    const crc = this.calculateCRC16(payload);
    return payload.replace('0000', crc);
  }

  /**
   * Format PromptPay ID tag for QR code
   */
  private formatPromptPayTag(promptPayId: string): string {
    // PromptPay ID can be phone number, national ID, or tax ID
    const cleanId = promptPayId.replace(/[^0-9]/g, '');
    const idTag = `0016A000000677010111${cleanId.padStart(13, '0')}`;
    return idTag;
  }

  /**
   * Format reference tag for QR code
   */
  private formatReferenceTag(reference: string): string {
    const refLength = reference.length.toString().padStart(2, '0');
    return `05${refLength}${reference}`;
  }

  /**
   * Calculate CRC16 checksum for PromptPay QR code
   */
  private calculateCRC16(data: string): string {
    // CRC-16-CCITT implementation
    let crc = 0xFFFF;
    const bytes = Buffer.from(data, 'utf-8');
    
    // Validate buffer length to prevent potential DoS attacks
    const MAX_QR_LENGTH = 512; // PromptPay QR codes are typically < 300 bytes
    if (bytes.length > MAX_QR_LENGTH) {
      throw new HttpException(
        'QR code data too long',
        HttpStatus.BAD_REQUEST
      );
    }

    for (let i = 0; i < bytes.length; i++) {
      crc ^= bytes[i] << 8;
      for (let j = 0; j < 8; j++) {
        crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
      }
    }

    return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
  }

  /**
   * Verify PromptPay payment status
   * In production, this would call Thai bank API to verify payment
   */
  async verifyPromptPayPayment(transactionId: string): Promise<PromptPayPaymentStatus> {
    try {
      const transaction = await this.prisma.fintechTransaction.findUnique({
        where: { id: transactionId },
      });

      if (!transaction) {
        throw new HttpException('Transaction not found', HttpStatus.NOT_FOUND);
      }

      // In production, call Thai bank API to verify payment
      if (this.apiKey && this.promptPayEnabled) {
        try {
          const response = await axios.get(
            `${this.apiUrl}/promptpay/verify/${transaction.externalRef}`,
            {
              headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
              },
            }
          );

          if (response.data.status === 'completed') {
            // Update transaction status
            await this.prisma.fintechTransaction.update({
              where: { id: transactionId },
              data: {
                status: 'completed',
                completedAt: new Date(),
              },
            });

            return {
              transactionId: transaction.id,
              status: 'completed',
              amount: transaction.amount,
              paidAt: new Date(),
            };
          }
        } catch (apiError) {
          console.error('PromptPay verification error:', apiError);
        }
      }

      // Return current status from database
      return {
        transactionId: transaction.id,
        status: transaction.status as any,
        amount: transaction.amount,
        paidAt: transaction.completedAt || undefined,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Failed to verify payment',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Process PromptPay webhook notification
   * Called by Thai bank when payment is received
   */
  async handlePromptPayWebhook(payload: {
    transactionRef: string;
    amount: string;
    paidAt: string;
    status: string;
  }): Promise<void> {
    try {
      const transaction = await this.prisma.fintechTransaction.findFirst({
        where: { externalRef: payload.transactionRef },
      });

      if (!transaction) {
        throw new HttpException('Transaction not found', HttpStatus.NOT_FOUND);
      }

      if (payload.status === 'success' && transaction.status === 'pending') {
        await this.prisma.fintechTransaction.update({
          where: { id: transaction.id },
          data: {
            status: 'completed',
            completedAt: new Date(payload.paidAt),
          },
        });

        // Here you would trigger the crypto minting/transfer to user
        console.log(`PromptPay payment completed for transaction ${transaction.id}`);
      }
    } catch (error) {
      console.error('PromptPay webhook error:', error);
      throw error;
    }
  }
}
