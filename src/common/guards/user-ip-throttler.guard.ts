import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class UserIpThrottlerGuard extends ThrottlerGuard {
  protected getTracker(req: Record<string, any>): Promise<string> {
    // Use userId if authenticated, fallback to IP
    return Promise.resolve(req.user ? `user-${String(req.user.userId)}` : String(req.ip));
  }
}
