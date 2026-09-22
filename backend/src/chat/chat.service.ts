import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface ChatActor {
  userId: string;
  role?: string;
}

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async assertCanAccessOrder(orderId: string, actor: ChatActor) {
    if (!actor?.userId) {
      throw new ForbiddenException('No puedes acceder a este chat');
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { userId: true },
    });

    if (!order) {
      throw new NotFoundException('Chat no encontrado');
    }

    if (actor.role !== 'ADMIN' && order.userId !== actor.userId) {
      throw new ForbiddenException('No puedes acceder a este chat');
    }

    return order;
  }

  async saveMessage(data: { orderId: string; content: string }, actor: ChatActor) {
    await this.assertCanAccessOrder(data.orderId, actor);

    const content = typeof data.content === 'string' ? data.content.trim() : '';
    if (!content) {
      throw new BadRequestException('Mensaje inválido');
    }

    const chat = await this.prisma.chat.findUnique({ where: { orderId: data.orderId } });
    if (!chat) {
      throw new NotFoundException('Chat no encontrado');
    }

    return this.prisma.message.create({
      data: {
        chatId: chat.id,
        sender: actor.role === 'ADMIN' ? 'admin' : 'Cliente',
        content,
      },
    });
  }

  async getMessages(orderId: string, actor: ChatActor) {
    await this.assertCanAccessOrder(orderId, actor);

    const chat = await this.prisma.chat.findUnique({
      where: { orderId },
      include: { messages: true },
    });
    if (!chat) {
      throw new NotFoundException('Chat no encontrado');
    }
    return chat.messages;
  }

  getQuickReplies() {
    return [
      'Tu pedido está en preparación.',
      'Tu pedido sale en 5 minutos.',
      'Nos vemos pronto en el restaurante.',
      'Gracias por tu preferencia.',
    ];
  }
}
