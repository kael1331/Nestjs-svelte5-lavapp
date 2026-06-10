import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiTags, ApiCreatedResponse, ApiOkResponse, ApiBearerAuth } from '@nestjs/swagger';
import { User, UserRole } from './entities/user.entity';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../auth/auth.service';
import * as express from 'express';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly authService: AuthService,
  ) {}

  @Post()
  @ApiCreatedResponse({ type: User, description: 'Usuario creado exitosamente' })
  async create(@Body() createUserDto: CreateUserDto, @Req() req: express.Request) {
    // Si se solicita el rol super_admin, se requiere validación estricta
    if (createUserDto.role && createUserDto.role === UserRole.SUPER_ADMIN) {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        throw new ForbiddenException('No autorizado para crear usuarios con roles privilegiados.');
      }

      const [type, token] = authHeader.split(' ');
      if (type !== 'Bearer' || !token) {
        throw new ForbiddenException('Formato de token de autorización inválido.');
      }

      const isRevoked = await this.authService.isTokenRevoked(token);
      if (isRevoked) {
        throw new ForbiddenException('El token ha sido revocado.');
      }

      try {
        const payload = await this.jwtService.verifyAsync(token, {
          secret: 'super-secret-key-12345',
        });
        
        if (payload.role !== UserRole.SUPER_ADMIN) {
          throw new ForbiddenException('Solo el rol super_admin puede crear usuarios con roles privilegiados.');
        }
      } catch (error) {
        if (error instanceof ForbiddenException) {
          throw error;
        }
        throw new ForbiddenException('Token inválido o vencido para la asignación de roles.');
      }
    }

    if (!createUserDto.role) {
      createUserDto.role = UserRole.CLIENT;
    }

    return this.usersService.create(createUserDto);
  }

  @Get()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOkResponse({ type: [User], description: 'Lista de usuarios' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOkResponse({ type: User, description: 'Usuario encontrado' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOkResponse({ type: User, description: 'Usuario actualizado' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOkResponse({ type: User, description: 'Usuario eliminado' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}
