/*
 * @Project: ZeaZDev FiGaTect Super-App
 * @Module: Backend-DeFi
 * @File: defi.module.ts
 * @Author: ZeaZDev Enterprises (OMEGA AI)
 * @Date: 2025-11-09
 * @Version: 1.0.0
 * @Description: DeFi module providing decentralized finance services
 * @License: ZeaZDev Proprietary License
 * @Copyright: (c) 2025-2026 ZeaZDev. All rights reserved.
 */

import { Module } from '@nestjs/common';
import { DefiController } from './defi.controller';
import { DefiService } from './defi.service';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [DefiController],
  providers: [DefiService, PrismaService],
})
export class DefiModule {}
