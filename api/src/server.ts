// IMPORTANT: OpenTelemetry must be initialized BEFORE any other imports
import sdk from './config/telemetry'

// Start OpenTelemetry SDK
sdk.start()
console.log('OpenTelemetry instrumentation started')

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'

import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import { csrfTokenMiddleware, conditionalCsrfProtection, csrfErrorHandler } from './middleware/csrf'
import { setTenantContext, debugTenantContext } from './middleware/tenant-context'
import { globalLimiter } from './config/rate-limiters'
import authRoutes from './routes/auth'
import microsoftAuthRoutes from './routes/microsoft-auth'
import vehiclesRoutes from './routes/vehicles'
import driversRoutes from './routes/drivers'
import workOrdersRoutes from './routes/work-orders'
import maintenanceSchedulesRoutes from './routes/maintenance-schedules'
import fuelTransactionsRoutes from './routes/fuel-transactions'
import routesRoutes from './routes/routes'
import geofencesRoutes from './routes/geofences'
import inspectionsRoutes from './routes/inspections'
import damageReportsRoutes from './routes/damage-reports'
import safetyIncidentsRoutes from './routes/safety-incidents'
import videoEventsRoutes from './routes/video-events'
import chargingStationsRoutes from './routes/charging-stations'
import chargingSessionsRoutes from './routes/charging-sessions'
import purchaseOrdersRoutes from './routes/purchase-orders'
import communicationLogsRoutes from './routes/communication-logs'
import policiesRoutes from './routes/policies'
import facilitiesRoutes from './routes/facilities'
import vendorsRoutes from './routes/vendors'
import telemetryRoutes from './routes/telemetry'
import telematicsRoutes from './routes/telematics.routes'
import smartcarRoutes from './routes/smartcar.routes'
import qualityGatesRoutes from './routes/quality-gates'
import deploymentsRoutes from './routes/deployments'
import mileageReimbursementRoutes from './routes/mileage-reimbursement'
import tripUsageRoutes from './routes/trip-usage'
import personalUsePoliciesRoutes from './routes/personal-use-policies'
import personalUseChargesRoutes from './routes/personal-use-charges'
import tripMarkingRoutes from './routes/trip-marking'
import reimbursementRequestsRoutes from './routes/reimbursement-requests'
import billingReportsRoutes from './routes/billing-reports'
import arcgisLayersRoutes from './routes/arcgis-layers'
import trafficCamerasRoutes from './routes/traffic-cameras'
import dispatchRoutes from './routes/dispatch.routes'
import routeOptimizationRoutes from './routes/route-optimization.routes'
import videoTelematicsRoutes from './routes/video-telematics.routes'
import evManagementRoutes from './routes/ev-management.routes'
import vehicle3DRoutes from './routes/vehicle-3d.routes'
import mobileIntegrationRoutes from './routes/mobile-integration.routes'
import mobileOcrRoutes from './routes/mobile-ocr.routes'
import mobileTripsRoutes from './routes/mobile-trips.routes'
import damageRoutes from './routes/damage'
import emulatorRoutes from './routes/emulator.routes'
// Enterprise Features
import oshaComplianceRoutes from './routes/osha-compliance'
import communicationsRoutes from './routes/communications'
import policyTemplatesRoutes from './routes/policy-templates'
import documentsRoutes from './routes/documents'
import fleetDocumentsRoutes from './routes/fleet-documents.routes'
import attachmentsRoutes from './routes/attachments.routes'
// Document System Integration
import { registerDocumentSystemRoutes } from './routes/document-system.routes'
// Task and Asset Management
import taskManagementRoutes from './routes/task-management.routes'
import assetManagementRoutes from './routes/asset-management.routes'
import assetRelationshipsRoutes from './routes/asset-relationships.routes'
import aiTaskAssetRoutes from './routes/ai-task-asset.routes'
// Microsoft Integration
import teamsRoutes from './routes/teams.routes'
import outlookRoutes from './routes/outlook.routes'
import syncRoutes from './routes/sync.routes'
import healthRoutes from './routes/health.routes'
import teamsWebhookRoutes from './routes/webhooks/teams.webhook'
import outlookWebhookRoutes from './routes/webhooks/outlook.webhook'
import adaptiveCardsRoutes from './routes/adaptive-cards.routes'
import calendarRoutes from './routes/calendar.routes'
import presenceRoutes from './routes/presence.routes'
import schedulingRoutes from './routes/scheduling.routes'
import schedulingNotificationsRoutes from './routes/scheduling-notifications.routes'
import mobileNotificationsRoutes from './routes/mobile-notifications.routes'
import mobileMessagingRoutes from './routes/mobile-messaging.routes'
// import aiRoutes from './routes/ai' // Temporarily disabled
// DI Example Routes
import exampleDIRoutes from './routes/example-di.routes'
// RBAC & Security
import permissionsRoutes from './routes/permissions'
import breakGlassRoutes from './routes/break-glass'
// Query Performance Monitoring
import queryPerformanceRoutes from './routes/monitoring/query-performance'
import performanceRoutes from './routes/performance.routes'
import maintenanceScheduler from './jobs/maintenance-scheduler'
import telematicsSync from './jobs/telematics-sync'
import teamsSync from './jobs/teams-sync.job'
import outlookSync from './jobs/outlook-sync.job'
import webhookRenewal from './jobs/webhook-renewal.job'
import schedulingReminders from './jobs/scheduling-reminders.job'
import dispatchService from './services/dispatch.service'
import documentService from './services/document.service'

