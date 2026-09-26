/**
 * COMMON MODULE
 * Módulo global con servicios compartidos, excepciones, guards, pipes y filtros
 */

import { Global, Module, APP_FILTER, APP_PIPE } from '@nestjs/common';
import { EventBusService } from './events/event-bus.service';
import { OrderEventsService } from './events/order-events.service';
import { AppLogger } from './logger/app-logger.service';
import { GlobalExceptionFilter } from './filters/global-exception.filter';
import { AppValidationPipe } from './pipes/validation.pipe';

@Global()
@Module({
  providers: [
    EventBusService,
    OrderEventsService,
    AppLogger,
    // Filtros globales
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    // Role checks stay on each route as RolesGuard after JwtAuthGuard.
    // Registering RoleGuard globally runs it before JWT auth, so request.user
    // is still empty and every @Roles handler is rejected.
    // Pipes globales
    {
      provide: APP_PIPE,
      useClass: AppValidationPipe,
    },
  ],
  exports: [EventBusService, OrderEventsService, AppLogger],
})
export class CommonModule {}
