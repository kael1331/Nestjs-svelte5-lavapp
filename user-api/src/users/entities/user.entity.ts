import { Entity, PrimaryGeneratedColumn, Column, OneToOne } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { CarWash } from '../../car-washes/entities/car-wash.entity';

export enum UserRole {
  CLIENT = 'client',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  @ApiProperty({ description: 'ID autogenerado del usuario' })
  id: number;

  @Column()
  @ApiProperty({ description: 'Nombre completo del usuario' })
  name: string;

  @Column({ unique: true })
  @ApiProperty({ description: 'Correo electrónico del usuario' })
  email: string;

  @Column({
    type: 'simple-enum',
    enum: UserRole,
    default: UserRole.CLIENT,
  })
  @ApiProperty({ enum: UserRole, default: UserRole.CLIENT, description: 'Rol jerárquico del usuario' })
  role: UserRole;

  @Column({ select: false, nullable: true })
  password?: string;

  @Column({ nullable: true, unique: true })
  @ApiProperty({ description: 'ID único de Google del usuario', required: false })
  googleId?: string;

  @OneToOne(() => CarWash, (carWash) => carWash.admin)
  @ApiProperty({ type: () => CarWash, description: 'Establecimiento del administrador', required: false })
  carWash?: CarWash;
}