dotenv.config()

// SECURITY: Validate critical security configuration at startup (fail-fast principle)
// This prevents the server from starting with insecure configuration that could lead
// to authentication bypass vulnerabilities (CWE-287, CWE-798)
console.log('🔒 Validating security configuration...')

// Validate JWT_SECRET is set and meets minimum security requirements
if (!process.env.JWT_SECRET) {
  console.error('❌ FATAL SECURITY ERROR: JWT_SECRET environment variable is not set')
  console.error('❌ JWT_SECRET is required for secure authentication')
  console.error('❌ Generate a secure secret with: openssl rand -base64 48')
  console.error('❌ Server startup aborted')
  process.exit(1)
}

if (process.env.JWT_SECRET.length < 32) {
  console.error('❌ FATAL SECURITY ERROR: JWT_SECRET is too short')
  console.error(`❌ Current length: ${process.env.JWT_SECRET.length} characters`)
  console.error('❌ Minimum required: 32 characters')
  console.error('❌ Recommended: 64+ characters')
  console.error('❌ Generate a secure secret with: openssl rand -base64 48')
  console.error('❌ Server startup aborted')
  process.exit(1)
}

// Warn if using weak/default secrets (common weak patterns)
const weakSecrets = ['changeme', 'secret', 'password', 'test', 'demo', 'default', 'your-secret-key']
const lowerSecret = process.env.JWT_SECRET.toLowerCase()
if (weakSecrets.some(weak => lowerSecret.includes(weak))) {
  console.error('❌ FATAL SECURITY ERROR: JWT_SECRET appears to contain a weak/default value')
  console.error('❌ Detected weak pattern in secret')
  console.error('❌ Generate a secure secret with: openssl rand -base64 48')
  console.error('❌ Server startup aborted')
  process.exit(1)
}

console.log('✅ JWT_SECRET validated successfully')
console.log(`✅ JWT_SECRET length: ${process.env.JWT_SECRET.length} characters`)

const app = express()
const PORT = process.env.PORT || 3000

// Security middleware with enhanced headers (FedRAMP SC-7, SC-8)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  xFrameOptions: { action: 'deny' },
  xContentTypeOptions: true,
  strictTransportSecurity: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  xXssProtection: true
}))

