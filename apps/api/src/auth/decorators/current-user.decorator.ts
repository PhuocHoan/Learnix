import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

import { type User } from '../../users/entities/user.entity';

interface RequestWithUser {
  user: User;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return request.user;
  },
);
