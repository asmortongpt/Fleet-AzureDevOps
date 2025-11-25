/**
 * Unit Tests for Vehicle History API Routes
 *
 * Tests for location history, trip breadcrumbs, and vehicle timeline endpoints
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import vehicleHistoryRoutes from '../vehicle-history.routes';
import pool from '../../config/database';

// Mock authentication middleware
const mockAuthMiddleware = (req: any, res: any, next: any) => {
  req.user = {
    id: '1',
    tenant_id: '1',
    role: 'admin',
    email: 'test@example.com'
  };
  next();
};

// Create test app
function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => mockAuthMiddleware(req, res, next));
  app.use('/api/v1/vehicles', vehicleHistoryRoutes);
  return app;
}

describe('Vehicle History Routes', () => {
  let app: express.Application;
  let testVehicleId: string;
  let testTripId: string;

  beforeAll(async () => {
    app = createTestApp();

    // Create test data
    const vehicleResult = await pool.query(
      `INSERT INTO vehicles (tenant_id, unit_number, make, model, year, vin, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id',
      ['1', 'TEST-001', 'Ford', 'F-150', 2023, 'TEST123VIN', 'active']
    );
    testVehicleId = vehicleResult.rows[0].id;

    const tripResult = await pool.query(
      `INSERT INTO trips (
        tenant_id, vehicle_id, start_time, end_time,
        start_latitude, start_longitude, end_latitude, end_longitude,
        distance_miles, duration_seconds, avg_speed_mph, max_speed_mph
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id',
      [
        '1',
        testVehicleId,
        new Date('2024-01-01T08:00:00Z'),
        new Date('2024-01-01T09:30:00Z'),
        39.8283,
        -98.5795,
        39.9000,
        -98.6000,
        50.5,
        5400,
        55.8,
        65.2
      ]
    );
    testTripId = tripResult.rows[0].id;

    // Insert GPS breadcrumbs
    const breadcrumbs = [];
    const startTime = new Date('2024-01-01T08:00:00Z').getTime();
    for (let i = 0; i < 100; i++) {
      const timestamp = new Date(startTime + i * 60000); // 1 minute intervals
      const lat = 39.8283 + (i * 0.001);
      const lng = -98.5795 + (i * 0.001);
      const speed = 50 + Math.random() * 20;
      const heading = (i * 3) % 360;

      breadcrumbs.push([
        testTripId,
        timestamp.toISOString(),
        lat,
        lng,
        speed,
        heading,
        10.5,
        500.0,
        2000,
        75.0,
        195,
        45.0
      ]);
    }

    for (const bc of breadcrumbs) {
      await pool.query(
        `INSERT INTO trip_gps_breadcrumbs (
          trip_id, timestamp, latitude, longitude, speed_mph, heading_degrees,
          accuracy_meters, altitude_meters, engine_rpm, fuel_level_percent,
          coolant_temp_f, throttle_position_percent
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        bc
      );
    }
  });

  afterAll(async () => {
    // Cleanup test data
    await pool.query('DELETE FROM trip_gps_breadcrumbs WHERE trip_id = $1', [testTripId]);
    await pool.query('DELETE FROM trips WHERE id = $1', [testTripId]);
    await pool.query('DELETE FROM vehicles WHERE id = $1', [testVehicleId]);
    await pool.end();
  });

  describe('GET /api/v1/vehicles/:id/location-history', () => {
    it('should return location history for a vehicle', async () => {
      const response = await request(app)
        .get(`/api/v1/vehicles/${testVehicleId}/location-history`)
        .query({ limit: 50 })
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body).toHaveProperty('metadata');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.pagination).toHaveProperty('page');
      expect(response.body.pagination).toHaveProperty('limit');
      expect(response.body.pagination).toHaveProperty('total');
      expect(response.body.metadata.vehicleId).toBe(testVehicleId);
    });

    it('should filter by date range', async () => {
      const response = await request(app)
        .get(`/api/v1/vehicles/${testVehicleId}/location-history`)
        .query({
          startDate: '2024-01-01T08:00:00Z',
          endDate: '2024-01-01T09:00:00Z',
          limit: 100
        })
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.metadata.startDate).toBe('2024-01-01T08:00:00Z');
      expect(response.body.metadata.endDate).toBe('2024-01-01T09:00:00Z');
    });

    it('should paginate results', async () => {
      const response1 = await request(app)
        .get(`/api/v1/vehicles/${testVehicleId}/location-history`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      const response2 = await request(app)
        .get(`/api/v1/vehicles/${testVehicleId}/location-history`)
        .query({ page: 2, limit: 10 })
        .expect(200);

      expect(response1.body.data.length).toBe(10);
      expect(response2.body.data.length).toBeGreaterThan(0);
      expect(response1.body.data[0].id).not.toBe(response2.body.data[0].id);
    });

    it('should return 404 for non-existent vehicle', async () => {
      const response = await request(app)
        .get('/api/v1/vehicles/00000000-0000-0000-0000-000000000000/location-history')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should validate query parameters', async () => {
      const response = await request(app)
        .get(`/api/v1/vehicles/${testVehicleId}/location-history`)
        .query({ limit: 'invalid' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should include trip and driver information', async () => {
      const response = await request(app)
        .get(`/api/v1/vehicles/${testVehicleId}/location-history`)
        .query({ limit: 10 })
        .expect(200);

      const firstPoint = response.body.data[0];
      expect(firstPoint).toHaveProperty('trip_id');
      expect(firstPoint).toHaveProperty('timestamp');
      expect(firstPoint).toHaveProperty('latitude');
      expect(firstPoint).toHaveProperty('longitude');
      expect(firstPoint).toHaveProperty('speed_mph');
      expect(firstPoint).toHaveProperty('heading_degrees');
    });
  });

  describe('GET /api/v1/vehicles/trips/:id/breadcrumbs', () => {
    it('should return breadcrumbs for a trip', async () => {
      const response = await request(app)
        .get(`/api/v1/vehicles/trips/${testTripId}/breadcrumbs`)
        .expect(200);

      expect(response.body).toHaveProperty('trip');
      expect(response.body).toHaveProperty('breadcrumbs');
      expect(response.body).toHaveProperty('metadata');
      expect(Array.isArray(response.body.breadcrumbs)).toBe(true);
      expect(response.body.breadcrumbs.length).toBe(100);
      expect(response.body.metadata.totalPoints).toBe(100);
    });

    it('should return breadcrumbs in chronological order', async () => {
      const response = await request(app)
        .get(`/api/v1/vehicles/trips/${testTripId}/breadcrumbs`)
        .expect(200);

      const breadcrumbs = response.body.breadcrumbs;
      for (let i = 1; i < breadcrumbs.length; i++) {
        const prevTime = new Date(breadcrumbs[i - 1].timestamp).getTime();
        const currTime = new Date(breadcrumbs[i].timestamp).getTime();
        expect(currTime).toBeGreaterThanOrEqual(prevTime);
      }
    });

    it('should include trip metadata', async () => {
      const response = await request(app)
        .get(`/api/v1/vehicles/trips/${testTripId}/breadcrumbs`)
        .expect(200);

      expect(response.body.trip).toHaveProperty('id');
      expect(response.body.trip).toHaveProperty('vehicle_id');
      expect(response.body.trip).toHaveProperty('start_time');
      expect(response.body.trip).toHaveProperty('end_time');
      expect(response.body.trip).toHaveProperty('distance_miles');
      expect(response.body.trip).toHaveProperty('duration_seconds');
      expect(response.body.trip.distance_miles).toBe(50.5);
      expect(response.body.trip.duration_seconds).toBe(5400);
    });

    it('should return 404 for non-existent trip', async () => {
      const response = await request(app)
        .get('/api/v1/vehicles/trips/00000000-0000-0000-0000-000000000000/breadcrumbs')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/v1/vehicles/:id/timeline', () => {
    beforeEach(async () => {
      // Add some timeline events
      await pool.query(
        `INSERT INTO fuel_transactions (
          tenant_id, vehicle_id, transaction_date, gallons, total_cost,
          vendor_name, odometer_reading
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        ['1', testVehicleId, '2024-01-01T10:00:00Z', 15.5, 52.35, 'Shell', 50000]
      );

      await pool.query(
        `INSERT INTO inspections (
          tenant_id, vehicle_id, inspection_date, status, odometer_reading
        ) VALUES ($1, $2, $3, $4, $5)`,
        ['1', testVehicleId, '2024-01-01T07:00:00Z', 'passed', 49950]
      );
    });

    afterEach(async () => {
      await pool.query('DELETE FROM fuel_transactions WHERE vehicle_id = $1', [testVehicleId]);
      await pool.query('DELETE FROM inspections WHERE vehicle_id = $1', [testVehicleId]);
    });

    it('should return timeline events for a vehicle', async () => {
      const response = await request(app)
        .get(`/api/v1/vehicles/${testVehicleId}/timeline`)
        .query({ limit: 100 })
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body).toHaveProperty('metadata');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should include different event types', async () => {
      const response = await request(app)
        .get(`/api/v1/vehicles/${testVehicleId}/timeline`)
        .query({ limit: 100 })
        .expect(200);

      const eventTypes = response.body.data.map((e: any) => e.event_type);
      expect(eventTypes).toContain('trip_start');
      expect(eventTypes).toContain('trip_end');
      expect(eventTypes).toContain('fueling');
      expect(eventTypes).toContain('inspection');
    });

    it('should order events by timestamp descending', async () => {
      const response = await request(app)
        .get(`/api/v1/vehicles/${testVehicleId}/timeline`)
        .query({ limit: 100 })
        .expect(200);

      const events = response.body.data;
      for (let i = 1; i < events.length; i++) {
        const prevTime = new Date(events[i - 1].timestamp).getTime();
        const currTime = new Date(events[i].timestamp).getTime();
        expect(prevTime).toBeGreaterThanOrEqual(currTime);
      }
    });

    it('should filter by date range', async () => {
      const response = await request(app)
        .get(`/api/v1/vehicles/${testVehicleId}/timeline`)
        .query({
          startDate: '2024-01-01T08:00:00Z',
          endDate: '2024-01-01T10:00:00Z',
          limit: 100
        })
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.metadata.startDate).toBe('2024-01-01T08:00:00Z');
      expect(response.body.metadata.endDate).toBe('2024-01-01T10:00:00Z');
    });

    it('should return 404 for non-existent vehicle', async () => {
      const response = await request(app)
        .get('/api/v1/vehicles/00000000-0000-0000-0000-000000000000/timeline')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should include event data for each event type', async () => {
      const response = await request(app)
        .get(`/api/v1/vehicles/${testVehicleId}/timeline`)
        .query({ limit: 100 })
        .expect(200);

      const fuelingEvent = response.body.data.find((e: any) => e.event_type === 'fueling');
      if (fuelingEvent) {
        expect(fuelingEvent.event_data).toHaveProperty('gallons');
        expect(fuelingEvent.event_data).toHaveProperty('cost');
      }

      const inspectionEvent = response.body.data.find((e: any) => e.event_type === 'inspection');
      if (inspectionEvent) {
        expect(inspectionEvent.event_data).toHaveProperty('status');
      }
    });
  });

  describe('Security & RBAC', () => {
    it('should enforce authentication', async () => {
      const appNoAuth = express();
      appNoAuth.use(express.json());
      appNoAuth.use('/api/v1/vehicles', vehicleHistoryRoutes);

      await request(appNoAuth)
        .get(`/api/v1/vehicles/${testVehicleId}/location-history`)
        .expect(401);
    });

    it('should enforce tenant isolation', async () => {
      const appDifferentTenant = express();
      appDifferentTenant.use(express.json());
      appDifferentTenant.use((req, res, next) => {
        (req as any).user = {
          id: '2',
          tenant_id: '999', // Different tenant
          role: 'admin',
          email: 'other@example.com'
        };
        next();
      });
      appDifferentTenant.use('/api/v1/vehicles', vehicleHistoryRoutes);

      const response = await request(appDifferentTenant)
        .get(`/api/v1/vehicles/${testVehicleId}/location-history`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Performance', () => {
    it('should handle large limit values', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .get(`/api/v1/vehicles/${testVehicleId}/location-history`)
        .query({ limit: 10000 })
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(2000); // Should respond within 2 seconds
      expect(response.body.data.length).toBeLessThanOrEqual(10000);
    });
  });
});
