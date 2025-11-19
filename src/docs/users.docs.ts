import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { Role } from 'src/generated/prisma/client';
import { PaginatedUsersResponseDto } from 'src/users/dto/paginated-users-response.dto';
import { UserResponseDto } from 'src/users/dto/user-response.dto';

export function SwaggerCreate() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create a new user',
      description: 'Admin-only: Creates a new user account.',
    }),
    ApiCreatedResponse({
      description: 'User created successfully',
      type: UserResponseDto,
    }),
    ApiBadRequestResponse({ description: 'Invalid input data' }),
    ApiResponse({ status: 409, description: 'Email already exists' }),
  );
}
export function SwaggerFindAll() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get all users',
      description:
        'Admin-only: Retrieves paginated list of users with optional search and filtering.',
    }),
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      example: 0,
      description: 'Page number (0-indexed)',
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      example: 10,
      description: 'Number of items per page (1-100)',
    }),
    ApiQuery({
      name: 'search',
      required: false,
      type: String,
      example: 'john',
      description: 'Search by email, first name, or last name',
    }),
    ApiQuery({
      name: 'orderBy',
      required: false,
      enum: ['asc', 'desc'],
      example: 'desc',
      description: 'Sort order by creation date',
    }),
    ApiQuery({
      name: 'role',
      required: false,
      enum: Role,
      example: 'USER',
      description: 'Filter by user role',
    }),
    ApiOkResponse({
      description: 'List of users with pagination metadata',
      type: PaginatedUsersResponseDto,
    }),
    ApiBadRequestResponse({ description: 'Invalid query parameters' }),
  );
}
export function SwaggerGetCurrentUser() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get current user profile',
      description: 'Returns the authenticated user profile.',
    }),
    ApiOkResponse({
      description: 'Current user profile',
      type: UserResponseDto,
    }),
  );
}
export function SwaggerFindOne() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get user by ID',
      description: 'View any user profile. Requires authentication.',
    }),
    ApiParam({
      name: 'id',
      type: String,
      example: '550e8400-e29b-41d4-a716-446655440000',
      description: 'User UUID',
    }),
    ApiOkResponse({
      description: 'User found',
      type: UserResponseDto,
    }),
    ApiNotFoundResponse({ description: 'User not found' }),
    ApiBadRequestResponse({ description: 'Invalid UUID format' }),
  );
}
export function SwaggerUpdateCurrentUser() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update current user profile',
      description: 'Updates the authenticated user profile.',
    }),
    ApiOkResponse({
      description: 'Profile updated successfully',
      type: UserResponseDto,
    }),
    ApiBadRequestResponse({ description: 'Invalid input data' }),
  );
}
export function SwaggerUpdate() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update user',
      description: 'Update own profile or admin updating any user. Admin-only.',
    }),
    ApiParam({
      name: 'id',
      type: String,
      example: '550e8400-e29b-41d4-a716-446655440000',
      description: 'User UUID',
    }),
    ApiOkResponse({
      description: 'User updated successfully',
      type: UserResponseDto,
    }),
    ApiBadRequestResponse({ description: 'Invalid input data or UUID format' }),
    ApiNotFoundResponse({ description: 'User not found' }),
    ApiForbiddenResponse({ description: 'Can only update own profile unless admin' }),
  );
}
export function SwaggerUpdateByAdmin() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update user by admin',
      description:
        'Admin-only: Update any user including system fields like role, isActive, and verified status.',
    }),
    ApiParam({
      name: 'id',
      type: String,
      example: '550e8400-e29b-41d4-a716-446655440000',
      description: 'User UUID',
    }),
    ApiOkResponse({
      description: 'User updated successfully',
      type: UserResponseDto,
    }),
    ApiBadRequestResponse({ description: 'Invalid input data or UUID format' }),
    ApiNotFoundResponse({ description: 'User not found' }),
  );
}
export function SwaggerDeleteCurrentUser() {
  return applyDecorators(
    ApiOperation({
      summary: 'Delete own account',
      description: 'Permanently deletes the authenticated user account.',
    }),
    ApiNoContentResponse({ description: 'Account deleted successfully' }),
  );
}
export function SwaggerDelete() {
  return applyDecorators(
    ApiOperation({
      summary: 'Delete user',
      description: 'Admin-only: Permanently deletes any user account.',
    }),
    ApiParam({
      name: 'id',
      type: String,
      example: '550e8400-e29b-41d4-a716-446655440000',
      description: 'User UUID',
    }),
    ApiNoContentResponse({ description: 'User deleted successfully' }),
    ApiNotFoundResponse({ description: 'User not found' }),
    ApiBadRequestResponse({ description: 'Invalid UUID format' }),
  );
}
