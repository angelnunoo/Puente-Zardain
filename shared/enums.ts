/**
 * ENUMS COMPARTIDOS
 * Enumeraciones compartidas entre frontend y backend
 * Uso: Tipado seguro de valores predefinidos
 */

// ==================== USUARIOS ====================
export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export enum UserLeague {
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM',
}

// ==================== PEDIDOS ====================
export enum OrderStatus {
  PENDING = 'PENDING',           // Pedido creado, esperando confirmación
  CONFIRMED = 'CONFIRMED',       // Aceptado por el restaurante
  PREPARING = 'PREPARING',       // En preparación
  READY = 'READY',               // Listo para entrega/recogida
  DELIVERED = 'DELIVERED',       // Entregado
  CANCELLED = 'CANCELLED',       // Cancelado
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentMethod {
  CARD = 'CARD',
  CASH = 'CASH',
  STRIPE = 'STRIPE',
  PAYPAL = 'PAYPAL',
  BIZUM = 'BIZUM',
}

// ==================== RESTAURANTE ====================
export enum KitchenStatus {
  OPEN = 'OPEN',
  SATURATED = 'SATURATED',
  CLOSED = 'CLOSED',
}

export enum DayOfWeek {
  MONDAY = 0,
  TUESDAY = 1,
  WEDNESDAY = 2,
  THURSDAY = 3,
  FRIDAY = 4,
  SATURDAY = 5,
  SUNDAY = 6,
}

export enum ShiftType {
  LUNCH = 1,
  DINNER = 2,
}

// ==================== INCIDENCIAS ====================
export enum IncidenceType {
  ORDER_LATE = 'ORDER_LATE',
  WRONG_ORDER = 'WRONG_ORDER',
  QUALITY_ISSUE = 'QUALITY_ISSUE',
  MISSING_ITEM = 'MISSING_ITEM',
  OTHER = 'OTHER',
}

// ==================== RECOMPENSAS ====================
export enum RewardType {
  ZARDAS_COMPENSATION = 'ZARDAS_COMPENSATION',
  BIRTHDAY_BONUS = 'BIRTHDAY_BONUS',
  LOYALTY_MILESTONE = 'LOYALTY_MILESTONE',
  REFERRAL_BONUS = 'REFERRAL_BONUS',
  MANUAL = 'MANUAL',
}

// ==================== REPORTES ====================
export enum ReportPeriod {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
}

// ==================== ERRORES ====================
export enum ErrorCode {
  // Autenticación
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',

  // Validación
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_PARAM = 'INVALID_PARAM',
  MISSING_FIELD = 'MISSING_FIELD',

  // Recursos
  NOT_FOUND = 'NOT_FOUND',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',

  // Negocio
  INVALID_STATE_TRANSITION = 'INVALID_STATE_TRANSITION',
  INSUFFICIENT_STOCK = 'INSUFFICIENT_STOCK',
  RESTAURANT_CLOSED = 'RESTAURANT_CLOSED',
  ORDER_TOO_LATE = 'ORDER_TOO_LATE',
  PAYMENT_FAILED = 'PAYMENT_FAILED',

  // Servidor
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}

// ==================== LOGGING ====================
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}
