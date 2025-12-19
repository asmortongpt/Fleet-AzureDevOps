import { Router, Request, Response } from 'express';
import logger from '../config/logger'; // Wave 27: Add Winston logger
import { RouteEmulator } from '../emulators/RouteEmulator';
import { RouteFilters, UpdateStopStatusRequest } from '../types/route.types';

const router = Router();
const routeEmulator = RouteEmulator.getInstance();

/**
 * GET /api/routes - Get all routes with optional filtering and pagination
 */
router.get('/', (req: Request, res: Response) => {
  try {
    const filters: RouteFilters = {
      status: req.query.status as string,
      routeType: req.query.routeType as string,
      vehicleId: req.query.vehicleId ? parseInt(req.query.vehicleId as string) : undefined,
      driverId: req.query.driverId ? parseInt(req.query.driverId as string) : undefined,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20
    };

    // Convert date strings to Date objects if provided
    const processedFilters = {
      ...filters,
      startDate: filters.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters.endDate ? new Date(filters.endDate) : undefined
    };

    const result = routeEmulator.getRoutes(processedFilters);

    res.json({
      success: true,
      data: result.routes,
      pagination: {
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
        limit: filters.limit || 20
      }
    });
  } catch (error) {
    logger.error('Error getting routes:', error) // Wave 27: Winston logger;
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve routes'
    });
  }
});

/**
 * GET /api/routes/optimize - Get optimization statistics
 */
router.get('/optimize', (req: Request, res: Response) => {
  try {
    const stats = routeEmulator.getOptimizationStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error getting optimization stats:', error) // Wave 27: Winston logger;
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve optimization statistics'
    });
  }
});

/**
 * GET /api/routes/:id - Get specific route with stops
 */
router.get('/:id', (req: Request, res: Response) => {
  try {
    const routeId = parseInt(req.params.id);
    const route = routeEmulator.getRouteById(routeId);

    if (!route) {
      return res.status(404).json({
        success: false,
        error: 'Route not found'
      });
    }

    res.json({
      success: true,
      data: route
    });
  } catch (error) {
    logger.error('Error getting route:', error) // Wave 27: Winston logger;
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve route'
    });
  }
});

/**
 * GET /api/routes/vehicle/:vehicleId - Get routes for a specific vehicle
 */
router.get('/vehicle/:vehicleId', (req: Request, res: Response) => {
  try {
    const vehicleId = parseInt(req.params.vehicleId);
    const routes = routeEmulator.getRoutesByVehicle(vehicleId);

    res.json({
      success: true,
      data: routes,
      total: routes.length
    });
  } catch (error) {
    logger.error('Error getting vehicle routes:', error) // Wave 27: Winston logger;
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve vehicle routes'
    });
  }
});

/**
 * GET /api/routes/driver/:driverId - Get routes for a specific driver
 */
router.get('/driver/:driverId', (req: Request, res: Response) => {
  try {
    const driverId = parseInt(req.params.driverId);
    const routes = routeEmulator.getRoutesByDriver(driverId);

    res.json({
      success: true,
      data: routes,
      total: routes.length
    });
  } catch (error) {
    logger.error('Error getting driver routes:', error) // Wave 27: Winston logger;
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve driver routes'
    });
  }
});

/**
 * POST /api/routes - Create a new route
 */
router.post('/', (req: Request, res: Response) => {
  try {
    const routeData = req.body;

    // Validate required fields
    if (!routeData.vehicleId || !routeData.driverId) {
      return res.status(400).json({
        success: false,
        error: 'vehicleId and driverId are required'
      });
    }

    const newRoute = routeEmulator.createRoute(routeData);

    res.status(201).json({
      success: true,
      data: newRoute
    });
  } catch (error) {
    logger.error('Error creating route:', error) // Wave 27: Winston logger;
    res.status(500).json({
      success: false,
      error: 'Failed to create route'
    });
  }
});

/**
 * PUT /api/routes/:id - Update route (mark stops complete, update status, etc.)
 */
router.put('/:id', (req: Request, res: Response) => {
  try {
    const routeId = parseInt(req.params.id);
    const updates = req.body;

    const updatedRoute = routeEmulator.updateRoute(routeId, updates);

    if (!updatedRoute) {
      return res.status(404).json({
        success: false,
        error: 'Route not found'
      });
    }

    res.json({
      success: true,
      data: updatedRoute
    });
  } catch (error) {
    logger.error('Error updating route:', error) // Wave 27: Winston logger;
    res.status(500).json({
      success: false,
      error: 'Failed to update route'
    });
  }
});

/**
 * PUT /api/routes/:routeId/stops/:stopId - Update a specific stop's status
 */
router.put('/:routeId/stops/:stopId', (req: Request, res: Response) => {
  try {
    const routeId = parseInt(req.params.routeId);
    const stopId = parseInt(req.params.stopId);
    const { status, actualArrivalTime, actualDepartureTime, notes } = req.body as UpdateStopStatusRequest;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Stop status is required'
      });
    }

    const success = routeEmulator.updateStopStatus(routeId, stopId, status);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Route or stop not found'
      });
    }

    // Get the updated route to return
    const updatedRoute = routeEmulator.getRouteById(routeId);

    res.json({
      success: true,
      data: updatedRoute
    });
  } catch (error) {
    logger.error('Error updating stop status:', error) // Wave 27: Winston logger;
    res.status(500).json({
      success: false,
      error: 'Failed to update stop status'
    });
  }
});

/**
 * DELETE /api/routes/:id - Cancel a route
 */
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const routeId = parseInt(req.params.id);

    const route = routeEmulator.getRouteById(routeId);
    if (!route) {
      return res.status(404).json({
        success: false,
        error: 'Route not found'
      });
    }

    // Update route status to cancelled
    const cancelledRoute = routeEmulator.updateRoute(routeId, { status: 'cancelled' });

    res.json({
      success: true,
      data: cancelledRoute,
      message: 'Route cancelled successfully'
    });
  } catch (error) {
    logger.error('Error cancelling route:', error) // Wave 27: Winston logger;
    res.status(500).json({
      success: false,
      error: 'Failed to cancel route'
    });
  }
});

export default router;