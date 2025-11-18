import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordResponseDto {
  @ApiProperty({
    description: 'Success',
    example: true,
  })
  success: boolean;
  @ApiProperty({
    description: 'Message',
    example: 'Password reset email sent',
  })
  message: string;
}
