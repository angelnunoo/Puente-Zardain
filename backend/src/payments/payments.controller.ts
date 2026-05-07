import { BadRequestException, Body, Controller, Headers, InternalServerErrorException, Post, Req, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/guards/roles.decorator';
import { Role } from '../../../shared/enums';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('intent')
  async createIntent(@Req() req: any, @Body() body: { orderId: string }) {
    return this.paymentsService.createPaymentIntent(body.orderId, req.user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('refund')
  async refund(@Body() body: { paymentIntentId: string }) {
    return this.paymentsService.refundPayment(body.paymentIntentId);
  }

  @Post('webhook')
  async webhook(@Req() req: any, @Headers('stripe-signature') signature: string) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new InternalServerErrorException('Stripe webhook secret not configured');
    }
    if (!signature) {
      throw new BadRequestException('Missing Stripe signature header');
    }
    const event = this.paymentsService.constructEvent(req.body, signature, webhookSecret);
    return this.paymentsService.handleWebhook(event);
  }
}
