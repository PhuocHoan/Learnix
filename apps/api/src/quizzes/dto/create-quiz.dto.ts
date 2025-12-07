import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateQuizDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsNotEmpty()
  lessonId: string;

  @IsUUID()
  @IsOptional()
  courseId?: string;
}
