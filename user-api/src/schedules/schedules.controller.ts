import { Controller, Get, Post, Body, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { SubscriptionGuard } from '../auth/subscription.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { Schedule } from './entities/schedule.entity';
import { ScheduleException } from './entities/schedule-exception.entity';

@ApiTags('schedules')
@Controller('schedules')
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  // --- REGULAR SCHEDULES ---

  @Post()
  @UseGuards(AuthGuard, RolesGuard, SubscriptionGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crea un nuevo intervalo de horario de apertura regular' })
  @ApiCreatedResponse({ type: Schedule })
  createSchedule(
    @Body() createDto: { dayOfWeek: number; startTime: string; endTime: string },
    @Req() req: any,
  ) {
    const adminId = req.user.sub;
    return this.schedulesService.createSchedule(adminId, createDto);
  }

  @Get()
  @UseGuards(AuthGuard, RolesGuard, SubscriptionGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtiene todos los horarios regulares del establecimiento del administrador' })
  @ApiOkResponse({ type: [Schedule] })
  findAllSchedules(@Req() req: any) {
    const adminId = req.user.sub;
    return this.schedulesService.findAllSchedulesByAdmin(adminId);
  }

  @Get('car-wash/:carWashId')
  @ApiOperation({ summary: 'Obtiene los horarios regulares de un establecimiento específico (público)' })
  @ApiOkResponse({ type: [Schedule] })
  findSchedulesByCarWash(@Param('carWashId') carWashId: string) {
    return this.schedulesService.findAllSchedulesByCarWashId(carWashId);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard, SubscriptionGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Elimina un intervalo de horario regular' })
  @ApiOkResponse({ description: 'Horario eliminado correctamente' })
  removeSchedule(@Param('id') id: string, @Req() req: any) {
    const adminId = req.user.sub;
    return this.schedulesService.removeSchedule(adminId, id);
  }

  // --- SCHEDULE EXCEPTIONS ---

  @Post('exceptions')
  @UseGuards(AuthGuard, RolesGuard, SubscriptionGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crea una excepción de horario para una fecha específica (cierre/feriado)' })
  @ApiCreatedResponse({ type: ScheduleException })
  createException(
    @Body() createDto: { date: string; reason?: string },
    @Req() req: any,
  ) {
    const adminId = req.user.sub;
    return this.schedulesService.createException(adminId, createDto);
  }

  @Get('exceptions')
  @UseGuards(AuthGuard, RolesGuard, SubscriptionGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtiene todas las excepciones de horario del administrador' })
  @ApiOkResponse({ type: [ScheduleException] })
  findAllExceptions(@Req() req: any) {
    const adminId = req.user.sub;
    return this.schedulesService.findAllExceptionsByAdmin(adminId);
  }

  @Get('exceptions/car-wash/:carWashId')
  @ApiOperation({ summary: 'Obtiene las excepciones de horario de un establecimiento específico (público)' })
  @ApiOkResponse({ type: [ScheduleException] })
  findExceptionsByCarWash(@Param('carWashId') carWashId: string) {
    return this.schedulesService.findAllExceptionsByCarWashId(carWashId);
  }

  @Delete('exceptions/:id')
  @UseGuards(AuthGuard, RolesGuard, SubscriptionGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Elimina una excepción de horario' })
  @ApiOkResponse({ description: 'Excepción eliminada correctamente' })
  removeException(@Param('id') id: string, @Req() req: any) {
    const adminId = req.user.sub;
    return this.schedulesService.removeException(adminId, id);
  }
}
