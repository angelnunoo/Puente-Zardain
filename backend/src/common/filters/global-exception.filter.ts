/**
 * FILTRO DE EXCEPCIONES GLOBAL
 * Maneja todas las excepciones no capturadas y las convierte en respuestas estandarizadas
 */

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AppException } from './app.exception';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Error interno del servidor';
    let code = 'INTERNAL_ERROR';
    let details: Record<string, any> | undefined;

    // Manejo de excepciones personalizadas
    if (exception instanceof AppException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse() as any;
      message = exceptionResponse.message || message;
      code = exceptionResponse.code || code;
      details = exceptionResponse.details;

      // Loguear excepciones de negocio
      if (status === HttpStatus.BAD_REQUEST || status === HttpStatus.SERVICE_UNAVAILABLE) {
        this.logger.warn(`[${request.method}] ${request.url} - ${code}: ${message}`, {
          userId: (request as any).user?.id,
          details,
        });
      }
    }
    // Manejo de HttpException (validación, etc.)
    else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse() as any;

      if (typeof exceptionResponse === 'object') {
        message = exceptionResponse.message || exceptionResponse.error || message;
        details = exceptionResponse;
      } else {
        message = exceptionResponse;
      }

      this.logger.warn(`[${request.method}] ${request.url} - ${message}`, {
        userId: (request as any).user?.id,
      });
    }
    // Cualquier otra excepción
    else {
      this.logger.error(`[${request.method}] ${request.url}`, exception, {
        userId: (request as any).user?.id,
      });

      if (exception instanceof Error) {
        message = exception.message;
      }
    }

    const errorResponse = {
      code,
      message,
      details,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      ...(process.env.NODE_ENV === 'development' && {
        stack: exception instanceof Error ? exception.stack : undefined,
      }),
    };

    response.status(status).json({
      success: false,
      error: errorResponse,
    });
  }
}
