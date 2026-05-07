import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EventBusService } from '../common/events/event-bus.service';
import { ScheduleService } from '../schedule/schedule.service';
import { ZardasService } from '../zardas/zardas.service';
import { OrderStatus, Role } from '../../../shared/enums';
import { CreateOrderDto } from './dto/create-order.dto';
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
      await this.logFraudAttempt({ userId, ip, reason: 'Dirección de entrega inválida' });
      throw new BadRequestException('Las entregas solo están disponibles para Arroyomolinos.');
    }

    await this.assertOrderLimit(userId, ip);

    const itemIds = payload.items.map((item) => item.productId);
    const products = await this.ordersRepository.findProductsByIds(itemIds);

    if (products.length !== itemIds.length) {
      throw new BadRequestException('One or more products are invalid or unavailable');
    }

    const priceMap = new Map(products.map((product) => [product.id, product.price]));
    const subtotal = OrderDomain.calculateTotal(
      payload.items.map((item) => ({
        quantity: item.quantity,
        price: priceMap.get(item.productId) ?? 0,
      })),
    );

    const deliveryFee = payload.delivery ? this.calculateDeliveryFee(subtotal) : 0;
    const tax = this.calculateTax(subtotal);
    const total = subtotal + tax + deliveryFee;

    if (total > 250) {
      await this.logFraudAttempt({ userId, ip, reason: 'Monto total excesivo' });
      throw new BadRequestException('El monto del pedido supera el límite permitido.');
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
          delivery: payload.delivery,
          address: payload.address,
          paymentMethod: payload.paymentMethod,
          status: OrderStatus.PENDING,
          ip,
          items: {
            create: payload.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
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

      this.eventBus.emit('OrderCreated', { orderId: created.id, userId, total });
      return created;
    });

    // Add Zardas for the order
    const zardasEarned = Math.floor(total * 0.1); // 10% of order total as Zardas
    await this.zardasService.addZardas(userId, zardasEarned, `Pedido ${order.id.slice(0, 8)}`);

    return order;
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

  async findAll(user: { id: string; role: string }) {
    if (!user) {
      throw new BadRequestException('User context is required to list orders');
    }

    return this.ordersRepository.findAllForUser(user.id, user.role as Role);
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

    if (payload.status === OrderStatus.DELIVERED) {
      this.eventBus.emit('OrderDelivered', { orderId: id, userId: order.userId });
    }

    return updated;
  }
}
