import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Unique email address',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'SecurePass123!',
    description: 'Password must be at least 6 characters',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
