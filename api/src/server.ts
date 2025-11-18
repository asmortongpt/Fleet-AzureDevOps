// IMPORTANT: OpenTelemetry must be initialized BEFORE any other imports
import sdk from './config/telemetry'

// Start OpenTelemetry SDK
sdk.start()
console.log('OpenTelemetry instrumentation started')

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
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
// RBAC & Security
import permissionsRoutes from './routes/permissions'
import breakGlassRoutes from './routes/break-glass'
import maintenanceScheduler from './jobs/maintenance-scheduler'
import telematicsSync from './jobs/telematics-sync'
import teamsSync from './jobs/teams-sync.job'
import outlookSync from './jobs/outlook-sync.job'
import webhookRenewal from './jobs/webhook-renewal.job'
import schedulingReminders from './jobs/scheduling-reminders.job'
import dispatchService from './services/dispatch.service'
import documentService from './services/document.service'

dotenv.config()

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
const allowedOrigins = [
  'https://fleet.capitaltechalliance.com',
  'https://green-pond-0f040980f.3.azurestaticapps.net',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4173'
]

// Add custom origins from environment variable
if (process.env.CORS_ORIGIN) {
  allowedOrigins.push(...process.env.CORS_ORIGIN.split(','))
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
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// Rate limiting (FedRAMP SI-10)
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later'
})
app.use('/api/', limiter)

// Body parser
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// GLOBAL MOCK DATA MODE - Bypass authentication for dev/staging
if (process.env.USE_MOCK_DATA === 'true') {
  app.use((req: any, res, next) => {
    console.log('🔓 GLOBAL AUTH BYPASS - Mock data mode enabled')
    // Inject mock user for ALL requests
    req.user = {
      id: '1',
      email: 'demo@fleet.local',
      role: 'admin',
      tenant_id: '1'
    }
    next()
  })
}

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

// Always register auth routes (authentication bypass handled in middleware)
app.use('/api/auth', authRoutes)
app.use('/api/auth', microsoftAuthRoutes)
app.use('/api/vehicles', vehiclesRoutes)
app.use('/api/drivers', driversRoutes)
app.use('/api/work-orders', workOrdersRoutes)
app.use('/api/maintenance-schedules', maintenanceSchedulesRoutes)
app.use('/api/fuel-transactions', fuelTransactionsRoutes)
app.use('/api/routes', routesRoutes)
app.use('/api/geofences', geofencesRoutes)
app.use('/api/inspections', inspectionsRoutes)
app.use('/api/damage-reports', damageReportsRoutes)
app.use('/api/safety-incidents', safetyIncidentsRoutes)
app.use('/api/video-events', videoEventsRoutes)
app.use('/api/charging-stations', chargingStationsRoutes)
app.use('/api/charging-sessions', chargingSessionsRoutes)
app.use('/api/purchase-orders', purchaseOrdersRoutes)
app.use('/api/communication-logs', communicationLogsRoutes)
app.use('/api/policies', policiesRoutes)
app.use('/api/facilities', facilitiesRoutes)
app.use('/api/vendors', vendorsRoutes)
app.use('/api/telemetry', telemetryRoutes)
app.use('/api/telematics', telematicsRoutes)
app.use('/api/smartcar', smartcarRoutes)
app.use('/api/quality-gates', qualityGatesRoutes)
app.use('/api/deployments', deploymentsRoutes)
app.use('/api/mileage-reimbursement', mileageReimbursementRoutes)
app.use('/api/trip-usage', tripUsageRoutes)
app.use('/api/trips', tripMarkingRoutes)
app.use('/api/personal-use-policies', personalUsePoliciesRoutes)
app.use('/api/personal-use-charges', personalUseChargesRoutes)
app.use('/api/reimbursements', reimbursementRequestsRoutes)
app.use('/api/billing-reports', billingReportsRoutes)
app.use('/api/arcgis-layers', arcgisLayersRoutes)
app.use('/api/traffic-cameras', trafficCamerasRoutes)
app.use('/api/dispatch', dispatchRoutes)
app.use('/api/route-optimization', routeOptimizationRoutes)
app.use('/api/video', videoTelematicsRoutes)
app.use('/api/ev', evManagementRoutes)
app.use('/api/vehicles', vehicle3DRoutes)
app.use('/api/mobile', mobileIntegrationRoutes)
app.use('/api/mobile', mobileOcrRoutes)
app.use('/api/mobile/trips', mobileTripsRoutes)
app.use('/api/damage', damageRoutes)
app.use('/api/emulator', emulatorRoutes)
// Enterprise Features
app.use('/api/osha-compliance', oshaComplianceRoutes)
app.use('/api/communications', communicationsRoutes)
app.use('/api/policy-templates', policyTemplatesRoutes)
app.use('/api/documents', documentsRoutes)
app.use('/api/fleet-documents', fleetDocumentsRoutes)
app.use('/api/attachments', attachmentsRoutes)
// Document System - World-class document storage with OCR, AI, RAG, and geospatial features
registerDocumentSystemRoutes(app)
// Task and Asset Management
app.use('/api/task-management', taskManagementRoutes)
app.use('/api/asset-management', assetManagementRoutes)
app.use('/api/asset-relationships', assetRelationshipsRoutes)
app.use('/api/ai', aiTaskAssetRoutes)
// Microsoft Integration
app.use('/api/teams', teamsRoutes)
app.use('/api/outlook', outlookRoutes)
app.use('/api/sync', syncRoutes)
app.use('/api/cards', adaptiveCardsRoutes)
app.use('/api/calendar', calendarRoutes)
app.use('/api/presence', presenceRoutes)
app.use('/api/scheduling', schedulingRoutes)
app.use('/api/scheduling-notifications', schedulingNotificationsRoutes)
app.use('/api/mobile/notifications', mobileNotificationsRoutes)
app.use('/api/mobile', mobileMessagingRoutes)
app.use('/api/health', healthRoutes)
// Webhook endpoints (no auth required - validated by Microsoft)
app.use('/api/webhooks/teams', teamsWebhookRoutes)
app.use('/api/webhooks/outlook', outlookWebhookRoutes)
// app.use('/api/ai', aiRoutes) // Temporarily disabled
// RBAC & Security
app.use('/api/permissions', permissionsRoutes)
app.use('/api/break-glass', breakGlassRoutes)

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
