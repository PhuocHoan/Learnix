import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class GenerateQuizPreviewDto {
  @IsArray()
  @IsString({ each: true })
  lessonIds: string[];

  @IsNumber()
  @Min(1)
  @Max(20)
  @IsOptional()
  count?: number = 5;

  @IsString()
  @IsOptional()
  topic?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  preferredTypes?: string[];
}
