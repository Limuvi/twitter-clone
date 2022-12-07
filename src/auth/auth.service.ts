import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { CookieOptions } from 'express';
import { v4 } from 'uuid';
import { randomBytes } from 'crypto';

import { hashPassword } from '../common/helpers';
import { UserService } from '../user/user.service';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { SessionService } from '../session/session.service';
import { CurrentUserData, PrivacyInfoData } from '../common/types';
import { User } from '../user/entities/user.entity';
import { MailService } from '../mail/mail.service';
import { ValidatedUserDto } from '../user/dto/validated-user.dto';
import { VerificationDto } from './dto/verification.dto';
import { VerificationService } from '../verification/verification.service';
import {
  AlreadyExistsError,
  ERROR_MESSAGES,
  InvalidRefreshSessionError,
  LoginError,
  NotFoundError,
} from '../common/errors';
import { Session } from '../session/types/session.type';
import { AuthTokensDto } from './dto/auth-tokens.dto';

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
    private mailService: MailService,
    private verificationService: VerificationService,
  ) {
    this.refreshTokenTTL = configService.get('REFRESH_TOKEN_EXPIRATION_TIME');
    this.accessTokenTTL = this.configService.get(
      'JWT_ACCESS_TOKEN_EXPIRATION_TIME',
    );
    this.accessTokenSecret = this.configService.get('JWT_ACCESS_TOKEN_SECRET');
    this.passwordSecret = this.configService.get('PASSWORD_PRIVATE_KEY');
  }

  async registerUser(dto: SignUpDto): Promise<void> {
    const { email, password } = dto;

    const user = await this.usersService.findByEmail(email);

    if (user) {
      throw new AlreadyExistsError(ERROR_MESSAGES.EMAIL_IS_EXISTS);
    }

    const hashedPassword = hashPassword(password, this.passwordSecret);
    const code = randomBytes(20).toString('hex');

    await this.verificationService.deleteByEmail(email);
    await this.verificationService.create(code, {
      email,
      hashedPassword,
    });

    await this.mailService.sendVerificationMail(email, code);
  }

  async verifyUser(dto: VerificationDto): Promise<User> {
    const { code } = dto;

    const user = await this.verificationService.findByVerificationCode(code);

    if (user) {
      const { email, hashedPassword } = user;
      await this.verificationService.deleteVerificationCode(email, code);
      return await this.usersService.create(email, hashedPassword);
    }

    throw new NotFoundError(ERROR_MESSAGES.VERIFICATION_CODE_NOT_FOUND);
  }

  async createSession(
    user: ValidatedUserDto,
    info: PrivacyInfoData,
  ): Promise<AuthTokensDto> {
    const accessToken = this.getAccessToken(user);
    const refreshToken = await this.getRefreshToken(user.id, info);

    await this.mailService.sendLoginNotificationMail(user.email, info);

    return { accessToken, refreshToken };
  }

  async validateUser(dto: SignInDto): Promise<ValidatedUserDto> {
    const { email, password } = dto;
    const user = await this.usersService.findByEmail(email);

    if (
      user &&
      user.hashedPassword === hashPassword(password, this.passwordSecret)
    ) {
      const { hashedPassword, ...data } = user;
      return data;
    }

    throw new LoginError();
  }

  async getUserSessions(userId: number, token: string): Promise<Session[]> {
    const hasSession = await this.hasSession(userId, token);

    if (!hasSession) {
      await this.deleteAllSessions(userId);
      throw new InvalidRefreshSessionError();
    }
    return await this.sessionService.findByUserIdAndSort(userId);
  }

  private async hasSession(userId: number, token: string): Promise<boolean> {
    const session = await this.sessionService.findByUserIdAndToken(
      userId,
      token,
    );

    return !!session;
  }

  async deleteCurrentSession(userId: number, token: string): Promise<void> {
    const count = await this.sessionService.deleteByUserIdAndToken(
      userId,
      token,
    );

    if (!count) {
      throw new InvalidRefreshSessionError();
    }
  }

  async deleteSession(
    userId: number,
    userToken: string,
    tokenToDelete,
  ): Promise<void> {
    const hasSession = await this.hasSession(userId, userToken);

    if (!hasSession) {
      await this.deleteAllSessions(userId);
      throw new InvalidRefreshSessionError();
    }

    const count = await this.sessionService.deleteByUserIdAndToken(
      userId,
      tokenToDelete,
    );

    if (!count) {
      throw new NotFoundError(ERROR_MESSAGES.SESSION_NOT_FOUND);
    }
  }

  async deleteAllSessions(userId: number): Promise<void> {
    await this.sessionService.deleteByUserId(userId);
  }

  async replaceSession(
    userId: number,
    privacyInfo: PrivacyInfoData,
    token: string,
  ): Promise<AuthTokensDto> {
    const refreshToken: string = v4();
    const key = await this.sessionService.replaceSession(
      {
        userId,
        token: refreshToken,
        ...privacyInfo,
      },
      token,
    );

    if (!key) {
      throw new InvalidRefreshSessionError();
    }
    const accessToken = this.getAccessToken({ id: userId });

    return { refreshToken, accessToken };
  }

  private getAccessToken({ id }: CurrentUserData): string {
    const payload = { id };
    const token = this.jwtService.sign(payload, {
      secret: this.accessTokenSecret,
      expiresIn: `${this.accessTokenTTL}s`,
    });
    return token;
  }

  private async getRefreshToken(
    userId: number,
    privacyInfo: PrivacyInfoData,
  ): Promise<string> {
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
}
