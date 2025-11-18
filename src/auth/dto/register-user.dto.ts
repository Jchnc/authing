import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from 'src/generated/prisma/enums';

export class RegisterUserDto {
  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Unique email address',
  })
  email: string;

  @ApiProperty({
    example: 'SecurePass123!',
    description: 'Password must be at least 6 characters',
    minLength: 6,
  })
  password: string;

  @ApiProperty({
    example: 'John',
    required: false,
    nullable: true,
  })
  firstName: string;

  @ApiProperty({
    example: 'Doe',
    required: false,
    nullable: true,
  })
  lastName: string;

  @ApiPropertyOptional({
    enum: Role,
    example: Role.USER,
    required: false,
    description: 'User role (e.g., USER, ADMIN)',
  })
  role?: Role;
}
