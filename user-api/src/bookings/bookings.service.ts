import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In, MoreThan } from 'typeorm';
import { Booking, BookingStatus } from './entities/booking.entity';
import { CarWashesService } from '../car-washes/car-washes.service';
import { ServicesService } from '../services/services.service';
import { SchedulesService } from '../schedules/schedules.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    private readonly carWashesService: CarWashesService,
    private readonly servicesService: ServicesService,
    private readonly schedulesService: SchedulesService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private parseTimeToMinutes(timeStr: string): number {
    const parts = timeStr.split(':');
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  }

  async getAvailability(carWashId: string, dateStr: string, serviceId: string): Promise<string[]> {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateStr)) {
      throw new BadRequestException('El formato de fecha debe ser YYYY-MM-DD.');
    }

    // Buscar el servicio
    const service = await this.servicesService.findAllByCarWashId(carWashId)
      .then(list => list.find(s => s.id === serviceId));

    if (!service) {
      throw new NotFoundException(`No se encontró el servicio con ID ${serviceId} para el lavadero.`);
    }

    // Buscar excepciones para esa fecha
    const exceptions = await this.schedulesService.findAllExceptionsByCarWashId(carWashId);
    const hasException = exceptions.some(exc => exc.date === dateStr);
    if (hasException) {
      return []; // Cerrado por excepción
    }

    // Buscar horarios regulares para ese día de la semana
    const parsedDate = new Date(dateStr + 'T12:00:00'); // Evitar desfase de zona horaria
    const dayOfWeek = parsedDate.getDay();
    const schedules = await this.schedulesService.findAllSchedulesByCarWashId(carWashId);
    const daySchedules = schedules.filter(s => s.dayOfWeek === dayOfWeek);
    if (daySchedules.length === 0) {
      return []; // Cerrado
    }

    // Buscar lavadero para ver la cantidad de bahías
    const carWash = await this.carWashesService['carWashRepository'].findOneBy({ id: carWashId });
    if (!carWash) {
      throw new NotFoundException(`No se encontró el lavadero con ID ${carWashId}.`);
    }

    const baysCount = carWash.baysCount;

    // Buscar todas las reservas activas en esa fecha
    const startOfDay = new Date(`${dateStr}T00:00:00`);
    const endOfDay = new Date(`${dateStr}T23:59:59`);

    const bookings = await this.bookingRepository.find({
      where: [
        {
          carWashId,
          dateTime: Between(startOfDay, endOfDay),
          status: In([BookingStatus.APPROVED, BookingStatus.PENDING_APPROVAL]),
        },
        {
          carWashId,
          dateTime: Between(startOfDay, endOfDay),
          status: BookingStatus.TEMPORARY_LOCKED,
          lockedUntil: MoreThan(new Date()),
        },
      ],
    });

    // Dividir el día en bloques de 15 minutos
    const openBlocks = new Set<number>();
    for (const sched of daySchedules) {
      const startMins = this.parseTimeToMinutes(sched.startTime);
      const endMins = this.parseTimeToMinutes(sched.endTime);
      for (let m = startMins; m + 15 <= endMins; m += 15) {
        openBlocks.add(m);
      }
    }

    // Mapear reservas a minutos desde medianoche
    const bookingIntervals = bookings.map(b => {
      const bStart = b.dateTime.getHours() * 60 + b.dateTime.getMinutes();
      const bEnd = b.endTime.getHours() * 60 + b.endTime.getMinutes();
      return { start: bStart, end: bEnd };
    });

    const serviceDuration = service.durationMinutes;
    const availableSlots: string[] = [];

    // Evaluar inicio de turnos
    for (const m of Array.from(openBlocks).sort((a, b) => a - b)) {
      let isAvailable = true;

      for (let offset = 0; offset < serviceDuration; offset += 15) {
        const blockStart = m + offset;

        if (!openBlocks.has(blockStart)) {
          isAvailable = false;
          break;
        }

        const overlapCount = bookingIntervals.filter(b => b.start < blockStart + 15 && blockStart < b.end).length;
        if (overlapCount >= baysCount) {
          isAvailable = false;
          break;
        }
      }

      if (isAvailable) {
        const hours = Math.floor(m / 60).toString().padStart(2, '0');
        const mins = (m % 60).toString().padStart(2, '0');
        availableSlots.push(`${hours}:${mins}`);
      }
    }

    return availableSlots;
  }

  async createPreBooking(clientId: number, carWashId: string, serviceId: string, dateTimeStr: string): Promise<Booking> {
    const dateTime = new Date(dateTimeStr);
    if (isNaN(dateTime.getTime())) {
      throw new BadRequestException('Fecha y hora inválidas.');
    }

    const dateStr = dateTime.toISOString().split('T')[0];
    const hours = dateTime.getHours().toString().padStart(2, '0');
    const mins = dateTime.getMinutes().toString().padStart(2, '0');
    const timeStr = `${hours}:${mins}`;

    // Validar disponibilidad en ese bloque
    const available = await this.getAvailability(carWashId, dateStr, serviceId);
    if (!available.includes(timeStr)) {
      throw new BadRequestException('El horario seleccionado no está disponible.');
    }

    // Buscar servicio
    const service = await this.servicesService.findAllByCarWashId(carWashId)
      .then(list => list.find(s => s.id === serviceId));

    if (!service) {
      throw new NotFoundException(`No se encontró el servicio con ID ${serviceId} para el lavadero.`);
    }

    const endTime = new Date(dateTime.getTime() + service.durationMinutes * 60 * 1000);

    const booking = this.bookingRepository.create({
      clientId,
      carWashId,
      serviceId,
      dateTime,
      endTime,
      status: BookingStatus.TEMPORARY_LOCKED,
      lockedUntil: new Date(Date.now() + 10 * 60 * 1000), // 10 minutos
    });

    return await this.bookingRepository.save(booking);
  }

  async confirmBooking(clientId: number, bookingId: string, receiptUrl: string): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException(`No se encontró la reserva con ID ${bookingId}.`);
    }

    if (booking.clientId !== clientId) {
      throw new BadRequestException('No tienes permisos sobre esta reserva.');
    }

    if (booking.status !== BookingStatus.TEMPORARY_LOCKED) {
      throw new BadRequestException('La reserva ya ha sido confirmada o procesada.');
    }

    if (booking.lockedUntil && booking.lockedUntil < new Date()) {
      booking.status = BookingStatus.CANCELLED;
      await this.bookingRepository.save(booking);
      throw new BadRequestException('El bloqueo temporal de 10 minutos ha expirado. Realiza una nueva reserva.');
    }

    booking.receiptUrl = receiptUrl;
    booking.status = BookingStatus.PENDING_APPROVAL;
    booking.lockedUntil = null;

    return await this.bookingRepository.save(booking);
  }

  async approveBooking(adminId: number, bookingId: string): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException(`No se encontró la reserva con ID ${bookingId}.`);
    }

    const carWash = await this.carWashesService.getWashByAdmin(adminId);
    if (booking.carWashId !== carWash.id) {
      throw new BadRequestException('No tienes permisos sobre esta reserva.');
    }

    if (booking.status !== BookingStatus.PENDING_APPROVAL) {
      throw new BadRequestException('La reserva no está pendiente de aprobación.');
    }

    // Buscar bahía física libre en este intervalo
    const bays = await this.carWashesService['bayRepository'].find({
      where: { carWashId: carWash.id },
    });

    let assignedBayId: string | null = null;

    const startOfDay = new Date(booking.dateTime.getFullYear(), booking.dateTime.getMonth(), booking.dateTime.getDate(), 0, 0, 0);
    const endOfDay = new Date(booking.dateTime.getFullYear(), booking.dateTime.getMonth(), booking.dateTime.getDate(), 23, 59, 59);

    const activeBookings = await this.bookingRepository.find({
      where: {
        carWashId: carWash.id,
        status: BookingStatus.APPROVED,
        dateTime: Between(startOfDay, endOfDay),
      },
    });

    for (const bay of bays) {
      const overlap = activeBookings.some(b => {
        if (b.assignedBayId !== bay.id) return false;
        return booking.dateTime < b.endTime && b.dateTime < booking.endTime;
      });

      if (!overlap) {
        assignedBayId = bay.id;
        break;
      }
    }

    if (!assignedBayId) {
      throw new BadRequestException('No hay bahías físicas disponibles en este horario para aprobar la reserva.');
    }

    booking.status = BookingStatus.APPROVED;
    booking.assignedBayId = assignedBayId;

    const saved = await this.bookingRepository.save(booking);

    // Enviar notificación al cliente
    await this.notificationsService.create(
      booking.clientId,
      'Reserva Aprobada 🎉',
      `Tu turno para el ${booking.dateTime.toLocaleString()} ha sido aprobado con éxito.`,
    ).catch(() => {});

    return saved;
  }

  async rejectBooking(adminId: number, bookingId: string): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException(`No se encontró la reserva con ID ${bookingId}.`);
    }

    const carWash = await this.carWashesService.getWashByAdmin(adminId);
    if (booking.carWashId !== carWash.id) {
      throw new BadRequestException('No tienes permisos sobre esta reserva.');
    }

    if (booking.status !== BookingStatus.PENDING_APPROVAL) {
      throw new BadRequestException('La reserva no está pendiente de aprobación.');
    }

    booking.status = BookingStatus.REJECTED;
    const saved = await this.bookingRepository.save(booking);

    await this.notificationsService.create(
      booking.clientId,
      'Reserva Rechazada ❌',
      `Tu turno para el ${booking.dateTime.toLocaleString()} ha sido rechazado por el administrador.`,
    ).catch(() => {});

    return saved;
  }

  async cancelBooking(userId: number, bookingId: string, role: string): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException(`No se encontró la reserva con ID ${bookingId}.`);
    }

    if (role === 'client') {
      if (booking.clientId !== userId) {
        throw new BadRequestException('No tienes permisos sobre esta reserva.');
      }
      booking.status = BookingStatus.CANCELLED;
      const saved = await this.bookingRepository.save(booking);

      // Notificar al admin
      const carWash = await this.carWashesService['carWashRepository'].findOneBy({ id: booking.carWashId });
      if (carWash) {
        await this.notificationsService.create(
          carWash.adminId,
          'Reserva Cancelada por Cliente ⚠️',
          `El cliente canceló la reserva del ${booking.dateTime.toLocaleString()}.`,
        ).catch(() => {});
      }
      return saved;
    } else if (role === 'admin') {
      const carWash = await this.carWashesService.getWashByAdmin(userId);
      if (booking.carWashId !== carWash.id) {
        throw new BadRequestException('No tienes permisos sobre esta reserva.');
      }
      booking.status = BookingStatus.CANCELLED;
      const saved = await this.bookingRepository.save(booking);

      // Notificar al cliente
      await this.notificationsService.create(
        booking.clientId,
        'Reserva Cancelada por Lavadero ⚠️',
        `El lavadero canceló tu reserva del ${booking.dateTime.toLocaleString()}.`,
      ).catch(() => {});

      return saved;
    }

    throw new BadRequestException('Rol inválido para cancelar la reserva.');
  }

  async findAllByAdmin(adminId: number): Promise<Booking[]> {
    const carWash = await this.carWashesService.getWashByAdmin(adminId);
    return await this.bookingRepository.find({
      where: { carWashId: carWash.id },
      order: { dateTime: 'DESC' },
      relations: { service: true, client: true },
    });
  }

  async findAllByClient(clientId: number): Promise<Booking[]> {
    return await this.bookingRepository.find({
      where: { clientId },
      order: { dateTime: 'DESC' },
      relations: { service: true, carWash: true },
    });
  }
}
