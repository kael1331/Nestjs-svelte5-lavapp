import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { ServicesService } from './services.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { SubscriptionGuard } from '../auth/subscription.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { Service } from './entities/service.entity';

@ApiTags('services')
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @UseGuards(AuthGuard, RolesGuard, SubscriptionGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crea un nuevo servicio para el establecimiento' })
  @ApiCreatedResponse({ type: Service })
  create(
    @Body() createDto: {
      name: string;
      description?: string;
      vehicleType: string;
      durationMinutes: number;
      price: number;
    },
    @Req() req: any,
  ) {
    const adminId = req.user.sub;
    return this.servicesService.create(adminId, createDto);
  }

  @Get()
  @UseGuards(AuthGuard, RolesGuard, SubscriptionGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtiene todos los servicios del establecimiento del administrador autenticado' })
  @ApiOkResponse({ type: [Service] })
  findAll(@Req() req: any) {
    const adminId = req.user.sub;
    return this.servicesService.findAllByAdmin(adminId);
  }

  @Get('car-wash/:carWashId')
  @ApiOperation({ summary: 'Obtiene todos los servicios de un establecimiento específico (público)' })
  @ApiOkResponse({ type: [Service] })
  findAllByCarWash(@Param('carWashId') carWashId: string) {
    return this.servicesService.findAllByCarWashId(carWashId);
  }

  @Get(':id')
  @UseGuards(AuthGuard, RolesGuard, SubscriptionGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtiene un servicio específico' })
  @ApiOkResponse({ type: Service })
  findOne(@Param('id') id: string, @Req() req: any) {
    const adminId = req.user.sub;
    return this.servicesService.findOneByAdmin(adminId, id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard, RolesGuard, SubscriptionGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualiza los datos de un servicio' })
  @ApiOkResponse({ type: Service })
  update(
    @Param('id') id: string,
    @Body() updateDto: {
      name?: string;
      description?: string;
      vehicleType?: string;
      durationMinutes?: number;
      price?: number;
    },
    @Req() req: any,
  ) {
    const adminId = req.user.sub;
    return this.servicesService.update(adminId, id, updateDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard, SubscriptionGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Elimina un servicio' })
  @ApiOkResponse({ description: 'Servicio eliminado correctamente' })
  remove(@Param('id') id: string, @Req() req: any) {
    const adminId = req.user.sub;
    return this.servicesService.remove(adminId, id);
  }
}
