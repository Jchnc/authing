import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  getApiInfo() {
    return { message: 'OK' };
  }

  async getHealth() {
    const isDevelopment = this.config.get<string>('NODE_ENV') === 'development';
    const startTime = Date.now();
    let dbStatus = 'healthy';
    let dbResponseTime = 0;

    try {
      const dbStart = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      dbResponseTime = Date.now() - dbStart;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      dbStatus = 'unhealthy';
    }

    const baseHealth = {
      status: dbStatus === 'healthy' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
    };

    if (isDevelopment) {
      return {
        ...baseHealth,
        uptime: process.uptime(),
        environment: this.config.get<string>('NODE_ENV', 'development'),
        services: {
          database: {
            status: dbStatus,
            responseTime: `${dbResponseTime}ms`,
          },
        },
        responseTime: `${Date.now() - startTime}ms`,
      };
    }

    return baseHealth;
  }
}
