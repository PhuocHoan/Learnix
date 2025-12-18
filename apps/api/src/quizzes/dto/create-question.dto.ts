import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsOptional,
  IsEnum,
  IsInt,
} from 'class-validator';

export class CreateQuestionDto {
  @IsString()
  @IsNotEmpty()
  questionText: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsArray()
  options: string[];

  @IsString()
  @IsNotEmpty()
  correctAnswer: string;

  @IsOptional()
  @IsString()
  explanation?: string;

  @IsOptional()
  @IsEnum(['multiple_choice', 'multi_select', 'true_false', 'short_answer'])
  type?: string;

  @IsOptional()
  @IsInt()
  points?: number;
}
