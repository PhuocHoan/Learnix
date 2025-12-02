import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  UseGuards,
  Req,
  Res,
  Query,
  Patch,
  Delete,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { ChangePasswordDto } from './dto/change-password.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SelectRoleDto } from './dto/select-role.dto';
import { AuthProvider } from './entities/external-auth.entity';
import { GithubAuthGuard } from './guards/github-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UpdateProfileDto } from '../users/dto/update-profile.dto';
import { User } from '../users/entities/user.entity';

import type {
  OAuthProfile,
  ActivationResult,
  MessageResult,
  SafeUser,
} from './auth.service';
import type { Response, Request, CookieOptions } from 'express';

// Cookie configuration for secure token storage
const getCookieOptions = (isOAuthRedirect = false): CookieOptions => {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    secure: isProduction,
    // For OAuth redirects across domains, we need 'none' with secure
    // For same-origin requests, 'lax' is preferred
    sameSite:
      isProduction && isOAuthRedirect ? ('none' as const) : ('lax' as const),
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    path: '/',
    // In production, don't set domain to allow cookie to work with Vercel proxy
    ...(isProduction && { domain: undefined }),
  };
};

const COOKIE_OPTIONS = getCookieOptions(false);

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async signIn(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ user: SafeUser; message: string }> {
    const result = await this.authService.login(loginDto);

    // Set JWT token in HTTP-only cookie
    res.cookie('access_token', result.access_token, COOKIE_OPTIONS);

    // Return user data without token (token is in cookie)
    return { user: result.user, message: 'Login successful' };
  }

  @Post('register')
  signUp(
    @Body() createUserDto: CreateUserDto,
  ): Promise<SafeUser & { message: string }> {
    return this.authService.register(createUserDto);
  }

  @Get('activate')
  @HttpCode(HttpStatus.OK)
  async activateAccount(
    @Query('token') token: string,
  ): Promise<ActivationResult> {
    return this.authService.activateAccount(token);
  }

  @Post('resend-activation')
  @HttpCode(HttpStatus.OK)
  async resendActivationEmail(
    @Body('email') email: string,
  ): Promise<MessageResult> {
    return this.authService.resendActivationEmail(email);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: Response): MessageResult {
    // Clear the cookie
    res.clearCookie('access_token', { path: '/' });
    return { message: 'Logout successful' };
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleAuth(): void {
    // Force account selection by passing prompt parameter
    // This prevents Google from using cached sessions
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthRedirect(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const profile = req.user as unknown as OAuthProfile;
    const result = await this.authService.validateOAuthLogin(
      AuthProvider.GOOGLE,
      profile,
    );
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');

    // Set HTTP-only cookie as backup (useful if callback URL is proxied through frontend)
    const oauthCookieOptions = getCookieOptions(true);
    res.cookie('access_token', result.access_token, oauthCookieOptions);

    // Also pass token in URL for frontend to set cookie on its domain
    // This is necessary because:
    // 1. Backend and frontend are on different Vercel deployments (different domains)
    // 2. The cookie we set here is on backend domain, not frontend domain
    // 3. Frontend sets cookie on its domain so it's sent with /api/* requests
    // The token in URL is secure because:
    // - It's passed via server redirect, not exposed to client scripts until callback loads
    // - Frontend immediately clears it from URL after extraction
    // - Token has limited lifetime
    res.redirect(`${frontendUrl}/auth/callback?token=${result.access_token}`);
  }

  @Get('github')
  @UseGuards(GithubAuthGuard)
  githubAuth(): void {
    // Initiates the GitHub OAuth flow
  }

  @Get('github/callback')
  @UseGuards(GithubAuthGuard)
  async githubAuthRedirect(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const result = await this.authService.validateOAuthLogin(
      AuthProvider.GITHUB,
      req.user as unknown as OAuthProfile,
    );
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');

    // Set HTTP-only cookie as backup (useful if callback URL is proxied through frontend)
    const oauthCookieOptions = getCookieOptions(true);
    res.cookie('access_token', result.access_token, oauthCookieOptions);

    // Also pass token in URL for frontend to set cookie on its domain
    res.redirect(`${frontendUrl}/auth/callback?token=${result.access_token}`);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: User): Promise<User> {
    // Fetch fresh user data from database to get updated role
    const freshUser = await this.authService.getUserById(user.id);
    return freshUser;
  }

  @Post('select-role')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async selectRole(
    @CurrentUser() user: User,
    @Body() selectRoleDto: SelectRoleDto,
  ): Promise<{ user: SafeUser; message: string }> {
    const updatedUser = await this.authService.updateUserRole(
      user.id,
      selectRoleDto.role,
    );
    const {
      password: _p,
      activationToken: _at,
      passwordResetToken: _prt,
      ...userWithoutSensitiveData
    } = updatedUser as User & {
      password?: string | null;
      activationToken?: string | null;
      passwordResetToken?: string | null;
    };
    return {
      user: userWithoutSensitiveData,
      message: 'Role selected successfully',
    };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ): Promise<MessageResult> {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<MessageResult> {
    return this.authService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.newPassword,
    );
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser() user: User,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<MessageResult> {
    return this.authService.changePassword(
      user.id,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @CurrentUser() user: User,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<{ user: User; message: string }> {
    const updatedUser = await this.authService.updateProfile(
      user.id,
      updateProfileDto,
    );
    return {
      user: updatedUser,
      message: 'Profile updated successfully',
    };
  }

  @Delete('account')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async deleteAccount(
    @CurrentUser() user: User,
    @Body() deleteAccountDto: DeleteAccountDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<MessageResult> {
    const result = await this.authService.deleteAccount(
      user.id,
      deleteAccountDto.password,
      deleteAccountDto.confirmation,
    );

    // Clear the auth cookie
    res.clearCookie('access_token', { path: '/' });

    return result;
  }

  @Get('has-password')
  @UseGuards(JwtAuthGuard)
  async hasPassword(
    @CurrentUser() user: User,
  ): Promise<{ hasPassword: boolean }> {
    const hasPassword = await this.authService.hasPassword(user.id);
    return { hasPassword };
  }
}
