import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { CarWash } from '../../car-washes/entities/car-wash.entity';

@Entity('schedule_exceptions')
export class ScheduleException {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: 'ID único de la excepción (UUID)' })
  id: string;

  @Column()
  @ApiProperty({ description: 'ID del lavadero al que pertenece esta excepción' })
  carWashId: string;

  @ManyToOne(() => CarWash, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'carWashId' })
  carWash: CarWash;

  @Column({ type: 'date' })
  @ApiProperty({ description: 'Fecha de la excepción (YYYY-MM-DD)' })
  date: string;

  @Column({ type: 'text', nullable: true })
  @ApiProperty({ description: 'Razón de la excepción (Ej: Feriado, Reparación)', required: false })
  reason: string | null;
}
