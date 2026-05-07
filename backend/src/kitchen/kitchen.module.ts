import { Module } from '@nestjs/common';
import { KitchenService } from './kitchen.service';
import { KitchenController } from './kitchen.controller';
import { OrdersModule } from '../orders/orders.module';
import { ScheduleModule } from '../schedule/schedule.module';

@Module({
  imports: [OrdersModule, ScheduleModule],
  providers: [KitchenService],
  controllers: [KitchenController],
})
export class KitchenModule {}