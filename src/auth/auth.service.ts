import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { CookieOptions } from 'express';
import { v4 } from 'uuid';

import { hashPassword } from '../common/helpers';
import { UserService } from '../user/user.service';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { SessionService } from '../session/session.service';
import { CurrentUserData, PrivacyInfoData } from '../common/types';

@Injectable()
export class AuthService {
  private refreshTokenTTL: number;
  private accessTokenTTL: number;
  private accessTokenSecret: string;
  private passwordSecret: string;

  constructor(
    private usersService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private sessionService: SessionService,
  ) {
    this.refreshTokenTTL = configService.get('REFRESH_TOKEN_EXPIRATION_TIME');
    this.accessTokenTTL = this.configService.get(
      'JWT_ACCESS_TOKEN_EXPIRATION_TIME',
    );
    this.accessTokenSecret = this.configService.get('JWT_ACCESS_TOKEN_SECRET');
    this.passwordSecret = this.configService.get('PASSWORD_PRIVATE_KEY');
  }

  async createUser(dto: SignUpDto) {
    const { username, email, password } = dto;

    const user = await this.usersService.findByEmailOrUsername(email, username);

    if (user) {
      return null;
    }

    const hashedPassword = hashPassword(password, this.passwordSecret);

    return await this.usersService.create(username, email, hashedPassword);
  }

  async deleteRefreshToken(
    userId: number | string,
    token: string,
  ): Promise<boolean> {
    const count = await this.sessionService.deleteByUserIdAndToken(
      userId,
      token,
    );
    return !!count;
  }

  async replaceRefreshToken(
    userId: number | string,
    privacyInfo: PrivacyInfoData,
    token: string,
  ): Promise<string | null> {
    const newToken: string = v4();
    const key = await this.sessionService.replaceSession(
      {
        userId,
        token: newToken,
        ...privacyInfo,
      },
      token,
    );
    return key ? newToken : null;
  }

  getAccessToken({ id }: CurrentUserData): string {
    const payload = { id };
    const token = this.jwtService.sign(payload, {
      secret: this.accessTokenSecret,
      expiresIn: `${this.accessTokenTTL}s`,
    });
    return token;
  }

  async getRefreshToken(
    userId: number,
    privacyInfo: PrivacyInfoData,
  ): Promise<string | null> {
    const token: string = v4();
    const key = await this.sessionService.create({
      userId,
      token,
      ...privacyInfo,
    });

    return key ? token : null;
  }

  getRefreshTokenCookieOptions(): CookieOptions {
    return {
      maxAge: this.refreshTokenTTL * 1000,
      httpOnly: true,
      path: '/auth',
    };
  }

  async validateUser(dto: SignInDto) {
    const { email, password } = dto;
    const user = await this.usersService.findByEmail(email);

    if (
      user &&
      user.hashedPassword === hashPassword(password, this.passwordSecret)
    ) {
      const { hashedPassword, ...data } = user;
      return data;
    }

    return null;
  }
}
