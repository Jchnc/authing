import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordResponseDto {
  @ApiProperty({
    description: 'Success',
    example: true,
  })
  success: boolean;
  @ApiProperty({
    description: 'Message',
    example: 'Password reset successfully',
  })
  message: string;
}
