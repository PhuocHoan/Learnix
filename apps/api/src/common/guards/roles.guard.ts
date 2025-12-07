import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { ROLES_KEY } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/enums/user-role.enum';

interface UserWithRole {
  role: UserRole;
}

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<
      UserRole[] | undefined
    >(ROLES_KEY, [context.getHandler(), context.getClass()]);

    // No roles required for this route
    if (!requiredRoles) {
      return true;
    }

    const { user } = context
      .switchToHttp()
      .getRequest<{ user: UserWithRole | undefined }>();

    // Runtime safety: JWT payload may not contain user in edge cases
    if (!user) {
      this.logger.warn('User not found in request');
      throw new ForbiddenException('User not authenticated');
    }

    this.logger.debug(
      `Checking role: user.role="${user.role}" against required roles: ${requiredRoles.join(', ')}`,
    );

    const hasRole = requiredRoles.some((role) => user.role === role);

    // Runtime safety: Role may not be in required roles
    if (!hasRole) {
      this.logger.warn(
        `Access denied: user has role "${user.role}" but needs one of: ${requiredRoles.join(', ')}`,
      );
      throw new ForbiddenException(
        `Insufficient permissions. Your current role is "${user.role}". Required: ${requiredRoles.join(' or ')}`,
      );
    }

    return true;
  }
}
