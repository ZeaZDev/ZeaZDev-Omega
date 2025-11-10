import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async trackMetric(userId: string, metric: string, value: string, period: string, date: Date) {
    return this.prisma.userAnalytics.upsert({
      where: {
        userId_metric_period_date: {
          userId,
          metric,
          period,
          date,
        },
      },
      update: { value },
      create: {
        userId,
        metric,
        value,
        period,
        date,
      },
    });
  }

  async getUserMetrics(userId: string, metric: string, period: string, startDate: Date, endDate: Date) {
    return this.prisma.userAnalytics.findMany({
      where: {
        userId,
        metric,
        period,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });
  }

  async getDashboard(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const metrics = await this.prisma.userAnalytics.findMany({
      where: {
        userId,
        period: 'daily',
        date: today,
      },
    });

    return metrics.reduce((acc, metric) => {
      acc[metric.metric] = metric.value;
      return acc;
    }, {} as Record<string, string>);
  }

  async createPrediction(userId: string, predictionType: string, prediction: string, confidence: number) {
    return this.prisma.aiPrediction.create({
      data: {
        userId,
        predictionType,
        prediction,
        confidence,
      },
    });
  }

  async getUserPredictions(userId: string, predictionType?: string) {
    return this.prisma.aiPrediction.findMany({
      where: {
        userId,
        predictionType,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  }

  async updatePredictionAccuracy(predictionId: string, accuracy: number) {
    return this.prisma.aiPrediction.update({
      where: { id: predictionId },
      data: { accuracy },
    });
  }

  async createFraudAlert(userId: string, alertType: string, severity: string, description: string) {
    return this.prisma.fraudAlert.create({
      data: {
        userId,
        alertType,
        severity,
        description,
      },
    });
  }

  async getFraudAlerts(userId: string, resolved?: boolean) {
    return this.prisma.fraudAlert.findMany({
      where: {
        userId,
        resolved,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async resolveFraudAlert(alertId: string) {
    return this.prisma.fraudAlert.update({
      where: { id: alertId },
      data: {
        resolved: true,
        resolvedAt: new Date(),
      },
    });
  }

  async analyzeUserBehavior(userId: string) {
    const gameStats = await this.prisma.gameSession.count({
      where: { userId },
    });

    const stakeStats = await this.prisma.stake.count({
      where: { userId },
    });

    const bridgeStats = await this.prisma.bridgeTransaction.count({
      where: { userId },
    });

    return {
      gameSessions: gameStats,
      totalBets: '0',
      totalWins: '0',
      totalStaked: '0',
      rewardsClaimed: '0',
      bridgeTransactions: bridgeStats,
    };
  }

  async generateRecommendations(userId: string) {
    const behavior = await this.analyzeUserBehavior(userId);
    const recommendations: string[] = [];

    if (Number(behavior.totalStaked) < 1000) {
      recommendations.push('Consider staking more ZEA to earn 10% APY rewards');
    }

    if (behavior.gameSessions > 50) {
      recommendations.push('You\'re an active gamer! Check out our poker and roulette games');
    }

    if (behavior.bridgeTransactions === 0) {
      recommendations.push('Explore cross-chain features to access more liquidity');
    }

    return recommendations;
  }
}
