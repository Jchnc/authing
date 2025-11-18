import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailResponseDto {
  @ApiProperty({
    description: 'Message',
    example: 'Email verified successfully',
  })
  message: string;
  @ApiProperty({
    description: 'Email',
    example: 'john.doe@example.com',
  })
  email: string;
}
