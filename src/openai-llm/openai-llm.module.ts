import { Module } from '@nestjs/common';
import { OpenaiLlmController } from './openai-llm.controller';
import { OpenaiLlmService } from './openai-llm.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { SeasonalModule } from 'src/seasonal/seasonal.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [ConfigModule, SeasonalModule, PrismaModule],
  controllers: [OpenaiLlmController], //controller
  providers: [
    OpenaiLlmService,
    {
      provide: OpenAI,
      useFactory: (configService: ConfigService) => {
        const apiKey = configService.get<string>('OPENAI_API_KEY');
        return new OpenAI({ apiKey });
      },
      inject: [ConfigService],
    },
  ],
  exports: [OpenaiLlmService],
})
export class OpenaiLlmModule {}
