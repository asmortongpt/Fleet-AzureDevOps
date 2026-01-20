/**
 * Emulators Routes - Control and monitoring for all fleet emulators
 * Provides comprehensive endpoints for starting, stopping, and monitoring emulators
 */

import { Router } from 'express';

import { EmulatorOrchestrator } from '../emulators/EmulatorOrchestrator';
import { connectionHealthService } from '../services/ConnectionHealthService';

const router = Router();

// Initialize emulator orchestrator
let orchestrator: EmulatorOrchestrator | null = null;

/**
 * Get emulator orchestrator instance
 */
function getOrchestrator(): EmulatorOrchestrator {
  if (!orchestrator) {
    orchestrator = EmulatorOrchestrator.getInstance();
  }
  return orchestrator;
}

/**
 * GET /api/emulators/status
 * Get overall status of all emulators
 */
router.get('/status', async (req, res) => {
  try {
    const orch = getOrchestrator();
    const status = orch.getStatus();

    res.json({
      success: true,
      data: status,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('[Emulators] Error getting status:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/emulators/start-all
 * Start all emulators
 */
router.post('/start-all', async (req, res) => {
  try {
    const orch = getOrchestrator();
    const { vehicleIds } = req.body;

    // Start emulators (all vehicles or specific subset)
    await orch.start(vehicleIds);

    // Update connection health
    const status = orch.getStatus();
    connectionHealthService.updateEmulatorCounts({
      gps: status.emulators.gps,
      obd2: status.emulators.obd2,
      fuel: status.emulators.fuel,
      maintenance: status.emulators.maintenance,
      driver: status.emulators.driver,
      route: status.emulators.route,
      cost: status.emulators.cost,
      iot: status.emulators.iot,
      radio: status.emulators.radio,
    });

    res.json({
      success: true,
      message: `Started emulators for ${status.vehicles.active} vehicles`,
      data: status,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('[Emulators] Error starting emulators:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/emulators/stop-all
 * Stop all emulators
 */
router.post('/stop-all', async (req, res) => {
  try {
    const orch = getOrchestrator();
    await orch.stop();

    // Update connection health
    connectionHealthService.updateEmulatorCounts({
      gps: 0,
      obd2: 0,
      fuel: 0,
      maintenance: 0,
      driver: 0,
      route: 0,
      cost: 0,
      iot: 0,
      radio: 0,
    });

    res.json({
      success: true,
      message: 'All emulators stopped',
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('[Emulators] Error stopping emulators:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/emulators/pause
 * Pause all emulators
 */
router.post('/pause', async (req, res) => {
  try {
    const orch = getOrchestrator();
    await orch.pause();

    res.json({
      success: true,
      message: 'All emulators paused',
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('[Emulators] Error pausing emulators:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/emulators/resume
 * Resume all emulators
 */
router.post('/resume', async (req, res) => {
  try {
    const orch = getOrchestrator();
    await orch.resume();

    res.json({
      success: true,
      message: 'All emulators resumed',
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('[Emulators] Error resuming emulators:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/emulators/scenario/:scenarioId
 * Run a specific scenario
 */
router.post('/scenario/:scenarioId', async (req, res) => {
  try {
    const { scenarioId } = req.params;
    const orch = getOrchestrator();

    await orch.runScenario(scenarioId);

    res.json({
      success: true,
      message: `Running scenario: ${scenarioId}`,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('[Emulators] Error running scenario:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/emulators/vehicle/:vehicleId
 * Get telemetry for a specific vehicle
 */
router.get('/vehicle/:vehicleId', async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const orch = getOrchestrator();

    const telemetry = orch.getVehicleTelemetry(vehicleId);

    if (!telemetry) {
      return res.status(404).json({
        success: false,
        error: 'Vehicle not found or emulators not running',
      });
    }

    res.json({
      success: true,
      data: telemetry,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('[Emulators] Error getting vehicle telemetry:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/emulators/inventory
 * Get inventory emulator data
 */
router.get('/inventory', async (req, res) => {
  try {
    const orch = getOrchestrator();
    const inventoryData = orch.getInventoryData();

    if (!inventoryData) {
      return res.status(404).json({
        success: false,
        error: 'Inventory emulator not running',
      });
    }

    res.json({
      success: true,
      data: inventoryData,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('[Emulators] Error getting inventory data:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/emulators/inventory/category/:category
 * Get inventory by category
 */
router.get('/inventory/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const orch = getOrchestrator();

    const items = orch.getInventoryByCategory(category);

    res.json({
      success: true,
      data: items,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('[Emulators] Error getting inventory by category:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/emulators/inventory/search/:sku
 * Search inventory by SKU
 */
router.get('/inventory/search/:sku', async (req, res) => {
  try {
    const { sku } = req.params;
    const orch = getOrchestrator();

    const items = orch.searchInventory(sku);

    res.json({
      success: true,
      data: items,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('[Emulators] Error searching inventory:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/emulators/types
 * Get list of available emulator types
 */
router.get('/types', async (req, res) => {
  try {
    const types = [
      { id: 'gps', name: 'GPS Emulator', description: 'Simulates vehicle GPS tracking' },
      { id: 'obd2', name: 'OBD2 Emulator', description: 'Simulates OBD2 diagnostic data' },
      { id: 'fuel', name: 'Fuel Emulator', description: 'Simulates fuel consumption' },
      { id: 'maintenance', name: 'Maintenance Emulator', description: 'Simulates maintenance events' },
      { id: 'driver', name: 'Driver Behavior Emulator', description: 'Simulates driver metrics' },
      { id: 'route', name: 'Route Emulator', description: 'Simulates route planning' },
      { id: 'cost', name: 'Cost Emulator', description: 'Simulates cost tracking' },
      { id: 'iot', name: 'IoT Emulator', description: 'Simulates sensor data' },
      { id: 'ev', name: 'EV Charging Emulator', description: 'Simulates EV charging sessions' },
      { id: 'inventory', name: 'Inventory Emulator', description: 'Simulates parts inventory' },
      { id: 'video', name: 'Video Telematics Emulator', description: 'Simulates camera feeds' },
      { id: 'radio', name: 'Radio Emulator', description: 'Simulates radio communications' },
      { id: 'dispatch', name: 'Dispatch Emulator', description: 'Simulates dispatch system' },
    ];

    res.json({
      success: true,
      data: types,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('[Emulators] Error getting emulator types:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
