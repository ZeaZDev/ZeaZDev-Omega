/*
 * @Project: ZeaZDev FiGaTect Super-App
 * @Module: Backend-DeFi
 * @File: defi.service.ts
 * @Author: ZeaZDev Enterprises (OMEGA AI)
 * @Date: 2025-11-09
 * @Version: 1.0.0
 * @Description: DeFi service implementing Uniswap integration and staking logic
 * @License: ZeaZDev Proprietary License
 * @Copyright: (c) 2025-2026 ZeaZDev. All rights reserved.
 */

import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { ethers } from 'ethers';

@Injectable()
export class DefiService {
  private provider: ethers.Provider;
  private uniswapQuoter: ethers.Contract;
  private uniswapRouter: ethers.Contract;

  constructor(private readonly prisma: PrismaService) {
    this.provider = new ethers.JsonRpcProvider(
      process.env.RPC_URL || 'https://mainnet.optimism.io',
    );

    // Uniswap V3 Quoter ABI (minimal)
    const quoterAbi = [
      'function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) external returns (uint256 amountOut)',
      'function quoteExactInput(bytes path, uint256 amountIn) external returns (uint256 amountOut)',
    ];

    // Uniswap V3 Router ABI (minimal)
    const routerAbi = [
      'function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)',
      'function exactInput((bytes path, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum)) external payable returns (uint256 amountOut)',
    ];

    const quoterAddress = process.env.UNISWAP_QUOTER_ADDRESS || 
      '0x61fFE014bA17989E743c5F6cB21bF9697530B21e'; // Optimism mainnet
    
    const routerAddress = process.env.UNISWAP_ROUTER_ADDRESS ||
      '0xE592427A0AEce92De3Edee1F18E0157C05861564'; // Optimism mainnet SwapRouter

    this.uniswapQuoter = new ethers.Contract(
      quoterAddress,
      quoterAbi,
      this.provider,
    );

    this.uniswapRouter = new ethers.Contract(
      routerAddress,
      routerAbi,
      this.provider,
    );
  }

