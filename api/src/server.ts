// Initialize environment variables FIRST
import 'dotenv/config'
// Initialize monitoring services FIRST (before other imports)
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import { pool } from './db'
import { TelemetryService } from './services/TelemetryService'
import obd2EmulatorService from './services/obd2-emulator.service'
import { DispatchService } from './services/dispatch.service'

import { initializeConnectionManager } from './config/connection-manager' // Import connection manager initialization
import { processEmailJob } from './jobs/processors/email.processor'
import { processNotificationJob } from './jobs/processors/notification.processor'
import { processReportJob } from './jobs/processors/report.processor'
import { emailQueue, notificationQueue, reportQueue, closeAllQueues } from './jobs/queue'
import { getCorsConfig, validateCorsConfiguration } from './middleware/corsConfig'
import { getCsrfToken } from './middleware/csrf'
import { errorHandler } from './middleware/errorHandler'
import requestIdMiddleware from './middleware/request-id'
import { formatResponse } from './middleware/response-formatter'
import { initializeProcessErrorHandlers } from './middleware/processErrorHandlers'
import { globalLimiter } from './middleware/rateLimiter'
import { securityHeaders } from './middleware/security-headers'
import {
  sentryRequestHandler,
  sentryTracingHandler,
  sentryErrorHandler,
  notFoundHandler
} from './middleware/sentryErrorHandler'
import { telemetryMiddleware, errorTelemetryMiddleware } from './middleware/telemetry'
import telemetryService from './monitoring/applicationInsights'
import { sentryService } from './monitoring/sentry'


// Security middleware

// Core Fleet Management Routes
import adminJobsRouter from './routes/admin-jobs.routes'
// DISABLED: import aiInsightsRouter from './routes/ai-insights.routes'
// DISABLED: import attachmentsRouter from './routes/attachments.routes'
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

// Financial & Cost Management Routes
import accountsPayableRouter from './routes/accounts-payable'
import costAnalysisRouter from './routes/cost-analysis.routes'
import costBenefitAnalysisRouter from './routes/cost-benefit-analysis.routes'
import costsRouter from './routes/costs'

// Reporting & Analytics Routes

// AI & Automation Routes
import aiChatRouter from './routes/ai-chat'
import aiDamageDetectionRouter from './routes/ai-damage-detection.routes'
import aiSearchRouter from './routes/ai-search'
import aiTaskAssetRouter from './routes/ai-task-asset.routes'
import aiTaskPrioritizationRouter from './routes/ai-task-prioritization.routes'
// TEMP DISABLED: import alertsRouter from './routes/alerts.routes'
import annualReauthorizationRouter from './routes/annual-reauthorization.routes'
import analyticsRouter from './routes/analytics'
import arcgisLayersRouter from './routes/arcgis-layers'
import assetAnalyticsRouter from './routes/asset-analytics.routes'
import assetManagementRouter from './routes/asset-management.routes'
import assetsMobileRouter from './routes/assets-mobile.routes'
import assignmentReportingRouter from './routes/assignment-reporting.routes'
import auditLogsRouter from './routes/audit-logs'
import authRouter from './routes/auth'

// Task & Schedule Management Routes

// Mobile & Integration Routes

// Vehicle Management Routes
import damageRouter from './routes/damage'
import damageReportsRouter from './routes/damage-reports'

// Trip & Route Management Routes

// Safety & Compliance Routes

// Policy & Permission Routes

// Authentication & User Management Routes

// External Integrations Routes

// Emulator & Testing Routes

