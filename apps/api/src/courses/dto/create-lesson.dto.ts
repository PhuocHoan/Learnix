import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  IsObject,
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

  @IsOptional()
  @IsObject()
  ideConfig?: {
    allowedLanguages: {
      language: string;
      initialCode: string;
      expectedOutput?: string;
      unitTestCode?: string;
    }[];
    defaultLanguage: string;
    instructions?: string;
  };

  @IsNumber()
  orderIndex: number;
}
