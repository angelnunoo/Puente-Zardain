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

  it('allows users to read their own balance', async () => {
    mockZardasService.getBalance.mockResolvedValue({ available: 10 });

    await expect(controller.getBalance({ user: { userId: 'user-1', role: Role.USER } }, 'user-1')).resolves.toEqual({
      available: 10,
    });
    expect(mockZardasService.getBalance).toHaveBeenCalledWith('user-1');
  });

  it('forbids users from reading another user balance', () => {
    expect(() => controller.getBalance({ user: { userId: 'user-1', role: Role.USER } }, 'user-2')).toThrow(
      ForbiddenException,
    );
    expect(mockZardasService.getBalance).not.toHaveBeenCalled();
  });

  it('forbids users from reading another user history', () => {
    expect(() => controller.getHistory({ user: { userId: 'user-1', role: Role.USER } }, 'user-2')).toThrow(
      ForbiddenException,
    );
    expect(mockZardasService.getHistory).not.toHaveBeenCalled();
  });

  it('forbids users from redeeming another user Zardas', () => {
    expect(() =>
      controller.redeemZardas({ user: { userId: 'user-1', role: Role.USER } }, 'user-2', {
        discountAmount: 5,
        reason: 'malicious redemption',
      }),
    ).toThrow(ForbiddenException);
    expect(mockZardasService.redeemZardas).not.toHaveBeenCalled();
  });

  it('allows admins to read another user balance', async () => {
    mockZardasService.getBalance.mockResolvedValue({ available: 20 });

    await expect(controller.getBalance({ user: { userId: 'admin-1', role: Role.ADMIN } }, 'user-2')).resolves.toEqual({
      available: 20,
    });
    expect(mockZardasService.getBalance).toHaveBeenCalledWith('user-2');
  });
});
