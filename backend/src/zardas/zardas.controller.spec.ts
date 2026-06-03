import { ForbiddenException } from '@nestjs/common';
import { Role } from '../../../shared/enums';
import { ZardasController } from './zardas.controller';
import { ZardasService } from './zardas.service';

describe('ZardasController', () => {
  const zardasService = {
    getBalance: jest.fn(),
    getHistory: jest.fn(),
    redeemZardas: jest.fn(),
    adjustZardas: jest.fn(),
  };
  let controller: ZardasController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new ZardasController(zardasService as unknown as ZardasService);
  });

  it('should reject balance reads for another user', () => {
    expect(() =>
      controller.getBalance('victim-user', { user: { userId: 'attacker-user', role: Role.USER } }),
    ).toThrow(ForbiddenException);
    expect(zardasService.getBalance).not.toHaveBeenCalled();
  });

  it('should reject redemptions for another user', () => {
    expect(() =>
      controller.redeemZardas(
        'victim-user',
        { discountAmount: 5, reason: 'drain victim balance' },
        { user: { userId: 'attacker-user', role: Role.USER } },
      ),
    ).toThrow(ForbiddenException);
    expect(zardasService.redeemZardas).not.toHaveBeenCalled();
  });

  it('should allow admins to read a user balance', () => {
    zardasService.getBalance.mockReturnValue({ available: 10 });

    expect(controller.getBalance('victim-user', { user: { userId: 'admin-user', role: Role.ADMIN } })).toEqual({
      available: 10,
    });
  });
});
