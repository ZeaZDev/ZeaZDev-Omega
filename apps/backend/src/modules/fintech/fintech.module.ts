/*
 * @Project: ZeaZDev FiGaTect Super-App
 * @Module: Backend-FinTech
 * @File: fintech.module.ts
 * @Author: ZeaZDev Enterprises (OMEGA AI)
 * @Date: 2025-11-09
 * @Version: 1.0.0
 * @Description: FinTech module bridging crypto and traditional finance
 * @License: ZeaZDev Proprietary License
 * @Copyright: (c) 2025-2026 ZeaZDev. All rights reserved.
 */

import { Module } from '@nestjs/common';
import { FintechController } from './fintech.controller';
import { BankThaiService } from './bank.thai.service';
import { CardService } from './card.service';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [FintechController],
  providers: [BankThaiService, CardService, PrismaService],
})
export class FintechModule {}
