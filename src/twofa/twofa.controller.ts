import { Body, Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { TwoFAService } from './twofa.service';
import { UserIpThrottlerGuard } from 'src/common/guards/user-ip-throttler.guard';
import { VerifyCodeDto } from './guards/dto/verify-code.dto';

@ApiTags('2FA')
@UseGuards(JwtAuthGuard, UserIpThrottlerGuard)
@ApiBearerAuth('JWT-auth')
@Controller('2fa')
export class TwoFAController {
  constructor(private twofa: TwoFAService) {}

  @UseGuards(JwtAuthGuard)
  @Post('send-code')
  @ApiOperation({ summary: '(sends email) Send 2FA verification code' })
  @ApiResponse({ status: 200, description: 'Verification code sent successfully to user email' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async send(@CurrentUser() user: { userId: string; email: string }) {
    await this.twofa.sendCode(user.userId, user.email);
    return { sent: true };
  }

  @UseGuards(JwtAuthGuard)
  @Post('verify-code')
  @ApiOperation({ summary: 'Verify 2FA code and optionally trust device' })
  @ApiResponse({ status: 200, description: 'Code verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired code' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async verify(
    @CurrentUser() user: { userId: string },
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() body: VerifyCodeDto,
  ) {
    await this.twofa.verifyCode(user.userId, body.code);

    if (body.trustDevice) {
      const token = await this.twofa.createTrustedDevice(
        user.userId,
        req.headers['user-agent'] as string,
        30,
      );

      res.cookie('trustedDevice', token, {
        httpOnly: true,
        secure: true,
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });
    }

    return { verified: true };
  }
}
