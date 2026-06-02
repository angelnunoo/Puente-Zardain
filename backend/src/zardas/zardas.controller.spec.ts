import { ForbiddenException } from '@nestjs/common';
import { Role } from '../../../shared/enums';
import { ZardasController } from './zardas.controller';
import { ZardasService } from './zardas.service';

const mockZardasService = {
  getBalance: jest.fn(),
  getHistory: jest.fn(),
  redeemZardas: jest.fn(),
  adjustZardas: jest.fn(),
};

describe('ZardasController', () => {
  let controller: ZardasController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new ZardasController(mockZardasService as unknown as ZardasService);
  });

  it('rejects cross-user balance reads for regular users', () => {
    expect(() =>
      controller.getBalance('victim-user-id', { user: { userId: 'attacker-user-id', role: Role.USER } }),
    ).toThrow(ForbiddenException);
    expect(mockZardasService.getBalance).not.toHaveBeenCalled();
  });

  it('rejects cross-user redemptions for regular users', () => {
    expect(() =>
      controller.redeemZardas(
        'victim-user-id',
        { discountAmount: 10, reason: 'malicious redemption' },
        { user: { userId: 'attacker-user-id', role: Role.USER } },
      ),
    ).toThrow(ForbiddenException);
    expect(mockZardasService.redeemZardas).not.toHaveBeenCalled();
  });

  it('allows admins to inspect another user balance', () => {
    mockZardasService.getBalance.mockReturnValue({ available: 10 });

    const result = controller.getBalance('user-id', { user: { userId: 'admin-id', role: Role.ADMIN } });

    expect(result).toEqual({ available: 10 });
    expect(mockZardasService.getBalance).toHaveBeenCalledWith('user-id');
  });
});
