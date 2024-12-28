import { Module } from '@nestjs/common';
import { SeasonalService } from './seasonal.service';
import { SeasonalController } from './seasonal.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [SeasonalController],
  providers: [SeasonalService, PrismaService],
  exports: [SeasonalService],
})
export class SeasonalModule {}
