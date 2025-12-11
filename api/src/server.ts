// Initialize monitoring services FIRST (before other imports)
import telemetryService from './monitoring/applicationInsights'
telemetryService.initialize()

import { sentryService } from './monitoring/sentry'
import {
  sentryRequestHandler,
  sentryTracingHandler,
  sentryErrorHandler,
  notFoundHandler
} from './middleware/sentryErrorHandler'

// ARCHITECTURE FIX: Import new error handling infrastructure
import { errorHandler } from './middleware/errorHandler'
import { initializeProcessErrorHandlers } from './middleware/processErrorHandlers'

// Initialize Sentry
sentryService.init()

import express from 'express'
import cors from 'cors'
import { logger } from './middleware/logger'
import helmet from 'helmet'

// Security middleware
import { securityHeaders } from './middleware/security-headers'
import { getCorsConfig, validateCorsConfiguration } from './middleware/corsConfig'
import { globalLimiter } from './middleware/rateLimiter'
import { csrfProtection, getCsrfToken } from './middleware/csrf'
import { authenticateJWT } from './middleware/auth'
import { setTenantContext, debugTenantContext } from './middleware/tenant-context'

// Core Fleet Management Routes
import adminJobsRouter from './routes/admin-jobs.routes'
import aiInsightsRouter from './routes/ai-insights.routes'
import aiSearchRouter from './routes/ai-search'
import aiTaskAssetRouter from './routes/ai-task-asset.routes'
import aiTaskPrioritizationRouter from './routes/ai-task-prioritization.routes'
import annualReauthorizationRouter from './routes/annual-reauthorization.routes'
import arcgisLayersRouter from './routes/arcgis-layers'
import assetAnalyticsRouter from './routes/asset-analytics.routes'
import assetManagementRouter from './routes/asset-management.routes'
import assetsMobileRouter from './routes/assets-mobile.routes'
import assignmentReportingRouter from './routes/assignment-reporting.routes'
import attachmentsRouter from './routes/attachments.routes'
import authRouter from './routes/auth'
import billingReportsRouter from './routes/billing-reports'
import breakGlassRouter from './routes/break-glass'
import calendarRouter from './routes/calendar.routes'
import chargingSessionsRouter from './routes/charging-sessions'
import chargingStationsRouter from './routes/charging-stations'
import communicationLogsRouter from './routes/communication-logs'
import driversRouter from './routes/drivers'
import vehiclesRouter from './routes/vehicles'
import fuelRouter from './routes/fuel-transactions'
import maintenanceRouter from './routes/maintenance'
import incidentsRouter from './routes/incidents'
import partsRouter from './routes/parts'
import vendorsRouter from './routes/vendors'
import invoicesRouter from './routes/invoices'
import purchaseOrdersRouter from './routes/purchase-orders'
import tasksRouter from './routes/tasks'

// Asset Management Routes
import heavyEquipmentRouter from './routes/heavy-equipment.routes'

// Dispatch & Communication Routes
import teamsRouter from './routes/teams.routes'

// GPS & Tracking Routes
import gpsRouter from './routes/gps'
import geofencesRouter from './routes/geofences'
import telematicsRouter from './routes/telematics.routes'
import vehicleIdlingRouter from './routes/vehicle-idling.routes'

// Maintenance & Inspection Routes
import maintenanceSchedulesRouter from './routes/maintenance-schedules'
import inspectionsRouter from './routes/inspections'
import videoEventsRouter from './routes/video-events'
import videoTelematicsRouter from './routes/video-telematics.routes'
import workOrdersRouter from './routes/work-orders'

// EV Management Routes
import evManagementRouter from './routes/ev-management.routes'

// Document Management Routes
import documentsRouter from './routes/documents'
import fleetDocumentsRouter from './routes/fleet-documents.routes'
import ocrRouter from './routes/ocr.routes'

// Financial & Cost Management Routes
import costsRouter from './routes/costs'
import costAnalysisRouter from './routes/cost-analysis.routes'
import costBenefitAnalysisRouter from './routes/cost-benefit-analysis.routes'
import mileageReimbursementRouter from './routes/mileage-reimbursement'
import chargesRouter from './routes/personal-use-charges'
import personalUsePoliciesRouter from './routes/personal-use-policies'
import fuelPurchasingRouter from './routes/fuel-purchasing.routes'

