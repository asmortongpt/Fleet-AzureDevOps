import axios from 'axios';
import { Queue, Worker, Job } from 'bullmq';
import { Logger } from 'winston';

export class WebhookDeliveryWorker {
  private queue: Queue;
  private worker: Worker;

  constructor(
    private readonly repository: any,
    private readonly logger: Logger
  ) {
    const redisConnection = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10)
    };

    this.queue = new Queue('webhook-delivery', { connection: redisConnection });

    this.worker = new Worker('webhook-delivery', async (job: Job) => {
      await this.processWebhook(job.data);
    }, {
      connection: redisConnection,
      concurrency: 10
    });

    this.logger.info('Webhook delivery worker initialized');
  }

  async processWebhook(data: { eventId: string; subscriptionId: string }): Promise<void> {
    const event = await this.repository.getEvent(data.eventId);
    const subscription = await this.repository.getSubscription(data.subscriptionId);

    if (!subscription.isActive) return;

    const signature = event.generateSignature(subscription.secret);

    try {
      await axios.post(subscription.targetUrl, event.payload, {
        headers: {
          'X-Webhook-Signature': signature,
          'X-Event-Type': event.eventType,
          'X-Event-Id': event.id,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      await this.repository.markEventDelivered(event.id, subscription.id);
      this.logger.info(`Webhook delivered: ${event.eventType} to ${subscription.targetUrl}`);
    } catch (error: any) {
      this.logger.error(`Webhook delivery failed: ${error.message}`);
      throw error;
    }
  }

  async enqueueDelivery(eventId: string, subscriptionId: string): Promise<void> {
    await this.queue.add('deliver', { eventId, subscriptionId });
  }
}
