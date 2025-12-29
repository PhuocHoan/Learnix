import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

import { type RequestWithUser } from '../../types/request.interface';
import { type User } from '../../users/entities/user.entity';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return request.user;
  },
);
