// Initialize monitoring services FIRST (before other imports)
import telemetryService from './monitoring/applicationInsights'
telemetryService.initialize()

import { sentryService } from './monitoring/sentry'
import {
  sentryRequestHandler,
  sentryTracingHandler,
  sentryErrorHandler,
  notFoundHandler,
  handleUnhandledRejection,
  handleUncaughtException,
  handleGracefulShutdown
} from './middleware/sentryErrorHandler'

// Initialize Sentry
sentryService.init()

// Set up process error handlers
handleUnhandledRejection()
handleUncaughtException()
handleGracefulShutdown()

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'

import driversRouter from './routes/drivers'
import fuelRouter from './routes/fuel-transactions'
import incidentsRouter from './routes/incidents'
import invoicesRouter from './routes/invoices'
import maintenanceRouter from './routes/maintenance'
import partsRouter from './routes/parts'
import chargesRouter from './routes/personal-use-charges'
import purchaseOrdersRouter from './routes/purchase-orders'
import tasksRouter from './routes/tasks'
import vehiclesRouter from './routes/vehicles'
import vendorsRouter from './routes/vendors'
import { telemetryMiddleware, errorTelemetryMiddleware, performanceMiddleware } from './middleware/telemetry'

const app = express()
const PORT = process.env.PORT || 3001

// Sentry request handler must be the first middleware
app.use(sentryRequestHandler())

// Sentry tracing handler for performance monitoring
app.use(sentryTracingHandler())

// Security middleware
// SECURITY FIX (P0): Enable Content Security Policy to prevent XSS attacks (CWE-693)
// Fingerprint: e9f3a7c4d8b2e6f9
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Allow inline scripts for React
      styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles
      imgSrc: ["'self'", 'data:', 'https:', 'blob:'], // Allow external images
      connectSrc: ["'self'", 'wss:', 'ws:'], // Allow WebSocket connections
      fontSrc: ["'self'", 'data:'],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginEmbedderPolicy: false // Keep disabled for external resource loading
}))

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Add telemetry middleware
app.use(telemetryMiddleware)

// Add performance monitoring (sample 1 in 100 requests to avoid overhead)
app.use((req, res, next) => {
  if (Math.random() < 0.01) {
    performanceMiddleware(req, res, next)
  } else {
    next()
  }
})

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    monitoring: {
      applicationInsights: telemetryService.isActive() ? 'enabled' : 'disabled',
      sentry: process.env.SENTRY_DSN ? 'enabled' : 'disabled'
    }
  })
})

// Test Sentry endpoint (only in development)
if (process.env.NODE_ENV === 'development') {
  app.get('/api/test-sentry', (req, res) => {
    sentryService.addBreadcrumb('Test Sentry endpoint accessed', 'test', {
      query: req.query
    })

    if (req.query.type === 'message') {
      sentryService.captureMessage('Test message from Fleet API', 'info')
      res.json({ success: true, message: 'Test message sent to Sentry' })
    } else {
      throw new Error('Test error from Fleet API - This is intentional!')
    }
  })
}

// API routes
app.use('/api/vehicles', vehiclesRouter)
app.use('/api/drivers', driversRouter)
app.use('/api/fuel-transactions', fuelRouter)
app.use('/api/maintenance', maintenanceRouter)
app.use('/api/incidents', incidentsRouter)
app.use('/api/parts', partsRouter)
app.use('/api/vendors', vendorsRouter)
app.use('/api/invoices', invoicesRouter)
app.use('/api/purchase-orders', purchaseOrdersRouter)
app.use('/api/tasks', tasksRouter)
app.use('/api/personal-use-charges', chargesRouter)

// 404 handler - must come before error handlers
app.use(notFoundHandler())

// Add error telemetry middleware
app.use(errorTelemetryMiddleware)

// Sentry error handler must be the last middleware
app.use(sentryErrorHandler())

// Track emulator initialization if present
const initializeEmulatorTracking = () => {
  // Track emulator updates every minute if telemetry is active
  if (telemetryService.isActive()) {
    setInterval(() => {
      // Track basic emulator status
      telemetryService.trackEvent('EmulatorHeartbeat', {
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
      })
    }, 60000) // Every minute
  }
}

const server = app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`)
  console.log(`📊 Application Insights: ${telemetryService.isActive() ? 'Enabled' : 'Disabled'}`)
  console.log(`🔍 Sentry: ${process.env.SENTRY_DSN ? 'Enabled' : 'Disabled (no DSN configured)'}`)
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)

  // Track server startup in both monitoring systems
  telemetryService.trackEvent('ServerStartup', {
    port: PORT,
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development',
    telemetryEnabled: telemetryService.isActive(),
    sentryEnabled: !!process.env.SENTRY_DSN
  })

  // Also track in Sentry
  sentryService.captureMessage('Server started successfully', 'info')
  sentryService.addBreadcrumb('Server startup', 'lifecycle', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development'
  })

  // Initialize emulator tracking
  initializeEmulatorTracking()
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('📊 SIGTERM signal received: flushing telemetry and closing server')

  server.close(async () => {
    // Flush both monitoring services
    await Promise.all([
      telemetryService.flush(),
      sentryService.flush(5000)
    ])
    console.log('Server closed gracefully')
    process.exit(0)
  })
})

process.on('SIGINT', async () => {
  console.log('📊 SIGINT signal received: flushing telemetry and closing server')

  server.close(async () => {
    // Flush both monitoring services
    await Promise.all([
      telemetryService.flush(),
      sentryService.flush(5000)
    ])
    console.log('Server closed gracefully')
    process.exit(0)
  })
})
