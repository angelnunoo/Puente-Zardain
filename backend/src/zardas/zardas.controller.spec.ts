import { ForbiddenException } from '@nestjs/common';
import { Role } from '../../../shared/enums';
import { ZardasController } from './zardas.controller';

describe('ZardasController', () => {
  const service = {
    getBalance: jest.fn(),
    getHistory: jest.fn(),
    redeemZardas: jest.fn(),
    adjustZardas: jest.fn(),
  };

  let controller: ZardasController;

  beforeEach(() => {
    controller = new ZardasController(service as any);
    jest.clearAllMocks();
  });

  it('should reject cross-user balance reads', () => {
    expect(() =>
      controller.getBalance('victim-id', { user: { userId: 'attacker-id', role: Role.USER } }),
    ).toThrow(ForbiddenException);
  });

  it('should allow admins to read another user balance', () => {
    service.getBalance.mockReturnValue({ available: 10 });

    expect(controller.getBalance('user-id', { user: { userId: 'admin-id', role: Role.ADMIN } })).toEqual({
      available: 10,
    });
  });
});
