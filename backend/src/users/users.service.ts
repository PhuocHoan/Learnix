import * as crypto from 'crypto';

import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { User } from './entities/user.entity';
import { UserRole } from './enums/user-role.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = createUserDto.password
      ? await bcrypt.hash(createUserDto.password, 10)
      : null;

    // OAuth users (no password) are automatically email verified
    const isOAuthUser = !createUserDto.password;

    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
      isEmailVerified: isOAuthUser,
    });

    return this.usersRepository.save(user);
  }

  async createWithActivationToken(
    createUserDto: CreateUserDto,
  ): Promise<{ user: User; activationToken: string }> {
    const existingUser = await this.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = createUserDto.password
      ? await bcrypt.hash(createUserDto.password, 10)
      : null;

    // Generate activation token
    const activationToken = crypto.randomBytes(32).toString('hex');
    const activationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
      isEmailVerified: false,
      activationToken,
      activationTokenExpiry,
    });

    const savedUser = await this.usersRepository.save(user);
    return { user: savedUser, activationToken };
  }

  async findByActivationToken(token: string): Promise<User | null> {
    // Use query builder to search by activationToken since it has select: false
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.activationToken')
      .where('user.activationToken = :token', { token })
      .getOne();
  }

  async activateUser(userId: string): Promise<User> {
    const user = await this.findOne(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.isEmailVerified = true;
    // Keep the activation token for a grace period (5 minutes) to handle duplicate requests
    // The token will be cleared by the activationTokenExpiry check after this period
    user.activationTokenExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

    return this.usersRepository.save(user);
  }

  async regenerateActivationToken(
    userId: string,
  ): Promise<{ user: User; activationToken: string }> {
    const user = await this.findOne(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Generate new activation token
    const activationToken = crypto.randomBytes(32).toString('hex');
    const activationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    user.activationToken = activationToken;
    user.activationTokenExpiry = activationTokenExpiry;

    const savedUser = await this.usersRepository.save(user);
    return { user: savedUser, activationToken };
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
      select: [
        'id',
        'email',
        'password',
        'role',
        'fullName',
        'avatarUrl',
        'oauthAvatarUrl',
        'isActive',
        'isEmailVerified',
        'createdAt',
        'updatedAt',
      ], // Explicitly select password for auth
    });
  }

  async findOne(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async updateRole(id: string, role: UserRole): Promise<User> {
    const user = await this.findOne(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.role = role;
    return this.usersRepository.save(user);
  }

  async updateStatus(id: string, isActive: boolean): Promise<User> {
    const user = await this.findOne(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.isActive = isActive;
    return this.usersRepository.save(user);
  }

  async count(): Promise<number> {
    return this.usersRepository.count();
  }

  // Password reset methods
  async createPasswordResetToken(
    userId: string,
  ): Promise<{ user: User; resetToken: string }> {
    const user = await this.findOne(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Generate password reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Update user with query builder to set the token
    await this.usersRepository
      .createQueryBuilder()
      .update(User)
      .set({
        passwordResetToken: resetToken,
        passwordResetTokenExpiry: resetTokenExpiry,
      })
      .where('id = :id', { id: userId })
      .execute();

    return { user, resetToken };
  }

  async findByPasswordResetToken(token: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordResetToken')
      .where('user.passwordResetToken = :token', { token })
      .getOne();
  }

  async resetPassword(userId: string, newPassword: string): Promise<User> {
    const user = await this.findOne(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token
    await this.usersRepository
      .createQueryBuilder()
      .update(User)
      .set({
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetTokenExpiry: null,
      })
      .where('id = :id', { id: userId })
      .execute();

    return user;
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<User> {
    // Get user with password
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.id = :id', { id: userId })
      .getOne();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.password) {
      throw new BadRequestException(
        'Cannot change password for OAuth-only accounts. Please set a password first.',
      );
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash and update new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.usersRepository
      .createQueryBuilder()
      .update(User)
      .set({ password: hashedPassword })
      .where('id = :id', { id: userId })
      .execute();

    return user;
  }

  async updateProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<User> {
    const user = await this.findOne(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (updateProfileDto.fullName !== undefined) {
      user.fullName = updateProfileDto.fullName;
    }
    if (updateProfileDto.avatarUrl !== undefined) {
      // Setting to null clears the custom avatar, allowing oauthAvatarUrl to be used as fallback
      user.avatarUrl = updateProfileDto.avatarUrl;
    }

    return this.usersRepository.save(user);
  }

  async updateOAuthAvatar(
    userId: string,
    oauthAvatarUrl: string,
  ): Promise<void> {
    await this.usersRepository
      .createQueryBuilder()
      .update(User)
      .set({ oauthAvatarUrl })
      .where('id = :id', { id: userId })
      .execute();
  }

  async deleteAccount(userId: string): Promise<void> {
    const user = await this.findOne(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.usersRepository.remove(user);
  }

  async hasPassword(userId: string): Promise<boolean> {
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.id = :id', { id: userId })
      .getOne();

    return user?.password !== null && user?.password !== undefined;
  }
}
