/**
 * @file logger.ts
 * @description Centralized logging configuration with sanitization.
 *
 * This module re-exports the browser-compatible ProductionLogger from
 * src/utils/logger.ts. The previous implementation used winston (a Node.js
 * library) which cannot run in browser builds.
 */

import logger from './utils/logger';

// Re-export the LogData interface for consumers that depend on it
export interface LogData {
  email?: string;
  phone?: string;
  [key: string]: any;
}

export default logger;
