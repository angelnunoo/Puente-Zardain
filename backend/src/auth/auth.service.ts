import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  private getAccessToken(user: any) {
    return this.jwtService.sign({ email: user.email, sub: user.id, role: user.role });
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async register(data: RegisterDto, ip?: string) {
    const existing = await this.usersService.findByEmail(data.email);
    if (existing) {
      throw new BadRequestException('El email ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await this.usersService.create({ ...data, password: hashedPassword });
    await this.prisma.fraudAttempt.create({
      data: {
        userId: user.id,
        ip,
        phone: data.phone,
        reason: 'Registro de nuevo usuario',
      },
    });
    const { password, ...result } = user;
    return result;
  }

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const access_token = this.getAccessToken(user);
    const refresh_token = await this.createRefreshToken(user.id);

    // Devolver datos completos del usuario con rol
    const { password: _, ...userWithoutPassword } = user;
    
    return { 
      access_token, 
      refresh_token,
      user: userWithoutPassword
    };
  }

  async createRefreshToken(userId: string) {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: { userId, token, expiresAt },
    });

    return token;
  }

  async refreshToken(token: string) {
    const stored = await this.prisma.refreshToken.findUnique({ where: { token } });
    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }

    const user = await this.usersService.findById(stored.userId);
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    const access_token = this.getAccessToken(user);
    return { access_token };
  }

  async logout(token: string) {
    await this.prisma.refreshToken.deleteMany({ where: { token } });
    return { success: true };
  }

  async requestPasswordReset(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return {
        message: 'Si la cuenta existe, se han enviado instrucciones para restablecer la contraseña.',
      };
    }

    const token = randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await this.prisma.passwordResetToken.create({
      data: { userId: user.id, token, expiresAt },
    });

    return {
      message: 'Si la cuenta existe, se han enviado instrucciones para restablecer la contraseña.',
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const resetToken = await this.prisma.passwordResetToken.findUnique({ where: { token } });
    if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
      throw new BadRequestException('Token de restablecimiento inválido o expirado');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.usersService.updatePassword(resetToken.userId, hashedPassword);
    await this.prisma.passwordResetToken.update({ where: { token }, data: { used: true } });

    return { message: 'Contraseña actualizada con éxito.' };
  }

  async sendPhoneVerification(userId: string) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorCode: code, twoFactorCodeExpires: expiresAt },
    });

    return { message: 'Código de verificación enviado (mock).', code };
  }

  async verifyPhoneCode(userId: string, code: string) {
    const user = await this.usersService.findById(userId);
    if (!user || user.twoFactorCode !== code || !user.twoFactorCodeExpires || user.twoFactorCodeExpires < new Date()) {
      throw new BadRequestException('Código de verificación inválido o expirado');
    }
    return this.prisma.user.update({
      where: { id: userId },
      data: { phoneVerified: true, twoFactorCode: null, twoFactorCodeExpires: null },
    });
  }
}
