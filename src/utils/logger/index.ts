import logger from '@/utils/logger';
export const logger = {
  info: (...args: unknown[]) => logger.info(...args),
  warn: (...args: unknown[]) => logger.warn(...args),
  error: (...args: unknown[]) => logger.error(...args),
  debug: (...args: unknown[]) => logger.debug(...args),
  logError: (...args: unknown[]) => logger.error(...args),
  logAudit: (...args: unknown[]) => logger.info('[AUDIT]', ...args),
  logWarning: (...args: unknown[]) => logger.warn(...args),
  logInfo: (...args: unknown[]) => logger.info(...args),
  logDebug: (...args: unknown[]) => logger.debug(...args),
}

export default logger
