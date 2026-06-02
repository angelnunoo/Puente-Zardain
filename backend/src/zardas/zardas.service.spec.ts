import { BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ZardasService } from './zardas.service';

const mockTransaction = {
  zardasBalance: {
    updateMany: jest.fn(),
    findUnique: jest.fn(),
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
    jest.clearAllMocks();
    mockPrismaService.$transaction.mockImplementation((callback) => callback(mockTransaction));
    service = new ZardasService(mockPrismaService as unknown as PrismaService);
  });

  it('redeems with an atomic balance decrement guarded by available amount', async () => {
    mockTransaction.zardasBalance.updateMany.mockResolvedValue({ count: 1 });
    mockTransaction.zardasBalance.findUnique.mockResolvedValue({ userId: 'user-id', available: 7, total: 10 });
    mockTransaction.zardasTransaction.create.mockResolvedValue({ id: 'tx-1' });
    mockTransaction.user.update.mockResolvedValue({ id: 'user-id' });

    const result = await service.redeemZardas('user-id', 3, 'Canje de prueba');

    expect(mockTransaction.zardasBalance.updateMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-id',
        available: { gte: 3 },
      },
      data: { available: { decrement: 3 } },
    });
    expect(mockTransaction.zardasTransaction.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-id',
        amount: -3,
        type: 'REDEMPTION',
        reason: 'Canje de prueba',
      },
    });
    expect(mockTransaction.user.update).toHaveBeenCalledWith({
      where: { id: 'user-id' },
      data: { zardas: 7 },
    });
    expect(result).toEqual({ userId: 'user-id', available: 7, total: 10 });
  });

  it('rejects redemption when the atomic decrement cannot reserve balance', async () => {
    mockTransaction.zardasBalance.updateMany.mockResolvedValue({ count: 0 });

    await expect(service.redeemZardas('user-id', 10, 'Canje sin saldo')).rejects.toThrow(BadRequestException);
    expect(mockTransaction.zardasTransaction.create).not.toHaveBeenCalled();
    expect(mockTransaction.user.update).not.toHaveBeenCalled();
  });
});
