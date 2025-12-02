import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

import { Question } from './question.entity';

export enum QuizStatus {
  DRAFT = 'draft',
  AI_GENERATED = 'ai_generated',
  APPROVED = 'approved',
}

@Entity('quizzes')
export class Quiz {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ name: 'course_id', nullable: true })
  courseId: string; // Will link to course when courses module is created

  @Column({ name: 'lesson_id', nullable: true })
  lessonId: string; // Will link to lesson when lessons module is created

  @Column({
    type: 'enum',
    enum: QuizStatus,
    default: QuizStatus.DRAFT,
  })
  status: QuizStatus;

  @Column({ name: 'created_by' })
  createdBy: string; // User ID of instructor

  @Column({ name: 'ai_generated', default: false })
  aiGenerated: boolean;

  @OneToMany(() => Question, (question) => question.quiz, { cascade: true })
  questions: Question[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
