import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';

import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { ExternalAuth, AuthProvider } from './entities/external-auth.entity';
import { MailService } from '../mail/mail.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UpdateProfileDto } from '../users/dto/update-profile.dto';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/enums/user-role.enum';

export interface OAuthProfile {
  email: string;
  fullName: string;
  avatarUrl: string;
  providerId: string;
  accessToken?: string;
  refreshToken?: string;
}

export interface LoginResult {
  access_token: string;
  user: Omit<User, 'password' | 'activationToken' | 'passwordResetToken'>;
}

/** User type with sensitive fields removed */
export type SafeUser = Omit<
  User,
  'password' | 'activationToken' | 'passwordResetToken'
>;

export interface ActivationResult {
  message: string;
  alreadyActivated?: boolean;
}

export interface MessageResult {
  message: string;
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private mailService: MailService,
    @InjectRepository(ExternalAuth)
    private externalAuthRepository: Repository<ExternalAuth>,
  ) {}

  async validateUser(
    email: string,
    pass: string,
  ): Promise<Omit<User, 'password'> | null> {
    const user = await this.usersService.findByEmail(email);
    if (!user?.password) {
      // User doesn't exist or uses OAuth login only
      return null;
    }
    if (await bcrypt.compare(pass, user.password)) {
      const { password: _, ...result } = user;
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto): Promise<LoginResult> {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      throw new UnauthorizedException(
        'Please verify your email address before logging in',
      );
    }

    // Check if account is active (not blocked)
    if (!user.isActive) {
      throw new UnauthorizedException(
        'Your account has been blocked. Please contact support.',
      );
    }

    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }

  async register(
    createUserDto: CreateUserDto,
  ): Promise<SafeUser & { message: string }> {
    // Don't set role during registration - user will select it on /select-role page

    const { role: _unusedRole, ...userDataWithoutRole } = createUserDto;

    // Create user with activation token
    const { user, activationToken } =
      await this.usersService.createWithActivationToken(userDataWithoutRole);

    // Send activation email
    await this.mailService.sendActivationEmail(
      user.email,
      user.fullName,
      activationToken,
    );

    const {
      password: _p,
      activationToken: _at,
      passwordResetToken: _prt,
      ...result
    } = user;
    return {
      ...result,
      message:
        'Registration successful. Please check your email to activate your account.',
    };
  }

  async activateAccount(token: string): Promise<ActivationResult> {
    const user = await this.usersService.findByActivationToken(token);

    if (!user) {
      // Token not found - could be already used (activation successful) or invalid
      // Check if there's a recently activated user to provide better UX
      throw new BadRequestException(
        'This activation link has already been used or is invalid. If you already activated your account, please log in.',
      );
    }

    if (user.isEmailVerified) {
      // Account already activated - return success for idempotency
      return {
        message: 'Account is already activated. You can now log in.',
        alreadyActivated: true,
      };
    }

    if (user.activationTokenExpiry && new Date() > user.activationTokenExpiry) {
      throw new BadRequestException(
        'Activation token has expired. Please register again.',
      );
    }

    await this.usersService.activateUser(user.id);

    // Send welcome email
    await this.mailService.sendWelcomeEmail(user.email, user.fullName);

    return { message: 'Account activated successfully. You can now log in.' };
  }

  async resendActivationEmail(email: string): Promise<MessageResult> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      // Don't reveal if email exists for security
      return {
        message:
          'If an account exists with this email, an activation link has been sent.',
      };
    }

    if (user.isEmailVerified) {
      throw new BadRequestException(
        'This account is already activated. Please login.',
      );
    }

    // Regenerate activation token
    const { activationToken } =
      await this.usersService.regenerateActivationToken(user.id);

    // Send activation email
    await this.mailService.sendActivationEmail(
      user.email,
      user.fullName,
      activationToken,
    );

    return {
      message:
        'If an account exists with this email, an activation link has been sent.',
    };
  }

  async validateOAuthLogin(
    provider: AuthProvider,
    profile: OAuthProfile,
  ): Promise<LoginResult> {
    // Check if external auth already exists
    let externalAuth = await this.externalAuthRepository.findOne({
      where: { provider, providerId: profile.providerId },
      relations: ['user'],
    });

    let user: User | null = null;

    if (externalAuth) {
      // User has logged in with this provider before
      ({ user } = externalAuth);

      // Update OAuth avatar if it changed
      if (profile.avatarUrl && user.oauthAvatarUrl !== profile.avatarUrl) {
        await this.usersService.updateOAuthAvatar(user.id, profile.avatarUrl);
        user.oauthAvatarUrl = profile.avatarUrl;
      }

      // Update tokens if provided
      if (profile.accessToken ?? profile.refreshToken) {
        externalAuth.accessToken =
          profile.accessToken ?? externalAuth.accessToken;
        externalAuth.refreshToken =
          profile.refreshToken ?? externalAuth.refreshToken;
        await this.externalAuthRepository.save(externalAuth);
      }
    } else {
      // No existing external auth for this provider+providerId
      // Check if user exists with this email
      user = await this.usersService.findByEmail(profile.email);

      if (!user) {
        // Create new user (no password needed for OAuth users)
        // OAuth users are automatically verified since email is confirmed by provider
        user = await this.usersService.create({
          email: profile.email,
          fullName: profile.fullName,
          avatarUrl: profile.avatarUrl, // Set as current avatar
          oauthAvatarUrl: profile.avatarUrl, // Store OAuth avatar for fallback
        });
      } else if (profile.avatarUrl) {
        // User exists but linking new OAuth provider - update OAuth avatar
        await this.usersService.updateOAuthAvatar(user.id, profile.avatarUrl);
        user.oauthAvatarUrl = profile.avatarUrl;
      }

      // Create external auth record linking this provider to this user
      externalAuth = this.externalAuthRepository.create({
        provider,
        providerId: profile.providerId,
        userId: user.id,
        accessToken: profile.accessToken,
        refreshToken: profile.refreshToken,
      });
      await this.externalAuthRepository.save(externalAuth);
    }

    // TypeScript narrows user to non-null after the else block above
    const validUser = user;

    if (!validUser.isActive) {
      throw new UnauthorizedException(
        'Your account has been blocked. Please contact support.',
      );
    }

    const payload = {
      email: validUser.email,
      sub: validUser.id,
      role: validUser.role,
    };

    // Extract user without password for return
    const {
      password: _,
      activationToken: __,
      passwordResetToken: ___,
      ...userWithoutSensitiveData
    } = validUser;

    return {
      access_token: this.jwtService.sign(payload),
      user: userWithoutSensitiveData,
    };
  }

  async updateUserRole(userId: string, role: UserRole): Promise<User> {
    return await this.usersService.updateRole(userId, role);
  }

  async getUserById(userId: string): Promise<User> {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }

  // Password reset flow
  async forgotPassword(email: string): Promise<MessageResult> {
    const user = await this.usersService.findByEmail(email);

    // Don't reveal if email exists for security
    if (!user) {
      return {
        message:
          'If an account exists with this email, a password reset link has been sent.',
      };
    }

    // Check if user has a password (not OAuth-only)
    const hasPassword = await this.usersService.hasPassword(user.id);
    if (!hasPassword) {
      return {
        message:
          'If an account exists with this email, a password reset link has been sent.',
      };
    }

    // Generate password reset token
    const { resetToken } = await this.usersService.createPasswordResetToken(
      user.id,
    );

    // Send password reset email
    await this.mailService.sendPasswordResetEmail(
      user.email,
      user.fullName,
      resetToken,
    );

    return {
      message:
        'If an account exists with this email, a password reset link has been sent.',
    };
  }

  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<MessageResult> {
    const user = await this.usersService.findByPasswordResetToken(token);

    if (!user) {
      throw new BadRequestException(
        'This password reset link is invalid or has already been used.',
      );
    }

    if (
      user.passwordResetTokenExpiry &&
      new Date() > user.passwordResetTokenExpiry
    ) {
      throw new BadRequestException(
        'This password reset link has expired. Please request a new one.',
      );
    }

    await this.usersService.resetPassword(user.id, newPassword);

    // Send password changed confirmation email
    await this.mailService.sendPasswordChangedEmail(user.email, user.fullName);

    return {
      message: 'Password has been reset successfully. You can now log in.',
    };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<MessageResult> {
    await this.usersService.changePassword(
      userId,
      currentPassword,
      newPassword,
    );

    const user = await this.usersService.findOne(userId);
    if (user) {
      await this.mailService.sendPasswordChangedEmail(
        user.email,
        user.fullName,
      );
    }

    return { message: 'Password changed successfully.' };
  }

  async updateProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<User> {
    return await this.usersService.updateProfile(userId, updateProfileDto);
  }

  async deleteAccount(
    userId: string,
    password: string | undefined,
    confirmation: string,
  ): Promise<MessageResult> {
    if (confirmation !== 'DELETE') {
      throw new BadRequestException(
        'Please type "DELETE" to confirm account deletion.',
      );
    }

    // Check if user has a password
    const hasPassword = await this.usersService.hasPassword(userId);

    if (hasPassword) {
      if (!password) {
        throw new BadRequestException(
          'Password is required to delete your account.',
        );
      }

      // Verify password
      const user = await this.usersService.findByEmail(
        (await this.usersService.findOne(userId))?.email ?? '',
      );
      if (!user?.password) {
        throw new BadRequestException('Unable to verify account.');
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new BadRequestException('Incorrect password.');
      }
    }

    // Delete external auth records first
    const user = await this.usersService.findOne(userId);
    if (user) {
      await this.externalAuthRepository.delete({ userId: user.id });
    }

    // Delete user account
    await this.usersService.deleteAccount(userId);

    return { message: 'Account deleted successfully.' };
  }

  async hasPassword(userId: string): Promise<boolean> {
    return await this.usersService.hasPassword(userId);
  }

  /**
   * Generate a JWT access token with the given payload
   */
  signToken(payload: { sub: string; email: string; role: string }): string {
    return this.jwtService.sign(payload);
  }
}
