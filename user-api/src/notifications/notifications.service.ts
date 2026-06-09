import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async create(userId: number, title: string, message: string): Promise<Notification> {
    const notification = this.notificationRepository.create({
      userId,
      title,
      message,
      isRead: false,
    });
    return await this.notificationRepository.save(notification);
  }

  async findAllByUser(userId: number): Promise<Notification[]> {
    return await this.notificationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async markAsRead(id: string, userId: number): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({ where: { id } });
    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }
    if (notification.userId !== userId) {
      throw new ForbiddenException('No estás autorizado para marcar esta notificación como leída');
    }
    notification.isRead = true;
    return await this.notificationRepository.save(notification);
  }
}
