import { Transform } from 'class-transformer';
import {
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
  IsUrl,
} from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === '' ? null : (value as string),
  )
  @MaxLength(100, { message: 'Full name must not exceed 100 characters' })
  fullName?: string | null;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === '' ? null : (value as string),
  )
  @ValidateIf(
    (o: UpdateProfileDto) => o.avatarUrl !== undefined && o.avatarUrl !== null,
  )
  @IsUrl(
    { require_tld: false }, // Allow localhost URLs for development
    { message: 'Avatar URL must be a valid URL' },
  )
  avatarUrl?: string | null;
}
