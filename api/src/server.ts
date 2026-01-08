// Initialize monitoring services FIRST (before other imports)
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'

import { initializeConnectionManager } from './config/connection-manager' // Import connection manager initialization
import { createFuelMasterRouter } from './emulators/fuelmaster/FuelMasterEmulator'
import { createPeopleSoftRouter } from './emulators/peoplesoft/PeopleSoftEmulator'
import { processEmailJob } from './jobs/processors/email.processor'
import { processNotificationJob } from './jobs/processors/notification.processor'
import { processReportJob } from './jobs/processors/report.processor'
import { emailQueue, notificationQueue, reportQueue, closeAllQueues } from './jobs/queue'
import { getCorsConfig, validateCorsConfiguration } from './middleware/corsConfig'
import { getCsrfToken } from './middleware/csrf'
import { errorHandler } from './middleware/errorHandler'
import { initializeProcessErrorHandlers } from './middleware/processErrorHandlers'
import { globalLimiter } from './middleware/rateLimiter'
import { securityHeaders } from './middleware/security-headers'
import {
  sentryRequestHandler,
  sentryTracingHandler,
  sentryErrorHandler,
  notFoundHandler
} from './middleware/sentryErrorHandler'
import { telemetryMiddleware, errorTelemetryMiddleware, performanceMiddleware } from './middleware/telemetry'
import telemetryService from './monitoring/applicationInsights'
import { sentryService } from './monitoring/sentry'


// Security middleware

// Core Fleet Management Routes
import adminJobsRouter from './routes/admin-jobs.routes'
// DISABLED: import aiInsightsRouter from './routes/ai-insights.routes'
import aiSearchRouter from './routes/ai-search'
import aiTaskAssetRouter from './routes/ai-task-asset.routes'
import aiTaskPrioritizationRouter from './routes/ai-task-prioritization.routes'
import annualReauthorizationRouter from './routes/annual-reauthorization.routes'
import arcgisLayersRouter from './routes/arcgis-layers'
import assetAnalyticsRouter from './routes/asset-analytics.routes'
import assetManagementRouter from './routes/asset-management.routes'
import assetsMobileRouter from './routes/assets-mobile.routes'
import assignmentReportingRouter from './routes/assignment-reporting.routes'
// DISABLED: import attachmentsRouter from './routes/attachments.routes'
import authRouter from './routes/auth'
import batchRouter from './routes/batch'
import billingReportsRouter from './routes/billing-reports'
import breakGlassRouter from './routes/break-glass'
import calendarRouter from './routes/calendar.routes'
import chargingSessionsRouter from './routes/charging-sessions'
import chargingStationsRouter from './routes/charging-stations'
import communicationLogsRouter from './routes/communication-logs'

// Asset Management Routes

// Dispatch & Communication Routes

// GPS & Tracking Routes

// Maintenance & Inspection Routes

// EV Management Routes

// Document Management Routes
// DISABLED: import ocrRouter from './routes/ocr.routes'

// Financial & Cost Management Routes
import costAnalysisRouter from './routes/cost-analysis.routes'
import costBenefitAnalysisRouter from './routes/cost-benefit-analysis.routes'
import costsRouter from './routes/costs'
// DISABLED: import fuelPurchasingRouter from './routes/fuel-purchasing.routes'

// Reporting & Analytics Routes
// DISABLED: import customReportsRouter from './routes/custom-reports.routes'

// AI & Automation Routes
// DISABLED: import langchainRouter from './routes/langchain.routes'
// DISABLED: import fleetOptimizerRouter from './routes/fleet-optimizer.routes'

// Task & Schedule Management Routes

// Mobile & Integration Routes
// DISABLED: import mobileNotificationsRouter from './routes/mobile-notifications.routes'
// DISABLED: import mobileObd2Router from './routes/mobile-obd2.routes'
// DISABLED: import mobileOcrRouter from './routes/mobile-ocr.routes'

// Vehicle Management Routes
// DISABLED: import vehicleIdentificationRouter from './routes/vehicle-identification.routes'
import damageRouter from './routes/damage'
import damageReportsRouter from './routes/damage-reports'

// Trip & Route Management Routes
import routesRouter from './routes/routes'
import tripUsageRouter from './routes/trip-usage'

