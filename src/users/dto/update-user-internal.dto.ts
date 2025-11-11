import { IsBoolean, IsDate, IsOptional, IsString } from 'class-validator';

export class UpdateUserInternalDto {
  @IsOptional()
  @IsString()
  hashedRefreshToken?: string | null;

  @IsOptional()
  @IsBoolean()
  verified?: boolean;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  passwordResetToken?: string | null;

  @IsOptional()
  @IsDate()
  passwordResetExpiry?: Date | null;
}
