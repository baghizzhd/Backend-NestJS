import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SeasonalModule } from './seasonal/seasonal.module';
import { DailyModule } from './daily/daily.module';
import { PrismaModule } from './prisma/prisma.module';
import { PrismaService } from './prisma/prisma.service';
import { OpenaiLlmModule } from './openai-llm/openai-llm.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [HttpModule, SeasonalModule, DailyModule, ConfigModule.forRoot(), OpenaiLlmModule, PrismaModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],

})
export class AppModule { }
