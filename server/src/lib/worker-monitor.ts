import * as process from 'process';

import { Worker, Queue, QueueScheduler } from 'bullmq';
import * as datadog from 'datadog-metrics';
import { createClient } from 'redis';

// Initialize Redis client
const redisClient = createClient({ url: 'redis://localhost:6379' });
redisClient.on('error', (err) => console.error('Redis Client Error', err));

// Initialize Datadog metrics
datadog.init({ apiKey: 'YOUR_DATADOG_API_KEY', host: 'YOUR_DATADOG_HOST' });

// Initialize Bull Queue
const queueName = 'taskQueue';
const queue = new Queue(queueName, { connection: redisClient });
const queueScheduler = new QueueScheduler(queueName, { connection: redisClient });

// Worker configuration
const maxTasksBeforeRestart = 100;
let taskCount = 0;

// Worker instance
const worker = new Worker(queueName, async (job) => {
  try {
    // Process job
    console.log(`Processing job ${job.id}`);
    // Simulate job processing
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Increment task count and check for memory leak prevention
    taskCount++;
    if (taskCount >= maxTasksBeforeRestart) {
      console.log('Max tasks reached, restarting worker to prevent memory leaks');
      process.exit(0);
    }
  } catch (error) {
    console.error(`Error processing job ${job.id}:`, error);
    // Log error to Datadog
    datadog.gauge('worker.job.error', 1, [`job_id:${job.id}`]);
  }
}, { connection: redisClient });

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await worker.close();
  await queueScheduler.close();
  await redisClient.quit();
  process.exit(0);
});

// Health monitoring
setInterval(() => {
  datadog.gauge('worker.task.count', taskCount);
  console.log(`Current task count: ${taskCount}`);
}, 60000);

// FedRAMP Compliance Note:
// Ensure that all data transmitted to Datadog is compliant with FedRAMP requirements.
// This includes not sending any sensitive or personally identifiable information (PII) in the logs or metrics.