  /**
   * Execute a token swap using Uniswap V3
   * Note: This requires the user to have approved the router to spend their tokens
   */
  async executeSwap(
    userAddress: string,
    tokenIn: string,
    tokenOut: string,
    amountIn: string,
    minAmountOut: string,
    deadline?: number
  ) {
    try {
      // Validate inputs
      if (!ethers.isAddress(userAddress)) {
        throw new HttpException('Invalid user address', HttpStatus.BAD_REQUEST);
      }
      if (!ethers.isAddress(tokenIn)) {
        throw new HttpException('Invalid tokenIn address', HttpStatus.BAD_REQUEST);
      }
      if (!ethers.isAddress(tokenOut)) {
        throw new HttpException('Invalid tokenOut address', HttpStatus.BAD_REQUEST);
      }
      if (BigInt(amountIn) <= 0) {
        throw new HttpException('Amount must be greater than 0', HttpStatus.BAD_REQUEST);
      }

      const swapDeadline = deadline || Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes
      const feeTier = 3000; // 0.3%

      // Return swap transaction data that the frontend will execute
      return {
        success: true,
        router: this.uniswapRouter.target,
        params: {
          tokenIn,
          tokenOut,
          fee: feeTier,
          recipient: userAddress,
          deadline: swapDeadline,
          amountIn,
          amountOutMinimum: minAmountOut,
          sqrtPriceLimitX96: 0,
        },
        message: 'Swap parameters prepared. Execute on frontend with user wallet.',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to prepare swap: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get token pool liquidity information
   */
  async getPoolLiquidity(tokenA: string, tokenB: string) {
    try {
      if (!ethers.isAddress(tokenA) || !ethers.isAddress(tokenB)) {
        throw new HttpException('Invalid token addresses', HttpStatus.BAD_REQUEST);
      }

      // Get pool address from Uniswap V3 Factory
      const factoryAbi = [
        'function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)',
      ];
      
      const factoryAddress = process.env.UNISWAP_FACTORY_ADDRESS ||
        '0x1F98431c8aD98523631AE4a59f267346ea31F984'; // Optimism mainnet

      const factory = new ethers.Contract(
        factoryAddress,
        factoryAbi,
        this.provider,
      );

      // Try different fee tiers
      const feeTiers = [500, 3000, 10000]; // 0.05%, 0.3%, 1%
      const pools = [];

      for (const fee of feeTiers) {
        try {
          const poolAddress = await factory.getPool(tokenA, tokenB, fee);
          if (poolAddress !== ethers.ZeroAddress) {
            // Get pool data
            const poolAbi = [
              'function liquidity() external view returns (uint128)',
              'function token0() external view returns (address)',
              'function token1() external view returns (address)',
            ];
            
            const pool = new ethers.Contract(poolAddress, poolAbi, this.provider);
            const liquidity = await pool.liquidity();
            const token0 = await pool.token0();
            const token1 = await pool.token1();

            pools.push({
              poolAddress,
              fee: fee / 10000,
              liquidity: liquidity.toString(),
              token0,
              token1,
            });
          }
        } catch (err) {
          // Pool doesn't exist for this fee tier, continue
          continue;
        }
      }

      if (pools.length === 0) {
        throw new HttpException(
          'No liquidity pools found for this token pair',
          HttpStatus.NOT_FOUND
        );
      }

      return {
        tokenA,
        tokenB,
        pools,
        recommendedPool: pools[0], // Pool with most liquidity typically comes first
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to get pool liquidity: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getSwapQuote(tokenIn: string, tokenOut: string, amountIn: string) {
    try {
      // Validate inputs
      if (!ethers.isAddress(tokenIn)) {
        throw new HttpException('Invalid tokenIn address', HttpStatus.BAD_REQUEST);
      }
      if (!ethers.isAddress(tokenOut)) {
        throw new HttpException('Invalid tokenOut address', HttpStatus.BAD_REQUEST);
      }
      if (BigInt(amountIn) <= 0) {
        throw new HttpException('Amount must be greater than 0', HttpStatus.BAD_REQUEST);
      }

      // Uniswap V3 fee tiers: 0.05% (500), 0.3% (3000), 1% (10000)
      const feeTier = 3000; // 0.3% - most common pool

      // Call Uniswap V3 Quoter for real price quote
      try {
        const amountOut = await this.uniswapQuoter.quoteExactInputSingle.staticCall(
          tokenIn,
          tokenOut,
          feeTier,
          amountIn,
          0 // sqrtPriceLimitX96 = 0 means no price limit
        );

        // Calculate price impact
        const amountInBigInt = BigInt(amountIn);
        const amountOutBigInt = BigInt(amountOut.toString());
        const expectedOut = amountInBigInt; // 1:1 ratio as baseline
        const priceImpact = expectedOut > amountOutBigInt
          ? ((expectedOut - amountOutBigInt) * BigInt(10000)) / expectedOut
          : BigInt(0);

        return {
          tokenIn,
          tokenOut,
          amountIn,
          amountOut: amountOut.toString(),
          priceImpact: (Number(priceImpact) / 100).toFixed(2),
          fee: '0.3',
          feeTier,
          route: [tokenIn, tokenOut],
        };
      } catch (quoteError) {
        // If quote fails, it might be because the pool doesn't exist
        // Try with different fee tier
        const fallbackFeeTier = 10000; // 1%
        try {
          const amountOut = await this.uniswapQuoter.quoteExactInputSingle.staticCall(
            tokenIn,
            tokenOut,
            fallbackFeeTier,
            amountIn,
            0
          );

          return {
            tokenIn,
            tokenOut,
            amountIn,
            amountOut: amountOut.toString(),
            priceImpact: '1.0',
            fee: '1.0',
            feeTier: fallbackFeeTier,
            route: [tokenIn, tokenOut],
          };
        } catch (fallbackError) {
          throw new HttpException(
            'No liquidity pool found for this token pair',
            HttpStatus.NOT_FOUND
          );
        }
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to get swap quote: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async createStake(userId: string, amount: string, txHash: string) {
    try {
      const stake = await this.prisma.stake.create({
        data: {
          userId,
          amount,
          startTime: new Date(),
          lastClaimTime: new Date(),
          active: true,
        },
      });

      return {
        success: true,
        stake,
      };
    } catch (error) {
      throw new HttpException('Failed to create stake', HttpStatus.BAD_REQUEST);
    }
  }

  async claimStakeRewards(stakeId: string) {
    try {
      const stake = await this.prisma.stake.findUnique({
        where: { id: stakeId },
      });

      if (!stake || !stake.active) {
        throw new HttpException('Stake not found or inactive', HttpStatus.NOT_FOUND);
      }

      // Calculate rewards (10% APY)
      const now = new Date();
      const timeStaked = now.getTime() - stake.lastClaimTime.getTime();
      const yearInMs = 365 * 24 * 60 * 60 * 1000;
      const reward = (BigInt(stake.amount) * BigInt(1000) * BigInt(timeStaked)) / 
                     (BigInt(10000) * BigInt(yearInMs));

      // Update stake
      await this.prisma.stake.update({
        where: { id: stakeId },
        data: {
          lastClaimTime: now,
          totalRewardsClaimed: (BigInt(stake.totalRewardsClaimed) + reward).toString(),
        },
      });

      return {
        success: true,
        reward: reward.toString(),
        message: 'Rewards claimed successfully',
      };
    } catch (error) {
      throw new HttpException('Failed to claim rewards', HttpStatus.BAD_REQUEST);
    }
  }

  async getUserStakes(userId: string) {
    const stakes = await this.prisma.stake.findMany({
      where: { userId, active: true },
      orderBy: { createdAt: 'desc' },
    });

    const totalStaked = stakes.reduce((sum, s) => sum + BigInt(s.amount), BigInt(0));
    
    // Calculate total pending rewards
    const now = new Date();
    const totalPendingRewards = stakes.reduce((sum, stake) => {
      const timeStaked = now.getTime() - stake.lastClaimTime.getTime();
      const yearInMs = 365 * 24 * 60 * 60 * 1000;
      const reward = (BigInt(stake.amount) * BigInt(1000) * BigInt(timeStaked)) / 
                     (BigInt(10000) * BigInt(yearInMs));
      return sum + reward;
    }, BigInt(0));

    return {
      stakes,
      totalStaked: totalStaked.toString(),
      totalPendingRewards: totalPendingRewards.toString(),
      activeStakes: stakes.length,
    };
  }

  async unstake(stakeId: string, amount: string) {
    try {
      const stake = await this.prisma.stake.findUnique({
        where: { id: stakeId },
      });

      if (!stake || !stake.active) {
        throw new HttpException('Stake not found or inactive', HttpStatus.NOT_FOUND);
      }

      if (BigInt(stake.amount) < BigInt(amount)) {
        throw new HttpException('Insufficient staked amount', HttpStatus.BAD_REQUEST);
      }

      // Check lock period (7 days minimum)
      const lockPeriod = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
      const timeLocked = Date.now() - stake.startTime.getTime();
      
      if (timeLocked < lockPeriod) {
        throw new HttpException(
          `Tokens are locked for ${Math.ceil((lockPeriod - timeLocked) / (24 * 60 * 60 * 1000))} more days`,
          HttpStatus.BAD_REQUEST
        );
      }

      // Calculate and claim pending rewards first
      const now = new Date();
      const timeStaked = now.getTime() - stake.lastClaimTime.getTime();
      const yearInMs = 365 * 24 * 60 * 60 * 1000;
      const reward = (BigInt(stake.amount) * BigInt(1000) * BigInt(timeStaked)) / 
                     (BigInt(10000) * BigInt(yearInMs));

      // Update stake
      const newAmount = BigInt(stake.amount) - BigInt(amount);
      
      if (newAmount === BigInt(0)) {
        // Full unstake - deactivate
        await this.prisma.stake.update({
          where: { id: stakeId },
          data: {
            amount: '0',
            active: false,
            lastClaimTime: now,
            totalRewardsClaimed: (BigInt(stake.totalRewardsClaimed) + reward).toString(),
          },
        });
      } else {
        // Partial unstake
        await this.prisma.stake.update({
          where: { id: stakeId },
          data: {
            amount: newAmount.toString(),
            lastClaimTime: now,
            totalRewardsClaimed: (BigInt(stake.totalRewardsClaimed) + reward).toString(),
          },
        });
      }

      return {
        success: true,
        unstakedAmount: amount,
        reward: reward.toString(),
        message: 'Unstaked successfully',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to unstake', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getStakeAnalytics(userId: string) {
    const stakes = await this.prisma.stake.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const activeStakes = stakes.filter(s => s.active);
    const totalStaked = activeStakes.reduce((sum, s) => sum + BigInt(s.amount), BigInt(0));
    const totalRewardsClaimed = stakes.reduce(
      (sum, s) => sum + BigInt(s.totalRewardsClaimed), 
      BigInt(0)
    );

    // Calculate pending rewards
    const now = new Date();
    const pendingRewards = activeStakes.reduce((sum, stake) => {
      const timeStaked = now.getTime() - stake.lastClaimTime.getTime();
      const yearInMs = 365 * 24 * 60 * 60 * 1000;
      const reward = (BigInt(stake.amount) * BigInt(1000) * BigInt(timeStaked)) / 
                     (BigInt(10000) * BigInt(yearInMs));
      return sum + reward;
    }, BigInt(0));

    // Calculate total earnings (claimed + pending)
    const totalEarnings = totalRewardsClaimed + pendingRewards;
    
    // Calculate ROI
    let roi = '0';
    if (totalStaked > BigInt(0)) {
      roi = ((totalEarnings * BigInt(10000)) / totalStaked).toString();
      roi = (Number(roi) / 100).toFixed(2);
    }

    return {
      totalStaked: totalStaked.toString(),
      totalRewardsClaimed: totalRewardsClaimed.toString(),
      pendingRewards: pendingRewards.toString(),
      totalEarnings: totalEarnings.toString(),
      roi: `${roi}%`,
      activeStakes: activeStakes.length,
      totalStakes: stakes.length,
      averageAPY: '10.00%',
    };
  }
}
