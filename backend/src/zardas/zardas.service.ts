import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ZardasService {
  constructor(private prisma: PrismaService) {}

  async addZardas(userId: string, amount: number, reason: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      return this.prisma.user.update({
        where: { id: userId },
        data: { zardas: user.zardas + amount },
      });
    }
  }

  async getZardas(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    return { zardas: user?.zardas || 0, league: user?.league || 'Bronce Zarda' };
  }
}