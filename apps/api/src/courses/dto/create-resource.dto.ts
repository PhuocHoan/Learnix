import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsNumber,
} from 'class-validator';

import { ResourceType } from '../entities/lesson-resource.entity';

export class CreateResourceDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsEnum(['file', 'link'])
  type: ResourceType;

  @IsNotEmpty()
  @IsUrl()
  url: string;

  @IsOptional()
  @IsNumber()
  fileSize?: number;
}
