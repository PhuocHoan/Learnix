import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CourseSection } from './course-section.entity';

export enum LessonType {
  VIDEO = 'video',
  TEXT = 'text',
}

@Entity('lessons')
export class Lesson {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'enum', enum: LessonType, default: LessonType.TEXT })
  type: LessonType;

  @Column({ type: 'text', nullable: true })
  content: string; // Markdown text or HTML

  @Column({ nullable: true })
  videoUrl: string; // URL for video lessons

  @Column({ default: 0 })
  durationSeconds: number; // Estimated time to complete

  @Column({ default: false })
  isFreePreview: boolean; // Can guests watch this?

  @Column({ default: 0 })
  orderIndex: number;

  @Column({ name: 'section_id' })
  sectionId: string;

  @ManyToOne(() => CourseSection, (section) => section.lessons, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'section_id' })
  section: CourseSection;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
