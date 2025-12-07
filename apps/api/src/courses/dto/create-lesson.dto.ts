import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
} from 'class-validator';

import { LessonBlock } from '../entities/lesson.entity';

export class CreateLessonDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  type?: 'standard' | 'quiz';

  @IsArray()
  @IsOptional()
  // In a real app, you might create a specific DTO for LessonBlock validation here
  // For now, we allow the array structure defined in the entity
  content?: LessonBlock[];

  @IsNumber()
  @IsOptional()
  durationSeconds?: number;

  @IsBoolean()
  @IsOptional()
  isFreePreview?: boolean;

  @IsNumber()
  orderIndex: number;
}
