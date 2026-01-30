import logger from '@/utils/logger';
export class Logger {
  info(...args: unknown[]) { logger.info(...args) }
  warn(...args: unknown[]) { logger.warn(...args) }
  error(...args: unknown[]) { logger.error(...args) }
  debug(...args: unknown[]) { logger.debug(...args) }
}

export default new Logger()
