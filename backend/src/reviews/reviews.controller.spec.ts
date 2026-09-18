import { Test, TestingModule } from '@nestjs/testing';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';

describe('ReviewsController', () => {
  let controller: ReviewsController;
  const reviewsService = {
    create: jest.fn(),
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReviewsController],
      providers: [{ provide: ReviewsService, useValue: reviewsService }],
    }).compile();

    controller = module.get<ReviewsController>(ReviewsController);
    jest.clearAllMocks();
  });

  it('passes the JWT userId instead of a client-supplied user id', async () => {
    reviewsService.create.mockResolvedValue({ id: 'review-1' });

    await controller.create(
      { user: { userId: 'auth-user' } },
      {
        rating: 4,
        comment: 'Muy bueno',
        userId: 'victim-user',
        user: { create: { role: 'ADMIN' } },
      } as any,
    );

    expect(reviewsService.create).toHaveBeenCalledWith('auth-user', {
      rating: 4,
      comment: 'Muy bueno',
    });
  });
});
