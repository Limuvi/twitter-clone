import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const PrivacyInfo = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const ip =
      request.headers['x-forwarded-for']?.split(',').shift() ||
      request.socket?.remoteAddress;
    const userAgent = request.get('user-agent');

    const privacyInfo = { ip, userAgent };

    return data ? privacyInfo?.[data] : privacyInfo;
  },
);
