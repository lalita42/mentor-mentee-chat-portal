import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { IoAdapter } from '@nestjs/platform-socket.io';
import * as express from 'express';
import * as path from 'path';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  app.useWebSocketAdapter(new IoAdapter(app));

  const port = Number(process.env.PORT || 5000);

  await app.listen(port);

  console.log(`Backend running at http://localhost:${port}`);
}

bootstrap();
