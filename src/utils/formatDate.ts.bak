import { createLogger } from '@/utils/logger';

const logger = createLogger();

export function formatDate(date: Date): string {
  try {
    return date.toISOString().split('T')[0];
  } catch (error: unknown) {
    logger.error('Error formatting date:', error);
    return 'Invalid Date';
  }
}