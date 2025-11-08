// ZeaZDev [Backend - DeFi Module] //
// Project: ZeaZDev FiGaTect Super-App //
// Version: 1.0.0 (Omega Scaffolding) //
// Author: ZeaZDev Meta-Intelligence (Generated) //
// --- DO NOT EDIT HEADER --- //

import { Module } from '@nestjs/common';
import { DefiController } from './defi.controller';
import { DefiService } from './defi.service';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [DefiController],
  providers: [DefiService, PrismaService],
})
export class DefiModule {}
