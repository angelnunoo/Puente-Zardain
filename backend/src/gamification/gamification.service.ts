import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class GamificationService {
  private readonly logger = new Logger('GamificationService');

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService
  ) {}

  async awardZardas(userId: string, amount: number, reason: string, source: string) {
    const updatedBalance = await this.prisma.$transaction(async (tx) => {
      // Obtener o crear balance del usuario
      let balance = await tx.zardasBalance.findUnique({
        where: { userId }
      });

      if (!balance) {
        balance = await tx.zardasBalance.create({
          data: {
            userId,
            balance: 0,
            league: 'Bronce Zarda',
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        });
      }

      // Actualizar balance
      const newBalance = balance.balance + amount;
      await tx.zardasBalance.update({
        where: { userId },
        data: {
          balance: newBalance,
          league: this.calculateLeague(newBalance),
          updatedAt: new Date(),
        }
      });

      // Crear transacción
      await tx.zardasTransaction.create({
        data: {
          userId,
          amount,
          type: 'EARNED',
          reason,
          source,
          balanceBefore: balance.balance,
          balanceAfter: newBalance,
          createdAt: new Date(),
        }
      });

      return { balance: newBalance, previousBalance: balance.balance };
    });

    // Notificar al usuario
    this.notificationsService.sendOrderUpdate(
      `zardas_${userId}`,
      'ZARDAS_EARNED',
      `¡Has ganado ${amount} Zardas! ${reason}`,
      userId
    );

    // Verificar si subió de liga
    if (this.leveledUp(updatedBalance.previousBalance, updatedBalance.balance)) {
      const newLeague = this.calculateLeague(updatedBalance.balance);
      this.notificationsService.sendOrderUpdate(
        `league_${userId}`,
        'LEAGUE_UPGRADE',
        `¡Felicidades! Has subido a la liga ${newLeague} 🎉`,
        userId
      );
    }

    this.logger.log(`Awarded ${amount} Zardas to user ${userId} for: ${reason}`);
    return updatedBalance.balance;
  }

  async redeemZardas(userId: string, amount: number, reason: string) {
    const balance = await this.prisma.zardasBalance.findUnique({
      where: { userId }
    });

    if (!balance || balance.balance < amount) {
      throw new Error('Insufficient Zardas balance');
    }

    const updatedBalance = await this.prisma.$transaction(async (tx) => {
      const newBalance = balance.balance - amount;
      
      await tx.zardasBalance.update({
        where: { userId },
        data: {
          balance: newBalance,
          league: this.calculateLeague(newBalance),
          updatedAt: new Date(),
        }
      });

      await tx.zardasTransaction.create({
        data: {
          userId,
          amount: -amount,
          type: 'SPENT',
          reason,
          source: 'REDEMPTION',
          balanceBefore: balance.balance,
          balanceAfter: newBalance,
          createdAt: new Date(),
        }
      });

      return newBalance;
    });

    this.notificationsService.sendOrderUpdate(
      `zardas_${userId}`,
      'ZARDAS_SPENT',
      `Has gastado ${amount} Zardas en: ${reason}`,
      userId
    );

    this.logger.log(`Redeemed ${amount} Zardas from user ${userId} for: ${reason}`);
    return updatedBalance;
  }

  async getUserBalance(userId: string) {
    const balance = await this.prisma.zardasBalance.findUnique({
      where: { userId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!balance) {
      return this.prisma.zardasBalance.create({
        data: {
          userId,
          balance: 0,
          league: 'Bronce Zarda',
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      });
    }

    return balance;
  }

  async getLeaderboard(limit: number = 50) {
    const leaderboard = await this.prisma.zardasBalance.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          }
        }
      },
      orderBy: { balance: 'desc' },
      take: limit
    });

    return leaderboard.map((entry, index) => ({
      rank: index + 1,
      userId: entry.userId,
      userName: entry.user.name,
      userAvatar: entry.user.avatar,
      balance: entry.balance,
      league: entry.league,
    }));
  }

  async getUserRewards(userId: string) {
    const balance = await this.getUserBalance(userId);
    const availableRewards = this.getAvailableRewardsForBalance(balance.balance);
    
    return {
      balance: balance.balance,
      league: balance.league,
      availableRewards,
      nextLeague: this.getNextLeague(balance.league),
      zardasToNextLeague: this.getZardasToNextLeague(balance.balance, balance.league)
    };
  }

  async processOrderRewards(userId: string, orderTotal: number) {
    // Zardas por cada euro gastado
    const zardasEarned = Math.floor(orderTotal * 10); // 10 Zardas por cada euro
    
    // Bonus por primer pedido del día
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayOrders = await this.prisma.order.count({
      where: {
        userId,
        createdAt: { gte: today },
        paymentStatus: 'SUCCEEDED'
      }
    });

    let bonusReason = `Zardas por pedido de €${orderTotal.toFixed(2)}`;
    let bonusAmount = zardasEarned;

    if (todayOrders === 1) {
      bonusAmount += 50; // Bonus de 50 Zardas por primer pedido del día
      bonusReason += ' + 50 Zardas de bonificación diario';
    }

    // Bonus por pedidos consecutivos
    const consecutiveDays = await this.getConsecutiveOrderDays(userId);
    if (consecutiveDays >= 3) {
      const streakBonus = consecutiveDays * 20;
      bonusAmount += streakBonus;
      bonusReason += ` + ${streakBonus} Zardas de racha de ${consecutiveDays} días`;
    }

    return this.awardZardas(userId, bonusAmount, bonusReason, 'ORDER_REWARD');
  }

  async processReviewReward(userId: string, reviewId: string) {
    // 100 Zardas por dejar una reseña
    return this.awardZardas(userId, 100, 'Reseña publicada', 'REVIEW_REWARD');
  }

  async processReferralReward(referrerId: string, referredId: string) {
    // 500 Zardas por referir a un nuevo usuario
    await this.awardZardas(referrerId, 500, 'Referido exitoso', 'REFERRAL_REWARD');
    
    // 200 Zardas para el referido
    await this.awardZardas(referredId, 200, 'Bonificación de bienvenida', 'WELCOME_BONUS');
  }

  async processDailyLogin(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingLogin = await this.prisma.eventLog.findFirst({
      where: {
        userId,
        type: 'DAILY_LOGIN',
        createdAt: { gte: today }
      }
    });

    if (existingLogin) {
      return null; // Ya recibió la recompensa de hoy
    }

    // Registrar login diario
    await this.prisma.eventLog.create({
      data: {
        userId,
        type: 'DAILY_LOGIN',
        data: { date: today.toISOString() },
        createdAt: new Date(),
      }
    });

    // 25 Zardas por login diario
    return this.awardZardas(userId, 25, 'Login diario', 'DAILY_LOGIN');
  }

  async processBirthdayReward(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) return null;

    const today = new Date();
    const currentYear = today.getFullYear();
    
    // Extraer día y mes del cumpleaños
    const birthday = new Date(user.phone); // Usando phone como placeholder para fecha de cumpleaños
    const birthdayThisYear = new Date(birthday);
    birthdayThisYear.setFullYear(currentYear);

    // Verificar si hoy es cumpleaños y si ya recibió la recompensa este año
    if (today.toDateString() === birthdayThisYear.toDateString()) {
      const existingReward = await this.prisma.eventLog.findFirst({
        where: {
          userId,
          type: 'BIRTHDAY_REWARD',
          createdAt: { 
            gte: new Date(currentYear, 0, 1),
            lt: new Date(currentYear + 1, 0, 1)
          }
        }
      });

      if (!existingReward) {
        // Registrar recompensa de cumpleaños
        await this.prisma.eventLog.create({
          data: {
            userId,
            type: 'BIRTHDAY_REWARD',
            data: { year: currentYear },
            createdAt: new Date(),
          }
        });

        // 1000 Zardas de regalo de cumpleaños
        return this.awardZardas(userId, 1000, '¡Feliz cumpleaños! 🎂', 'BIRTHDAY_REWARD');
      }
    }

    return null;
  }

  private calculateLeague(balance: number): string {
    if (balance >= 10000) return 'Leyenda Zarda';
    if (balance >= 5000) return 'Maestro Zarda';
    if (balance >= 2500) return 'Experto Zarda';
    if (balance >= 1000) return 'Avanzado Zarda';
    if (balance >= 500) return 'Intermedio Zarda';
    if (balance >= 200) return 'Novato Zarda';
    return 'Bronce Zarda';
  }

  private getNextLeague(currentLeague: string): string {
    const leagues = [
      'Bronce Zarda',
      'Novato Zarda', 
      'Intermedio Zarda',
      'Avanzado Zarda',
      'Experto Zarda',
      'Maestro Zarda',
      'Leyenda Zarda'
    ];
    
    const currentIndex = leagues.indexOf(currentLeague);
    return currentIndex < leagues.length - 1 ? leagues[currentIndex + 1] : currentLeague;
  }

  private getZardasToNextLeague(balance: number, currentLeague: string): number {
    const thresholds = {
      'Bronce Zarda': 200,
      'Novato Zarda': 500,
      'Intermedio Zarda': 1000,
      'Avanzado Zarda': 2500,
      'Experto Zarda': 5000,
      'Maestro Zarda': 10000,
      'Leyenda Zarda': 0
    };

    const nextThreshold = thresholds[currentLeague as keyof typeof thresholds];
    return nextThreshold > 0 ? Math.max(0, nextThreshold - balance) : 0;
  }

  private leveledUp(previousBalance: number, newBalance: number): boolean {
    return this.calculateLeague(previousBalance) !== this.calculateLeague(newBalance);
  }

  private getAvailableRewardsForBalance(balance: number) {
    const rewards = [
      {
        id: 'free_delivery',
        name: 'Envío Gratis',
        description: 'Canjea 500 Zardas para envío gratis en tu próximo pedido',
        cost: 500,
        category: 'DISCOUNT'
      },
      {
        id: '10_percent_discount',
        name: '10% de Descuento',
        description: 'Canjea 800 Zardas para obtener 10% de descuento',
        cost: 800,
        category: 'DISCOUNT'
      },
      {
        id: 'free_dessert',
        name: 'Postre Gratis',
        description: 'Canjea 300 Zardas para un postre gratis',
        cost: 300,
        category: 'PRODUCT'
      },
      {
        id: 'priority_support',
        name: 'Soporte Prioritario',
        description: 'Canjea 1000 Zardas para atención prioritaria',
        cost: 1000,
        category: 'SERVICE'
      },
      {
        id: 'exclusive_item',
        name: 'Producto Exclusivo',
        description: 'Canjea 2000 Zardas para un producto exclusivo',
        cost: 2000,
        category: 'PRODUCT'
      }
    ];

    return rewards.filter(reward => reward.cost <= balance);
  }

  private async getConsecutiveOrderDays(userId: number): Promise<number> {
    // Lógica simplificada para calcular días consecutivos
    const today = new Date();
    let consecutiveDays = 0;
    
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      checkDate.setHours(0, 0, 0, 0);

      const dayOrders = await this.prisma.order.count({
        where: {
          userId: userId.toString(),
          createdAt: {
            gte: checkDate,
            lt: new Date(checkDate.getTime() + 24 * 60 * 60 * 1000)
          },
          paymentStatus: 'SUCCEEDED'
        }
      });

      if (dayOrders > 0) {
        consecutiveDays++;
      } else {
        break;
      }
    }

    return consecutiveDays;
  }
}
