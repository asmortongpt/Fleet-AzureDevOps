import express, { Request, Response, Router } from 'express';
import { db } from '../../../api/src/db';
import { vehicles, drivers, facilities } from '../../../api/src/db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '../services/logger';

const router: Router = express.Router();

// GET /api/vehicles - Get all vehicles with joins
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    // Drizzle query with left joins
    const result = await db
      .select({
        id: vehicles.id,
        vehicleNumber: vehicles.vehicleNumber,
        make: vehicles.make,
        model: vehicles.model,
        year: vehicles.year,
        vin: vehicles.vin,
        licensePlate: vehicles.licensePlate,
        status: vehicles.status,
        mileage: vehicles.mileage,
        fuelType: vehicles.fuelType,
        lastServiceDate: vehicles.lastServiceDate,
        nextServiceDate: vehicles.nextServiceDate,
        assignedDriverId: vehicles.assignedDriverId,
        facilityId: vehicles.facilityId,
        driverName: drivers.name,
        facilityName: facilities.name,
      })
      .from(vehicles)
      .leftJoin(drivers, eq(vehicles.assignedDriverId, drivers.id))
      .leftJoin(facilities, eq(vehicles.facilityId, facilities.id))
      .orderBy(vehicles.vehicleNumber);

    res.json({
      success: true,
      data: result || [],
      count: result?.length || 0
    });
  } catch (error) {
    logger.error('Error fetching vehicles', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vehicles'
    });
  }
});

// GET /api/vehicles/:id - Get single vehicle with joins
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const vehicleId = parseInt(id, 10);

    if (isNaN(vehicleId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid vehicle ID'
      });
      return;
    }

    // Drizzle query with left joins for single vehicle
    const result = await db
      .select({
        // All vehicle fields
        id: vehicles.id,
        vehicleNumber: vehicles.vehicleNumber,
        make: vehicles.make,
        model: vehicles.model,
        year: vehicles.year,
        vin: vehicles.vin,
        licensePlate: vehicles.licensePlate,
        status: vehicles.status,
        mileage: vehicles.mileage,
        fuelType: vehicles.fuelType,
        location: vehicles.location,
        assignedDriverId: vehicles.assignedDriverId,
        facilityId: vehicles.facilityId,
        model3dId: vehicles.model3dId,
        lastServiceDate: vehicles.lastServiceDate,
        nextServiceDate: vehicles.nextServiceDate,
        purchaseDate: vehicles.purchaseDate,
        purchasePrice: vehicles.purchasePrice,
        currentValue: vehicles.currentValue,
        insurancePolicyNumber: vehicles.insurancePolicyNumber,
        registrationExpiry: vehicles.registrationExpiry,
        inspectionDue: vehicles.inspectionDue,
        specifications: vehicles.specifications,
        createdAt: vehicles.createdAt,
        updatedAt: vehicles.updatedAt,
        // Joined fields
        driverName: drivers.name,
        facilityName: facilities.name,
      })
      .from(vehicles)
      .leftJoin(drivers, eq(vehicles.assignedDriverId, drivers.id))
      .leftJoin(facilities, eq(vehicles.facilityId, facilities.id))
      .where(eq(vehicles.id, vehicleId))
      .limit(1);

    if (!result || result.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Vehicle not found'
      });
      return;
    }

    res.json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    logger.error('Error fetching vehicle', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vehicle'
    });
  }
});

export default router;
