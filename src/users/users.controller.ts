import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  HttpCode,
  HttpStatus,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { Role } from 'src/generated/prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { OwnerOrAdminGuard } from 'src/auth/guards/owner-or-admin.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@ApiTags('users')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Create a new user',
    description: 'Admin-only: Creates a new user account.',
  })
  @ApiCreatedResponse({
    description: 'User created successfully',
    type: UserResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Get all users',
    description:
      'Admin-only: Retrieves paginated list of users with optional search and filtering.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 0,
    description: 'Page number (0-indexed)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 10,
    description: 'Number of items per page (1-100)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    example: 'john',
    description: 'Search by email, first name, or last name',
  })
  @ApiQuery({
    name: 'orderBy',
    required: false,
    enum: ['asc', 'desc'],
    example: 'desc',
    description: 'Sort order by creation date',
  })
  @ApiQuery({
    name: 'role',
    required: false,
    enum: Role,
    example: 'USER',
    description: 'Filter by user role',
  })
  @ApiOkResponse({
    description: 'List of users with pagination metadata',
    schema: {
      example: {
        data: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            email: 'john.doe@example.com',
            firstName: 'John',
            lastName: 'Doe',
            role: 'USER',
            isActive: true,
            verified: true,
            createdAt: '2024-01-15T10:30:00.000Z',
            updatedAt: '2024-10-05T14:45:00.000Z',
            lastLoginAt: '2024-11-01T09:15:00.000Z',
          },
        ],
        pagination: {
          page: 0,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid query parameters' })
  async findAll(
    @Query('page') page = '0',
    @Query('limit') limit = '10',
    @Query('search') search = '',
    @Query('orderBy') orderBy: 'asc' | 'desc' = 'desc',
    @Query('role') role?: Role,
  ): Promise<{ data: UserResponseDto[]; pagination: any }> {
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
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Returns the authenticated user profile.',
  })
  @ApiOkResponse({
    description: 'Current user profile',
    type: UserResponseDto,
  })
  async getCurrentUser(@CurrentUser() user: { userId: string }): Promise<UserResponseDto> {
    return this.usersService.findOne(user.userId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'View any user profile. Requires authentication.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'User UUID',
  })
  @ApiOkResponse({
    description: 'User found',
    type: UserResponseDto,
  })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiBadRequestResponse({ description: 'Invalid UUID format' })
  async findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<UserResponseDto> {
    return this.usersService.findOne(id);
  }

  @Patch('me')
  @ApiOperation({
    summary: 'Update current user profile',
    description: 'Updates the authenticated user profile.',
  })
  @ApiOkResponse({
    description: 'Profile updated successfully',
    type: UserResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  async updateCurrentUser(
    @CurrentUser() user: { userId: string },
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.update(user.userId, updateUserDto);
  }

  @Patch(':id')
  @UseGuards(OwnerOrAdminGuard)
  @ApiOperation({
    summary: 'Update user',
    description: 'Own/Admin: Update own profile or admin updating any user.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'User UUID',
  })
  @ApiOkResponse({
    description: 'User updated successfully',
    type: UserResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid input data or UUID format' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiForbiddenResponse({ description: 'Can only update own profile unless admin' })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete own account',
    description: 'Permanently deletes the authenticated user account.',
  })
  @ApiNoContentResponse({ description: 'Account deleted successfully' })
  async deleteCurrentUser(@CurrentUser() user: { userId: string }): Promise<void> {
    await this.usersService.delete(user.userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Delete user',
    description: 'Admin-only: Permanently deletes any user account.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'User UUID',
  })
  @ApiNoContentResponse({ description: 'User deleted successfully' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiBadRequestResponse({ description: 'Invalid UUID format' })
  async delete(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string): Promise<void> {
    await this.usersService.delete(id);
  }
}
