import { ApiProperty } from '@nestjs/swagger';
import { Role } from 'src/generated/prisma/enums';

export class RegisteredUserDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    example: 'john.doe@example.com',
  })
  email: string;

  @ApiProperty({
    example: 'John',
  })
  firstName: string;

  @ApiProperty({
    example: 'Doe',
  })
  lastName: string;

  @ApiProperty({
    example: Role.USER,
  })
  role: string;

  @ApiProperty({
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    example: false,
  })
  verified: boolean;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: string;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: string;

  @ApiProperty({
    example: null,
  })
  lastLoginAt: string | null;
}

export class RegisterResponseDto {
  @ApiProperty({ type: RegisteredUserDto })
  user: RegisteredUserDto;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;
}
