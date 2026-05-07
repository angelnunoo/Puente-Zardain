/**
 * TIPOS COMPARTIDOS
 * Tipos TypeScript adicionales usados en frontend y backend
 */

// ==================== TIPOS DE UTILIDAD ====================

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type AsyncFunction<T> = () => Promise<T>;

// ==================== PAGINACIÓN ====================

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedResult<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// ==================== FILTROS ====================

export interface OrderFilters {
  status?: string;
  paymentStatus?: string;
  delivery?: boolean;
  startDate?: Date;
  endDate?: Date;
  userId?: string;
}

export interface ProductFilters {
  category?: string;
  search?: string;
  active?: boolean;
  minPrice?: number;
  maxPrice?: number;
}

// ==================== RESPUESTAS DE API ====================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}

// ==================== EVENTOS ====================

export interface DomainEvent {
  id: string;
  type: string;
  aggregate: {
    id: string;
    type: string;
  };
  payload: Record<string, any>;
  timestamp: Date;
  version: number;
}

// ==================== CONTEXTO DE SOLICITUD ====================

export interface RequestContext {
  userId?: string;
  requestId: string;
  ip: string;
  userAgent: string;
  timestamp: Date;
}

// ==================== ESTADÍSTICAS ====================

export interface TimeSeriesData {
  timestamp: Date;
  value: number;
  label?: string;
}

export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
  }>;
}

// ==================== VALIDACIÓN ====================

export type ValidationRule<T> = (value: T) => boolean | string;

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string[]>;
}