import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';

import { CourseSection } from './course-section.entity';

import type { LessonResource } from './lesson-resource.entity';

// Define the types of blocks we support
export type BlockType = 'text' | 'video' | 'image' | 'code' | 'file';

// Define the structure of a single block
export interface LessonBlock {
  id: string; // Unique ID for React keys and drag-and-drop operations
  type: BlockType;
  content: string; // The actual text, URL, or file path
  metadata?: {
    // Flexible field for extra data
    language?: string; // For code blocks (e.g., 'javascript', 'python')
    filename?: string; // For file attachments
    size?: number; // File size
    caption?: string; // For images
  };
  orderIndex: number; // To maintain sequence
}

@Entity('lessons')
export class Lesson {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({
    type: 'enum',
    enum: ['standard', 'quiz'],
    default: 'standard',
  })
  type: 'standard' | 'quiz';

  @Column({ type: 'json', nullable: true })
  content: LessonBlock[]; // Stores the array of blocks

  @Column({ type: 'json', nullable: true })
  ideConfig: {
    allowedLanguages: {
      language: string;
      initialCode: string;
      expectedOutput?: string;
    }[];
    defaultLanguage: string;
    instructions?: string;
  } | null;

  @Column({ default: 0 })
  durationSeconds: number;

  @Column({ default: false })
  isFreePreview: boolean;

  @Column({ default: 0 })
  orderIndex: number;

  @Column({ name: 'section_id' })
  sectionId: string;

  @ManyToOne('CourseSection', (section: CourseSection) => section.lessons, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'section_id' })
  section: CourseSection;

  @OneToMany('LessonResource', (resource: LessonResource) => resource.lesson, {
    cascade: true,
  })
  resources: LessonResource[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}
