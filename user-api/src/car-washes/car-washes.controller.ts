import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  Res,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { CarWashesService } from './car-washes.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { ApiTags, ApiBearerAuth, ApiOkResponse, ApiOperation, ApiCreatedResponse } from '@nestjs/swagger';
import { CarWash } from './entities/car-wash.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import type { Response } from 'express';
import { AdminSubscription } from './entities/admin-subscription.entity';
import { CarWashPhoto } from './entities/car-wash-photo.entity';

@ApiTags('car-washes')
@Controller('car-washes')
export class CarWashesController {
  constructor(private readonly carWashesService: CarWashesService) {}

  @Get('my-wash')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtiene el lavadero del administrador autenticado' })
  @ApiOkResponse({ type: CarWash })
  getMyWash(@Req() req: any) {
    const adminId = req.user.sub;
    return this.carWashesService.getWashByAdmin(adminId);
  }

  @Patch('my-wash')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualiza los datos del lavadero del administrador autenticado' })
  @ApiOkResponse({ type: CarWash })
  updateMyWash(
    @Body() updateDto: {
      name?: string;
      latitude?: number;
      longitude?: number;
      clientPaymentAlias?: string;
      isManuallyOpen?: boolean;
      openingMode?: string;
      baysCount?: number;
    },
    @Req() req: any,
  ) {
    const adminId = req.user.sub;
    return this.carWashesService.updateWash(adminId, updateDto);
  }

  @Post('my-wash/subscribe')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Envía el comprobante de transferencia para activar la membresía' })
  @ApiCreatedResponse({ type: AdminSubscription })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, callback) => {
          const uploadPath = './uploads/receipts';
          if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true });
          }
          callback(null, uploadPath);
        },
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          callback(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
          return callback(new BadRequestException('Solo se permiten imágenes (jpg, jpeg, png).'), false);
        }
        callback(null, true);
      },
    }),
  )
  subscribe(
    @UploadedFile() file: any,
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('Debes adjuntar la captura del comprobante.');
    }
    const adminId = req.user.sub;
    const receiptUrl = `/car-washes/subscriptions/receipts/${file.filename}`;
    return this.carWashesService.createSubscription(adminId, receiptUrl);
  }

  @Get('subscriptions')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtiene el listado de suscripciones según el rol del usuario' })
  @ApiOkResponse({ type: [AdminSubscription] })
  getSubscriptions(@Req() req: any) {
    const userRole = req.user.role;
    const userId = req.user.sub;
    if (userRole === UserRole.SUPER_ADMIN) {
      return this.carWashesService.getAllSubscriptions();
    } else {
      return this.carWashesService.getSubscriptionsByAdmin(userId);
    }
  }

  @Get('subscriptions/receipts/:filename')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Permite al SuperAdmin descargar/ver la imagen del comprobante de transferencia' })
  getReceiptImage(@Param('filename') filename: string, @Res() res: any) {
    const filePath = join(process.cwd(), 'uploads/receipts', filename);
    if (!existsSync(filePath)) {
      throw new NotFoundException('El comprobante solicitado no existe.');
    }
    return res.sendFile(filePath);
  }

  @Get('subscriptions/pending')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtiene el listado de todas las suscripciones pendientes de validar' })
  @ApiOkResponse({ type: [AdminSubscription] })
  getPendingSubscriptions() {
    return this.carWashesService.getPendingSubscriptions();
  }

  @Post('subscriptions/:id/approve')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Aprueba una suscripción pendiente, activando el lavadero por 30 días' })
  @ApiOkResponse({ type: AdminSubscription })
  approveSubscription(@Param('id') id: string) {
    return this.carWashesService.approveSubscription(id);
  }

  @Post('subscriptions/:id/reject')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Rechaza una suscripción pendiente, desactivando el lavadero' })
  @ApiOkResponse({ type: AdminSubscription })
  rejectSubscription(@Param('id') id: string) {
    return this.carWashesService.rejectSubscription(id);
  }

  @Post('my-wash/photos')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sube una foto para la galería de imágenes del local' })
  @ApiCreatedResponse({ type: CarWashPhoto })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, callback) => {
          const uploadPath = './uploads/washes';
          if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true });
          }
          callback(null, uploadPath);
        },
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          callback(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
          return callback(new BadRequestException('Solo se permiten imágenes (jpg, jpeg, png).'), false);
        }
        callback(null, true);
      },
    }),
  )
  uploadWashPhoto(
    @UploadedFile() file: any,
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('Debes adjuntar un archivo de imagen.');
    }
    const adminId = req.user.sub;
    const photoUrl = `/car-washes/public/photos/${file.filename}`;
    return this.carWashesService.addWashPhoto(adminId, photoUrl);
  }

  @Get('public/photos/:filename')
  @ApiOperation({ summary: 'Permite a cualquier usuario ver las fotos del lavadero' })
  getWashPhoto(@Param('filename') filename: string, @Res() res: any) {
    const filePath = join(process.cwd(), 'uploads/washes', filename);
    if (!existsSync(filePath)) {
      throw new NotFoundException('La foto solicitada no existe.');
    }
    return res.sendFile(filePath);
  }

  @Delete('my-wash/photos/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Elimina una foto específica de la galería del local' })
  @ApiOkResponse({ description: 'Foto eliminada correctamente' })
  deleteWashPhoto(@Param('id') id: string, @Req() req: any) {
    const adminId = req.user.sub;
    return this.carWashesService.deleteWashPhoto(adminId, id);
  }
}
