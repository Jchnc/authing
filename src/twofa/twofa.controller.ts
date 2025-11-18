import { Body, Controller, Headers, Post, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { UserIpThrottlerGuard } from 'src/common/guards/user-ip-throttler.guard';
import { SwaggerSend, SwaggerVerify } from 'src/docs/twofa.docs';
import { VerifyCodeDto } from './guards/dto/verify-code.dto';
import { TwoFAService } from './twofa.service';

@ApiTags('2FA')
@UseGuards(JwtAuthGuard, UserIpThrottlerGuard)
@ApiBearerAuth('JWT-auth')
@Controller('2fa')
export class TwoFAController {
  constructor(private twofa: TwoFAService) {}

  @UseGuards(JwtAuthGuard)
  @Post('send-code')
  @SwaggerSend()
  async send(@CurrentUser() user: { userId: string; email: string }) {
    await this.twofa.sendCode(user.userId, user.email);
    return { sent: true };
  }

  @UseGuards(JwtAuthGuard)
  @Post('verify-code')
  @SwaggerVerify()
  async verify(
    @CurrentUser() user: { userId: string },
    @Headers('user-agent') userAgent: string,
    @Res({ passthrough: true }) res: Response,
    @Body() body: VerifyCodeDto,
  ) {
    await this.twofa.verifyCode(user.userId, body.code);

    if (body.trustDevice) {
      const token = await this.twofa.createTrustedDevice(user.userId, userAgent, 30);

      res.cookie('trustedDevice', token, {
        httpOnly: true,
        secure: true,
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });
    }

    return { verified: true };
  }
}
