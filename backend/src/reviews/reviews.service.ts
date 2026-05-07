import { BadRequestException, Injectable } from '@nestjs/common';
import { OrderStatus } from '../../../shared/enums';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    const deliveredOrder = await this.prisma.order.findFirst({
      where: { userId: data.userId, status: OrderStatus.DELIVERED },
    });

    if (!deliveredOrder) {
      throw new BadRequestException('Solo se puede dejar una reseña tras un pedido entregado.');
    }

    const existingReview = await this.prisma.review.findFirst({ where: { userId: data.userId } });
    const review = await this.prisma.review.create({ data });

    if (!existingReview) {
      await this.prisma.user.update({
        where: { id: data.userId },
        data: { zardas: { increment: 20 } },
      });
    }

    return review;
  }

  async respond(reviewId: string, response: string) {
    return this.prisma.review.update({
      where: { id: reviewId },
      data: { response },
    });
  }

  async hide(reviewId: string, hidden = true) {
    return this.prisma.review.update({
      where: { id: reviewId },
      data: { hidden },
    });
  }

  async findAll() {
    return this.prisma.review.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}