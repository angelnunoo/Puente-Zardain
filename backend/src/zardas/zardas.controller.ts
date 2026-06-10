import { Controller, ForbiddenException, Get, Post, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ZardasService } from './zardas.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/guards/roles.decorator';
import { Role } from '../../../shared/enums';

@Controller('zardas')
export class ZardasController {
  constructor(private zardasService: ZardasService) {}

  @UseGuards(JwtAuthGuard)
  @Get(':userId/balance')
  getBalance(@Param('userId') userId: string, @Req() req: any) {
    this.assertCanAccessUser(userId, req.user);
    return this.zardasService.getBalance(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':userId/history')
  getHistory(@Param('userId') userId: string, @Req() req: any) {
    this.assertCanAccessUser(userId, req.user);
    return this.zardasService.getHistory(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':userId/redeem')
  redeemZardas(@Param('userId') userId: string, @Body() body: { discountAmount: number; reason: string }, @Req() req: any) {
    this.assertCanAccessUser(userId, req.user);
    return this.zardasService.redeemZardas(userId, body.discountAmount, body.reason);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post(':userId/adjust')
  adjustZardas(@Param('userId') userId: string, @Body() body: { amount: number; reason: string }, @Req() req: any) {
    return this.zardasService.adjustZardas(userId, body.amount, body.reason, req.user.userId);
  }

  private assertCanAccessUser(targetUserId: string, requester?: { userId?: string; role?: Role }) {
    if (requester?.role === Role.ADMIN || requester?.userId === targetUserId) {
      return;
    }

    throw new ForbiddenException('No tienes permiso para acceder a estos Zardas');
  }
}