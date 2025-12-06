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

  // REMOVED: type (LessonType) - The lesson itself is now a container
  // REMOVED: videoUrl - Video is now just a block type

  @Column({ type: 'json', nullable: true })
  content: LessonBlock[]; // Stores the array of blocks

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

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
