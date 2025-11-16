import { IsBoolean, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyCodeDto {
  @IsString()
  @ApiProperty({
    example: '123456',
    description: '6-digit code',
  })
  code: string;

  @IsBoolean()
  @ApiProperty({
    example: true,
    description: 'Trust device for this session',
  })
  trustDevice: boolean;
}
