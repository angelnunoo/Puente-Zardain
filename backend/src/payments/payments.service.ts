import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';
import { EventBusService } from '../common/events/event-bus.service';
import { OrderStatus, PaymentMethod, Role } from '../../../shared/enums';
import { NotificationsService } from '../notifications/notifications.service';

interface PaymentMethodConfig {
  type: PaymentMethod;
  enabled: boolean;
  fee: number;
  minAmount: number;
  maxAmount: number;
}

interface InvoiceData {
  orderId: string;
  userId: string;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
    address?: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  deliveryFee: number;
  total: number;
  paymentMethod: PaymentMethod;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger('PaymentsService');
  private stripe: Stripe;

  // Configuración de métodos de pago
  private readonly paymentMethods: PaymentMethodConfig[] = [
    {
      type: PaymentMethod.CARD,
      enabled: true,
      fee: 0.029, // 2.9% + €0.25
      minAmount: 1,
      maxAmount: 10000,
    },
    {
      type: PaymentMethod.PAYPAL,
      enabled: true,
      fee: 0.034, // 3.4%
      minAmount: 1,
      maxAmount: 10000,
    },
    {
      type: PaymentMethod.BIZUM,
      enabled: true,
      fee: 0.015, // 1.5%
      minAmount: 1,
      maxAmount: 500,
    },
    {
      type: PaymentMethod.CASH,
      enabled: true,
      fee: 0,
      minAmount: 1,
      maxAmount: 10000,
    },
  ];

