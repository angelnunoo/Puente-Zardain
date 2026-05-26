import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class NotificationsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private logger: Logger = new Logger('NotificationsGateway');

  constructor() {
    this.logger.log('NotificationsGateway initialized');
  }

  afterInit(server: Server) {
    this.logger.log('WebSocket server initialized');
  }

  handleConnection(client: Socket & { userId?: string }) {
    this.logger.log(`Client connected: ${client.id}`);
    
    // Unir cliente a salas específicas
    if (client.userId) {
      client.join(`user_${client.userId}`);
    }
    client.join('kitchen_updates');
    client.join('order_updates');
    
    // Enviar estado inicial
    client.emit('connected', {
      message: 'Conectado al sistema de notificaciones',
      timestamp: new Date(),
    });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // ==================== NOTIFICACIONES DE PEDIDOS ====================

  @SubscribeMessage('order_status_update')
  handleOrderStatusUpdate(
    client: Socket,
    @MessageBody() data: { orderId: string; status: string; message?: string },
  ) {
    this.logger.log(`Order status update: ${data.orderId} -> ${data.status}`);
    
    // Notificar a todos los clientes del pedido específico
    this.server.to(`order_${data.orderId}`).emit('order_updated', {
      orderId: data.orderId,
      status: data.status,
      message: data.message,
      timestamp: new Date(),
    });
    
    // Notificar a cocina
    this.server.to('kitchen_updates').emit('kitchen_order_update', {
      orderId: data.orderId,
      status: data.status,
      message: data.message,
      timestamp: new Date(),
    });
  }

  @SubscribeMessage('kitchen_status_update')
  handleKitchenStatusUpdate(
    client: Socket,
    @MessageBody() data: { status: string; message?: string },
  ) {
    this.logger.log(`Kitchen status update: ${data.status}`);
    
    // Notificar a todos los clientes sobre estado de cocina
    this.server.to('order_updates').emit('kitchen_status_changed', {
      status: data.status,
      message: data.message,
      timestamp: new Date(),
    });
  }

  // ==================== NOTIFICACIONES DE STOCK ====================

  @SubscribeMessage('product_stock_update')
  handleProductStockUpdate(
    client: Socket,
    @MessageBody() data: { productId: string; stock: number; productName: string },
  ) {
    this.logger.log(`Product stock update: ${data.productName} -> ${data.stock}`);
    
    // Notificar sobre productos con stock bajo
    if (data.stock <= 5) {
      this.server.to('order_updates').emit('low_stock_alert', {
        productId: data.productId,
        productName: data.productName,
        stock: data.stock,
        message: `¡Últimas ${data.stock} unidades de ${data.productName}!`,
        severity: 'warning',
        timestamp: new Date(),
      });
    }
  }

  // ==================== NOTIFICACIONES GENERALES ====================

  @SubscribeMessage('broadcast_notification')
  handleBroadcastNotification(
    client: Socket,
    @MessageBody() data: { 
      type: 'info' | 'warning' | 'error' | 'success';
      title: string;
      message: string;
      targetUsers?: string[];
    },
  ) {
    this.logger.log(`Broadcast notification: ${data.type} - ${data.title}`);
    
    let targetRooms = ['order_updates'];
    
    // Si se especifican usuarios específicos, enviar solo a ellos
    if (data.targetUsers && data.targetUsers.length > 0) {
      targetRooms = data.targetUsers.map(userId => `user_${userId}`);
    }
    
    // Enviar notificación
    const notification = {
      id: `notif_${Date.now()}_${Math.random()}`,
      type: data.type,
      title: data.title,
      message: data.message,
      timestamp: new Date(),
      persistent: data.type === 'error' || data.type === 'warning',
    };
    
    if (targetRooms.length > 0) {
      targetRooms.forEach(room => {
        this.server.to(room).emit('notification', notification);
      });
    } else {
      this.server.to('order_updates').emit('notification', notification);
    }
  }

  // ==================== MÉTODOS UTILITARIOS ====================

  // Enviar notificación a usuario específico
  sendToUser(userId: string, event: string, data: any) {
    this.server.to(`user_${userId}`).emit(event, data);
  }

  // Enviar a todos los clientes de pedidos
  broadcastToOrders(event: string, data: any) {
    this.server.to('order_updates').emit(event, data);
  }

  // Enviar a cocina
  broadcastToKitchen(event: string, data: any) {
    this.server.to('kitchen_updates').emit(event, data);
  }

  // Enviar notificación global
  broadcastGlobal(event: string, data: any) {
    this.server.emit(event, data);
  }
}
