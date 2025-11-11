import { IsUUID, IsNotEmpty } from 'class-validator';

export class LogoutDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;
}
