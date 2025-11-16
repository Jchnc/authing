import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';
import { TwoFAService } from '../twofa.service';

@Injectable()
export class TwoFAGuard implements CanActivate {
  constructor(
    private prisma: PrismaService,
    private twofa: TwoFAService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const req = context
      .switchToHttp()
      .getRequest<
        Request & { user: { userId: string }; session?: { twoFactorVerified: boolean } }
      >();

    const userId = req.user.userId;

    // *** 0. Allowlist: routes required to complete 2FA ***
    const path = req.path;
    const isAllowedEndpoint =
      path.startsWith('/2fa/send-code')
      || path.startsWith('/2fa/verify-code')
      || path.startsWith('/auth/logout');

    if (isAllowedEndpoint) return true;

    // 1. Check if user even enabled 2FA
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    // If user does NOT have 2FA enabled → allow access normally
    if (!user?.twoFactorEnabled) return true;

    // 2. Check trusted device cookie
    const trustedToken = req.cookies?.trustedDevice as string;
    if (trustedToken) {
      const ok = await this.twofa.validateTrustedDevice(
        userId,
        trustedToken,
        req.headers['user-agent'] as string,
      );
      if (ok) return true;
    }

    // 3. Check session flag (optional fallback)
    if (req.session?.twoFactorVerified) return true;

    // 4. Not trusted → block everything
    throw new ForbiddenException('2FA required');
  }
}