// Safety & Compliance Routes
import safetyIncidentsRouter from './routes/safety-incidents'
import oshaComplianceRouter from './routes/osha-compliance'

// Policy & Permission Routes
import policiesRouter from './routes/policies'
import policyTemplatesRouter from './routes/policy-templates'
import permissionsRouter from './routes/permissions'

// Authentication & User Management Routes
import microsoftAuthRouter from './routes/microsoft-auth'
import sessionRevocationRouter from './routes/session-revocation'

// External Integrations Routes
import smartcarRouter from './routes/smartcar.routes'
import outlookRouter from './routes/outlook.routes'

// Emulator & Testing Routes
import emulatorRouter from './routes/emulator.routes'
import obd2EmulatorRouter from './routes/obd2-emulator.routes'
import demoRouter from './routes/demo.routes'

// System Management Routes
import monitoringRouter from './routes/monitoring'
import healthRouter from './routes/health.routes' // Microsoft integration health
import healthSystemRouter from './routes/health-system.routes' // Comprehensive system health (BACKEND-12)
import healthDetailedRouter from './routes/health-detailed'
import performanceRouter from './routes/performance.routes'
import telemetryRouter from './routes/telemetry'
import queueRouter from './routes/queue.routes'
import deploymentsRouter from './routes/deployments'
import documentsRouter from './routes/documents'
import driverScorecardRouter from './routes/driver-scorecard.routes'
import driversRouter from './routes/drivers'
import evManagementRouter from './routes/ev-management.routes'
import executiveDashboardRouter from './routes/executive-dashboard.routes'
import facilitiesRouter from './routes/facilities'
import fleetDocumentsRouter from './routes/fleet-documents.routes'
import fuelRouter from './routes/fuel-transactions'
import geofencesRouter from './routes/geofences'
import gpsRouter from './routes/gps'
import heavyEquipmentRouter from './routes/heavy-equipment.routes'
import incidentsRouter from './routes/incidents'
import inspectionsRouter from './routes/inspections'
import invoicesRouter from './routes/invoices'
import maintenanceRouter from './routes/maintenance'
import maintenanceDrilldownsRouter from './routes/maintenance-drilldowns'
import maintenanceSchedulesRouter from './routes/maintenance-schedules'
import mileageReimbursementRouter from './routes/mileage-reimbursement'
import mobileAssignmentRouter from './routes/mobile-assignment.routes'
import mobileHardwareRouter from './routes/mobile-hardware.routes'
import mobileIntegrationRouter from './routes/mobile-integration.routes'
import mobileMessagingRouter from './routes/mobile-messaging.routes'
import mobilePhotosRouter from './routes/mobile-photos.routes'
import mobileTripsRouter from './routes/mobile-trips.routes'
import onCallManagementRouter from './routes/on-call-management.routes'
import partsRouter from './routes/parts'
import chargesRouter from './routes/personal-use-charges'
import personalUsePoliciesRouter from './routes/personal-use-policies'
import presenceRouter from './routes/presence.routes'
import purchaseOrdersRouter from './routes/purchase-orders'
import pushNotificationsRouter from './routes/push-notifications.routes'
import qualityGatesRouter from './routes/quality-gates'
import reservationsRouter from './routes/reservations.routes'
import routeEmulatorRouter from './routes/route-emulator.routes'
import schedulingRouter from './routes/scheduling.routes'
import searchRouter from './routes/search'
import storageAdminRouter from './routes/storage-admin'
import syncRouter from './routes/sync.routes'
import tasksRouter from './routes/tasks'
import teamsRouter from './routes/teams.routes'
import telematicsRouter from './routes/telematics.routes'
import vehicle3dRouter from './routes/vehicle-3d.routes'
import vehicleAssignmentsRouter from './routes/vehicle-assignments.routes'
import vehicleHistoryRouter from './routes/vehicle-history.routes'
import vehicleIdlingRouter from './routes/vehicle-idling.routes'
import vehiclesRouter from './routes/vehicles'
import vendorsRouter from './routes/vendors'
import videoEventsRouter from './routes/video-events'
import videoTelematicsRouter from './routes/video-telematics.routes'
import workOrdersRouter from './routes/work-orders'

