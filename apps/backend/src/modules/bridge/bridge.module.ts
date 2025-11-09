import { Module } from '@nestjs/common';
import { BridgeController } from './bridge.controller';
import { BridgeService } from './bridge.service';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [BridgeController],
  providers: [BridgeService, PrismaService],
  exports: [BridgeService],
})
export class BridgeModule {}
