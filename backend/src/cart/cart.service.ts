import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateCartDto } from './dto/update-cart.dto';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async getCart(userId: string) {
    return this.prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: true } } },
    });
  }

  async updateCart(userId: string, payload: UpdateCartDto) {
    const cart = await this.prisma.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

    const items = payload.items.map((item) => ({
      cartId: cart.id,
      productId: item.productId,
      quantity: item.quantity,
      customizations: item.customizations,
    }));

    await this.prisma.cartItem.createMany({ data: items });

    return this.getCart(userId);
  }

  async clearCart(userId: string) {
    const existing = await this.prisma.cart.findUnique({ where: { userId } });
    if (!existing) {
      return { success: true };
    }
    await this.prisma.cartItem.deleteMany({ where: { cartId: existing.id } });
    return { success: true };
  }
}
