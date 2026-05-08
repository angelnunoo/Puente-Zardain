import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { KitchenService } from './kitchen.service';
import { OrdersService } from '../orders/orders.service';
import { ScheduleService } from '../schedule/schedule.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/guards/roles.decorator';
import { Role } from '../../../shared/enums';

@Controller('kitchen')
export class KitchenController {
  constructor(
    private kitchenService: KitchenService,
    private ordersService: OrdersService,
    private scheduleService: ScheduleService,
  ) {}

  @Get('status')
  getStatus() {
    const kitchenStatus = this.kitchenService.getStatus();
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay();
    
    let isOpen = kitchenStatus === 'open';
    let nextOpenTime = '';
    let estimatedTime = '15-20 min';
    
    // Lógica de horario
    const isMonday = currentDay === 1;
    const isOpenHours = currentHour >= 12 && currentHour < 23;
    
    if (isMonday) {
      isOpen = false;
      nextOpenTime = 'Mañana a las 12:00';
    } else if (!isOpenHours) {
      isOpen = false;
      if (currentHour < 12) {
        nextOpenTime = 'Hoy a las 12:00';
      } else {
        nextOpenTime = 'Mañana a las 12:00';
      }
    }
    
    // Ajustar tiempo estimado según estado
    if (kitchenStatus === 'saturated') {
      estimatedTime = '25-35 min';
    } else if (kitchenStatus === 'closed') {
      estimatedTime = 'Cocina cerrada';
    }
    
    return {
      isOpen,
      status: isOpen ? 'open' : (isMonday ? 'unavailable' : 'closed'),
      nextOpenTime,
      currentSchedule: isOpen ? 'Abierto ahora' : 'Cerrado',
      message: isOpen ? '¡Estamos abiertos y listos para servirte!' : 'Estamos cerrados ahora',
      estimatedTime
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('metrics')
  async getMetrics() {
    const schedule = await this.scheduleService.getPublicSchedule();
    const ordersMetrics = await this.ordersService.getDashboardMetrics();

    return {
      kitchenStatus: this.kitchenService.getStatus(),
      scheduleStatus: schedule.status,
      ...ordersMetrics,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Put('status')
  setStatus(@Body() body: { status: string }) {
    this.kitchenService.setStatus(body.status);
    return { status: this.kitchenService.getStatus() };
  }
}