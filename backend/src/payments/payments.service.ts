import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventBusService } from '../common/events/event-bus.service';
import { OrderStatus, PaymentMethod, Role } from '../../../shared/enums';
import { NotificationsService } from '../notifications/notifications.service';
import Stripe from 'stripe';

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
  private readonly stripe?: Stripe;

  // Configuración de métodos de pago
  private readonly paymentMethods: PaymentMethodConfig[] = [
    {
      type: PaymentMethod.CARD,
      enabled: true,
      fee: 0,
      minAmount: 1,
      maxAmount: 10000,
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
    private readonly notificationsService?: NotificationsService
  ) {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (stripeSecretKey) {
      this.stripe = new Stripe(stripeSecretKey, { apiVersion: '2022-11-15' });
    }
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
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }

    if (user.role !== Role.ADMIN && order.userId !== user.userId) {
      throw new ForbiddenException('No tienes permiso para pagar este pedido.');
    }

    if (order.paymentMethod !== PaymentMethod.CARD && order.paymentMethod !== PaymentMethod.STRIPE) {
      throw new BadRequestException('Este pedido no requiere pago con tarjeta.');
    }

    if (!this.stripe) {
      throw new InternalServerErrorException('Stripe secret key not configured');
    }

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(order.total * 100),
      currency: 'eur',
      metadata: { orderId },
      automatic_payment_methods: { enabled: true },
    });

    await this.prisma.order.update({
      where: { id: orderId },
      data: { paymentIntentId: paymentIntent.id },
    });

    return { clientSecret: paymentIntent.client_secret };
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
      paymentMethod: order.paymentMethod
    };

    // Generar número de factura
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(order.id).padStart(6, '0')}`;
    
    // Crear registro de factura
    const invoice = await this.prisma.invoice.create({
      data: {
        orderId: order.id,
        userId: order.userId,
        invoiceNumber,
        data: invoiceData,
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
    if (!this.stripe) {
      throw new InternalServerErrorException('Stripe secret key not configured');
    }

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
        paidAt: new Date(),
      },
    });

    // Generar factura automáticamente
    await this.generateInvoice(orderId);

    this.eventBus.emit('OrderStatusChanged', {
      orderId: updated.id,
      previousStatus: order.status,
      newStatus: updated.status,
    });

    await this.notificationsService?.sendOrderUpdate(
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

    await this.notificationsService?.sendError(
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
      await this.notificationsService?.sendOrderUpdate(
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
    }, {} as Record<PaymentMethod, number>);

    return {
      totalOrders: orders.length,
      totalRevenue,
      averageOrderValue,
      paymentMethodStats,
      period: { startDate, endDate }
    };
  }
}
