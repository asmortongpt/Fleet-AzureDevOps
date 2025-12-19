/**
 * Enhanced Winston Logger with Azure Application Insights Integration
 * Provides structured logging with automatic shipping to Azure Log Analytics
 */

import * as appInsights from 'applicationinsights'
import winston from 'winston'

// Initialize Application Insights if connection string is provided
const appInsightsConnectionString = process.env.APPLICATION_INSIGHTS_CONNECTION_STRING ||
                                    process.env.APPLICATIONINSIGHTS_CONNECTION_STRING

let appInsightsClient: appInsights.TelemetryClient | null = null

if (appInsightsConnectionString) {
  appInsights.setup(appInsightsConnectionString)
    .setAutoDependencyCorrelation(true)
    .setAutoCollectRequests(true)
    .setAutoCollectPerformance(true, true)
    .setAutoCollectExceptions(true)
    .setAutoCollectDependencies(true)
    .setAutoCollectConsole(true, true)
    .setUseDiskRetryCaching(true)
    .setAutoCollectPreAggregatedMetrics(true)
    .setSendLiveMetrics(true)
    .setDistributedTracingMode(appInsights.DistributedTracingModes.AI_AND_W3C)
    .start()

  appInsightsClient = appInsights.defaultClient
  appInsightsClient.context.tags[appInsightsClient.context.keys.cloudRole] = 'fleet-api'

  console.log('✅ Application Insights initialized for backend logging')
} else {
  console.warn('⚠️ Application Insights not configured - logs will not be sent to Azure')
}

/**
 * Custom Winston transport for Application Insights
 */
class ApplicationInsightsTransport extends winston.Transport {
  constructor(opts?: winston.TransportStreamOptions) {
    super(opts)
  }

  log(info: any, callback: () => void) {
    setImmediate(() => {
      this.emit('logged', info)
    })

    if (!appInsightsClient) {
      callback()
      return
    }

    // Map Winston levels to Application Insights severity
    const severityMap: Record<string, appInsights.Contracts.SeverityLevel> = {
      error: appInsights.Contracts.SeverityLevel.Error,
      warn: appInsights.Contracts.SeverityLevel.Warning,
      info: appInsights.Contracts.SeverityLevel.Information,
      debug: appInsights.Contracts.SeverityLevel.Verbose,
      verbose: appInsights.Contracts.SeverityLevel.Verbose
    }

    const severity = severityMap[info.level] || appInsights.Contracts.SeverityLevel.Information

    // Handle errors specially
    if (info.level === 'error' && info.stack) {
      const error = new Error(info.message)
      error.stack = info.stack
      appInsightsClient.trackException({
        exception: error,
        severity,
        properties: {
          ...info,
          timestamp: info.timestamp,
          service: 'fleet-api'
        }
      })
    } else {
      // Log as trace
      appInsightsClient.trackTrace({
        message: info.message,
        severity,
        properties: {
          ...info,
          timestamp: info.timestamp,
          service: 'fleet-api'
        }
      })
    }

    callback()
  }
}

