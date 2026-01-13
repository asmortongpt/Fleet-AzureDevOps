import cron from 'node-cron';
import { Logger } from 'winston';

export class TelematicsIngestionWorker {
  private job: cron.ScheduledTask | null = null;

  constructor(
    private readonly ingestionService: any,
    private readonly logger: Logger,
    private readonly intervalSeconds: number = 60
  ) {}

  start(): void {
    if (this.job) {
      this.logger.warn('Telematics worker already running');
      return;
    }

    const cronExpression = `*/${this.intervalSeconds} * * * * *`;

    this.job = cron.schedule(cronExpression, async () => {
      try {
        this.logger.info('Starting telematics position ingestion');
        await this.ingestionService.ingestLatestPositions();
        this.logger.info('Telematics ingestion completed');
      } catch (error) {
        this.logger.error('Telematics ingestion error:', error);
      }
    });

    this.logger.info(`Telematics worker started (interval: ${this.intervalSeconds}s)`);
  }

  stop(): void {
    if (this.job) {
      this.job.stop();
      this.job = null;
      this.logger.info('Telematics worker stopped');
    }
  }
}
