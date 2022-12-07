import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { SentMessageInfo } from 'nodemailer';
import { PrivacyInfoData } from '../common/types';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendVerificationMail(
    email: string,
    code: string,
  ): Promise<SentMessageInfo> {
    const result = await this.mailerService.sendMail({
      to: email,
      subject: 'Please verify your email address',
      template: 'verify-email',
      context: {
        code,
      },
    });
    return result;
  }

  async sendLoginNotificationMail(
    email: string,
    privacyInfo: PrivacyInfoData,
  ): Promise<SentMessageInfo> {
    const { ip, userAgent } = privacyInfo;
    const result = await this.mailerService.sendMail({
      to: email,
      subject: 'New login',
      template: 'login-email',
      context: {
        email,
        date: new Date().toLocaleString('en-US'),
        ip,
        userAgent,
      },
    });
    return result;
  }
}
