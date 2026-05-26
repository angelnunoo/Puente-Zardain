/**
 * COMMON MODULE
 * Módulo global con servicios compartidos, excepciones, guards, pipes y filtros
 */

import { Global, Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_PIPE } from '@nestjs/core';
import { EventBusService } from './events/event-bus.service';
import { OrderEventsService } from './events/order-events.service';
import { AppLogger } from './logger/app-logger.service';
import { GlobalExceptionFilter } from './filters/global-exception.filter';
import { RoleGuard } from './guards/role.guard';
import { AppValidationPipe } from './pipes/validation.pipe';
import { ZardasModule } from '../zardas/zardas.module';

@Global()
@Module({
  imports: [ZardasModule],
  providers: [
    EventBusService,
    OrderEventsService,
    AppLogger,
    // Filtros globales
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    // Guards globales
    {
      provide: APP_GUARD,
      useClass: RoleGuard,
    },
    // Pipes globales
    {
      provide: APP_PIPE,
      useClass: AppValidationPipe,
    },
  ],
  exports: [EventBusService, OrderEventsService, AppLogger],
})
export class CommonModule {}
