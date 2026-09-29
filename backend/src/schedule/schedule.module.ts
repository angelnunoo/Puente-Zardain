import { Module } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { ScheduleController } from './schedule.controller';
import { ScheduleRepository } from './schedule.repository';
import { RestaurantService } from './restaurant.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  providers: [ScheduleService, ScheduleRepository, RestaurantService],
  controllers: [ScheduleController],
  exports: [ScheduleService],
})
export class ScheduleModule {}
