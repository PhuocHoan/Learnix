import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';

import { UserRole } from '../enums/user-role.enum';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  // Allows password to be omitted for OAuth users
  @ValidateIf(
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- password can be undefined at runtime
    (o: CreateUserDto) => o.password !== undefined && o.password !== null,
  )
  @IsString()
  @MinLength(6)
  password?: string;

  @IsString()
  @IsOptional()
  fullName?: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @IsString()
  @IsOptional()
  oauthAvatarUrl?: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}
