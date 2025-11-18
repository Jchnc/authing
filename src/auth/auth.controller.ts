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
import { ApiTags } from '@nestjs/swagger';
import { Throttle, seconds } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { UserIpThrottlerGuard } from 'src/common/guards/user-ip-throttler.guard';
import {
  SwaggerForgotPassword,
  SwaggerLogin,
  SwaggerLogout,
  SwaggerMe,
  SwaggerRefresh,
  SwaggerRegister,
  SwaggerResetPassword,
  SwaggerSendVerificationEmail,
  SwaggerVerifyEmail,
} from 'src/docs/auth.docs';
import { TwoFAGuard } from 'src/twofa/guards/twofa.guard';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SendVerificationEmailDto } from './dto/send-verification-email.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

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
  @SwaggerRegister()
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
  @SwaggerLogin()
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
  @SwaggerRefresh()
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
  @SwaggerLogout()
  async logout(@CurrentUser() user: { userId: string }) {
    if (!user.userId) {
      throw new UnauthorizedException();
    }
    await this.auth.logout(user.userId);
    return { success: true };
  }

  @Get('me')
  @UseGuards(TwoFAGuard)
  @SwaggerMe()
  me(@CurrentUser() user: { sub: string }) {
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
  @SwaggerSendVerificationEmail()
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
  @SwaggerForgotPassword()
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.auth.sendResetPasswordEmail(dto.email);
    return { success: true, message: 'Password reset email sent' };
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @SwaggerVerifyEmail()
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return await this.auth.verifyEmail(dto.token);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @SwaggerResetPassword()
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return await this.auth.resetPassword(dto.token, dto.newPassword);
  }
}
