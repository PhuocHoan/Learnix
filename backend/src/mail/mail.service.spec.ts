import { ConfigService } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';

import { MailService } from './mail.service';

describe('MailService', () => {
  let service: MailService;

  describe('when SMTP is not configured', () => {
    beforeEach(async () => {
      const mockConfigService = {
        get: jest.fn().mockImplementation((key: string) => {
          if (key === 'SMTP_HOST') {
            return 'smtp.example.com';
          } // Placeholder
          if (key === 'SMTP_USER') {
            return 'your-email@example.com';
          } // Placeholder
          if (key === 'SMTP_PASS') {
            return 'your-password';
          } // Placeholder
          if (key === 'FRONTEND_URL') {
            return 'http://localhost:5173';
          }
          return null;
        }),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          MailService,
          { provide: ConfigService, useValue: mockConfigService },
        ],
      }).compile();

      service = module.get<MailService>(MailService);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    describe('sendActivationEmail', () => {
      it('should log activation email in dev mode', async () => {
        const logSpy = jest.spyOn((service as any).logger, 'log');

        await service.sendActivationEmail(
          'test@example.com',
          'Test User',
          'activation-token',
        );

        expect(logSpy).toHaveBeenCalledWith(
          expect.stringContaining('ACTIVATION EMAIL'),
        );
      });

      it('should include activation URL with token', async () => {
        const logSpy = jest.spyOn((service as any).logger, 'log');

        await service.sendActivationEmail(
          'test@example.com',
          'Test User',
          'my-token-123',
        );

        expect(logSpy).toHaveBeenCalledWith(
          expect.stringContaining('my-token-123'),
        );
      });

      it('should handle null fullName', async () => {
        const logSpy = jest.spyOn((service as any).logger, 'log');

        await service.sendActivationEmail('test@example.com', null, 'token');

        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('N/A'));
      });
    });

    describe('sendWelcomeEmail', () => {
      it('should log welcome email in dev mode', async () => {
        const logSpy = jest.spyOn((service as any).logger, 'log');

        await service.sendWelcomeEmail('test@example.com', 'Test User');

        expect(logSpy).toHaveBeenCalledWith(
          expect.stringContaining('WELCOME EMAIL'),
        );
      });

      it('should handle null fullName', async () => {
        const logSpy = jest.spyOn((service as any).logger, 'log');

        await service.sendWelcomeEmail('test@example.com', null);

        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('N/A'));
      });
    });

    describe('sendPasswordResetEmail', () => {
      it('should log password reset email in dev mode', async () => {
        const logSpy = jest.spyOn((service as any).logger, 'log');

        await service.sendPasswordResetEmail(
          'test@example.com',
          'Test User',
          'reset-token',
        );

        expect(logSpy).toHaveBeenCalledWith(
          expect.stringContaining('PASSWORD RESET EMAIL'),
        );
      });

      it('should include reset URL with token', async () => {
        const logSpy = jest.spyOn((service as any).logger, 'log');

        await service.sendPasswordResetEmail(
          'test@example.com',
          'Test User',
          'reset-token-456',
        );

        expect(logSpy).toHaveBeenCalledWith(
          expect.stringContaining('reset-token-456'),
        );
      });
    });

    describe('sendPasswordChangedEmail', () => {
      it('should log password changed email in dev mode', async () => {
        const logSpy = jest.spyOn((service as any).logger, 'log');

        await service.sendPasswordChangedEmail('test@example.com', 'Test User');

        expect(logSpy).toHaveBeenCalledWith(
          expect.stringContaining('PASSWORD CHANGED EMAIL'),
        );
      });
    });
  });

  describe('when SMTP is configured', () => {
    let mockSendMail: jest.Mock;

    beforeEach(async () => {
      mockSendMail = jest.fn().mockResolvedValue({ messageId: 'test-id' });

      // Mock nodemailer
      jest.mock('nodemailer', () => ({
        createTransport: jest.fn().mockReturnValue({
          sendMail: mockSendMail,
        }),
      }));

      const mockConfigService = {
        get: jest.fn().mockImplementation((key: string) => {
          if (key === 'SMTP_HOST') {
            return 'smtp.gmail.com';
          }
          if (key === 'SMTP_USER') {
            return 'real@gmail.com';
          }
          if (key === 'SMTP_PASS') {
            return 'real-password';
          }
          if (key === 'SMTP_PORT') {
            return 587;
          }
          if (key === 'SMTP_SECURE') {
            return 'false';
          }
          if (key === 'SMTP_FROM') {
            return 'noreply@learnix.com';
          }
          if (key === 'FRONTEND_URL') {
            return 'http://localhost:5173';
          }
          return null;
        }),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          MailService,
          { provide: ConfigService, useValue: mockConfigService },
        ],
      }).compile();

      service = module.get<MailService>(MailService);
    });

    afterEach(() => {
      jest.clearAllMocks();
      jest.resetModules();
    });

    it('should be defined with SMTP configured', () => {
      expect(service).toBeDefined();
    });
  });

  describe('email content generation', () => {
    beforeEach(async () => {
      const mockConfigService = {
        get: jest.fn().mockImplementation((key: string) => {
          if (key === 'SMTP_HOST') {
            return 'smtp.example.com';
          } // Not configured
          if (key === 'FRONTEND_URL') {
            return 'http://localhost:5173';
          }
          return null;
        }),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          MailService,
          { provide: ConfigService, useValue: mockConfigService },
        ],
      }).compile();

      service = module.get<MailService>(MailService);
    });

    it('should use correct frontend URL for activation link', async () => {
      const logSpy = jest.spyOn((service as any).logger, 'log');

      await service.sendActivationEmail('test@example.com', 'User', 'token');

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('http://localhost:5173/activate?token=token'),
      );
    });

    it('should use correct frontend URL for password reset link', async () => {
      const logSpy = jest.spyOn((service as any).logger, 'log');

      await service.sendPasswordResetEmail(
        'test@example.com',
        'User',
        'reset-token',
      );

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'http://localhost:5173/reset-password?token=reset-token',
        ),
      );
    });
  });
});
