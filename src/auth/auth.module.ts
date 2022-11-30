import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { SessionModule } from '../session/session.module';
import { MailModule } from '../mail/mail.module';
import { VerificationModule } from '../verification/verification.module';

@Module({
  imports: [
    UserModule,
    JwtModule,
    SessionModule,
    MailModule,
    VerificationModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
