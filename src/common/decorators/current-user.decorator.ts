import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ICurrentUser } from '../types';

export const CurrentUser = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    if (request.currentUser) {
      const { id, profileId } = request.currentUser;
      const currentUser: ICurrentUser = { id, profileId };

      return data ? currentUser?.[data] : currentUser;
    }

    return null;
  },
);
