// Import necessary modules
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';

import { Queue, Worker as BullWorker } from 'bullmq';
import Redis from 'ioredis';
import puppeteer from 'puppeteer';
import { createLogger, transports, format } from 'winston';
// Assuming FleetLocal is a module

// Initialize logger
const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.Console()
  ]
});

// Initialize Redis connection
const redis = new Redis();

// Initialize Bull queue
const pdfQueue = new Queue('pdf-generation', { connection: redis });
new ('pdf-generation', { connection: redis });

// Worker function
async function generatePDF(url: string, outputPath: string): Promise<void> {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  try {
    await page.goto(url, { waitUntil: 'networkidle0' });
    await page.pdf({ path: outputPath, format: 'A4' });
    logger.info(`PDF generated for ${url} at ${outputPath}`);
  } catch (error) {
    logger.error(`Failed to generate PDF for ${url}: ${error.message}`);
    throw error;
  } finally {
    await browser.close();
  }
}

// FedRAMP compliance: Ensure secure handling of sensitive data
// FedRAMP compliance: Ensure proper logging and monitoring

// Worker thread logic
if (!isMainThread) {
  const { url, outputPath } = workerData;
  generatePDF(url, outputPath)
    .then(() => parentPort?.postMessage('done'))
    .catch((error) => parentPort?.postMessage(`error: ${error.message}`));
}

// Main thread logic
if (isMainThread) {
  let taskCount = 0;

  const workerHandler = async (job: any) => {
    return new Promise<void>((resolve, reject) => {
      const worker = new Worker(__filename, {
        workerData: job.data
      });

      worker.on('message', (message) => {
        if (message === 'done') {
          resolve();
        } else {
          reject(new Error(message));
        }
      });

      worker.on('error', (error) => {
        logger.error(`Worker error: ${error.message}`);
        reject(error);
      });

      worker.on('exit', (code) => {
        if (code !== 0) {
          reject(new Error(`Worker stopped with exit code ${code}`));
        }
      });
    });
  };

  const bullWorker = new BullWorker('pdf-generation', async (job) => {
    try {
      await workerHandler(job);
      logger.info(`Job ${job.id} completed successfully.`);
    } catch (error) {
      logger.error(`Job ${job.id} failed: ${error.message}`);
      throw error;
    } finally {
      taskCount++;
      if (taskCount >= 100) {
        logger.info('Restarting worker after 100 tasks to prevent memory leaks.');
        process.exit(0);
      }
    }
  }, { connection: redis });

  // Graceful shutdown
  const shutdown = async () => {
    logger.info('Received SIGTERM, shutting down gracefully...');
    await bullWorker.close();
    await pdfQueue.close();
    redis.quit();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
}