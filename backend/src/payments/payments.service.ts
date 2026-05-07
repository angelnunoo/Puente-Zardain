import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';
import { EventBusService } from '../common/events/event-bus.service';
import { OrderStatus, PaymentMethod, Role } from '../../../shared/enums';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(private readonly prisma: PrismaService, private readonly eventBus: EventBusService) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2022-11-15',
    });
  }

  async createPaymentIntent(orderId: string, user: { userId: string; role: Role }) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.userId !== user.userId && user.role !== Role.ADMIN) {
      throw new ForbiddenException('No tienes permiso para pagar este pedido.');
    }

    if (order.paymentMethod !== PaymentMethod.CARD) {
      throw new BadRequestException('El pedido no está configurado para pago con tarjeta.');
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('No se puede pagar un pedido cancelado.');
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

    return { clientSecret: intent.client_secret };
  }

  async refundPayment(paymentIntentId: string) {
    const intent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
    if (!intent || typeof intent.charges !== 'object') {
      throw new NotFoundException('Payment intent not found');
    }

    const chargeId = intent.charges.data[0]?.id;
    if (!chargeId) {
      throw new InternalServerErrorException('No charge found for payment intent');
    }

    const refund = await this.stripe.refunds.create({ charge: chargeId });
    return refund;
  }

  constructEvent(payload: Buffer | string, signature: string, webhookSecret: string) {
    try {
      return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (error) {
      throw new BadRequestException('Invalid Stripe webhook signature');
    }
  }

  async handleWebhook(event: Stripe.Event) {
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const orderId = paymentIntent.metadata.orderId;
      if (orderId) {
        const order = await this.prisma.order.findUnique({ where: { id: orderId } });
        if (order) {
          const updated = await this.prisma.order.update({
            where: { id: orderId },
            data: {
              paymentStatus: 'SUCCEEDED',
              status: order.status === OrderStatus.PENDING ? OrderStatus.CONFIRMED : order.status,
            },
          });

          this.eventBus.emit('OrderStatusChanged', {
            orderId: updated.id,
            previousStatus: order.status,
            newStatus: updated.status,
          });
        }
      }
    }
    if (event.type === 'charge.refunded') {
      const charge = event.data.object as Stripe.Charge;
      const orderId = charge.metadata?.orderId as string;
      if (orderId) {
        await this.prisma.order.update({
          where: { id: orderId },
          data: { paymentStatus: 'REFUNDED' },
        });
      }
    }
    return { received: true };
  }
}
