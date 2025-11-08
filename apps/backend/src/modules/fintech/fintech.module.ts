// ZeaZDev [Backend - FinTech Module] //
// Project: ZeaZDev FiGaTect Super-App //
// Version: 1.0.0 (Omega Scaffolding) //
// Author: ZeaZDev Meta-Intelligence (Generated) //
// --- DO NOT EDIT HEADER --- //

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
