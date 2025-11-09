import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ethers } from 'ethers';

export interface BridgeTransaction {
  id: string;
  userId: string;
  token: string;
  amount: string;
  sourceChain: number;
  targetChain: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  transactionHash: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface BridgeQuote {
  amount: string;
  fee: string;
  amountAfterFee: string;
  estimatedTime: number; // in seconds
  targetChain: number;
}

@Injectable()
export class BridgeService {
  private readonly BRIDGE_FEE_BPS = 10; // 0.1%
  private readonly FEE_DENOMINATOR = 10000;

  // Supported chains
  private readonly SUPPORTED_CHAINS = {
    OPTIMISM: 10,
    POLYGON: 137,
    ARBITRUM: 42161,
    BASE: 8453,
  };

  // Estimated bridge times (seconds)
  private readonly BRIDGE_TIMES = {
    [this.SUPPORTED_CHAINS.OPTIMISM]: 60,
    [this.SUPPORTED_CHAINS.POLYGON]: 180,
    [this.SUPPORTED_CHAINS.ARBITRUM]: 60,
    [this.SUPPORTED_CHAINS.BASE]: 60,
  };

  constructor(private prisma: PrismaService) {}

  /**
   * Get bridge quote
   */
  async getQuote(
    amount: string,
    targetChain: number,
  ): Promise<BridgeQuote> {
    if (!this.isSupportedChain(targetChain)) {
      throw new Error('Unsupported target chain');
    }

    const amountBN = ethers.parseEther(amount);
    const fee = (amountBN * BigInt(this.BRIDGE_FEE_BPS)) / BigInt(this.FEE_DENOMINATOR);
    const amountAfterFee = amountBN - fee;

    return {
      amount: ethers.formatEther(amountBN),
      fee: ethers.formatEther(fee),
      amountAfterFee: ethers.formatEther(amountAfterFee),
      estimatedTime: this.BRIDGE_TIMES[targetChain] || 120,
      targetChain,
    };
  }

  /**
   * Initiate bridge transaction
   */
  async initiateBridge(
    userId: string,
    token: string,
    amount: string,
    sourceChain: number,
    targetChain: number,
    transactionHash: string,
  ): Promise<BridgeTransaction> {
    if (!this.isSupportedChain(sourceChain) || !this.isSupportedChain(targetChain)) {
      throw new Error('Unsupported chain');
    }

    if (sourceChain === targetChain) {
      throw new Error('Source and target chains must be different');
    }

    // Create bridge transaction record
    const bridgeTx = await this.prisma.bridgeTransaction.create({
      data: {
        userId,
        token,
        amount,
        sourceChain,
        targetChain,
        status: 'PENDING',
        transactionHash,
      },
    });

    return this.mapToBridgeTransaction(bridgeTx);
  }

  /**
   * Complete bridge transaction
   */
  async completeBridge(
    transactionHash: string,
    completionTxHash: string,
  ): Promise<BridgeTransaction> {
    const bridgeTx = await this.prisma.bridgeTransaction.findUnique({
      where: { transactionHash },
    });

    if (!bridgeTx) {
      throw new Error('Bridge transaction not found');
    }

    if (bridgeTx.status !== 'PENDING') {
      throw new Error('Transaction already processed');
    }

    const updated = await this.prisma.bridgeTransaction.update({
      where: { transactionHash },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        completionTxHash,
      },
    });

    return this.mapToBridgeTransaction(updated);
  }

  /**
   * Get user's bridge transactions
   */
  async getUserBridgeTransactions(userId: string): Promise<BridgeTransaction[]> {
    const transactions = await this.prisma.bridgeTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return transactions.map(this.mapToBridgeTransaction);
  }

  /**
   * Get bridge transaction by hash
   */
  async getBridgeTransaction(transactionHash: string): Promise<BridgeTransaction | null> {
    const tx = await this.prisma.bridgeTransaction.findUnique({
      where: { transactionHash },
    });

    return tx ? this.mapToBridgeTransaction(tx) : null;
  }

  /**
   * Get supported chains
   */
  getSupportedChains() {
    return Object.entries(this.SUPPORTED_CHAINS).map(([name, chainId]) => ({
      name,
      chainId,
      estimatedBridgeTime: this.BRIDGE_TIMES[chainId] || 120,
    }));
  }

  /**
   * Check if chain is supported
   */
  private isSupportedChain(chainId: number): boolean {
    return Object.values(this.SUPPORTED_CHAINS).includes(chainId);
  }

  /**
   * Map database record to BridgeTransaction
   */
  private mapToBridgeTransaction(tx: any): BridgeTransaction {
    return {
      id: tx.id,
      userId: tx.userId,
      token: tx.token,
      amount: tx.amount,
      sourceChain: tx.sourceChain,
      targetChain: tx.targetChain,
      status: tx.status,
      transactionHash: tx.transactionHash,
      createdAt: tx.createdAt,
      completedAt: tx.completedAt,
    };
  }
}
