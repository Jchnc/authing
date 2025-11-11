import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class RefreshDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'User ID (UUID format)',
  })
  @IsUUID()
  @IsNotEmpty()
  userId: string;
}
