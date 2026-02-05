/**
 * Test Server - Loads all routes for comprehensive endpoint testing
 * This server is designed to run without external dependencies (database, redis)
 * by catching connection errors and returning explicit 503s for unavailable routes.
 */

import cors from 'cors';
import express, { Express, Request, Response, NextFunction } from 'express';

if (process.env.NODE_ENV === 'production' && process.env.ENABLE_LEGACY_API !== 'true') {
  console.error('Legacy server-test entrypoint is disabled in production. Set ENABLE_LEGACY_API=true to override.');
  process.exit(1);
}

// Create Express app
const app: Express = express();

// Basic middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    mode: 'test'
  });
});

// Import and register routes with error handling
const registerRoute = async (path: string, routerPath: string): Promise<boolean> => {
  try {
    const router = await import(routerPath);
    const routerModule = router.default || router;
    app.use(path, routerModule);
    return true;
  } catch (error: any) {
    console.log(`⚠ Route ${path} failed to load: ${error.message}`);
    // Create a fallback route
    app.use(path, (req: Request, res: Response) => {
      res.status(503).json({
        error: 'Service temporarily unavailable',
        path: req.path,
        message: 'Route not loaded due to dependency issues'
      });
    });
    return false;
  }
};

// Route registration with fallbacks
const routeConfigs = [
  // Batch routes
  { path: '/api/v1/batch', module: './routes/batch' },
  { path: '/api/batch', module: './routes/batch' },

  // Core Fleet Management Routes
  { path: '/api/vehicles', module: './routes/vehicles' },
  { path: '/api/drivers', module: './routes/drivers' },
  { path: '/api/fuel-transactions', module: './routes/fuel-transactions' },
  { path: '/api/maintenance', module: './routes/maintenance' },
  { path: '/api/incidents', module: './routes/incidents' },
  { path: '/api/parts', module: './routes/parts' },
  { path: '/api/vendors', module: './routes/vendors' },
  { path: '/api/invoices', module: './routes/invoices' },
  { path: '/api/purchase-orders', module: './routes/purchase-orders' },
  { path: '/api/tasks', module: './routes/tasks' },

  // Asset Management Routes
  { path: '/api/assets', module: './routes/asset-management.routes' },
  { path: '/api/asset-analytics', module: './routes/asset-analytics.routes' },
  { path: '/api/assets-mobile', module: './routes/assets-mobile.routes' },
  { path: '/api/heavy-equipment', module: './routes/heavy-equipment.routes' },

  // Dispatch & Communication Routes
  { path: '/api/communication-logs', module: './routes/communication-logs' },
  { path: '/api/teams', module: './routes/teams.routes' },

  // GPS & Tracking Routes
  { path: '/api/gps', module: './routes/gps' },
  { path: '/api/geofences', module: './routes/geofences' },
  { path: '/api/telematics', module: './routes/telematics.routes' },
  { path: '/api/vehicle-idling', module: './routes/vehicle-idling.routes' },

  // Maintenance & Inspection Routes
  { path: '/api/maintenance-schedules', module: './routes/maintenance-schedules' },
  { path: '/api/maintenance/drilldowns', module: './routes/maintenance-drilldowns' },
  { path: '/api/inspections', module: './routes/inspections' },
  { path: '/api/work-orders', module: './routes/work-orders' },

  // EV Management Routes
  { path: '/api/ev-management', module: './routes/ev-management.routes' },
  { path: '/api/charging-sessions', module: './routes/charging-sessions' },
  { path: '/api/charging-stations', module: './routes/charging-stations' },

  // Document Management Routes
  { path: '/api/documents', module: './routes/documents' },
  { path: '/api/fleet-documents', module: './routes/fleet-documents.routes' },

  // Financial & Cost Management Routes
  { path: '/api/costs', module: './routes/costs' },
  { path: '/api/cost-analysis', module: './routes/cost-analysis.routes' },
  { path: '/api/cost-benefit-analysis', module: './routes/cost-benefit-analysis.routes' },
  { path: '/api/billing-reports', module: './routes/billing-reports' },
  { path: '/api/mileage-reimbursement', module: './routes/mileage-reimbursement' },
  { path: '/api/personal-use-charges', module: './routes/personal-use-charges' },
  { path: '/api/personal-use-policies', module: './routes/personal-use-policies' },

  // Reporting & Analytics Routes
  { path: '/api/executive-dashboard', module: './routes/executive-dashboard.routes' },
  { path: '/api/assignment-reporting', module: './routes/assignment-reporting.routes' },
  { path: '/api/driver-scorecard', module: './routes/driver-scorecard.routes' },

  // AI & Automation Routes
  { path: '/api/ai-search', module: './routes/ai-search' },
  { path: '/api/ai-task-asset', module: './routes/ai-task-asset.routes' },
  { path: '/api/ai-tasks', module: './routes/ai-task-prioritization.routes' },

  // Task & Schedule Management Routes
  { path: '/api/scheduling', module: './routes/scheduling.routes' },
  { path: '/api/calendar', module: './routes/calendar.routes' },
  { path: '/api/on-call-management', module: './routes/on-call-management.routes' },

  // Mobile & Integration Routes
  { path: '/api/mobile-assignment', module: './routes/mobile-assignment.routes' },
  { path: '/api/mobile-hardware', module: './routes/mobile-hardware.routes' },
  { path: '/api/mobile-integration', module: './routes/mobile-integration.routes' },
  { path: '/api/mobile-messaging', module: './routes/mobile-messaging.routes' },
  { path: '/api/mobile-photos', module: './routes/mobile-photos.routes' },
  { path: '/api/mobile-trips', module: './routes/mobile-trips.routes' },
  { path: '/api/push-notifications', module: './routes/push-notifications.routes' },

  // Vehicle Management Routes
  { path: '/api/vehicle-assignments', module: './routes/vehicle-assignments.routes' },
  { path: '/api/vehicle-history', module: './routes/vehicle-history.routes' },
  { path: '/api/vehicle-3d', module: './routes/vehicle-3d.routes' },
  { path: '/api/damage', module: './routes/damage' },
  { path: '/api/damage-reports', module: './routes/damage-reports' },

  // Trip & Route Management Routes
  { path: '/api/routes', module: './routes/routes' },
  { path: '/api/route-emulator', module: './routes/route-emulator.routes' },
  { path: '/api/trip-usage', module: './routes/trip-usage' },

  // Safety & Compliance Routes
  { path: '/api/safety-incidents', module: './routes/safety-incidents' },
  { path: '/api/osha-compliance', module: './routes/osha-compliance' },
  { path: '/api/annual-reauthorization', module: './routes/annual-reauthorization.routes' },

  // Policy & Permission Routes
  { path: '/api/policies', module: './routes/policies' },
  { path: '/api/policy-templates', module: './routes/policy-templates' },
  { path: '/api/permissions', module: './routes/permissions' },

  // Authentication & User Management Routes
  { path: '/api/auth', module: './routes/auth' },
  { path: '/api/microsoft-auth', module: './routes/microsoft-auth' },
  { path: '/api/break-glass', module: './routes/break-glass' },

  // External Integrations Routes
  { path: '/api/smartcar', module: './routes/smartcar.routes' },
  { path: '/api/arcgis-layers', module: './routes/arcgis-layers' },
  { path: '/api/outlook', module: './routes/outlook.routes' },
  { path: '/api/video-events', module: './routes/video-events' },
  { path: '/api/video-telematics', module: './routes/video-telematics.routes' },

  // Emulator & Testing Routes
  { path: '/api/emulator', module: './routes/emulator.routes' },
  { path: '/api/obd2-emulator', module: './routes/obd2-emulator.routes' },
  { path: '/api/demo', module: './routes/demo.routes' },

  // System Management Routes
  { path: '/api/monitoring', module: './routes/monitoring' },
  { path: '/api/health', module: './routes/health-system.routes' },
  { path: '/api/health/microsoft', module: './routes/health.routes' },
  { path: '/api/health-detailed', module: './routes/health-detailed' },
  { path: '/api/performance', module: './routes/performance.routes' },
  { path: '/api/telemetry', module: './routes/telemetry' },
  { path: '/api/queue', module: './routes/queue.routes' },
  { path: '/api/deployments', module: './routes/deployments' },
  { path: '/api/facilities', module: './routes/facilities' },
  { path: '/api/search', module: './routes/search' },
  { path: '/api/presence', module: './routes/presence.routes' },
  { path: '/api/storage-admin', module: './routes/storage-admin' },
  { path: '/api/sync', module: './routes/sync.routes' },
  { path: '/api/quality-gates', module: './routes/quality-gates' },
  { path: '/api/reservations', module: './routes/reservations.routes' },
  { path: '/api/admin/jobs', module: './routes/admin-jobs.routes' },
];

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    path: req.path
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path
  });
});

// Export for testing
export { app, routeConfigs };

// Start server if run directly
if (require.main === module) {
  const PORT = process.env.PORT || 3002;

  const loadRoutes = async () => {
    console.log('Loading routes...');
    let loaded = 0;
    let failed = 0;

    for (const config of routeConfigs) {
      const success = await registerRoute(config.path, config.module);
      if (success) loaded++;
      else failed++;
    }

    console.log(`Routes loaded: ${loaded} success, ${failed} failed`);

    app.listen(PORT, () => {
      console.log(`Test server running on port ${PORT}`);
    });
  };

  loadRoutes();
}
