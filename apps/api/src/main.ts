

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { apiLimiter } from './modules/security/rateLimit.middleware';
import { audit } from './modules/security/audit.middleware';
import { AppDataSource } from './data-source';

async function bootstrap() {
  await AppDataSource.initialize();
  const app = await NestFactory.create(AppModule);
  const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
    : ['http://localhost:3000', 'http://localhost:3001'];
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  // Apply rate limiting globally
  app.use(apiLimiter);
  // Apply audit logging globally
  app.use(audit('API_REQUEST'));
  const port = process.env.PORT || 4000;
  await app.listen(port);
}
bootstrap();
