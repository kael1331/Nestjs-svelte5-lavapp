import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { CarWashesService } from '../car-washes/car-washes.service';
import { UserRole } from '../users/entities/user.entity';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(private readonly carWashesService: CarWashesService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Si el usuario no está en el request, dejamos pasar para que AuthGuard lance 401
    if (!user) {
      return true;
    }

    // La restricción de suscripción activa solo aplica al rol ADMIN
    if (user.role === UserRole.ADMIN) {
      try {
        const carWash = await this.carWashesService.getWashByAdmin(user.sub);
        if (!carWash.isServiceActive) {
          throw new ForbiddenException(
            'Tu suscripción no está activa. Debes abonar la membresía para utilizar esta funcionalidad.',
          );
        }
      } catch (error) {
        if (error instanceof ForbiddenException) {
          throw error;
        }
        throw new ForbiddenException(
          'No se pudo verificar el estado de suscripción de tu lavadero.',
        );
      }
    }

    return true;
  }
}
