import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class DeleteAccountDto {
  @IsString()
  @IsOptional()
  password?: string; // Required for password-based accounts, optional for OAuth-only accounts

  @IsString()
  @IsNotEmpty()
  confirmation: string; // User must type "DELETE" to confirm
}