// Reporting & Analytics Routes
import executiveDashboardRouter from './routes/executive-dashboard.routes'
import customReportsRouter from './routes/custom-reports.routes'
import driverScorecardRouter from './routes/driver-scorecard.routes'

// AI & Automation Routes
import langchainRouter from './routes/langchain.routes'
import fleetOptimizerRouter from './routes/fleet-optimizer.routes'

// Task & Schedule Management Routes
import schedulingRouter from './routes/scheduling.routes'
import onCallManagementRouter from './routes/on-call-management.routes'

// Mobile & Integration Routes
import mobileAssignmentRouter from './routes/mobile-assignment.routes'
import mobileHardwareRouter from './routes/mobile-hardware.routes'
import mobileIntegrationRouter from './routes/mobile-integration.routes'
import mobileMessagingRouter from './routes/mobile-messaging.routes'
import mobileNotificationsRouter from './routes/mobile-notifications.routes'
import mobileObd2Router from './routes/mobile-obd2.routes'
import mobileOcrRouter from './routes/mobile-ocr.routes'
import mobilePhotosRouter from './routes/mobile-photos.routes'
import mobileTripsRouter from './routes/mobile-trips.routes'
import pushNotificationsRouter from './routes/push-notifications.routes'

// Vehicle Management Routes
import vehicleAssignmentsRouter from './routes/vehicle-assignments.routes'
import vehicleHistoryRouter from './routes/vehicle-history.routes'
import vehicleIdentificationRouter from './routes/vehicle-identification.routes'
import vehicle3dRouter from './routes/vehicle-3d.routes'
import damageRouter from './routes/damage'
import damageReportsRouter from './routes/damage-reports'

// Trip & Route Management Routes
import routeEmulatorRouter from './routes/route-emulator.routes'
import routesRouter from './routes/routes'
import tripUsageRouter from './routes/trip-usage'

// Safety & Compliance Routes
import safetyIncidentsRouter from './routes/safety-incidents'
import oshaComplianceRouter from './routes/osha-compliance'

// Policy & Permission Routes
import policiesRouter from './routes/policies'
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

// System Management Routes
import monitoringRouter from './routes/monitoring'
import healthRouter from './routes/health.routes' // Comprehensive health checks (BACKEND-12)
import healthMicrosoftRouter from './routes/health-microsoft.routes' // Microsoft-specific health
import healthDetailedRouter from './routes/health-detailed'
import performanceRouter from './routes/performance.routes'
import telemetryRouter from './routes/telemetry'
import queueRouter from './routes/queue.routes'
import deploymentsRouter from './routes/deployments'
import facilitiesRouter from './routes/facilities'
import searchRouter from './routes/search'
import presenceRouter from './routes/presence.routes'
import storageAdminRouter from './routes/storage-admin'
import syncRouter from './routes/sync.routes'
import qualityGatesRouter from './routes/quality-gates'
import reservationsRouter from './routes/reservations.routes'
import { telemetryMiddleware, errorTelemetryMiddleware, performanceMiddleware } from './middleware/telemetry'

// Logging Middleware
import { requestLogger, errorLogger, memoryMonitor } from './middleware/logging'

// Job Processing Infrastructure
import { emailQueue, notificationQueue, reportQueue, closeAllQueues } from './jobs/queue'
import { processEmailJob } from './jobs/processors/email.processor'
import { processNotificationJob } from './jobs/processors/notification.processor'
import { processReportJob } from './jobs/processors/report.processor'
import logger from './utils/logger'

const app = express()

// Structured logging with Winston
logger.info('Fleet API Server initializing', { node: process.version, env: process.env.NODE_ENV })
const PORT = process.env.PORT || 3001

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
// Helmet security headers
app.use(helmet({
  contentSecurityPolicy: false, // Using custom CSP
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true }
}));

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

// 3. Body Parsers - After security headers and CORS
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// 4. Global Rate Limiting - Apply to all routes to prevent DoS attacks
app.use(globalLimiter)

// ===========================================================================
// LOGGING MIDDLEWARE (BACKEND-20, BACKEND-11)
// ===========================================================================

