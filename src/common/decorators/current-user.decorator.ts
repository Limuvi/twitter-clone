import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { CurrentUserData } from '../types';

export const CurrentUser = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    // const { id = null }: CurrentUserData = request?.currentUser;
    const id = request?.currentUser?.id;
    const currentUser: CurrentUserData = { id };

    return data ? currentUser?.[data] : currentUser;
  },
);
