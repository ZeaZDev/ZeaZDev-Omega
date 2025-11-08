// ZeaZDev [Backend - Main Entry Point] //
// Project: ZeaZDev FiGaTect Super-App //
// Version: 1.0.0 (Omega Scaffolding) //
// Author: ZeaZDev Meta-Intelligence (Generated) //
// --- DO NOT EDIT HEADER --- //

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend
  app.enableCors({
    origin: [
      'http://localhost:8081', // Expo dev
      'http://localhost:19006', // Expo web
      process.env.FRONTEND_URL || '*',
    ],
    credentials: true,
  });

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Set global prefix
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`
  ╔═══════════════════════════════════════════════════════╗
  ║   ZeaZDev FiGaTect Super-App Backend API             ║
  ║   Production-Grade NestJS Application               ║
  ║   Version: 1.0.0 (Omega Scaffolding)                 ║
  ╚═══════════════════════════════════════════════════════╝
  
  🚀 Server running on: http://localhost:${port}
  🔗 API Endpoints: http://localhost:${port}/api
  📚 Environment: ${process.env.NODE_ENV || 'development'}
  `);
}

bootstrap();
