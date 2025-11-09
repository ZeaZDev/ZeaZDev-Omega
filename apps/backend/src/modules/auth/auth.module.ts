/*
 * @Project: ZeaZDev FiGaTect Super-App
 * @Module: Backend-Auth
 * @File: auth.module.ts
 * @Author: ZeaZDev Enterprises (OMEGA AI)
 * @Date: 2025-11-09
 * @Version: 1.0.0
 * @Description: Authentication module providing World ID verification services
 * @License: ZeaZDev Proprietary License
 * @Copyright: (c) 2025-2026 ZeaZDev. All rights reserved.
 */

import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { WorldcoinService } from './worldcoin.service';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [AuthController],
  providers: [WorldcoinService, PrismaService],
  exports: [WorldcoinService],
})
export class AuthModule {}
