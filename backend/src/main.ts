/**
 * PUNTO DE ENTRADA DE LA APLICACIÓN
 * Inicializa NestJS con configuración global
 */

import { NestFactory } from '@nestjs/core';
import * as express from 'express';
import { AppModule } from './app.module';
import { AppLogger } from './common/logger/app-logger.service';
import { ConfigService } from './config/config.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new AppLogger(),
  });

  // Obtener configuración
  const configService = app.get(ConfigService);
  configService.validate();

  // CORS
  app.enableCors({
    origin: configService.corsOrigins,
    credentials: true,
    optionsSuccessStatus: 200,
  });

  // Prefijo API
  app.setGlobalPrefix(configService.apiPrefix);

  // Middleware para webhooks de Stripe (debe ser antes de JSON parsing)
  app.use('/payments/webhook', express.raw({ type: 'application/json' }));

  // Body parser con límite aumentado para uploads
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // Health check
  app.getHttpAdapter().get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date(),
      uptime: process.uptime(),
      environment: configService.nodeEnv,
    });
  });

  const port = configService.port;
  const host = configService.host;

  await app.listen(port, host);

  const logger = new AppLogger();
  logger.log(`🚀 Servidor iniciado en http://${host}:${port}${configService.apiPrefix}`);
  logger.log(`📝 Entorno: ${configService.nodeEnv.toUpperCase()}`);
}
bootstrap();
