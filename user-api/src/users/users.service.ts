import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserRole } from './entities/user.entity';
import * as bcryptjs from 'bcryptjs';
import { CarWashesService } from '../car-washes/car-washes.service';

function isSuperAdminEmail(email: string): boolean {
  if (!email) return false;
  const normalized = email
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return normalized === 'kearcangel@gmail.com' || normalized === 'arcangel@gmail.com';
}

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly carWashesService: CarWashesService,
  ) {}

  async onModuleInit() {
    const count = await this.usersRepository.count();
    if (count === 0) {
      const hashedPassword = await bcryptjs.hash('superpassword123', 10);
      const defaultSuperAdmin = this.usersRepository.create({
        name: 'Super Administrador',
        email: 'superadmin@lavaapp.com',
        password: hashedPassword,
        role: UserRole.SUPER_ADMIN,
      });
      await this.usersRepository.save(defaultSuperAdmin);
      console.log('Seeded default SuperAdmin user successfully.');
    }

    // Asegurar que las cuentas de administrador del cliente siempre tengan rol SUPER_ADMIN
    const adminEmails = ['kearcangel@gmail.com', 'arcangel@gmail.com', 'arcángel@gmail.com'];
    for (const email of adminEmails) {
      const normalized = email.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      
      let user = await this.usersRepository.findOne({
        where: [{ email }, { email: normalized }]
      });

      if (user) {
        if (user.role !== UserRole.SUPER_ADMIN) {
          user.role = UserRole.SUPER_ADMIN;
          await this.usersRepository.save(user);
          console.log(`Se actualizó el rol de ${email} a SUPER_ADMIN en el inicio.`);
        }
      } else {
        const newUser = this.usersRepository.create({
          name: email.includes('kearcangel') ? 'Súper Admin Archángel' : 'Súper Admin Arcángel',
          email: normalized,
          role: UserRole.SUPER_ADMIN,
        });
        await this.usersRepository.save(newUser);
        console.log(`Se pre-creó la cuenta ${normalized} como SUPER_ADMIN.`);
      }
    }
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const role = isSuperAdminEmail(createUserDto.email) ? UserRole.SUPER_ADMIN : createUserDto.role;
    const hashedPassword = await bcryptjs.hash(createUserDto.password, 10);
    const newUser = this.usersRepository.create({
      ...createUserDto,
      role,
      password: hashedPassword,
    });
    const savedUser = await this.usersRepository.save(newUser);

    // Si el usuario es un administrador, creamos su lavadero por defecto
    if (savedUser.role === UserRole.ADMIN) {
      await this.carWashesService.create(savedUser.id);
    }

    return savedUser;
  }

  async findOneByEmailWithPassword(email: string): Promise<User | null> {
    return await this.usersRepository.findOne({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        password: true,
      },
      relations: {
        carWash: true,
      },
    });
  }

  async findOneByEmail(email: string): Promise<User | null> {
    return await this.usersRepository.findOne({
      where: { email },
      relations: {
        carWash: true,
      },
    });
  }

  async findOneByGoogleId(googleId: string): Promise<User | null> {
    return await this.usersRepository.findOne({
      where: { googleId },
      relations: {
        carWash: true,
      },
    });
  }

  async updateGoogleId(id: number, googleId: string): Promise<User> {
    const user = await this.findOne(id);
    user.googleId = googleId;
    if (isSuperAdminEmail(user.email)) {
      user.role = UserRole.SUPER_ADMIN;
    }
    return await this.usersRepository.save(user);
  }

  async createOAuthUser(data: { name: string; email: string; googleId: string }): Promise<User> {
    const role = isSuperAdminEmail(data.email) ? UserRole.SUPER_ADMIN : UserRole.CLIENT;
    const newUser = this.usersRepository.create({
      name: data.name,
      email: data.email,
      googleId: data.googleId,
      role: role,
    });
    return await this.usersRepository.save(newUser);
  }

  async findAll(): Promise<User[]> {
    return await this.usersRepository.find();
  }

  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    const updatedUser = this.usersRepository.merge(user, updateUserDto);
    return await this.usersRepository.save(updatedUser);
  }

  async remove(id: number): Promise<User> {
    const user = await this.findOne(id);
    return await this.usersRepository.remove(user);
  }
}
