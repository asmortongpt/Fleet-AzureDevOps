import path from 'path';
import { Worker } from 'worker_threads';

import Bull from 'bull';

interface ReportData {
  type: 'PDF' | 'Excel' | 'CSV';
  content: any;
}

const reportQueue = new Bull<ReportData>('report-generation', {
  redis: { host: 'localhost', port: 6379 }
});

reportQueue.process(async (job) => {
  return new Promise((resolve, reject) => {
    const worker = new Worker(path.resolve(__dirname, './report-worker.js'), {
      workerData: job.data
    });

    worker.on('message', (result) => {
      job.progress(100);
      resolve(result);
    });

    worker.on('error', (error) => {
      console.error('Worker error:', error);
      reject(error);
    });

    worker.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`));
      }
    });

    job.progress(50);
  });
});

export async function generateReport(data: ReportData): Promise<string> {
  const job = await reportQueue.add(data, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  });

  return job.id;
}