/**
 * Simple Express Server - Fleet Management API
 * Basic server to get started quickly
 */

import cors from 'cors';
import { eq, and, SQL } from 'drizzle-orm';
import express from 'express';
import helmet from 'helmet';

import { db, checkDatabaseConnection } from './db/connection';
import { schema } from './schemas/production.schema';

// Import OBD2 Emulator Components
import obd2EmulatorRouter, { setupOBD2WebSocket } from './routes/obd2-emulator.routes';


const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://20.161.96.87',
    'https://fleet.capitaltechalliance.com'
  ],
  credentials: true,
}));
app.use(express.json());

// ============================================================================
// EMULATORS - OBD2 & Testing
// ============================================================================

app.use('/api/obd2-emulator', obd2EmulatorRouter);

// Basic health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});


// ============================================================================
// VEHICLES - Core vehicle endpoints
// ============================================================================

app.get('/api/vehicles', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const vehicles = await db
      .select()
      .from(schema.vehicles)
      .orderBy(schema.vehicles.number)
      .limit(Number(limit))
      .offset((Number(page) - 1) * Number(limit));

    // Transform coordinates to numbers and create location object for Google Maps compatibility
    const transformedVehicles = vehicles.map(v => ({
      ...v,
      latitude: v.latitude ? parseFloat(v.latitude as any) : null,
      longitude: v.longitude ? parseFloat(v.longitude as any) : null,
      location: {
        lat: v.latitude ? parseFloat(v.latitude as any) : 0,
        lng: v.longitude ? parseFloat(v.longitude as any) : 0,
        latitude: v.latitude ? parseFloat(v.latitude as any) : 0,
        longitude: v.longitude ? parseFloat(v.longitude as any) : 0,
        address: v.locationAddress || ''
      }
    }));

    res.json({
      data: transformedVehicles,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total: transformedVehicles.length,
      },
    });
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/vehicles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [vehicle] = await db
      .select()
      .from(schema.vehicles)
      .where(eq(schema.vehicles.id, id));

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json(vehicle);
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================================
// ASSETS - Asset management endpoints (maps to vehicles for now)
// ============================================================================

