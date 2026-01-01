import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, IsBoolean } from 'class-validator';

import { UserRole } from '../enums/user-role.enum';

export enum UserSortBy {
  CREATED_AT = 'createdAt',
  FULL_NAME = 'fullName',
  EMAIL = 'email',
}

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class GetUsersFilterDto {
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsEnum(UserSortBy)
  sortBy?: UserSortBy = UserSortBy.CREATED_AT;

  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isEmailVerified?: boolean;

  @IsOptional()
  @IsString()
  search?: string;
}
