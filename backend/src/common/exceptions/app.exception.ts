/**
 * EXCEPCIONES PERSONALIZADAS
 * Excepciones del dominio para manejo de errores especializado
 */

import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from '../../../../shared/enums';

/**
 * Clase base para todas las excepciones de la aplicación
 */
export class AppException extends HttpException {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    statusCode: number = HttpStatus.BAD_REQUEST,
    public readonly details?: Record<string, any>,
  ) {
    super(
      {
        code,
        message,
        details,
        timestamp: new Date(),
      },
      statusCode,
    );
  }
}

// ==================== AUTENTICACIÓN ====================

export class UnauthorizedException extends AppException {
  constructor(message = 'No autorizado', details?: Record<string, any>) {
    super(ErrorCode.UNAUTHORIZED, message, HttpStatus.UNAUTHORIZED, details);
  }
}

export class InvalidCredentialsException extends AppException {
  constructor(message = 'Credenciales inválidas', details?: Record<string, any>) {
    super(ErrorCode.INVALID_CREDENTIALS, message, HttpStatus.UNAUTHORIZED, details);
  }
}

export class TokenExpiredException extends AppException {
  constructor(message = 'Token expirado', details?: Record<string, any>) {
    super(ErrorCode.TOKEN_EXPIRED, message, HttpStatus.UNAUTHORIZED, details);
  }
}

export class TokenInvalidException extends AppException {
  constructor(message = 'Token inválido', details?: Record<string, any>) {
    super(ErrorCode.TOKEN_INVALID, message, HttpStatus.UNAUTHORIZED, details);
  }
}

// ==================== VALIDACIÓN ====================

export class ValidationException extends AppException {
  constructor(message = 'Error de validación', details?: Record<string, any>) {
    super(ErrorCode.VALIDATION_ERROR, message, HttpStatus.BAD_REQUEST, details);
  }
}

export class MissingFieldException extends AppException {
  constructor(field: string, details?: Record<string, any>) {
    super(
      ErrorCode.MISSING_FIELD,
      `Campo requerido faltante: ${field}`,
      HttpStatus.BAD_REQUEST,
      details,
    );
  }
}

export class InvalidParameterException extends AppException {
  constructor(message = 'Parámetro inválido', details?: Record<string, any>) {
    super(ErrorCode.INVALID_PARAM, message, HttpStatus.BAD_REQUEST, details);
  }
}

// ==================== RECURSOS ====================

export class ResourceNotFoundException extends AppException {
  constructor(resource: string, id?: string, details?: Record<string, any>) {
    const message = id ? `${resource} con ID ${id} no encontrado` : `${resource} no encontrado`;
    super(ErrorCode.RESOURCE_NOT_FOUND, message, HttpStatus.NOT_FOUND, details);
  }
}

export class ResourceAlreadyExistsException extends AppException {
  constructor(message = 'Recurso ya existe', details?: Record<string, any>) {
    super(ErrorCode.ALREADY_EXISTS, message, HttpStatus.CONFLICT, details);
  }
}

// ==================== LÓGICA DE NEGOCIO ====================

export class InvalidStateTransitionException extends AppException {
  constructor(
    current: string,
    target: string,
    details?: Record<string, any>,
  ) {
    super(
      ErrorCode.INVALID_STATE_TRANSITION,
      `No se puede transicionar de ${current} a ${target}`,
      HttpStatus.BAD_REQUEST,
      details,
    );
  }
}

export class InsufficientStockException extends AppException {
  constructor(
    productName: string,
    requested: number,
    available: number,
    details?: Record<string, any>,
  ) {
    super(
      ErrorCode.INSUFFICIENT_STOCK,
      `Stock insuficiente de ${productName}: disponible ${available}, solicitado ${requested}`,
      HttpStatus.BAD_REQUEST,
      { requested, available, ...details },
    );
  }
}

export class RestaurantClosedException extends AppException {
  constructor(message = 'Restaurante cerrado en este momento', details?: Record<string, any>) {
    super(ErrorCode.RESTAURANT_CLOSED, message, HttpStatus.SERVICE_UNAVAILABLE, details);
  }
}

export class OrderTooLateException extends AppException {
  constructor(
    closingTime: Date,
    minimumAdvanceTime: number,
    details?: Record<string, any>,
  ) {
    super(
      ErrorCode.ORDER_TOO_LATE,
      `No se pueden realizar pedidos menos de ${minimumAdvanceTime} minutos antes del cierre (${closingTime.toLocaleTimeString('es-ES')})`,
      HttpStatus.BAD_REQUEST,
      { closingTime, minimumAdvanceTime, ...details },
    );
  }
}

export class PaymentFailedException extends AppException {
  constructor(reason: string, details?: Record<string, any>) {
    super(
      ErrorCode.PAYMENT_FAILED,
      `Pago fallido: ${reason}`,
      HttpStatus.PAYMENT_REQUIRED,
      details,
    );
  }
}

// ==================== SERVIDOR ====================

export class InternalServerException extends AppException {
  constructor(message = 'Error interno del servidor', details?: Record<string, any>) {
    super(
      ErrorCode.INTERNAL_ERROR,
      message,
      HttpStatus.INTERNAL_SERVER_ERROR,
      details,
    );
  }
}

export class DatabaseException extends AppException {
  constructor(message = 'Error de base de datos', details?: Record<string, any>) {
    super(
      ErrorCode.DATABASE_ERROR,
      message,
      HttpStatus.INTERNAL_SERVER_ERROR,
      details,
    );
  }
}

export class ServiceUnavailableException extends AppException {
  constructor(message = 'Servicio no disponible', details?: Record<string, any>) {
    super(
      ErrorCode.SERVICE_UNAVAILABLE,
      message,
      HttpStatus.SERVICE_UNAVAILABLE,
      details,
    );
  }
}
