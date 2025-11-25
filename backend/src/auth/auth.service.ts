import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { ExternalAuth, AuthProvider } from './entities/external-auth.entity';
import { User } from '../users/entities/user.entity';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UserRole } from '../users/enums/user-role.enum';

export interface OAuthProfile {
  email: string;
  fullName: string;
  avatarUrl: string;
  providerId: string;
  accessToken?: string;
  refreshToken?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @InjectRepository(ExternalAuth)
    private externalAuthRepository: Repository<ExternalAuth>,
  ) {}

  async validateUser(
    email: string,
    pass: string,
  ): Promise<Omit<User, 'password'> | null> {
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.password) {
      // User doesn't exist or uses OAuth login only
      return null;
    }
    if (await bcrypt.compare(pass, user.password)) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...result } = user;
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }

  async register(createUserDto: CreateUserDto) {
    // Don't set role during registration - user will select it on /select-role page
    const { role: _, ...userDataWithoutRole } = createUserDto;
    const user = await this.usersService.create(userDataWithoutRole);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: __, ...result } = user;
    return result;
  }

  async validateOAuthLogin(provider: AuthProvider, profile: OAuthProfile) {
    console.log(`OAuth Login - Provider: ${provider}, Email: ${profile.email}, ProviderId: ${profile.providerId}`);
    
    // Check if external auth already exists
    let externalAuth = await this.externalAuthRepository.findOne({
      where: { provider, providerId: profile.providerId },
      relations: ['user'],
    });

    console.log('External Auth Found:', externalAuth ? `Yes, User: ${externalAuth.user.email}` : 'No');

    let user: User | null = null;

    if (externalAuth) {
      // User has logged in with this provider before
      user = externalAuth.user;

      // Update tokens if provided
      if (profile.accessToken || profile.refreshToken) {
        externalAuth.accessToken =
          profile.accessToken || externalAuth.accessToken;
        externalAuth.refreshToken =
          profile.refreshToken || externalAuth.refreshToken;
        await this.externalAuthRepository.save(externalAuth);
      }
    } else {
      // No existing external auth for this provider+providerId
      // Check if user exists with this email
      user = await this.usersService.findByEmail(profile.email);

      console.log('Existing User Found by Email:', user ? `Yes, Email: ${user.email}, ID: ${user.id}` : 'No');

      if (!user) {
        // Create new user (no password needed for OAuth users)
        console.log(`Creating NEW user with email: ${profile.email}`);
        user = await this.usersService.create({
          email: profile.email,
          fullName: profile.fullName,
          avatarUrl: profile.avatarUrl,
        });
        console.log(`Created user with ID: ${user.id}`);
      } else {
        console.log(`Linking existing user (${user.email}) to ${provider} account`);
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

    if (!user) {
      throw new UnauthorizedException('Failed to authenticate user');
    }

    console.log(`Returning user: ${user.email} (ID: ${user.id}, Role: ${user.role})`);

    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
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
}
