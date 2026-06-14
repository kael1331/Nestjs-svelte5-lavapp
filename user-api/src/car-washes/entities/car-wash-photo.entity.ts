import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { CarWash } from './car-wash.entity';

@Entity('car_wash_photos')
export class CarWashPhoto {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: 'ID único de la foto (UUID)' })
  id: string;

  @Column()
  @ApiProperty({ description: 'ID del lavadero al que pertenece esta foto' })
  carWashId: string;

  @ManyToOne(() => CarWash, (carWash) => carWash.photos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'carWashId' })
  carWash: CarWash;

  @Column({ type: 'text' })
  @ApiProperty({ description: 'URL de la imagen del local en el Storage' })
  url: string;
}