// Job Processing Infrastructure
import logger from './utils/logger'

console.log('--- SERVER STARTING DEBUG ---')
// Initialize Datadog APM FIRST (must be before ALL other imports)
// DISABLED: Datadog APM initialization disabled for now
// TODO: Re-enable when dd-trace package is properly installed
console.log('Datadog APM disabled')
telemetryService.initialize()

// ARCHITECTURE FIX: Import new error handling infrastructure

// Initialize Sentry
sentryService.init()

console.log('--- IMPORTS COMPLETED, CREATING APP ---');
const app = express()
const PORT = process.env.PORT || 3000

// Validate CORS configuration at startup
validateCorsConfiguration()

// Sentry request handler must be the first middleware
app.use(sentryRequestHandler())

// Sentry tracing handler for performance monitoring
app.use(sentryTracingHandler())

// ===========================================================================
// SECURITY MIDDLEWARE (Applied in correct order)
// ===========================================================================

// 1. Security Headers - Must be first to set headers on all responses
app.use(securityHeaders({
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  csp: {
    directives: {
      'default-src': ["'self'"],
      'script-src': ["'self'"],
      'style-src': ["'self'", "'unsafe-inline'"], // For Swagger UI
      'img-src': ["'self'", 'data:', 'https:'],
      'connect-src': ["'self'", process.env.AZURE_OPENAI_ENDPOINT || ''].filter(Boolean),
      'font-src': ["'self'"],
      'object-src': ["'none'"],
      'frame-src': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"]
    }
  },
  frameOptions: 'DENY',
  contentTypeOptions: true,
  xssProtection: true,
  referrerPolicy: 'strict-origin-when-cross-origin'
}))

// 2. CORS Configuration - Strict origin validation
app.use(cors(getCorsConfig()))

// Handle preflight requests explicitly for all routes
app.options('*', cors(getCorsConfig()))

// 3. Body Parsers - After security headers and CORS
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// 3.5. Cookie Parser - Required for CSRF protection
app.use(cookieParser())

// 4. Global Rate Limiting - Apply to all routes to prevent DoS attacks
app.use(globalLimiter)

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

// CSRF Token endpoint - NO csrfProtection middleware (these endpoints GENERATE tokens)
app.get('/api/csrf-token', getCsrfToken)
app.get('/api/v1/csrf-token', getCsrfToken)
app.get('/api/csrf', getCsrfToken)

