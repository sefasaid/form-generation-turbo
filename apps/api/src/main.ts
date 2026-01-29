/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env file from root directory (Prisma 7 reads it automatically, but NestJS needs it at runtime)
config({ path: resolve(__dirname, '../../../.env') });

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

async function bootstrap() {

  const app = await NestFactory.create(AppModule);
  await app.enableCors({
    origin: '*',
    credentials: true,
  });

  const port = process.env.API_PORT || 3001;
  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}`
  );
}

bootstrap();