// System Management Routes
import telemetryRouter from './routes/telemetry'
import queueRouter from './routes/queue.routes'
import deploymentsRouter from './routes/deployments'
import documentsRouter from './routes/documents'
import driverScorecardRouter from './routes/driver-scorecard.routes'
import driversRouter from './routes/drivers'
import evManagementRouter from './routes/ev-management.routes'
import executiveDashboardRouter from './routes/executive-dashboard.routes'
import dashboardRouter from './routes/dashboard.routes'
import facilitiesRouter from './routes/facilities'
import serviceBaysRouter from './routes/service-bays'
import fleetDocumentsRouter from './routes/fleet-documents.routes'
import fleetRouter from './routes/fleet'
import emulatorRouter from './routes/emulator.routes'
import fuelRouter from './routes/fuel-transactions'
import fuelCardsRouter from './routes/fuel-cards'
import tiresRouter from './routes/tires'
import insuranceRouter from './routes/insurance'
import vehicleContractsRouter from './routes/vehicle-contracts'
import vendorManagementRouter from './routes/vendor-management'
import geofencesRouter from './routes/geofences'
import gpsRouter from './routes/gps'
import healthDetailedRouter from './routes/health-detailed'
import healthSystemRouter from './routes/health-system.routes' // Comprehensive system health (BACKEND-12)
import healthRouter from './routes/health.routes' // Microsoft integration health
import heavyEquipmentRouter from './routes/heavy-equipment.routes'
import incidentsRouter from './routes/incidents'
import incidentManagementRouter from './routes/incident-management'
import inspectionsRouter from './routes/inspections-simple'
import hazardZonesRouter from './routes/hazard-zones'
import invoicesRouter from './routes/invoices'
import integrationsHealthRouter from './routes/integrations-health'
import lidarRouter from './routes/lidar.routes'
import maintenanceRouter from './modules/maintenance/routes/maintenance.routes'
import maintenanceDrilldownsRouter from './routes/maintenance-drilldowns'
import maintenanceSchedulesRouter from './routes/maintenance-schedules'
import maintenanceRequestsRouter from './routes/maintenance-requests'
import microsoftAuthRouter from './routes/microsoft-auth'
import mileageReimbursementRouter from './routes/mileage-reimbursement'
import meRouter from './routes/me'
import mobileAssignmentRouter from './routes/mobile-assignment.routes'
import mobileHardwareRouter from './routes/mobile-hardware.routes'
import mobileIntegrationRouter from './routes/mobile-integration.routes'
import mobileMessagingRouter from './routes/mobile-messaging.routes'
import mobilePhotosRouter from './routes/mobile-photos.routes'
import mobileTripsRouter from './routes/mobile-trips.routes'
import monitoringRouter from './routes/monitoring'
import obd2EmulatorRouter, { setupOBD2WebSocket } from './routes/obd2-emulator.routes'
import dispatchRouter from './routes/dispatch.routes'
import onCallManagementRouter from './routes/on-call-management.routes'
import oshaComplianceRouter from './routes/osha-compliance'
import outlookRouter from './routes/outlook.routes'
import partsRouter from './routes/parts'
import flairExpensesRouter from './routes/flair-expenses'
import warrantyRecallsRouter from './routes/warranty-recalls'
import trainingRouter from './routes/training.routes'
import securityEventsRouter from './routes/security-events'
import certificationsRouter from './routes/certifications'
// REMOVED: import performanceRouter from './routes/performance.routes'
import permissionsRouter from './routes/permissions'
import chargesRouter from './routes/personal-use-charges'
import personalUsePoliciesRouter from './routes/personal-use-policies'
import policiesRouter from './routes/policies'

