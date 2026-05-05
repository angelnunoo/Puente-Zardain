import { Controller, Get, Put, Body } from '@nestjs/common';
import { KitchenService } from './kitchen.service';

@Controller('kitchen')
export class KitchenController {
  constructor(private kitchenService: KitchenService) {}

  @Get('status')
  getStatus() {
    return { status: this.kitchenService.getStatus() };
  }

  @Put('status')
  setStatus(@Body() body: { status: string }) {
    this.kitchenService.setStatus(body.status);
    return { status: this.kitchenService.getStatus() };
  }
}