app.get('/api/assets', async (req, res) => {
  try {
    const { filter = 'all', page = 1, limit = 50 } = req.query;

    // Map filters to database queries on vehicles table
    const conditions: SQL[] = [];

    switch (filter) {
      case 'active':
        conditions.push(eq(schema.vehicles.status, 'active'));
        break;
      case 'inactive':
        conditions.push(eq(schema.vehicles.status, 'idle'));
        break;
      case 'maintenance':
        conditions.push(eq(schema.vehicles.status, 'maintenance'));
        break;
      case 'high-value':
        // Filter vehicles with purchase price > $50,000
        break;
      // 'all' or other filters return all
    }

    const query = db.select().from(schema.vehicles);
    if (conditions.length > 0) {
      // @ts-ignore - Drizzle type inference limitation
      query.where(and(...conditions));
    }

    const vehicles = await query
      .limit(Number(limit))
      .offset((Number(page) - 1) * Number(limit));

    // Transform vehicle data to asset format
    const assets = vehicles.map(v => ({
      id: v.id,
      name: `${v.year} ${v.make} ${v.model}`,
      asset_number: v.number,
      category: v.type,
      type: v.fuelType,
      manufacturer: v.make,
      model: v.model,
      serial_number: v.vin,
      status: v.status,
      current_value: v.currentValue,
      purchase_price: v.purchasePrice,
      acquisition_date: v.purchaseDate,
      condition_score: 85, // Calculate from vehicle data
      last_service_date: v.lastServiceDate,
      next_service_date: v.nextServiceDate,
      assigned_to: null,
      department: null,
      current_location: v.locationAddress,
      depreciation_rate: 15,
    }));

    res.json(assets);
  } catch (error) {
    console.error('Error fetching assets:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/assets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [vehicle] = await db
      .select()
      .from(schema.vehicles)
      .where(eq(schema.vehicles.id, id));

    if (!vehicle) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    // Transform vehicle to asset format
    const asset = {
      id: vehicle.id,
      name: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
      asset_number: vehicle.number,
      category: vehicle.type,
      type: vehicle.fuelType,
      manufacturer: vehicle.make,
      model: vehicle.model,
      serial_number: vehicle.vin,
      status: vehicle.status,
      current_value: vehicle.currentValue,
      purchase_price: vehicle.purchasePrice,
      acquisition_date: vehicle.purchaseDate,
      condition_score: 85,
      last_service_date: vehicle.lastServiceDate,
      next_service_date: vehicle.nextServiceDate,
      assigned_to: null,
      department: null,
      current_location: vehicle.locationAddress,
      depreciation_rate: 15,
    };

    res.json(asset);
  } catch (error) {
    console.error('Error fetching asset:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================================
// EQUIPMENT - Equipment endpoints (maps to vehicles)
// ============================================================================

app.get('/api/equipment', async (req, res) => {
  try {
    const { category, page = 1, limit = 50 } = req.query;

    const conditions: SQL[] = [];

    // Filter by vehicle type as equipment category
    if (category) {
      const typeMap: Record<string, string> = {
        'heavy': 'truck',
        'light': 'sedan',
        'specialized': 'specialty',
        'tools': 'van',
      };
      if (typeMap[category as string]) {
        conditions.push(eq(schema.vehicles.type, typeMap[category as string] as any));
      }
    }

    const query = db.select().from(schema.vehicles);
    if (conditions.length > 0) {
      // @ts-ignore - Drizzle type inference limitation
      query.where(and(...conditions));
    }

    const vehicles = await query
      .limit(Number(limit))
      .offset((Number(page) - 1) * Number(limit));

    // Transform to equipment format
    const equipment = vehicles.map(v => ({
      id: v.id,
      name: `${v.year} ${v.make} ${v.model}`,
      category: v.type,
      type: v.type,
      manufacturer: v.make,
      model: v.model,
      serial_number: v.vin,
      status: v.status === 'active' ? 'operational' : 'maintenance',
      operating_hours: v.odometer ? Math.floor(v.odometer / 30) : 0,
      utilization: 75,
      current_operator: null,
      total_operators: 3,
      hours_this_month: 160,
      avg_daily_usage: 8,
      last_service: v.lastServiceDate,
      next_service: v.nextServiceDate,
    }));

    res.json(equipment);
  } catch (error) {
    console.error('Error fetching equipment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/equipment/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [vehicle] = await db
      .select()
      .from(schema.vehicles)
      .where(eq(schema.vehicles.id, id));

    if (!vehicle) {
      return res.status(404).json({ error: 'Equipment not found' });
    }

    const equipment = {
      id: vehicle.id,
      name: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
      category: vehicle.type,
      type: vehicle.type,
      manufacturer: vehicle.make,
      model: vehicle.model,
      serial_number: vehicle.vin,
      status: vehicle.status === 'active' ? 'operational' : 'maintenance',
      operating_hours: vehicle.odometer ? Math.floor(vehicle.odometer / 30) : 0,
      utilization: 75,
      current_operator: null,
      total_operators: 3,
      hours_this_month: 160,
      avg_daily_usage: 8,
      last_service: vehicle.lastServiceDate,
      next_service: vehicle.nextServiceDate,
    };

    res.json(equipment);
  } catch (error) {
    console.error('Error fetching equipment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================================
// INVENTORY - Inventory/parts endpoints
// ============================================================================

app.get('/api/inventory', async (req, res) => {
  try {
    const { filter = 'all', page = 1, limit = 50 } = req.query;

    // Query parts inventory table if it exists, otherwise return sample data
    let query = db.select().from(schema.partsInventory);

    switch (filter) {
      case 'low-stock':
        // Filter where quantity <= reorder point
        break;
      case 'out-of-stock':
        // Filter where quantity = 0
        break;
      case 'high-value':
        // Filter where unit_cost * quantity > threshold
        break;
    }

    const inventory = await query
      .limit(Number(limit))
      .offset((Number(page) - 1) * Number(limit));

    // Transform to inventory format
    const items = inventory.map(item => ({
      id: item.id,
      name: item.name,
      sku: item.partNumber,
      category: item.category,
      quantity: item.quantityOnHand,
      reorder_point: item.reorderPoint,
      unit_cost: item.unitCost,
      supplier: 'Various',
      lead_time_days: 7,
      min_order_qty: item.reorderQuantity,
      used_this_month: 10,
      avg_monthly_usage: 15,
      last_order_date: null,
      total_orders: 5,
      primary_location: item.locationInWarehouse,
      total_locations: 1,
    }));

    res.json(items);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/inventory/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [item] = await db
      .select()
      .from(schema.partsInventory)
      .where(eq(schema.partsInventory.id, id));

    if (!item) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    const inventoryItem = {
      id: item.id,
      name: item.name,
      sku: item.partNumber,
      category: item.category,
      quantity: item.quantityOnHand,
      reorder_point: item.reorderPoint,
      unit_cost: item.unitCost,
      supplier: 'Various',
      lead_time_days: 7,
      min_order_qty: item.reorderQuantity,
      used_this_month: 10,
      avg_monthly_usage: 15,
      last_order_date: null,
      total_orders: 5,
      primary_location: item.locationInWarehouse,
      total_locations: 1,
    };

    res.json(inventoryItem);
  } catch (error) {
    console.error('Error fetching inventory item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================================
// MAINTENANCE REQUESTS - Maintenance request endpoints
// ============================================================================

app.get('/api/maintenance-requests', async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;

    // Query work orders as maintenance requests
    const conditions: SQL[] = [];

    if (status) {
      conditions.push(eq(schema.workOrders.status, status as any));
    }

    const query = db.select().from(schema.workOrders);
    if (conditions.length > 0) {
      // @ts-ignore - Drizzle type inference limitation
      query.where(and(...conditions));
    }

    const workOrders = await query
      .limit(Number(limit))
      .offset((Number(page) - 1) * Number(limit));

    // Transform to maintenance request format
    const requests = workOrders.map(wo => ({
      id: wo.id,
      request_number: wo.number,
      title: wo.title,
      description: wo.description,
      status: wo.status,
      priority: wo.priority,
      request_type: wo.type,
      category: 'Maintenance',
      estimated_cost: wo.estimatedCost,
      requested_completion_date: wo.scheduledEndDate,
      submitted_date: wo.createdAt,
      requester_name: 'Fleet Manager',
      requester_department: 'Operations',
      asset_id: wo.vehicleId,
      asset_name: null,
      asset_number: null,
      asset_location: null,
      asset_status: null,
      reviewer_name: null,
      review_date: null,
      review_notes: wo.notes,
      approval_notes: null,
      activity_log: [],
    }));

    res.json(requests);
  } catch (error) {
    console.error('Error fetching maintenance requests:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/maintenance-requests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [workOrder] = await db
      .select()
      .from(schema.workOrders)
      .where(eq(schema.workOrders.id, id));

    if (!workOrder) {
      return res.status(404).json({ error: 'Maintenance request not found' });
    }

    const request = {
      id: workOrder.id,
      request_number: workOrder.number,
      title: workOrder.title,
      description: workOrder.description,
      status: workOrder.status,
      priority: workOrder.priority,
      request_type: workOrder.type,
      category: 'Maintenance',
      estimated_cost: workOrder.estimatedCost,
      requested_completion_date: workOrder.scheduledEndDate,
      submitted_date: workOrder.createdAt,
      requester_name: 'Fleet Manager',
      requester_department: 'Operations',
      asset_id: workOrder.vehicleId,
      asset_name: null,
      asset_number: null,
      asset_location: null,
      asset_status: null,
      reviewer_name: null,
      review_date: null,
      review_notes: workOrder.notes,
      approval_notes: null,
      activity_log: [],
    };

    res.json(request);
  } catch (error) {
    console.error('Error fetching maintenance request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================================
// ALERTS - Safety alerts endpoints
// ============================================================================

app.get('/api/alerts', async (req, res) => {
  try {
    const { status, severity, page = 1, limit = 50 } = req.query;

    // Query incidents table as alerts
    const conditions: SQL[] = [];

    if (status) {
      conditions.push(eq(schema.incidents.status, status as any));
    }
    if (severity) {
      conditions.push(eq(schema.incidents.severity, severity as any));
    }

    const query = db.select().from(schema.incidents);
    if (conditions.length > 0) {
      // @ts-ignore - Drizzle type inference limitation
      query.where(and(...conditions));
    }

    const incidents = await query
      .limit(Number(limit))
      .offset((Number(page) - 1) * Number(limit));

    // Transform to alert format
    const alerts = incidents.map(incident => ({
      id: incident.id,
      alert_number: incident.number,
      title: `${incident.type} - ${incident.severity}`,
      description: incident.description,
      status: incident.status,
      severity: incident.severity,
      category: incident.type,
      alert_type: incident.type,
      priority: 'high',
      triggered_at: incident.incidentDate,
      duration_minutes: null,
      vehicle_id: incident.vehicleId,
      vehicle_name: null,
      driver_id: incident.driverId,
      driver_name: null,
      location: incident.location,
      coordinates: incident.latitude && incident.longitude
        ? { lat: incident.latitude, lng: incident.longitude }
        : null,
      threshold_value: null,
      threshold_metric: null,
      current_value: null,
      auto_clear_enabled: false,
      acknowledged_by: null,
      acknowledged_at: null,
      resolved_by: null,
      resolved_at: null,
      resolution_notes: incident.investigationNotes,
      notifications_sent: [],
      activity_log: [],
    }));

    res.json(alerts);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/alerts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [incident] = await db
      .select()
      .from(schema.incidents)
      .where(eq(schema.incidents.id, id));

    if (!incident) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    const alert = {
      id: incident.id,
      alert_number: incident.number,
      title: `${incident.type} - ${incident.severity}`,
      description: incident.description,
      status: incident.status,
      severity: incident.severity,
      category: incident.type,
      alert_type: incident.type,
      priority: 'high',
      triggered_at: incident.incidentDate,
      duration_minutes: null,
      vehicle_id: incident.vehicleId,
      vehicle_name: null,
      driver_id: incident.driverId,
      driver_name: null,
      location: incident.location,
      coordinates: incident.latitude && incident.longitude
        ? { lat: incident.latitude, lng: incident.longitude }
        : null,
      threshold_value: null,
      threshold_metric: null,
      current_value: null,
      auto_clear_enabled: false,
      acknowledged_by: null,
      acknowledged_at: null,
      resolved_by: null,
      resolved_at: null,
      resolution_notes: incident.investigationNotes,
      notifications_sent: [],
      activity_log: [],
    };

    res.json(alert);
  } catch (error) {
    console.error('Error fetching alert:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================================
// SCHEDULED ITEMS - Calendar/schedule endpoints
// ============================================================================

app.get('/api/scheduled-items', async (req, res) => {
  try {
    const { type, start_date, end_date, page = 1, limit = 50 } = req.query;

    // Query maintenance schedules and routes
    const schedules = await db
      .select()
      .from(schema.maintenanceSchedules)
      .limit(Number(limit))
      .offset((Number(page) - 1) * Number(limit));

    // Transform to scheduled items format
    const items = schedules.map(schedule => ({
      id: schedule.id,
      title: schedule.name,
      description: schedule.description,
      type: 'maintenance',
      start_date: schedule.nextServiceDate,
      end_date: schedule.nextServiceDate,
      all_day: true,
      status: 'scheduled',
      priority: 'medium',
      assigned_to: null,
      related_entity_type: 'vehicle',
      related_entity_id: schedule.vehicleId,
      location: null,
      reminders: [],
      recurring: true,
      recurrence_rule: `Every ${schedule.intervalDays} days`,
    }));

    res.json(items);
  } catch (error) {
    console.error('Error fetching scheduled items:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Basic CRUD routes for drivers
app.get('/api/drivers', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const drivers = await db
      .select()
      .from(schema.drivers)
      .orderBy(schema.drivers.createdAt)
      .limit(Number(limit))
      .offset((Number(page) - 1) * Number(limit));

    res.json({
      data: drivers,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total: drivers.length,
      },
    });
  } catch (error) {
    console.error('Error fetching drivers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Work orders
app.get('/api/work-orders', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const workOrders = await db
      .select()
      .from(schema.workOrders)
      .limit(Number(limit))
      .offset((Number(page) - 1) * Number(limit));

    res.json({
      data: workOrders,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total: workOrders.length,
      },
    });
  } catch (error) {
    console.error('Error fetching work orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Fuel transactions
app.get('/api/fuel-transactions', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const transactions = await db
      .select()
      .from(schema.fuelTransactions)
      .limit(Number(limit))
      .offset((Number(page) - 1) * Number(limit));

    res.json({
      data: transactions,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total: transactions.length,
      },
    });
  } catch (error) {
    console.error('Error fetching fuel transactions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Routes
app.get('/api/routes', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const routes = await db
      .select()
      .from(schema.routes)
      .limit(Number(limit))
      .offset((Number(page) - 1) * Number(limit));

    res.json({
      data: routes,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total: routes.length,
      },
    });
  } catch (error) {
    console.error('Error fetching routes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Facilities
app.get('/api/facilities', async (req, res) => {
  try {
    const facilities = await db
      .select()
      .from(schema.facilities);

    res.json({
      data: facilities,
      meta: {
        total: facilities.length,
      },
    });
  } catch (error) {
    console.error('Error fetching facilities:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Inspections
app.get('/api/inspections', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const inspections = await db
      .select()
      .from(schema.inspections)
      .limit(Number(limit))
      .offset((Number(page) - 1) * Number(limit));

    res.json({
      data: inspections,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total: inspections.length,
      },
    });
  } catch (error) {
    console.error('Error fetching inspections:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Incidents
app.get('/api/incidents', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const incidents = await db
      .select()
      .from(schema.incidents)
      .limit(Number(limit))
      .offset((Number(page) - 1) * Number(limit));

    res.json({
      data: incidents,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total: incidents.length,
      },
    });
  } catch (error) {
    console.error('Error fetching incidents:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GPS Tracks
app.get('/api/gps-tracks', async (req, res) => {
  try {
    const { vehicleId, limit = 100 } = req.query;
    const conditions: SQL[] = [];

    if (vehicleId) {
      conditions.push(eq(schema.gpsTracks.vehicleId, vehicleId as string));
    }

    const query = db.select().from(schema.gpsTracks);
    if (conditions.length > 0) {
      // @ts-ignore - Drizzle type inference limitation
      query.where(and(...conditions));
    }

    const tracks = await query.limit(Number(limit));

    res.json({
      data: tracks,
      meta: {
        total: tracks.length,
      },
    });
  } catch (error) {
    console.error('Error fetching GPS tracks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GPS
app.get('/api/gps', async (req, res) => {
  try {
    const { vehicleId, limit = 100 } = req.query;
    const conditions: SQL[] = [];

    if (vehicleId) {
      conditions.push(eq(schema.gpsTracks.vehicleId, vehicleId as string));
    }

    const query = db.select().from(schema.gpsTracks);
    if (conditions.length > 0) {
      // @ts-ignore - Drizzle type inference limitation
      query.where(and(...conditions));
    }

    const tracks = await query.limit(Number(limit));

    res.json({
      data: tracks,
      meta: {
        total: tracks.length,
      },
    });
  } catch (error) {
    console.error('Error fetching GPS data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Geofences
app.get('/api/geofences', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const geofences = await db
      .select()
      .from(schema.geofences)
      .limit(Number(limit))
      .offset((Number(page) - 1) * Number(limit));

    res.json({
      data: geofences,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total: geofences.length,
      },
    });
  } catch (error) {
    console.error('Error fetching geofences:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Maintenance Records (Work Orders)
app.get('/api/maintenance-records', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const records = await db
      .select()
      .from(schema.workOrders)
      .limit(Number(limit))
      .offset((Number(page) - 1) * Number(limit));

    res.json({
      data: records,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total: records.length,
      },
    });
  } catch (error) {
    console.error('Error fetching maintenance records:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Maintenance Schedules
app.get('/api/maintenance-schedules', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const schedules = await db
      .select()
      .from(schema.maintenanceSchedules)
      .limit(Number(limit))
      .offset((Number(page) - 1) * Number(limit));

    res.json({
      data: schedules,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total: schedules.length,
      },
    });
  } catch (error) {
    console.error('Error fetching maintenance schedules:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Parts
app.get('/api/parts', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const parts = await db
      .select()
      .from(schema.partsInventory)
      .limit(Number(limit))
      .offset((Number(page) - 1) * Number(limit));

    res.json({
      data: parts,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total: parts.length,
      },
    });
  } catch (error) {
    console.error('Error fetching parts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Vendors
app.get('/api/vendors', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const vendors = await db
      .select()
      .from(schema.vendors)
      .limit(Number(limit))
      .offset((Number(page) - 1) * Number(limit));

    res.json({
      data: vendors,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total: vendors.length,
      },
    });
  } catch (error) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Invoices
app.get('/api/invoices', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const invoices = await db
      .select()
      .from(schema.invoices)
      .limit(Number(limit))
      .offset((Number(page) - 1) * Number(limit));

    res.json({
      data: invoices,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total: invoices.length,
      },
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Purchase Orders
app.get('/api/purchase-orders', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const orders = await db
      .select()
      .from(schema.purchaseOrders)
      .limit(Number(limit))
      .offset((Number(page) - 1) * Number(limit));

    res.json({
      data: orders,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total: orders.length,
      },
    });
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Tasks
app.get('/api/tasks', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const tasks = await db
      .select()
      .from(schema.tasks)
      .limit(Number(limit))
      .offset((Number(page) - 1) * Number(limit));

    res.json({
      data: tasks,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total: tasks.length,
      },
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Costs (using invoices table)
app.get('/api/costs', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const costs = await db
      .select()
      .from(schema.invoices)
      .limit(Number(limit))
      .offset((Number(page) - 1) * Number(limit));

    res.json({
      data: costs,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total: costs.length,
      },
    });
  } catch (error) {
    console.error('Error fetching costs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// EV Chargers
app.get('/api/ev/chargers', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const chargers = await db
      .select()
      .from(schema.chargingStations)
      .limit(Number(limit))
      .offset((Number(page) - 1) * Number(limit));

    res.json({
      data: chargers,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total: chargers.length,
      },
    });
  } catch (error) {
    console.error('Error fetching EV chargers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Damage endpoint (placeholder - requires implementation)
app.get('/api/damage', async (req, res) => {
  try {
    // Placeholder - damage data would need a dedicated table
    res.json({
      data: [],
      meta: {
        total: 0,
        message: 'Damage tracking endpoint - requires database schema',
      },
    });
  } catch (error) {
    console.error('Error fetching damage data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Config endpoint
app.get('/api/config', async (req, res) => {
  try {
    // Return basic configuration
    res.json({
      data: {
        apiVersion: '1.0.0',
        features: {
          gps: true,
          maintenance: true,
          fuel: true,
          ev: true,
        },
        environment: process.env.NODE_ENV || 'development',
      },
    });
  } catch (error) {
    console.error('Error fetching config:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Feature Flags endpoint
app.get('/api/feature-flags', async (req, res) => {
  try {
    // Return feature flags
    res.json({
      data: {
        enableGPS: true,
        enableMaintenance: true,
        enableFuel: true,
        enableEV: true,
        enableDamageTracking: false,
        enableAuth: false,
      },
    });
  } catch (error) {
    console.error('Error fetching feature flags:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Auth Me endpoint (placeholder)
app.get('/api/auth/me', async (req, res) => {
  try {
    // Placeholder - authentication requires implementation
    res.status(401).json({
      error: 'Authentication not configured',
      message: 'This endpoint requires authentication setup',
    });
  } catch (error) {
    console.error('Error in auth endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
async function startServer() {
  try {
    // Check database connection (skip if using mock data)
    const useMockData = process.env.USE_MOCK_DATA === 'true';

    if (!useMockData) {
      const dbHealthy = await checkDatabaseConnection();
      if (!dbHealthy) {
        console.error('❌ Database connection failed. Please check your DATABASE_URL in .env');
        process.exit(1);
      }
      console.log('✅ Database connection successful');
    } else {
      console.log('⚠️  Running in MOCK DATA mode - Database connection skipped');
    }

    const server = app.listen(Number(PORT), '0.0.0.0', () => {
      console.log('');
      console.log('='.repeat(60));
      console.log('🚀 Fleet Management API Server');
      console.log('='.repeat(60));
      console.log('');
      console.log(`📡 Server running on: http://localhost:${PORT}`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
      console.log('');
      console.log('📊 Available endpoints:');
      console.log('   GET  /api/vehicles');
      console.log('   GET  /api/drivers');
      console.log('   GET  /api/work-orders');
      console.log('   GET  /api/maintenance-records');
      console.log('   GET  /api/fuel-transactions');
      console.log('   GET  /api/routes');
      console.log('   GET  /api/facilities');
      console.log('   GET  /api/inspections');
      console.log('   GET  /api/incidents');
      console.log('   GET  /api/gps-tracks');
      console.log('');
      console.log('  Core Fleet:');
      console.log('   GET  /api/vehicles              - List vehicles (filter by status, type)');
      console.log('   GET  /api/vehicles/:id          - Get vehicle by ID');
      console.log('   GET  /api/drivers               - List drivers');
      console.log('   GET  /api/facilities            - List facilities');
      console.log('');
      console.log('  Assets & Equipment:');
      console.log('   GET  /api/assets                - List assets (filter: active, inactive, etc)');
      console.log('   GET  /api/assets/:id            - Get asset details');
      console.log('   GET  /api/equipment             - List equipment (filter by category)');
      console.log('   GET  /api/equipment/:id         - Get equipment details');
      console.log('   GET  /api/inventory             - List inventory (filter: low-stock, etc)');
      console.log('   GET  /api/inventory/:id         - Get inventory item details');
      console.log('');
      console.log('  Maintenance:');
      console.log('   GET  /api/work-orders           - List work orders');
      console.log('   GET  /api/maintenance-requests  - List maintenance requests');
      console.log('   GET  /api/maintenance-requests/:id - Get request details');
      console.log('   GET  /api/scheduled-items       - List scheduled maintenance');
      console.log('');
      console.log('  Safety & Compliance:');
      console.log('   GET  /api/alerts                - List safety alerts');
      console.log('   GET  /api/alerts/:id            - Get alert details');
      console.log('   GET  /api/incidents             - List incidents');
      console.log('   GET  /api/inspections           - List inspections');
      console.log('');
      console.log('  Operations:');
      console.log('   GET  /api/routes                - List routes');
      console.log('   GET  /api/fuel-transactions     - List fuel transactions');
      console.log('   GET  /api/gps-tracks            - List GPS tracks');
      console.log('');
      console.log('💡 Tips:');
      console.log('   - Add ?page=1&limit=10 for pagination');
      console.log('   - Use query params like ?status=active or ?filter=low-stock');
      console.log('   - All endpoints return real data from PostgreSQL');
    });

    // Initialize WebSocket for OBD2 Emulator
    setupOBD2WebSocket(server);

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, shutting down gracefully...');
  process.exit(0);
});

startServer();
