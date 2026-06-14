import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';

import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users/entities/user.entity';
import { RevokedToken } from './auth/entities/revoked-token.entity';
import { AuthModule } from './auth/auth.module';
import { Notification } from './notifications/entities/notification.entity';
import { NotificationsModule } from './notifications/notifications.module';
import { PlatformSettingsModule } from './platform-settings/platform-settings.module';
import { PlatformSettings } from './platform-settings/entities/platform-settings.entity';
import { CarWashesModule } from './car-washes/car-washes.module';
import { CarWash } from './car-washes/entities/car-wash.entity';
import { CarWashBay } from './car-washes/entities/car-wash-bay.entity';
import { AdminSubscription } from './car-washes/entities/admin-subscription.entity';
import { AdminVehicle } from './car-washes/entities/admin-vehicle.entity';
import { CarWashPhoto } from './car-washes/entities/car-wash-photo.entity';
import { ServicesModule } from './services/services.module';

import { Service } from './services/entities/service.entity';
import { SchedulesModule } from './schedules/schedules.module';
import { Schedule } from './schedules/entities/schedule.entity';
import { ScheduleException } from './schedules/entities/schedule-exception.entity';
import { BookingsModule } from './bookings/bookings.module';
import { Booking } from './bookings/entities/booking.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqljs',
      location: 'db.sqlite',
      autoSave: true,
      entities: [
        User,
        RevokedToken,
        Notification,
        PlatformSettings,
        CarWash,
        CarWashBay,
        AdminSubscription,
        AdminVehicle,
        CarWashPhoto,
        Service,
        Schedule,
        ScheduleException,
        Booking,
      ],
      synchronize: true,
    }),
    UsersModule,
    AuthModule,
    NotificationsModule,
    PlatformSettingsModule,
    CarWashesModule,
    ServicesModule,
    SchedulesModule,
    BookingsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
