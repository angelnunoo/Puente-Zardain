import { ForbiddenException } from '@nestjs/common';
import { Role } from '../../../shared/enums';
import { ZardasController } from './zardas.controller';

const zardasService = {
  getBalance: jest.fn(),
  getHistory: jest.fn(),
  redeemZardas: jest.fn(),
  adjustZardas: jest.fn(),
};

describe('ZardasController', () => {
  let controller: ZardasController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new ZardasController(zardasService as any);
  });

  it('should reject users reading another user balance', () => {
    expect(() =>
      controller.getBalance('user-2', {
        user: { userId: 'user-1', role: Role.USER },
      }),
    ).toThrow(ForbiddenException);
  });

  it('should allow admins to read another user balance', () => {
    zardasService.getBalance.mockReturnValue({ available: 10 });

    expect(
      controller.getBalance('user-2', {
        user: { userId: 'admin-1', role: Role.ADMIN },
      }),
    ).toEqual({ available: 10 });
    expect(zardasService.getBalance).toHaveBeenCalledWith('user-2');
  });

  it('should redeem against the authenticated user for normal users', () => {
    zardasService.redeemZardas.mockReturnValue({ available: 5 });

    expect(
      controller.redeemZardas(
        'user-1',
        { discountAmount: 5, reason: 'checkout' },
        { user: { userId: 'user-1', role: Role.USER } },
      ),
    ).toEqual({ available: 5 });
    expect(zardasService.redeemZardas).toHaveBeenCalledWith('user-1', 5, 'checkout');
  });
});
