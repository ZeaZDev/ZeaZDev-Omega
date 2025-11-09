/*
 * @Project: ZeaZDev FiGaTect Super-App
 * @Module: Backend-Core
 * @File: app.module.ts
 * @Author: ZeaZDev Enterprises (OMEGA AI)
 * @Date: 2025-11-09
 * @Version: 1.0.0
 * @Description: Root application module that imports all feature modules and database connections
 * @License: ZeaZDev Proprietary License
 * @Copyright: (c) 2025-2026 ZeaZDev. All rights reserved.
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { DefiModule } from './modules/defi/defi.module';
import { RewardsModule } from './modules/rewards/rewards.module';
import { FintechModule } from './modules/fintech/fintech.module';
import { GameModule } from './modules/game/game.module';
import { PrismaService } from './prisma.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    DefiModule,
    RewardsModule,
    FintechModule,
    GameModule,
  ],
  providers: [PrismaService],
})
export class AppModule {}
