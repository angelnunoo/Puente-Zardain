import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async saveMessage(data: { orderId: string; sender: string; content: string }) {
    const chat = await this.prisma.chat.findUnique({ where: { orderId: data.orderId } });
    if (chat) {
      return this.prisma.message.create({
        data: {
          chatId: chat.id,
          sender: data.sender,
          content: data.content,
        },
      });
    }
  }
}