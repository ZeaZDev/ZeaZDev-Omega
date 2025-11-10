import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('metric')
  async trackMetric(@Body() body: { userId: string; metric: string; value: string; period: string; date: string }) {
    return this.analyticsService.trackMetric(
      body.userId,
      body.metric,
      body.value,
      body.period,
      new Date(body.date),
    );
  }

  @Get('metrics/:userId')
  async getUserMetrics(
    @Param('userId') userId: string,
    @Query('metric') metric: string,
    @Query('period') period: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.analyticsService.getUserMetrics(
      userId,
      metric,
      period,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('dashboard/:userId')
  async getDashboard(@Param('userId') userId: string) {
    return this.analyticsService.getDashboard(userId);
  }

  @Get('behavior/:userId')
  async analyzeUserBehavior(@Param('userId') userId: string) {
    return this.analyticsService.analyzeUserBehavior(userId);
  }

  @Get('recommendations/:userId')
  async generateRecommendations(@Param('userId') userId: string) {
    return this.analyticsService.generateRecommendations(userId);
  }

  @Post('prediction')
  async createPrediction(
    @Body() body: { userId: string; predictionType: string; prediction: string; confidence: number },
  ) {
    return this.analyticsService.createPrediction(
      body.userId,
      body.predictionType,
      body.prediction,
      body.confidence,
    );
  }

  @Get('predictions/:userId')
  async getUserPredictions(@Param('userId') userId: string, @Query('type') type?: string) {
    return this.analyticsService.getUserPredictions(userId, type);
  }

  @Get('fraud/:userId')
  async getFraudAlerts(@Param('userId') userId: string, @Query('resolved') resolved?: string) {
    const isResolved = resolved === 'true' ? true : resolved === 'false' ? false : undefined;
    return this.analyticsService.getFraudAlerts(userId, isResolved);
  }

  @Post('fraud/:alertId/resolve')
  async resolveFraudAlert(@Param('alertId') alertId: string) {
    return this.analyticsService.resolveFraudAlert(alertId);
  }
}