// 5. Request logging - Correlation ID, request/response tracking, timing
app.use(requestLogger)

// 6. Memory monitoring - Periodic memory usage checks
app.use(memoryMonitor)

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

// ===========================================================================
// DEPRECATION MIDDLEWARE - Warn clients about deprecated /api routes
// ===========================================================================
const deprecationWarning = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!req.url.startsWith('/api/v1')) {
    res.set('Deprecation', 'true')
    res.set('Sunset', '2025-06-01')
    res.set('Link', `</api/v1${req.url}>; rel="successor-version"`)
  }
  next()
}

// Apply deprecation headers to all /api routes (not /api/v1)
app.use('/api', deprecationWarning)

// CSRF Token endpoint
app.get('/api/csrf-token', csrfProtection, getCsrfToken)
app.get('/api/v1/csrf-token', csrfProtection, getCsrfToken)
app.get('/api/csrf', csrfProtection, getCsrfToken)

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

  // Debug endpoint to verify tenant context (development only)
  app.get('/api/debug/tenant-context', authenticateJWT, setTenantContext, debugTenantContext)
}

// ============================================================================
// AUTHENTICATION AND TENANT CONTEXT (Applied to all protected API routes)
// ============================================================================

// Public routes that don't require authentication (must be registered BEFORE middleware)
app.use('/api/auth', authRouter)
app.use('/api/microsoft-auth', microsoftAuthRouter)

// CRITICAL SECURITY: Apply authentication and tenant context to ALL remaining /api routes
// This ensures Row-Level Security (RLS) is enforced for multi-tenant isolation
// Order is critical:
//   1. authenticateJWT - validates JWT token and sets req.user
//   2. setTenantContext - sets PostgreSQL session variable for RLS
logger.info('🔐 Applying authentication and tenant context middleware to all /api/* routes')
app.use('/api', authenticateJWT, setTenantContext)

// ============================================================================
// API ROUTE REGISTRATIONS - V1 (Versioned)
// ============================================================================

// Core Fleet Management Routes - V1
app.use('/api/v1/vehicles', vehiclesRouter)
app.use('/api/v1/drivers', driversRouter)
app.use('/api/v1/fuel-transactions', fuelRouter)
app.use('/api/v1/maintenance', maintenanceRouter)
app.use('/api/v1/incidents', incidentsRouter)
app.use('/api/v1/parts', partsRouter)
app.use('/api/v1/vendors', vendorsRouter)
app.use('/api/v1/invoices', invoicesRouter)
app.use('/api/v1/purchase-orders', purchaseOrdersRouter)
app.use('/api/v1/tasks', tasksRouter)

// Asset Management Routes - V1
app.use('/api/v1/assets', assetManagementRouter)
app.use('/api/v1/asset-analytics', assetAnalyticsRouter)
app.use('/api/v1/assets-mobile', assetsMobileRouter)
app.use('/api/v1/heavy-equipment', heavyEquipmentRouter)

// Dispatch & Communication Routes - V1
app.use('/api/v1/communication-logs', communicationLogsRouter)
app.use('/api/v1/teams', teamsRouter)

// GPS & Tracking Routes - V1
app.use('/api/v1/gps', gpsRouter)
app.use('/api/v1/geofences', geofencesRouter)
app.use('/api/v1/telematics', telematicsRouter)
app.use('/api/v1/vehicle-idling', vehicleIdlingRouter)

// Maintenance & Inspection Routes - V1
app.use('/api/v1/maintenance-schedules', maintenanceSchedulesRouter)
app.use('/api/v1/inspections', inspectionsRouter)
app.use('/api/v1/work-orders', workOrdersRouter)

// EV Management Routes - V1
app.use('/api/v1/ev-management', evManagementRouter)
app.use('/api/v1/charging-sessions', chargingSessionsRouter)
app.use('/api/v1/charging-stations', chargingStationsRouter)

// Document Management Routes - V1
app.use('/api/v1/documents', documentsRouter)
app.use('/api/v1/fleet-documents', fleetDocumentsRouter)
app.use('/api/v1/attachments', attachmentsRouter)
app.use('/api/v1/ocr', ocrRouter)

