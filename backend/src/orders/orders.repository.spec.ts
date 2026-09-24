jest.mock('@prisma/client', () => ({
  PrismaClient: class PrismaClient {},
}));

import { OrdersRepository } from './orders.repository';
import { Role } from '../../../shared/enums';

describe('OrdersRepository user payload', () => {
  const prisma = {
    order: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
    },
  };

  const repository = new OrdersRepository(prisma as any);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not return password hashes or 2FA codes when listing a user orders', async () => {
    await repository.findAllForUser('user-1', Role.USER);

    const include = prisma.order.findMany.mock.calls[0][0].include;
    expect(include.user.select).toEqual({
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
    });
    expect(include.user.select.password).toBeUndefined();
    expect(include.user.select.twoFactorCode).toBeUndefined();
    expect(prisma.order.findMany.mock.calls[0][0].where).toEqual({ userId: 'user-1' });
  });

  it('does not return password hashes when an admin lists every order', async () => {
    await repository.findAllForUser('admin-1', Role.ADMIN);

    const args = prisma.order.findMany.mock.calls[0][0];
    expect(args.where).toBeUndefined();
    expect(args.include.user.select.password).toBeUndefined();
    expect(args.include.user.select.twoFactorCode).toBeUndefined();
  });
});
