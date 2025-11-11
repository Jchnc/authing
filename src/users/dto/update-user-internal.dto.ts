import { IsOptional, IsString } from 'class-validator';

export class UpdateUserInternalDto {
  @IsOptional()
  @IsString()
  hashedRefreshToken?: string | null;
}