// Financial & Cost Management Routes - V1
app.use('/api/v1/costs', costsRouter)
app.use('/api/v1/cost-analysis', costAnalysisRouter)
app.use('/api/v1/cost-benefit-analysis', costBenefitAnalysisRouter)
app.use('/api/v1/billing-reports', billingReportsRouter)
app.use('/api/v1/mileage-reimbursement', mileageReimbursementRouter)
app.use('/api/v1/personal-use-charges', chargesRouter)
app.use('/api/v1/personal-use-policies', personalUsePoliciesRouter)
app.use('/api/v1/fuel-purchasing', fuelPurchasingRouter)

// Reporting & Analytics Routes - V1
app.use('/api/v1/executive-dashboard', executiveDashboardRouter)
app.use('/api/v1/custom-reports', customReportsRouter)
app.use('/api/v1/assignment-reporting', assignmentReportingRouter)
app.use('/api/v1/driver-scorecard', driverScorecardRouter)

// AI & Automation Routes - V1
app.use('/api/v1/ai-insights', aiInsightsRouter)
app.use('/api/v1/ai-search', aiSearchRouter)
app.use('/api/v1/ai-task-asset', aiTaskAssetRouter)
app.use('/api/v1/ai-tasks', aiTaskPrioritizationRouter)
app.use('/api/v1/langchain', langchainRouter)
app.use('/api/v1/fleet-optimizer', fleetOptimizerRouter)

// Task & Schedule Management Routes - V1
app.use('/api/v1/scheduling', schedulingRouter)
app.use('/api/v1/calendar', calendarRouter)
app.use('/api/v1/on-call-management', onCallManagementRouter)

// Mobile & Integration Routes - V1
app.use('/api/v1/mobile-assignment', mobileAssignmentRouter)
app.use('/api/v1/mobile-hardware', mobileHardwareRouter)
app.use('/api/v1/mobile-integration', mobileIntegrationRouter)
app.use('/api/v1/mobile-messaging', mobileMessagingRouter)
app.use('/api/v1/mobile-notifications', mobileNotificationsRouter)
app.use('/api/v1/mobile-obd2', mobileObd2Router)
app.use('/api/v1/mobile-ocr', mobileOcrRouter)
app.use('/api/v1/mobile-photos', mobilePhotosRouter)
app.use('/api/v1/mobile-trips', mobileTripsRouter)
app.use('/api/v1/push-notifications', pushNotificationsRouter)

// Vehicle Management Routes - V1
app.use('/api/v1/vehicle-assignments', vehicleAssignmentsRouter)
app.use('/api/v1/vehicle-history', vehicleHistoryRouter)
app.use('/api/v1/vehicle-identification', vehicleIdentificationRouter)
app.use('/api/v1/vehicle-3d', vehicle3dRouter)
app.use('/api/v1/damage', damageRouter)
app.use('/api/v1/damage-reports', damageReportsRouter)

// Trip & Route Management Routes - V1
app.use('/api/v1/routes', routeEmulatorRouter)
app.use('/api/v1/fleet-routes', routesRouter)
app.use('/api/v1/trip-usage', tripUsageRouter)

// Safety & Compliance Routes - V1
app.use('/api/v1/safety-incidents', safetyIncidentsRouter)
app.use('/api/v1/osha-compliance', oshaComplianceRouter)
app.use('/api/v1/annual-reauthorization', annualReauthorizationRouter)

// Policy & Permission Routes - V1
app.use('/api/v1/policies', policiesRouter)
app.use('/api/v1/permissions', permissionsRouter)

// Authentication & User Management Routes - V1
app.use('/api/v1/auth', authRouter)
app.use('/api/v1/auth', sessionRevocationRouter) // Session revocation endpoints (/revoke, /revoke/status)
app.use('/api/v1/microsoft-auth', microsoftAuthRouter)
app.use('/api/v1/break-glass', breakGlassRouter)

// External Integrations Routes - V1
app.use('/api/v1/smartcar', smartcarRouter)
app.use('/api/v1/arcgis-layers', arcgisLayersRouter)
app.use('/api/v1/outlook', outlookRouter)
app.use('/api/v1/video-events', videoEventsRouter)
app.use('/api/v1/video-telematics', videoTelematicsRouter)

