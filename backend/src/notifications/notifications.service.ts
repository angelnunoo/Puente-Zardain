import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';

export interface NotificationPayload {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'order_update' | 'kitchen_update' | 'low_stock_alert';
  title: string;
  message: string;
  timestamp: Date;
  data?: any;
  persistent?: boolean;
  targetUsers?: string[];
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger('NotificationsService');

  constructor() {
    this.logger.log('NotificationsService initialized');
  }

  // ==================== NOTIFICACIONES DE PEDIDOS ====================

  sendOrderUpdate(orderId: string, status: string, message?: string, targetUserId?: string) {
    this.logger.log(`Sending order update: ${orderId} -> ${status}`);
    
    const notification: NotificationPayload = {
      id: `order_${orderId}_${Date.now()}`,
      type: 'order_update',
      title: 'Pedido Actualizado',
      message: message || `Tu pedido #${orderId} está ${status}`,
      data: { orderId, status },
      timestamp: new Date(),
    };

    // Enviar a usuario específico si se especifica
    if (targetUserId) {
      this.sendToUser(targetUserId, 'order_updated', notification);
    }
  }

  sendKitchenStatusUpdate(status: string, message?: string) {
    this.logger.log(`Sending kitchen status update: ${status}`);
    
    const notification: NotificationPayload = {
      id: `kitchen_${Date.now()}`,
      type: 'kitchen_update',
      title: 'Estado de Cocina',
      message: message || `La cocina está ${status}`,
      data: { status },
      timestamp: new Date(),
    };

    this.broadcastToKitchen('kitchen_status_changed', notification);
  }

  sendLowStockAlert(productId: string, productName: string, stock: number) {
    this.logger.log(`Sending low stock alert: ${productName} -> ${stock}`);
    
    if (stock > 5) return; // Solo alertar si realmente está bajo

    const notification: NotificationPayload = {
      id: `stock_${productId}_${Date.now()}`,
      type: 'low_stock_alert',
      title: '⚠️ Stock Bajo',
      message: `¡Últimas ${stock} unidades de ${productName}!`,
      data: { productId, productName, stock },
      timestamp: new Date(),
    };

    this.broadcastToOrders('low_stock_alert', notification);
  }

  // ==================== NOTIFICACIONES GENERALES ====================

  sendBroadcast(
    type: 'info' | 'warning' | 'error' | 'success',
    title: string,
    message: string,
    targetUsers?: string[],
    persistent: boolean = false
  ) {
    this.logger.log(`Sending broadcast: ${type} - ${title}`);
    
    const notification: NotificationPayload = {
      id: `broadcast_${Date.now()}_${Math.random()}`,
      type,
      title,
      message,
      targetUsers,
      persistent,
      timestamp: new Date(),
    };

    // Si hay usuarios específicos, enviar solo a ellos
    if (targetUsers && targetUsers.length > 0) {
      targetUsers.forEach(userId => {
        this.sendToUser(userId, 'notification', notification);
      });
    } else {
      // Enviar a todos los clientes de pedidos
      this.broadcastToOrders('notification', notification);
    }
  }

  sendSuccess(title: string, message: string, targetUsers?: string[]) {
    this.sendBroadcast('success', title, message, targetUsers);
  }

  sendWarning(title: string, message: string, targetUsers?: string[]) {
    this.sendBroadcast('warning', title, message, targetUsers);
  }

  sendError(title: string, message: string, targetUsers?: string[]) {
    this.sendBroadcast('error', title, message, targetUsers, true);
  }

  // ==================== MÉTODOS PRIVADOS ====================

  private sendToUser(userId: string, event: string, data: NotificationPayload) {
    // Este método será implementado en el gateway para enviar a usuario específico
    this.logger.log(`Sending to user ${userId}: ${event}`);
  }

  private broadcastToOrders(event: string, data: NotificationPayload) {
    // Este método será implementado en el gateway para broadcasting
    this.logger.log(`Broadcasting to orders: ${event}`);
  }

  private broadcastToKitchen(event: string, data: NotificationPayload) {
    // Este método será implementado en el gateway para cocina
    this.logger.log(`Broadcasting to kitchen: ${event}`);
  }
}
