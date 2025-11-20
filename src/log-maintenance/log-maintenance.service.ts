import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ActivityLogService } from 'src/auth/activity-log.service';

@Injectable()
export class LogMaintenanceService {
  private readonly logger = new Logger(LogMaintenanceService.name);
  constructor(private readonly activityLogService: ActivityLogService) {}

  // Run every day at 3am
  @Cron('0 3 * * *')
  async logMaintenance() {
    const daysToKeep = 30;
    this.logger.log(`Purging old logs older than ${daysToKeep} days`);
    const result = await this.activityLogService.purgeOlderThan(daysToKeep);
    this.logger.log(`Purged ${result.count} logs`);
  }
}
