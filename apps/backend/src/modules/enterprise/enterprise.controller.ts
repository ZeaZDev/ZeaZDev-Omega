/*
 * @Project: ZeaZDev FiGaTect Super-App
 * @Module: Backend-Enterprise
 * @File: enterprise.controller.ts
 * @Author: ZeaZDev Enterprises (OMEGA AI)
 * @Date: 2025-11-10
 * @Version: 2.0.0 (Phase 8: Enterprise Features)
 * @Description: Enhanced enterprise controller with white-label, API marketplace, SDK, and plugins
 * @License: ZeaZDev Proprietary License
 * @Copyright: (c) 2025-2026 ZeaZDev. All rights reserved.
 */

import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { EnterpriseService } from './enterprise.service';

@Controller('enterprise')
export class EnterpriseController {
  constructor(private readonly enterpriseService: EnterpriseService) {}

  /**
   * WHITE-LABEL ENDPOINTS
   */
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

  @Get('whitelabel/:orgId/features')
  async getWhiteLabelFeatures(@Param('orgId') orgId: string) {
    return this.enterpriseService.getWhiteLabelFeatures(orgId);
  }

  @Put('whitelabel/:orgId/features')
  async updateWhiteLabelFeatures(
    @Param('orgId') orgId: string,
    @Body() body: { features: string[] },
  ) {
    return this.enterpriseService.updateWhiteLabelFeatures(orgId, body.features);
  }

  /**
   * API USAGE & ANALYTICS ENDPOINTS
   */
  @Get('api-usage/:orgId')
  async getApiUsage(@Param('orgId') orgId: string, @Query('startDate') startDate: string, @Query('endDate') endDate: string) {
    return this.enterpriseService.getApiUsage(orgId, new Date(startDate), new Date(endDate));
  }

  @Get('rate-limits')
  async getRateLimits(@Query('apiKey') apiKey: string) {
    return this.enterpriseService.getRateLimits(apiKey);
  }

  /**
   * DEVELOPER APP ENDPOINTS
   */
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

  /**
   * PLUGIN ECOSYSTEM ENDPOINTS
   */
  @Get('plugins')
  async listPlugins(
    @Query('category') category?: string,
    @Query('featured') featured?: boolean,
  ) {
    return this.enterpriseService.listPlugins(category, featured);
  }

  @Post('plugins')
  async createPlugin(
    @Body() body: {
      developerId: string;
      name: string;
      version: string;
      description: string;
      category: string;
      price: number;
      sourceCode?: string;
      manifest?: any;
    },
  ) {
    return this.enterpriseService.createPlugin(
      body.developerId,
      body.name,
      body.version,
      body.description,
      body.category,
      body.price,
      body.sourceCode,
      body.manifest,
    );
  }

  @Post('plugins/install')
  async installPlugin(
    @Body() body: { orgId: string; pluginId: string },
  ) {
    return this.enterpriseService.installPlugin(body.orgId, body.pluginId);
  }

  @Get('plugins/installed/:orgId')
  async getInstalledPlugins(@Param('orgId') orgId: string) {
    return this.enterpriseService.getInstalledPlugins(orgId);
  }

  @Delete('plugins/uninstall')
  async uninstallPlugin(
    @Body() body: { orgId: string; pluginId: string },
  ) {
    return this.enterpriseService.uninstallPlugin(body.orgId, body.pluginId);
  }

  /**
   * SDK & DEVELOPER TOOLS ENDPOINTS
   */
  @Get('sdk/list')
  async getSDKList() {
    return this.enterpriseService.getSDKList();
  }

  @Get('sdk/example')
  async generateSDKExample(
    @Query('language') language: string,
    @Query('apiKey') apiKey: string,
  ) {
    return this.enterpriseService.generateSDKExample(language, apiKey);
  }

  /**
   * API MARKETPLACE ENDPOINTS
   */
  @Get('api/endpoints')
  async getAPIEndpoints() {
    return this.enterpriseService.getAPIEndpoints();
  }
}
