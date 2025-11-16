import { Module } from '@nestjs/common';
import { TwoFAController } from './twofa.controller';
import { TwoFAService } from './twofa.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [TwoFAController],
  providers: [TwoFAService, PrismaService],
  exports: [TwoFAService],
})
export class TwoFAModule {}
