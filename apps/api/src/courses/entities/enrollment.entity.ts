import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import type { Course } from './course.entity';
import type { User } from '../../users/entities/user.entity';

@Entity('enrollments')
export class Enrollment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne('User', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'course_id' })
  courseId: string;

  @ManyToOne('Course', (course: Course) => course.enrollments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @Column({ type: 'simple-array', nullable: true })
  completedLessonIds: string[] | null; // List of IDs of lessons completed

  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date; // When they finished the course

  @Column({ name: 'is_archived', default: false })
  isArchived: boolean; // Whether the course is archived by the user

  @Column({ name: 'archived_at', type: 'timestamptz', nullable: true })
  archivedAt: Date; // When the user archived the course

  @CreateDateColumn({ name: 'enrolled_at', type: 'timestamptz' })
  enrolledAt: Date;

  @UpdateDateColumn({ name: 'last_accessed_at', type: 'timestamptz' })
  lastAccessedAt: Date;
}
