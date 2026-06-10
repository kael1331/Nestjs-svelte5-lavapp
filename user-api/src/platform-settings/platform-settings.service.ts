import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlatformSettings } from './entities/platform-settings.entity';
import { UpdatePlatformSettingsDto } from './dto/update-platform-settings.dto';

@Injectable()
export class PlatformSettingsService implements OnModuleInit {
  constructor(
    @InjectRepository(PlatformSettings)
    private readonly settingsRepository: Repository<PlatformSettings>,
  ) {}

  async onModuleInit() {
    const count = await this.settingsRepository.count();
    if (count === 0) {
      const defaultSettings = this.settingsRepository.create({
        id: 1,
        superadminAlias: 'plataforma.lavados.alias',
        subscriptionPrice: 1500.00,
      });
      await this.settingsRepository.save(defaultSettings);
      console.log('Seeded default platform settings successfully.');
    }
  }

  async getSettings(): Promise<PlatformSettings> {
    const settings = await this.settingsRepository.findOne({ where: { id: 1 } });
    if (!settings) {
      return this.settingsRepository.save({
        id: 1,
        superadminAlias: 'plataforma.lavados.alias',
        subscriptionPrice: 1500.00,
      });
    }
    return settings;
  }

  async updateSettings(updateDto: UpdatePlatformSettingsDto): Promise<PlatformSettings> {
    const settings = await this.getSettings();
    if (updateDto.superadminAlias !== undefined) {
      settings.superadminAlias = updateDto.superadminAlias;
    }
    if (updateDto.subscriptionPrice !== undefined) {
      settings.subscriptionPrice = Number(updateDto.subscriptionPrice);
    }
    return await this.settingsRepository.save(settings);
  }
}
