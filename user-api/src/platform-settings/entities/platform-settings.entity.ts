import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('platform_settings')
export class PlatformSettings {
  @PrimaryColumn({ default: 1 })
  @ApiProperty({ description: 'ID de configuración único (siempre = 1)' })
  id: number;

  @Column({ length: 100 })
  @ApiProperty({ description: 'Alias bancario/CBU/CVU de la plataforma para recibir pagos' })
  superadminAlias: string;

  @Column('decimal', { precision: 10, scale: 2 })
  @ApiProperty({ description: 'Costo mensual de la membresía del lavadero' })
  subscriptionPrice: number;

  @UpdateDateColumn()
  @ApiProperty({ description: 'Última actualización de tarifas globales' })
  updatedAt: Date;
}
