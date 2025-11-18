import { ApiProperty } from '@nestjs/swagger';

export class SendVerificationEmailResponseDto {
  @ApiProperty({
    example: 'john.doe@example.com',
  })
  email: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId: string;

  @ApiProperty({
    example: 'John',
  })
  firstName: string;
}
