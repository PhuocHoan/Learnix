import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

import { User } from '../../users/entities/user.entity';

export enum AuthProvider {
  GOOGLE = 'google',
  GITHUB = 'github',
}

@Entity('external_auth')
@Index(['provider', 'providerId'], { unique: true }) // Ensure one provider account per user
export class ExternalAuth {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: AuthProvider,
  })
  provider: AuthProvider;

  @Column({ name: 'provider_id' })
  providerId: string; // The ID from the OAuth provider (e.g., Google ID, GitHub ID)

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ nullable: true })
  accessToken: string; // Optional: store access token if needed for API calls

  @Column({ nullable: true })
  refreshToken: string; // Optional: store refresh token

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
