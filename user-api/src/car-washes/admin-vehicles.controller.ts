import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { CarWashesService } from './car-washes.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { AdminVehicle } from './entities/admin-vehicle.entity';

@ApiTags('admin-vehicles')
@Controller('admin-vehicles')
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class AdminVehiclesController {
  constructor(private readonly carWashesService: CarWashesService) {}

  @Get()
  @ApiOperation({ summary: 'Obtiene todos los vehículos configurados para el catálogo del administrador' })
  @ApiOkResponse({ type: [AdminVehicle] })
  getVehicles(@Req() req: any) {
    const adminId = req.user.sub;
    return this.carWashesService.getVehiclesByAdmin(adminId);
  }

  @Post()
  @ApiOperation({ summary: 'Agrega un nuevo vehículo personalizado al catálogo del administrador' })
  @ApiCreatedResponse({ type: AdminVehicle })
  addVehicle(@Body() body: { name: string }, @Req() req: any) {
    const adminId = req.user.sub;
    return this.carWashesService.addVehicle(adminId, body.name);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualiza el nombre o estado del vehículo' })
  @ApiOkResponse({ type: AdminVehicle })
  updateVehicle(
    @Param('id') id: string,
    @Body() body: { name?: string; isActive?: boolean },
    @Req() req: any,
  ) {
    const adminId = req.user.sub;
    return this.carWashesService.updateVehicle(adminId, id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Elimina un vehículo personalizado' })
  @ApiOkResponse({ description: 'Vehículo eliminado correctamente' })
  deleteVehicle(@Param('id') id: string, @Req() req: any) {
    const adminId = req.user.sub;
    return this.carWashesService.deleteVehicle(adminId, id);
  }
}
