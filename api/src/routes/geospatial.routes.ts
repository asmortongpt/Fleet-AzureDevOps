/**
 * Geospatial Routes
 *
 * RESTful API routes for geospatial operations
 *
 * @module routes/geospatial
 */

import { Router } from 'express';
import { geospatialController } from '../controllers/geospatial.controller';

const router = Router();

/**
 * @route   POST /api/geospatial/calculate-distance
 * @desc    Calculate distance between two points using Haversine formula
 * @access  Authenticated
 * @body    lat1 (required) - Latitude of first point
 * @body    lng1 (required) - Longitude of first point
 * @body    lat2 (required) - Latitude of second point
 * @body    lng2 (required) - Longitude of second point
 * @returns Distance in meters, kilometers, and miles
 */
router.post(
  '/calculate-distance',
  geospatialController.calculateDistance.bind(geospatialController)
);

/**
 * @route   GET /api/geospatial/nearest-vehicles
 * @desc    Find nearest vehicles to a point
 * @access  Authenticated
 * @query   latitude (required) - Target latitude
 * @query   longitude (required) - Target longitude
 * @query   max_distance_meters (optional) - Maximum distance in meters (default: 10000)
 * @query   max_results (optional) - Maximum number of results (default: 10, max: 100)
 * @returns Array of nearest vehicles with distances
 */
router.get(
  '/nearest-vehicles',
  geospatialController.findNearestVehicles.bind(geospatialController)
);

/**
 * @route   GET /api/geospatial/nearest-facility
 * @desc    Find nearest facility to a point
 * @access  Authenticated
 * @query   latitude (required) - Target latitude
 * @query   longitude (required) - Target longitude
 * @returns Nearest facility with distance
 */
router.get(
  '/nearest-facility',
  geospatialController.findNearestFacility.bind(geospatialController)
);

/**
 * @route   POST /api/geospatial/point-in-geofence
 * @desc    Check if a point is inside a circular geofence
 * @access  Authenticated
 * @body    latitude (required) - Point latitude
 * @body    longitude (required) - Point longitude
 * @body    geofence_id (required) - Geofence ID to check
 * @returns Boolean indicating if point is inside geofence
 */
router.post(
  '/point-in-geofence',
  geospatialController.checkPointInGeofence.bind(geospatialController)
);

/**
 * @route   GET /api/geospatial/nearest-charging-stations
 * @desc    Find nearest charging stations
 * @access  Authenticated
 * @query   latitude (required) - Target latitude
 * @query   longitude (required) - Target longitude
 * @query   station_type (optional) - Filter by station type: level_1, level_2, dc_fast_charge
 * @query   max_results (optional) - Maximum number of results (default: 5, max: 50)
 * @returns Array of nearest charging stations with distances
 */
router.get(
  '/nearest-charging-stations',
  geospatialController.findNearestChargingStations.bind(geospatialController)
);

/**
 * @route   GET /api/geospatial/vehicles-in-geofence/:geofenceId
 * @desc    Find all vehicles inside a circular geofence
 * @access  Authenticated
 * @params  geofenceId - Geofence ID
 * @returns Array of vehicles inside the geofence
 */
router.get(
  '/vehicles-in-geofence/:geofenceId',
  geospatialController.findVehiclesInGeofence.bind(geospatialController)
);

/**
 * @route   GET /api/geospatial/vehicles-with-location
 * @desc    Get all vehicles with location data
 * @access  Authenticated
 * @returns Array of vehicles with current location data
 */
router.get(
  '/vehicles-with-location',
  geospatialController.getVehiclesWithLocation.bind(geospatialController)
);

/**
 * @route   GET /api/geospatial/vehicles-in-radius
 * @desc    Get vehicles within a radius of a point
 * @access  Authenticated
 * @query   latitude (required) - Center point latitude
 * @query   longitude (required) - Center point longitude
 * @query   radius_meters (optional) - Radius in meters (default: 5000, max: 100000)
 * @returns Array of vehicles within the specified radius
 */
router.get(
  '/vehicles-in-radius',
  geospatialController.getVehiclesInRadius.bind(geospatialController)
);

export default router;
