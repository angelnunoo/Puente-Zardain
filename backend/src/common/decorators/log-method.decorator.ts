/**
 * DECORADOR DE LOGGING
 * Registra automáticamente entrada, salida y errores de métodos
 */

import { Logger } from '@nestjs/common';

const logger = new Logger('MethodLogger');

/**
 * Decorador que registra la ejecución de un método
 * @param context Contexto adicional para el log
 */
export function LogMethod(context?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (this: any, ...args: any[]) {
      const methodName = `${target.constructor.name}.${propertyKey}`;
      const contextStr = context ? ` [${context}]` : '';
      const correlationId = this.requestContext?.requestId || 'unknown';

      const logPrefix = `[${correlationId}] ${methodName}${contextStr}`;

      try {
        logger.debug(`${logPrefix} - START`, {
          args: sanitizeArgs(args),
        });

        const startTime = Date.now();
        const result = await originalMethod.apply(this, args);
        const duration = Date.now() - startTime;

        logger.debug(`${logPrefix} - END (${duration}ms)`, {
          resultType: typeof result,
          resultSize: JSON.stringify(result).length,
        });

        return result;
      } catch (error) {
        logger.error(`${logPrefix} - ERROR`, error instanceof Error ? error.message : String(error), {
          error: error instanceof Error ? error.stack : String(error),
        });
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Decorador para métodos síncronos
 */
export function LogMethodSync(context?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function (this: any, ...args: any[]) {
      const methodName = `${target.constructor.name}.${propertyKey}`;
      const contextStr = context ? ` [${context}]` : '';

      const logPrefix = `${methodName}${contextStr}`;

      try {
        logger.debug(`${logPrefix} - START`);

        const startTime = Date.now();
        const result = originalMethod.apply(this, args);
        const duration = Date.now() - startTime;

        logger.debug(`${logPrefix} - END (${duration}ms)`);

        return result;
      } catch (error) {
        logger.error(`${logPrefix} - ERROR`, error instanceof Error ? error.message : String(error));
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Saneador de argumentos para logging (oculta datos sensibles)
 */
function sanitizeArgs(args: any[]): any[] {
  return args.map((arg) => {
    if (!arg) return arg;

    if (typeof arg !== 'object') return arg;

    const sanitized = { ...arg };
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];

    Object.keys(sanitized).forEach((key) => {
      if (sensitiveFields.some((field) => key.toLowerCase().includes(field))) {
        sanitized[key] = '***HIDDEN***';
      }
    });

    return sanitized;
  });
}