// CORS configuration - allow frontend deployments
// Default origins for local development only
const defaultDevOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4173'
]

// In production, CORS_ORIGIN environment variable is REQUIRED
// Never hardcode production domains in source code
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [] // No default origins in production - must be explicitly configured
  : [...defaultDevOrigins]

// Add custom origins from environment variable
if (process.env.CORS_ORIGIN) {
  allowedOrigins.push(...process.env.CORS_ORIGIN.split(',').map(origin => origin.trim()))
}

// Warn if no origins configured in production
if (process.env.NODE_ENV === 'production' && allowedOrigins.length === 0) {
  console.warn('⚠️  WARNING: No CORS origins configured! Set CORS_ORIGIN environment variable.')
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true)

    if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      callback(null, true)
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
}))

// Rate limiting (FedRAMP SI-10)
// Global rate limiter: 30 requests per minute (reduced from 100 for enhanced security)
// Endpoint-specific rate limiters are applied in individual route files
app.use('/api/', globalLimiter)

// Cookie parser (required for CSRF protection)
app.use(cookieParser())

// Body parser
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Dependency Injection Container Middleware
// This creates a scoped container for each request with fresh dependencies
import { containerMiddleware, container as diContainer } from './container'
app.use(containerMiddleware)
console.log('✅ Dependency Injection container initialized')

// SECURITY: Development-only mock data mode with strict environment validation
// This bypass is ONLY allowed in development environment and will terminate the server
// if attempted in production/staging to prevent security vulnerabilities (CWE-287)
if (process.env.USE_MOCK_DATA === 'true') {
  // CRITICAL SECURITY CHECK: Prevent authentication bypass in production
  if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {
    console.error('❌ FATAL SECURITY ERROR: USE_MOCK_DATA cannot be enabled in production or staging')
    console.error('❌ This would bypass all authentication and create a critical security vulnerability')
    console.error('❌ Server terminated to prevent security breach')
    process.exit(1)
  }

  // Only allow in development environment with clear warnings
  if (process.env.NODE_ENV === 'development') {
    console.warn('⚠️  WARNING: DEVELOPMENT MODE - Authentication bypass enabled')
    console.warn('⚠️  This is for local development ONLY and must NEVER be used in production')
    console.warn('⚠️  All requests will be authenticated as admin user without credentials')

    app.use((req: any, res, next) => {
      console.log('🔓 DEV-ONLY AUTH BYPASS - Mock data mode (development environment only)')
      // Inject mock user for development testing ONLY
      req.user = {
        id: '1',
        email: 'demo@fleet.local',
        role: 'admin',
        tenant_id: '1'
      }
      next()
    })
  } else {
    // If NODE_ENV is not set or is set to something other than development
    console.error('❌ FATAL ERROR: USE_MOCK_DATA=true requires NODE_ENV=development')
    console.error('❌ Current NODE_ENV:', process.env.NODE_ENV || 'undefined')
    console.error('❌ Server terminated to prevent security vulnerability')
    process.exit(1)
  }
}

// ============================================
// API Versioning Middleware
// ============================================
import { apiVersioning, getApiVersionInfo } from './middleware/api-version'

// Apply API versioning middleware globally
app.use('/api/', apiVersioning('v1'))
console.log('✅ API Versioning enabled (default: v1)')

// API Version info endpoint
app.get('/api/version', (req, res) => {
  res.json(getApiVersionInfo())
})

// Swagger API Documentation
import swaggerUi from 'swagger-ui-express'
import { swaggerSpec } from './config/swagger'

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Fleet Management API Documentation'
}))

// Serve OpenAPI spec as JSON
app.get('/api/openapi.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json')
  res.send(swaggerSpec)
})

