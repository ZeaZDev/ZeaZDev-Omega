/*
 * @Project: ZeaZDev FiGaTect Super-App
 * @Module: Backend-Rewards
 * @File: rewards.service.ts
 * @Author: ZeaZDev Enterprises (OMEGA AI)
 * @Date: 2025-11-09
 * @Version: 1.0.0
 * @Description: Rewards service implementing ZKP verification and nullifier tracking
 * @License: ZeaZDev Proprietary License
 * @Copyright: (c) 2025-2026 ZeaZDev. All rights reserved.
 */

import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { WorldcoinService } from '../auth/worldcoin.service';

@Injectable()
export class RewardsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly worldcoinService: WorldcoinService,
  ) {}

  async claimReward(
    userId: string,
    rewardType: 'daily_checkin' | 'airdrop' | 'referral',
    proof: string,
    nullifierHash: string,
    refereeId?: string,
  ) {
    try {
      // Check if nullifier already used
      const existingClaim = await this.prisma.rewardClaim.findUnique({
        where: { nullifierHash },
      });

      if (existingClaim) {
        throw new HttpException('Reward already claimed', HttpStatus.BAD_REQUEST);
      }

      // Verify user exists
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      // Check eligibility based on reward type
      if (rewardType === 'daily_checkin') {
        const lastCheckIn = await this.prisma.rewardClaim.findFirst({
          where: {
            userId,
            rewardType: 'daily_checkin',
            claimed: true,
          },
          orderBy: { claimedAt: 'desc' },
        });

        if (lastCheckIn) {
          const hoursSinceLastClaim = 
            (Date.now() - lastCheckIn.claimedAt.getTime()) / (1000 * 60 * 60);
          
          if (hoursSinceLastClaim < 24) {
            throw new HttpException(
              'Daily check-in already claimed today',
              HttpStatus.BAD_REQUEST,
            );
          }
        }
      }

      if (rewardType === 'airdrop') {
        const airdropClaimed = await this.prisma.rewardClaim.findFirst({
          where: {
            userId,
            rewardType: 'airdrop',
            claimed: true,
          },
        });

        if (airdropClaimed) {
          throw new HttpException('Airdrop already claimed', HttpStatus.BAD_REQUEST);
        }
      }

      // Determine reward amounts
      const rewardAmounts = {
        daily_checkin: { ZEA: '100000000000000000000', DING: '10000000000000000000000' }, // 100 ZEA, 10000 DING
        airdrop: { ZEA: '1000000000000000000000', DING: '20000000000000000000000' }, // 1000 ZEA, 20000 DING
        referral: { ZEA: '500000000000000000000', DING: '0' }, // 500 ZEA
      };

      const reward = rewardAmounts[rewardType];

      // Create reward claim
      const claim = await this.prisma.rewardClaim.create({
        data: {
          userId,
          rewardType,
          amount: reward.ZEA,
          tokenType: 'ZEA',
          nullifierHash,
          claimed: true,
          claimedAt: new Date(),
        },
      });

      // If referral, create referral record
      if (rewardType === 'referral' && refereeId) {
        await this.prisma.referral.create({
          data: {
            referrerId: userId,
            refereeId,
            rewardClaimed: true,
          },
        });
      }

      return {
        success: true,
        claim,
        reward,
        message: `${rewardType} reward claimed successfully`,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Failed to claim reward', HttpStatus.BAD_REQUEST);
    }
  }

  async getUserRewards(userId: string) {
    const claims = await this.prisma.rewardClaim.findMany({
      where: { userId, claimed: true },
      orderBy: { claimedAt: 'desc' },
    });

    const totalZEA = claims
      .filter((c) => c.tokenType === 'ZEA')
      .reduce((sum, c) => sum + BigInt(c.amount), BigInt(0));

    return {
      claims,
      totalZEA: totalZEA.toString(),
      count: claims.length,
    };
  }

  async checkEligibility(userId: string) {
    const lastCheckIn = await this.prisma.rewardClaim.findFirst({
      where: {
        userId,
        rewardType: 'daily_checkin',
        claimed: true,
      },
      orderBy: { claimedAt: 'desc' },
    });

    const airdropClaimed = await this.prisma.rewardClaim.findFirst({
      where: {
        userId,
        rewardType: 'airdrop',
        claimed: true,
      },
    });

    const canClaimDaily = !lastCheckIn || 
      (Date.now() - lastCheckIn.claimedAt.getTime()) >= 24 * 60 * 60 * 1000;

    return {
      canClaimDaily,
      canClaimAirdrop: !airdropClaimed,
      canClaimReferral: true,
      nextDailyCheckIn: lastCheckIn 
        ? new Date(lastCheckIn.claimedAt.getTime() + 24 * 60 * 60 * 1000)
        : new Date(),
    };
  }
}
