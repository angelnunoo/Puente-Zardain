import { ForbiddenException } from '@nestjs/common';
import { Role } from '../../../shared/enums';
import { ZardasController } from './zardas.controller';

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
    controller = new ZardasController(zardasService as any);
  });

  it('should reject balance access for a different non-admin user', () => {
    expect(() =>
      controller.getBalance('victim-id', {
        user: { userId: 'attacker-id', role: Role.USER },
      }),
    ).toThrow(ForbiddenException);
    expect(zardasService.getBalance).not.toHaveBeenCalled();
  });

  it('should allow admins to access another user balance', () => {
    zardasService.getBalance.mockReturnValue({ available: 10 });

    expect(
      controller.getBalance('user-id', {
        user: { userId: 'admin-id', role: Role.ADMIN },
      }),
    ).toEqual({ available: 10 });
  });
});
