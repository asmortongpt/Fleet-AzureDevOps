import cron, { ScheduledTask } from 'node-cron';
import { Logger } from 'winston';

export class DriverSafetyScoreAggregationJob {
  private job: ScheduledTask | null = null;

  constructor(
    private readonly scoreService: any,
    private readonly repository: any,
    private readonly logger: Logger
  ) {}

  start(): void {
    if (this.job) {
      this.logger.warn('Safety score job already running');
      return;
    }

    // Run daily at 2 AM
    this.job = cron.schedule('0 2 * * *', async () => {
      try {
        this.logger.info('Starting daily safety score aggregation');
        await this.aggregateDailyScores();
        this.logger.info('Safety score aggregation completed');
      } catch (error) {
        this.logger.error('Safety score aggregation error:', error);
      }
    });

    this.logger.info('Safety score aggregation job started');
  }

  stop(): void {
    if (this.job) {
      this.job.stop();
      this.job = null;
      this.logger.info('Safety score job stopped');
    }
  }

  private async aggregateDailyScores(): Promise<void> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const endOfYesterday = new Date(yesterday);
    endOfYesterday.setHours(23, 59, 59, 999);

    const drivers = await this.repository.getActiveDrivers();

    for (const driver of drivers) {
      try {
        await this.scoreService.computeScore(driver.id, yesterday, endOfYesterday);
      } catch (error) {
        this.logger.error(`Error computing score for driver ${driver.id}:`, error);
      }
    }
  }
}