// Missing importers
import alertsRouter from './routes/alerts.routes'
import complianceRouter from './routes/compliance'
import inventoryRouter from './routes/inventory.routes'
// monitoringRouter imported in separate block
import { initializeBudgetRoutes } from './routes/budgets'
import reportsRouter from './routes/reports.routes'
import reservationsRouter from './routes/reservations.routes'
import policyTemplatesRouter from './routes/policy-templates'
import presenceRouter from './routes/presence.routes'
import purchaseOrdersRouter from './routes/purchase-orders'
import pushNotificationsRouter from './routes/push-notifications.routes'
import notificationsRouter from './routes/notifications'
import qualityGatesRouter from './routes/quality-gates'
// import routeEmulatorRouter from './routes/route-emulator.routes'
import routesRouter from './routes/routes'
import safetyIncidentsRouter from './routes/safety-incidents'
import tripsRouter from './routes/trips'
import safetyAlertsRouter from './routes/safety-alerts'
import schedulingRouter from './routes/scheduling.routes'
import searchRouter from './routes/search'
import sessionRevocationRouter from './routes/session-revocation'
import sessionsRouter from './routes/sessions'
import smartcarRouter from './routes/smartcar.routes'
import storageAdminRouter from './routes/storage-admin'
import syncRouter from './routes/sync.routes'
import tasksRouter from './routes/tasks'
import taskManagementRouter from './routes/task-management.routes'
import teamsRouter from './routes/teams.routes'
import tenantsRouter from './routes/tenants'
import systemMetricsRouter from './routes/system-metrics'
import telematicsRouter from './routes/telematics.routes'
import trafficCamerasRouter from './routes/traffic-cameras'
import tripUsageRouter from './routes/trip-usage'
import predictiveMaintenanceRouter from './routes/predictive-maintenance'
import usersRouter from './routes/users'
import vehicle3dRouter from './routes/vehicle-3d.routes'
import vehicleAssignmentsRouter from './routes/vehicle-assignments.routes'
import vehicleHistoryRouter from './routes/vehicle-history.routes'
import vehicleIdlingRouter from './routes/vehicle-idling.routes'
import vehiclesRouter from './routes/vehicles'
import vendorsRouter from './routes/vendors'
import videoEventsRouter from './routes/video-events'
import videoTelematicsRouter from './routes/video-telematics.routes'
import workOrdersRouter from './routes/work-orders'

// E2E Testing Routes (DEVELOPMENT ONLY - NO AUTH)
import e2eTestRouter from './routes/e2e-test.routes'

// Job Processing Infrastructure
import logger from './utils/logger'

console.log('--- SERVER STARTING DEBUG ---')
// Initialize Datadog APM FIRST (must be before ALL other imports)
// TODO: Re-enable when dd-trace package is properly installed
console.log('Datadog APM disabled')
// TEMP: Disabled telemetry to resolve initialization loop
// telemetryService.initialize()

// ARCHITECTURE FIX: Import new error handling infrastructure

// Initialize Sentry
// TEMP: Disabled to resolve initialization loop
// sentryService.init()

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

// 3.6 Request ID - Traceability for logs and response metadata
app.use(requestIdMiddleware)

// 4. Global Rate Limiting - Apply to all routes to prevent DoS attacks
app.use(globalLimiter)

// 4.5 Standard response envelope
app.use(formatResponse)

// Add telemetry middleware
app.use(telemetryMiddleware)

// DEVELOPMENT ONLY: Auth bypass for local testing
// Sets req.user so authenticateJWT middleware skips JWT validation
// SECURITY: Triple-gated - NODE_ENV + SKIP_AUTH + not production
if (process.env.NODE_ENV !== 'production' && process.env.SKIP_AUTH === 'true') {
  console.log('[DEV] Auth bypass middleware enabled - all API requests will use dev user')
  app.use((req: any, _res: any, next: any) => {
    if (req.path.startsWith('/api/') && !req.path.startsWith('/api/auth/') && !req.path.startsWith('/api/csrf')) {
      req.user = {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'dev@fleetcta.local',
        role: 'SuperAdmin',
        tenant_id: '8e33a492-9b42-4e7a-8654-0572c9773b71',
        scope_level: 'global',
        userId: '00000000-0000-0000-0000-000000000001',
        tenantId: '8e33a492-9b42-4e7a-8654-0572c9773b71',
        name: 'Dev User',
      }
    }
    next()
  })
}

// REMOVED: Performance monitoring sample logic

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

// Legacy compatibility: current-user endpoints
app.use('/api/v1/me', meRouter)

