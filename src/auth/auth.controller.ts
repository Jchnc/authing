import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterUserDto } from './dto/register.dto';
import { SendVerificationEmailDto } from './dto/send-verification-email.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UserIpThrottlerGuard } from 'src/common/guards/user-ip-throttler.guard';
import { Throttle, seconds } from '@nestjs/throttler';
import { TwoFAGuard } from 'src/twofa/guards/twofa.guard';

@ApiTags('auth')
@UseGuards(JwtAuthGuard, UserIpThrottlerGuard)
@Controller('auth')
export class AuthController {
  private readonly nodeEnv: string;

  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {
    this.nodeEnv = this.config.get<string>('NODE_ENV', 'development');
  }

  @Public()
  @Post('register')
  @ApiOperation({
    summary: 'Register a new user',
    description:
      'Creates a new user account and returns access token. Refresh token is set as httpOnly cookie.',
  })
  @ApiCreatedResponse({
    description: 'User successfully registered',
    schema: {
      example: {
        user: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'john.doe@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'USER',
          isActive: true,
          verified: false,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          lastLoginAt: null,
        },
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async register(@Body() dto: RegisterUserDto, @Res({ passthrough: true }) res: Response) {
    const { refreshToken, ...response } = await this.auth.register(dto);
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: this.nodeEnv === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return response;
  }

  @Public()
  @Post('login')
  @ApiOperation({
    summary: 'Login user',
    description:
      'Authenticates user credentials and returns access token. Refresh token is set as httpOnly cookie.',
  })
  @ApiOkResponse({
    description: 'User successfully logged in',
    schema: {
      example: {
        user: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'john.doe@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'USER',
        },
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Invalid email or password' })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { refreshToken, ...response } = await this.auth.login(dto);
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: this.nodeEnv === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return response;
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  @ApiOperation({
    summary: 'Refresh access token',
    description:
      'Generates new access and refresh tokens using the refresh token from httpOnly cookie. New refresh token is set as httpOnly cookie.',
  })
  @ApiOkResponse({
    description: 'Tokens successfully refreshed',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired refresh token' })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async refresh(
    @Body() body: RefreshDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // ONLY get refresh token from httpOnly cookie for security
    const refreshToken = req.cookies?.refreshToken as string;
    const userId = body.userId;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found in cookie');
    }

    const { refreshToken: newRefreshToken, ...response } = await this.auth.refresh(
      userId,
      refreshToken,
    );
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: this.nodeEnv === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return response;
  }

  @Post('logout')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Logout user',
    description:
      'Invalidates the refresh token for the authenticated user. Requires valid access token.',
  })
  @ApiOkResponse({
    description: 'User successfully logged out',
    schema: {
      example: {
        success: true,
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing token' })
  async logout(@Req() req: Request & { user?: { userId: string } }) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException();
    }
    await this.auth.logout(userId);
    return { success: true };
  }

  @Get('me')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(TwoFAGuard)
  @ApiOperation({
    summary: 'Get current user',
    description:
      'Returns the authenticated user information from the JWT token. Requires valid access token and 2FA verification (if enabled by user).',
  })
  @ApiOkResponse({
    description: 'Current user information',
    schema: {
      example: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        role: 'USER',
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing token' })
  me(@Req() req: Request & { user?: { sub: string } }) {
    const user = req.user;
    return user;
  }

  @Public()
  @Throttle({
    short: {
      limit: 2,
      ttl: seconds(60),
    },
    medium: {
      limit: 3,
      ttl: seconds(600),
    },
    long: {
      limit: 6,
      ttl: seconds(3600),
    },
  })
  @Post('send-verification-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '(Sends email) Send email verification link',
    description:
      'Sends a verification email to the user with a link to verify their email address. The email contains a link that redirects to the frontend with a JWT token that expires in 1 hour. The frontend should extract the token and call POST /auth/verify-email. This can be used for initial verification or to resend the verification email.',
  })
  @ApiOkResponse({
    description: 'Verification email sent successfully',
    schema: {
      example: {
        success: true,
        message: 'Verification email sent',
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiUnauthorizedResponse({ description: 'User not found' })
  async sendVerificationEmail(@Body() dto: SendVerificationEmailDto) {
    await this.auth.sendVerificationEmail(dto.userId, dto.email, dto.firstName);
    return { success: true, message: 'Verification email sent' };
  }

  @Public()
  @Throttle({
    short: {
      limit: 2,
      ttl: seconds(60),
    },
    medium: {
      limit: 3,
      ttl: seconds(600),
    },
    long: {
      limit: 6,
      ttl: seconds(3600),
    },
  })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '(Sends email) Request password reset link',
    description:
      'Sends a password reset email to the user with a link to reset their password. The email contains a link that redirects to the frontend with a JWT token that expires in 1 hour. The frontend should show a password reset form and call POST /auth/reset-password with the token and new password. The token can only be used once.',
  })
  @ApiOkResponse({
    description: 'Password reset email sent successfully',
    schema: {
      example: {
        success: true,
        message: 'Password reset email sent',
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid input data or missing email' })
  @ApiUnauthorizedResponse({ description: 'Email not found' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.auth.sendResetPasswordEmail(dto.email);
    return { success: true, message: 'Password reset email sent' };
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify email with token',
    description:
      'Verifies a user email address using the JWT token received via email. The frontend extracts the token from the email link and sends it to this endpoint. The token is validated and the user account is marked as verified. This endpoint is called by the frontend after the user clicks the verification link in their email.',
  })
  @ApiOkResponse({
    description: 'Email successfully verified',
    schema: {
      example: {
        message: 'Email verified successfully',
        email: 'john.doe@example.com',
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired token' })
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return await this.auth.verifyEmail(dto.token);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset password with token',
    description:
      'Resets the user password using the JWT token received via email and the new password. The frontend extracts the token from the email link, shows a password reset form, and sends both the token and new password to this endpoint. The token is validated and can only be used once. After successful reset, all user sessions are invalidated.',
  })
  @ApiOkResponse({
    description: 'Password successfully reset',
    schema: {
      example: {
        success: true,
        message: 'Password reset successfully',
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired token' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return await this.auth.resetPassword(dto.token, dto.newPassword);
  }
}
