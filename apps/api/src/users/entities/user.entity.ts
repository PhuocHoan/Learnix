import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { UserRole } from '../enums/user-role.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ type: 'varchar', select: false, nullable: true }) // Don't return password by default, allow NULL for OAuth users
  password: string | null;

  @Column({ type: 'varchar', nullable: true })
  fullName: string | null;

  @Column({ type: 'varchar', nullable: true })
  avatarUrl: string | null;

  @Column({ type: 'varchar', nullable: true }) // Original avatar from OAuth provider (Google/GitHub)
  oauthAvatarUrl: string | null;

  @Column({
    type: 'enum',
    enum: UserRole,
    nullable: true, // Allow null so users can select role after signup
  })
  role: UserRole | null;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({ type: 'varchar', nullable: true, select: false })
  activationToken: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  activationTokenExpiry: Date | null;

  @Column({ type: 'varchar', nullable: true, select: false })
  passwordResetToken: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  passwordResetTokenExpiry: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
