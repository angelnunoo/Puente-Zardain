import { Controller, Get, Post, Body, Headers, HttpCode, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService
  ) {}

  @Get()
  async healthCheck() {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: this.config.get('NODE_ENV'),
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: await this.checkDatabase(),
        redis: await this.checkRedis(),
        payments: await this.checkPayments(),
      },
      metrics: {
        memory: this.getMemoryUsage(),
        cpu: process.cpuUsage(),
      }
    };

    // Determinar estado general
    const allServicesHealthy = Object.values(health.services).every(service => service.status === 'ok');
    health.status = allServicesHealthy ? 'ok' : 'degraded';

    return health;
  }

  @Get('detailed')
  async detailedHealthCheck() {
    const health = await this.healthCheck();
    
    return {
      ...health,
      system: {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        pid: process.pid,
      },
      configuration: {
        databaseConnected: !!this.config.get('DATABASE_URL'),
        redisConnected: !!this.config.get('REDIS_HOST'),
        stripeConfigured: !!this.config.get('STRIPE_SECRET_KEY'),
        paypalConfigured: !!this.config.get('PAYPAL_CLIENT_ID'),
      },
      lastChecks: {
        database: await this.getLastDatabaseCheck(),
        redis: await this.getLastRedisCheck(),
        payments: await this.getLastPaymentCheck(),
      }
    };
  }

  @Get('metrics')
  async getMetrics() {
    return {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: this.getMemoryUsage(),
      cpu: process.cpuUsage(),
      eventLoop: this.getEventLoopLag(),
      activeConnections: await this.getActiveConnections(),
      recentErrors: await this.getRecentErrors(),
      performance: await this.getPerformanceMetrics(),
    };
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async webhook(@Body() payload: any, @Headers() headers: any) {
    // Endpoint para recibir webhooks de monitorización externa
    console.log('Health webhook received:', { payload, headers });
    
    // Procesar diferentes tipos de webhooks
    switch (payload.type) {
      case 'uptime':
        await this.handleUptimeWebhook(payload);
        break;
      case 'performance':
        await this.handlePerformanceWebhook(payload);
        break;
      case 'error':
        await this.handleErrorWebhook(payload);
        break;
      default:
        console.warn('Unknown webhook type:', payload.type);
    }

    return { received: true };
  }

  private async checkDatabase() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', responseTime: Date.now() };
    } catch (error) {
      return { status: 'error', error: error.message };
    }
  }

  private async checkRedis() {
    try {
      // Implementar check de Redis si está configurado
      return { status: 'ok', responseTime: Date.now() };
    } catch (error) {
      return { status: 'error', error: error.message };
    }
  }

  private async checkPayments() {
    try {
      const stripeConfigured = !!this.config.get('STRIPE_SECRET_KEY');
      const paypalConfigured = !!this.config.get('PAYPAL_CLIENT_ID');
      
      return {
        status: stripeConfigured && paypalConfigured ? 'ok' : 'degraded',
        stripe: stripeConfigured ? 'configured' : 'not_configured',
        paypal: paypalConfigured ? 'configured' : 'not_configured'
      };
    } catch (error) {
      return { status: 'error', error: error.message };
    }
  }

  private getMemoryUsage() {
    const usage = process.memoryUsage();
    return {
      rss: Math.round(usage.rss / 1024 / 1024) + ' MB',
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024) + ' MB',
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024) + ' MB',
      external: Math.round(usage.external / 1024 / 1024) + ' MB',
      percentage: Math.round((usage.heapUsed / usage.heapTotal) * 100) + '%'
    };
  }

  private getEventLoopLag() {
    const start = process.hrtime.bigint();
    setImmediate(() => {
      const lag = Number(process.hrtime.bigint() - start) / 1000000; // Convertir a ms
      return Math.round(lag * 100) / 100;
    });
    return 0; // Placeholder
  }

  private async getActiveConnections() {
    try {
      // Contar conexiones activas a la base de datos
      const result = await this.prisma.$queryRaw`
        SELECT count(*) as active_connections 
        FROM pg_stat_activity 
        WHERE state = 'active'
      `;
      return result[0]?.active_connections || 0;
    } catch (error) {
      return 0;
    }
  }

  private async getRecentErrors() {
    try {
      // Obtener errores recientes de logs
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      const errorCount = await this.prisma.eventLog.count({
        where: {
          type: 'ERROR',
          createdAt: { gte: oneHourAgo }
        }
      });

      return {
        lastHour: errorCount,
        last24Hours: await this.prisma.eventLog.count({
          where: {
            type: 'ERROR',
            createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
          }
        })
      };
    } catch (error) {
      return { lastHour: 0, last24Hours: 0 };
    }
  }

  private async getPerformanceMetrics() {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // Métricas de rendimiento
      const ordersLastHour = await this.prisma.order.count({
        where: { createdAt: { gte: oneHourAgo } }
      });

      const avgResponseTime = await this.prisma.eventLog.aggregate({
        where: {
          type: 'API_RESPONSE_TIME',
          createdAt: { gte: oneHourAgo }
        },
        _avg: {
          data: true
        }
      });

      return {
        ordersPerHour: ordersLastHour,
        avgResponseTime: avgResponseTime._avg.data || 0,
        requestsPerMinute: Math.round(ordersLastHour / 60),
      };
    } catch (error) {
      return {
        ordersPerHour: 0,
        avgResponseTime: 0,
        requestsPerMinute: 0,
      };
    }
  }

  private async getLastDatabaseCheck() {
    try {
      const lastCheck = await this.prisma.eventLog.findFirst({
        where: { type: 'DATABASE_HEALTH_CHECK' },
        orderBy: { createdAt: 'desc' }
      });
      return lastCheck?.createdAt || null;
    } catch (error) {
      return null;
    }
  }

  private async getLastRedisCheck() {
    try {
      const lastCheck = await this.prisma.eventLog.findFirst({
        where: { type: 'REDIS_HEALTH_CHECK' },
        orderBy: { createdAt: 'desc' }
      });
      return lastCheck?.createdAt || null;
    } catch (error) {
      return null;
    }
  }

  private async getLastPaymentCheck() {
    try {
      const lastCheck = await this.prisma.eventLog.findFirst({
        where: { type: 'PAYMENT_HEALTH_CHECK' },
        orderBy: { createdAt: 'desc' }
      });
      return lastCheck?.createdAt || null;
    } catch (error) {
      return null;
    }
  }

  private async handleUptimeWebhook(payload: any) {
    // Registrar webhook de uptime
    await this.prisma.eventLog.create({
      data: {
        type: 'UPTIME_WEBHOOK',
        data: payload,
        createdAt: new Date(),
      }
    });
  }

  private async handlePerformanceWebhook(payload: any) {
    // Registrar webhook de rendimiento
    await this.prisma.eventLog.create({
      data: {
        type: 'PERFORMANCE_WEBHOOK',
        data: payload,
        createdAt: new Date(),
      }
    });
  }

  private async handleErrorWebhook(payload: any) {
    // Registrar webhook de error crítico
    await this.prisma.eventLog.create({
      data: {
        type: 'CRITICAL_ERROR_WEBHOOK',
        data: payload,
        createdAt: new Date(),
      }
    });

    // Enviar alerta inmediata
    await this.sendCriticalAlert(payload);
  }

  private async sendCriticalAlert(payload: any) {
    // Implementar lógica de envío de alertas críticas
    console.error('CRITICAL ALERT:', payload);
    
    // Aquí se integraría con:
    // - Email
    // - SMS
    // - Slack/Discord
    // - PagerDuty
  }
}
