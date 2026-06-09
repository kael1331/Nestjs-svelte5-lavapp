import { Controller, Get, Patch, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { AuthGuard } from '../auth/auth.guard';
import { ApiTags, ApiBearerAuth, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { Notification } from './entities/notification.entity';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtiene todas las notificaciones del usuario logueado' })
  @ApiOkResponse({ type: [Notification] })
  findAll(@Req() req: any) {
    const userId = req.user.sub;
    return this.notificationsService.findAllByUser(userId);
  }

  @Patch(':id/read')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Marca una notificación como leída' })
  @ApiOkResponse({ type: Notification })
  markAsRead(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.sub;
    return this.notificationsService.markAsRead(id, userId);
  }

  // Endpoint de prueba para generar notificaciones manualmente
  @Post('test')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Genera una notificación de prueba para el usuario logueado (Solo pruebas)' })
  @ApiOkResponse({ type: Notification })
  createTestNotification(@Body() body: { title: string; message: string }, @Req() req: any) {
    const userId = req.user.sub;
    return this.notificationsService.create(
      userId,
      body.title || 'Alerta de Prueba',
      body.message || 'Esta es una notificación de prueba.',
    );
  }
}
