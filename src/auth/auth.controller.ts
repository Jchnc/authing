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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterUserDto } from './dto/register.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RefreshDto } from './dto/refresh.dto';
import { Public } from './decorators/public.decorator';

@ApiTags('auth')
@UseGuards(JwtAuthGuard)
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
  @ApiOperation({
    summary: 'Get current user',
    description:
      'Returns the authenticated user information from the JWT token. Requires valid access token.',
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
}
