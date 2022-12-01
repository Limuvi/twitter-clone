import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(UnauthorizedException)
export class UnathorizedExceptionFilter implements ExceptionFilter {
  catch(exception: UnauthorizedException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    response.cookie('refreshToken', null, {
      maxAge: 0,
      httpOnly: true,
      path: '/auth',
    });
    response.status(401).json({
      statusCode: status,
      message: exception.message,
      error: exception.name,
    });
  }
}
