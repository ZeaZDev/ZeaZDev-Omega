import { Module } from '@nestjs/common';
import { BridgeController } from './bridge.controller';
import { BridgeService } from './bridge.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BridgeController],
  providers: [BridgeService],
  exports: [BridgeService],
})
export class BridgeModule {}
