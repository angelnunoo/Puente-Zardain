import { 
  Controller, 
  Get, 
  Post, 
  Param, 
  Body, 
  UseGuards,
  Req,
  BadRequestException
} from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/guards/roles.decorator';
import { Role } from '../../../../shared/enums';

@Controller('gamification')
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  @Get('balance')
  @UseGuards(JwtAuthGuard)
  async getUserBalance(@Req() req: any) {
    return this.gamificationService.getUserBalance(req.user.userId);
  }

  @Get('leaderboard')
  async getLeaderboard(@Query('limit') limit?: number) {
    return this.gamificationService.getLeaderboard(limit || 50);
  }

  @Get('rewards')
  @UseGuards(JwtAuthGuard)
  async getUserRewards(@Req() req: any) {
    return this.gamificationService.getUserRewards(req.user.userId);
  }

  @Post('award')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async awardZardas(@Body() data: { userId: string; amount: number; reason: string; source: string }) {
    return this.gamificationService.awardZardas(data.userId, data.amount, data.reason, data.source);
  }

  @Post('redeem')
  @UseGuards(JwtAuthGuard)
  async redeemZardas(@Req() req: any, @Body() data: { amount: number; reason: string }) {
    return this.gamificationService.redeemZardas(req.user.userId, data.amount, data.reason);
  }

  @Post('daily-login')
  @UseGuards(JwtAuthGuard)
  async processDailyLogin(@Req() req: any) {
    return this.gamificationService.processDailyLogin(req.user.userId);
  }

  @Post('birthday-reward')
  @UseGuards(JwtAuthGuard)
  async processBirthdayReward(@Req() req: any) {
    return this.gamificationService.processBirthdayReward(req.user.userId);
  }

  @Post('order-reward')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async processOrderReward(@Body() data: { userId: string; orderTotal: number }) {
    return this.gamificationService.processOrderRewards(data.userId, data.orderTotal);
  }

  @Post('review-reward')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async processReviewReward(@Body() data: { userId: string; reviewId: string }) {
    return this.gamificationService.processReviewReward(data.userId, data.reviewId);
  }

  @Post('referral-reward')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async processReferralReward(@Body() data: { referrerId: string; referredId: string }) {
    return this.gamificationService.processReferralReward(data.referrerId, data.referredId);
  }
}
