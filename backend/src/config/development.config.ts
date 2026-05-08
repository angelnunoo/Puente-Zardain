import { ConfigService } from '@nestjs/config';

export const getDevelopmentConfig = () => {
  return {
    database: {
      url: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/puente_zardain_dev',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      username: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'password',
      name: process.env.DATABASE_NAME || 'puente_zardain_dev',
    },
    
    jwt: {
      secret: process.env.JWT_SECRET || 'development_jwt_secret_key_minimum_32_characters',
      refreshSecret: process.env.JWT_REFRESH_SECRET || 'development_jwt_refresh_secret_key_minimum_32_characters',
      expiresIn: process.env.JWT_EXPIRES_IN || '1h',
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    },

    stripe: {
      secretKey: process.env.STRIPE_SECRET_KEY || 'sk_test_development_key',
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_development_webhook_secret',
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_development_key',
    },

    paypal: {
      clientId: process.env.PAYPAL_CLIENT_ID || 'development_client_id',
      clientSecret: process.env.PAYPAL_CLIENT_SECRET || 'development_client_secret',
      webhookId: process.env.PAYPAL_WEBHOOK_ID || 'development_webhook_id',
    },

    bizum: {
      merchantId: process.env.BIZUM_MERCHANT_ID || 'development_merchant_id',
      secretKey: process.env.BIZUM_SECRET_KEY || 'development_secret_key',
    },

    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || '',
    },

    app: {
      frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
      backendUrl: process.env.BACKEND_URL || 'http://localhost:3001',
      apiUrl: process.env.API_BASE_URL || 'http://localhost:3001',
      nodeEnv: process.env.NODE_ENV || 'development',
      port: parseInt(process.env.PORT || '3001'),
    },

    email: {
      host: process.env.EMAIL_HOST || 'smtp.mailtrap.io',
      port: parseInt(process.env.EMAIL_PORT || '2525'),
      user: process.env.EMAIL_USER || 'development_user',
      pass: process.env.EMAIL_PASS || 'development_pass',
      from: process.env.EMAIL_FROM || 'Puente de Zardain <dev@puente-zardain.es>',
    },

    monitoring: {
      logLevel: process.env.LOG_LEVEL || 'debug',
      sentryDsn: process.env.SENTRY_DSN || '',
    },

    aws: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'development_key',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'development_secret',
      region: process.env.AWS_REGION || 'eu-west-1',
      s3Bucket: process.env.AWS_S3_BUCKET || 'puente-zardain-dev-uploads',
    },

    security: {
      rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
      rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000'),
      corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    },

    backups: {
      schedule: process.env.BACKUP_SCHEDULE || '0 2 * * *', // Todos los días a las 2 AM
      retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '7'),
      encryptionKey: process.env.BACKUP_ENCRYPTION_KEY || 'development_backup_key',
    },

    analytics: {
      googleAnalyticsId: process.env.GOOGLE_ANALYTICS_ID || '',
      hotjarId: process.env.HOTJAR_ID || '',
    },

    restaurant: {
      name: process.env.RESTAURANT_NAME || 'Puente de Zardain (DEV)',
      email: process.env.RESTAURANT_EMAIL || 'dev@puente-zardain.es',
      phone: process.env.RESTAURANT_PHONE || '+34 900 123 456',
      address: process.env.RESTAURANT_ADDRESS || 'Calle Principal 123, 28001 Madrid, España',
    },

    operations: {
      maxOrdersPerHour: parseInt(process.env.MAX_ORDERS_PER_HOUR || '100'),
      maxOrderAmount: parseFloat(process.env.MAX_ORDER_AMOUNT || '1000'),
      minOrderAmount: parseFloat(process.env.MIN_ORDER_AMOUNT || '1'),
    },

    maintenance: {
      enabled: process.env.MAINTENANCE_MODE === 'true',
      message: process.env.MAINTENANCE_MESSAGE || 'El sistema está en mantenimiento. Volveremos pronto.',
    },
  };
};
