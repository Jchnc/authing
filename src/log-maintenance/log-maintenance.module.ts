import { Module } from '@nestjs/common';
import { LogMaintenanceService } from './log-maintenance.service';
import { ActivityLogService } from '../auth/activity-log.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [LogMaintenanceService, ActivityLogService, PrismaService],
})
export class LogMaintenanceModule {}
