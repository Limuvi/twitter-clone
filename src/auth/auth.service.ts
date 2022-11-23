import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { hashPassword } from '../common/helpers';
import { User } from '../user/entities/user.entity';
import { UserService } from '../user/user.service';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';

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

  getAccessToken(payload: any) {
    const token = this.jwtService.sign(payload, {
      secret: this.accessTokenSecret,
      expiresIn: `${this.accessTokenTTL}s`,
    });
    return token;
  }

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
