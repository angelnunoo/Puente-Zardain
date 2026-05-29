import {
  Controller,
  Post,
  Get,
  Req,
  UseGuards,
  Param,
  Query,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/guards/roles.decorator';
import { Role, PaymentMethod } from '../../../shared/enums';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('methods')
  @UseGuards(JwtAuthGuard)
  async getAvailablePaymentMethods(@Query('amount') amount: string) {
    const orderAmount = amount ? parseFloat(amount) : 0;
    return this.paymentsService.getAvailablePaymentMethods(orderAmount);
  }

  @Post('invoices/generate/:orderId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async generateInvoice(@Param('orderId') orderId: string, @Req() req: any) {
    return this.paymentsService.generateInvoice(orderId);
  }

  @Get('invoices')
  @UseGuards(JwtAuthGuard)
  async getInvoices(@Req() req: any) {
    return this.paymentsService.getInvoices(req.user.userId);
  }

  @Post('paypal/webhook')
  async paypalWebhook(@Req() req: any) {
    // Webhook para PayPal - implementar según documentación de PayPal
    return { received: true, message: 'PayPal webhook endpoint - to be implemented' };
  }

  @Post('bizum/webhook')
  async bizumWebhook(@Req() req: any) {
    // Webhook para Bizum - implementar según documentación de Bizum
    return { received: true, message: 'Bizum webhook endpoint - to be implemented' };
  }

  // ==================== MÉTRICAS ====================

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getPaymentStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.paymentsService.getPaymentStats(start, end);
  }

  // ==================== UTILIDADES ====================

  @Get('methods/fees')
  @UseGuards(JwtAuthGuard)
  async getPaymentFees() {
    // Devuelve información de comisiones para cada método
    return {
      CARD: { fee: 0.029, fixed: 0.25, description: '2.9% + €0.25' },
      PAYPAL: { fee: 0.034, fixed: 0, description: '3.4%' },
      BIZUM: { fee: 0.015, fixed: 0, description: '1.5%' },
      CASH: { fee: 0, fixed: 0, description: 'Sin comisión' },
    };
  }
}
