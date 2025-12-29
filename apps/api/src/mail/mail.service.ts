import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter | null = null;
  private readonly logger = new Logger(MailService.name);
  private readonly isConfigured: boolean;

  constructor(private configService: ConfigService) {
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPass = this.configService.get<string>('SMTP_PASS');

    // Check if SMTP is properly configured (not placeholder values)
    this.isConfigured =
      Boolean(smtpHost) &&
      smtpHost !== 'smtp.example.com' &&
      Boolean(smtpUser) &&
      smtpUser !== 'your-email@example.com' &&
      Boolean(smtpPass) &&
      smtpPass !== 'your-password';

    if (this.isConfigured) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: this.configService.get<number>('SMTP_PORT') ?? 587,
        secure: this.configService.get<string>('SMTP_SECURE') === 'true',
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
      this.logger.log('SMTP configured successfully');
    } else {
      this.logger.warn(
        '⚠️  SMTP not configured. Emails will be logged to console instead.',
      );
      this.logger.warn(
        'To enable email sending, configure SMTP_HOST, SMTP_USER, SMTP_PASS in .env',
      );
    }
  }

  async sendActivationEmail(
    email: string,
    fullName: string | null,
    activationToken: string,
  ): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const activationUrl = `${frontendUrl}/activate?token=${activationToken}`;
    const appName = 'Learnix';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Activate Your Account</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 16px 16px 0 0;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">${appName}</h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="margin: 0 0 20px; color: #18181b; font-size: 24px; font-weight: 600;">Welcome${fullName ? `, ${fullName}` : ''}! 👋</h2>
                      <p style="margin: 0 0 20px; color: #52525b; font-size: 16px; line-height: 1.6;">
                        Thank you for signing up for ${appName}. To complete your registration and start your learning journey, please verify your email address.
                      </p>
                      
                      <table role="presentation" style="width: 100%; border-collapse: collapse;">
                        <tr>
                          <td align="center" style="padding: 20px 0;">
                            <a href="${activationUrl}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 12px; box-shadow: 0 4px 14px 0 rgba(99, 102, 241, 0.4);">
                              Activate My Account
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="margin: 20px 0 0; color: #71717a; font-size: 14px; line-height: 1.6;">
                        If the button doesn't work, copy and paste this link into your browser:
                      </p>
                      <p style="margin: 10px 0 20px; color: #6366f1; font-size: 14px; word-break: break-all;">
                        ${activationUrl}
                      </p>
                      
                      <p style="margin: 20px 0 0; color: #71717a; font-size: 14px; line-height: 1.6;">
                        This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 20px 40px 40px; text-align: center; border-top: 1px solid #e4e4e7;">
                      <p style="margin: 0; color: #a1a1aa; font-size: 12px;">
                        © ${new Date().getFullYear()} ${appName}. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    // If SMTP is not configured, log the activation URL for development
    if (!this.isConfigured || !this.transporter) {
      this.logger.log('');
      this.logger.log('═'.repeat(70));
      this.logger.log('📧 ACTIVATION EMAIL (SMTP not configured - dev mode)');
      this.logger.log('═'.repeat(70));
      this.logger.log(`To: ${email}`);
      this.logger.log(`Name: ${fullName ?? 'N/A'}`);
      this.logger.log('');
      this.logger.log('🔗 Click this link to activate your account:');
      this.logger.log(`   ${activationUrl}`);
      this.logger.log('');
      this.logger.log('═'.repeat(70));
      return;
    }

    await this.transporter.sendMail({
      from: `"${appName}" <${this.configService.get<string>('SMTP_FROM')}>`,
      to: email,
      subject: `Activate Your ${appName} Account`,
      html,
    });

    this.logger.log(`Activation email sent to ${email}`);
  }

  async sendWelcomeEmail(
    email: string,
    fullName: string | null,
  ): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const appName = 'Learnix';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to ${appName}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                  <tr>
                    <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 16px 16px 0 0;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">${appName}</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="margin: 0 0 20px; color: #18181b; font-size: 24px; font-weight: 600;">You're all set${fullName ? `, ${fullName}` : ''}! 🎉</h2>
                      <p style="margin: 0 0 20px; color: #52525b; font-size: 16px; line-height: 1.6;">
                        Your email has been verified and your account is now active. You can now log in and start exploring courses on ${appName}.
                      </p>
                      <table role="presentation" style="width: 100%; border-collapse: collapse;">
                        <tr>
                          <td align="center" style="padding: 20px 0;">
                            <a href="${frontendUrl}/login" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 12px; box-shadow: 0 4px 14px 0 rgba(99, 102, 241, 0.4);">
                              Go to Login
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 20px 40px 40px; text-align: center; border-top: 1px solid #e4e4e7;">
                      <p style="margin: 0; color: #a1a1aa; font-size: 12px;">
                        © ${new Date().getFullYear()} ${appName}. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    // If SMTP is not configured, log for development
    if (!this.isConfigured || !this.transporter) {
      this.logger.log('');
      this.logger.log('═'.repeat(70));
      this.logger.log('📧 WELCOME EMAIL (SMTP not configured - dev mode)');
      this.logger.log('═'.repeat(70));
      this.logger.log(`To: ${email}`);
      this.logger.log(`Name: ${fullName ?? 'N/A'}`);
      this.logger.log('Account activated successfully!');
      this.logger.log('═'.repeat(70));
      return;
    }

    await this.transporter.sendMail({
      from: `"${appName}" <${this.configService.get<string>('SMTP_FROM')}>`,
      to: email,
      subject: `Welcome to ${appName}!`,
      html,
    });

    this.logger.log(`Welcome email sent to ${email}`);
  }

  async sendPasswordResetEmail(
    email: string,
    fullName: string | null,
    resetToken: string,
  ): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
    const appName = 'Learnix';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                  <tr>
                    <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 16px 16px 0 0;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">${appName}</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="margin: 0 0 20px; color: #18181b; font-size: 24px; font-weight: 600;">Reset Your Password</h2>
                      <p style="margin: 0 0 20px; color: #52525b; font-size: 16px; line-height: 1.6;">
                        Hi${fullName ? ` ${fullName}` : ''}, we received a request to reset your password. Click the button below to create a new password.
                      </p>
                      <table role="presentation" style="width: 100%; border-collapse: collapse;">
                        <tr>
                          <td align="center" style="padding: 20px 0;">
                            <a href="${resetUrl}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 12px; box-shadow: 0 4px 14px 0 rgba(99, 102, 241, 0.4);">
                              Reset Password
                            </a>
                          </td>
                        </tr>
                      </table>
                      <p style="margin: 20px 0 0; color: #71717a; font-size: 14px; line-height: 1.6;">
                        If the button doesn't work, copy and paste this link into your browser:
                      </p>
                      <p style="margin: 10px 0 20px; color: #6366f1; font-size: 14px; word-break: break-all;">
                        ${resetUrl}
                      </p>
                      <p style="margin: 20px 0 0; color: #71717a; font-size: 14px; line-height: 1.6;">
                        This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 20px 40px 40px; text-align: center; border-top: 1px solid #e4e4e7;">
                      <p style="margin: 0; color: #a1a1aa; font-size: 12px;">
                        © ${new Date().getFullYear()} ${appName}. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    // If SMTP is not configured, log for development
    if (!this.isConfigured || !this.transporter) {
      this.logger.log('');
      this.logger.log('═'.repeat(70));
      this.logger.log(
        '📧 PASSWORD RESET EMAIL (SMTP not configured - dev mode)',
      );
      this.logger.log('═'.repeat(70));
      this.logger.log(`To: ${email}`);
      this.logger.log(`Name: ${fullName ?? 'N/A'}`);
      this.logger.log('');
      this.logger.log('🔗 Click this link to reset your password:');
      this.logger.log(`   ${resetUrl}`);
      this.logger.log('');
      this.logger.log('═'.repeat(70));
      return;
    }

    await this.transporter.sendMail({
      from: `"${appName}" <${this.configService.get<string>('SMTP_FROM')}>`,
      to: email,
      subject: `Reset Your ${appName} Password`,
      html,
    });

    this.logger.log(`Password reset email sent to ${email}`);
  }

  async sendPasswordChangedEmail(
    email: string,
    fullName: string | null,
  ): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const appName = 'Learnix';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Changed</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                  <tr>
                    <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 16px 16px 0 0;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">${appName}</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="margin: 0 0 20px; color: #18181b; font-size: 24px; font-weight: 600;">Password Changed Successfully 🔒</h2>
                      <p style="margin: 0 0 20px; color: #52525b; font-size: 16px; line-height: 1.6;">
                        Hi${fullName ? ` ${fullName}` : ''}, your password has been changed successfully. If you made this change, you can safely ignore this email.
                      </p>
                      <p style="margin: 0 0 20px; color: #52525b; font-size: 16px; line-height: 1.6;">
                        If you didn't change your password, please secure your account immediately by resetting your password.
                      </p>
                      <table role="presentation" style="width: 100%; border-collapse: collapse;">
                        <tr>
                          <td align="center" style="padding: 20px 0;">
                            <a href="${frontendUrl}/forgot-password" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 12px; box-shadow: 0 4px 14px 0 rgba(239, 68, 68, 0.4);">
                              Secure My Account
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 20px 40px 40px; text-align: center; border-top: 1px solid #e4e4e7;">
                      <p style="margin: 0; color: #a1a1aa; font-size: 12px;">
                        © ${new Date().getFullYear()} ${appName}. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    // If SMTP is not configured, log for development
    if (!this.isConfigured || !this.transporter) {
      this.logger.log('');
      this.logger.log('═'.repeat(70));
      this.logger.log(
        '📧 PASSWORD CHANGED EMAIL (SMTP not configured - dev mode)',
      );
      this.logger.log('═'.repeat(70));
      this.logger.log(`To: ${email}`);
      this.logger.log(`Name: ${fullName ?? 'N/A'}`);
      this.logger.log('Password was changed successfully!');
      this.logger.log('═'.repeat(70));
      return;
    }

    await this.transporter.sendMail({
      from: `"${appName}" <${this.configService.get<string>('SMTP_FROM')}>`,
      to: email,
      subject: `Your ${appName} Password Was Changed`,
      html,
    });

    this.logger.log(`Password changed email sent to ${email}`);
  }
}
