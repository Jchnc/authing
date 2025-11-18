import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import {
  SwaggerCreate,
  SwaggerDelete,
  SwaggerDeleteCurrentUser,
  SwaggerFindAll,
  SwaggerFindOne,
  SwaggerGetCurrentUser,
  SwaggerUpdate,
  SwaggerUpdateCurrentUser,
} from 'src/docs/users.docs';
import { Role } from 'src/generated/prisma/client';
import { TwoFAGuard } from 'src/twofa/guards/twofa.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersService } from './users.service';
import { PaginatedUsersResponseDto } from './dto/paginated-users-response.dto';

@ApiTags('users')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard, TwoFAGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(Role.ADMIN)
  @SwaggerCreate()
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles(Role.ADMIN)
  @SwaggerFindAll()
  async findAll(
    @Query('page') page = '0',
    @Query('limit') limit = '10',
    @Query('search') search = '',
    @Query('orderBy') orderBy: 'asc' | 'desc' = 'desc',
    @Query('role') role?: Role,
  ): Promise<PaginatedUsersResponseDto> {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    if (isNaN(pageNum) || pageNum < 0) {
      throw new BadRequestException('Page must be a non-negative number');
    }
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      throw new BadRequestException('Limit must be between 1 and 100');
    }

    return this.usersService.findAll(pageNum, limitNum, search, orderBy, role);
  }

  @Get('me')
  @SwaggerGetCurrentUser()
  async getCurrentUser(@CurrentUser() user: { userId: string }): Promise<UserResponseDto> {
    return this.usersService.findOne(user.userId);
  }

  @Get(':id')
  @SwaggerFindOne()
  async findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<UserResponseDto> {
    return this.usersService.findOne(id);
  }

  @Patch('me')
  @SwaggerUpdateCurrentUser()
  async updateCurrentUser(
    @CurrentUser() user: { userId: string },
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.update(user.userId, updateUserDto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @SwaggerUpdate()
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @SwaggerDeleteCurrentUser()
  async deleteCurrentUser(@CurrentUser() user: { userId: string }): Promise<void> {
    await this.usersService.delete(user.userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.ADMIN)
  @SwaggerDelete()
  async delete(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string): Promise<void> {
    await this.usersService.delete(id);
  }
}
