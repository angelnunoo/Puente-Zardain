import { BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  const mockUsersService = {
    findByEmail: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockPrismaService = {
    passwordResetToken: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates a password reset token without exposing it in the response', async () => {
    mockUsersService.findByEmail.mockResolvedValue({ id: 'user-1', email: 'victim@example.com' });
    mockPrismaService.passwordResetToken.create.mockResolvedValue({});

    const result = await service.requestPasswordReset('victim@example.com');

    expect(mockPrismaService.passwordResetToken.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        token: expect.any(String),
        expiresAt: expect.any(Date),
      },
    });
    expect(result).toEqual({
      message: 'Si el email existe, recibirás instrucciones para restablecer la contraseña.',
    });
    expect(result).not.toHaveProperty('resetToken');
  });

  it('rejects password reset requests for unknown emails', async () => {
    mockUsersService.findByEmail.mockResolvedValue(null);

    await expect(service.requestPasswordReset('missing@example.com')).rejects.toThrow(BadRequestException);
    expect(mockPrismaService.passwordResetToken.create).not.toHaveBeenCalled();
  });
});
