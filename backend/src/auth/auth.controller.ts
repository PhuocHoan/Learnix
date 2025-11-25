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
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { AuthService, OAuthProfile } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GithubAuthGuard } from './guards/github-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from './decorators/current-user.decorator';
import { ConfigService } from '@nestjs/config';
import { AuthProvider } from './entities/external-auth.entity';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/enums/user-role.enum';
import { SelectRoleDto } from './dto/select-role.dto';

// Cookie configuration for secure token storage
// For cross-origin (different subdomains), we need sameSite: 'none' and secure: true
const COOKIE_OPTIONS = {
  httpOnly: true, // Prevents XSS attacks - JavaScript cannot access this cookie
  secure: true, // Always use secure in production (required for sameSite: 'none')
  sameSite: 'none' as const, // Required for cross-origin cookies
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  path: '/',
};

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
  ) {
    const result = await this.authService.login(loginDto);

    // Set JWT token in HTTP-only cookie
    res.cookie('access_token', result.access_token, COOKIE_OPTIONS);

    // Return user data without token (token is in cookie)
    return { user: result.user, message: 'Login successful' };
  }

  @Post('register')
  signUp(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: Response) {
    // Clear the cookie
    res.clearCookie('access_token', { path: '/' });
    return { message: 'Logout successful' };
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth(@Req() req: Request) {
    // Force account selection by passing prompt parameter
    // This prevents Google from using cached sessions
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    const profile = req.user as OAuthProfile;
    
    // Debug logging to see what profile we're receiving
    console.log('Google OAuth Profile:', {
      email: profile.email,
      providerId: profile.providerId,
      fullName: profile.fullName,
    });
    
    const result = await this.authService.validateOAuthLogin(
      AuthProvider.GOOGLE,
      profile,
    );
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');

    // Clear cookie with exact same options to ensure it's actually cleared
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
    });
    
    // Set new JWT token in HTTP-only cookie
    res.cookie('access_token', result.access_token, COOKIE_OPTIONS);

    // Redirect to frontend without token in URL (more secure)
    res.redirect(`${frontendUrl}/auth/callback`);
  }

  @Get('github')
  @UseGuards(GithubAuthGuard)
  async githubAuth() {
    // Initiates the GitHub OAuth flow
  }

  @Get('github/callback')
  @UseGuards(GithubAuthGuard)
  async githubAuthRedirect(@Req() req: Request, @Res() res: Response) {
    const result = await this.authService.validateOAuthLogin(
      AuthProvider.GITHUB,
      req.user as OAuthProfile,
    );
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');

    // Clear cookie with exact same options to ensure it's actually cleared
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
    });
    
    // Set new JWT token in HTTP-only cookie
    res.cookie('access_token', result.access_token, COOKIE_OPTIONS);

    // Redirect to frontend without token in URL (more secure)
    res.redirect(`${frontendUrl}/auth/callback`);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: User) {
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
  ) {
    try {
      const updatedUser = await this.authService.updateUserRole(
        user.id,
        selectRoleDto.role,
      );
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...userWithoutPassword } = updatedUser as User & { password?: string | null };
      return { user: userWithoutPassword, message: 'Role selected successfully' };
    } catch (error) {
      throw error;
    }
  }
}
