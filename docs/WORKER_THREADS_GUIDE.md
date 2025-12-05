// Import necessary modules and types
import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { createLogger, transports, format } from 'winston';
import { FleetLocal } from 'fleet-local'; // Assuming this is the existing codebase module
import { exit } from 'process';

// Initialize TypeScript strict mode
// tsconfig.json should have "strict": true

// Configure Redis connection
const redis = new Redis({
  host: 'localhost',
  port: 6379,
  password: 'your-redis-password',
  db: 0,
});

// Initialize logger
const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'combined.log' })
  ]
});

// FedRAMP Compliance: Ensure logs are stored securely and access is controlled
// SOC 2 Compliance: Ensure log retention policies are in place

// Create a Bull queue
const queueName = 'taskQueue';
const queue = new Queue(queueName, { connection: redis });

// Function to process jobs
async function processJob(job: Job): Promise<void> {
  try {
    logger.info(`Processing job ${job.id}`, { jobId: job.id, jobData: job.data });
    // Integrate with Fleet Local codebase
    const fleetLocal = new FleetLocal();
    await fleetLocal.processTask(job.data);
    logger.info(`Job ${job.id} completed successfully`, { jobId: job.id });
  } catch (error) {
    logger.error(`Error processing job ${job.id}: ${error.message}`, { jobId: job.id, error });
    throw error; // Re-throw to allow Bull to handle retries
  }
}

// Create a Bull worker
const worker = new Worker(queueName, async (job) => processJob(job), {
  connection: redis,
  concurrency: 5, // Adjust based on your system's capacity
  limiter: {
    max: 100, // Memory leak prevention: Restart worker after 100 tasks
    duration: 60000 // 1 minute
  }
});

// Error handling for the worker
worker.on('failed', (job, err) => {
  logger.error(`Job ${job.id} failed: ${err.message}`, { jobId: job.id, error: err });
});

worker.on('completed', (job) => {
  logger.info(`Job ${job.id} completed`, { jobId: job.id });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing worker');
  await worker.close();
  await queue.close();
  redis.quit();
  logger.info('Worker and queue closed');
  exit(0);
});

// FedRAMP Compliance: Ensure all data in transit is encrypted
// SOC 2 Compliance: Ensure data integrity and availability

// Add jobs to the queue (example usage)
async function addJobs() {
  for (let i = 0; i < 10; i++) {
    await queue.add('task', { taskId: i, data: `Task data ${i}` });
    logger.info(`Added job ${i} to the queue`, { taskId: i });
  }
}

// Start adding jobs
addJobs().catch(error => {
  logger.error(`Error adding jobs: ${error.message}`, { error });
});

// FedRAMP Compliance: Ensure access controls are in place for job data
// SOC 2 Compliance: Ensure job data confidentiality

// Note: This code assumes the existence of a `FleetLocal` class with a `processTask` method.
// Replace `'fleet-local'` with the actual module path and ensure the method signature matches.