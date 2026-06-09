import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { CarWash } from './car-wash.entity';

export enum BayStatus {
  FREE = 'free',
  OCCUPIED = 'occupied',
  BLOCKED = 'blocked',
}

@Entity('car_wash_bays')
export class CarWashBay {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: 'ID único de la bahía (UUID)' })
  id: string;

  @Column()
  @ApiProperty({ description: 'ID del lavadero al que pertenece esta bahía' })
  carWashId: string;

  @ManyToOne(() => CarWash, (carWash) => carWash.bays, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'carWashId' })
  carWash: CarWash;

  @Column()
  @ApiProperty({ description: 'Número de la bahía (1, 2, 3, etc.)' })
  bayNumber: number;

  @Column({
    type: 'simple-enum',
    enum: BayStatus,
    default: BayStatus.FREE,
  })
  @ApiProperty({ enum: BayStatus, default: BayStatus.FREE, description: 'Estado en tiempo real de la bahía' })
  status: BayStatus;

  @Column({ nullable: true })
  @ApiProperty({ description: 'ID de la reserva que ocupa actualmente esta bahía', required: false })
  currentBookingId: string;
}
