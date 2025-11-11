import { ApiProperty } from '@nestjs/swagger';
import { Role } from 'src/generated/prisma/client';

export class UserResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the user',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Email address of the user',
    example: 'john.doe@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'First name of the user',
    required: false,
    nullable: true,
    type: 'string',
    example: 'John',
  })
  firstName: string | null;

  @ApiProperty({
    description: 'Last name of the user',
    required: false,
    nullable: true,
    type: 'string',
    example: 'Doe',
  })
  lastName: string | null;

  @ApiProperty({
    description: 'Role assigned to the user in the system',
    enum: Role,
    example: Role.USER,
  })
  role: Role;

  @ApiProperty({
    description: 'Indicates whether the user account is active',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Indicates whether the user’s email has been verified',
    example: true,
  })
  verified: boolean;

  @ApiProperty({
    description: 'Timestamp when the user account was created',
    type: Date,
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Timestamp when the user account was last updated',
    type: Date,
    example: '2024-10-05T14:45:00.000Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Timestamp of the user’s last login (null if never logged in)',
    required: false,
    nullable: true,
    type: Date,
    example: '2024-11-01T09:15:00.000Z',
  })
  lastLoginAt: Date | null;
}
