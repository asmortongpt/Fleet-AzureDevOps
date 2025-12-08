// Import necessary modules
import { exit } from 'process';

import { Worker, Queue } from 'bull';
import { Workbook } from 'exceljs';
import { FleetLocal } from 'fleet-local'; // Assuming FleetLocal is an existing module
import Redis from 'ioredis';
import { createLogger, transports, format } from 'winston';


// Initialize Redis client
const redisClient = new Redis();

// Initialize logger
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

// Initialize Bull queue
const excelQueue = new Queue('excel-processing', { redis: redisClient });

// Define the worker
const excelWorker = new Worker('excel-processing', async job => {
  try {
    logger.info(`Processing job ${job.id}`);
    
    // Load workbook
    const workbook = new Workbook();
    await workbook.xlsx.readFile(job.data.filePath);

    // Process workbook
    // ... (your processing logic here)

    // Integrate with Fleet Local
    const fleetLocal = new FleetLocal();
    await fleetLocal.processWorkbook(workbook);

    logger.info(`Completed job ${job.id}`);
  } catch (error) {
    logger.error(`Error processing job ${job.id}: ${error.message}`);
    throw error;
  }
}, {
  connection: redisClient,
  concurrency: 1,
  limiter: {
    max: 100,
    duration: 60000
  }
});

// Graceful shutdown
const shutdown = async () => {
  logger.info('Shutting down gracefully...');
  await excelWorker.close();
  await redisClient.quit();
  exit(0);
};

process.on('SIGTERM', shutdown);

// Memory leak prevention: Restart worker after processing 100 tasks
let taskCount = 0;
excelWorker.on('completed', async () => {
  taskCount++;
  if (taskCount >= 100) {
    logger.info('Restarting worker to prevent memory leaks...');
    await shutdown();
  }
});

// FedRAMP Compliance Notes:
// - Ensure all data is encrypted in transit and at rest.
// - Implement access controls and audit logging for all operations.
// - Regularly update and patch dependencies to mitigate vulnerabilities.