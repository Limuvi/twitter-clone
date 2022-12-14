import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { CurrentUserData } from '../types';

export const CurrentUser = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    if (request.currentUser) {
      const { id, profileId } = request.currentUser;
      const currentUser: CurrentUserData = { id, profileId };

      return data ? currentUser?.[data] : currentUser;
    }

    return null;
  },
);
