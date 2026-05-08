import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ZardasService } from './zardas.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('zardas')
export class ZardasController {
  constructor(private zardasService: ZardasService) {}

  @UseGuards(JwtAuthGuard)
  @Get(':userId')
  getZardas(@Param('userId') userId: string) {
    return this.zardasService.getZardas(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':userId/add')
  addZardas(@Param('userId') userId: string, @Body() body: { amount: number; reason: string }) {
    return this.zardasService.addZardas(userId, body.amount, body.reason);
  }

  @Get('loyalty')
  async getLoyaltyData() {
    // Simular datos de lealtad Zardas
    const loyaltyData = {
      current: 245,
      totalEarned: 1250,
      currentLeague: 'Plata',
      nextLeague: 'Oro',
      zardasToNextLeague: 255,
      currentReward: {
        id: 'reward-1',
        name: 'Hamburguesa Gratis',
        description: 'Canjea una hamburguesa clásica gratis',
        zardasNeeded: 300,
        isAvailable: false
      },
      recentActivity: [
        {
          id: 'activity-1',
          description: 'Pedido #1234 completado',
          zardas: 25,
          date: new Date(Date.now() - 86400000).toISOString() // Ayer
        },
        {
          id: 'activity-2',
          description: 'Pedido #1233 completado',
          zardas: 18,
          date: new Date(Date.now() - 172800000).toISOString() // Hace 2 días
        },
        {
          id: 'activity-3',
          description: 'Registro en el programa',
          zardas: 50,
          date: new Date(Date.now() - 604800000).toISOString() // Hace 1 semana
        }
      ]
    };

    return loyaltyData;
  }
}