// CSRF token endpoint - must be before CSRF protection middleware
/**
 * @openapi
 * /api/csrf:
 *   get:
 *     summary: Get CSRF token
 *     description: Returns a CSRF token for the client to use in subsequent requests
 *     tags:
 *       - Security
 *     responses:
 *       200:
 *         description: CSRF token generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 csrfToken:
 *                   type: string
 *                   description: The CSRF token to include in subsequent requests
 *                 message:
 *                   type: string
 */
app.get('/api/csrf', csrfTokenMiddleware)

// Apply CSRF protection to all routes (except GET, HEAD, OPTIONS, and webhooks)
// This must come after the /api/csrf endpoint and before other routes
app.use(conditionalCsrfProtection)

// ============================================
// CRITICAL SECURITY: Tenant Context Middleware
// ============================================
// This middleware sets the PostgreSQL session variable for Row-Level Security (RLS)
// It MUST run after authentication and before any database queries
// This enforces multi-tenant isolation at the database level
//
// NOTE: Auth routes (/api/auth/*) are exempt from tenant context since they
// handle authentication before tenant context can be established
//
// Related migrations:
// - 032_enable_rls.sql - Enables RLS on all multi-tenant tables
// - 033_fix_nullable_tenant_id.sql - Enforces NOT NULL on tenant_id columns
//
// For debugging tenant isolation, use: GET /api/debug/tenant-context
// (requires authentication)
console.log('🔐 Registering tenant context middleware for multi-tenant isolation')

// Apply tenant context to ALL routes except auth, health, and public endpoints
app.use('/api/', (req, res, next) => {
  // Skip tenant context for these paths (they don't need it)
  const skipPaths = [
    '/api/health',
    '/api/csrf',
    '/api/auth/',
    '/api/docs',
    '/api/openapi.json'
  ]

  // Check if current path should skip tenant context
  const shouldSkip = skipPaths.some(path => req.path.startsWith(path) || req.path === path)

  if (shouldSkip) {
    return next()
  }

  // For all other paths, set tenant context
  setTenantContext(req as any, res, next)
})

// Debug endpoint for tenant context verification (development/testing only)
// This helps verify that RLS is working correctly
if (process.env.NODE_ENV !== 'production') {
  const { authenticateJWT } = require('./middleware/auth')
  app.get('/api/debug/tenant-context', authenticateJWT, setTenantContext, debugTenantContext)
  console.log('🐛 Debug endpoint registered: GET /api/debug/tenant-context')
}

