import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '../../../shared/enums';

describe('ReviewsService', () => {
  let service: ReviewsService;
  const prisma = {
    order: { findFirst: jest.fn() },
    review: { findFirst: jest.fn(), create: jest.fn(), findMany: jest.fn() },
    user: { update: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReviewsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('lists visible reviews without user secrets', async () => {
      prisma.review.findMany.mockResolvedValue([]);

      await service.findAll();

      expect(prisma.review.findMany).toHaveBeenCalledWith({
        where: { hidden: false },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('create', () => {
    it('creates a review for the authenticated user only', async () => {
      prisma.order.findFirst.mockResolvedValue({ id: 'order-1' });
      prisma.review.findFirst.mockResolvedValue(null);
      prisma.review.create.mockResolvedValue({ id: 'review-1', userId: 'auth-user', rating: 5 });
      prisma.user.update.mockResolvedValue({});

      await service.create('auth-user', {
        rating: 5,
        comment: 'Excelente',
        userId: 'victim-user',
        user: { create: { role: 'ADMIN', email: 'attacker@example.com' } },
      } as any);

      expect(prisma.order.findFirst).toHaveBeenCalledWith({
        where: { userId: 'auth-user', status: OrderStatus.DELIVERED },
      });
      expect(prisma.review.create).toHaveBeenCalledWith({
        data: {
          userId: 'auth-user',
          rating: 5,
          comment: 'Excelente',
        },
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'auth-user' },
        data: { zardas: { increment: 20 } },
      });
    });

    it('rejects review creation when the authenticated user has no delivered order', async () => {
      prisma.order.findFirst.mockResolvedValue(null);

      await expect(
        service.create('auth-user', {
          rating: 5,
          userId: 'victim-with-delivered-order',
        } as any),
      ).rejects.toThrow(BadRequestException);

      expect(prisma.order.findFirst).toHaveBeenCalledWith({
        where: { userId: 'auth-user', status: OrderStatus.DELIVERED },
      });
      expect(prisma.review.create).not.toHaveBeenCalled();
    });

    it('rejects nested writes that omit userId when any delivered order exists', async () => {
      await expect(
        service.create(undefined as any, {
          rating: 5,
          user: { create: { role: 'ADMIN', email: 'attacker@example.com' } },
        } as any),
      ).rejects.toThrow(BadRequestException);

      expect(prisma.order.findFirst).not.toHaveBeenCalled();
      expect(prisma.review.create).not.toHaveBeenCalled();
    });
  });
});
