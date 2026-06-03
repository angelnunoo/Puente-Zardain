import { BadRequestException } from '@nestjs/common';
import { OrderStatus } from '../../../../shared/enums';

export const OrderStatusTransitions: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  [OrderStatus.PREPARING]: [OrderStatus.READY, OrderStatus.CANCELLED],
  [OrderStatus.READY]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELLED]: [],
};

export class OrderDomain {
  static assertTransitionAllowed(current: OrderStatus, next: OrderStatus) {
    if (current === next) {
      return;
    }
    if (!OrderStatusTransitions[current].includes(next)) {
      throw new BadRequestException(
        `Invalid order transition from ${current} to ${next}`,
      );
    }
  }

  static calculateTotal(items: Array<{ quantity: number; price: number }>) {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }
}
