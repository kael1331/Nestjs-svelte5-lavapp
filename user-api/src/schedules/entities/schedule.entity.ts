import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { CarWash } from '../../car-washes/entities/car-wash.entity';

@Entity('schedules')
export class Schedule {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: 'ID único del horario regular (UUID)' })
  id: string;

  @Column()
  @ApiProperty({ description: 'ID del lavadero al que pertenece este horario' })
  carWashId: string;

  @ManyToOne(() => CarWash, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'carWashId' })
  carWash: CarWash;

  @Column({ type: 'integer' })
  @ApiProperty({ description: 'Día de la semana (0 = Domingo, 6 = Sábado)' })
  dayOfWeek: number;

  @Column({ length: 5 })
  @ApiProperty({ description: 'Hora de apertura (HH:MM)' })
  startTime: string;

  @Column({ length: 5 })
  @ApiProperty({ description: 'Hora de cierre (HH:MM)' })
  endTime: string;
}
