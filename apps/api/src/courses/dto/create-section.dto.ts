import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateSectionDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsNumber()
  orderIndex: number;
}
