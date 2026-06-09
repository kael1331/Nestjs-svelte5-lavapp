import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: 'ID único de la notificación (UUID)' })
  id: string;

  @Column()
  @ApiProperty({ description: 'ID del usuario destinatario' })
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  @ApiProperty({ description: 'Título del aviso' })
  title: string;

  @Column({ type: 'text' })
  @ApiProperty({ description: 'Cuerpo del mensaje descriptivo' })
  message: string;

  @Column({ default: false })
  @ApiProperty({ description: 'Regula el punto de notificación visual' })
  isRead: boolean;

  @CreateDateColumn()
  @ApiProperty({ description: 'Fecha de creación' })
  createdAt: Date;
}
