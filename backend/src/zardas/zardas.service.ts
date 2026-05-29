import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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
    return this.prisma.$transaction(async (tx: any) => {
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

  async redeemZardas(userId: string, discountAmount: number, reason: string) {
    return this.prisma.$transaction(async (tx: any) => {
      return this.redeemZardasInTransaction(tx, userId, discountAmount, reason);
    });
  }

  async redeemZardasInTransaction(tx: any, userId: string, discountAmount: number, reason: string, orderId?: string) {
    if (discountAmount <= 0) {
      throw new BadRequestException('La cantidad a canjear debe ser positiva');
    }

    const updated = await tx.zardasBalance.updateMany({
      where: {
        userId,
        available: { gte: discountAmount },
      },
      data: {
        available: { decrement: discountAmount },
      },
    });

    if (updated.count !== 1) {
      throw new BadRequestException('Saldo de Zardas insuficiente');
    }

    await tx.zardasTransaction.create({
      data: {
        userId,
        amount: -discountAmount,
        type: 'REDEMPTION',
        reason,
        orderId,
      },
    });

    const updatedBalance = await tx.zardasBalance.findUnique({ where: { userId } });
    await tx.user.update({
      where: { id: userId },
      data: { zardas: updatedBalance?.available || 0 },
    });

    return updatedBalance;
  }

  async adjustZardas(userId: string, amount: number, reason: string, adminId: string) {
    return this.addZardas(userId, amount, reason, 'MANUAL_ADJUSTMENT', undefined, adminId);
  }

  async getOffer(id: string) {
    const offer = await this.prisma.zardasOffer.findUnique({ where: { id } });
    if (!offer) {
      throw new NotFoundException('Oferta no encontrada');
    }
    return offer;
  }

  getLeagueRank(league: string) {
    const ranks: Record<string, number> = {
      'Bronce Zarda': 1,
      Bronce: 1,
      BRONZE: 1,
      Novato: 1,
      'Plata Zarda': 2,
      Plata: 2,
      SILVER: 2,
      'Oro Zarda': 3,
      Oro: 3,
      GOLD: 3,
      'Platino Zarda': 4,
      Platino: 4,
      PLATINUM: 4,
    };
    return ranks[league] || 0;
  }
}