// ZeaZDev [Backend - Auth Module] //
// Project: ZeaZDev FiGaTect Super-App //
// Version: 1.0.0 (Omega Scaffolding) //
// Author: ZeaZDev Meta-Intelligence (Generated) //
// --- DO NOT EDIT HEADER --- //

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