  constructor(
    private readonly prisma: PrismaService, 
    private readonly eventBus: EventBusService,
    private readonly notificationsService: NotificationsService
  ) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2022-11-15',
    });
  }

  // ==================== MÉTODOS DE PAGO ====================

  async getAvailablePaymentMethods(amount: number): Promise<PaymentMethodConfig[]> {
    return this.paymentMethods.filter(method => 
      method.enabled && 
      amount >= method.minAmount && 
      amount <= method.maxAmount
    );
  }

  async createPaymentIntent(orderId: string, user: { userId: string; role: Role }) {
    const order = await this.prisma.order.findUnique({ 
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true
          }
        },
        user: true
      }
    });

    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }

    if (order.userId !== user.userId && user.role !== Role.ADMIN) {
      throw new ForbiddenException('No tienes permiso para pagar este pedido.');
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('No se puede pagar un pedido cancelado.');
    }

    if (order.paymentStatus === 'SUCCEEDED') {
      throw new BadRequestException('Este pedido ya ha sido pagado.');
    }

    const amount = Math.round(order.total * 100);
    const intent = await this.stripe.paymentIntents.create({
      amount,
      currency: 'eur',
      metadata: { orderId },
      automatic_payment_methods: { enabled: true },
    });

    await this.prisma.order.update({
      where: { id: orderId },
      data: { paymentIntentId: intent.id },
    });

    return { 
      clientSecret: intent.client_secret,
      orderId: order.id,
      amount: order.total,
      currency: 'eur'
    };
  }

  async createPayPalPayment(orderId: string, user: { userId: string; role: Role }) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId }, include: { user: true } });
    
    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }

    if (order.userId !== user.userId && user.role !== Role.ADMIN) {
      throw new ForbiddenException('No tienes permiso para pagar este pedido.');
    }

    // Simulación de PayPal - en producción se integraría PayPal SDK
    const paypalUrl = `https://www.paypal.com/paynow?token=${orderId}&amount=${order.total}`;
    
    await this.prisma.order.update({
      where: { id: orderId },
      data: { paymentMethod: PaymentMethod.PAYPAL },
    });

    return { 
      paymentUrl: paypalUrl,
      orderId: order.id,
      amount: order.total
    };
  }

  async createBizumPayment(orderId: string, user: { userId: string; role: Role }) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId }, include: { user: true } });
    
    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }

    if (order.userId !== user.userId && user.role !== Role.ADMIN) {
      throw new ForbiddenException('No tienes permiso para pagar este pedido.');
    }

    // Simulación de Bizum - en producción se integraría API de Bizum
    const bizumReference = `BIZUM_${orderId}_${Date.now()}`;
    
    await this.prisma.order.update({
      where: { id: orderId },
      data: { 
        paymentMethod: PaymentMethod.BIZUM,
        paymentIntentId: bizumReference
      },
    });

    return { 
      reference: bizumReference,
      phoneNumber: order.user.phone,
      amount: order.total,
      message: `Paga ${order.total}€ con Bizum usando la referencia ${bizumReference}`
    };
  }

  // ==================== REEMBOLSOS ====================

  async refundPayment(paymentIntentId: string, reason?: string) {
    const intent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
    const intentWithCharges = intent as Stripe.PaymentIntent & { charges?: { data: Array<{ id: string }> } };
    if (!intentWithCharges.charges) {
      throw new NotFoundException('Payment intent not found');
    }

    const chargeId = intentWithCharges.charges.data[0]?.id;
    if (!chargeId) {
      throw new InternalServerErrorException('No charge found for payment intent');
    }

    const refund = await this.stripe.refunds.create({ 
      charge: chargeId,
      reason: reason as any,
      metadata: { reason: reason || 'Customer request' }
    });

    // Actualizar estado del pedido
    if (intent.metadata.orderId) {
      await this.prisma.order.update({
        where: { id: intent.metadata.orderId },
        data: { paymentStatus: 'REFUNDED' },
      });

      // Notificar al cliente
      this.notificationsService.sendOrderUpdate(
        intent.metadata.orderId,
        'REFUNDED',
        `Se ha procesado un reembolso para tu pedido #${intent.metadata.orderId}`,
        intent.metadata.userId
      );
    }

    this.logger.log(`Refund processed: ${refund.id} for payment intent ${paymentIntentId}`);
    return refund;
  }

  async processCashPayment(orderId: string, user: { userId: string; role: Role }) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    
    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }

    if (order.userId !== user.userId && user.role !== Role.ADMIN) {
      throw new ForbiddenException('No tienes permiso para procesar este pedido.');
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        paymentMethod: PaymentMethod.CASH,
        paymentStatus: 'PENDING',
        status: OrderStatus.CONFIRMED,
      },
    });

    this.eventBus.emit('OrderStatusChanged', {
      orderId: updated.id,
      previousStatus: order.status,
      newStatus: updated.status,
    });

    this.notificationsService.sendOrderUpdate(
      orderId,
      'CONFIRMED',
      'Tu pedido ha sido confirmado. Pagarás en efectivo al recibirlo.',
      user.userId
    );

    return updated;
  }

  // ==================== FACTURACIÓN ====================

  async generateInvoice(orderId: string): Promise<any> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true
          }
        },
        user: true
      }
    });

    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }

    const invoiceData: InvoiceData = {
      orderId: order.id,
      userId: order.userId,
      customerInfo: {
        name: order.user.name,
        email: order.user.email,
        phone: order.user.phone,
      },
      items: order.items.map(item => ({
        name: item.product.name,
        quantity: item.quantity,
        unitPrice: item.price,
        total: item.price * item.quantity
      })),
      subtotal: order.subtotal,
      tax: order.tax,
      deliveryFee: order.deliveryFee,
      total: order.total,
      paymentMethod: order.paymentMethod as PaymentMethod
    };

    // Generar número de factura
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(order.id).padStart(6, '0')}`;
    
    // Crear registro de factura
    const invoice = await this.prisma.invoice.create({
      data: {
        orderId: order.id,
        userId: order.userId,
        invoiceNumber,
        data: invoiceData as unknown as Prisma.InputJsonValue,
        pdfUrl: `/invoices/${invoiceNumber}.pdf`, // URL simulada
        createdAt: new Date(),
      }
    });

    this.logger.log(`Invoice generated: ${invoiceNumber} for order ${orderId}`);
    return invoice;
  }

  async getInvoices(userId: string) {
    return this.prisma.invoice.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        order: {
          select: {
            id: true,
            total: true,
            status: true,
            createdAt: true
          }
        }
      }
    });
  }

  // ==================== WEBHOOKS ====================

  constructEvent(payload: Buffer | string, signature: string, webhookSecret: string) {
    try {
      return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (error) {
      throw new BadRequestException('Invalid Stripe webhook signature');
    }
  }

  async handleWebhook(event: Stripe.Event) {
    this.logger.log(`Processing webhook event: ${event.type}`);

    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentFailure(event.data.object as Stripe.PaymentIntent);
        break;
      case 'charge.refunded':
        await this.handleRefund(event.data.object as Stripe.Charge);
        break;
      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  }

  private async handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
    const orderId = paymentIntent.metadata.orderId;
    if (!orderId) return;

    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return;

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'SUCCEEDED',
        status: order.status === OrderStatus.PENDING ? OrderStatus.CONFIRMED : order.status,
      },
    });

    // Generar factura automáticamente
    await this.generateInvoice(orderId);

    this.eventBus.emit('OrderStatusChanged', {
      orderId: updated.id,
      previousStatus: order.status,
      newStatus: updated.status,
    });

    this.notificationsService.sendOrderUpdate(
      orderId,
      'CONFIRMED',
      '¡Pago exitoso! Tu pedido ha sido confirmado.',
      order.userId
    );
  }

  private async handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
    const orderId = paymentIntent.metadata.orderId;
    if (!orderId) return;

    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return;

    await this.prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: 'FAILED' },
    });

    this.notificationsService.sendError(
      'Pago Fallido',
      'No se pudo procesar tu pago. Por favor, intenta con otro método.',
      [order.userId]
    );
  }

  private async handleRefund(charge: Stripe.Charge) {
    const orderId = charge.metadata?.orderId as string;
    if (!orderId) return;

    await this.prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: 'REFUNDED' },
    });

    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (order) {
      this.notificationsService.sendOrderUpdate(
        orderId,
        'REFUNDED',
        'Se ha procesado un reembolso para tu pedido.',
        order.userId
      );
    }
  }

  // ==================== MÉTRICAS ====================

  async getPaymentStats(startDate?: Date, endDate?: Date) {
    const where = startDate && endDate ? {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      paymentStatus: 'SUCCEEDED'
    } : { paymentStatus: 'SUCCEEDED' };

    const orders = await this.prisma.order.findMany({
      where,
      include: {
        user: true
      }
    });

    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

    const paymentMethodStats = orders.reduce((stats, order) => {
      stats[order.paymentMethod] = (stats[order.paymentMethod] || 0) + 1;
      return stats;
    }, {} as Record<string, number>);

    return {
      totalOrders: orders.length,
      totalRevenue,
      averageOrderValue,
      paymentMethodStats,
      period: { startDate, endDate }
    };
  }
}
