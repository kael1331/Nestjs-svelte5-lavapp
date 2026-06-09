import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CarWash } from './entities/car-wash.entity';
import { CarWashBay } from './entities/car-wash-bay.entity';
import { AdminSubscription } from './entities/admin-subscription.entity';
import { CarWashesService } from './car-washes.service';
import { CarWashesController } from './car-washes.controller';
import { PlatformSettings } from '../platform-settings/entities/platform-settings.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CarWash, CarWashBay, AdminSubscription, PlatformSettings]),
    AuthModule,
    NotificationsModule,
  ],
  exports: [TypeOrmModule, CarWashesService],
  providers: [CarWashesService],
  controllers: [CarWashesController],
})
export class CarWashesModule {}
