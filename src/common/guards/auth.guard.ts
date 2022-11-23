import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    try {
      const request = context.switchToHttp().getRequest();
      const user = request.currentUser;

      if (!user) {
        throw new UnauthorizedException();
      }

      return true;
    } catch (error) {
      throw new UnauthorizedException();
    }
  }
}
