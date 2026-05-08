import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RateLimitGuard implements NestMiddleware {
  private readonly requests = new Map<string, { count: number; resetTime: number }>();

  constructor(private readonly config: ConfigService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const clientIp = this.getClientIp(req);
    const windowMs = parseInt(this.config.get('RATE_LIMIT_WINDOW_MS') || '900000'); // 15 minutos
    const maxRequests = parseInt(this.config.get('RATE_LIMIT_MAX_REQUESTS') || '100');

    const now = Date.now();
    const key = `${clientIp}:${req.path}`;

    // Limpiar registros expirados
    this.cleanupExpiredRecords(now);

    // Obtener o crear registro para este IP y ruta
    let record = this.requests.get(key);
    
    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs
      };
    } else {
      record.count++;
    }

    this.requests.set(key, record);

    // Setear headers de rate limiting
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - record.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

    // Verificar si excede el límite
    if (record.count > maxRequests) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      
      res.setHeader('Retry-After', retryAfter);
      
      throw new HttpException({
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
        retryAfter,
        limit: maxRequests,
        windowMs
      }, HttpStatus.TOO_MANY_REQUESTS);
    }

    next();
  }

  private getClientIp(req: Request): string {
    // Intentar obtener IP real detrás de proxies
    const forwardedFor = req.headers['x-forwarded-for'];
    const realIp = req.headers['x-real-ip'];
    const clientIp = req.connection?.remoteAddress || req.socket?.remoteAddress;

    if (forwardedFor) {
      // X-Forwarded-For puede contener múltiples IPs: client, proxy1, proxy2
      return forwardedFor.split(',')[0].trim();
    }

    if (realIp) {
      return realIp;
    }

    if (clientIp) {
      return clientIp;
    }

    return 'unknown';
  }

  private cleanupExpiredRecords(now: number): void {
    for (const [key, record] of this.requests.entries()) {
      if (now > record.resetTime) {
        this.requests.delete(key);
      }
    }
  }
}
