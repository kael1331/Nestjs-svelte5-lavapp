import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';
import { Service } from './entities/service.entity';
import { AuthModule } from '../auth/auth.module';
import { CarWashesModule } from '../car-washes/car-washes.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Service]),
    AuthModule,
    CarWashesModule,
  ],
  providers: [ServicesService],
  controllers: [ServicesController],
  exports: [ServicesService],
})
export class ServicesModule {}