// Core Fleet Management Routes
app.use('/api/alerts', alertsRouter)
app.use('/api/vehicles', vehiclesRouter)
app.use('/api/drivers', driversRouter)
app.use('/api/fuel-transactions', fuelRouter)
app.use('/api/fuel-cards', fuelCardsRouter)
app.use('/api/fuel-card-transactions', fuelCardsRouter) // Same router handles both paths
app.use('/api/tires', tiresRouter)
app.use('/api/insurance', insuranceRouter)
app.use('/api/accounts-payable', accountsPayableRouter)
app.use('/api/vehicle-contracts', vehicleContractsRouter)
app.use('/api/vendor-management', vendorManagementRouter)
app.use('/api/maintenance', maintenanceRouter)
app.use('/api/incidents', incidentsRouter)
app.use('/api/incident-management', incidentManagementRouter)
app.use('/api/parts', partsRouter)
app.use('/api/inventory', inventoryRouter) // Registered here as core
app.use('/api/vendors', vendorsRouter)
app.use('/api/invoices', invoicesRouter)
app.use('/api/purchase-orders', purchaseOrdersRouter)
app.use('/api/tasks', tasksRouter)
app.use('/api/task-management', taskManagementRouter)
app.use('/api/reservations', reservationsRouter)
// TEMP DISABLED: app.use('/api/hos', hosRouter)  // TODO: Import hosRouter from './routes/hos.routes'

// Asset Management Routes
app.use('/api/analytics', analyticsRouter)
app.use('/api/assets', assetManagementRouter)
app.use('/api/asset-analytics', assetAnalyticsRouter)
app.use('/api/assets-mobile', assetsMobileRouter)
app.use('/api/heavy-equipment', heavyEquipmentRouter)

// Dispatch & Communication Routes
app.use('/api/communication-logs', communicationLogsRouter)
app.use('/api/teams', teamsRouter)
app.use('/api/tenants', tenantsRouter)
app.use('/api/notifications', notificationsRouter)
app.use('/api/users', usersRouter)
app.use('/api/audit-logs', auditLogsRouter)
app.use('/api/sessions', sessionsRouter)
app.use('/api/system', systemMetricsRouter)

// GPS & Tracking Routes
app.use('/api/gps', gpsRouter)
app.use('/api/geofences', geofencesRouter)
app.use('/api/telematics', telematicsRouter)
app.use('/api/traffic-cameras', trafficCamerasRouter)
app.use('/api/vehicle-idling', vehicleIdlingRouter)

// Maintenance & Inspection Routes
app.use('/api/maintenance-schedules', maintenanceSchedulesRouter)
app.use('/api/maintenance-requests', maintenanceRequestsRouter)
app.use('/api/maintenance/drilldowns', maintenanceDrilldownsRouter)
app.use('/api/inspections', inspectionsRouter)
app.use('/api/work-orders', workOrdersRouter)

// EV Management Routes
app.use('/api/ev-management', evManagementRouter)
app.use('/api/charging-sessions', chargingSessionsRouter)
app.use('/api/charging-stations', chargingStationsRouter)
app.use('/api/predictive-maintenance', predictiveMaintenanceRouter)

// Document Management Routes
app.use('/api/documents', documentsRouter)
app.use('/api/fleet-documents', fleetDocumentsRouter)
app.use('/api/fleet', fleetRouter)

// Financial & Cost Management Routes
app.use('/api/costs', costsRouter)
app.use('/api/cost-analysis', costAnalysisRouter)
app.use('/api/cost-benefit-analysis', costBenefitAnalysisRouter)
app.use('/api/billing-reports', billingReportsRouter)
app.use('/api/mileage-reimbursement', mileageReimbursementRouter)
app.use('/api/personal-use-charges', chargesRouter)
app.use('/api/personal-use-policies', personalUsePoliciesRouter)
app.use('/api/flair', flairExpensesRouter)

