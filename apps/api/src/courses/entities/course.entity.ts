import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';

import { CourseStatus } from '../enums/course-status.enum';

import type { CourseSection } from './course-section.entity';
import type { Enrollment } from './enrollment.entity';
import type { User } from '../../users/entities/user.entity';

export enum CourseLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}

@Entity('courses')
export class Course {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ nullable: true })
  thumbnailUrl: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price: number;

  @Column({
    type: 'enum',
    enum: CourseLevel,
    default: CourseLevel.BEGINNER,
  })
  level: CourseLevel;

  @Column({
    type: 'enum',
    enum: CourseStatus,
    default: CourseStatus.DRAFT,
  })
  status: CourseStatus;

  @Column({ default: false })
  isPublished: boolean;

  @Column({ type: 'simple-array', nullable: true })
  tags: string[] | null; // e.g., ["react", "frontend", "web"]

  // Instructor relationship
  @Column({ name: 'instructor_id' })
  instructorId: string;

  @ManyToOne('User')
  @JoinColumn({ name: 'instructor_id' })
  instructor: User | null;

  // Content relationship
  @OneToMany('CourseSection', (section: CourseSection) => section.course, {
    cascade: true,
  })
  sections: CourseSection[];

  // Student relationship
  @OneToMany('Enrollment', (enrollment: Enrollment) => enrollment.course)
  enrollments: Enrollment[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