// Health check
app.get('/health', (_req, res) => {
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

// ============================================================================
// API ROUTE REGISTRATIONS
// ============================================================================

// BATCH-001: Request batching endpoint (must be before other routes)
app.use('/api/v1/batch', batchRouter)
app.use('/api/batch', batchRouter)

// Core Fleet Management Routes
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

// Asset Management Routes
app.use('/api/assets', assetManagementRouter)
app.use('/api/asset-analytics', assetAnalyticsRouter)
app.use('/api/assets-mobile', assetsMobileRouter)
app.use('/api/heavy-equipment', heavyEquipmentRouter)

// Dispatch & Communication Routes
app.use('/api/communication-logs', communicationLogsRouter)
app.use('/api/teams', teamsRouter)

// GPS & Tracking Routes
app.use('/api/gps', gpsRouter)
app.use('/api/geofences', geofencesRouter)
app.use('/api/telematics', telematicsRouter)
app.use('/api/vehicle-idling', vehicleIdlingRouter)

// Maintenance & Inspection Routes
app.use('/api/maintenance-schedules', maintenanceSchedulesRouter)
app.use('/api/maintenance/drilldowns', maintenanceDrilldownsRouter)
app.use('/api/inspections', inspectionsRouter)
app.use('/api/work-orders', workOrdersRouter)

// EV Management Routes
app.use('/api/ev-management', evManagementRouter)
app.use('/api/charging-sessions', chargingSessionsRouter)
app.use('/api/charging-stations', chargingStationsRouter)

// Document Management Routes
app.use('/api/documents', documentsRouter)
app.use('/api/fleet-documents', fleetDocumentsRouter)
// DISABLED: app.use('/api/attachments', attachmentsRouter)
// DISABLED: app.use('/api/ocr', ocrRouter)

// Financial & Cost Management Routes
app.use('/api/costs', costsRouter)
app.use('/api/cost-analysis', costAnalysisRouter)
app.use('/api/cost-benefit-analysis', costBenefitAnalysisRouter)
app.use('/api/billing-reports', billingReportsRouter)
app.use('/api/mileage-reimbursement', mileageReimbursementRouter)
app.use('/api/personal-use-charges', chargesRouter)
app.use('/api/personal-use-policies', personalUsePoliciesRouter)
// DISABLED: app.use('/api/fuel-purchasing', fuelPurchasingRouter)

// Reporting & Analytics Routes
app.use('/api/executive-dashboard', executiveDashboardRouter)
// DISABLED: app.use('/api/custom-reports', customReportsRouter)
app.use('/api/assignment-reporting', assignmentReportingRouter)
app.use('/api/driver-scorecard', driverScorecardRouter)

// AI & Automation Routes
// DISABLED: app.use('/api/ai-insights', aiInsightsRouter)
app.use('/api/ai-search', aiSearchRouter)
app.use('/api/ai-task-asset', aiTaskAssetRouter)
app.use('/api/ai-tasks', aiTaskPrioritizationRouter)
// DISABLED: app.use('/api/langchain', langchainRouter)
// DISABLED: app.use('/api/fleet-optimizer', fleetOptimizerRouter)

// Task & Schedule Management Routes
app.use('/api/scheduling', schedulingRouter)
app.use('/api/calendar', calendarRouter)
app.use('/api/on-call-management', onCallManagementRouter)

// Mobile & Integration Routes
app.use('/api/mobile-assignment', mobileAssignmentRouter)
app.use('/api/mobile-hardware', mobileHardwareRouter)
app.use('/api/mobile-integration', mobileIntegrationRouter)
app.use('/api/mobile-messaging', mobileMessagingRouter)
// DISABLED: app.use('/api/mobile-notifications', mobileNotificationsRouter)
// DISABLED: app.use('/api/mobile-obd2', mobileObd2Router)
// DISABLED: app.use('/api/mobile-ocr', mobileOcrRouter)
app.use('/api/mobile-photos', mobilePhotosRouter)
app.use('/api/mobile-trips', mobileTripsRouter)
app.use('/api/push-notifications', pushNotificationsRouter)

// Vehicle Management Routes
app.use('/api/vehicle-assignments', vehicleAssignmentsRouter)
app.use('/api/vehicle-history', vehicleHistoryRouter)
// DISABLED: app.use('/api/vehicle-identification', vehicleIdentificationRouter)
app.use('/api/vehicle-3d', vehicle3dRouter)
app.use('/api/damage', damageRouter)
app.use('/api/damage-reports', damageReportsRouter)

// Trip & Route Management Routes
app.use('/api/routes', routesRouter)
app.use('/api/route-emulator', routeEmulatorRouter)
app.use('/api/trip-usage', tripUsageRouter)

// Safety & Compliance Routes
app.use('/api/safety-incidents', safetyIncidentsRouter)
app.use('/api/osha-compliance', oshaComplianceRouter)
app.use('/api/annual-reauthorization', annualReauthorizationRouter)

// Policy & Permission Routes
app.use('/api/policies', policiesRouter)
app.use('/api/policy-templates', policyTemplatesRouter)
app.use('/api/permissions', permissionsRouter)

// Authentication & User Management Routes
app.use('/api/auth', authRouter)
app.use('/auth', authRouter) // Alias without /api prefix for backward compatibility
app.use('/api/auth', sessionRevocationRouter) // Session revocation endpoints (/revoke, /revoke/status)
app.use('/api/microsoft-auth', microsoftAuthRouter)
app.use('/api/break-glass', breakGlassRouter)

// External Integrations Routes
app.use('/api/smartcar', smartcarRouter)
app.use('/api/arcgis-layers', arcgisLayersRouter)
app.use('/api/outlook', outlookRouter)
app.use('/api/video-events', videoEventsRouter)
app.use('/api/video-telematics', videoTelematicsRouter)

// Emulator & Testing Routes
app.use('/api/emulator', emulatorRouter)
app.use('/api/obd2-emulator', obd2EmulatorRouter)
app.use('/api/demo', demoRouter)
app.use('/api/emulators/peoplesoft', createPeopleSoftRouter())
app.use('/api/emulators/fuelmaster', createFuelMasterRouter())

// System Management Routes
app.use('/api/monitoring', monitoringRouter)
app.use('/api/health', healthSystemRouter) // Comprehensive system health (BACKEND-12)
app.use('/api/health/microsoft', healthRouter) // Microsoft integration health
app.use('/api/health-detailed', healthDetailedRouter)
app.use('/api/performance', performanceRouter)
app.use('/api/telemetry', telemetryRouter)
app.use('/api/queue', queueRouter)
app.use('/api/deployments', deploymentsRouter)
app.use('/api/facilities', facilitiesRouter)
app.use('/api/search', searchRouter)
app.use('/api/presence', presenceRouter)
app.use('/api/storage-admin', storageAdminRouter)
app.use('/api/sync', syncRouter)
app.use('/api/quality-gates', qualityGatesRouter)
app.use('/api/reservations', reservationsRouter)
app.use('/api/admin/jobs', adminJobsRouter)

// 404 handler - must come before error handlers
app.use(notFoundHandler())

// Add error telemetry middleware
app.use(errorTelemetryMiddleware)

// ARCHITECTURE FIX: Add custom error handler BEFORE Sentry
// This handles ApplicationError instances with proper status codes
app.use(errorHandler)

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

/**
 * Initialize Bull job processors
 */
const initializeJobProcessors = () => {
  logger.info('Initializing Bull job processors...')

  // Email queue processor
  emailQueue.process(async (job) => {
    return processEmailJob(job)
  })

  // Notification queue processor
  notificationQueue.process(async (job) => {
    return processNotificationJob(job)
  })

  // Report queue processor
  reportQueue.process(async (job) => {
    return processReportJob(job)
  })

  logger.info('Bull job processors initialized')
  logger.info('  - Email queue: ready')
  logger.info('  - Notification queue: ready')
  logger.info('  - Report queue: ready')
}

console.log('--- READY TO LISTEN ON PORT ' + PORT + ' ---');

let server: any;

const startServer = async () => {
  try {
    // Initialize database connection manager FIRST
    try {
      await initializeConnectionManager();
      console.log('Database connection manager initialized');
    } catch (error) {
      console.error('Failed to initialize Connection Manager (Running in Degraded Mode):', error);
    }

    server = app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`)
      console.log(`Application Insights: ${telemetryService.isActive() ? 'Enabled' : 'Disabled'}`)
      console.log(`Sentry: ${process.env.SENTRY_DSN ? 'Enabled' : 'Disabled (no DSN configured)'}`)
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)

      // ARCHITECTURE FIX: Initialize process-level error handlers
      initializeProcessErrorHandlers(server)

      // Initialize Bull job processors
      initializeJobProcessors()

      // Track server startup in both monitoring systems
      telemetryService.trackEvent('ServerStartup', {
        port: PORT,
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || 'development',
        telemetryEnabled: telemetryService.isActive(),
        sentryEnabled: !!process.env.SENTRY_DSN,
        jobProcessorsEnabled: true
      })

      // Also track in Sentry
      sentryService.captureMessage('Server started successfully', 'info')
      sentryService.addBreadcrumb('Server startup', 'lifecycle', {
        port: PORT,
        environment: process.env.NODE_ENV || 'development'
      })

      // Initialize emulator tracking
      initializeEmulatorTracking()

      // Initialize Real-Time Collaboration Service
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { collaborationService } = require('./services/collaboration/real-time.service')
        collaborationService.initialize(server)
      } catch (err) {
        console.error('Failed to initialize Collaboration Service:', err)
      }
    })
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: flushing telemetry and closing server')

  server.close(async () => {
    // Close Bull queues gracefully
    await closeAllQueues()

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
  console.log('SIGINT signal received: flushing telemetry and closing server')

  server.close(async () => {
    // Close Bull queues gracefully
    await closeAllQueues()

    // Flush both monitoring services
    await Promise.all([
      telemetryService.flush(),
      sentryService.flush(5000)
    ])
    console.log('Server closed gracefully')
    process.exit(0)
  })
})