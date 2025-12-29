// Logger interface
export interface Logger {
  error(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  debug(message: string, ...args: any[]): void;
  log(message: string, ...args: any[]): void;
  securityEvent?(message: string, details: any): void;
}

// Logger implementation (using console for now)
export const logger: Logger = {
  error: (message: string, ...args: any[]) => console.error(message, ...args),
  warn: (message: string, ...args: any[]) => console.warn(message, ...args),
  info: (message: string, ...args: any[]) => console.info(message, ...args),
  debug: (message: string, ...args: any[]) => console.debug(message, ...args),
  log: (message: string, ...args: any[]) => console.log(message, ...args),
  securityEvent: (message: string, details: any) => console.log(`[SECURITY] ${message}`, details),
};

// Export Logger type for use in other modules
export type { Logger as LoggerType };

// Utility functions
export function validate(...args: any[]): boolean { return true; }
export function compliance(...args: any[]): any { return {}; }
