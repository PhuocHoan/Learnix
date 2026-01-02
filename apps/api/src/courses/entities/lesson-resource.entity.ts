import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

import type { Lesson } from './lesson.entity';

export type ResourceType = 'file' | 'link';

@Entity('lesson_resources')
export class LessonResource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({
    type: 'enum',
    enum: ['file', 'link'],
  })
  type: ResourceType;

  @Column()
  url: string;

  @Column({ nullable: true })
  fileSize?: number;

  @Column()
  lessonId: string;

  @ManyToOne('Lesson', (lesson: Lesson) => lesson.resources, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'lessonId' })
  lesson: Lesson;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}
