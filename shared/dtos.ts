/**
 * DTOs COMPARTIDOS
 * Data Transfer Objects reutilizables en frontend y backend
 * Incluye validaciones con class-validator
 */

import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsPositive,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  UserRole,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  UserLeague,
  KitchenStatus,
  ShiftType,
  IncidenceType,
  RewardType,
} from './enums';

// ==================== AUTENTICACIÓN ====================

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  name: string;
}

export class PasswordResetRequestDto {
  @IsEmail()
  email: string;
}

export class PasswordResetDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsNotEmpty()
  newPassword: string;
}

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  oldPassword: string;

  @IsString()
  @IsNotEmpty()
  newPassword: string;
}

// ==================== USUARIOS ====================

export class UpdateUserProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsString()
  color?: string;
}

export class UserResponseDto {
  id: string;
  email: string;
  phone: string;
  name: string;
  avatar?: string;
  color?: string;
  zardas: number;
  league: UserLeague;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== PRODUCTOS ====================

export class IngredientDto {
  @IsString()
  @IsNotEmpty()
  id?: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsBoolean()
  @IsOptional()
  required?: boolean;
}

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsPositive()
  price: number;

  @IsString()
  category: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IngredientDto)
  ingredients?: IngredientDto[];
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsPositive()
  price?: number;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;
}

export class ProductResponseDto {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  image?: string;
  stock: number;
  active: boolean;
  ingredients: IngredientDto[];
  createdAt: Date;
  updatedAt: Date;
}

// ==================== CARRITO ====================

export class CartItemDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsInt()
  @IsPositive()
  quantity: number;

  @IsOptional()
  @IsString()
  customizations?: string;
}

export class AddToCartDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsInt()
  @IsPositive()
  quantity: number;

  @IsOptional()
  @IsString()
  customizations?: string;
}

export class UpdateCartItemDto {
  @IsInt()
  @IsPositive()
  @IsOptional()
  quantity?: number;

  @IsOptional()
  @IsString()
  customizations?: string;
}

export class CartResponseDto {
  id: string;
  items: CartItemDto[];
  total: number;
  itemCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== PEDIDOS ====================

export class OrderItemDetailDto {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  customizations?: string;
  subtotal: number;
}

export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  items: CartItemDto[];

  @IsBoolean()
  delivery: boolean;

  @IsOptional()
  @IsString()
  address?: string;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class OrderResponseDto {
  id: string;
  userId: string;
  items: OrderItemDetailDto[];
  subtotal: number;
  tax: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  delivery: boolean;
  address?: string;
  notes?: string;
  estimatedTime?: number;
  createdAt: Date;
  updatedAt: Date;
}

export class OrderListDto {
  id: string;
  total: number;
  status: OrderStatus;
  delivery: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== HORARIOS ====================

export class ScheduleWindowDto {
  @IsInt()
  dayOfWeek: number;

  @IsEnum(ShiftType)
  shift: ShiftType;

  @IsString()
  @IsNotEmpty()
  openTime: string;

  @IsString()
  @IsNotEmpty()
  closeTime: string;

  @IsBoolean()
  active: boolean;

  @IsOptional()
  @IsString()
  note?: string;
}

export class SpecialScheduleDto {
  @IsString()
  @IsNotEmpty()
  date: string;

  @IsOptional()
  @IsString()
  openTime?: string;

  @IsOptional()
  @IsString()
  closeTime?: string;

  @IsBoolean()
  isClosed: boolean;

  @IsOptional()
  @IsString()
  note?: string;
}

export class RestaurantHoursResponseDto {
  regular: ScheduleWindowDto[];
  special: SpecialScheduleDto[];
  isOpenNow: boolean;
  nextOpenTime?: string;
  nextCloseTime?: string;
}

// ==================== COCINA ====================

export class KitchenStatusDto {
  @IsEnum(KitchenStatus)
  status: KitchenStatus;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsInt()
  estimatedWaitTime?: number;
}

export class KitchenOrderDto {
  id: string;
  orderNumber: number;
  items: OrderItemDetailDto[];
  notes?: string;
  createdAt: Date;
  estimatedReadyTime: Date;
}

// ==================== RESEÑAS ====================

export class CreateReviewDto {
  @IsInt()
  @Min(1)
  rating: number;

  @IsOptional()
  @IsString()
  comment?: string;
}

export class ReviewResponseDto {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment?: string;
  response?: string;
  createdAt: Date;
}

// ==================== CHAT ====================

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  content: string;
}

export class MessageResponseDto {
  id: string;
  sender: string;
  senderName?: string;
  content: string;
  createdAt: Date;
}

// ==================== ZARDAS ====================

export class ZardasBalanceDto {
  total: number;
  available: number;
  pending: number;
  expired: number;
}

export class ZardasHistoryDto {
  id: string;
  amount: number;
  type: RewardType;
  reason: string;
  createdAt: Date;
}

// ==================== INCIDENCIAS ====================

export class ReportIncidenceDto {
  @IsEnum(IncidenceType)
  type: IncidenceType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @IsNotEmpty()
  orderId: string;
}

export class IncidenceResponseDto {
  id: string;
  orderId: string;
  type: IncidenceType;
  description?: string;
  resolved: boolean;
  resolution?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== ERRORES ====================

export class ErrorResponseDto {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
  path?: string;
}

// ==================== RESPUESTAS GENERALES ====================

export class SuccessResponseDto<T> {
  success: boolean;
  data: T;
  message?: string;
}

export class PaginatedResponseDto<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  pages: number;
}
