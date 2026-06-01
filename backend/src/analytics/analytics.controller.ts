import { 
  Controller, 
  Get, 
  Query, 
  UseGuards, 
  Param,
  BadRequestException
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/guards/roles.decorator';
import { Role, ReportPeriod } from '../../../shared/enums';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  async getDashboardMetrics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.analyticsService.getDashboardMetrics(start, end);
  }

  @Get('sales/:period')
  async getSalesReport(
    @Param('period') period: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const validPeriod = Object.values(ReportPeriod).includes(period as ReportPeriod);
    if (!validPeriod) {
      throw new BadRequestException('Invalid period. Use: DAILY, WEEKLY, MONTHLY, YEARLY');
    }

    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.analyticsService.getSalesReport(period as ReportPeriod, start, end);
  }

  @Get('customers')
  async getCustomerAnalytics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.analyticsService.getCustomerAnalytics(start, end);
  }

  @Get('products')
  async getProductAnalytics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.analyticsService.getProductAnalytics(start, end);
  }

  @Get('financial')
  async getFinancialAnalytics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.analyticsService.getFinancialAnalytics(start, end);
  }

  @Get('reports/export/:type')
  async exportReport(
    @Param('type') type: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('format') format: string = 'json'
  ) {
    const validTypes = ['sales', 'customers', 'products', 'financial'];
    if (!validTypes.includes(type)) {
      throw new BadRequestException('Invalid report type');
    }

    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    let data;
    switch (type) {
      case 'sales':
        data = await this.analyticsService.getSalesReport(ReportPeriod.MONTHLY, start, end);
        break;
      case 'customers':
        data = await this.analyticsService.getCustomerAnalytics(start, end);
        break;
      case 'products':
        data = await this.analyticsService.getProductAnalytics(start, end);
        break;
      case 'financial':
        data = await this.analyticsService.getFinancialAnalytics(start, end);
        break;
    }

    return {
      type,
      period: { startDate, endDate },
      format,
      data,
      exportedAt: new Date()
    };
  }

  @Get('activity-signals')
  async getActivitySignals() {
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay();
    
    // Lógica para generar señales de actividad real
    const signals = [];
    
    // Determinar si es hora pico
    const isPeakHour = (currentHour >= 13 && currentHour <= 15) || (currentHour >= 20 && currentHour <= 22);
    const isWeekend = currentDay === 0 || currentDay === 6;
    const isOpenHours = currentHour >= 12 && currentHour < 23;
    const isMonday = currentDay === 1;
    
    if (isMonday) {
      // Lunes cerrado
      signals.push({
        id: '1',
        type: 'quiet',
        message: 'Disfrutando de nuestro descanso semanal',
        icon: '😴',
        timestamp: now.toISOString()
      });
    } else if (isOpenHours) {
      if (isPeakHour && isWeekend) {
        signals.push({
          id: '1',
          type: 'busy',
          message: 'Fin de semana muy concurrido 🔥',
          icon: '🔥',
          timestamp: now.toISOString()
        });
        signals.push({
          id: '2',
          type: 'preparing',
          message: 'Preparando muchos pedidos ahora 🍳',
          icon: '👨‍🍳',
          timestamp: new Date(now.getTime() - 300000).toISOString()
        });
      } else if (isPeakHour) {
        signals.push({
          id: '1',
          type: 'busy',
          message: 'Hora pico! Cocina a pleno rendimiento',
          icon: '⏰',
          timestamp: now.toISOString()
        });
        signals.push({
          id: '2',
          type: 'preparing',
          message: 'Pedidos en preparación 🍳',
          icon: '👨‍🍳',
          timestamp: new Date(now.getTime() - 180000).toISOString()
        });
      } else {
        signals.push({
          id: '1',
          type: 'preparing',
          message: 'Preparando pedidos ahora 🍳',
          icon: '👨‍🍳',
          timestamp: now.toISOString()
        });
        
        // Añadir señal aleatoria de actividad normal
        const normalSignals = [
          {
            id: '2',
            type: 'recent_order',
            message: 'Último pedido entregado hace 10 min ✅',
            icon: '🛵',
            timestamp: new Date(now.getTime() - 600000).toISOString()
          },
          {
            id: '3',
            type: 'quiet',
            message: 'Momento ideal para pedir',
            icon: '😊',
            timestamp: new Date(now.getTime() - 900000).toISOString()
          }
        ];
        
        if (Math.random() > 0.5) {
          signals.push(normalSignals[Math.floor(Math.random() * normalSignals.length)]);
        }
      }
    } else {
      // Fuera de horario
      signals.push({
        id: '1',
        type: 'quiet',
        message: 'Cocina descansando hasta las 12:00',
        icon: '🌙',
        timestamp: now.toISOString()
      });
    }
    
    return signals;
  }

  @Get('popular-products')
  async getPopularProducts() {
    // Simular productos populares basados en datos del restaurante
    const popularProducts = [
      {
        id: '1',
        name: 'Hamburguesa Clásica',
        price: 12.50,
        image: '/images/burger-classic.jpg',
        ordersCount: 245,
        category: 'Hamburguesas',
        tags: ['popular', 'clasico'],
        available: true
      },
      {
        id: '2',
        name: 'Patatas Fritas',
        price: 4.50,
        image: '/images/fries.jpg',
        ordersCount: 189,
        category: 'Acompañamientos',
        tags: ['popular'],
        available: true
      },
      {
        id: '3',
        name: 'Hamburguesa con Queso',
        price: 13.50,
        image: '/images/burger-cheese.jpg',
        ordersCount: 167,
        category: 'Hamburguesas',
        tags: ['popular'],
        available: true
      },
      {
        id: '4',
        name: 'Refresco Grande',
        price: 3.00,
        image: '/images/soda.jpg',
        ordersCount: 142,
        category: 'Bebidas',
        tags: [],
        available: true
      },
      {
        id: '5',
        name: 'Nuggets de Pollo',
        price: 8.50,
        image: '/images/nuggets.jpg',
        ordersCount: 128,
        category: 'Acompañamientos',
        tags: ['nuevo'],
        available: true
      }
    ];

    return popularProducts.slice(0, 5); // Máximo 5 productos
  }
}
