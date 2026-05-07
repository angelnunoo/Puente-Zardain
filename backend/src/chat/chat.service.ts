import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async saveMessage(data: { orderId: string; sender: string; content: string }) {
    const chat = await this.prisma.chat.findUnique({ where: { orderId: data.orderId } });
    if (!chat) {
      throw new NotFoundException('Chat not found');
    }
    return this.prisma.message.create({
      data: {
        chatId: chat.id,
        sender: data.sender,
        content: data.content,
      },
    });
  }

  async getMessages(orderId: string) {
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