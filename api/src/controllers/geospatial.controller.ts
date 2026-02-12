/**
 * Geospatial Controller
 *
 * Handles all geospatial operations including distance calculations,
 * nearest vehicle/facility searches, and geofence operations
 *
 * @module controllers/geospatial
 */

import { Request, Response, NextFunction } from 'express';

import { geospatialRepository } from '../repositories/geospatial.repository';
import {
  CalculateDistanceDto,
  PointInGeofenceDto,
} from '../types/geospatial';

export class GeospatialController {
  /**
   * Calculate distance between two points
   * POST /api/geospatial/calculate-distance
   */
  async calculateDistance(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { lat1, lng1, lat2, lng2 }: CalculateDistanceDto = req.body;

      // Validate inputs
      if (
        typeof lat1 !== 'number' ||
        typeof lng1 !== 'number' ||
        typeof lat2 !== 'number' ||
        typeof lng2 !== 'number'
      ) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'lat1, lng1, lat2, and lng2 must all be numbers',
          },
        });
        return;
      }

      // Validate latitude range (-90 to 90)
      if (lat1 < -90 || lat1 > 90 || lat2 < -90 || lat2 > 90) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Latitude must be between -90 and 90',
          },
        });
        return;
      }

      // Validate longitude range (-180 to 180)
      if (lng1 < -180 || lng1 > 180 || lng2 < -180 || lng2 > 180) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Longitude must be between -180 and 180',
          },
        });
        return;
      }

      const distanceMeters = await geospatialRepository.calculateDistance(
        lat1,
        lng1,
        lat2,
        lng2
      );

      res.status(200).json({
        success: true,
        data: {
          distance_meters: distanceMeters,
          distance_km: distanceMeters / 1000,
          distance_miles: distanceMeters / 1609.34,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Find nearest vehicles to a point
   * GET /api/geospatial/nearest-vehicles
   */
  async findNearestVehicles(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const tenantId = (req.user?.tenant_id || req.user?.tenantId || '1').toString();

      const latitude = parseFloat(req.query.latitude as string);
      const longitude = parseFloat(req.query.longitude as string);
      const maxDistanceMeters = req.query.max_distance_meters
        ? parseInt(req.query.max_distance_meters as string)
        : 10000;
      const maxResults = req.query.max_results
        ? parseInt(req.query.max_results as string)
        : 10;

      // Validate inputs
      if (isNaN(latitude) || isNaN(longitude)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'latitude and longitude are required and must be valid numbers',
          },
        });
        return;
      }

      // Validate latitude range
      if (latitude < -90 || latitude > 90) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Latitude must be between -90 and 90',
          },
        });
        return;
      }

      // Validate longitude range
      if (longitude < -180 || longitude > 180) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Longitude must be between -180 and 180',
          },
        });
        return;
      }

      // Validate max results
      if (maxResults < 1 || maxResults > 100) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'max_results must be between 1 and 100',
          },
        });
        return;
      }

      const vehicles = await geospatialRepository.findNearestVehicles(
        tenantId,
        latitude,
        longitude,
        maxDistanceMeters,
        maxResults
      );

      res.status(200).json({
        success: true,
        data: vehicles,
        count: vehicles.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Find nearest facility to a point
   * GET /api/geospatial/nearest-facility
   */
  async findNearestFacility(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const tenantId = (req.user?.tenant_id || req.user?.tenantId || '1').toString();

      const latitude = parseFloat(req.query.latitude as string);
      const longitude = parseFloat(req.query.longitude as string);

      // Validate inputs
      if (isNaN(latitude) || isNaN(longitude)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'latitude and longitude are required and must be valid numbers',
          },
        });
        return;
      }

      // Validate latitude range
      if (latitude < -90 || latitude > 90) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Latitude must be between -90 and 90',
          },
        });
        return;
      }

      // Validate longitude range
      if (longitude < -180 || longitude > 180) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Longitude must be between -180 and 180',
          },
        });
        return;
      }

      const facility = await geospatialRepository.findNearestFacility(
        tenantId,
        latitude,
        longitude
      );

      if (!facility) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'No facilities found',
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: facility,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check if a point is inside a geofence
   * POST /api/geospatial/point-in-geofence
   */
  async checkPointInGeofence(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { latitude, longitude, geofence_id }: PointInGeofenceDto = req.body;

      // Validate inputs
      if (
        typeof latitude !== 'number' ||
        typeof longitude !== 'number' ||
        !geofence_id
      ) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'latitude, longitude, and geofence_id are required',
          },
        });
        return;
      }

      // Validate latitude range
      if (latitude < -90 || latitude > 90) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Latitude must be between -90 and 90',
          },
        });
        return;
      }

      // Validate longitude range
      if (longitude < -180 || longitude > 180) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Longitude must be between -180 and 180',
          },
        });
        return;
      }

      const isInside = await geospatialRepository.pointInCircularGeofence(
        latitude,
        longitude,
        geofence_id
      );

      res.status(200).json({
        success: true,
        data: {
          is_inside: isInside,
          geofence_id,
          latitude,
          longitude,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Find nearest charging stations
   * GET /api/geospatial/nearest-charging-stations
   */
  async findNearestChargingStations(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const tenantId = (req.user?.tenant_id || req.user?.tenantId || '1').toString();

      const latitude = parseFloat(req.query.latitude as string);
      const longitude = parseFloat(req.query.longitude as string);
      const stationType = req.query.station_type as string | undefined;
      const maxResults = req.query.max_results
        ? parseInt(req.query.max_results as string)
        : 5;

      // Validate inputs
      if (isNaN(latitude) || isNaN(longitude)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'latitude and longitude are required and must be valid numbers',
          },
        });
        return;
      }

      // Validate latitude range
      if (latitude < -90 || latitude > 90) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Latitude must be between -90 and 90',
          },
        });
        return;
      }

      // Validate longitude range
      if (longitude < -180 || longitude > 180) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Longitude must be between -180 and 180',
          },
        });
        return;
      }

      // Validate station type if provided
      if (stationType) {
        const validTypes = ['level_1', 'level_2', 'dc_fast_charge'];
        if (!validTypes.includes(stationType)) {
          res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: `station_type must be one of: ${validTypes.join(', ')}`,
            },
          });
          return;
        }
      }

      // Validate max results
      if (maxResults < 1 || maxResults > 50) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'max_results must be between 1 and 50',
          },
        });
        return;
      }

      const stations = await geospatialRepository.findNearestChargingStation(
        tenantId,
        latitude,
        longitude,
        stationType,
        maxResults
      );

      res.status(200).json({
        success: true,
        data: stations,
        count: stations.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Find vehicles in a geofence
   * GET /api/geospatial/vehicles-in-geofence/:geofenceId
   */
  async findVehiclesInGeofence(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { geofenceId } = req.params;

      if (!geofenceId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'geofenceId is required',
          },
        });
        return;
      }

      const vehicles = await geospatialRepository.findVehiclesInCircularGeofence(
        geofenceId
      );

      res.status(200).json({
        success: true,
        data: vehicles,
        count: vehicles.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all vehicles with location data
   * GET /api/geospatial/vehicles-with-location
   */
  async getVehiclesWithLocation(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const tenantId = (req.user?.tenant_id || req.user?.tenantId || '1').toString();

      const vehicles = await geospatialRepository.getVehiclesWithLocation(
        tenantId
      );

      res.status(200).json({
        success: true,
        data: vehicles,
        count: vehicles.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get vehicles within a radius of a point
   * GET /api/geospatial/vehicles-in-radius
   */
  async getVehiclesInRadius(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const tenantId = (req.user?.tenant_id || req.user?.tenantId || '1').toString();

      const latitude = parseFloat(req.query.latitude as string);
      const longitude = parseFloat(req.query.longitude as string);
      const radiusMeters = req.query.radius_meters
        ? parseInt(req.query.radius_meters as string)
        : 5000;

      // Validate inputs
      if (isNaN(latitude) || isNaN(longitude)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'latitude and longitude are required and must be valid numbers',
          },
        });
        return;
      }

      // Validate latitude range
      if (latitude < -90 || latitude > 90) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Latitude must be between -90 and 90',
          },
        });
        return;
      }

      // Validate longitude range
      if (longitude < -180 || longitude > 180) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Longitude must be between -180 and 180',
          },
        });
        return;
      }

      // Validate radius
      if (radiusMeters < 1 || radiusMeters > 100000) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'radius_meters must be between 1 and 100000 (100km)',
          },
        });
        return;
      }

      const vehicles = await geospatialRepository.getVehiclesInRadius(
        tenantId,
        latitude,
        longitude,
        radiusMeters
      );

      res.status(200).json({
        success: true,
        data: vehicles,
        count: vehicles.length,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const geospatialController = new GeospatialController();
