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
    controller = new ZardasController(mockZardasService as unknown as ZardasService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should reject cross-user balance reads', () => {
    expect(() =>
      controller.getBalance('victim-id', {
        user: { userId: 'attacker-id', role: Role.USER },
      }),
    ).toThrow(ForbiddenException);

    expect(mockZardasService.getBalance).not.toHaveBeenCalled();
  });

  it('should allow admins to redeem for another user', () => {
    mockZardasService.redeemZardas.mockResolvedValue({ available: 5 });

    controller.redeemZardas(
      'user-id',
      { discountAmount: 5, reason: 'Ajuste admin' },
      { user: { userId: 'admin-id', role: Role.ADMIN } },
    );

    expect(mockZardasService.redeemZardas).toHaveBeenCalledWith('user-id', 5, 'Ajuste admin');
  });
});
