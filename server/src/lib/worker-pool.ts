import { exec } from 'child_process';
import { promisify } from 'util';

import { Queue, Worker, Job } from 'bullmq';
import { FleetLocal } from 'fleet-local'; // Assuming this is the existing codebase
import Redis from 'ioredis';
import { createLogger, transports, format } from 'winston';

const execAsync = promisify(exec);

// FedRAMP Compliance: Ensure Redis is configured with TLS and authentication
const redisClient = new Redis({
  host: 'localhost',
  port: 6379,
  password: 'your-secure-password',
  tls: {} // Ensure TLS is configured
});

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'worker-pool.log' })
  ]
});

interface TaskData {
  taskId: string;
  payload: any;
}

const taskQueue = new Queue<TaskData>('taskQueue', {
  connection: redisClient
});

class WorkerPoolManager {
  private workers: Worker<TaskData>[] = [];
  private taskCount: Map<string, number> = new Map();

  constructor(private maxTasksPerWorker: number = 100) {
    this.initializeWorkers();
    this.setupGracefulShutdown();
  }

  private initializeWorkers() {
    for (let i = 0; i < 4; i++) {
      this.createWorker();
    }
  }

  private createWorker() {
    const worker = new Worker<TaskData>('taskQueue', async (job: Job<TaskData>) => {
      try {
        await this.processTask(job);
      } catch (error) {
        logger.error(`Error processing task ${job.id}: ${error.message}`);
        throw error;
      }
    }, {
      connection: redisClient
    });

    worker.on('completed', (job: Job<TaskData>) => {
      logger.info(`Task ${job.id} completed`);
      this.incrementTaskCount(worker.id);
    });

    worker.on('failed', (job: Job<TaskData>, err: Error) => {
      logger.error(`Task ${job.id} failed: ${err.message}`);
    });

    this.workers.push(worker);
    this.taskCount.set(worker.id, 0);
  }

  private async processTask(job: Job<TaskData>) {
    const fleetLocal = new FleetLocal();
    await fleetLocal.execute(job.data.payload);
  }

  private incrementTaskCount(workerId: string) {
    const count = (this.taskCount.get(workerId) || 0) + 1;
    if (count >= this.maxTasksPerWorker) {
      this.restartWorker(workerId);
    } else {
      this.taskCount.set(workerId, count);
    }
  }

  private async restartWorker(workerId: string) {
    const workerIndex = this.workers.findIndex(w => w.id === workerId);
    if (workerIndex !== -1) {
      const worker = this.workers[workerIndex];
      await worker.close();
      this.workers.splice(workerIndex, 1);
      this.createWorker();
      logger.info(`Worker ${workerId} restarted after reaching task limit`);
    }
  }

  private setupGracefulShutdown() {
    process.on('SIGTERM', async () => {
      logger.info('Received SIGTERM, shutting down gracefully');
      await Promise.all(this.workers.map(worker => worker.close()));
      await redisClient.quit();
      process.exit(0);
    });
  }
}

new WorkerPoolManager();