jest.mock('./gamification.service', () => ({
  GamificationService: class GamificationService {},
}));

jest.mock('../auth/jwt-auth.guard', () => ({
  JwtAuthGuard: class JwtAuthGuard {},
}));

jest.mock('../common/guards/roles.guard', () => ({
  RolesGuard: class RolesGuard {},
}));

jest.mock('../common/guards/roles.decorator', () => ({
  Roles: () => () => undefined,
}));

import { GamificationController } from './gamification.controller';

describe('GamificationController', () => {
  it('loads the leaderboard route without a missing Query reference', () => {
    const service = { getLeaderboard: jest.fn().mockResolvedValue([]) };
    const controller = new GamificationController(service as any);

    return expect(controller.getLeaderboard(10)).resolves.toEqual([]);
  });
});
