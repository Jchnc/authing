import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthMeResponseDto } from 'src/auth/dto/auth-me-response.dto';
import { ForgotPasswordResponseDto } from 'src/auth/dto/forgot-password-response.dto';
import { LoginResponseDto } from 'src/auth/dto/login-response.dto';
import { LoginDto } from 'src/auth/dto/login.dto';
import { LogoutResponseDto } from 'src/auth/dto/logout-response.dto';
import { RefreshResponseDto } from 'src/auth/dto/refresh-response.dto';
import { RegisterResponseDto } from 'src/auth/dto/register-response.dto';
import { ResetPasswordResponseDto } from 'src/auth/dto/reset-password-response.dto';
import { SendVerificationEmailResponseDto } from 'src/auth/dto/send-verification-email-response.dto';
import { VerifyEmailResponseDto } from 'src/auth/dto/verify-email-response.dto';

export function SwaggerLogin() {
  return applyDecorators(
    ApiOperation({
      summary: '[Public] Login user',
      description:
        'Authenticates user credentials and returns access token. Refresh token is set as httpOnly cookie.',
    }),
    ApiOkResponse({
      description: 'User successfully logged in',
      type: LoginResponseDto,
    }),
    ApiUnauthorizedResponse({ description: 'Invalid email or password' }),
    ApiBadRequestResponse({ description: 'Invalid input data' }),
    ApiBody({ type: LoginDto }),
  );
}
export function SwaggerLogout() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: '[Private] [Admin or Owner] Close own session (logout)',
      description:
        'Invalidates the refresh token for the authenticated user. Requires valid access token.',
    }),
    ApiOkResponse({
      description: 'User successfully logged out',
      type: LogoutResponseDto,
    }),
    ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing token' }),
  );
}
export function SwaggerRegister() {
  return applyDecorators(
    ApiOperation({
      summary: '[Public] Register a new user',
      description:
        'Creates a new user account and returns access token. Refresh token is set as httpOnly cookie.',
    }),
    ApiCreatedResponse({
      description: 'User successfully registered',
      type: RegisterResponseDto,
    }),
    ApiBadRequestResponse({ description: 'Invalid input data' }),
    ApiResponse({ status: 409, description: 'Email already exists' }),
  );
}
export function SwaggerRefresh() {
  return applyDecorators(
    ApiOperation({
      summary: '[Public] Refresh access token',
      description:
        'Generates new access and refresh tokens using the refresh token from httpOnly cookie. New refresh token is set as httpOnly cookie.',
    }),
    ApiOkResponse({
      description: 'Tokens successfully refreshed',
      type: RefreshResponseDto,
    }),
    ApiUnauthorizedResponse({ description: 'Invalid or expired refresh token' }),
    ApiBadRequestResponse({ description: 'Invalid input data' }),
  );
}
export function SwaggerMe() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: '[Private] [Admin or Owner] Get current user',
      description:
        'Returns the authenticated user information from the JWT token. Requires valid access token and 2FA verification (if enabled by user).',
    }),
    ApiOkResponse({
      description: 'Current user information',
      type: AuthMeResponseDto,
    }),
    ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing token' }),
  );
}
export function SwaggerSendVerificationEmail() {
  return applyDecorators(
    ApiOperation({
      summary: '[Public] [Sends Email] Send email verification link',
      description:
        'Sends a verification email to the user with a link to verify their email address. The email contains a link that redirects to the frontend with a JWT token that expires in 1 hour. The frontend should extract the token and call POST /auth/verify-email. This can be used for initial verification or to resend the verification email.',
    }),
    ApiOkResponse({
      description: 'Verification email sent successfully',
      type: SendVerificationEmailResponseDto,
    }),
    ApiBadRequestResponse({ description: 'Invalid input data' }),
    ApiUnauthorizedResponse({ description: 'User not found' }),
  );
}
export function SwaggerForgotPassword() {
  return applyDecorators(
    ApiOperation({
      summary: '[Public] [Sends Email] Request password reset link',
      description:
        'Sends a password reset email to the user with a link to reset their password. The email contains a link that redirects to the frontend with a JWT token that expires in 1 hour. The frontend should show a password reset form and call POST /auth/reset-password with the token and new password. The token can only be used once.',
    }),
    ApiOkResponse({
      description: 'Password reset email sent successfully',
      type: ForgotPasswordResponseDto,
    }),
    ApiBadRequestResponse({ description: 'Invalid input data or missing email' }),
    ApiUnauthorizedResponse({ description: 'Email not found' }),
  );
}
export function SwaggerVerifyEmail() {
  return applyDecorators(
    ApiOperation({
      summary: '[Public] Verify email with token (token sent via email)',
      description:
        'Verifies a user email address using the JWT token received via email. The frontend extracts the token from the email link and sends it to this endpoint. The token is validated and the user account is marked as verified. This endpoint is called by the frontend after the user clicks the verification link in their email.',
    }),
    ApiOkResponse({
      description: 'Email successfully verified',
      type: VerifyEmailResponseDto,
    }),
    ApiBadRequestResponse({ description: 'Invalid input data' }),
    ApiUnauthorizedResponse({ description: 'Invalid or expired token' }),
  );
}
export function SwaggerResetPassword() {
  return applyDecorators(
    ApiOperation({
      summary: '[Public] Reset password with token (token sent via email)',
      description:
        'Resets the user password using the JWT token received via email and the new password. The frontend extracts the token from the email link, shows a password reset form, and sends both the token and new password to this endpoint. The token is validated and can only be used once. After successful reset, all user sessions are invalidated.',
    }),
    ApiOkResponse({
      description: 'Password successfully reset',
      type: ResetPasswordResponseDto,
    }),
    ApiBadRequestResponse({ description: 'Invalid input data' }),
    ApiUnauthorizedResponse({ description: 'Invalid or expired token' }),
  );
}
