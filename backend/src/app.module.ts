import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { ChatModule } from './chat/chat.module';
import { KitchenModule } from './kitchen/kitchen.module';
import { ReviewsModule } from './reviews/reviews.module';
import { ZardasModule } from './zardas/zardas.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, UsersModule, AuthModule, ProductsModule, OrdersModule, ChatModule, KitchenModule, ReviewsModule, ZardasModule],
})
export class AppModule {}