import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AuditLogService } from '../services/audit-log.service';

@Injectable()
export class AuditGuard implements NestMiddleware {
  constructor(private readonly auditLogService: AuditLogService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // Capturar información de la petición original
    const originalSend = res.send;
    
    // Sobreescribir método send para capturar respuesta
    res.send = function(data) {
      req.responseData = data;
      return originalSend.call(this, data);
    };

    // Continuar con el flujo normal
    res.on('finish', async () => {
      await this.logRequest(req, res);
    });

    next();
  }

  private async logRequest(req: Request, res: Response) {
    try {
      // Solo auditar endpoints sensibles
      if (!this.shouldAudit(req)) {
        return;
      }

      const auditData = {
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.url,
        userAgent: req.headers['user-agent'],
        ip: this.getClientIp(req),
        userId: this.getUserId(req),
        statusCode: res.statusCode,
        responseTime: this.getResponseTime(req),
        requestBody: this.sanitizeRequestBody(req.body),
        responseData: this.sanitizeResponseData(req.responseData),
        headers: this.sanitizeHeaders(req.headers),
        action: this.extractAction(req),
        resource: this.extractResource(req),
        success: res.statusCode < 400,
      };

      await this.auditLogService.createLog(auditData);
    } catch (error) {
      console.error('Error en auditoría:', error);
    }
  }

  private shouldAudit(req: Request): boolean {
    // Lista de endpoints que requieren auditoría
    const auditableEndpoints = [
      '/auth/login',
      '/auth/register',
      '/auth/logout',
      '/users',
      '/products',
      '/orders',
      '/payments',
      '/admin',
      '/incidents',
      '/analytics',
    ];

    // Verificar si la ruta coincide con endpoints auditable
    return auditableEndpoints.some(endpoint => req.url.includes(endpoint));
  }

  private getClientIp(req: Request): string {
    const forwardedFor = req.headers['x-forwarded-for'];
    const realIp = req.headers['x-real-ip'];
    const clientIp = req.connection?.remoteAddress || req.socket?.remoteAddress;

    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim();
    }

    if (realIp) {
      return realIp;
    }

    return clientIp || 'unknown';
  }

  private getUserId(req: Request): string | null {
    // Intentar obtener ID de usuario del token JWT
    try {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        // Aquí se decodificaría el token para obtener el userId
        // Por ahora, retornamos null
        return null;
      }
    } catch (error) {
      return null;
    }

    return null;
  }

  private getResponseTime(req: Request): number {
    const startTime = req.startTime || Date.now();
    return Date.now() - startTime;
  }

  private sanitizeRequestBody(body: any): any {
    if (!body) return null;

    // Eliminar información sensible del request body
    const sanitized = { ...body };
    
    // Campos sensibles que no deben guardarse
    const sensitiveFields = [
      'password',
      'currentPassword',
      'newPassword',
      'confirmPassword',
      'cardNumber',
      'cvv',
      'expiry',
      'stripeToken',
      'paypalToken',
      'secret',
      'apiKey',
    ];

    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  private sanitizeResponseData(data: any): any {
    if (!data) return null;

    // Eliminar información sensible de la respuesta
    const sanitized = JSON.parse(JSON.stringify(data));
    
    // Campos sensibles en respuestas
    const sensitiveFields = [
      'token',
      'refreshToken',
      'password',
      'secret',
      'apiKey',
      'stripeToken',
      'paypalToken',
    ];

    const removeSensitiveFields = (obj: any): any => {
      if (typeof obj !== 'object' || obj === null) {
        return obj;
      }

      if (Array.isArray(obj)) {
        return obj.map(removeSensitiveFields);
      }

      const sanitized = { ...obj };
      sensitiveFields.forEach(field => {
        if (sanitized[field]) {
          sanitized[field] = '[REDACTED]';
        }
      });

      return sanitized;
    };

    return removeSensitiveFields(sanitized);
  }

  private sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };
    
    // Eliminar headers sensibles
    const sensitiveHeaders = [
      'authorization',
      'cookie',
      'x-api-key',
      'x-secret',
    ];

    sensitiveHeaders.forEach(header => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  private extractAction(req: Request): string {
    const method = req.method;
    const path = req.url;

    // Mapear métodos y rutas a acciones significativas
    if (path.includes('/auth/login')) return 'LOGIN';
    if (path.includes('/auth/logout')) return 'LOGOUT';
    if (path.includes('/auth/register')) return 'REGISTER';
    
    if (path.includes('/orders')) {
      if (method === 'POST') return 'CREATE_ORDER';
      if (method === 'PUT') return 'UPDATE_ORDER';
      if (method === 'DELETE') return 'DELETE_ORDER';
      return 'VIEW_ORDERS';
    }
    
    if (path.includes('/products')) {
      if (method === 'POST') return 'CREATE_PRODUCT';
      if (method === 'PUT') return 'UPDATE_PRODUCT';
      if (method === 'DELETE') return 'DELETE_PRODUCT';
      return 'VIEW_PRODUCTS';
    }
    
    if (path.includes('/payments')) {
      if (method === 'POST') return 'PROCESS_PAYMENT';
      if (method === 'PUT') return 'UPDATE_PAYMENT';
      return 'VIEW_PAYMENTS';
    }
    
    if (path.includes('/users')) {
      if (method === 'POST') return 'CREATE_USER';
      if (method === 'PUT') return 'UPDATE_USER';
      if (method === 'DELETE') return 'DELETE_USER';
      return 'VIEW_USERS';
    }
    
    if (path.includes('/incidents')) {
      if (method === 'POST') return 'CREATE_INCIDENT';
      if (method === 'PUT') return 'UPDATE_INCIDENT';
      return 'VIEW_INCIDENTS';
    }
    
    return `${method}_${path}`;
  }

  private extractResource(req: Request): string {
    const path = req.url;
    
    // Extraer tipo de recurso
    if (path.includes('/orders/')) return 'ORDER';
    if (path.includes('/products/')) return 'PRODUCT';
    if (path.includes('/users/')) return 'USER';
    if (path.includes('/payments/')) return 'PAYMENT';
    if (path.includes('/incidents/')) return 'INCIDENT';
    if (path.includes('/analytics/')) return 'ANALYTICS';
    
    // Extraer ID del recurso si existe
    const idMatch = path.match(/\/(\w+)\/([a-f0-9-]{36})/);
    if (idMatch) {
      return `${idMatch[1].toUpperCase()}:${idMatch[2]}`;
    }
    
    return 'UNKNOWN';
  }
}
