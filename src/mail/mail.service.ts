import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { loadTemplate } from 'src/utils/loadTemplate.util';

@Injectable()
export class MailService {
  private readonly transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);
  private readonly fromName: string;
  private readonly fromEmail: string;

  constructor(private readonly config: ConfigService) {
    this.fromName = this.config.get<string>('MAIL_FROM_NAME', 'App');
    this.fromEmail = this.config.get<string>('MAIL_FROM_EMAIL', 'noreply@example.com');

    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('MAIL_HOST'),
      port: this.config.get<number>('MAIL_PORT'),
      secure: this.config.get<string>('MAIL_SECURE') === 'true',
      auth: {
        user: this.config.get<string>('MAIL_USER'),
        pass: this.config.get<string>('MAIL_PASSWORD'),
      },
    });
  }

  async sendMail(to: string, subject: string, html: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to,
        subject,
        html,
      });
      this.logger.log(`Email sent to ${to}: ${subject}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}: ${error.message}`);
      throw error;
    }
  }

  async sendVerification(email: string, link: string, firstName = 'there'): Promise<void> {
    const html = loadTemplate('confirm-email.html', {
      firstName,
      verificationLink: link,
      expiryTime: '60',
      currentYear: new Date().getFullYear().toString(),
      companyName: this.config.get<string>('COMPANY_NAME', 'Our Company'),
      companyAddress: this.config.get<string>('COMPANY_ADDRESS', ''),
      privacyPolicyUrl: this.config.get<string>('PRIVACY_POLICY_URL', '#'),
      termsOfServiceUrl: this.config.get<string>('TERMS_OF_SERVICE_URL', '#'),
      unsubscribeUrl: this.config.get<string>('UNSUBSCRIBE_URL', '#'),
      supportEmail: this.config.get<string>('SUPPORT_EMAIL', this.fromEmail),
      email,
    });
    return this.sendMail(email, 'Verify your email address', html);
  }

  async sendResetPassword(email: string, link: string): Promise<void> {
    const html = loadTemplate('reset-password.html', {
      resetLink: link,
      expiryTime: '60',
      currentYear: new Date().getFullYear().toString(),
      companyName: this.config.get<string>('COMPANY_NAME', 'Our Company'),
      companyAddress: this.config.get<string>('COMPANY_ADDRESS', ''),
      privacyPolicyUrl: this.config.get<string>('PRIVACY_POLICY_URL', '#'),
      termsOfServiceUrl: this.config.get<string>('TERMS_OF_SERVICE_URL', '#'),
      unsubscribeUrl: this.config.get<string>('UNSUBSCRIBE_URL', '#'),
      supportEmail: this.config.get<string>('SUPPORT_EMAIL', this.fromEmail),
      email,
    });
    return this.sendMail(email, 'Reset your password', html);
  }
}
