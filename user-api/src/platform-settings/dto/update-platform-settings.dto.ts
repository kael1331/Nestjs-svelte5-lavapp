import { ApiProperty } from '@nestjs/swagger';

export class UpdatePlatformSettingsDto {
  @ApiProperty({ description: 'Alias bancario/CBU/CVU de la plataforma para recibir pagos', required: false })
  superadminAlias?: string;

  @ApiProperty({ description: 'Costo mensual de la membresía del lavadero', required: false })
  subscriptionPrice?: number;
}
