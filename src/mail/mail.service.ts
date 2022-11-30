import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { PrivacyInfoData } from '../common/types';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendVerificationMail(email: string, code: string) {
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

  async sendMailText(email: string, code: string) {
    const mailOptions = {
      to: 'limuviti@gmail.com',
      subject: 'Subject',
      text: 'Email content',
    };
    const result = await this.mailerService.sendMail(mailOptions);
    return result;
  }

  async sendLoginNotificationMail(email: string, privacyInfo: PrivacyInfoData) {
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
