/**
 * APP MODULE
 * Módulo raíz de la aplicación con todos los módulos
 */

import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { ChatModule } from './chat/chat.module';
import { KitchenModule } from './kitchen/kitchen.module';
import { ReviewsModule } from './reviews/reviews.module';
import { ZardasModule } from './zardas/zardas.module';
import { ScheduleModule } from './schedule/schedule.module';
import { CartModule } from './cart/cart.module';
import { PaymentsModule } from './payments/payments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { IncidentsModule } from './incidents/incidents.module';
import { GamificationModule } from './gamification/gamification.module';
import { LoggingMiddleware } from './common/middleware/logging.middleware';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    CommonModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    OrdersModule,
    ChatModule,
    KitchenModule,
    ReviewsModule,
    ZardasModule,
    ScheduleModule,
    CartModule,
    PaymentsModule,
    NotificationsModule,
    AnalyticsModule,
    IncidentsModule,
    GamificationModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}