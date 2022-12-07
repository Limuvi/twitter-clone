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
  UseFilters,
} from '@nestjs/common';
import { Response } from 'express';
import { CurrentUser, PrivacyInfo, RefreshToken } from '../common/decorators';
import { UnathorizedExceptionFilter } from '../common/exception-filters/unathorized-exception.filter';
import { AuthGuard } from '../common/guards';
import { CurrentUserData, PrivacyInfoData } from '../common/types';
import { Session } from '../session/types/session.type';
import { AuthService } from './auth.service';
import { AuthTokensDto } from './dto/auth-tokens.dto';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { VerificationDto } from './dto/verification.dto';

@UseFilters(UnathorizedExceptionFilter)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(AuthGuard)
  @Get('sessions')
  async getSession(
    @CurrentUser('id') id: number,
    @RefreshToken() token: string,
  ): Promise<Session[]> {
    const sessions = await this.authService.getUserSessions(id, token);
    return sessions;
  }

  @HttpCode(200)
  @Post('signup')
  async signUp(@Body() dto: SignUpDto): Promise<{ message: string }> {
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
  ): Promise<AuthTokensDto> {
    const user = await this.authService.validateUser(dto);

    const { accessToken, refreshToken } = await this.authService.createSession(
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
    @CurrentUser('id') userId: number,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.authService.deleteCurrentSession(userId, token);

    response.cookie('refreshToken', token, {
      ...this.authService.getRefreshTokenCookieOptions(),
      maxAge: 0,
    });
  }

  @UseGuards(AuthGuard)
  @HttpCode(200)
  @Post('refresh-token')
  async refreshToken(
    @RefreshToken() token: string,
    @CurrentUser() user: CurrentUserData,
    @PrivacyInfo() info: PrivacyInfoData,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthTokensDto> {
    const { id } = user;
    const { accessToken, refreshToken } = await this.authService.replaceSession(
      id,
      info,
      token,
    );

    const cookieOptions = this.authService.getRefreshTokenCookieOptions();

    response.cookie('refreshToken', refreshToken, cookieOptions);

    return { accessToken, refreshToken };
  }

  @Post('verify')
  async verify(
    @Body() dto: VerificationDto,
    @PrivacyInfo() info: PrivacyInfoData,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthTokensDto> {
    const user = await this.authService.verifyUser(dto);

    const { accessToken, refreshToken } = await this.authService.createSession(
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
    @CurrentUser('id') id: number,
    @RefreshToken() userToken: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    if (token === userToken) {
      await this.authService.deleteCurrentSession(id, token);
      response.cookie('refreshToken', token, {
        ...this.authService.getRefreshTokenCookieOptions(),
        maxAge: 0,
      });
    } else {
      await this.authService.deleteSession(id, userToken, token);
    }

    return;
  }

  @UseGuards(AuthGuard)
  @Delete('sessions')
  async deleteSessions(
    @CurrentUser('id') id: number,
    @Res({ passthrough: true }) response: Response,
    @RefreshToken() token: string,
  ): Promise<void> {
    await this.authService.deleteAllSessions(id);

    response.cookie('refreshToken', token, {
      ...this.authService.getRefreshTokenCookieOptions(),
      maxAge: 0,
    });

    return;
  }
}
