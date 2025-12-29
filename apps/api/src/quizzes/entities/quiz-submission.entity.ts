import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { User } from '../../users/entities/user.entity';

import { Quiz } from './quiz.entity';

@Entity('quiz_submissions')
export class QuizSubmission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'quiz_id' })
  quizId: string;

  @ManyToOne(() => Quiz)
  @JoinColumn({ name: 'quiz_id' })
  quiz: Quiz;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column('float', { nullable: true })
  score: number;

  @Column('float', { name: 'total_points', nullable: true })
  totalPoints: number;

  @Column('float', { nullable: true })
  percentage: number;

  @Column('jsonb')
  responses: Record<string, string>;

  @CreateDateColumn({ name: 'completed_at', nullable: true })
  completedAt: Date;
}
