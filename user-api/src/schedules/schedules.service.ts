import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Schedule } from './entities/schedule.entity';
import { ScheduleException } from './entities/schedule-exception.entity';
import { CarWashesService } from '../car-washes/car-washes.service';

@Injectable()
export class SchedulesService {
  constructor(
    @InjectRepository(Schedule)
    private readonly scheduleRepository: Repository<Schedule>,
    @InjectRepository(ScheduleException)
    private readonly exceptionRepository: Repository<ScheduleException>,
    private readonly carWashesService: CarWashesService,
  ) {}

  private parseTimeToMinutes(timeStr: string): number {
    const parts = timeStr.split(':');
    if (parts.length !== 2) {
      throw new BadRequestException('El formato de hora debe ser HH:MM.');
    }
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      throw new BadRequestException('El formato de hora debe ser HH:MM válido.');
    }
    return hours * 60 + minutes;
  }

  private validateTimeFormat(timeStr: string): void {
    const regex = /^\d{2}:\d{2}$/;
    if (!regex.test(timeStr)) {
      throw new BadRequestException('El formato de hora debe ser exactamente HH:MM.');
    }
    this.parseTimeToMinutes(timeStr);
  }

  // --- REGULAR SCHEDULES ---

  async createSchedule(adminId: number, createDto: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }): Promise<Schedule> {
    const { dayOfWeek, startTime, endTime } = createDto;

    if (dayOfWeek < 0 || dayOfWeek > 6) {
      throw new BadRequestException('El día de la semana debe ser un entero entre 0 (Domingo) y 6 (Sábado).');
    }

    this.validateTimeFormat(startTime);
    this.validateTimeFormat(endTime);

    const startMins = this.parseTimeToMinutes(startTime);
    const endMins = this.parseTimeToMinutes(endTime);

    if (endMins <= startMins) {
      throw new BadRequestException('La hora de cierre debe ser posterior a la hora de apertura.');
    }

    const carWash = await this.carWashesService.getWashByAdmin(adminId);

    // Comprobar superposición de horarios para el mismo día
    const existing = await this.scheduleRepository.find({
      where: { carWashId: carWash.id, dayOfWeek },
    });

    for (const item of existing) {
      const itemStart = this.parseTimeToMinutes(item.startTime);
      const itemEnd = this.parseTimeToMinutes(item.endTime);

      if (startMins < itemEnd && itemStart < endMins) {
        throw new BadRequestException('El intervalo de horario se superpone con uno ya configurado para este día.');
      }
    }

    const newSchedule = this.scheduleRepository.create({
      carWashId: carWash.id,
      dayOfWeek,
      startTime,
      endTime,
    });

    return await this.scheduleRepository.save(newSchedule);
  }

  async findAllSchedulesByAdmin(adminId: number): Promise<Schedule[]> {
    const carWash = await this.carWashesService.getWashByAdmin(adminId);
    return await this.scheduleRepository.find({
      where: { carWashId: carWash.id },
      order: { dayOfWeek: 'ASC', startTime: 'ASC' },
    });
  }

  async findAllSchedulesByCarWashId(carWashId: string): Promise<Schedule[]> {
    return await this.scheduleRepository.find({
      where: { carWashId },
      order: { dayOfWeek: 'ASC', startTime: 'ASC' },
    });
  }

  async removeSchedule(adminId: number, id: string): Promise<void> {
    const carWash = await this.carWashesService.getWashByAdmin(adminId);
    const schedule = await this.scheduleRepository.findOne({
      where: { id, carWashId: carWash.id },
    });

    if (!schedule) {
      throw new NotFoundException(`No se encontró el horario con ID ${id} para tu lavadero.`);
    }

    await this.scheduleRepository.remove(schedule);
  }

  // --- SCHEDULE EXCEPTIONS ---

  async createException(adminId: number, createDto: {
    date: string;
    reason?: string;
  }): Promise<ScheduleException> {
    const { date, reason } = createDto;

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      throw new BadRequestException('El formato de fecha debe ser YYYY-MM-DD.');
    }

    // Validar que la fecha sea válida
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      throw new BadRequestException('La fecha ingresada no es válida.');
    }

    const carWash = await this.carWashesService.getWashByAdmin(adminId);

    // Evitar excepciones duplicadas para el mismo día
    const existing = await this.exceptionRepository.findOne({
      where: { carWashId: carWash.id, date },
    });

    if (existing) {
      throw new BadRequestException('Ya existe una excepción registrada para la fecha ' + date);
    }

    const newException = this.exceptionRepository.create({
      carWashId: carWash.id,
      date,
      reason: reason || null,
    });

    return await this.exceptionRepository.save(newException);
  }

  async findAllExceptionsByAdmin(adminId: number): Promise<ScheduleException[]> {
    const carWash = await this.carWashesService.getWashByAdmin(adminId);
    return await this.exceptionRepository.find({
      where: { carWashId: carWash.id },
      order: { date: 'ASC' },
    });
  }

  async findAllExceptionsByCarWashId(carWashId: string): Promise<ScheduleException[]> {
    return await this.exceptionRepository.find({
      where: { carWashId },
      order: { date: 'ASC' },
    });
  }

  async removeException(adminId: number, id: string): Promise<void> {
    const carWash = await this.carWashesService.getWashByAdmin(adminId);
    const exception = await this.exceptionRepository.findOne({
      where: { id, carWashId: carWash.id },
    });

    if (!exception) {
      throw new NotFoundException(`No se encontró la excepción con ID ${id} para tu lavadero.`);
    }

    await this.exceptionRepository.remove(exception);
  }
}
