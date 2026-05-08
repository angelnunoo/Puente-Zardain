import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateCartDto } from './dto/update-cart.dto';
import { AddToCartDto } from './dto/add-to-cart.dto';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async getCart(userId: string) {
    return this.prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: true } } },
    });
  }

  async addToCart(userId: string, payload: AddToCartDto) {
    const cart = await this.prisma.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    // Check if item already exists
    const existingItem = await this.prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: payload.productId,
        customizations: payload.customizations || null,
      },
    });

    if (existingItem) {
      // Update quantity
      return this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + payload.quantity },
      });
    } else {
      // Create new item
      return this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: payload.productId,
          quantity: payload.quantity,
          customizations: payload.customizations,
        },
      });
    }
  }

  async updateCartItem(userId: string, productId: string, payload: UpdateCartDto) {
    const cart = await this.prisma.cart.findUnique({ where: { userId } });
    if (!cart) return null;

    return this.prisma.cartItem.updateMany({
      where: {
        cartId: cart.id,
        productId,
      },
      data: { quantity: payload.quantity },
    });
  }

  async removeFromCart(userId: string, productId: string) {
    const cart = await this.prisma.cart.findUnique({ where: { userId } });
    if (!cart) return { success: false };

    await this.prisma.cartItem.deleteMany({
      where: {
        cartId: cart.id,
        productId,
      },
    });

    return { success: true };
  }

  async clearCart(userId: string) {
    const existing = await this.prisma.cart.findUnique({ where: { userId } });
    if (!existing) {
      return { success: true };
    }
    await this.prisma.cartItem.deleteMany({ where: { cartId: existing.id } });
    return { success: true };
  }

  async checkout(userId: string, payload: { deliveryAddress?: string; notes?: string }) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: true } } },
    });

    if (!cart || !cart.items.length) {
      throw new Error('Cart is empty');
    }

    // Create order
    const order = await this.prisma.order.create({
      data: {
        userId,
        total: cart.items.reduce((sum, item) => sum + item.quantity * item.product.price, 0),
        status: 'pending',
        deliveryAddress: payload.deliveryAddress,
        notes: payload.notes,
        items: {
          create: cart.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.price,
            customizations: item.customizations,
          })),
        },
      },
    });

    // Clear cart
    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

    return order;
  }

  async getUserOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: {
        items: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOrder(userId: string, orderId: string) {
    return this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: {
        items: { include: { product: true } },
      },
    });
  }
}
