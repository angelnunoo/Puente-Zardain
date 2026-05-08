import { Module } from '@nestjs/common';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [
    NotificationsGateway,
  ],
  providers: [
    NotificationsService,
  ],
  exports: [
    NotificationsGateway,
    NotificationsService,
  ],
})
export class NotificationsModule {}
