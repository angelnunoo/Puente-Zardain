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
    return { status: this.kitchenService.getStatus() };
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