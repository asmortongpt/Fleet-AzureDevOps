// Simple console-based logger implementation
// Provides consistent logging interface across the application

export interface LogContext {
  [key: string]: unknown;
}

const isDev = import.meta.env.DEV;

export const logger = {
  info: (message: string, ...args: unknown[]): void => {
    if (isDev) {
    }
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

  logAudit: (message: string, ...args: unknown[]): void => {
  },

  logWarning: (message: string, ...args: unknown[]): void => {
    console.warn(`[WARN] ${message}`, ...args);
  },

  logInfo: (message: string, ...args: unknown[]): void => {
    if (isDev) {
    }
  },

  logDebug: (message: string, ...args: unknown[]): void => {
    if (isDev) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  },
};

export default logger;
