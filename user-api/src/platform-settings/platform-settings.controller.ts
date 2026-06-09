import { Controller, Get } from '@nestjs/common';
import { PlatformSettingsService } from './platform-settings.service';
import { ApiTags, ApiOkResponse } from '@nestjs/swagger';
import { PlatformSettings } from './entities/platform-settings.entity';

@ApiTags('platform-settings')
@Controller('platform-settings')
export class PlatformSettingsController {
  constructor(private readonly settingsService: PlatformSettingsService) {}

  @Get()
  @ApiOkResponse({ type: PlatformSettings, description: 'Obtiene las configuraciones globales de la plataforma' })
  getSettings() {
    return this.settingsService.getSettings();
  }
}
