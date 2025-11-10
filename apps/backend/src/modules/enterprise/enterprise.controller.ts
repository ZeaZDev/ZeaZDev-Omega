import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { EnterpriseService } from './enterprise.service';

@Controller('enterprise')
export class EnterpriseController {
  constructor(private readonly enterpriseService: EnterpriseService) {}

  @Post('whitelabel')
  async createWhiteLabel(
    @Body()
    body: {
      orgId: string;
      orgName: string;
      brandName: string;
      logo?: string;
      primaryColor?: string;
      secondaryColor?: string;
      domain?: string;
    },
  ) {
    return this.enterpriseService.createWhiteLabel(
      body.orgId,
      body.orgName,
      body.brandName,
      body.logo,
      body.primaryColor,
      body.secondaryColor,
      body.domain,
    );
  }

  @Get('whitelabel/:orgId')
  async getWhiteLabel(@Param('orgId') orgId: string) {
    return this.enterpriseService.getWhiteLabel(orgId);
  }

  @Put('whitelabel/:orgId')
  async updateWhiteLabel(
    @Param('orgId') orgId: string,
    @Body()
    data: {
      brandName?: string;
      logo?: string;
      primaryColor?: string;
      secondaryColor?: string;
      domain?: string;
      active?: boolean;
    },
  ) {
    return this.enterpriseService.updateWhiteLabel(orgId, data);
  }

  @Get('api-usage/:orgId')
  async getApiUsage(@Param('orgId') orgId: string, @Query('startDate') startDate: string, @Query('endDate') endDate: string) {
    return this.enterpriseService.getApiUsage(orgId, new Date(startDate), new Date(endDate));
  }

  @Post('developer/app')
  async createDeveloperApp(
    @Body() body: { developerId: string; appName: string; description?: string; webhookUrl?: string },
  ) {
    return this.enterpriseService.createDeveloperApp(body.developerId, body.appName, body.description, body.webhookUrl);
  }

  @Get('developer/:developerId/apps')
  async getDeveloperApps(@Param('developerId') developerId: string) {
    return this.enterpriseService.getDeveloperApps(developerId);
  }

  @Put('developer/app/:appId')
  async updateDeveloperApp(
    @Param('appId') appId: string,
    @Body() data: { appName?: string; description?: string; webhookUrl?: string; active?: boolean },
  ) {
    return this.enterpriseService.updateDeveloperApp(appId, data);
  }
}
