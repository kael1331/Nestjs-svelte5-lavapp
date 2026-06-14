import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';
import { CarWashBay } from './car-wash-bay.entity';
import { AdminSubscription } from './admin-subscription.entity';
import { CarWashPhoto } from './car-wash-photo.entity';

@Entity('car_washes')
export class CarWash {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: 'ID único del lavadero (UUID)' })
  id: string;

  @Column()
  @ApiProperty({ description: 'ID del usuario administrador dueño del lavadero' })
  adminId: number;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'adminId' })
  admin: User;

  @Column({ length: 150, nullable: true })
  @ApiProperty({ description: 'Nombre comercial del lavadero', required: false })
  name: string;

  @Column('decimal', { precision: 10, scale: 8, nullable: true })
  @ApiProperty({ description: 'Coordenada de latitud', required: false })
  latitude: number;

  @Column('decimal', { precision: 11, scale: 8, nullable: true })
  @ApiProperty({ description: 'Coordenada de longitud', required: false })
  longitude: number;

  @Column({ default: 1 })
  @ApiProperty({ description: 'Número de bahías físicas de lavado simultáneo' })
  baysCount: number;

  @Column({ length: 100, nullable: true })
  @ApiProperty({ description: 'Alias bancario/CBU/CVU visible para los clientes para pagar turnos', required: false })
  clientPaymentAlias: string;

  @Column({ default: true })
  @ApiProperty({ description: 'Botón manual de apertura: abierto (true) o cerrado (false)' })
  isManuallyOpen: boolean;

  @Column({ length: 20, default: 'automatic' })
  @ApiProperty({ description: 'Modo de apertura del establecimiento: automatic (según horario laboral) o manual', default: 'automatic' })
  openingMode: string;

  @Column({ default: false })
  @ApiProperty({ description: 'Estado controlado por la suscripción y el Superadmin (activo o inactivo)' })
  isServiceActive: boolean; // Renombrado a isServiceActive para evitar colisión con is_active en TypeORM si es necesario, o keep isActive. Let's use isServiceActive.

  @Column({ type: 'datetime', nullable: true })
  @ApiProperty({ description: 'Fecha límite de vigencia de la suscripción (visualización pública)', required: false })
  subscriptionExpiresAt: Date;

  @OneToMany(() => CarWashBay, (bay) => bay.carWash)
  bays: CarWashBay[];

  @OneToMany(() => AdminSubscription, (sub) => sub.carWash)
  subscriptions: AdminSubscription[];

  @OneToMany(() => CarWashPhoto, (photo) => photo.carWash)
  @ApiProperty({ type: () => [CarWashPhoto], description: 'Fotos de la galería del establecimiento', required: false })
  photos: CarWashPhoto[];
}
