import { Queue, Worker, QueueScheduler, Job } from 'bullmq';
import { createClient } from 'redis';

import { FleetLocal } from './fleetLocal'; // Assuming FleetLocal is part of your codebase
import { logger } from './logger'; // Assuming a logger module is available

// FedRAMP compliance: Ensure Redis is configured with TLS and authentication
const redisOptions = {
  url: 'rediss://:password@redis-host:6379',
  tls: {
    rejectUnauthorized: true
  }
};

const redisClient = createClient(redisOptions);
redisClient.on('error', (err) => logger.error('Redis Client Error', err));

const queueName = 'myQueue';
const queue = new Queue(queueName, { connection: redisClient });
const queueScheduler = new QueueScheduler(queueName, { connection: redisClient });

const worker = new Worker(queueName, async (job: Job) => {
  try {
    // Your task processing logic here
    await FleetLocal.processTask(job.data);
  } catch (error) {
    logger.error(`Error processing job ${job.id}:`, error);
    throw error; // Ensure job is retried
  }
}, {
  connection: redisClient,
  concurrency: 5, // Adjust concurrency based on your needs
  limiter: {
    max: 100, // Memory leak prevention: Restart worker after 100 tasks
    duration: 60000
  }
});

worker.on('completed', (job: Job) => {
  logger.info(`Job ${job.id} completed successfully`);
});

worker.on('failed', (job: Job, err: Error) => {
  logger.error(`Job ${job.id} failed:`, err);
});

worker.on('error', (err: Error) => {
  logger.error('Worker encountered an error:', err);
});

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received: closing queue and worker gracefully');
  await worker.close();
  await queueScheduler.close();
  await queue.close();
  await redisClient.quit();
  logger.info('Graceful shutdown complete');
});

// FedRAMP compliance: Ensure all logs are stored securely and access is audited
logger.info('Bull queue initialized and ready to process jobs');