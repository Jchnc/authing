# Authentication & Authorization Guards

## Overview

This project uses NestJS guards and decorators to implement a flexible access control system with three levels: Public, Authenticated, and Role-based access.

## Guards

### 1. JwtAuthGuard

Validates JWT tokens from the Authorization header. Automatically applied globally but respects `@Public()` decorator.

### 2. RolesGuard

Checks if the authenticated user has the required role(s) specified by `@Roles()` decorator.

### 3. OwnerOrAdminGuard

Allows access if the user is either:

- The owner of the resource (userId matches the :id param)
- An admin user

## Decorators

### @Public()

Marks an endpoint as publicly accessible, bypassing JWT authentication.

```typescript
@Public()
@Post('login')
async login(@Body() dto: LoginDto) {
  // Anyone can access this
}
```

### @Roles(...roles)

Restricts access to users with specific roles.

```typescript
@Roles(Role.ADMIN)
@Get('users')
async getAllUsers() {
  // Only admins can access this
}
```

### @CurrentUser()

Extracts the authenticated user from the request.

```typescript
@Get('me')
async getProfile(@CurrentUser() user: { userId: string; role: Role }) {
  return this.usersService.findOne(user.userId);
}
```

## Usage Examples

### Public Endpoint

```typescript
@Public()
@Post('register')
async register(@Body() dto: RegisterDto) {
  return this.authService.register(dto);
}
```

### Authenticated Only

```typescript
@Get('profile')
async getProfile(@CurrentUser() user: { userId: string }) {
  return this.usersService.findOne(user.userId);
}
```

### Admin Only

```typescript
@Roles(Role.ADMIN)
@Delete(':id')
async deleteUser(@Param('id') id: string) {
  return this.usersService.delete(id);
}
```

### Owner or Admin

```typescript
@UseGuards(OwnerOrAdminGuard)
@Patch(':id')
async updateUser(@Param('id') id: string, @Body() dto: UpdateDto) {
  return this.usersService.update(id, dto);
}
```

## Access Levels Summary

**Public** - No authentication

- POST /auth/register
- POST /auth/login
- POST /auth/refresh

**Authenticated** - Requires valid JWT

- GET /auth/me
- POST /auth/logout
- GET /users/me
- GET /users/:id (view any user)
- PATCH /users/me
- DELETE /users/me

**Owner or Admin** - User owns resource OR is admin

- PATCH /users/:id
- DELETE /users/:id (via OwnerOrAdminGuard)

**Admin Only** - Requires ADMIN role

- GET /users (list all)
- POST /users (create user)
- DELETE /users/:id (admin deletion)

## Controller Setup

Apply guards at controller level, then override per endpoint:

```typescript
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  @Public() // Override: make this public
  @Get('public-info')
  getPublicInfo() {}

  @Get('profile') // Uses controller guards
  getProfile() {}

  @Roles(Role.ADMIN) // Additional role check
  @Delete(':id')
  deleteUser() {}
}
```
