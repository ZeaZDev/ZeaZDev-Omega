import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { randomBytes } from 'crypto';

@Injectable()
export class EnterpriseService {
  constructor(private prisma: PrismaService) {}

  async createWhiteLabel(
    orgId: string,
    orgName: string,
    brandName: string,
    logo?: string,
    primaryColor?: string,
    secondaryColor?: string,
    domain?: string,
  ) {
    const apiKey = this.generateApiKey();

    return this.prisma.whiteLabelConfig.create({
      data: {
        orgId,
        orgName,
        brandName,
        logo,
        primaryColor: primaryColor || '#4F46E5',
        secondaryColor: secondaryColor || '#06B6D4',
        domain,
        apiKey,
      },
    });
  }

  async getWhiteLabel(orgId: string) {
    return this.prisma.whiteLabelConfig.findUnique({
      where: { orgId },
    });
  }

  async updateWhiteLabel(
    orgId: string,
    data: {
      brandName?: string;
      logo?: string;
      primaryColor?: string;
      secondaryColor?: string;
      domain?: string;
      active?: boolean;
    },
  ) {
    return this.prisma.whiteLabelConfig.update({
      where: { orgId },
      data,
    });
  }

  async trackApiUsage(orgId: string, endpoint: string, method: string, success: boolean) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const usage = await this.prisma.apiUsage.findFirst({
      where: {
        orgId,
        endpoint,
        method,
        date: today,
      },
    });

    if (usage) {
      return this.prisma.apiUsage.update({
        where: { id: usage.id },
        data: {
          requestCount: { increment: 1 },
          successCount: success ? { increment: 1 } : undefined,
          errorCount: !success ? { increment: 1 } : undefined,
        },
      });
    } else {
      return this.prisma.apiUsage.create({
        data: {
          orgId,
          endpoint,
          method,
          requestCount: 1,
          successCount: success ? 1 : 0,
          errorCount: success ? 0 : 1,
          date: today,
        },
      });
    }
  }

  async getApiUsage(orgId: string, startDate: Date, endDate: Date) {
    return this.prisma.apiUsage.findMany({
      where: {
        orgId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'desc' },
    });
  }

  async createDeveloperApp(developerId: string, appName: string, description?: string, webhookUrl?: string) {
    const apiKey = this.generateApiKey();
    const apiSecret = this.generateApiSecret();

    return this.prisma.developerApp.create({
      data: {
        developerId,
        appName,
        description,
        apiKey,
        apiSecret,
        webhookUrl,
      },
    });
  }

  async getDeveloperApps(developerId: string) {
    return this.prisma.developerApp.findMany({
      where: { developerId },
      select: {
        id: true,
        appName: true,
        description: true,
        apiKey: true,
        webhookUrl: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async getDeveloperApp(apiKey: string) {
    return this.prisma.developerApp.findUnique({
      where: { apiKey },
    });
  }

  async updateDeveloperApp(appId: string, data: { appName?: string; description?: string; webhookUrl?: string; active?: boolean }) {
    return this.prisma.developerApp.update({
      where: { id: appId },
      data,
    });
  }

  async verifyApiKey(apiKey: string): Promise<boolean> {
    const app = await this.prisma.developerApp.findUnique({
      where: { apiKey },
    });

    return app !== null && app.active;
  }

  private generateApiKey(): string {
    return 'zea_' + randomBytes(24).toString('hex');
  }

  private generateApiSecret(): string {
    return 'secret_' + randomBytes(32).toString('hex');
  }
}
