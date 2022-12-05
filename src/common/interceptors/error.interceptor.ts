import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  NotFoundException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { ForbiddenException } from '@nestjs/common/exceptions';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  AccessDeniedError,
  AlreadyExistsError,
  InvalidRefreshSessionError,
  LoginError,
  NotFoundError,
} from '../errors';

@Injectable()
export class BusinessErrorsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        switch (error.constructor) {
          case AccessDeniedError:
            throw new ForbiddenException(error.message);
          case AlreadyExistsError:
            throw new ConflictException(error.message);
          case InvalidRefreshSessionError:
            throw new UnauthorizedException(error.message);
          case LoginError:
            throw new UnauthorizedException(error.message);
          case NotFoundError:
            throw new NotFoundException(error.message);
          default:
            throw error;
        }
      }),
    );
  }
}
