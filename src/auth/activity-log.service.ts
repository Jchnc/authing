import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type ActivityAction = 'login' | 'logout';

@Injectable()
export class ActivityLogService {
  constructor(private readonly prisma: PrismaService) {}

  async logActivity(userId: string, action: ActivityAction, ip?: string, userAgent?: string) {
    return await this.prisma.userActivityLog.create({
      data: {
        userId,
        action,
        ip,
        userAgent,
      },
    });
  }
  async purgeOlderThan(days: number) {
    const threshold = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return await this.prisma.userActivityLog.deleteMany({
      where: {
        createdAt: {
          lt: threshold,
        },
      },
    });
  }
}
