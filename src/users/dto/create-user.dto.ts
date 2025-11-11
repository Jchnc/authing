import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { Role } from 'src/generated/prisma/client';

export class CreateUserDto {
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
  @MinLength(6)
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    example: 'John',
    required: false,
    nullable: true,
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    example: 'Doe',
    required: false,
    nullable: true,
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    enum: Role,
    example: Role.USER,
    required: false,
    description: 'User role (e.g., USER, ADMIN)',
  })
  @IsEnum(Role)
  role?: Role;
}
