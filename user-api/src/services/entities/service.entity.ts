import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { CarWash } from '../../car-washes/entities/car-wash.entity';

@Entity('services')
export class Service {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: 'ID único del servicio (UUID)' })
  id: string;

  @Column()
  @ApiProperty({ description: 'ID del lavadero al que pertenece este servicio' })
  carWashId: string;

  @ManyToOne(() => CarWash, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'carWashId' })
  carWash: CarWash;

  @Column({ length: 100 })
  @ApiProperty({ description: 'Nombre del servicio (Ej: Lavado Premium Completo)' })
  name: string;

  @Column({ type: 'text', nullable: true })
  @ApiProperty({ description: 'Descripción detallada del servicio', required: false })
  description: string;

  @Column({ length: 50 })
  @ApiProperty({ description: 'Tipo de vehículo (Ej: moto, auto, camioneta)' })
  vehicleType: string;

  @Column({ type: 'integer' })
  @ApiProperty({ description: 'Duración en minutos (debe ser múltiplo de 15)' })
  durationMinutes: number;

  @Column('decimal', { precision: 10, scale: 2 })
  @ApiProperty({ description: 'Precio del servicio' })
  price: number;
}
