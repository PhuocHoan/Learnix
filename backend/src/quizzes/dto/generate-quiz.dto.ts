import { IsString, IsNumber, Min, Max, IsNotEmpty } from 'class-validator';

export class GenerateQuizDto {
  @IsString()
  @IsNotEmpty()
  lessonText: string;

  @IsNumber()
  @Min(3)
  @Max(20)
  numberOfQuestions: number = 5;

  @IsString()
  @IsNotEmpty()
  title: string;
}
