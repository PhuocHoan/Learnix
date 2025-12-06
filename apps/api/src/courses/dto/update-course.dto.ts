import { PartialType } from '@nestjs/mapped-types';

import { IsBoolean, IsOptional } from 'class-validator';

import { CreateCourseDto } from './create-course.dto';

export class UpdateCourseDto extends PartialType(CreateCourseDto) {
  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;
}
