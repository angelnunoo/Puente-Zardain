import { Body, Controller, ForbiddenException, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ZardasService } from './zardas.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/guards/roles.decorator';
import { Role } from '../../../shared/enums';

@Controller('zardas')
export class ZardasController {
  constructor(private zardasService: ZardasService) {}

  private assertCanAccessZardas(requestUser: { userId: string; role: Role }, targetUserId: string) {
    if (requestUser.role !== Role.ADMIN && requestUser.userId !== targetUserId) {
      throw new ForbiddenException('No puedes acceder al saldo de otro usuario');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get(':userId/balance')
  getBalance(@Param('userId') userId: string, @Req() req: any) {
    this.assertCanAccessZardas(req.user, userId);
    return this.zardasService.getBalance(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':userId/history')
  getHistory(@Param('userId') userId: string, @Req() req: any) {
    this.assertCanAccessZardas(req.user, userId);
    return this.zardasService.getHistory(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':userId/redeem')
  redeemZardas(@Param('userId') userId: string, @Body() body: { discountAmount: number; reason: string }, @Req() req: any) {
    this.assertCanAccessZardas(req.user, userId);
    return this.zardasService.redeemZardas(userId, body.discountAmount, body.reason);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post(':userId/adjust')
  adjustZardas(@Param('userId') userId: string, @Body() body: { amount: number; reason: string }, @Req() req: any) {
    return this.zardasService.adjustZardas(userId, body.amount, body.reason, req.user.userId);
  }
}