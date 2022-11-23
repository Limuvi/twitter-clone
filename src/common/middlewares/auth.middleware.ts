import { Injectable, NestMiddleware } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request, Response, NextFunction } from 'express';

export interface RequestModel extends Request {
  currentUser: string;
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private jwtService: JwtService) {}

  use(req: RequestModel, res: Response, next: NextFunction) {
    try {
      req.currentUser = null;
      const authHeader = req?.headers?.authorization || '';
      const token = authHeader.split(' ')[1];

      if (token) {
        const user = this.jwtService.verify(token);
        req.currentUser = user;
      }
    } catch (error) {
      console.log(error.message);
    } finally {
      next();
    }
  }
}
