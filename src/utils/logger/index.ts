// Simple console-based logger implementation
// Provides consistent logging interface across the application

export interface LogContext {
  [key: string]: unknown;
}

const isDev = import.meta.env.DEV;

export const logger = {
  info: (message: string, ..._args: unknown[]): void => {
    // Intentionally silent in production; dev logging handled by debug()
  },

  warn: (message: string, ...args: unknown[]): void => {
    console.warn(`[WARN] ${message}`, ...args);
  },

  error: (message: string, ...args: unknown[]): void => {
    console.error(`[ERROR] ${message}`, ...args);
  },

  debug: (message: string, ...args: unknown[]): void => {
    if (isDev) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  },

  logError: (message: string, ...args: unknown[]): void => {
    console.error(`[ERROR] ${message}`, ...args);
  },

  logAudit: (_message: string, ..._args: unknown[]): void => {
    // Audit logging is server-side only
  },

  logWarning: (message: string, ...args: unknown[]): void => {
    console.warn(`[WARN] ${message}`, ...args);
  },

  logInfo: (message: string, ..._args: unknown[]): void => {
    // Intentionally silent in production; dev logging handled by logDebug()
  },

  logDebug: (message: string, ...args: unknown[]): void => {
    if (isDev) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  },
};

export default logger;