// Reporting & Analytics Routes
app.use('/api/executive-dashboard', executiveDashboardRouter)
app.use('/api/assignment-reporting', assignmentReportingRouter)
app.use('/api/driver-scorecard', driverScorecardRouter)

// AI & Automation Routes
app.use('/api/ai/chat', aiChatRouter) // AI Chat interface for document Q&A
app.use('/api/ai-search', aiSearchRouter)
app.use('/api/ai-task-asset', aiTaskAssetRouter)
app.use('/api/ai-tasks', aiTaskPrioritizationRouter)

// Task & Schedule Management Routes
app.use('/api/scheduling', schedulingRouter)
app.use('/api/calendar', calendarRouter)
app.use('/api/on-call-management', onCallManagementRouter)

// Mobile & Integration Routes
app.use('/api/mobile-assignment', mobileAssignmentRouter)
app.use('/api/mobile-hardware', mobileHardwareRouter)
app.use('/api/mobile-integration', mobileIntegrationRouter)
app.use('/api/mobile-messaging', mobileMessagingRouter)
app.use('/api/mobile-photos', mobilePhotosRouter)
app.use('/api/mobile-trips', mobileTripsRouter)
app.use('/api/push-notifications', pushNotificationsRouter)

// Vehicle Management Routes
app.use('/api/vehicle-assignments', vehicleAssignmentsRouter)
app.use('/api/vehicle-history', vehicleHistoryRouter)
app.use('/api/vehicle-3d', vehicle3dRouter)
app.use('/api/damage', damageRouter)
app.use('/api/damage-reports', damageReportsRouter)
app.use('/api/ai/damage-detection', aiDamageDetectionRouter)
app.use('/api/lidar', lidarRouter)

// Trip & Route Management Routes
app.use('/api/routes', routesRouter)
app.use('/api/trips', tripsRouter)
// app.use('/api/route-emulator', routeEmulatorRouter)
app.use('/api/trip-usage', tripUsageRouter)

// Safety & Compliance Routes
app.use('/api/safety-incidents', safetyIncidentsRouter)
app.use('/api/hazard-zones', hazardZonesRouter)
app.use('/api/safety-alerts', safetyAlertsRouter)
app.use('/api/osha-compliance', oshaComplianceRouter)
app.use('/api/compliance', complianceRouter)
app.use('/api/annual-reauthorization', annualReauthorizationRouter)
app.use('/api/training', trainingRouter)
app.use('/api/certifications', certificationsRouter)

// Policy & Permission Routes
app.use('/api/policies', policiesRouter)
app.use('/api/policy-templates', policyTemplatesRouter)
app.use('/api/permissions', permissionsRouter)

// Reporting
app.use('/api/reports', reportsRouter)

// Authentication & User Management Routes
app.use('/api/auth', authRouter)
app.use('/auth', authRouter) // Alias without /api prefix for backward compatibility
app.use('/api/auth', microsoftAuthRouter) // Microsoft SSO: /microsoft, /microsoft/callback
app.use('/auth', microsoftAuthRouter) // Microsoft SSO without /api prefix for frontend calls
app.use('/api/auth', sessionRevocationRouter) // Session revocation endpoints (/revoke, /revoke/status)
app.use('/api/break-glass', breakGlassRouter)

// External Integrations Routes
app.use('/api/smartcar', smartcarRouter)
app.use('/api/arcgis-layers', arcgisLayersRouter)
app.use('/api/outlook', outlookRouter)
app.use('/api/video-events', videoEventsRouter)
app.use('/api/video-telematics', videoTelematicsRouter)
app.use('/api/warranty', warrantyRecallsRouter)
app.use('/api/integrations', integrationsHealthRouter)

// Dashboard API Routes (Role-Based Dashboards)
app.use('/api/dashboard', dashboardRouter)

// Emulator & Testing Routes
app.use('/api/emulator', emulatorRouter)
app.use('/api/obd2-emulator', obd2EmulatorRouter)
app.use('/api/dispatch', dispatchRouter)
// app.use('/api/demo', demoRouter) // REMOVED: demo routes deleted during mock data cleanup

