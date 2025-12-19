import Redis from 'ioredis';
import { logger } from '../utils/logger';

const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'fleet-redis-prod',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD,
  enableAutoPipelining: true,
  maxRetriesPerRequest: 3,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    logger.warn(`Redis retry attempt ${times}, waiting ${delay}ms`);
    return delay;
  },
  reconnectOnError: (err) => {
    logger.error('Redis reconnect on error:', err);
    return true;
  }
});

redisClient.on('connect', () => {
  logger.info('Redis client connected');
});

redisClient.on('error', (err) => {
  logger.error('Redis Client Error:', err);
});

redisClient.on('ready', () => {
  logger.info('Redis client ready');
});

export default redisClient;
