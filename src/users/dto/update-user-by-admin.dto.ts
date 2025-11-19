import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { Role } from 'src/generated/prisma/client';
import { UpdateUserDto } from './update-user.dto';

export class UpdateUserByAdminDto extends PartialType(UpdateUserDto) {
  @ApiProperty({ enum: Role, required: false })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  verified?: boolean;
}
