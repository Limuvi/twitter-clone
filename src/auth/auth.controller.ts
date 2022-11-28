import {
  Body,
  Controller,
  HttpCode,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common/exceptions';
import { Response } from 'express';
import { CurrentUser, PrivacyInfo, RefreshToken } from '../common/decorators';
import { AuthGuard } from '../common/guards';
import { CurrentUserData, PrivacyInfoData } from '../common/types';
import { AuthService } from './auth.service';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(200)
  @Post('signup')
  async signUp(@Body() dto: SignUpDto) {
    const user = await this.authService.createUser(dto);

    if (!user) {
      throw new ConflictException('This email or username is already in use');
    }

    return;
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

    const accessToken = this.authService.getAccessToken(user);
    const refreshToken = await this.authService.getRefreshToken(user.id, info);
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
    const deleted = await this.authService.deleteRefreshToken(userId, token);

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
    const newToken = await this.authService.replaceRefreshToken(
      user.id,
      info,
      token,
    );

    if (!newToken) {
      throw new UnauthorizedException('Invalid refresh session');
    }

    const cookieOptions = this.authService.getRefreshTokenCookieOptions();
    const accessToken = this.authService.getAccessToken(user);

    response.cookie('refreshToken', newToken, cookieOptions);

    return { accessToken, refreshToken: newToken };
  }
}
