import { ApiProperty } from '@nestjs/swagger';
import { Role } from 'src/generated/prisma/client';

export class AuthMeResponseDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId: string;

  @ApiProperty({
    example: 'John',
  })
  firstName: string;

  @ApiProperty({
    example: 'Doe',
  })
  lastName: string;

  @ApiProperty({
    example: 'john.doe@example.com',
  })
  email: string;

  @ApiProperty({
    example: Role.USER,
  })
  role: Role;
}
