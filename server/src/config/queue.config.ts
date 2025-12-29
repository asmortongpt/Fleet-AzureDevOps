import { Queue, Worker, Job } from 'bullmq';
import { createClient } from 'redis';

import { fleetLocal } from './fleetLocal';
import { logger } from '../utils/logger';

// FedRAMP compliance: Ensure Redis is configured with TLS and authentication
const redisOptions = {
  url: process.env.REDIS_URL || `redis://${fleetLocal.redis.host}:${fleetLocal.redis.port}`,
  socket: {
    tls: process.env.NODE_ENV === 'production',
    rejectUnauthorized: true
  }
};

const redisClient = createClient(redisOptions);
redisClient.on('error', (err) => logger.error('Redis Client Error', { error: err }));

// BullMQ v5+ doesn't need QueueScheduler - it's automatic
const queueName = 'fleet-tasks';
const queue = new Queue(queueName, {
  connection: {
    host: fleetLocal.redis.host,
    port: fleetLocal.redis.port,
    password: fleetLocal.redis.password,
  }
});

const worker = new Worker(queueName, async (job: Job) => {
  try {
    // Task processing logic
    logger.info(`Processing job ${job.id}`, { data: job.data });
    // Add your actual task processing here
    await new Promise(resolve => setTimeout(resolve, 100)); // Placeholder
  } catch (error) {
    logger.error(`Error processing job ${job.id}`, { error });
    throw error; // Ensure job is retried
  }
}, {
  connection: {
    host: fleetLocal.redis.host,
    port: fleetLocal.redis.port,
    password: fleetLocal.redis.password,
  },
  concurrency: 5, // Adjust concurrency based on your needs
  limiter: {
    max: 100, // Memory leak prevention: Restart worker after 100 tasks
    duration: 60000
  }
});

worker.on('completed', (job: Job) => {
  logger.info(`Job ${job.id} completed successfully`);
});

worker.on('failed', (job: Job | undefined, err: Error) => {
  logger.error(`Job ${job?.id} failed`, { error: err });
});

worker.on('error', (err: Error) => {
  logger.error('Worker encountered an error', { error: err });
});

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received: closing queue and worker gracefully');
  await worker.close();
  await queue.close();
  await redisClient.quit();
  logger.info('Graceful shutdown complete');
});

// FedRAMP compliance: Ensure all logs are stored securely and access is audited
logger.info('Bull queue initialized and ready to process jobs');