// Log format for console output
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`

    // Add metadata if present
    const metaKeys = Object.keys(meta).filter(k => k !== 'timestamp' && k !== 'level' && k !== 'message')
    if (metaKeys.length > 0) {
      const metaObj: any = {}
      metaKeys.forEach(k => metaObj[k] = meta[k])
      msg += ` ${JSON.stringify(metaObj)}`
    }

    return msg
  })
)

// Log format for file and Application Insights
const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
)

// Create Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: jsonFormat,
  defaultMeta: {
    service: 'fleet-api',
    environment: process.env.NODE_ENV || 'development',
    version: process.env.APP_VERSION || '1.0.0'
  },
  transports: [
    // Console output
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'development' ? consoleFormat : jsonFormat
    }),

    // File outputs
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 10,
      tailable: true
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 10485760, // 10MB
      maxFiles: 10,
      tailable: true
    })
  ],
  // Exception handlers
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' })
  ],
  // Rejection handlers
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' })
  ]
})

// Add Application Insights transport if available
if (appInsightsClient) {
  logger.add(new ApplicationInsightsTransport())
}

/**
 * Enhanced logger with additional methods
 */
export const enhancedLogger = {
  ...logger,

  /**
   * Log HTTP request
   */
  logRequest(req: any, duration?: number) {
    const logData: any = {
      method: req.method,
      url: req.originalUrl || req.url,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      userId: req.user?.id
    }

    if (duration !== undefined) {
      logData.duration = duration
    }

    logger.info('HTTP Request', logData)

    // Track as dependency in Application Insights
    if (appInsightsClient && duration !== undefined) {
      appInsightsClient.trackDependency({
        target: req.originalUrl || req.url,
        name: `${req.method} ${req.originalUrl || req.url}`,
        data: req.originalUrl || req.url,
        duration,
        resultCode: 200, // Will be updated by response logging
        success: true,
        dependencyTypeName: 'HTTP'
      })
    }
  },

  /**
   * Log HTTP response
   */
  logResponse(req: any, res: any, duration: number) {
    const logData = {
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      duration,
      userId: req.user?.id
    }

    const level = res.statusCode >= 500 ? 'error' :
                  res.statusCode >= 400 ? 'warn' : 'info'

    logger.log(level, 'HTTP Response', logData)

    // Track request in Application Insights
    if (appInsightsClient) {
      appInsightsClient.trackRequest({
        name: `${req.method} ${req.route?.path || req.originalUrl || req.url}`,
        url: req.originalUrl || req.url,
        duration,
        resultCode: res.statusCode,
        success: res.statusCode < 400,
        properties: {
          method: req.method,
          userId: req.user?.id,
          userAgent: req.get('user-agent')
        }
      })
    }
  },

  /**
   * Log database query
   */
  logQuery(query: string, duration: number, params?: any[]) {
    logger.debug('Database Query', {
      query: query.substring(0, 200), // Limit query length
      duration,
      paramCount: params?.length || 0
    })

    // Track as dependency in Application Insights
    if (appInsightsClient) {
      appInsightsClient.trackDependency({
        target: 'database',
        name: query.substring(0, 100),
        data: query.substring(0, 200),
        duration,
        resultCode: 0,
        success: true,
        dependencyTypeName: 'SQL'
      })
    }
  },

  /**
   * Log external API call
   */
  logExternalCall(endpoint: string, method: string, statusCode: number, duration: number) {
    logger.info('External API Call', {
      endpoint,
      method,
      statusCode,
      duration,
      success: statusCode >= 200 && statusCode < 400
    })

    // Track as dependency in Application Insights
    if (appInsightsClient) {
      appInsightsClient.trackDependency({
        target: endpoint,
        name: `${method} ${endpoint}`,
        data: endpoint,
        duration,
        resultCode: statusCode,
        success: statusCode >= 200 && statusCode < 400,
        dependencyTypeName: 'HTTP'
      })
    }
  },

  /**
   * Log custom metric
   */
  logMetric(name: string, value: number, properties?: Record<string, any>) {
    logger.debug('Metric', { name, value, ...properties })

    // Track metric in Application Insights
    if (appInsightsClient) {
      appInsightsClient.trackMetric({
        name,
        value,
        properties
      })
    }
  },

  /**
   * Log custom event
   */
  logEvent(name: string, properties?: Record<string, any>) {
    logger.info('Event', { event: name, ...properties })

    // Track event in Application Insights
    if (appInsightsClient) {
      appInsightsClient.trackEvent({
        name,
        properties
      })
    }
  },

  /**
   * Flush all pending telemetry
   */
  async flush(): Promise<void> {
    return new Promise((resolve) => {
      if (appInsightsClient) {
        appInsightsClient.flush({
          callback: () => resolve()
        })
      } else {
        resolve()
      }
    })
  }
}

// Export both standard and enhanced loggers
export { logger, appInsightsClient }
export default enhancedLogger

// Handle unhandled rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled Rejection', {
    reason: reason?.message || reason,
    stack: reason?.stack,
    promise: promise.toString()
  })

  if (appInsightsClient) {
    const error = reason instanceof Error ? reason : new Error(String(reason))
    appInsightsClient.trackException({
      exception: error,
      severity: appInsights.Contracts.SeverityLevel.Critical,
      properties: {
        type: 'UnhandledRejection',
        promise: promise.toString()
      }
    })
  }
})

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception', {
    message: error.message,
    stack: error.stack
  })

  if (appInsightsClient) {
    appInsightsClient.trackException({
      exception: error,
      severity: appInsights.Contracts.SeverityLevel.Critical,
      properties: {
        type: 'UncaughtException'
      }
    })

    // Flush and exit
    appInsightsClient.flush({
      callback: () => {
        process.exit(1)
      }
    })
  } else {
    process.exit(1)
  }
})