// Emulator & Testing Routes - V1
app.use('/api/v1/emulator', emulatorRouter)
app.use('/api/v1/obd2-emulator', obd2EmulatorRouter)

// System Management Routes - V1
app.use('/api/v1/monitoring', monitoringRouter)
app.use('/api/v1/health', healthRouter) // Comprehensive health (BACKEND-12)
app.use('/api/v1/health/microsoft', healthMicrosoftRouter) // Microsoft integration health
app.use('/api/v1/health-detailed', healthDetailedRouter)
app.use('/api/v1/performance', performanceRouter)
app.use('/api/v1/telemetry', telemetryRouter)
app.use('/api/v1/queue', queueRouter)
app.use('/api/v1/deployments', deploymentsRouter)
app.use('/api/v1/facilities', facilitiesRouter)
app.use('/api/v1/search', searchRouter)
app.use('/api/v1/presence', presenceRouter)
app.use('/api/v1/storage-admin', storageAdminRouter)
app.use('/api/v1/sync', syncRouter)
app.use('/api/v1/quality-gates', qualityGatesRouter)
app.use('/api/v1/reservations', reservationsRouter)
app.use('/api/v1/admin/jobs', adminJobsRouter)

// ============================================================================
// API ROUTE REGISTRATIONS - DEPRECATED (Backward Compatibility)
// ============================================================================
// NOTE: These routes are DEPRECATED and will be removed on 2025-06-01
// All clients should migrate to /api/v1/* endpoints
// Deprecation headers are automatically added by middleware above

// Core Fleet Management Routes - DEPRECATED
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

// Asset Management Routes - DEPRECATED
app.use('/api/assets', assetManagementRouter)
app.use('/api/asset-analytics', assetAnalyticsRouter)
app.use('/api/assets-mobile', assetsMobileRouter)
app.use('/api/heavy-equipment', heavyEquipmentRouter)

// Dispatch & Communication Routes - DEPRECATED
app.use('/api/communication-logs', communicationLogsRouter)
app.use('/api/teams', teamsRouter)

// GPS & Tracking Routes - DEPRECATED
app.use('/api/gps', gpsRouter)
app.use('/api/geofences', geofencesRouter)
app.use('/api/telematics', telematicsRouter)
app.use('/api/vehicle-idling', vehicleIdlingRouter)

// Maintenance & Inspection Routes - DEPRECATED
app.use('/api/maintenance-schedules', maintenanceSchedulesRouter)
app.use('/api/inspections', inspectionsRouter)
app.use('/api/work-orders', workOrdersRouter)

// EV Management Routes - DEPRECATED
app.use('/api/ev-management', evManagementRouter)
app.use('/api/charging-sessions', chargingSessionsRouter)
app.use('/api/charging-stations', chargingStationsRouter)

// Document Management Routes - DEPRECATED
app.use('/api/documents', documentsRouter)
app.use('/api/fleet-documents', fleetDocumentsRouter)
app.use('/api/attachments', attachmentsRouter)
app.use('/api/ocr', ocrRouter)

// Financial & Cost Management Routes - DEPRECATED
app.use('/api/costs', costsRouter)
app.use('/api/cost-analysis', costAnalysisRouter)
app.use('/api/cost-benefit-analysis', costBenefitAnalysisRouter)
app.use('/api/billing-reports', billingReportsRouter)
app.use('/api/mileage-reimbursement', mileageReimbursementRouter)
app.use('/api/personal-use-charges', chargesRouter)
app.use('/api/personal-use-policies', personalUsePoliciesRouter)
app.use('/api/fuel-purchasing', fuelPurchasingRouter)

// Reporting & Analytics Routes - DEPRECATED
app.use('/api/executive-dashboard', executiveDashboardRouter)
app.use('/api/custom-reports', customReportsRouter)
app.use('/api/assignment-reporting', assignmentReportingRouter)
app.use('/api/driver-scorecard', driverScorecardRouter)

// AI & Automation Routes - DEPRECATED
app.use('/api/ai-insights', aiInsightsRouter)
app.use('/api/ai-search', aiSearchRouter)
app.use('/api/ai-task-asset', aiTaskAssetRouter)
app.use('/api/ai-tasks', aiTaskPrioritizationRouter)
app.use('/api/langchain', langchainRouter)
app.use('/api/fleet-optimizer', fleetOptimizerRouter)

