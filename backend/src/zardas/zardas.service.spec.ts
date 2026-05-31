import { BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ZardasService } from './zardas.service';

const transactionClient = {
  zardasBalance: {
    updateMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
  },
  zardasTransaction: {
    create: jest.fn(),
  },
  user: {
    update: jest.fn(),
  },
};

const mockPrismaService = {
  $transaction: jest.fn(),
  zardasOffer: {
    findUnique: jest.fn(),
  },
};

describe('ZardasService', () => {
  let service: ZardasService;

  beforeEach(() => {
    service = new ZardasService(mockPrismaService as unknown as PrismaService);
    mockPrismaService.$transaction.mockImplementation((callback) => callback(transactionClient));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should redeem with a conditional decrement to prevent double-spend races', async () => {
    transactionClient.zardasBalance.updateMany.mockResolvedValue({ count: 1 });
    transactionClient.zardasBalance.findUnique.mockResolvedValue({
      userId: 'user-id',
      total: 20,
      available: 15,
      pending: 0,
      expired: 0,
      league: 'Bronce Zarda',
    });
    transactionClient.zardasTransaction.create.mockResolvedValue({});
    transactionClient.user.update.mockResolvedValue({});

    const result = await service.redeemZardas('user-id', 5, 'Canje pedido');

    expect(transactionClient.zardasBalance.updateMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-id',
        available: { gte: 5 },
      },
      data: {
        available: { decrement: 5 },
      },
    });
    expect(transactionClient.zardasTransaction.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-id',
        amount: -5,
        type: 'REDEMPTION',
        reason: 'Canje pedido',
      },
    });
    expect(result.available).toBe(15);
  });

  it('should fail without writing a ledger entry when the balance claim loses the race', async () => {
    transactionClient.zardasBalance.updateMany.mockResolvedValue({ count: 0 });

    await expect(service.redeemZardas('user-id', 5, 'Canje pedido')).rejects.toThrow(BadRequestException);

    expect(transactionClient.zardasTransaction.create).not.toHaveBeenCalled();
  });
});
