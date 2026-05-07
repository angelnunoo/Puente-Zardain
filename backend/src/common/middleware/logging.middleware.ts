/**
 * MIDDLEWARE DE LOGGING
 * Registra todos los requests y responses
 */

import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const requestId = uuidv4();
    const startTime = Date.now();

    // Añadir ID de solicitud al request
    (req as any).requestContext = {
      requestId,
      userId: (req as any).user?.id,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      timestamp: new Date(),
    };

    // Interceptar el método send de Response
    const originalSend = res.send;
    let responseData: any;

    res.send = function (data: any) {
      responseData = data;
      return originalSend.call(this, data);
    };

    // Log al final de la respuesta
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;
      const logLevel = statusCode >= 400 ? 'error' : 'log';

      const logData = {
        requestId,
        method: req.method,
        path: req.path,
        query: req.query,
        statusCode,
        duration: `${duration}ms`,
        userId: (req as any).user?.id,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      };

      if (logLevel === 'error') {
        this.logger.error(`${req.method} ${req.path} - ${statusCode}`, logData);
      } else if (duration > 1000) {
        this.logger.warn(`[SLOW] ${req.method} ${req.path} - ${duration}ms`, logData);
      } else {
        this.logger.log(`${req.method} ${req.path} - ${statusCode} (${duration}ms)`, logData);
      }
    });

    next();
  }
}
