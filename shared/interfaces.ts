/**
 * INTERFACES COMPARTIDAS
 * Interfaces para entidades del dominio compartidas entre frontend y backend
 */

import {
  UserRole,
  UserLeague,
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  KitchenStatus,
  IncidenceType,
  RewardType,
} from './enums';

// ==================== USUARIOS ====================

export interface IUser {
  id: string;
  email: string;
  phone: string;
  name: string;
  avatar?: string;
  color?: string;
  zardas: number;
  league: UserLeague;
  role: UserRole;
  phoneVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserProfile extends IUser {
  totalOrders: number;
  totalSpent: number;
  favoriteProducts: string[];
}

// ==================== PRODUCTOS ====================

export interface IIngredient {
  id: string;
  name: string;
  required: boolean;
  productId: string;
}

export interface IProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  category: string;
  stock: number;
  active: boolean;
  ingredients: IIngredient[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IProductCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  order: number;
}

// ==================== CARRITO ====================

export interface ICartItem {
  id: string;
  cartId: string;
  productId: string;
  product: IProduct;
  quantity: number;
  customizations?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICart {
  id: string;
  userId: string;
  items: ICartItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ICartSummary {
  itemCount: number;
  subtotal: number;
  tax: number;
  deliveryFee: number;
  total: number;
}

// ==================== PEDIDOS ====================

export interface IOrderItem {
  id: string;
  orderId: string;
  productId: string;
  product: IProduct;
  quantity: number;
  price: number; // Precio al momento del pedido
  customizations?: string;
}

export interface IOrder {
  id: string;
  userId: string;
  user: IUser;
  items: IOrderItem[];
  subtotal: number;
  tax: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentIntentId?: string;
  delivery: boolean;
  address?: string;
  notes?: string;
  estimatedTime?: number;
  actualDeliveryTime?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IOrderSummary {
  id: string;
  total: number;
  status: OrderStatus;
  delivery: boolean;
  createdAt: Date;
}

// ==================== HORARIOS ====================

export interface IScheduleWindow {
  id: string;
  dayOfWeek: number;
  shift: number;
  openTime: string;
  closeTime: string;
  active: boolean;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISpecialSchedule {
  id: string;
  date: Date;
  openTime?: string;
  closeTime?: string;
  isClosed: boolean;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRestaurantHours {
  regular: IScheduleWindow[];
  special: ISpecialSchedule[];
  isOpenNow: boolean;
  nextOpenTime?: Date;
  nextCloseTime?: Date;
}

// ==================== COCINA ====================

export interface IKitchenState {
  status: KitchenStatus;
  message?: string;
  estimatedWaitTime?: number;
  updatedAt: Date;
}

export interface IKitchenOrder {
  id: string;
  orderNumber: number;
  items: IOrderItem[];
  notes?: string;
  createdAt: Date;
  estimatedReadyTime: Date;
  status: OrderStatus;
}

// ==================== RESEÑAS ====================

export interface IReview {
  id: string;
  userId: string;
  user: IUser;
  rating: number;
  comment?: string;
  response?: string;
  hidden: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== CHAT ====================

export interface IMessage {
  id: string;
  chatId: string;
  sender: string; // userId o 'admin'
  senderName?: string;
  content: string;
  createdAt: Date;
}

export interface IChat {
  id: string;
  orderId: string;
  order: IOrder;
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
}

// ==================== ZARDAS (FIDELIZACIÓN) ====================

export interface IZardasBalance {
  total: number;
  available: number;
  pending: number;
  expired: number;
}

export interface IZardasTransaction {
  id: string;
  userId: string;
  amount: number;
  type: RewardType;
  reason: string;
  orderId?: string;
  expiresAt?: Date;
  createdAt: Date;
}

export interface IUserZardasData {
  balance: IZardasBalance;
  league: UserLeague;
  nextLeagueAt: number; // Zardas necesarias para siguiente liga
  history: IZardasTransaction[];
}

// ==================== INCIDENCIAS ====================

export interface IIncidence {
  id: string;
  orderId: string;
  userId: string;
  type: IncidenceType;
  description?: string;
  resolved: boolean;
  resolution?: string;
  resolvedBy?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== REPORTES ====================

export interface IDailySalesReport {
  date: Date;
  totalOrders: number;
  totalSales: number;
  averageOrderValue: number;
  paymentMethods: Record<string, number>;
  topProducts: Array<{ productId: string; name: string; quantity: number }>;
  peakHour: number;
  incidences: number;
}

export interface IWeeklySalesReport {
  weekStart: Date;
  weekEnd: Date;
  totalOrders: number;
  totalSales: number;
  averageOrderValue: number;
  dailyBreakdown: IDailySalesReport[];
}

export interface IMonthlySalesReport {
  month: number;
  year: number;
  totalOrders: number;
  totalSales: number;
  averageOrderValue: number;
  weeklyBreakdown: IWeeklySalesReport[];
  bestDay: Date;
  worstDay: Date;
}

// ==================== PREDICCIONES ====================

export interface ISalesPrediction {
  date: Date;
  estimatedOrders: number;
  estimatedSales: number;
  confidence: number;
  reasoning: string;
}

export interface IPredictionRange {
  low: number;
  mid: number;
  high: number;
}

// ==================== AUTENTICACIÓN ====================

export interface IAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface IJwtPayload {
  sub: string; // userId
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

// ==================== CONTEXTO DE APLICACIÓN ====================

export interface IAppContext {
  user?: IUser;
  isAuthenticated: boolean;
  restaurant: {
    isOpen: boolean;
    nextOpen?: Date;
    kitchen: IKitchenState;
  };
}

// ==================== ERRORES ====================

export interface IErrorResponse {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
  path?: string;
  request_id?: string;
}
  updatedAt: string;
}

export interface SpecialSchedule {
  id: string;
  date: string;
  openTime?: string;
  closeTime?: string;
  isClosed: boolean;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PublicScheduleStatus {
  open: boolean;
  reason: string;
  nextOpen: string | null;
}

export interface PublicScheduleResponse {
  windows: ScheduleWindow[];
  specials: SpecialSchedule[];
  status: PublicScheduleStatus;
}
