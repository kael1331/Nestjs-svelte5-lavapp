import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchedulesService } from './schedules.service';
import { SchedulesController } from './schedules.controller';
import { Schedule } from './entities/schedule.entity';
import { ScheduleException } from './entities/schedule-exception.entity';
import { AuthModule } from '../auth/auth.module';
import { CarWashesModule } from '../car-washes/car-washes.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Schedule, ScheduleException]),
    AuthModule,
    CarWashesModule,
  ],
  providers: [SchedulesService],
  controllers: [SchedulesController],
  exports: [SchedulesService],
})
export class SchedulesModule {}
