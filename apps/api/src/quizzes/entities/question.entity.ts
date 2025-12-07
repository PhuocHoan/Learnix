import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';

import type { Quiz } from './quiz.entity';

@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'quiz_id' })
  quizId: string;

  @ManyToOne('Quiz', (quiz: Quiz) => quiz.questions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quiz_id' })
  quiz: Quiz;

  @Column({ type: 'text' })
  questionText: string;

  @Column({ type: 'json' })
  options: string[]; // Array of 4 options: ["A: ...", "B: ...", "C: ...", "D: ..."]

  @Column()
  correctAnswer: string; // e.g., "A", "B", "C", or "D"

  @Column({ nullable: true, type: 'text' })
  explanation: string;

  @Column({ default: 1 })
  points: number;

  @Column({ default: 0 })
  position: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
