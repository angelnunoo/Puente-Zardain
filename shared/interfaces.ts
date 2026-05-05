declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export interface User {
  id: string;
  email: string;
  phone: string;
  name: string;
  avatar?: string;
  color?: string;
  zardas: number;
  league: string;
  role: 'USER' | 'ADMIN';
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  category: string;
  ingredients: Ingredient[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Ingredient {
  id: string;
  name: string;
  required: boolean;
  productId: string;
}

export interface Order {
  id: string;
  userId: string;
  user: User;
  items: OrderItem[];
  total: number;
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED';
  delivery: boolean;
  address?: string;
  paymentMethod: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  orderId: string;
  order: Order;
  productId: string;
  product: Product;
  quantity: number;
  customizations?: string;
}

export interface Review {
  id: string;
  userId: string;
  user: User;
  rating: number;
  comment?: string;
  createdAt: Date;
}

export interface Chat {
  id: string;
  orderId: string;
  order: Order;
  messages: Message[];
  createdAt: Date;
}

export interface Message {
  id: string;
  chatId: string;
  chat: Chat;
  sender: string;
  content: string;
  createdAt: Date;
}