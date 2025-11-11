import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Role } from 'src/generated/prisma/client';

@Injectable()
export class OwnerOrAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      user?: { userId: string; role: Role };
      params: { id: string };
    }>();

    const user = request.user;
    const targetUserId = request.params.id;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    if (user.role === Role.ADMIN) {
      return true;
    }

    if (user.userId === targetUserId) {
      return true;
    }

    throw new ForbiddenException('You can only access your own resources');
  }
}
