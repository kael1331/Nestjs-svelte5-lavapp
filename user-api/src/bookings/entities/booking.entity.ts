import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';
import { CarWash } from '../../car-washes/entities/car-wash.entity';
import { Service } from '../../services/entities/service.entity';
import { CarWashBay } from '../../car-washes/entities/car-wash-bay.entity';

export enum BookingStatus {
  TEMPORARY_LOCKED = 'temporary_locked',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: 'ID único de la reserva (UUID)' })
  id: string;

  @Column()
  @ApiProperty({ description: 'ID del cliente' })
  clientId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clientId' })
  client: User;

  @Column()
  @ApiProperty({ description: 'ID del lavadero' })
  carWashId: string;

  @ManyToOne(() => CarWash, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'carWashId' })
  carWash: CarWash;

  @Column()
  @ApiProperty({ description: 'ID del servicio reservado' })
  serviceId: string;

  @ManyToOne(() => Service, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'serviceId' })
  service: Service;

  @Column({ nullable: true })
  @ApiProperty({ description: 'ID de la bahía física asignada', required: false })
  assignedBayId: string;

  @ManyToOne(() => CarWashBay, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'assignedBayId' })
  assignedBay: CarWashBay;

  @Column({ type: 'datetime' })
  @ApiProperty({ description: 'Fecha y hora de inicio de la reserva' })
  dateTime: Date;

  @Column({ type: 'datetime' })
  @ApiProperty({ description: 'Fecha y hora de fin de la reserva (calculado)' })
  endTime: Date;

  @Column({ type: 'text', nullable: true })
  @ApiProperty({ description: 'URL del comprobante de pago', required: false })
  receiptUrl: string;

  @Column({
    type: 'simple-enum',
    enum: BookingStatus,
    default: BookingStatus.TEMPORARY_LOCKED,
  })
  @ApiProperty({ enum: BookingStatus, default: BookingStatus.TEMPORARY_LOCKED })
  status: BookingStatus;

  @Column({ type: 'datetime', nullable: true })
  @ApiProperty({ description: 'Límite de tiempo para el bloqueo preventivo de 10 min', required: false })
  lockedUntil: Date | null;
}
