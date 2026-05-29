import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EventBusService } from '../common/events/event-bus.service';
import { ScheduleService } from '../schedule/schedule.service';
import { ZardasService } from '../zardas/zardas.service';
import { OrderStatus, Role } from '../../../shared/enums';
import { CreateOrderDto, PreviewOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderDomain } from './domain/order.entity';
import { OrdersRepository } from './orders.repository';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ordersRepository: OrdersRepository,
    private readonly eventBus: EventBusService,
    private readonly scheduleService: ScheduleService,
    private readonly zardasService: ZardasService,
  ) {}

  async create(userId: string, payload: CreateOrderDto, ip?: string) {
    await this.scheduleService.assertOpenForOrders();
    if (payload.delivery && !payload.address) {
      throw new BadRequestException('Delivery orders require an address.');
    }

    if (payload.delivery && !this.validateDeliveryAddress(payload.address || '')) {
      throw new BadRequestException('Las entregas solo están disponibles para Arroyomolinos.');
    }

    const itemIds = payload.items.map((item) => item.productId);
    const products = await this.ordersRepository.findProductsByIds(itemIds);

    if (products.length !== itemIds.length) {
      throw new BadRequestException('One or more products are invalid or unavailable');
    }

    // Aplicar oferta si existe y validar canje
    let discount = 0;
    let offerId: string | undefined = undefined;
    let offerNote: string | undefined = undefined;
    let offerToRedeem: any;
    let redemptionCost = 0;

    const priceMap = new Map(products.map((product) => [product.id, product.price]));
    const subtotal = OrderDomain.calculateTotal(
      payload.items.map((item) => ({
        quantity: item.quantity,
        price: priceMap.get(item.productId) ?? 0,
      })),
    );

    const deliveryFee = payload.delivery ? this.calculateDeliveryFee(subtotal) : 0;
    const tax = this.calculateTax(subtotal);
    const baseTotal = subtotal + tax + deliveryFee;

    if (payload.offerId) {
      offerToRedeem = await this.zardasService.getOffer(payload.offerId);
      if (!offerToRedeem.active) {
        throw new BadRequestException('La oferta seleccionada no está disponible.');
      }

      const balance = await this.zardasService.getBalance(userId);
      if (balance.available < offerToRedeem.cost) {
        throw new BadRequestException('Saldo de Zardas insuficiente');
      }
      if (offerToRedeem.leagueMin && this.zardasService.getLeagueRank(balance.league) < this.zardasService.getLeagueRank(offerToRedeem.leagueMin)) {
        throw new BadRequestException('No cumple la liga mínima para esta oferta');
      }

      offerId = offerToRedeem.id;
      redemptionCost = offerToRedeem.cost;
      if (offerToRedeem.type === 'DESCUENTO_FIJO') {
        discount = Number(Math.min(offerToRedeem.value, baseTotal).toFixed(2));
      } else if (offerToRedeem.type === 'DESCUENTO_PORCENTAJE') {
        discount = Number((baseTotal * (offerToRedeem.value / 100)).toFixed(2));
      } else if (offerToRedeem.type === 'PRODUCTO_GRATIS') {
        offerNote = `Oferta gratis aplicada: ${offerToRedeem.name}`;
      }
    } else if (payload.redemption) {
      const balance = await this.zardasService.getBalance(userId);
      if (balance.available < payload.redemption.discountAmount) {
        throw new BadRequestException('Saldo de Zardas insuficiente');
      }
      discount = payload.redemption.discountAmount;
      redemptionCost = payload.redemption.discountAmount;
    }

    const total = Number((baseTotal - discount).toFixed(2));

    if (total < 15) {
      throw new BadRequestException('El pedido mínimo es de 15 €.');
    }

    const order = await this.prisma.$transaction(async (tx) => {
      for (const item of payload.items) {
        const product = products.find((p) => p.id === item.productId);
        if (product && product.stock < item.quantity) {
          throw new BadRequestException(`No hay suficiente stock para ${product.name}`);
        }
      }

      const created = await tx.order.create({
        data: {
          userId,
          subtotal,
          tax,
          deliveryFee,
          total,
          discount,
          delivery: payload.delivery,
          address: payload.address,
          paymentMethod: payload.paymentMethod,
          status: OrderStatus.PENDING,
          ip,
          offerId,
          notes: offerNote || undefined,
          items: {
            create: payload.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: priceMap.get(item.productId) ?? 0,
              subtotal: (priceMap.get(item.productId) ?? 0) * item.quantity,
              customizations: item.customizations,
            })),
          },
        },
        include: {
          items: true,
          user: true,
        },
      });

      for (const item of payload.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      await tx.chat.create({
        data: { orderId: created.id },
      });

      if (offerToRedeem) {
        await this.zardasService.redeemZardasInTransaction(
          tx,
          userId,
          redemptionCost,
          `Canje de oferta ${offerToRedeem.name} en pedido ${created.id.slice(0, 8)}`,
          created.id,
        );
      } else if (payload.redemption && redemptionCost > 0) {
        await this.zardasService.redeemZardasInTransaction(
          tx,
          userId,
          redemptionCost,
          `Canje en pedido ${created.id.slice(0, 8)}`,
          created.id,
        );
      }

      return created;
    });

    this.eventBus.emit('OrderCreated', { orderId: order.id, userId, total });
    return order;
  }

  async preview(userId: string, payload: PreviewOrderDto) {
    if (payload.delivery && !payload.address) {
      throw new BadRequestException('Delivery orders require an address.');
    }

    if (payload.delivery && !this.validateDeliveryAddress(payload.address || '')) {
      throw new BadRequestException('Las entregas solo están disponibles para Arroyomolinos.');
    }

    const itemIds = payload.items.map((item) => item.productId);
    const products = await this.ordersRepository.findProductsByIds(itemIds);

    if (products.length !== itemIds.length) {
      throw new BadRequestException('One or more products are invalid or unavailable');
    }

    let discount = 0;
    let offer = null;
    let offerId: string | undefined = undefined;
    let offerNote: string | undefined = undefined;

    const priceMap = new Map(products.map((product) => [product.id, product.price]));
    const subtotal = OrderDomain.calculateTotal(
      payload.items.map((item) => ({
        quantity: item.quantity,
        price: priceMap.get(item.productId) ?? 0,
      })),
    );

    const deliveryFee = payload.delivery ? this.calculateDeliveryFee(subtotal) : 0;
    const tax = this.calculateTax(subtotal);
    const baseTotal = subtotal + tax + deliveryFee;

    if (payload.offerId) {
      offer = await this.zardasService.getOffer(payload.offerId);
      if (!offer.active) {
        throw new BadRequestException('La oferta seleccionada no está disponible.');
      }

      const balance = await this.zardasService.getBalance(userId);
      if (balance.available < offer.cost) {
        throw new BadRequestException('Saldo de Zardas insuficiente');
      }
      if (offer.leagueMin && this.zardasService.getLeagueRank(balance.league) < this.zardasService.getLeagueRank(offer.leagueMin)) {
        throw new BadRequestException('No cumple la liga mínima para esta oferta');
      }

      offerId = offer.id;
      if (offer.type === 'DESCUENTO_FIJO') {
        discount = Number(Math.min(offer.value, baseTotal).toFixed(2));
      } else if (offer.type === 'DESCUENTO_PORCENTAJE') {
        discount = Number((baseTotal * (offer.value / 100)).toFixed(2));
      } else if (offer.type === 'PRODUCTO_GRATIS') {
        offerNote = `Oferta gratis aplicada: ${offer.name}`;
      }
    } else if (payload.redemption) {
      const balance = await this.zardasService.getBalance(userId);
      if (balance.available < payload.redemption.discountAmount) {
        throw new BadRequestException('Saldo de Zardas insuficiente');
      }
      discount = payload.redemption.discountAmount;
    }

    const total = Number((baseTotal - discount).toFixed(2));

    if (total < 15) {
      throw new BadRequestException('El pedido mínimo es de 15 €.');
    }

    return {
      items: payload.items.map((item) => {
        const product = products.find((p) => p.id === item.productId);
        return {
          productId: item.productId,
          name: product?.name || 'Producto',
          price: product?.price || 0,
          quantity: item.quantity,
          customizations: item.customizations,
        };
      }),
      subtotal,
      tax,
      deliveryFee,
      discount,
      total,
      delivery: payload.delivery,
      address: payload.address,
      offer: offer ? {
        id: offer.id,
        name: offer.name,
        type: offer.type,
        value: offer.value,
        description: offer.description,
        cost: offer.cost,
        leagueMin: offer.leagueMin,
      } : undefined,
      offerNote,
      redemption: payload.redemption ? { discountAmount: discount } : undefined,
    };
  }

  private validateDeliveryAddress(address: string) {
    const normalized = address.toLowerCase();
    return normalized.includes('arroyomolinos') || normalized.includes('28939');
  }

  private calculateDeliveryFee(subtotal: number) {
    return subtotal < 20 ? 4.5 : 2.5;
  }

  private calculateTax(subtotal: number) {
    return Number((subtotal * 0.1).toFixed(2));
  }

  private async assertOrderLimit(userId: string, ip?: string) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const count = await this.prisma.order.count({
      where: {
        userId,
        createdAt: { gte: oneHourAgo },
      },
    });

    if (count >= 4) {
      await this.logFraudAttempt({ userId, ip, reason: 'Límite de pedidos por hora alcanzado' });
      throw new BadRequestException('Has alcanzado el límite de pedidos por hora. Intenta más tarde.');
    }
  }

  private async logFraudAttempt(payload: { userId?: string; ip?: string; reason: string; phone?: string }) {
    return this.prisma.fraudAttempt.create({ data: payload });
  }

  async getEstimate() {
    const queueLength = await this.ordersRepository.countByStatuses([
      OrderStatus.PENDING,
      OrderStatus.CONFIRMED,
      OrderStatus.PREPARING,
    ]);
    const averageDelivered = await this.ordersRepository.averageDeliveredMinutes();
    const estimatedMinutes = Math.max(averageDelivered, 15) + queueLength * 3;

    return {
      queueLength,
      estimatedMinutes,
      averageDelivered,
    };
  }

  async getDashboardMetrics() {
    const pending = await this.ordersRepository.countByStatuses([OrderStatus.PENDING]);
    const preparing = await this.ordersRepository.countByStatuses([OrderStatus.PREPARING]);
    const ready = await this.ordersRepository.countByStatuses([OrderStatus.READY]);
    const deliveredToday = await this.ordersRepository.countToday();
    const averageDeliveredMinutes = await this.ordersRepository.averageDeliveredMinutes();

    return {
      pending,
      preparing,
      ready,
      deliveredToday,
      averageDeliveredMinutes,
      queueLength: pending + preparing,
    };
  }

  async findAll(user: { id?: string; userId?: string; role: string }) {
    if (!user) {
      throw new BadRequestException('User context is required to list orders');
    }

    const userId = user.userId || user.id;
    if (!userId) {
      throw new BadRequestException('User context is required to list orders');
    }

    return this.ordersRepository.findAllForUser(userId, user.role as Role);
  }

  async updateStatus(id: string, payload: UpdateOrderStatusDto) {
    const order = await this.ordersRepository.findById(id);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    OrderDomain.assertTransitionAllowed(order.status, payload.status);

    const updated = await this.ordersRepository.updateStatus(id, payload.status);

    this.eventBus.emit('OrderStatusChanged', {
      orderId: id,
      previousStatus: order.status,
      newStatus: payload.status,
    });

    if (payload.status === OrderStatus.READY && !order.zardasAwarded) {
      const zardasEarned = Math.floor(order.total / 5);
      if (zardasEarned > 0) {
        await this.zardasService.addZardas(order.userId, zardasEarned, `Pedido ${order.id.slice(0, 8)} completado`, 'ORDER_COMPLETION', order.id);
        await this.prisma.order.update({ where: { id }, data: { zardasAwarded: true } });
      }
    }

    if (payload.status === OrderStatus.DELIVERED) {
      this.eventBus.emit('OrderDelivered', { orderId: id, userId: order.userId });
    }

    return updated;
  }
}
