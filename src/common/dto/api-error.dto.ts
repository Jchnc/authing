import { ApiProperty } from '@nestjs/swagger';

export class ApiErrorDto {
  @ApiProperty({ example: 400, description: 'HTTP status code' })
  statusCode: number;

  @ApiProperty({ example: 'Bad Request', description: 'Error type' })
  error: string;

  @ApiProperty({
    example: 'Validation failed',
    description: 'Error message or array of messages',
  })
  message: string | string[];

  @ApiProperty({
    example: { field: 'error details' },
    description: 'Additional error details (optional)',
    required: false,
  })
  details?: Record<string, any>;
}
