# Authing API

Authentication and user management API built with NestJS, Prisma, and JWT.

## Features

- JWT authentication with access and refresh tokens
  - Refresh tokens are stored in httpOnly cookies
  - Access tokens are returned in the response body
  - Refresh tokens are automatically rotated
  - Refresh tokens can be used to generate new access tokens
  - Refresh tokens are stored in the database
- Role-based access control (USER, ADMIN, MANAGER, GUEST)
- User registration (first user becomes ADMIN)
- Password hashing with bcrypt
- Swagger API documentation (development only)


## Tech Stack

- NestJS 11
- MySQL with Prisma ORM
- JWT authentication
- class-validator & class-transformer
- Swagger/OpenAPI

## Prerequisites

- Node.js 18+
- MySQL 8+

# Setup and Installation

## Step 1: Clone the repository
```bash
git clone https://github.com/Jchnc/authing.git
```
## Step 2: Install dependencies

```bash
npm install
```

## Step 3: Configure the environment

Create a `.env` file based on the `.env.example` file.
> **Tip:** You can generate random secrets with `openssl rand -base64 64`

## Step 4: Generate Prisma client and migrate database

```bash
npx prisma generate
npx prisma migrate dev
```

## Step 5: Start the application

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

## API Documentation

Swagger UI available at `http://localhost:3005/api/docs` (development only)

## Custom Decorators

The API provides custom decorators for authentication and authorization:

- `@Public()` - Mark endpoints as publicly accessible (bypass JWT authentication)
- `@Roles(Role.ADMIN, Role.MANAGER)` - Restrict endpoints to specific roles
- `@CurrentUser()` - Inject authenticated user into controller method parameters

Example usage:

```typescript
@Public()
@Post('login')
async login(@Body() loginDto: LoginDto) {
  // Public endpoint - no authentication required
}

@Roles(Role.ADMIN)
@Get('users')
async getAllUsers() {
  // Only accessible by ADMIN role
}

@Get('me')
async getProfile(@CurrentUser() user: User) {
  // Access authenticated user directly
  return user;
}
```

## Guards

The API uses guards to protect routes and enforce authorization rules:

- `JwtAuthGuard` - Global guard that validates JWT tokens on all routes (respects `@Public()` decorator)
- `RolesGuard` - Enforces role-based access control when `@Roles()` decorator is used
- `OwnerOrAdminGuard` - Allows access if user is the resource owner OR has ADMIN role

Example usage:

```typescript
@UseGuards(OwnerOrAdminGuard)
@Patch(':id')
async updateUser(@Param('id') id: string, @Body() updateDto: UpdateUserDto) {
  // Only the user themselves or an ADMIN can update
}
```

> **Tip:** You can read more about these guards and decorators here: [src/auth/README.md](src/auth/README.md)

## Project Structure

```
src/
├── auth/                      # Authentication module
│   ├── decorators/            # @Public(), @Roles(), @CurrentUser()
│   ├── guards/                # JWT, Roles, OwnerOrAdmin guards
│   ├── dto/                   # Auth DTOs
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── jwt.strategy.ts
├── users/                     # User management module
│   ├── dto/                   # User DTOs
│   ├── users.controller.ts
│   └── users.service.ts
├── config/                    # App configuration
│   ├── app.config.ts
│   ├── app-setup.config.ts
│   └── swagger.config.ts
├── prisma/                    # Database module
│   ├── prisma.service.ts
│   └── prisma.module.ts
├── common/                    # Shared utilities
│   ├── filters/               # Exception filters
│   └── dto/                   # Common DTOs
├── middleware/                # Request logging
├── utils/                     # Utility functions
├── app.module.ts
├── app.controller.ts
├── app.service.ts
└── main.ts

prisma/
├── schema.prisma              # Database schema
└── migrations/                # Database migrations
```

## Development

```bash
# Watch mode
npm run start:dev

# Lint
npm run lint

# Format
npm run format

# Generate Prisma client
npx prisma generate
```

## Planned Features

- [x] Email Verification — Send confirmation link
- [ ] Rate Limiting — Protect endpoints against spamming
- [ ] Activity Logging — Track login/logout timestamps + IP
- [x] Password Reset — Token-based reset via email
- [ ] Config Manager — Centralize app settings in DB/config service
- [ ] Session Management — List & store active refresh tokens per user
- [ ] Account Lockout — Block user after X amount of failed login attempts
- [ ] Audit Logs — Track role changes, resets, deletions
