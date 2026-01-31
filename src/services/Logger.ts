import logger from '@/utils/logger';

type LogContext = string | { userId?: string; sessionId?: string; component?: string; action?: string; [key: string]: any };

export class Logger {
  info(message: string, context?: LogContext): void {
    logger.info(message, context);
  }

  warn(message: string, context?: LogContext): void {
    logger.warn(message, context);
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    logger.error(message, error, context);
  }

  debug(message: string, context?: LogContext): void {
    logger.debug(message, context);
  }
}

export default new Logger();
