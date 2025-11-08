// ZeaZDev [Backend Service - Card Issuance] //
// Project: ZeaZDev FiGaTect Super-App //
// Version: 1.0.0 (Omega Scaffolding) //
// Author: ZeaZDev Meta-Intelligence (Generated) //
// --- DO NOT EDIT HEADER --- //

import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import axios from 'axios';

@Injectable()
export class CardService {
  private readonly apiUrl: string;
  private readonly apiKey: string;

  constructor(private readonly prisma: PrismaService) {
    this.apiUrl = process.env.FINTECH_API_URL || 'https://sandbox-api.marqeta.com';
    this.apiKey = process.env.MARQETA_API_KEY || '';
  }

  async issueCard(userId: string, fullName: string, email: string, phone: string) {
    try {
      // Check if user already has a card
      let fintechUser = await this.prisma.fintechUser.findUnique({
        where: { userId },
      });

      if (fintechUser && fintechUser.cardNumber) {
        throw new HttpException('User already has a card', HttpStatus.BAD_REQUEST);
      }

      // In production, call Marqeta or other card issuer API
      const cardNumber = this.generateMockCardNumber();

      if (!fintechUser) {
        fintechUser = await this.prisma.fintechUser.create({
          data: {
            userId,
            cardNumber,
            cardStatus: 'active',
            kycStatus: 'verified',
          },
        });
      } else {
        fintechUser = await this.prisma.fintechUser.update({
          where: { userId },
          data: {
            cardNumber,
            cardStatus: 'active',
          },
        });
      }

      return {
        success: true,
        card: {
          cardNumber: this.maskCardNumber(cardNumber),
          status: fintechUser.cardStatus,
          issuedAt: fintechUser.createdAt,
        },
        message: 'Card issued successfully',
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Failed to issue card', HttpStatus.BAD_REQUEST);
    }
  }

  async getUserCard(userId: string) {
    const fintechUser = await this.prisma.fintechUser.findUnique({
      where: { userId },
    });

    if (!fintechUser || !fintechUser.cardNumber) {
      return {
        hasCard: false,
        card: null,
      };
    }

    return {
      hasCard: true,
      card: {
        cardNumber: this.maskCardNumber(fintechUser.cardNumber),
        status: fintechUser.cardStatus,
        issuedAt: fintechUser.createdAt,
      },
    };
  }

  private generateMockCardNumber(): string {
    // Generate mock card number (not for production)
    const prefix = '4532'; // Visa test prefix
    const randomDigits = Math.random().toString().slice(2, 14);
    return prefix + randomDigits;
  }

  private maskCardNumber(cardNumber: string): string {
    if (!cardNumber || cardNumber.length < 4) return '****';
    return '**** **** **** ' + cardNumber.slice(-4);
  }
}
