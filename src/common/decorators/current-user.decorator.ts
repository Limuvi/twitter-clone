import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { CurrentUserData } from '../types';

export const CurrentUser = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const { id }: CurrentUserData = request.currentUser;
    const currentUser = { id };

    return data ? currentUser?.[data] : currentUser;
  },
);
