import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, OrderStatus } from '../../../shared/enums';

/** Fields safe to return to clients. Never include password or 2FA secrets. */
export const orderUserSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
} as const;

const orderInclude = {
  items: true,
  user: { select: orderUserSelect },
} as const;

@Injectable()
export class OrdersRepository {
  constructor(private prisma: PrismaService) {}

  async findAllForUser(userId: string, role: Role) {
    if (role === Role.ADMIN) {
      return this.prisma.order.findMany({ include: orderInclude });
    }
    return this.prisma.order.findMany({ where: { userId }, include: orderInclude });
  }

  async findById(id: string) {
    return this.prisma.order.findUnique({ where: { id }, include: orderInclude });
  }

  async findProductsByIds(ids: string[]) {
    return this.prisma.product.findMany({ where: { id: { in: ids } } });
  }

  async countByStatuses(statuses: OrderStatus[]) {
    return this.prisma.order.count({ where: { status: { in: statuses } } });
  }

  async countToday() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.prisma.order.count({ where: { createdAt: { gte: today } } });
  }

  async averageDeliveredMinutes() {
    const deliveries = await this.prisma.order.findMany({
      where: { status: OrderStatus.DELIVERED },
      select: { createdAt: true, updatedAt: true },
    });

    if (!deliveries.length) {
      return 20;
    }

    const totalMinutes = deliveries.reduce((sum, order) => {
      const delta = order.updatedAt.getTime() - order.createdAt.getTime();
      return sum + delta / 60000;
    }, 0);

    return Math.max(10, Math.round(totalMinutes / deliveries.length));
  }

  async createOrder(data: Parameters<PrismaService['order']['create']>[0]) {
    return this.prisma.order.create(data);
  }

  async updateStatus(id: string, status: OrderStatus) {
    return this.prisma.order.update({ where: { id }, data: { status } });
  }
}
