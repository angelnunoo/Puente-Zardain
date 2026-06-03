import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { OrdersRepository } from './orders.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { ScheduleModule } from '../schedule/schedule.module';
import { ZardasModule } from '../zardas/zardas.module';

@Module({
  imports: [PrismaModule, CommonModule, ScheduleModule, ZardasModule],
  providers: [OrdersService, OrdersRepository],
  controllers: [OrdersController],
  exports: [OrdersService],
})
export class OrdersModule {}
