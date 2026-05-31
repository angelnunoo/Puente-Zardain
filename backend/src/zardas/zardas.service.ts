import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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

  getLeagueRank(league: string) {
    const ranks: Record<string, number> = {
      Novato: 0,
      BRONZE: 1,
      'Bronce Zarda': 1,
      SILVER: 2,
      'Plata Zarda': 2,
      GOLD: 3,
      'Oro Zarda': 3,
      PLATINUM: 4,
      'Platino Zarda': 4,
    };

    return ranks[league] ?? 0;
  }

  async getOffer(id: string) {
    const offer = await this.prisma.zardasOffer.findUnique({ where: { id } });
    if (!offer) {
      throw new NotFoundException('Oferta no encontrada');
    }

    return offer;
  }

  async addZardas(
    userId: string,
    amount: number,
    reason: string,
    type: string = 'MANUAL',
    orderId?: string,
    createdBy?: string,
    tx?: Prisma.TransactionClient,
  ) {
    if (!Number.isInteger(amount) || amount === 0) {
      throw new BadRequestException('La cantidad de Zardas no puede ser cero');
    }

    if (tx) {
      return this.addZardasInTransaction(tx, userId, amount, reason, type, orderId, createdBy);
    }

    return this.prisma.$transaction((transaction: Prisma.TransactionClient) =>
      this.addZardasInTransaction(transaction, userId, amount, reason, type, orderId, createdBy),
    );
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

  async redeemZardas(userId: string, discountAmount: number, reason: string, tx?: Prisma.TransactionClient) {
    if (!Number.isInteger(discountAmount) || discountAmount <= 0) {
      throw new BadRequestException('La cantidad a canjear debe ser positiva');
    }

    if (tx) {
      return this.redeemZardasInTransaction(tx, userId, discountAmount, reason);
    }

    return this.prisma.$transaction((transaction: Prisma.TransactionClient) =>
      this.redeemZardasInTransaction(transaction, userId, discountAmount, reason),
    );
  }

  async adjustZardas(userId: string, amount: number, reason: string, adminId: string) {
    return this.addZardas(userId, amount, reason, 'MANUAL_ADJUSTMENT', undefined, adminId);
  }

  private async addZardasInTransaction(
    tx: Prisma.TransactionClient,
    userId: string,
    amount: number,
    reason: string,
    type: string,
    orderId?: string,
    createdBy?: string,
  ) {
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

    const balance = await tx.zardasBalance.upsert({
      where: { userId },
      update: { total: { increment: amount }, available: { increment: amount } },
      create: { userId, total: amount, available: amount },
    });

    const league = this.calculateLeague(balance.available);
    const updatedBalance =
      balance.league === league
        ? balance
        : await tx.zardasBalance.update({
            where: { userId },
            data: { league },
          });

    await tx.user.update({
      where: { id: userId },
      data: { zardas: updatedBalance.available, league },
    });

    return updatedBalance;
  }

  private async redeemZardasInTransaction(
    tx: Prisma.TransactionClient,
    userId: string,
    discountAmount: number,
    reason: string,
  ) {
    const claimed = await tx.zardasBalance.updateMany({
      where: {
        userId,
        available: { gte: discountAmount },
      },
      data: {
        available: { decrement: discountAmount },
      },
    });

    if (claimed.count !== 1) {
      throw new BadRequestException('Saldo de Zardas insuficiente');
    }

    let updatedBalance = await tx.zardasBalance.findUnique({ where: { userId } });
    if (!updatedBalance) {
      throw new BadRequestException('Saldo de Zardas insuficiente');
    }

    const league = this.calculateLeague(updatedBalance.available);
    if (updatedBalance.league !== league) {
      updatedBalance = await tx.zardasBalance.update({
        where: { userId },
        data: { league },
      });
    }

    await tx.zardasTransaction.create({
      data: {
        userId,
        amount: -discountAmount,
        type: 'REDEMPTION',
        reason,
      },
    });

    await tx.user.update({
      where: { id: userId },
      data: { zardas: updatedBalance.available, league },
    });

    return updatedBalance;
  }
}