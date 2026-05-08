import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger('AuditLogService');

  constructor(private readonly prisma: PrismaService) {}

  async createLog(auditData: {
    timestamp: string;
    method: string;
    url: string;
    userAgent: string;
    ip: string;
    userId?: string;
    statusCode: number;
    responseTime: number;
    requestBody?: any;
    responseData?: any;
    headers?: any;
    action: string;
    resource: string;
    success: boolean;
  }) {
    try {
      // Guardar en base de datos
      await this.prisma.auditLog.create({
        data: {
          timestamp: new Date(auditData.timestamp),
          method: auditData.method,
          url: auditData.url,
          userAgent: auditData.userAgent,
          ip: auditData.ip,
          userId: auditData.userId,
          statusCode: auditData.statusCode,
          responseTime: auditData.responseTime,
          requestBody: auditData.requestBody,
          responseData: auditData.responseData,
          headers: auditData.headers,
          action: auditData.action,
          resource: auditData.resource,
          success: auditData.success,
        }
      });

      // También guardar en archivo de logs para análisis externo
      this.logger.log(`AUDIT: ${JSON.stringify(auditData)}`);

      // Detectar actividades sospechosas
      await this.detectSuspiciousActivity(auditData);

    } catch (error) {
      this.logger.error('Error al crear log de auditoría:', error);
    }
  }

  async getAuditLogs(filters: {
    userId?: string;
    action?: string;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  } = {}) {
    const { page = 1, limit = 50, ...otherFilters } = filters;
    const skip = (page - 1) * limit;

    const where = {
      ...otherFilters,
      ...(filters.userId && { userId: filters.userId }),
      ...(filters.action && { action: filters.action }),
      ...(filters.resource && { resource: filters.resource }),
      ...(filters.startDate && { timestamp: { gte: filters.startDate } }),
      ...(filters.endDate && { timestamp: { lte: filters.endDate } }),
    };

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where })
    ]);

    return {
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getFailedLoginAttempts(minutes: number = 60) {
    const since = new Date(Date.now() - minutes * 60 * 1000);

    return this.prisma.auditLog.findMany({
      where: {
        action: 'LOGIN',
        success: false,
        timestamp: { gte: since }
      },
      orderBy: { timestamp: 'desc' },
      take: 100
    });
  }

  async getAdminActions(hours: number = 24) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    return this.prisma.auditLog.findMany({
      where: {
        timestamp: { gte: since },
        OR: [
          { action: { contains: 'CREATE_' } },
          { action: { contains: 'UPDATE_' } },
          { action: { contains: 'DELETE_' } },
          { resource: 'USER' },
          { resource: 'PRODUCT' },
          { resource: 'ORDER' },
          { resource: 'PAYMENT' }
        ]
      },
      orderBy: { timestamp: 'desc' },
      take: 200
    });
  }

  async getSecurityAlerts(hours: number = 24) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    return this.prisma.auditLog.findMany({
      where: {
        timestamp: { gte: since },
        OR: [
          { statusCode: { gte: 400 } },
          { action: { contains: 'LOGIN' } },
          { action: { contains: 'REGISTER' } },
          { action: { contains: 'PAYMENT' } }
        ]
      },
      orderBy: { timestamp: 'desc' },
      take: 100
    });
  }

  private async detectSuspiciousActivity(auditData: any) {
    const alerts = [];

    // Detectar múltiples intentos de login fallidos
    if (auditData.action === 'LOGIN' && !auditData.success) {
      const recentFailures = await this.getFailedLoginAttempts(15);
      const ipFailures = recentFailures.filter(log => log.ip === auditData.ip);
      
      if (ipFailures.length >= 5) {
        alerts.push({
          type: 'MULTIPLE_LOGIN_FAILURES',
          severity: 'HIGH',
          ip: auditData.ip,
          count: ipFailures.length,
          message: `Múltiples intentos de login fallidos desde IP ${auditData.ip}`
        });
      }
    }

    // Detectar acceso desde IPs sospechosas
    if (this.isSuspiciousIp(auditData.ip)) {
      alerts.push({
        type: 'SUSPICIOUS_IP',
        severity: 'MEDIUM',
        ip: auditData.ip,
        message: `Acceso desde IP sospechosa: ${auditData.ip}`
      });
    }

    // Detectar User-Agent sospechoso
    if (this.isSuspiciousUserAgent(auditData.userAgent)) {
      alerts.push({
        type: 'SUSPICIOUS_USER_AGENT',
        severity: 'MEDIUM',
        userAgent: auditData.userAgent,
        message: 'User-Agent sospechoso detectado'
      });
    }

    // Detectar acceso a recursos sensibles
    if (this.isSensitiveResource(auditData.resource, auditData.action)) {
      alerts.push({
        type: 'SENSITIVE_RESOURCE_ACCESS',
        severity: 'HIGH',
        resource: auditData.resource,
        action: auditData.action,
        userId: auditData.userId,
        message: `Acceso a recurso sensible: ${auditData.action} ${auditData.resource}`
      });
    }

    // Detectar patrones anómalos
    if (this.isAnomalousPattern(auditData)) {
      alerts.push({
        type: 'ANOMALOUS_PATTERN',
        severity: 'MEDIUM',
        pattern: this.extractPattern(auditData),
        message: 'Patrón anómalo detectado'
      });
    }

    // Si hay alertas, guardarlas y notificar
    if (alerts.length > 0) {
      await this.createSecurityAlerts(alerts);
    }
  }

  private isSuspiciousIp(ip: string): boolean {
    // Lista de IPs sospechosas (ejemplo: proxies, TOR, etc.)
    const suspiciousPatterns = [
      /^10\./, // Redes privadas (puede ser legítimo pero worth monitorear)
      /^192\.168\./, // Redes privadas
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // Redes privadas
      /^127\./, // localhost
      /^169\.254\./, // APIPA
      /^224\./, // Multicast
      /^240\./, // Reserved
    ];

    return suspiciousPatterns.some(pattern => pattern.test(ip));
  }

  private isSuspiciousUserAgent(userAgent: string): boolean {
    if (!userAgent) return true;

    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python/i,
      /java/i,
      /perl/i,
      /php/i,
      /sqlmap/i,
      /nmap/i,
      /metasploit/i,
    ];

    return suspiciousPatterns.some(pattern => pattern.test(userAgent));
  }

  private isSensitiveResource(resource: string, action: string): boolean {
    const sensitiveResources = ['USER', 'PAYMENT', 'ADMIN', 'SYSTEM'];
    const sensitiveActions = ['DELETE', 'UPDATE', 'CREATE'];

    return sensitiveResources.includes(resource) && 
           sensitiveActions.some(actionPattern => action.includes(actionPattern));
  }

  private isAnomalousPattern(auditData: any): boolean {
    // Detectar patrones como:
    // - Peticiones muy rápidas desde misma IP
    // - Acceso a recursos no secuenciales
    // - Horarios inusuales
    
    // Por ahora, implementación básica
    return auditData.responseTime > 10000; // Más de 10 segundos
  }

  private extractPattern(auditData: any): string {
    return `${auditData.action}:${auditData.resource}:${auditData.ip}`;
  }

  private async createSecurityAlerts(alerts: any[]) {
    for (const alert of alerts) {
      try {
        await this.prisma.securityAlert.create({
          data: {
            type: alert.type,
            severity: alert.severity,
            ip: alert.ip,
            userAgent: alert.userAgent,
            resource: alert.resource,
            userId: alert.userId,
            message: alert.message,
            data: alert,
            resolved: false,
            createdAt: new Date(),
          }
        });

        // Enviar notificación inmediata
        await this.sendSecurityAlert(alert);

      } catch (error) {
        this.logger.error('Error al crear alerta de seguridad:', error);
      }
    }
  }

  private async sendSecurityAlert(alert: any) {
    // Implementar envío de alertas por diferentes canales
    // Email, SMS, Slack, etc.
    
    this.logger.warn(`SECURITY ALERT: ${alert.type} - ${alert.message}`);
    
    // Aquí se integraría con sistemas externos de notificación
    // Por ahora, solo logueamos
  }

  async cleanupOldLogs(daysToKeep: number = 90) {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

    const deletedCount = await this.prisma.auditLog.deleteMany({
      where: {
        timestamp: { lt: cutoffDate }
      }
    });

    this.logger.log(`Limpiados ${deletedCount.count} logs de auditoría antiguos`);
    return deletedCount.count;
  }

  async getAuditSummary(hours: number = 24) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const [
      totalRequests,
      successfulRequests,
      failedRequests,
      topUsers,
      topResources,
      securityAlerts
    ] = await Promise.all([
      this.prisma.auditLog.count({
        where: { timestamp: { gte: since } }
      }),
      this.prisma.auditLog.count({
        where: { 
          timestamp: { gte: since },
          success: true
        }
      }),
      this.prisma.auditLog.count({
        where: { 
          timestamp: { gte: since },
          success: false
        }
      }),
      this.prisma.auditLog.groupBy({
        by: ['userId'],
        where: { 
          timestamp: { gte: since },
          userId: { not: null }
        },
        _count: { userId: true },
        orderBy: { _count: { userId: 'desc' } },
        take: 10
      }),
      this.prisma.auditLog.groupBy({
        by: ['resource'],
        where: { timestamp: { gte: since } },
        _count: { resource: true },
        orderBy: { _count: { resource: 'desc' } },
        take: 10
      }),
      this.prisma.securityAlert.count({
        where: { createdAt: { gte: since } }
      })
    ]);

    return {
      period: `${hours} horas`,
      totalRequests,
      successfulRequests,
      failedRequests,
      successRate: totalRequests > 0 ? (successfulRequests / totalRequests * 100).toFixed(2) : 0,
      topUsers: topUsers.map(item => ({
        userId: item.userId,
        requests: item._count.userId
      })),
      topResources: topResources.map(item => ({
        resource: item.resource,
        requests: item._count.resource
      })),
      securityAlerts
    };
  }
}
