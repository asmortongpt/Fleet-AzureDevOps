// Import necessary modules
import { Worker, Queue, QueueScheduler } from 'bullmq';
import Redis from 'ioredis';
import sharp from 'sharp';
import { createLogger, transports, format } from 'winston';

// Initialize Redis connection
const redisConnection = new Redis();

// Initialize Bull queue
const imageQueue = new Queue('image-optimization', { connection: redisConnection });
const queueScheduler = new QueueScheduler('image-optimization', { connection: redisConnection });

// Logger setup
const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'worker.log' })
  ]
});

// Worker configuration
const worker = new Worker('image-optimization', async job => {
  try {
    const { imagePath, outputFormat } = job.data;
    const outputPath = `${imagePath.split('.').slice(0, -1).join('.')}.${outputFormat}`;

    await sharp(imagePath)
      .toFormat(outputFormat)
      .toFile(outputPath);

    logger.info(`Image optimized: ${outputPath}`);
  } catch (error) {
    logger.error(`Error processing job ${job.id}: ${error.message}`);
    throw error;
  }
}, {
  connection: redisConnection
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  await worker.close();
  await imageQueue.close();
  await redisConnection.quit();
  logger.info('Shutdown complete.');
  process.exit(0);
});

// Memory leak prevention: Restart worker after processing 100 tasks
let taskCount = 0;
worker.on('completed', async () => {
  taskCount++;
  if (taskCount >= 100) {
    logger.info('Restarting worker to prevent memory leaks...');
    await worker.close();
    process.exit(0);
  }
});

// Error handling
worker.on('failed', (job, err) => {
  logger.error(`Job ${job.id} failed: ${err.message}`);
});

// FedRAMP Compliance Notes:
// - Ensure Redis is configured to use TLS for data encryption in transit.
// - Ensure all logs are stored securely and access is restricted to authorized personnel.
// - Implement regular security audits and vulnerability assessments on the codebase and infrastructure.