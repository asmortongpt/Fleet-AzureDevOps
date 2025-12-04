import { Queue } from 'bull';

// Create queue instance
export const emailQueue = new Queue('email', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
});

export const reportQueue = new Queue('report', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
});

// Export a mock queueService for compatibility
export const queueService = {
  emailQueue,
  reportQueue,
};
