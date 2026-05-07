import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventBusService } from './event-bus.service';
import { ZardasService } from '../../zardas/zardas.service';

@Injectable()
export class OrderEventsService implements OnModuleInit {
  constructor(
    private readonly eventBus: EventBusService,
    private readonly zardasService: ZardasService,
  ) {}

  onModuleInit() {
    this.eventBus.on('OrderDelivered', this.handleOrderDelivered.bind(this));
  }

  private async handleOrderDelivered(payload: { orderId: string; userId: string }) {
    // Add bonus Zardas when order is delivered
    await this.zardasService.addZardas(
      payload.userId,
      5, // Bonus 5 Zardas for delivery
      `Entrega completada para pedido ${payload.orderId.slice(0, 8)}`
    );
  }
}