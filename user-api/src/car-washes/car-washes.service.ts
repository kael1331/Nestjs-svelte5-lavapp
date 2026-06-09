import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CarWash } from './entities/car-wash.entity';
import { CarWashBay, BayStatus } from './entities/car-wash-bay.entity';
import { AdminSubscription, SubscriptionStatus } from './entities/admin-subscription.entity';
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
      },
    });

    if (!wash) {
      throw new NotFoundException(`No se encontró un lavadero para el administrador con ID ${adminId}`);
    }

    return wash;
  }

  async updateWash(adminId: number, updateDto: {
    name?: string;
    latitude?: number;
    longitude?: number;
    clientPaymentAlias?: string;
    isManuallyOpen?: boolean;
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
    if (updateDto.latitude !== undefined) wash.latitude = updateDto.latitude;
    if (updateDto.longitude !== undefined) wash.longitude = updateDto.longitude;
    if (updateDto.clientPaymentAlias !== undefined) wash.clientPaymentAlias = updateDto.clientPaymentAlias;
    if (updateDto.isManuallyOpen !== undefined) wash.isManuallyOpen = updateDto.isManuallyOpen;

    // Guardar usando update parcial para evitar que TypeORM intente sincronizar la relación OneToMany
    await this.carWashRepository.update(wash.id, {
      name: wash.name,
      latitude: wash.latitude,
      longitude: wash.longitude,
      clientPaymentAlias: wash.clientPaymentAlias,
      isManuallyOpen: wash.isManuallyOpen,
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
    const expiration = new Date();
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
}
