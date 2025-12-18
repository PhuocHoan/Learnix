import { IsString, IsArray, IsOptional, IsInt, IsEnum } from 'class-validator';

export class UpdateQuestionDto {
  @IsString()
  @IsOptional()
  questionText?: string;

  @IsArray()
  @IsOptional()
  options?: string[];

  @IsString()
  @IsOptional()
  correctAnswer?: string;

  @IsString()
  @IsOptional()
  explanation?: string;

  @IsOptional()
  @IsInt()
  points?: number;

  @IsOptional()
  @IsEnum(['multiple_choice', 'multi_select', 'true_false', 'short_answer'])
  type?: string;

  @IsOptional()
  position?: number;
}