// System Management Routes
app.use('/api/monitoring', monitoringRouter)
app.use('/api/health', healthSystemRouter) // Comprehensive system health (BACKEND-12)
app.use('/api/health/microsoft', healthRouter) // Microsoft integration health
// TEMP DISABLED: app.use('/api/health', healthStartupRouter) // TODO: Import healthStartupRouter from './routes/health-startup.routes'
app.use('/api/health-detailed', healthDetailedRouter)
// REMOVED: app.use('/api/performance', performanceRouter)
app.use('/api/telemetry', telemetryRouter)
app.use('/api/security', securityEventsRouter)
app.use('/api/queue', queueRouter)
app.use('/api/deployments', deploymentsRouter)
app.use('/api/facilities', facilitiesRouter)
app.use('/api/service-bays', serviceBaysRouter)
app.use('/api/search', searchRouter)
app.use('/api/presence', presenceRouter)
app.use('/api/storage-admin', storageAdminRouter)
app.use('/api/sync', syncRouter)
app.use('/api/quality-gates', qualityGatesRouter)
// TEMP DISABLED: app.use('/api/reservations', reservationsRouter) // TODO: Import reservationsRouter
app.use('/api/admin/jobs', adminJobsRouter)

// E2E Test Routes - explicit opt-in only (no authentication required)
// Never enable by default (even in development) so demos don't accidentally expose these endpoints.
if (process.env.ENABLE_E2E_ROUTES === 'true' && process.env.NODE_ENV !== 'production') {
  app.use('/api/e2e-test', e2eTestRouter)
  console.log('⚠️  E2E Test routes enabled at /api/e2e-test (NO AUTHENTICATION)')
}

// Route aliases for frontend compatibility
app.use('/api/garage-bays', serviceBaysRouter)
app.use('/api', initializeBudgetRoutes(pool))

// 404 handler - must come before error handlers
app.use(notFoundHandler())

// Add error telemetry middleware
app.use(errorTelemetryMiddleware)

// ARCHITECTURE FIX: Add custom error handler BEFORE Sentry
// This handles ApplicationError instances with proper status codes
app.use(errorHandler)

// Sentry error handler must be the last middleware
app.use(sentryErrorHandler())

/**
 * Job Processing Infrastructure
 */
