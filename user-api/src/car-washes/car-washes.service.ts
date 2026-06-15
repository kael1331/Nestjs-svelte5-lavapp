import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { CarWash } from './entities/car-wash.entity';
import { CarWashBay, BayStatus } from './entities/car-wash-bay.entity';
import { AdminSubscription, SubscriptionStatus } from './entities/admin-subscription.entity';
import { AdminVehicle } from './entities/admin-vehicle.entity';
import { CarWashPhoto } from './entities/car-wash-photo.entity';
import { PlatformSettings } from '../platform-settings/entities/platform-settings.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class CarWashesService {
  constructor(
    @InjectRepository(CarWash)
    private readonly carWashRepository: Repository<CarWash>,
    @InjectRepository(CarWashBay)
    private readonly bayRepository: Repository<CarWashBay>,
    @InjectRepository(AdminSubscription)
    private readonly subscriptionRepository: Repository<AdminSubscription>,
    @InjectRepository(PlatformSettings)
    private readonly platformSettingsRepository: Repository<PlatformSettings>,
    @InjectRepository(AdminVehicle)
    private readonly vehicleRepository: Repository<AdminVehicle>,
    @InjectRepository(CarWashPhoto)
    private readonly photoRepository: Repository<CarWashPhoto>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(adminId: number): Promise<CarWash> {
    // 1. Crear el lavadero comercial inactivo por defecto
    const newWash = this.carWashRepository.create({
      adminId,
      baysCount: 1,
      isServiceActive: false,
      isManuallyOpen: true,
    });
    const savedWash = await this.carWashRepository.save(newWash);

    // 2. Crear su primera bahía de lavado por defecto
    const defaultBay = this.bayRepository.create({
      carWashId: savedWash.id,
      bayNumber: 1,
      status: BayStatus.FREE,
    });
    await this.bayRepository.save(defaultBay);

    return savedWash;
  }

  async getWashByAdmin(adminId: number): Promise<CarWash> {
    const wash = await this.carWashRepository.findOne({
      where: { adminId },
      relations: {
        bays: true,
        subscriptions: true,
        photos: true,
      },
    });

    if (!wash) {
      throw new NotFoundException(`No se encontró un lavadero para el administrador con ID ${adminId}`);
    }

    return wash;
  }

  async updateWash(adminId: number, updateDto: {
    name?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    clientPaymentAlias?: string;
    isManuallyOpen?: boolean;
    openingMode?: string;
    baysCount?: number;
  }): Promise<CarWash> {
    const wash = await this.getWashByAdmin(adminId);

    // Si se modifica baysCount y es mayor al actual, generamos las bahías físicas faltantes
    if (updateDto.baysCount !== undefined && updateDto.baysCount !== wash.baysCount) {
      const newCount = updateDto.baysCount;
      const currentBays = await this.bayRepository.find({
        where: { carWashId: wash.id },
      });

      const maxBayNumber = currentBays.reduce((max, bay) => (bay.bayNumber > max ? bay.bayNumber : max), 0);

      if (newCount > currentBays.length) {
        // Generar las bahías faltantes
        const newBays: CarWashBay[] = [];
        for (let num = maxBayNumber + 1; num <= newCount; num++) {
          newBays.push(
            this.bayRepository.create({
              carWashId: wash.id,
              bayNumber: num,
              status: BayStatus.FREE,
            }),
          );
        }
        await this.bayRepository.save(newBays);
      }

      wash.baysCount = newCount;
    }

    // Actualizar el resto de campos
    if (updateDto.name !== undefined) wash.name = updateDto.name;
    if (updateDto.address !== undefined) wash.address = updateDto.address;
    if (updateDto.latitude !== undefined) wash.latitude = updateDto.latitude;
    if (updateDto.longitude !== undefined) wash.longitude = updateDto.longitude;
    if (updateDto.clientPaymentAlias !== undefined) wash.clientPaymentAlias = updateDto.clientPaymentAlias;
    if (updateDto.isManuallyOpen !== undefined) wash.isManuallyOpen = updateDto.isManuallyOpen;
    if (updateDto.openingMode !== undefined) wash.openingMode = updateDto.openingMode;

    // Guardar usando update parcial para evitar que TypeORM intente sincronizar la relación OneToMany
    await this.carWashRepository.update(wash.id, {
      name: wash.name,
      address: wash.address,
      latitude: wash.latitude,
      longitude: wash.longitude,
      clientPaymentAlias: wash.clientPaymentAlias,
      isManuallyOpen: wash.isManuallyOpen,
      openingMode: wash.openingMode,
      baysCount: wash.baysCount,
    });

    return await this.getWashByAdmin(adminId);
  }

  async createSubscription(adminId: number, receiptUrl: string): Promise<AdminSubscription> {
    const wash = await this.getWashByAdmin(adminId);

    // Evitar spamear pagos pendientes
    const pending = await this.subscriptionRepository.findOneBy({
      carWashId: wash.id,
      status: SubscriptionStatus.PENDING,
    });
    if (pending) {
      throw new BadRequestException('Ya tienes un comprobante de pago en proceso de validación.');
    }

    // Obtener el precio desde PlatformSettings
    const settings = await this.platformSettingsRepository.findOneBy({ id: 1 });
    const amountPaid = settings ? settings.subscriptionPrice : 1500;

    const newSub = this.subscriptionRepository.create({
      carWashId: wash.id,
      receiptUrl,
      status: SubscriptionStatus.PENDING,
      amountPaid,
    });

    return await this.subscriptionRepository.save(newSub);
  }

  async getPendingSubscriptions(): Promise<AdminSubscription[]> {
    return await this.subscriptionRepository.find({
      where: { status: SubscriptionStatus.PENDING },
      relations: { carWash: true },
      order: { createdAt: 'DESC' },
    });
  }

  async approveSubscription(subscriptionId: string): Promise<AdminSubscription> {
    const sub = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId },
      relations: { carWash: true },
    });

    if (!sub) {
      throw new NotFoundException(`No se encontró la suscripción con ID ${subscriptionId}.`);
    }

    if (sub.status !== SubscriptionStatus.PENDING) {
      throw new BadRequestException('Esta suscripción ya ha sido procesada.');
    }

    // Actualizar estado de la suscripción
    sub.status = SubscriptionStatus.APPROVED;
    const savedSub = await this.subscriptionRepository.save(sub);

    // Actualizar estado de activación y vencimiento del lavadero
    const wash = sub.carWash;
    const currentExpiration = wash.subscriptionExpiresAt;
    const now = new Date();

    // Si la membresía actual está activa y vence en el futuro, sumamos desde ese vencimiento.
    // Si no, sumamos a partir de hoy.
    const baseDate = (currentExpiration && new Date(currentExpiration) > now)
      ? new Date(currentExpiration)
      : now;

    const expiration = new Date(baseDate);
    expiration.setDate(expiration.getDate() + 30); // 30 días de suscripción

    await this.carWashRepository.update(wash.id, {
      isServiceActive: true,
      subscriptionExpiresAt: expiration,
    });

    // Enviar notificación al dueño del lavadero
    await this.notificationsService.create(
      wash.adminId,
      'Suscripción Aprobada 🎉',
      'Tu comprobante de pago ha sido verificado y aprobado. ¡Tu lavadero ya está activo!',
    ).catch(() => {});

    return savedSub;
  }

  async rejectSubscription(subscriptionId: string): Promise<AdminSubscription> {
    const sub = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId },
      relations: { carWash: true },
    });

    if (!sub) {
      throw new NotFoundException(`No se encontró la suscripción con ID ${subscriptionId}.`);
    }

    if (sub.status !== SubscriptionStatus.PENDING) {
      throw new BadRequestException('Esta suscripción ya ha sido procesada.');
    }

    // Actualizar estado de la suscripción
    sub.status = SubscriptionStatus.REJECTED;
    const savedSub = await this.subscriptionRepository.save(sub);

    // Desactivar el lavadero
    const wash = sub.carWash;
    await this.carWashRepository.update(wash.id, {
      isServiceActive: false,
    });

    // Enviar notificación al dueño
    await this.notificationsService.create(
      wash.adminId,
      'Suscripción Rechazada ❌',
      'Tu comprobante de pago ha sido rechazado. Por favor, verifica el monto y vuelve a intentarlo.',
    ).catch(() => {});

    return savedSub;
  }

  async getAllSubscriptions(): Promise<AdminSubscription[]> {
    return await this.subscriptionRepository.find({
      relations: { carWash: true },
      order: { createdAt: 'DESC' },
    });
  }

  async getSubscriptionsByAdmin(adminId: number): Promise<AdminSubscription[]> {
    const wash = await this.carWashRepository.findOne({ where: { adminId } });
    if (!wash) {
      return [];
    }
    return await this.subscriptionRepository.find({
      where: { carWashId: wash.id },
      order: { createdAt: 'DESC' },
    });
  }

  // --- GESTIÓN DE VEHÍCULOS DEL ADMINISTRADOR ---

  async getVehiclesByAdmin(adminId: number): Promise<AdminVehicle[]> {
    const list = await this.vehicleRepository.find({
      where: { adminId },
    });

    if (list.length === 0) {
      // Sembrar por defecto
      const defaultNames = ['auto', 'camioneta', 'moto'];
      const created: AdminVehicle[] = [];
      for (const name of defaultNames) {
        const v = this.vehicleRepository.create({
          adminId,
          name,
          isActive: true,
        });
        created.push(await this.vehicleRepository.save(v));
      }
      return created;
    }

    return list;
  }

  async addVehicle(adminId: number, name: string): Promise<AdminVehicle> {
    if (!name || name.trim() === '') {
      throw new BadRequestException('El nombre del vehículo no puede estar vacío.');
    }
    const cleanName = name.trim().toLowerCase();

    // Validar si existe duplicado (insensible a mayúsculas)
    const existing = await this.vehicleRepository.findOne({
      where: { adminId, name: cleanName }
    });
    if (existing) {
      throw new BadRequestException(`El vehículo '${name}' ya está configurado.`);
    }

    const newVehicle = this.vehicleRepository.create({
      adminId,
      name: cleanName,
      isActive: true,
    });
    return await this.vehicleRepository.save(newVehicle);
  }

  async updateVehicle(
    adminId: number,
    vehicleId: string,
    updateDto: { name?: string; isActive?: boolean }
  ): Promise<AdminVehicle> {
    const vehicle = await this.vehicleRepository.findOne({
      where: { id: vehicleId, adminId }
    });
    if (!vehicle) {
      throw new NotFoundException('Vehículo no encontrado o no autorizado.');
    }

    if (updateDto.name !== undefined) {
      const cleanName = updateDto.name.trim().toLowerCase();
      if (cleanName === '') {
        throw new BadRequestException('El nombre del vehículo no puede estar vacío.');
      }
      // Si cambia el nombre, validar duplicados
      if (cleanName !== vehicle.name) {
        const duplicate = await this.vehicleRepository.findOne({
          where: { adminId, name: cleanName }
        });
        if (duplicate) {
          throw new BadRequestException(`Ya tienes configurado un vehículo con el nombre '${updateDto.name}'.`);
        }
        vehicle.name = cleanName;
      }
    }

    if (updateDto.isActive !== undefined) {
      vehicle.isActive = updateDto.isActive;
    }

    return await this.vehicleRepository.save(vehicle);
  }

  async deleteVehicle(adminId: number, vehicleId: string): Promise<void> {
    const vehicle = await this.vehicleRepository.findOne({
      where: { id: vehicleId, adminId }
    });
    if (!vehicle) {
      throw new NotFoundException('Vehículo no encontrado o no autorizado.');
    }
    await this.vehicleRepository.remove(vehicle);
  }

  // --- GESTIÓN DE FOTOS DEL LAVADERO ---

  async addWashPhoto(adminId: number, url: string): Promise<CarWashPhoto> {
    const wash = await this.getWashByAdmin(adminId);
    const photo = this.photoRepository.create({
      carWashId: wash.id,
      url,
    });
    return await this.photoRepository.save(photo);
  }

  async deleteWashPhoto(adminId: number, photoId: string): Promise<void> {
    const photo = await this.photoRepository.findOne({
      where: { id: photoId },
      relations: { carWash: true }
    });
    if (!photo) {
      throw new NotFoundException('Foto no encontrada.');
    }
    if (photo.carWash.adminId !== adminId) {
      throw new BadRequestException('No autorizado a eliminar esta foto.');
    }

    // Intentar borrar archivo físico
    const filename = photo.url.split('/').pop();
    if (filename) {
      const filePath = join(process.cwd(), 'uploads/washes', filename);
      if (existsSync(filePath)) {
        try {
          unlinkSync(filePath);
        } catch (err) {
          console.error('Error al eliminar archivo de foto:', err);
        }
      }
    }

    await this.photoRepository.remove(photo);
  }
}
