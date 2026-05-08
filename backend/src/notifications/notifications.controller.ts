import { 
  Controller, 
  Post, 
  Body, 
  UseGuards,
  Get,
  Param 
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationsService } from './notifications.service';
import { NotificationPayload } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Post('broadcast')
  async sendBroadcast(@Body() body: { 
    type: 'info' | 'warning' | 'error' | 'success';
    title: string;
    message: string;
    targetUsers?: string[];
  }) {
    return this.notificationsService.sendBroadcast(
      body.type,
      body.title,
      body.message,
      body.targetUsers
    );
  }

  @Post('order-update')
  async sendOrderUpdate(@Body() body: { 
    orderId: string;
    status: string;
    message?: string;
    targetUserId?: string;
  }) {
    return this.notificationsService.sendOrderUpdate(
      body.orderId,
      body.status,
      body.message,
      body.targetUserId
    );
  }

  @Post('kitchen-status')
  async sendKitchenStatusUpdate(@Body() body: { 
    status: string;
    message?: string;
  }) {
    return this.notificationsService.sendKitchenStatusUpdate(
      body.status,
      body.message
    );
  }

  @Post('low-stock')
  async sendLowStockAlert(@Body() body: { 
    productId: string;
    productName: string;
    stock: number;
  }) {
    return this.notificationsService.sendLowStockAlert(
      body.productId,
      body.productName,
      body.stock
    );
  }

  @Get('banner')
  getBanner() {
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay();
    
    // Lógica para determinar si mostrar banner y qué mensaje
    let message = '';
    let type: 'info' | 'warning' | 'error' | 'success' = 'info';
    let enabled = false;
    
    // Banner especial durante horas pico
    const isPeakHour = (currentHour >= 13 && currentHour <= 15) || (currentHour >= 20 && currentHour <= 22);
    const isWeekend = currentDay === 0 || currentDay === 6;
    
    if (isPeakHour && isWeekend) {
      enabled = true;
      message = '🔥 Fin de semana muy concurrido! Los pedidos pueden tardar un poco más de lo normal';
      type = 'warning';
    } else if (isPeakHour) {
      enabled = true;
      message = '⏰ Hora pico! Estamos cocinando con todo nuestro amor';
      type = 'info';
    } else if (currentHour >= 23 || currentHour <= 6) {
      enabled = false; // No mostrar banner de noche
    } else {
      // Mensaje motivacional aleatorio durante horas normales
      const messages = [
        '🍳 ¡Cocinando con el corazón!',
        '👨‍🍳 El chef está creativo hoy',
        '🌟 Ingredientes frescos del mercado',
        '💕 Hecho con amor para ti'
      ];
      message = messages[Math.floor(Math.random() * messages.length)];
      type = 'success';
      enabled = Math.random() > 0.3; // 70% de probabilidad de mostrar
    }
    
    return {
      message,
      type,
      enabled
    };
  }

  @Get('history/:userId')
  async getNotificationHistory(@Param('userId') userId: string) {
    // Este endpoint podría implementarse para obtener historial de notificaciones
    return { message: 'Notification history endpoint - to be implemented' };
  }
}
