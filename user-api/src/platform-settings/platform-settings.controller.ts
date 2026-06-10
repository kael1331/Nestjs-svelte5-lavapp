import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { PlatformSettingsService } from './platform-settings.service';
import { ApiTags, ApiOkResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PlatformSettings } from './entities/platform-settings.entity';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { UpdatePlatformSettingsDto } from './dto/update-platform-settings.dto';

@ApiTags('platform-settings')
@Controller('platform-settings')
export class PlatformSettingsController {
  constructor(private readonly settingsService: PlatformSettingsService) {}

  @Get()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOkResponse({ type: PlatformSettings, description: 'Obtiene las configuraciones globales de la plataforma' })
  getSettings() {
    return this.settingsService.getSettings();
  }

  @Patch()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOkResponse({ type: PlatformSettings, description: 'Actualiza las configuraciones globales de la plataforma' })
  updateSettings(@Body() updateDto: UpdatePlatformSettingsDto) {
    return this.settingsService.updateSettings(updateDto);
  }
}
