import { Module, Global, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersModule } from '../users/users.module';

import { Notification } from './entities/notification.entity';
import { NotificationsController } from './notifications.controller';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
    forwardRef(() => UsersModule),
    JwtModule.register({}), // Will use JWT_SECRET from ConfigService
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsGateway],
  exports: [NotificationsService, NotificationsGateway],
})
export class NotificationsModule {}