const initializeEmulatorTracking = async () => {
  // Dispatch WebSocket is a first-class feature (used by UI endpoint monitor and dispatch console).
  try {
    const dispatchService = new DispatchService(pool, logger)
    dispatchService.initializeWebSocketServer(server)
    logger.info('✅ Dispatch WebSocket enabled at /api/dispatch/ws')
  } catch (err) {
    logger.warn('Failed to initialize Dispatch WebSocket', { err })
  }

  // For demos and development we support functional emulators (data still flows through the real API/DB).
  // Never enable in production unless explicitly requested.
  const enableEmulators =
    process.env.NODE_ENV !== 'production' && process.env.ENABLE_EMULATORS !== 'false'

  if (!enableEmulators) {
    logger.info('Emulators disabled (set ENABLE_EMULATORS=true to enable in non-production).')
    return
  }

  try {
    setupOBD2WebSocket(server)
    logger.info('✅ OBD2 emulator WebSocket enabled at /ws/obd2/:sessionId')
  } catch (err) {
    logger.warn('Failed to initialize OBD2 emulator WebSocket', { err })
  }

  // Start the DB-backed fleet emulator stream (WebSocket :3004/emulator/stream) for demos.
  // This powers the UI "Endpoint Monitor" connectivity and provides realistic live telemetry.
  const enableEmulatorStream = enableEmulators && process.env.ENABLE_EMULATOR_STREAM !== 'false'
  if (!enableEmulatorStream) return

  try {
    const [{ EmulatorOrchestrator }, { telemetryService: fleetTelemetryService }, path] = await Promise.all([
      import('./emulators/EmulatorOrchestrator'),
      import('./services/TelemetryService'),
      import('path'),
    ])

    // Ensure TelemetryService is initialized (Orchestrator depends on it for DB-backed inventory).
    await fleetTelemetryService.initialize({
      query: async (sql: string, params?: any[]) => (await pool.query(sql, params)).rows,
      execute: async (sql: string, params?: any[]) => {
        const res = await pool.query(sql, params)
        return { rowCount: res.rowCount ?? 0 }
      },
    })

    const configPath = path.resolve(process.cwd(), 'src/emulators/config/default.json')
    const orchestrator = new EmulatorOrchestrator(configPath)
    ;(globalThis as any).__fleetEmulatorOrchestrator = orchestrator

    const maxVehicles = Number(process.env.EMULATOR_STREAM_VEHICLE_COUNT || 50)
    const vehicleIds = fleetTelemetryService.getVehicles().slice(0, maxVehicles).map((v) => v.id)

    if (vehicleIds.length === 0) {
      logger.warn('⚠️ Emulator stream not started: no vehicles available from DB')
      return
    }

    // The orchestrator loads DB-backed vehicles asynchronously. Wait briefly so `start()`
    // doesn't race the loader and produce false "Vehicle not found" warnings.
    const startedAt = Date.now()
    while (Date.now() - startedAt < 5_000) {
      const total = orchestrator.getStatus()?.vehicles?.total ?? 0
      if (total > 0) break
      await new Promise((r) => setTimeout(r, 100))
    }

    await orchestrator.start(vehicleIds)
    logger.info('✅ Emulator stream enabled at ws://<host>:3004/emulator/stream', { vehicles: vehicleIds.length })
  } catch (err) {
    logger.warn('Failed to initialize emulator stream', { err })
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

async function listenWithRetry(port: number, maxRetries = 10): Promise<any> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const s = await new Promise<any>((resolve, reject) => {
        const srv = app.listen(port, () => resolve(srv))
        srv.on('error', (err: any) => reject(err))
      })
      return s
    } catch (err: any) {
      if (err?.code === 'EADDRINUSE' && attempt < maxRetries) {
        const delayMs = 250 + attempt * 250
        console.warn(`Port ${port} in use; retrying listen in ${delayMs}ms (attempt ${attempt + 1}/${maxRetries})`)
        await new Promise((r) => setTimeout(r, delayMs))
        continue
      }
      throw err
    }
  }
  throw new Error(`Failed to bind port ${port}`)
}

const startServer = async () => {
  try {
    // Initialize database connection manager FIRST
    try {
      await initializeConnectionManager();
      console.log('Database connection manager initialized');
    } catch (error) {
      console.error('Failed to initialize Connection Manager (Running in Degraded Mode):', error);
    }

    server = await listenWithRetry(Number(PORT), 12)

    // NOTE: `listenWithRetry()` resolves only after the server is already listening.
    // Registering a `'listening'` handler *after* that can miss the event entirely.
    // Run startup hooks immediately after the server is bound.
    console.log(`Server running on http://localhost:${PORT}`)
    console.log(`Application Insights: ${telemetryService.isActive() ? 'Enabled' : 'Disabled'}`)
    console.log(`Sentry: ${process.env.SENTRY_DSN ? 'Enabled' : 'Disabled (no DSN configured)'}`)
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)

    try {
      const { initializeStartupHealthCheck } = await import('./routes/health-startup.routes')
      const healthReport = await initializeStartupHealthCheck()
      if (healthReport) {
        console.log(`\nStartup Health Check: ${healthReport.overallStatus.toUpperCase()}`)
        console.log(`View full report: http://localhost:${PORT}/api/health/startup\n`)
      }
    } catch (error) {
      // Startup health check is optional. Keep startup resilient when the module is
      // absent from the build or disabled in certain deployments.
      console.warn('Startup health check skipped:', error)
    }

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