// Task & Schedule Management Routes - DEPRECATED
app.use('/api/scheduling', schedulingRouter)
app.use('/api/calendar', calendarRouter)
app.use('/api/on-call-management', onCallManagementRouter)

// Mobile & Integration Routes - DEPRECATED
app.use('/api/mobile-assignment', mobileAssignmentRouter)
app.use('/api/mobile-hardware', mobileHardwareRouter)
app.use('/api/mobile-integration', mobileIntegrationRouter)
app.use('/api/mobile-messaging', mobileMessagingRouter)
app.use('/api/mobile-notifications', mobileNotificationsRouter)
app.use('/api/mobile-obd2', mobileObd2Router)
app.use('/api/mobile-ocr', mobileOcrRouter)
app.use('/api/mobile-photos', mobilePhotosRouter)
app.use('/api/mobile-trips', mobileTripsRouter)
app.use('/api/push-notifications', pushNotificationsRouter)

// Vehicle Management Routes - DEPRECATED
app.use('/api/vehicle-assignments', vehicleAssignmentsRouter)
app.use('/api/vehicle-history', vehicleHistoryRouter)
app.use('/api/vehicle-identification', vehicleIdentificationRouter)
app.use('/api/vehicle-3d', vehicle3dRouter)
app.use('/api/damage', damageRouter)
app.use('/api/damage-reports', damageReportsRouter)

// Trip & Route Management Routes - DEPRECATED
app.use('/api/routes', routeEmulatorRouter)
app.use('/api/fleet-routes', routesRouter)
app.use('/api/trip-usage', tripUsageRouter)

// Safety & Compliance Routes - DEPRECATED
app.use('/api/safety-incidents', safetyIncidentsRouter)
app.use('/api/osha-compliance', oshaComplianceRouter)
app.use('/api/annual-reauthorization', annualReauthorizationRouter)

// Policy & Permission Routes - DEPRECATED
app.use('/api/policies', policiesRouter)
app.use('/api/permissions', permissionsRouter)

// Authentication & User Management Routes - DEPRECATED
app.use('/api/auth', authRouter)
app.use('/api/auth', sessionRevocationRouter) // Session revocation endpoints (/revoke, /revoke/status)
app.use('/api/microsoft-auth', microsoftAuthRouter)
app.use('/api/break-glass', breakGlassRouter)

// External Integrations Routes - DEPRECATED
app.use('/api/smartcar', smartcarRouter)
app.use('/api/arcgis-layers', arcgisLayersRouter)
app.use('/api/outlook', outlookRouter)
app.use('/api/video-events', videoEventsRouter)
app.use('/api/video-telematics', videoTelematicsRouter)

// Emulator & Testing Routes - DEPRECATED
app.use('/api/emulator', emulatorRouter)
app.use('/api/obd2-emulator', obd2EmulatorRouter)

// System Management Routes - DEPRECATED (use /api/v1 instead)
app.use('/api/monitoring', monitoringRouter)
app.use('/api/health', healthRouter) // Comprehensive health (BACKEND-12)
app.use('/api/health/microsoft', healthMicrosoftRouter) // Microsoft integration health
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

// ===========================================================================
// ERROR HANDLING MIDDLEWARE (Must be last)
// ===========================================================================

// 1. Error logging - Log all errors with correlation ID (BACKEND-20, BACKEND-11)
app.use(errorLogger)

// 2. Error telemetry middleware
app.use(errorTelemetryMiddleware)

// 3. ARCHITECTURE FIX: Add custom error handler BEFORE Sentry
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

  logger.info('✅ Bull job processors initialized')
  logger.info('  - Email queue: ready')
  logger.info('  - Notification queue: ready')
  logger.info('  - Report queue: ready')
}

const server = app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`)
  console.log(`📊 Application Insights: ${telemetryService.isActive() ? 'Enabled' : 'Disabled'}`)
  console.log(`🔍 Sentry: ${process.env.SENTRY_DSN ? 'Enabled' : 'Disabled (no DSN configured)'}`)
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)

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
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('📊 SIGTERM signal received: flushing telemetry and closing server')

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
  console.log('📊 SIGINT signal received: flushing telemetry and closing server')

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