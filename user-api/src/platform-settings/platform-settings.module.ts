import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlatformSettings } from './entities/platform-settings.entity';
import { PlatformSettingsService } from './platform-settings.service';
import { PlatformSettingsController } from './platform-settings.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PlatformSettings]),
    AuthModule,
  ],
  controllers: [PlatformSettingsController],
  providers: [PlatformSettingsService],
  exports: [TypeOrmModule, PlatformSettingsService],
})
export class PlatformSettingsModule {}
