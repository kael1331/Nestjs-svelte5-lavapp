import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CarWash } from './entities/car-wash.entity';
import { CarWashBay } from './entities/car-wash-bay.entity';
import { AdminSubscription } from './entities/admin-subscription.entity';
import { AdminVehicle } from './entities/admin-vehicle.entity';
import { CarWashPhoto } from './entities/car-wash-photo.entity';
import { CarWashesService } from './car-washes.service';
import { CarWashesController } from './car-washes.controller';
import { AdminVehiclesController } from './admin-vehicles.controller';
import { PlatformSettings } from '../platform-settings/entities/platform-settings.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CarWash,
      CarWashBay,
      AdminSubscription,
      PlatformSettings,
      AdminVehicle,
      CarWashPhoto,
    ]),
    AuthModule,
    NotificationsModule,
  ],
  exports: [TypeOrmModule, CarWashesService],
  providers: [CarWashesService],
  controllers: [CarWashesController, AdminVehiclesController],
})
export class CarWashesModule {}
