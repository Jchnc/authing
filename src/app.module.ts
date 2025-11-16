import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, seconds } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserIpThrottlerGuard } from './common/guards/user-ip-throttler.guard';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { TwoFAModule } from './twofa/twofa.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot({
      errorMessage: (context, throttlerLimitDetail) => {
        const minutes = Math.ceil(throttlerLimitDetail.timeToBlockExpire / 60);
        return `Too many requests. Please try again in ${minutes} minute(s).`;
      },
      throttlers: [
        // Short window — critical endpoints (auth, verification)
        {
          name: 'short',
          ttl: seconds(5), // 5 seconds window
          limit: 10, // allow 10 requests in 5s
          blockDuration: seconds(60), // block for 1 minute if exceeded
        },
        // Medium window — standard API requests
        {
          name: 'medium',
          ttl: seconds(60), // 1 minute window
          limit: 60, // allow 60 requests per minute
          blockDuration: seconds(300), // block 5 minutes if exceeded
        },
        // Long window — heavy or background operations
        {
          name: 'long',
          ttl: seconds(900), // 15 minutes window
          limit: 300, // 300 requests per 15 min
          blockDuration: seconds(1800), // block 30 minutes if exceeded
        },
      ],
    }),
    PrismaModule,
    UsersModule,
    AuthModule,
    TwoFAModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: UserIpThrottlerGuard,
    },
  ],
})
export class AppModule {}
