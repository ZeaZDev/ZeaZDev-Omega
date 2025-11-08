// ZeaZDev [Backend Controller - Auth] //
// Project: ZeaZDev FiGaTect Super-App //
// Version: 1.0.0 (Omega Scaffolding) //
// Author: ZeaZDev Meta-Intelligence (Generated) //
// --- DO NOT EDIT HEADER --- //

import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { WorldcoinService } from './worldcoin.service';
import { PrismaService } from '../../prisma.service';

class VerifyWorldIdDto {
  proof: string;
  nullifier_hash: string;
  merkle_root: string;
  verification_level: string;
  action: string;
  signal: string;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly worldcoinService: WorldcoinService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('world-id/verify')
  async verifyWorldId(@Body() dto: VerifyWorldIdDto) {
    try {
      // Verify the World ID proof on-chain
      const isValid = await this.worldcoinService.verifyProof(
        dto.proof,
        dto.nullifier_hash,
        dto.merkle_root,
        dto.signal,
      );

      if (!isValid) {
        throw new HttpException('Invalid World ID proof', HttpStatus.UNAUTHORIZED);
      }

      // Check if user exists, create if not
      let user = await this.prisma.user.findUnique({
        where: { worldIdHash: dto.nullifier_hash },
      });

      if (!user) {
        // Extract wallet address from signal
        const walletAddress = dto.signal;
        
        user = await this.prisma.user.create({
          data: {
            worldIdHash: dto.nullifier_hash,
            walletAddress,
            lastLoginAt: new Date(),
          },
        });
      } else {
        // Update last login
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });
      }

      return {
        success: true,
        user: {
          id: user.id,
          walletAddress: user.walletAddress,
          worldIdHash: user.worldIdHash,
        },
        message: 'World ID verified successfully',
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'World ID verification failed',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('wallet/connect')
  async connectWallet(@Body() body: { walletAddress: string }) {
    try {
      let user = await this.prisma.user.findUnique({
        where: { walletAddress: body.walletAddress },
      });

      if (!user) {
        user = await this.prisma.user.create({
          data: {
            walletAddress: body.walletAddress,
            lastLoginAt: new Date(),
          },
        });
      } else {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });
      }

      return {
        success: true,
        user: {
          id: user.id,
          walletAddress: user.walletAddress,
        },
      };
    } catch (error) {
      throw new HttpException(
        'Wallet connection failed',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
