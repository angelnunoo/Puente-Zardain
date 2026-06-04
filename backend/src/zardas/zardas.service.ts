import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ZardasService {
  constructor(private prisma: PrismaService) {}

  private calculateLeague(zardas: number) {
    if (zardas >= 1000) return 'Platino Zarda';
    if (zardas >= 500) return 'Oro Zarda';
    if (zardas >= 200) return 'Plata Zarda';
    return 'Bronce Zarda';
  }

  private getMultiplier(league: string) {
    switch (league) {
      case 'Platino Zarda':
        return 1.5;
      case 'Oro Zarda':
        return 1.25;
      case 'Plata Zarda':
        return 1.1;
      default:
        return 1;
    }
  }

  async addZardas(userId: string, amount: number, reason: string, type: string = 'MANUAL', orderId?: string, createdBy?: string) {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Crear transacción
      await tx.zardasTransaction.create({
        data: {
          userId,
          amount,
          type,
          reason,
          orderId,
          createdBy,
        },
      });

      // Actualizar balance
      const balance = await tx.zardasBalance.upsert({
        where: { userId },
        update: { total: { increment: amount }, available: { increment: amount } },
        create: { userId, total: amount, available: amount },
      });

      // Actualizar user.zardas para compatibilidad
      await tx.user.update({
        where: { id: userId },
        data: { zardas: balance.total },
      });

      return balance;
    });
  }

  async getBalance(userId: string) {
    const balance = await this.prisma.zardasBalance.findUnique({ where: { userId } });
    const zardas = balance?.available || 0;
    const league = this.calculateLeague(zardas);
    return {
      zardas,
      league,
      multiplier: this.getMultiplier(league),
      total: balance?.total || 0,
      available: balance?.available || 0,
      pending: balance?.pending || 0,
      expired: balance?.expired || 0,
    };
  }

  async getHistory(userId: string) {
    return this.prisma.zardasTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOffer(offerId: string) {
    return this.prisma.zardasOffer.findUniqueOrThrow({ where: { id: offerId } });
  }

  getLeagueRank(league: string) {
    const normalized = league.toLowerCase();
    if (normalized.includes('platino') || normalized.includes('platinum')) return 4;
    if (normalized.includes('oro') || normalized.includes('gold')) return 3;
    if (normalized.includes('plata') || normalized.includes('silver')) return 2;
    return 1;
  }

  async redeemZardas(userId: string, discountAmount: number, reason: string) {
    const balance = await this.prisma.zardasBalance.findUnique({ where: { userId } });
    if (!balance || balance.available < discountAmount) {
      throw new Error('Saldo insuficiente');
    }

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Crear transacción negativa
      await tx.zardasTransaction.create({
        data: {
          userId,
          amount: -discountAmount,
          type: 'REDEMPTION',
          reason,
        },
      });

      // Actualizar balance
      const updatedBalance = await tx.zardasBalance.update({
        where: { userId },
        data: { available: { decrement: discountAmount } },
      });

      // Actualizar user.zardas
      await tx.user.update({
        where: { id: userId },
        data: { zardas: updatedBalance.available },
      });

      return updatedBalance;
    });
  }

  async adjustZardas(userId: string, amount: number, reason: string, adminId: string) {
    return this.addZardas(userId, amount, reason, 'MANUAL_ADJUSTMENT', undefined, adminId);
  }
}