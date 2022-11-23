import { Body, Controller, HttpCode, Post, Res } from '@nestjs/common';
import {
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common/exceptions';
import { Response } from 'express';
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
    @Res({ passthrough: true }) response: Response,
  ) {
    const user = await this.authService.validateUser(dto);

    if (!user) {
      throw new UnauthorizedException('Email and password do not match');
    }

    const accessToken = this.authService.getAccessToken(user);

    return { accessToken };
  }
}
