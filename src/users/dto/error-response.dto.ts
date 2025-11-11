import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({
    description: 'HTTP status code',
    example: 404,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Error message',
    example: 'User with ID 550e8400-e29b-41d4-a716-446655440000 not found',
  })
  message: string;

  @ApiProperty({
    description: 'Error name',
    example: 'Not Found',
  })
  error: string;
}
