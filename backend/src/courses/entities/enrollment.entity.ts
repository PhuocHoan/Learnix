import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Course } from './course.entity';
import { User } from '../../users/entities/user.entity';

@Entity('enrollments')
export class Enrollment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'course_id' })
  courseId: string;

  @ManyToOne(() => Course, (course) => course.enrollments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @Column({ type: 'simple-array', nullable: true })
  completedLessonIds: string[]; // List of IDs of lessons completed

  @Column({ nullable: true })
  completedAt: Date; // When they finished the course

  @Column({ name: 'is_archived', default: false })
  isArchived: boolean; // Whether the course is archived by the user

  @Column({ name: 'archived_at', nullable: true })
  archivedAt: Date; // When the user archived the course

  @CreateDateColumn({ name: 'enrolled_at' })
  enrolledAt: Date;

  @UpdateDateColumn({ name: 'last_accessed_at' })
  lastAccessedAt: Date;
}
