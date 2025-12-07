import { IsObject } from 'class-validator';

export class SubmitQuizDto {
  @IsObject()
  answers: Record<string, string>;
}
