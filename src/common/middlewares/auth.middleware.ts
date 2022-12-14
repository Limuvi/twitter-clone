import { Injectable, NestMiddleware } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request, Response, NextFunction } from 'express';
import { CurrentUserData } from '../types';

export interface RequestModel extends Request {
  currentUser: CurrentUserData;
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private jwtService: JwtService) {}

  async use(req: RequestModel, res: Response, next: NextFunction) {
    try {
      const authHeader = req?.headers?.authorization || '';
      const token = authHeader.split(' ')[1];

      if (token) {
        const payload = this.jwtService.verify(token);
        req.currentUser = { id: payload.id, profileId: payload.profileId };
      }
    } catch (error) {
      req.currentUser = null;
    } finally {
      next();
    }
  }
}
