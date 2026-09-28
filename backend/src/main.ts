import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { IoAdapter } from '@nestjs/platform-socket.io';
import * as express from 'express';
import * as path from 'path';

import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  app.enableCors({
    origin: frontendUrl,
    credentials: true,
    methods: [
      'GET',
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
      'OPTIONS',
    ],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
    ],
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

  await app.listen(port, '0.0.0.0');

  console.log(`Backend running at ${port}`);
}

bootstrap();
