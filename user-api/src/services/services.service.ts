import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from './entities/service.entity';
import { CarWashesService } from '../car-washes/car-washes.service';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    private readonly carWashesService: CarWashesService,
  ) {}

  async create(adminId: number, createDto: {
    name: string;
    description?: string;
    vehicleType: string;
    durationMinutes: number;
    price: number;
  }): Promise<Service> {
    if (createDto.durationMinutes % 15 !== 0) {
      throw new BadRequestException('La duración del servicio debe ser múltiplo de 15 minutos.');
    }

    // Validar tipo de vehículo
    const vehicles = await this.carWashesService.getVehiclesByAdmin(adminId);
    const activeVehicleNames = vehicles.filter(v => v.isActive).map(v => v.name.toLowerCase());
    if (!activeVehicleNames.includes(createDto.vehicleType.toLowerCase())) {
      throw new BadRequestException(`El tipo de vehículo '${createDto.vehicleType}' no está habilitado en tu catálogo.`);
    }

    const carWash = await this.carWashesService.getWashByAdmin(adminId);

    const newService = this.serviceRepository.create({
      ...createDto,
      carWashId: carWash.id,
    });

    return await this.serviceRepository.save(newService);
  }

  async findAllByAdmin(adminId: number): Promise<Service[]> {
    const carWash = await this.carWashesService.getWashByAdmin(adminId);
    return await this.serviceRepository.find({
      where: { carWashId: carWash.id },
    });
  }

  async findAllByCarWashId(carWashId: string): Promise<Service[]> {
    return await this.serviceRepository.find({
      where: { carWashId },
    });
  }

  async findOneByAdmin(adminId: number, id: string): Promise<Service> {
    const carWash = await this.carWashesService.getWashByAdmin(adminId);
    const service = await this.serviceRepository.findOne({
      where: { id, carWashId: carWash.id },
    });

    if (!service) {
      throw new NotFoundException(`No se encontró el servicio con ID ${id} para tu lavadero.`);
    }

    return service;
  }

  async update(adminId: number, id: string, updateDto: {
    name?: string;
    description?: string;
    vehicleType?: string;
    durationMinutes?: number;
    price?: number;
  }): Promise<Service> {
    if (updateDto.durationMinutes !== undefined && updateDto.durationMinutes % 15 !== 0) {
      throw new BadRequestException('La duración del servicio debe ser múltiplo de 15 minutos.');
    }

    if (updateDto.vehicleType !== undefined) {
      const vehicles = await this.carWashesService.getVehiclesByAdmin(adminId);
      const activeVehicleNames = vehicles.filter(v => v.isActive).map(v => v.name.toLowerCase());
      if (!activeVehicleNames.includes(updateDto.vehicleType.toLowerCase())) {
        throw new BadRequestException(`El tipo de vehículo '${updateDto.vehicleType}' no está habilitado en tu catálogo.`);
      }
    }

    const service = await this.findOneByAdmin(adminId, id);
    Object.assign(service, updateDto);

    return await this.serviceRepository.save(service);
  }

  async remove(adminId: number, id: string): Promise<void> {
    const service = await this.findOneByAdmin(adminId, id);
    await this.serviceRepository.remove(service);
  }
}
