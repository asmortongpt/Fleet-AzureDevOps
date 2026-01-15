export const logger = {
  info: (...args: unknown[]) => console.log(...args),
  warn: (...args: unknown[]) => console.warn(...args),
  error: (...args: unknown[]) => console.error(...args),
  debug: (...args: unknown[]) => console.debug(...args),
  logError: (...args: unknown[]) => console.error(...args),
  logAudit: (...args: unknown[]) => console.log('[AUDIT]', ...args),
  logWarning: (...args: unknown[]) => console.warn(...args),
  logInfo: (...args: unknown[]) => console.log(...args),
  logDebug: (...args: unknown[]) => console.debug(...args),
}

export default logger
