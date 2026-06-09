import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { CarWash } from './car-wash.entity';

export enum SubscriptionStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('admin_subscriptions')
export class AdminSubscription {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: 'ID único de la suscripción (UUID)' })
  id: string;

  @Column()
  @ApiProperty({ description: 'ID del lavadero que realiza el pago' })
  carWashId: string;

  @ManyToOne(() => CarWash, (carWash) => carWash.subscriptions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'carWashId' })
  carWash: CarWash;

  @Column({ type: 'text' })
  @ApiProperty({ description: 'URL de la imagen del comprobante de transferencia en el Storage' })
  receiptUrl: string;

  @Column({
    type: 'simple-enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.PENDING,
  })
  @ApiProperty({ enum: SubscriptionStatus, default: SubscriptionStatus.PENDING, description: 'Estado de la validación del pago' })
  status: SubscriptionStatus;

  @Column('decimal', { precision: 10, scale: 2 })
  @ApiProperty({ description: 'Monto capturado basándose en el precio global al momento del pago' })
  amountPaid: number;

  @CreateDateColumn()
  @ApiProperty({ description: 'Fecha de carga del comprobante' })
  createdAt: Date;
}
