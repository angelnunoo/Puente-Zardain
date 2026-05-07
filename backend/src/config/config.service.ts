/**
 * SERVICIO DE CONFIGURACIÓN
 * Gestiona variables de entorno y configuración por entorno
 */

import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ConfigService {
  private readonly logger = new Logger('ConfigService');

  // ==================== ENTORNO ====================

  get nodeEnv(): string {
    return process.env.NODE_ENV || 'development';
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  // ==================== SERVIDOR ====================

  get port(): number {
    return parseInt(process.env.PORT || '3001', 10);
  }

  get host(): string {
    return process.env.HOST || 'localhost';
  }

  get apiVersion(): string {
    return process.env.API_VERSION || 'v1';
  }

  get apiPrefix(): string {
    return `/api/${this.apiVersion}`;
  }

  // ==================== BASE DE DATOS ====================

  get databaseUrl(): string {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error('DATABASE_URL no está configurada');
    }
    return url;
  }

  // ==================== AUTENTICACIÓN ====================

  get jwtSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET no está configurada');
    }
    if (this.isProduction && secret === 'your-secret-key') {
      throw new Error('JWT_SECRET debe cambiar en producción');
    }
    return secret;
  }

  get jwtExpiration(): string {
    return process.env.JWT_EXPIRATION || '7d';
  }

  get refreshTokenExpiration(): string {
    return process.env.REFRESH_TOKEN_EXPIRATION || '30d';
  }

  // ==================== REDIS ====================

  get redisUrl(): string {
    return process.env.REDIS_URL || 'redis://localhost:6379';
  }

  // ==================== CORS ====================

  get corsOrigins(): string[] {
    const origins = process.env.CORS_ORIGINS || 'http://localhost:3000';
    return origins.split(',').map((o) => o.trim());
  }

  get frontendUrl(): string {
    return process.env.FRONTEND_URL || 'http://localhost:3000';
  }

  // ==================== STRIPE ====================

  get stripeSecretKey(): string {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key && this.isProduction) {
      throw new Error('STRIPE_SECRET_KEY no está configurada en producción');
    }
    return key || '';
  }

  get stripePublishableKey(): string {
    const key = process.env.STRIPE_PUBLISHABLE_KEY;
    if (!key && this.isProduction) {
      throw new Error('STRIPE_PUBLISHABLE_KEY no está configurada en producción');
    }
    return key || '';
  }

  get stripeWebhookSecret(): string {
    return process.env.STRIPE_WEBHOOK_SECRET || '';
  }

  // ==================== EMAIL ====================

  get emailProvider(): string {
    return process.env.EMAIL_PROVIDER || 'sendgrid';
  }

  get emailApiKey(): string {
    return process.env.EMAIL_API_KEY || '';
  }

  get emailFromAddress(): string {
    return process.env.EMAIL_FROM_ADDRESS || 'noreply@puente-zardain.es';
  }

  // ==================== RESTAURANTE ====================

  get restaurantName(): string {
    return process.env.RESTAURANT_NAME || 'Puente de Zardaín';
  }

  get restaurantLocation(): string {
    return process.env.RESTAURANT_LOCATION || 'Arroyomolinos, Madrid';
  }

  get restaurantPhone(): string {
    return process.env.RESTAURANT_PHONE || '';
  }

  // ==================== LOGGING ====================

  get logLevel(): string {
    return process.env.LOG_LEVEL || (this.isDevelopment ? 'debug' : 'info');
  }

  get logFormat(): string {
    return process.env.LOG_FORMAT || 'json';
  }

  // ==================== VALIDACIÓN ====================

  validate(): void {
    const requiredEnvVars = [
      'NODE_ENV',
      'DATABASE_URL',
      'JWT_SECRET',
      'FRONTEND_URL',
    ];

    if (this.isProduction) {
      requiredEnvVars.push('STRIPE_SECRET_KEY', 'STRIPE_PUBLISHABLE_KEY');
    }

    const missing = requiredEnvVars.filter((envVar) => !process.env[envVar]);

    if (missing.length > 0) {
      this.logger.error(`Variables de entorno faltantes: ${missing.join(', ')}`);
      throw new Error(`Variables de entorno faltantes: ${missing.join(', ')}`);
    }

    this.logger.log(
      `Configuración cargada correctamente [${this.nodeEnv.toUpperCase()}]`,
    );
  }
}
