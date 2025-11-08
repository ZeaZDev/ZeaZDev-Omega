// ZeaZDev [Backend - App Module] //
// Project: ZeaZDev FiGaTect Super-App //
// Version: 1.0.0 (Omega Scaffolding) //
// Author: ZeaZDev Meta-Intelligence (Generated) //
// --- DO NOT EDIT HEADER --- //

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
