import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('app/mc');

  await app.listen(8065, '0.0.0.0');
}
bootstrap();
