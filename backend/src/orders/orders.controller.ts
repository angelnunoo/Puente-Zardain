import { Body, Controller, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/guards/roles.decorator';
import { Role } from '../../../shared/enums';
import { CreateOrderDto, PreviewOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Req() req: any, @Body() payload: CreateOrderDto) {
    const ip = req.ip || req.connection?.remoteAddress;
    return this.ordersService.create(req.user.userId, payload, ip);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Req() req: any) {
    return this.ordersService.findAll(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('preview')
  preview(@Req() req: any, @Body() payload: PreviewOrderDto) {
    return this.ordersService.preview(req.user.userId, payload);
  }

  @Get('estimate')
  getEstimate() {
    return this.ordersService.getEstimate();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Put(':id/status')
  updateStatus(@Param('id') id: string, @Body() payload: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, payload);
  }
}
