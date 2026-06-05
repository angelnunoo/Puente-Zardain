import { Body, Controller, ForbiddenException, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
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
    return this.zardasService.getBalance(this.resolveUserId(userId, req.user));
  }

  @UseGuards(JwtAuthGuard)
  @Get(':userId/history')
  getHistory(@Param('userId') userId: string, @Req() req: any) {
    return this.zardasService.getHistory(this.resolveUserId(userId, req.user));
  }

  @UseGuards(JwtAuthGuard)
  @Post(':userId/redeem')
  redeemZardas(@Param('userId') userId: string, @Body() body: { discountAmount: number; reason: string }, @Req() req: any) {
    return this.zardasService.redeemZardas(this.resolveUserId(userId, req.user), body.discountAmount, body.reason);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post(':userId/adjust')
  adjustZardas(@Param('userId') userId: string, @Body() body: { amount: number; reason: string }, @Req() req: any) {
    return this.zardasService.adjustZardas(userId, body.amount, body.reason, req.user.userId);
  }

  private resolveUserId(paramUserId: string, user: { userId: string; role: Role }) {
    if (user.role === Role.ADMIN || user.userId === paramUserId) {
      return paramUserId;
    }

    throw new ForbiddenException('No tienes permiso para consultar estos Zardas.');
  }
}