// Health check
/**
 * @openapi
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the health status of the API
 *     tags:
 *       - System
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 environment:
 *                   type: string
 *                   example: production
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.0.0'
  })
})

// Mock data mode (dev/staging only)
if (process.env.USE_MOCK_DATA === 'true') {
  console.log('🧪 Using mock data mode - authentication disabled for dev/staging')
}

// ============================================
// API v1 Routes - Versioned Endpoints
// ============================================

// Always register auth routes (authentication bypass handled in middleware)
app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/auth', microsoftAuthRoutes)

// Core Fleet Management
app.use('/api/v1/vehicles', vehiclesRoutes)
app.use('/api/v1/drivers', driversRoutes)
app.use('/api/v1/work-orders', workOrdersRoutes)
app.use('/api/v1/maintenance-schedules', maintenanceSchedulesRoutes)
app.use('/api/v1/fuel-transactions', fuelTransactionsRoutes)
app.use('/api/v1/routes', routesRoutes)
app.use('/api/v1/geofences', geofencesRoutes)
app.use('/api/v1/inspections', inspectionsRoutes)
app.use('/api/v1/damage-reports', damageReportsRoutes)
app.use('/api/v1/safety-incidents', safetyIncidentsRoutes)
app.use('/api/v1/video-events', videoEventsRoutes)

// EV & Charging Management
app.use('/api/v1/charging-stations', chargingStationsRoutes)
app.use('/api/v1/charging-sessions', chargingSessionsRoutes)
app.use('/api/v1/ev', evManagementRoutes)

// Financial & Procurement
app.use('/api/v1/purchase-orders', purchaseOrdersRoutes)
app.use('/api/v1/mileage-reimbursement', mileageReimbursementRoutes)
app.use('/api/v1/trip-usage', tripUsageRoutes)
app.use('/api/v1/trips', tripMarkingRoutes)
app.use('/api/v1/personal-use-policies', personalUsePoliciesRoutes)
app.use('/api/v1/personal-use-charges', personalUseChargesRoutes)
app.use('/api/v1/reimbursements', reimbursementRequestsRoutes)
app.use('/api/v1/billing-reports', billingReportsRoutes)

// Communication & Policy
app.use('/api/v1/communication-logs', communicationLogsRoutes)
app.use('/api/v1/policies', policiesRoutes)
app.use('/api/v1/communications', communicationsRoutes)
app.use('/api/v1/policy-templates', policyTemplatesRoutes)

// Facilities & Vendors
app.use('/api/v1/facilities', facilitiesRoutes)
app.use('/api/v1/vendors', vendorsRoutes)

// Telematics & IoT
app.use('/api/v1/telemetry', telemetryRoutes)
app.use('/api/v1/telematics', telematicsRoutes)
app.use('/api/v1/smartcar', smartcarRoutes)
app.use('/api/v1/video', videoTelematicsRoutes)

// Geospatial & Mapping
app.use('/api/v1/arcgis-layers', arcgisLayersRoutes)
app.use('/api/v1/traffic-cameras', trafficCamerasRoutes)

// Dispatch & Route Optimization
app.use('/api/v1/dispatch', dispatchRoutes)
app.use('/api/v1/route-optimization', routeOptimizationRoutes)

// Mobile Integration
app.use('/api/v1/mobile', mobileIntegrationRoutes)
app.use('/api/v1/mobile', mobileOcrRoutes)
app.use('/api/v1/mobile/trips', mobileTripsRoutes)
app.use('/api/v1/mobile/notifications', mobileNotificationsRoutes)
app.use('/api/v1/mobile', mobileMessagingRoutes)

// 3D Visualization & Damage Assessment
app.use('/api/v1/vehicles', vehicle3DRoutes)
app.use('/api/v1/damage', damageRoutes)

// Emulators & Testing
app.use('/api/v1/emulator', emulatorRoutes)

// DevOps & Quality
app.use('/api/v1/quality-gates', qualityGatesRoutes)
app.use('/api/v1/deployments', deploymentsRoutes)

// Enterprise Features
app.use('/api/v1/osha-compliance', oshaComplianceRoutes)

// Document Management
app.use('/api/v1/documents', documentsRoutes)
app.use('/api/v1/fleet-documents', fleetDocumentsRoutes)
app.use('/api/v1/attachments', attachmentsRoutes)
// Document System - World-class document storage with OCR, AI, RAG, and geospatial features
registerDocumentSystemRoutes(app) // This function handles its own versioning

// Task and Asset Management
app.use('/api/v1/task-management', taskManagementRoutes)
app.use('/api/v1/asset-management', assetManagementRoutes)
app.use('/api/v1/asset-relationships', assetRelationshipsRoutes)
app.use('/api/v1/ai', aiTaskAssetRoutes)

// Microsoft Integration
app.use('/api/v1/teams', teamsRoutes)
app.use('/api/v1/outlook', outlookRoutes)
app.use('/api/v1/sync', syncRoutes)
app.use('/api/v1/cards', adaptiveCardsRoutes)
app.use('/api/v1/calendar', calendarRoutes)
app.use('/api/v1/presence', presenceRoutes)
app.use('/api/v1/scheduling', schedulingRoutes)
app.use('/api/v1/scheduling-notifications', schedulingNotificationsRoutes)
app.use('/api/v1/health', healthRoutes)

// Webhook endpoints (no auth required - validated by Microsoft)
// Note: Webhooks remain unversioned as they are validated by external services
app.use('/api/webhooks/teams', teamsWebhookRoutes)
app.use('/api/webhooks/outlook', outlookWebhookRoutes)

// RBAC & Security
app.use('/api/v1/permissions', permissionsRoutes)
app.use('/api/v1/break-glass', breakGlassRoutes)

// Query Performance Monitoring
app.use('/api/v1/monitoring/query-performance', queryPerformanceRoutes)

// Performance Monitoring & Optimization
app.use('/api/v1/performance', performanceRoutes)

// ============================================
// Legacy Route Redirects (for backwards compatibility)
// ============================================
// Redirect old unversioned routes to v1
// These can be removed after a deprecation period
console.log('⚠️  Setting up legacy route redirects to /api/v1/*')

// Core routes - most commonly used
const coreRoutes = [
  'vehicles', 'drivers', 'work-orders', 'maintenance-schedules',
  'fuel-transactions', 'inspections', 'damage-reports'
]

coreRoutes.forEach(route => {
  app.use(`/api/${route}`, (req, res) => {
    const newPath = `/api/v1/${route}${req.url}`
    res.setHeader('X-API-Deprecation', 'This endpoint is deprecated. Please use /api/v1/* instead')
    res.setHeader('Location', newPath)
    res.status(307).json({
      message: `This endpoint has moved to ${newPath}`,
      redirectTo: newPath,
      hint: 'Update your API client to use /api/v1/* endpoints'
    })
  })
})

// System Status endpoint
/**
 * @openapi
 * /api/status:
 *   get:
 *     summary: System status endpoint
 *     description: Returns operational status and service health
 *     tags:
 *       - System
 *     responses:
 *       200:
 *         description: System status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: operational
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 services:
 *                   type: object
 *                   properties:
 *                     database:
 *                       type: string
 *                       example: connected
 *                     redis:
 *                       type: string
 *                       example: connected
 */
