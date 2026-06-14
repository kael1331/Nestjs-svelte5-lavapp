import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';

@Entity('admin_vehicles')
export class AdminVehicle {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: 'ID único del vehículo del administrador (UUID)' })
  id: string;

  @Column()
  @ApiProperty({ description: 'ID del administrador propietario de esta configuración' })
  adminId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'adminId' })
  admin: User;

  @Column({ length: 50 })
  @ApiProperty({ description: 'Nombre del tipo de vehículo (Ej: auto, camioneta, moto, camión)' })
  name: string;

  @Column({ default: true })
  @ApiProperty({ description: 'Estado activo o inactivo del vehículo para el catálogo' })
  isActive: boolean;
}
