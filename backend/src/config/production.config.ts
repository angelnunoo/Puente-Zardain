import { ConfigService } from '@nestjs/config';

export const getProductionConfig = () => {
  return {
    database: {
      url: process.env.DATABASE_URL,
      host: process.env.DATABASE_HOST,
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      name: process.env.DATABASE_NAME,
    },
    
    jwt: {
      secret: process.env.JWT_SECRET,
      refreshSecret: process.env.JWT_REFRESH_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN || '1h',
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    },

    stripe: {
      secretKey: process.env.STRIPE_SECRET_KEY,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    },

    paypal: {
      clientId: process.env.PAYPAL_CLIENT_ID,
      clientSecret: process.env.PAYPAL_CLIENT_SECRET,
      webhookId: process.env.PAYPAL_WEBHOOK_ID,
    },

    bizum: {
      merchantId: process.env.BIZUM_MERCHANT_ID,
      secretKey: process.env.BIZUM_SECRET_KEY,
    },

    redis: {
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
    },

    app: {
      frontendUrl: process.env.FRONTEND_URL,
      backendUrl: process.env.BACKEND_URL,
      apiUrl: process.env.API_BASE_URL,
      nodeEnv: process.env.NODE_ENV || 'production',
      port: parseInt(process.env.PORT || '3001'),
    },

    email: {
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
      from: process.env.EMAIL_FROM,
    },

    monitoring: {
      logLevel: process.env.LOG_LEVEL || 'info',
      sentryDsn: process.env.SENTRY_DSN,
    },

    aws: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'eu-west-1',
      s3Bucket: process.env.AWS_S3_BUCKET,
    },

    security: {
      rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
      rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
      corsOrigin: process.env.CORS_ORIGIN,
    },

    backups: {
      schedule: process.env.BACKUP_SCHEDULE || '0 2 * * *',
      retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30'),
      encryptionKey: process.env.BACKUP_ENCRYPTION_KEY,
    },

    analytics: {
      googleAnalyticsId: process.env.GOOGLE_ANALYTICS_ID,
      hotjarId: process.env.HOTJAR_ID,
    },

    restaurant: {
      name: process.env.RESTAURANT_NAME || 'Puente de Zardain',
      email: process.env.RESTAURANT_EMAIL || 'contacto@puente-zardain.es',
      phone: process.env.RESTAURANT_PHONE || '+34 900 123 456',
      address: process.env.RESTAURANT_ADDRESS || 'Calle Principal 123, 28001 Madrid, España',
    },

    operations: {
      maxOrdersPerHour: parseInt(process.env.MAX_ORDERS_PER_HOUR || '50'),
      maxOrderAmount: parseFloat(process.env.MAX_ORDER_AMOUNT || '500'),
      minOrderAmount: parseFloat(process.env.MIN_ORDER_AMOUNT || '5'),
    },

    maintenance: {
      enabled: process.env.MAINTENANCE_MODE === 'true',
      message: process.env.MAINTENANCE_MESSAGE || 'El sistema está en mantenimiento. Volveremos pronto.',
    },
  };
};
