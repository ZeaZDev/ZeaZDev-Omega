/*
 * @Project: ZeaZDev FiGaTect Super-App
 * @Module: Backend-Governance
 * @File: governance.module.ts
 * @Author: ZeaZDev Enterprises (OMEGA AI)
 * @Date: 2025-11-09
 * @Version: 1.0.0
 * @Description: Governance module configuration
 * @License: ZeaZDev Proprietary License
 * @Copyright: (c) 2025-2026 ZeaZDev. All rights reserved.
 */

import { Module } from '@nestjs/common';
import { GovernanceController } from './governance.controller';
import { GovernanceService } from './governance.service';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [GovernanceController],
  providers: [GovernanceService, PrismaService],
  exports: [GovernanceService],
})
export class GovernanceModule {}
