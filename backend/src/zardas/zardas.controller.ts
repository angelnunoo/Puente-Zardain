import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ZardasService } from './zardas.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('zardas')
export class ZardasController {
  constructor(private zardasService: ZardasService) {}

  @UseGuards(JwtAuthGuard)
  @Get(':userId')
  getZardas(@Param('userId') userId: string) {
    return this.zardasService.getZardas(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':userId/add')
  addZardas(@Param('userId') userId: string, @Body() body: { amount: number; reason: string }) {
    return this.zardasService.addZardas(userId, body.amount, body.reason);
  }
}