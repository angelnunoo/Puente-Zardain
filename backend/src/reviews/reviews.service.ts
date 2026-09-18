import { BadRequestException, Injectable } from '@nestjs/common';
import { OrderStatus } from '../../../shared/enums';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

const PUBLIC_REVIEW_USER_SELECT = {
  id: true,
  name: true,
  avatar: true,
} as const;

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, payload: CreateReviewDto) {
    if (!userId) {
      throw new BadRequestException('User context is required to create a review.');
    }

    const rating = Number(payload?.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new BadRequestException('La valoración debe estar entre 1 y 5.');
    }

    const deliveredOrder = await this.prisma.order.findFirst({
      where: { userId, status: OrderStatus.DELIVERED },
    });

    if (!deliveredOrder) {
      throw new BadRequestException('Solo se puede dejar una reseña tras un pedido entregado.');
    }

    const existingReview = await this.prisma.review.findFirst({ where: { userId } });
    const review = await this.prisma.review.create({
      data: {
        userId,
        rating,
        comment: payload.comment,
      },
    });

    if (!existingReview) {
      await this.prisma.user.update({
        where: { id: userId },
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
      where: { hidden: false },
      include: {
        user: {
          select: PUBLIC_REVIEW_USER_SELECT,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
