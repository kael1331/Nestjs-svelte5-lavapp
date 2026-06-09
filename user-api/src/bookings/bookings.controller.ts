import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { SubscriptionGuard } from '../auth/subscription.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { Booking } from './entities/booking.entity';

@ApiTags('bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get('availability')
  @ApiOperation({ summary: 'Obtiene los bloques de inicio de turnos disponibles para un lavadero, fecha y servicio específicos' })
  @ApiOkResponse({ type: [String] })
  getAvailability(
    @Query('carWashId') carWashId: string,
    @Query('date') date: string,
    @Query('serviceId') serviceId: string,
  ) {
    return this.bookingsService.getAvailability(carWashId, date, serviceId);
  }

  @Post('lock')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Realiza un bloqueo temporal (pre-reserva) de un turno por 10 minutos' })
  @ApiCreatedResponse({ type: Booking })
  lock(
    @Body() body: { carWashId: string; serviceId: string; dateTime: string },
    @Req() req: any,
  ) {
    const clientId = req.user.sub;
    return this.bookingsService.createPreBooking(clientId, body.carWashId, body.serviceId, body.dateTime);
  }

  @Post(':id/confirm')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirma la reserva enviando el comprobante de pago/transferencia' })
  @ApiOkResponse({ type: Booking })
  confirm(
    @Param('id') id: string,
    @Body() body: { receiptUrl: string },
    @Req() req: any,
  ) {
    const clientId = req.user.sub;
    return this.bookingsService.confirmBooking(clientId, id, body.receiptUrl);
  }

  @Get('my-bookings')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtiene el listado de reservas del cliente autenticado' })
  @ApiOkResponse({ type: [Booking] })
  getMyBookings(@Req() req: any) {
    const clientId = req.user.sub;
    return this.bookingsService.findAllByClient(clientId);
  }

  // --- ADMIN ENDPOINTS ---

  @Get()
  @UseGuards(AuthGuard, RolesGuard, SubscriptionGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtiene todas las reservas del lavadero del administrador autenticado' })
  @ApiOkResponse({ type: [Booking] })
  findAllForAdmin(@Req() req: any) {
    const adminId = req.user.sub;
    return this.bookingsService.findAllByAdmin(adminId);
  }

  @Post(':id/approve')
  @UseGuards(AuthGuard, RolesGuard, SubscriptionGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Aprueba una reserva pendiente de pago y le asigna una bahía física libre' })
  @ApiOkResponse({ type: Booking })
  approve(@Param('id') id: string, @Req() req: any) {
    const adminId = req.user.sub;
    return this.bookingsService.approveBooking(adminId, id);
  }

  @Post(':id/reject')
  @UseGuards(AuthGuard, RolesGuard, SubscriptionGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Rechaza una reserva pendiente' })
  @ApiOkResponse({ type: Booking })
  reject(@Param('id') id: string, @Req() req: any) {
    const adminId = req.user.sub;
    return this.bookingsService.rejectBooking(adminId, id);
  }

  @Post(':id/cancel')
  @UseGuards(AuthGuard, SubscriptionGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancela una reserva activa (ya sea el cliente o el lavadero administrador)' })
  @ApiOkResponse({ type: Booking })
  cancel(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.sub;
    const role = req.user.role; // 'client' o 'admin'
    return this.bookingsService.cancelBooking(userId, id, role);
  }
}
