/**
 * Process-Level Error Handlers
 * ARCHITECTURE FIX (Critical): Handle uncaught errors and unhandled rejections
 *
 * These handlers catch errors that escape the Express error handling middleware:
 * - uncaughtException: Synchronous errors thrown outside request context
 * - unhandledRejection: Promise rejections without .catch() handlers
 * - SIGTERM/SIGINT: Graceful shutdown signals
 */

import { Server } from 'http';

import { isOperationalError } from '../errors/ApplicationError';
import telemetryService from '../monitoring/applicationInsights';

/**
 * Handle unhandled promise rejections
 * These are usually programming errors that need immediate attention
 */
export function handleUnhandledRejection(): void {
  process.on('unhandledRejection', (reason: unknown, promise: Promise<any>) => {
    console.error('FATAL: Unhandled Promise Rejection', {
      reason: reason instanceof Error ? reason.message : String(reason),
      stack: reason instanceof Error ? reason.stack : undefined,
      promise: promise.toString()
    });

    // Track in Application Insights
    const error = reason instanceof Error ? reason : new Error(String(reason));
    telemetryService.trackError(error, {
      errorType: 'UnhandledRejection',
      isOperational: false,
      severity: 'critical'
    });

    // For non-operational errors, exit process after logging
    if (!isOperationalError(error)) {
      console.error('Non-operational error detected - shutting down gracefully');

      // Flush telemetry before exit
      telemetryService.flush().then(() => {
        process.exit(1);
      }).catch(() => {
        process.exit(1);
      });
    }
  });
}

/**
 * Handle uncaught exceptions
 * These are synchronous errors that escaped all try/catch blocks
 */
export function handleUncaughtException(): void {
  process.on('uncaughtException', (error: Error) => {
    console.error('FATAL: Uncaught Exception', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });

    // Track in Application Insights
    telemetryService.trackError(error, {
      errorType: 'UncaughtException',
      isOperational: false,
      severity: 'critical'
    });

    // Uncaught exceptions are always fatal - shut down gracefully
    console.error('Uncaught exception detected - shutting down immediately');

    // Flush telemetry before exit
    telemetryService.flush().then(() => {
      process.exit(1);
    }).catch(() => {
      process.exit(1);
    });
  });
}

/**
 * Handle graceful shutdown signals (SIGTERM, SIGINT)
 * Ensures proper cleanup before process exits
 */
export function handleGracefulShutdown(server: Server): void {
  const shutdown = async (signal: string) => {
    console.log(`${signal} signal received: closing HTTP server gracefully`);

    // Track shutdown event
    telemetryService.trackEvent('ServerShutdown', {
      signal,
      timestamp: new Date().toISOString()
    });

    // Stop accepting new connections
    server.close(async () => {
      console.log('HTTP server closed');

      // Flush telemetry
      try {
        await telemetryService.flush();
        console.log('Telemetry flushed successfully');
      } catch (err) {
        console.error('Error flushing telemetry:', err);
      }

      // Exit gracefully
      process.exit(0);
    });

    // Force exit after 30 seconds if graceful shutdown fails
    setTimeout(() => {
      console.error('Graceful shutdown timeout - forcing exit');
      process.exit(1);
    }, 30000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

/**
 * Handle warning events (optional - for debugging)
 */
export function handleWarnings(): void {
  process.on('warning', (warning: Error) => {
    console.warn('Node.js Warning', {
      name: warning.name,
      message: warning.message,
      stack: warning.stack
    });

    // Track warnings in Application Insights (low severity)
    telemetryService.trackEvent('NodeWarning', {
      name: warning.name,
      message: warning.message
    });
  });
}

/**
 * Initialize all process-level error handlers
 * Call this once during application startup
 */
export function initializeProcessErrorHandlers(server: Server): void {
  handleUnhandledRejection();
  handleUncaughtException();
  handleGracefulShutdown(server);
  handleWarnings();

  console.log('✅ Process-level error handlers initialized');
}
