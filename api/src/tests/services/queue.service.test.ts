/**
 * Queue Service Tests
 *
 * Tests for job queue management including:
 * - Job enqueueing
 * - Job processing
 * - Retry logic
 * - Dead letter queue
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

interface Job {
  id: string;
  type: string;
  data: any;
  attempts: number;
  maxAttempts: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  processedAt?: Date;
  error?: string;
}

class QueueService {
  private jobs: Map<string, Job> = new Map();
  private deadLetterQueue: Job[] = [];
  private readonly maxRetries = 3;

  async enqueue(type: string, data: any): Promise<Job> {
    const job: Job = {
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      attempts: 0,
      maxAttempts: this.maxRetries,
      status: 'pending',
      createdAt: new Date()
    };

    this.jobs.set(job.id, job);
    return job;
  }

  async process(jobId: string, processor: (data: any) => Promise<any>): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    job.status = 'processing';
    job.attempts++;

    try {
      await processor(job.data);
      job.status = 'completed';
      job.processedAt = new Date();
    } catch (error: any) {
      job.error = error.message;

      if (job.attempts >= job.maxAttempts) {
        job.status = 'failed';
        this.deadLetterQueue.push(job);
      } else {
        job.status = 'pending'; // Retry
      }
    }
  }

  async getJob(jobId: string): Promise<Job | undefined> {
    return this.jobs.get(jobId);
  }

  async getDeadLetterQueue(): Promise<Job[]> {
    return this.deadLetterQueue;
  }

  async retryDeadLetterJob(jobId: string): Promise<void> {
    const dlqIndex = this.deadLetterQueue.findIndex(j => j.id === jobId);
    if (dlqIndex === -1) {
      throw new Error(`Job ${jobId} not found in dead letter queue`);
    }

    const job = this.deadLetterQueue[dlqIndex];
    job.attempts = 0;
    job.status = 'pending';
    job.error = undefined;
    this.deadLetterQueue.splice(dlqIndex, 1);
    this.jobs.set(job.id, job);
  }

  async clearCompleted(): Promise<number> {
    let count = 0;
    for (const [id, job] of this.jobs.entries()) {
      if (job.status === 'completed') {
        this.jobs.delete(id);
        count++;
      }
    }
    return count;
  }
}

describe('QueueService', () => {
  let service: QueueService;

  beforeEach(() => {
    service = new QueueService();
  });

  describe('Job Enqueueing', () => {
    it('should enqueue a job', async () => {
      const job = await service.enqueue('send-email', {
        to: 'test@example.com',
        subject: 'Test'
      });

      expect(job.id).toMatch(/^job_/);
      expect(job.type).toBe('send-email');
      expect(job.status).toBe('pending');
      expect(job.attempts).toBe(0);
    });

    it('should assign unique IDs to jobs', async () => {
      const job1 = await service.enqueue('task1', {});
      const job2 = await service.enqueue('task2', {});

      expect(job1.id).not.toBe(job2.id);
    });

    it('should store job data', async () => {
      const data = { key: 'value', number: 42 };
      const job = await service.enqueue('test', data);

      expect(job.data).toEqual(data);
    });
  });

  describe('Job Processing', () => {
    it('should process job successfully', async () => {
      const processor = vi.fn().mockResolvedValue('success');
      const job = await service.enqueue('test', { data: 'test' });

      await service.process(job.id, processor);

      expect(processor).toHaveBeenCalledWith({ data: 'test' });
      const updatedJob = await service.getJob(job.id);
      expect(updatedJob?.status).toBe('completed');
      expect(updatedJob?.processedAt).toBeDefined();
    });

    it('should increment attempts on processing', async () => {
      const processor = vi.fn().mockResolvedValue('success');
      const job = await service.enqueue('test', {});

      await service.process(job.id, processor);

      const updatedJob = await service.getJob(job.id);
      expect(updatedJob?.attempts).toBe(1);
    });

    it('should throw error for non-existent job', async () => {
      const processor = vi.fn();

      await expect(
        service.process('non-existent-job', processor)
      ).rejects.toThrow('Job non-existent-job not found');
    });
  });

  describe('Retry Logic', () => {
    it('should retry failed job', async () => {
      const processor = vi.fn()
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockResolvedValueOnce('success');

      const job = await service.enqueue('test', {});

      // First attempt fails
      await service.process(job.id, processor);
      let updatedJob = await service.getJob(job.id);
      expect(updatedJob?.status).toBe('pending');
      expect(updatedJob?.attempts).toBe(1);

      // Second attempt succeeds
      await service.process(job.id, processor);
      updatedJob = await service.getJob(job.id);
      expect(updatedJob?.status).toBe('completed');
      expect(updatedJob?.attempts).toBe(2);
    });

    it('should move to dead letter queue after max retries', async () => {
      const processor = vi.fn().mockRejectedValue(new Error('Always fails'));
      const job = await service.enqueue('test', {});

      // Attempt 3 times
      await service.process(job.id, processor);
      await service.process(job.id, processor);
      await service.process(job.id, processor);

      const updatedJob = await service.getJob(job.id);
      expect(updatedJob?.status).toBe('failed');

      const dlq = await service.getDeadLetterQueue();
      expect(dlq).toHaveLength(1);
      expect(dlq[0].id).toBe(job.id);
    });

    it('should store error message on failure', async () => {
      const errorMessage = 'Processing error occurred';
      const processor = vi.fn().mockRejectedValue(new Error(errorMessage));
      const job = await service.enqueue('test', {});

      await service.process(job.id, processor);

      const updatedJob = await service.getJob(job.id);
      expect(updatedJob?.error).toBe(errorMessage);
    });
  });

  describe('Dead Letter Queue', () => {
    it('should retrieve all dead letter jobs', async () => {
      const processor = vi.fn().mockRejectedValue(new Error('Fail'));

      const job1 = await service.enqueue('test1', {});
      const job2 = await service.enqueue('test2', {});

      // Fail both jobs 3 times
      for (let i = 0; i < 3; i++) {
        await service.process(job1.id, processor);
        await service.process(job2.id, processor);
      }

      const dlq = await service.getDeadLetterQueue();
      expect(dlq).toHaveLength(2);
    });

    it('should retry job from dead letter queue', async () => {
      const processor = vi.fn().mockRejectedValue(new Error('Fail'));
      const job = await service.enqueue('test', {});

      // Fail 3 times
      for (let i = 0; i < 3; i++) {
        await service.process(job.id, processor);
      }

      let dlq = await service.getDeadLetterQueue();
      expect(dlq).toHaveLength(1);

      // Retry the job
      await service.retryDeadLetterJob(job.id);

      dlq = await service.getDeadLetterQueue();
      expect(dlq).toHaveLength(0);

      const retriedJob = await service.getJob(job.id);
      expect(retriedJob?.status).toBe('pending');
      expect(retriedJob?.attempts).toBe(0);
      expect(retriedJob?.error).toBeUndefined();
    });
  });

  describe('Queue Management', () => {
    it('should clear completed jobs', async () => {
      const processor = vi.fn().mockResolvedValue('success');

      await service.enqueue('test1', {});
      await service.enqueue('test2', {});
      const pending = await service.enqueue('test3', {});

      const jobs = [
        await service.getJob((await service.enqueue('test1', {})).id),
        await service.getJob((await service.enqueue('test2', {})).id)
      ];

      for (const job of jobs) {
        if (job) await service.process(job.id, processor);
      }

      const cleared = await service.clearCompleted();
      expect(cleared).toBeGreaterThan(0);
    });
  });
});
