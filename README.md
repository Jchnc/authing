# Authing API
<p align="left">
  <img src="https://img.shields.io/badge/node-%3E=18.0.0-3c873a?style=for-the-badge&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/NestJS-11-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" />
  <img src="https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white" />
  <img src="https://img.shields.io/badge/JWT-Auth-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Status-Active-success?style=for-the-badge" />
</p>
Authentication and user management backend built with **NestJS**, **Prisma**, and **JWT**.

A flexible boilerplate that covers the core authentication flows while allowing you to customize and extend it based on your project’s needs.

------------------------------------------------------------------------

## Key Features

-   **JWT Authentication**
    -   Access tokens returned in response body
    -   Refresh tokens stored in secure httpOnly cookies
    -   Refresh token rotation + invalidation
    -   Refresh tokens persisted in database
-   **RBAC (Role-based Access Control)**
    -   Roles: `ADMIN`, `MANAGER`, `USER`, `GUEST`
    -   First registered user becomes `ADMIN`
-   **User Lifecycle**
    -   Registration
    -   Email verification flow (email template included)
    -   Password reset token flow (email template included)
    -   Optional email-based OTP 2FA with trusted-device support (email template included)
-   **Security**
    -   bcrypt password hashing
    -   Strict DTO validation
    -   Session invalidation and logout mechanics
-   **Developer Features**
    -   Swagger (development only)
    -   Prisma migrations & schema
    -   Modular, extensible NestJS structure

------------------------------------------------------------------------

## Quick Start

``` bash
git clone https://github.com/Jchnc/authing.git
cd authing
npm ci
cp .env.example .env
```

Edit `.env` according to `.env.example`, then:

``` bash
npx prisma generate
npx prisma migrate dev
npm run start:dev
```
> **Important:** Make sure to replace all example values with real configuration settings.  
> Leaving defaults or placeholders may cause security issues.

------------------------------------------------------------------------

## Auth Flow Overview

1.  User logs in → access token (response), refresh token (cookie)
2.  Client uses access token until it expires
3.  Client calls `/auth/refresh` → new access + rotated refresh token
4.  Logout revokes refresh token + clears cookie
5.  Refresh token reuse detection enables session invalidation

------------------------------------------------------------------------

## Important Endpoints

-   `POST /auth/register`
-   `POST /auth/login`
-   `POST /auth/refresh`
-   `POST /auth/logout`
-   `POST /auth/forgot-password`
-   `POST /auth/reset-password`
-   `POST /auth/send-verification-email`
-   `POST /auth/verify-email`
-   `POST /2fa/send-code`
-   `POST /2fa/verify-code`

------------------------------------------------------------------------

## Decorators & Guards

### Decorators

- **`@Public()`**  
  Marks an endpoint as publicly accessible.  
  Skips authentication entirely

- **`@Roles(...roles)`**  
  Restricts access to specific user roles (e.g., `ADMIN`, `MANAGER`).  

- **`@CurrentUser()`**  
  Injects the currently authenticated user into the controller handler.  
  Provides access to `req.user`, which is populated by the JWT strategy.

---

### Guards

- **`JwtAuthGuard`**  
  Guard that validates the access token for every request (except routes using `@Public()`).  
  Attaches the decoded user payload to `req.user`.

- **`RolesGuard`**  
  Enforces role-based access control.  
  Validates that the user's role matches one of the roles declared in `@Roles()`.

- **`OwnerOrAdminGuard`**  
  Allows access only if:  
  - The authenticated user is the owner of the resource, **or**  
  - The user has the `ADMIN` role.  
  Useful for update/delete operations to prevent unauthorized modifications.

- **`TwoFAGuard`**  
  Enforces two-factor authentication for users who have 2FA enabled.  
  If the authenticated user has 2FA active but has not yet completed verification during the current session, all requests to endpoints protected by this guard will be blocked until verification is completed.
------------------------------------------------------------------------

## Planned Features (no specific order)

- [x] Email Verification — Send confirmation link
- [x] Rate Limiting — Protect endpoints against spamming
- [x] 2FA — Two-factor authentication via email (OTP)
- [x] Activity Logging — Track login/logout timestamps + IP + User Agent
  - [x] Log maintenance — Purge old logs (currently 30 days threshold)
- [x] Password Reset — Token-based reset via email
- [ ] Config Manager — Centralize app settings in DB/config service
- [ ] Session Management — List & store active refresh tokens per user
- [ ] Account Lockout — Block user after X amount of failed login attempts
- [ ] Audit Logs — Track role changes, resets, deletions

------------------------------------------------------------------------

## Contributing

Open issues and PRs are welcome.