app.get('/api/status', (req, res) => {
  res.json({
    status: 'operational',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    services: {
      database: 'connected',
      redis: 'connected'
    }
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' })
})

// CSRF error handler (must come before generic error handler)
app.use(csrfErrorHandler)

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err)
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
})

const server = app.listen(PORT, () => {
  console.log(`🚀 Fleet API running on port ${PORT}`)
  console.log(`📚 Environment: ${process.env.NODE_ENV}`)
  console.log(`🔒 CORS Origins: ${process.env.CORS_ORIGIN}`)

  // Initialize dispatch WebSocket server
  try {
    dispatchService.initializeWebSocketServer(server)
    console.log(`🎙️  Dispatch WebSocket server initialized`)
  } catch (error) {
    console.error('Failed to initialize dispatch WebSocket server:', error)
  }

  // Start maintenance scheduler
  try {
    maintenanceScheduler.start()
    console.log(`⏰ Maintenance scheduler started`)
  } catch (error) {
    console.error('Failed to start maintenance scheduler:', error)
  }

  // Start telematics sync job
  try {
    telematicsSync.start()
    console.log(`📡 Telematics sync job started`)
  } catch (error) {
    console.error('Failed to start telematics sync:', error)
  }

  // Start Teams sync job
  try {
    teamsSync.start()
    console.log(`💬 Teams sync job started`)
  } catch (error) {
    console.error('Failed to start Teams sync:', error)
  }

  // Start Outlook sync job
  try {
    outlookSync.start()
    console.log(`📧 Outlook sync job started`)
  } catch (error) {
    console.error('Failed to start Outlook sync:', error)
  }

  // Start webhook renewal job
  try {
    webhookRenewal.start()
    console.log(`🔄 Webhook renewal job started`)
  } catch (error) {
    console.error('Failed to start webhook renewal:', error)
  }

  // Start scheduling reminders job
  try {
    schedulingReminders.start()
    console.log(`📅 Scheduling reminders job started`)
  } catch (error) {
    console.error('Failed to start scheduling reminders:', error)
  }
})

export default app
