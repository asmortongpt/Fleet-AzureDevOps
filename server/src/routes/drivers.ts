import express, { Request, Response, Router } from 'express';
import { db } from '../../../api/src/db';
import { drivers, vehicles } from '../../../api/src/db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '../services/logger';

const router: Router = express.Router();

// GET /api/drivers - Get all drivers with vehicle information
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    // Drizzle query with left join to vehicles
    const result = await db
      .select({
        id: drivers.id,
        employeeId: drivers.employeeId,
        name: drivers.name,
        email: drivers.email,
        phone: drivers.phone,
        licenseNumber: drivers.licenseNumber,
        licenseExpiry: drivers.licenseExpiry,
        status: drivers.status,
        assignedVehicleId: drivers.assignedVehicleId,
        vehicleNumber: vehicles.vehicleNumber,
      })
      .from(drivers)
      .leftJoin(vehicles, eq(drivers.assignedVehicleId, vehicles.id))
      .orderBy(drivers.name);

    res.json({
      success: true,
      data: result || [],
      count: result?.length || 0
    });
  } catch (error) {
    logger.error('Error fetching drivers', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch drivers'
    });
  }
});

// GET /api/drivers/:id - Get single driver with vehicle information
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const driverId = parseInt(id, 10);

    if (isNaN(driverId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid driver ID'
      });
      return;
    }

    // Drizzle query with left join for single driver
    const result = await db
      .select({
        // All driver fields
        id: drivers.id,
        employeeId: drivers.employeeId,
        name: drivers.name,
        email: drivers.email,
        phone: drivers.phone,
        licenseNumber: drivers.licenseNumber,
        licenseExpiry: drivers.licenseExpiry,
        licenseClass: drivers.licenseClass,
        status: drivers.status,
        photoUrl: drivers.photoUrl,
        azureAdId: drivers.azureAdId,
        assignedVehicleId: drivers.assignedVehicleId,
        rating: drivers.rating,
        totalTrips: drivers.totalTrips,
        totalMiles: drivers.totalMiles,
        safetyScore: drivers.safetyScore,
        hireDate: drivers.hireDate,
        certifications: drivers.certifications,
        emergencyContact: drivers.emergencyContact,
        createdAt: drivers.createdAt,
        updatedAt: drivers.updatedAt,
        // Joined field
        vehicleNumber: vehicles.vehicleNumber,
      })
      .from(drivers)
      .leftJoin(vehicles, eq(drivers.assignedVehicleId, vehicles.id))
      .where(eq(drivers.id, driverId))
      .limit(1);

    if (!result || result.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Driver not found'
      });
      return;
    }

    res.json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    logger.error('Error fetching driver', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch driver'
    });
  }
});

export default router;
