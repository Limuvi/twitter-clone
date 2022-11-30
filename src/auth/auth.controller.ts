import {
  Body,
  Controller,
  Get,
  Delete,
  HttpCode,
  Param,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common/exceptions';
import { Response } from 'express';
import { CurrentUser, PrivacyInfo, RefreshToken } from '../common/decorators';
import { AuthGuard } from '../common/guards';
import { CurrentUserData, PrivacyInfoData } from '../common/types';
import { AuthService } from './auth.service';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { VerificationDto } from './dto/verification.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(AuthGuard)
  @Get('sessions')
  async getSession(
    @CurrentUser('id') id: number | string,
    @RefreshToken() token: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const hasSession = await this.authService.hasSession(id, token);

    if (!hasSession) {
      await this.authService.deleteAllSessions(id);
      response.cookie('refreshToken', token, {
        ...this.authService.getRefreshTokenCookieOptions(),
        maxAge: 0,
      });
      throw new UnauthorizedException('Invalid refresh session');
    }

    const sessions = await this.authService.getUserSessions(id);
    return {
      sessions,
    };
  }

  @HttpCode(200)
  @Post('signup')
  async signUp(@Body() dto: SignUpDto) {
    const isExists = await this.authService.isUserExists(dto);

    if (isExists) {
      throw new ConflictException('This email or username is already in use');
    }

    await this.authService.registerUser(dto);

    return {
      message: 'Verification code has been sent to your email',
    };
  }

  @HttpCode(200)
  @Post('signin')
  async signIn(
    @Body() dto: SignInDto,
    @PrivacyInfo() info: PrivacyInfoData,
    @Res({ passthrough: true }) response: Response,
  ) {
    const user = await this.authService.validateUser(dto);

    if (!user) {
      throw new UnauthorizedException('Email and password do not match');
    }

    const { accessToken, refreshToken } = await this.authService.loginUser(
      user,
      info,
    );
    const cookieOptions = this.authService.getRefreshTokenCookieOptions();

    response.cookie('refreshToken', refreshToken, cookieOptions);
    return { accessToken, refreshToken };
  }

  @UseGuards(AuthGuard)
  @HttpCode(200)
  @Post('signout')
  async signOut(
    @RefreshToken() token: string,
    @CurrentUser('id') userId: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const deleted = await this.authService.deleteSession(userId, token);

    response.cookie('refreshToken', token, {
      ...this.authService.getRefreshTokenCookieOptions(),
      maxAge: 0,
    });

    if (!deleted) {
      throw new UnauthorizedException('Invalid refresh session');
    }
  }

  @UseGuards(AuthGuard)
  @HttpCode(200)
  @Post('refresh-token')
  async refreshToken(
    @RefreshToken() token: string,
    @CurrentUser() user: CurrentUserData,
    @PrivacyInfo() info: PrivacyInfoData,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { id } = user;
    const newToken = await this.authService.replaceRefreshToken(
      id,
      info,
      token,
    );

    if (!newToken) {
      await this.authService.deleteAllSessions(id);
      throw new UnauthorizedException('Invalid refresh session');
    }

    const cookieOptions = this.authService.getRefreshTokenCookieOptions();
    const accessToken = this.authService.getAccessToken(user);

    response.cookie('refreshToken', newToken, cookieOptions);

    return { accessToken, refreshToken: newToken };
  }

  @Post('verify')
  async verify(
    @Body() dto: VerificationDto,
    @PrivacyInfo() info: PrivacyInfoData,
    @Res({ passthrough: true }) response: Response,
  ) {
    const user = await this.authService.verifyUser(dto);

    if (!user) {
      throw new NotFoundException('Verification code is not found!');
    }

    const { accessToken, refreshToken } = await this.authService.loginUser(
      user,
      info,
    );
    const cookieOptions = this.authService.getRefreshTokenCookieOptions();

    response.cookie('refreshToken', refreshToken, cookieOptions);
    return { accessToken, refreshToken };
  }

  @UseGuards(AuthGuard)
  @Delete('sessions/:token')
  async deleteSession(
    @Param('token') token: string,
    @CurrentUser('id') id: number | string,
    @RefreshToken() userToken: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const hasSession = await this.authService.hasSession(id, userToken);

    if (!hasSession) {
      await this.authService.deleteAllSessions(id);
      throw new UnauthorizedException('Invalid refresh session');
    }

    const deleted = await this.authService.deleteSession(id, token);

    if (!deleted) {
      throw new NotFoundException('Session is not found');
    }

    if (token === userToken) {
      response.cookie('refreshToken', token, {
        ...this.authService.getRefreshTokenCookieOptions(),
        maxAge: 0,
      });
    }

    return;
  }

  @UseGuards(AuthGuard)
  @Delete('sessions')
  async deleteSessions(
    @CurrentUser('id') id: number | string,
    @Res({ passthrough: true }) response: Response,
    @RefreshToken() token: string,
  ) {
    await this.authService.deleteAllSessions(id);

    response.cookie('refreshToken', token, {
      ...this.authService.getRefreshTokenCookieOptions(),
      maxAge: 0,
    });

    return;
  }
}
