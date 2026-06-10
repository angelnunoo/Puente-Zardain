import { ForbiddenException } from '@nestjs/common';
import { ZardasController } from './zardas.controller';
import { Role } from '../../../shared/enums';

describe('ZardasController', () => {
  const zardasService = {
    getBalance: jest.fn(),
    getHistory: jest.fn(),
    redeemZardas: jest.fn(),
    adjustZardas: jest.fn(),
  };

  let controller: ZardasController;

  beforeEach(() => {
    controller = new ZardasController(zardasService as any);
    jest.clearAllMocks();
  });

  it('allows users to read their own balance', async () => {
    zardasService.getBalance.mockResolvedValue({ available: 10 });

    await expect(
      controller.getBalance('user-1', { user: { userId: 'user-1', role: Role.USER } }),
    ).resolves.toEqual({ available: 10 });

    expect(zardasService.getBalance).toHaveBeenCalledWith('user-1');
  });

  it('blocks users from reading another user balance', () => {
    expect(() =>
      controller.getBalance('victim-id', { user: { userId: 'attacker-id', role: Role.USER } }),
    ).toThrow(ForbiddenException);

    expect(zardasService.getBalance).not.toHaveBeenCalled();
  });

  it('blocks users from redeeming another user Zardas', () => {
    expect(() =>
      controller.redeemZardas(
        'victim-id',
        { discountAmount: 25, reason: 'stolen discount' },
        { user: { userId: 'attacker-id', role: Role.USER } },
      ),
    ).toThrow(ForbiddenException);

    expect(zardasService.redeemZardas).not.toHaveBeenCalled();
  });

  it('allows admins to access another user balance for support', async () => {
    zardasService.getBalance.mockResolvedValue({ available: 10 });

    await expect(
      controller.getBalance('user-1', { user: { userId: 'admin-id', role: Role.ADMIN } }),
    ).resolves.toEqual({ available: 10 });

    expect(zardasService.getBalance).toHaveBeenCalledWith('user-1');
  });
});
