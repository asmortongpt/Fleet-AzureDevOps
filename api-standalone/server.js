const express = require('express');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// Database configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'fleet-postgres-service',
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'fleet_db',
  user: process.env.DB_USER || 'fleet_user',
  password: process.env.DB_PASSWORD || 'fleet_password',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
pool.on('connect', () => {
  console.log('✅ PostgreSQL connected');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL error:', err);
});

// Middleware
app.use(express.json());

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// ============================================================================
// Health check endpoints (both /health and /api/health)
// ============================================================================
const healthHandler = async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as db_time, version() as db_version');
    res.json({
      status: 'healthy',
      service: 'fleet-api',
      version: '2.0.1',
      timestamp: new Date().toISOString(),
      database: 'connected',
      dbTime: result.rows[0].db_time,
      dbVersion: result.rows[0].db_version,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      features: {
        googleMaps: true,
        postgreSQL: true,
        realTimeData: true
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// ============================================================================
// Vehicles API
// ============================================================================
app.get('/api/v1/vehicles', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;

    const result = await pool.query(
      `SELECT *
      FROM vehicles
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await pool.query('SELECT COUNT(*) as total FROM vehicles');

    res.json({
      vehicles: result.rows,
      data: result.rows,
      count: result.rowCount,
      total: parseInt(countResult.rows[0].total),
      limit,
      offset
    });
  } catch (error) {
    console.error('Vehicles endpoint error:', error);
    res.status(500).json({
      error: 'Failed to fetch vehicles',
      details: error.message
    });
  }
});

// Single vehicle endpoint
app.get('/api/v1/vehicles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM vehicles WHERE id = $1',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json({
      vehicle: result.rows[0],
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Vehicle fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch vehicle',
      details: error.message
    });
  }
});

// ============================================================================
// Drivers API
// ============================================================================
app.get('/api/v1/drivers', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;

    const result = await pool.query(
      `SELECT
        d.id,
        d.tenant_id,
        d.user_id,
        d.license_number,
        d.license_state,
        d.license_expiration,
        d.cdl_class,
        d.cdl_endorsements,
        d.medical_card_expiration,
        d.hire_date,
        d.termination_date,
        d.status,
        d.safety_score,
        d.total_miles_driven,
        d.total_hours_driven,
        d.incidents_count,
        d.violations_count,
        d.emergency_contact_name,
        d.emergency_contact_phone,
        d.notes,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        u.role,
        d.created_at,
        d.updated_at
      FROM drivers d
      LEFT JOIN users u ON d.user_id = u.id
      ORDER BY d.created_at DESC
      LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await pool.query('SELECT COUNT(*) as total FROM drivers');

    res.json({
      drivers: result.rows,
      data: result.rows,
      count: result.rowCount,
      total: parseInt(countResult.rows[0].total),
      limit,
      offset
    });
  } catch (error) {
    console.error('Drivers endpoint error:', error);
    res.status(500).json({
      error: 'Failed to fetch drivers',
      details: error.message
    });
  }
});

// Single driver endpoint
app.get('/api/v1/drivers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT
        d.id,
        d.tenant_id,
        d.user_id,
        d.license_number,
        d.license_state,
        d.license_expiration,
        d.cdl_class,
        d.cdl_endorsements,
        d.medical_card_expiration,
        d.hire_date,
        d.termination_date,
        d.status,
        d.safety_score,
        d.total_miles_driven,
        d.total_hours_driven,
        d.incidents_count,
        d.violations_count,
        d.emergency_contact_name,
        d.emergency_contact_phone,
        d.notes,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        u.role,
        d.created_at,
        d.updated_at
      FROM drivers d
      LEFT JOIN users u ON d.user_id = u.id
      WHERE d.id = $1`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    res.json({
      driver: result.rows[0],
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Driver fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch driver',
      details: error.message
    });
  }
});

// Create vehicle endpoint
app.post('/api/v1/vehicles', async (req, res) => {
  try {
    const {
      tenant_id, vin, make, model, year, license_plate, vehicle_type,
      status, fuel_type, color, odometer_miles, purchase_date, purchase_price_cents,
      current_value_cents, insurance_policy_number, registration_expiration
    } = req.body;

    // Validate required fields
    if (!tenant_id || !vin || !make || !model || !year) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['tenant_id', 'vin', 'make', 'model', 'year']
      });
    }

    const result = await pool.query(
      `INSERT INTO vehicles (
        tenant_id, vin, make, model, year, license_plate, vehicle_type,
        status, fuel_type, color, odometer_miles, purchase_date, purchase_price_cents,
        current_value_cents, insurance_policy_number, registration_expiration
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`,
      [
        tenant_id, vin, make, model, year, license_plate, vehicle_type || 'truck',
        status || 'active', fuel_type || 'diesel', color, odometer_miles || 0,
        purchase_date, purchase_price_cents, current_value_cents,
        insurance_policy_number, registration_expiration
      ]
    );

    res.status(201).json({
      vehicle: result.rows[0],
      data: result.rows[0],
      message: 'Vehicle created successfully'
    });
  } catch (error) {
    console.error('Vehicle creation error:', error);
    res.status(500).json({
      error: 'Failed to create vehicle',
      details: error.message
    });
  }
});

// Update vehicle endpoint
app.put('/api/v1/vehicles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      vin, make, model, year, license_plate, vehicle_type, status, fuel_type,
      color, odometer_miles, purchase_date, purchase_price_cents, current_value_cents,
      insurance_policy_number, registration_expiration
    } = req.body;

    const result = await pool.query(
      `UPDATE vehicles SET
        vin = COALESCE($2, vin),
        make = COALESCE($3, make),
        model = COALESCE($4, model),
        year = COALESCE($5, year),
        license_plate = COALESCE($6, license_plate),
        vehicle_type = COALESCE($7, vehicle_type),
        status = COALESCE($8, status),
        fuel_type = COALESCE($9, fuel_type),
        color = COALESCE($10, color),
        odometer_miles = COALESCE($11, odometer_miles),
        purchase_date = COALESCE($12, purchase_date),
        purchase_price_cents = COALESCE($13, purchase_price_cents),
        current_value_cents = COALESCE($14, current_value_cents),
        insurance_policy_number = COALESCE($15, insurance_policy_number),
        registration_expiration = COALESCE($16, registration_expiration),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *`,
      [
        id, vin, make, model, year, license_plate, vehicle_type, status, fuel_type,
        color, odometer_miles, purchase_date, purchase_price_cents, current_value_cents,
        insurance_policy_number, registration_expiration
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json({
      vehicle: result.rows[0],
      data: result.rows[0],
      message: 'Vehicle updated successfully'
    });
  } catch (error) {
    console.error('Vehicle update error:', error);
    res.status(500).json({
      error: 'Failed to update vehicle',
      details: error.message
    });
  }
});

// Delete vehicle endpoint
app.delete('/api/v1/vehicles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM vehicles WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json({
      message: 'Vehicle deleted successfully',
      id: result.rows[0].id
    });
  } catch (error) {
    console.error('Vehicle deletion error:', error);
    res.status(500).json({
      error: 'Failed to delete vehicle',
      details: error.message
    });
  }
});

// Create driver endpoint
app.post('/api/v1/drivers', async (req, res) => {
  try {
    const {
      tenant_id, user_id, license_number, license_state, license_expiration,
      cdl_class, cdl_endorsements, medical_card_expiration, hire_date,
      status, emergency_contact_name, emergency_contact_phone, notes
    } = req.body;

    // Validate required fields
    if (!tenant_id || !license_number || !license_state) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['tenant_id', 'license_number', 'license_state']
      });
    }

    const result = await pool.query(
      `INSERT INTO drivers (
        tenant_id, user_id, license_number, license_state, license_expiration,
        cdl_class, cdl_endorsements, medical_card_expiration, hire_date, status,
        emergency_contact_name, emergency_contact_phone, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        tenant_id, user_id, license_number, license_state, license_expiration,
        cdl_class, cdl_endorsements, medical_card_expiration, hire_date,
        status || 'active', emergency_contact_name, emergency_contact_phone, notes
      ]
    );

    res.status(201).json({
      driver: result.rows[0],
      data: result.rows[0],
      message: 'Driver created successfully'
    });
  } catch (error) {
    console.error('Driver creation error:', error);
    res.status(500).json({
      error: 'Failed to create driver',
      details: error.message
    });
  }
});

// Update driver endpoint
app.put('/api/v1/drivers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      license_number, license_state, license_expiration, cdl_class, cdl_endorsements,
      medical_card_expiration, hire_date, termination_date, status, safety_score,
      emergency_contact_name, emergency_contact_phone, notes
    } = req.body;

    const result = await pool.query(
      `UPDATE drivers SET
        license_number = COALESCE($2, license_number),
        license_state = COALESCE($3, license_state),
        license_expiration = COALESCE($4, license_expiration),
        cdl_class = COALESCE($5, cdl_class),
        cdl_endorsements = COALESCE($6, cdl_endorsements),
        medical_card_expiration = COALESCE($7, medical_card_expiration),
        hire_date = COALESCE($8, hire_date),
        termination_date = COALESCE($9, termination_date),
        status = COALESCE($10, status),
        safety_score = COALESCE($11, safety_score),
        emergency_contact_name = COALESCE($12, emergency_contact_name),
        emergency_contact_phone = COALESCE($13, emergency_contact_phone),
        notes = COALESCE($14, notes),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *`,
      [
        id, license_number, license_state, license_expiration, cdl_class, cdl_endorsements,
        medical_card_expiration, hire_date, termination_date, status, safety_score,
        emergency_contact_name, emergency_contact_phone, notes
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    res.json({
      driver: result.rows[0],
      data: result.rows[0],
      message: 'Driver updated successfully'
    });
  } catch (error) {
    console.error('Driver update error:', error);
    res.status(500).json({
      error: 'Failed to update driver',
      details: error.message
    });
  }
});

// Delete driver endpoint
app.delete('/api/v1/drivers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM drivers WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    res.json({
      message: 'Driver deleted successfully',
      id: result.rows[0].id
    });
  } catch (error) {
    console.error('Driver deletion error:', error);
    res.status(500).json({
      error: 'Failed to delete driver',
      details: error.message
    });
  }
});

// ============================================================================
// Work Orders API
// ============================================================================
app.get('/api/v1/work-orders', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    const status = req.query.status;

    let query = `SELECT * FROM work_orders`;
    let params = [];

    if (status) {
      query += ` WHERE status = $1`;
      params.push(status);
      query += ` ORDER BY created_at DESC LIMIT $2 OFFSET $3`;
      params.push(limit, offset);
    } else {
      query += ` ORDER BY created_at DESC LIMIT $1 OFFSET $2`;
      params = [limit, offset];
    }

    const result = await pool.query(query, params);
    const countResult = await pool.query('SELECT COUNT(*) as total FROM work_orders');

    res.json({
      data: result.rows,
      count: result.rowCount,
      total: parseInt(countResult.rows[0].total),
      limit,
      offset
    });
  } catch (error) {
    console.error('Work orders endpoint error:', error);
    res.status(500).json({
      error: 'Failed to fetch work orders',
      details: error.message
    });
  }
});

app.get('/api/v1/work-orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM work_orders WHERE id = $1',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Work order not found' });
    }

    res.json({
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Work order fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch work order',
      details: error.message
    });
  }
});

app.post('/api/v1/work-orders', async (req, res) => {
  try {
    const {
      tenant_id, work_order_number, vehicle_id, type, priority, status,
      description, labor_cost, parts_cost, scheduled_start, scheduled_end
    } = req.body;

    if (!tenant_id || !work_order_number || !vehicle_id || !type || !description) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['tenant_id', 'work_order_number', 'vehicle_id', 'type', 'description']
      });
    }

    const result = await pool.query(
      `INSERT INTO work_orders (
        tenant_id, work_order_number, vehicle_id, type, priority, status,
        description, labor_cost, parts_cost, scheduled_start, scheduled_end
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        tenant_id, work_order_number, vehicle_id, type, priority || 'medium',
        status || 'open', description, labor_cost || 0, parts_cost || 0, scheduled_start, scheduled_end
      ]
    );

    res.status(201).json({
      data: result.rows[0],
      message: 'Work order created successfully'
    });
  } catch (error) {
    console.error('Work order creation error:', error);
    res.status(500).json({
      error: 'Failed to create work order',
      details: error.message
    });
  }
});

app.put('/api/v1/work-orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      type, priority, status, description, labor_cost, parts_cost,
      scheduled_start, scheduled_end, actual_start, actual_end
    } = req.body;

    const result = await pool.query(
      `UPDATE work_orders SET
        type = COALESCE($2, type),
        priority = COALESCE($3, priority),
        status = COALESCE($4, status),
        description = COALESCE($5, description),
        labor_cost = COALESCE($6, labor_cost),
        parts_cost = COALESCE($7, parts_cost),
        scheduled_start = COALESCE($8, scheduled_start),
        scheduled_end = COALESCE($9, scheduled_end),
        actual_start = COALESCE($10, actual_start),
        actual_end = COALESCE($11, actual_end)
      WHERE id = $1
      RETURNING *`,
      [id, type, priority, status, description, labor_cost, parts_cost, scheduled_start, scheduled_end, actual_start, actual_end]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Work order not found' });
    }

    res.json({
      data: result.rows[0],
      message: 'Work order updated successfully'
    });
  } catch (error) {
    console.error('Work order update error:', error);
    res.status(500).json({
      error: 'Failed to update work order',
      details: error.message
    });
  }
});

app.delete('/api/v1/work-orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM work_orders WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Work order not found' });
    }

    res.json({
      message: 'Work order deleted successfully',
      id: result.rows[0].id
    });
  } catch (error) {
    console.error('Work order deletion error:', error);
    res.status(500).json({
      error: 'Failed to delete work order',
      details: error.message
    });
  }
});

// ============================================================================
// Maintenance API
// ============================================================================
app.get('/api/v1/maintenance', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    const vehicleId = req.query.vehicle_id;

    let query = `SELECT * FROM maintenance`;
    let params = [];

    if (vehicleId) {
      query += ` WHERE vehicle_id = $1`;
      params.push(vehicleId);
      query += ` ORDER BY scheduled_date DESC LIMIT $2 OFFSET $3`;
      params.push(limit, offset);
    } else {
      query += ` ORDER BY scheduled_date DESC LIMIT $1 OFFSET $2`;
      params = [limit, offset];
    }

    const result = await pool.query(query, params);
    const countResult = await pool.query('SELECT COUNT(*) as total FROM maintenance');

    res.json({
      data: result.rows,
      count: result.rowCount,
      total: parseInt(countResult.rows[0].total),
      limit,
      offset
    });
  } catch (error) {
    console.error('Maintenance endpoint error:', error);
    res.status(500).json({
      error: 'Failed to fetch maintenance records',
      details: error.message
    });
  }
});

app.post('/api/v1/maintenance', async (req, res) => {
  try {
    const {
      tenant_id, vehicle_id, maintenance_type, status, scheduled_date,
      completed_date, actual_cost_cents, parts_used, notes
    } = req.body;

    if (!tenant_id || !vehicle_id || !maintenance_type) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['tenant_id', 'vehicle_id', 'maintenance_type']
      });
    }

    const result = await pool.query(
      `INSERT INTO maintenance (
        tenant_id, vehicle_id, maintenance_type, status, scheduled_date,
        completed_date, actual_cost_cents, parts_used, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        tenant_id, vehicle_id, maintenance_type, status || 'scheduled',
        scheduled_date, completed_date, actual_cost_cents, parts_used ? JSON.stringify(parts_used) : null, notes
      ]
    );

    res.status(201).json({
      data: result.rows[0],
      message: 'Maintenance record created successfully'
    });
  } catch (error) {
    console.error('Maintenance creation error:', error);
    res.status(500).json({
      error: 'Failed to create maintenance record',
      details: error.message
    });
  }
});

app.put('/api/v1/maintenance/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      maintenance_type, status, scheduled_date, completed_date,
      actual_cost_cents, parts_used, notes
    } = req.body;

    const result = await pool.query(
      `UPDATE maintenance SET
        maintenance_type = COALESCE($2, maintenance_type),
        status = COALESCE($3, status),
        scheduled_date = COALESCE($4, scheduled_date),
        completed_date = COALESCE($5, completed_date),
        actual_cost_cents = COALESCE($6, actual_cost_cents),
        parts_used = COALESCE($7, parts_used),
        notes = COALESCE($8, notes),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *`,
      [id, maintenance_type, status, scheduled_date, completed_date, actual_cost_cents, parts_used ? JSON.stringify(parts_used) : null, notes]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Maintenance record not found' });
    }

    res.json({
      data: result.rows[0],
      message: 'Maintenance record updated successfully'
    });
  } catch (error) {
    console.error('Maintenance update error:', error);
    res.status(500).json({
      error: 'Failed to update maintenance record',
      details: error.message
    });
  }
});

app.delete('/api/v1/maintenance/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM maintenance WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Maintenance record not found' });
    }

    res.json({
      message: 'Maintenance record deleted successfully',
      id: result.rows[0].id
    });
  } catch (error) {
    console.error('Maintenance deletion error:', error);
    res.status(500).json({
      error: 'Failed to delete maintenance record',
      details: error.message
    });
  }
});

// ============================================================================
// Safety Incidents API
// ============================================================================
app.get('/api/v1/safety-incidents', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    const severity = req.query.severity;

    let query = `SELECT * FROM safety_incidents`;
    let params = [];

    if (severity) {
      query += ` WHERE severity = $1`;
      params.push(severity);
      query += ` ORDER BY incident_date DESC LIMIT $2 OFFSET $3`;
      params.push(limit, offset);
    } else {
      query += ` ORDER BY incident_date DESC LIMIT $1 OFFSET $2`;
      params = [limit, offset];
    }

    const result = await pool.query(query, params);
    const countResult = await pool.query('SELECT COUNT(*) as total FROM safety_incidents');

    res.json({
      data: result.rows,
      count: result.rowCount,
      total: parseInt(countResult.rows[0].total),
      limit,
      offset
    });
  } catch (error) {
    console.error('Safety incidents endpoint error:', error);
    res.status(500).json({
      error: 'Failed to fetch safety incidents',
      details: error.message
    });
  }
});

app.post('/api/v1/safety-incidents', async (req, res) => {
  try {
    const {
      tenant_id, incident_number, vehicle_id, driver_id, incident_date,
      incident_type, severity, description, status, location_latitude,
      location_longitude, location_address
    } = req.body;

    if (!tenant_id || !incident_date || !incident_type) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['tenant_id', 'incident_date', 'incident_type']
      });
    }

    const result = await pool.query(
      `INSERT INTO safety_incidents (
        tenant_id, incident_number, vehicle_id, driver_id, incident_date,
        incident_type, severity, description, status, location_latitude,
        location_longitude, location_address
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        tenant_id, incident_number, vehicle_id, driver_id, incident_date,
        incident_type, severity || 'minor', description, status || 'reported',
        location_latitude, location_longitude, location_address
      ]
    );

    res.status(201).json({
      data: result.rows[0],
      message: 'Safety incident created successfully'
    });
  } catch (error) {
    console.error('Safety incident creation error:', error);
    res.status(500).json({
      error: 'Failed to create safety incident',
      details: error.message
    });
  }
});

app.put('/api/v1/safety-incidents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      incident_type, severity, description, status, location_address
    } = req.body;

    const result = await pool.query(
      `UPDATE safety_incidents SET
        incident_type = COALESCE($2, incident_type),
        severity = COALESCE($3, severity),
        description = COALESCE($4, description),
        status = COALESCE($5, status),
        location_address = COALESCE($6, location_address),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *`,
      [id, incident_type, severity, description, status, location_address]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Safety incident not found' });
    }

    res.json({
      data: result.rows[0],
      message: 'Safety incident updated successfully'
    });
  } catch (error) {
    console.error('Safety incident update error:', error);
    res.status(500).json({
      error: 'Failed to update safety incident',
      details: error.message
    });
  }
});

// ============================================================================
// Inspections API
// ============================================================================
app.get('/api/v1/inspections', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    const vehicleId = req.query.vehicle_id;

    let query = `SELECT * FROM inspections`;
    let params = [];

    if (vehicleId) {
      query += ` WHERE vehicle_id = $1`;
      params.push(vehicleId);
      query += ` ORDER BY inspection_date DESC LIMIT $2 OFFSET $3`;
      params.push(limit, offset);
    } else {
      query += ` ORDER BY inspection_date DESC LIMIT $1 OFFSET $2`;
      params = [limit, offset];
    }

    const result = await pool.query(query, params);
    const countResult = await pool.query('SELECT COUNT(*) as total FROM inspections');

    res.json({
      data: result.rows,
      count: result.rowCount,
      total: parseInt(countResult.rows[0].total),
      limit,
      offset
    });
  } catch (error) {
    console.error('Inspections endpoint error:', error);
    res.status(500).json({
      error: 'Failed to fetch inspections',
      details: error.message
    });
  }
});

app.post('/api/v1/inspections', async (req, res) => {
  try {
    const {
      tenant_id, vehicle_id, inspector_id, inspection_date, inspection_type,
      status, odometer_reading, inspection_items, notes
    } = req.body;

    if (!tenant_id || !vehicle_id || !inspection_type) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['tenant_id', 'vehicle_id', 'inspection_type']
      });
    }

    const result = await pool.query(
      `INSERT INTO inspections (
        tenant_id, vehicle_id, inspector_id, inspection_date, inspection_type,
        status, odometer_reading, inspection_items, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        tenant_id, vehicle_id, inspector_id, inspection_date || new Date(),
        inspection_type, status || 'passed', odometer_reading,
        inspection_items ? JSON.stringify(inspection_items) : null, notes
      ]
    );

    res.status(201).json({
      data: result.rows[0],
      message: 'Inspection created successfully'
    });
  } catch (error) {
    console.error('Inspection creation error:', error);
    res.status(500).json({
      error: 'Failed to create inspection',
      details: error.message
    });
  }
});


// ============================================================================
// Charging Stations API
// ============================================================================
app.get('/api/v1/charging-stations', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;

    const result = await pool.query(
      `SELECT * FROM charging_stations
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await pool.query('SELECT COUNT(*) as total FROM charging_stations');

    res.json({
      data: result.rows,
      count: result.rowCount,
      total: parseInt(countResult.rows[0].total),
      limit,
      offset
    });
  } catch (error) {
    console.error('Charging stations endpoint error:', error);
    res.status(500).json({
      error: 'Failed to fetch charging stations',
      details: error.message
    });
  }
});

app.post('/api/v1/charging-stations', async (req, res) => {
  try {
    const {
      tenant_id, station_name, station_type, location, latitude,
      longitude, is_operational, max_power_kw, connector_types
    } = req.body;

    if (!tenant_id || !station_name || !station_type) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['tenant_id', 'station_name', 'station_type']
      });
    }

    const result = await pool.query(
      `INSERT INTO charging_stations (
        tenant_id, station_name, station_type, location, latitude,
        longitude, is_operational, max_power_kw, connector_types
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        tenant_id, station_name, station_type, location, latitude,
        longitude, is_operational !== false, max_power_kw,
        connector_types ? JSON.stringify(connector_types) : null
      ]
    );

    res.status(201).json({
      data: result.rows[0],
      message: 'Charging station created successfully'
    });
  } catch (error) {
    console.error('Charging station creation error:', error);
    res.status(500).json({
      error: 'Failed to create charging station',
      details: error.message
    });
  }
});

// ============================================================================
// Charging Sessions API
// ============================================================================
app.get('/api/v1/charging-sessions', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    const vehicleId = req.query.vehicle_id;

    let query = `SELECT * FROM charging_sessions`;
    let params = [];

    if (vehicleId) {
      query += ` WHERE vehicle_id = $1`;
      params.push(vehicleId);
      query += ` ORDER BY start_time DESC LIMIT $2 OFFSET $3`;
      params.push(limit, offset);
    } else {
      query += ` ORDER BY start_time DESC LIMIT $1 OFFSET $2`;
      params = [limit, offset];
    }

    const result = await pool.query(query, params);
    const countResult = await pool.query('SELECT COUNT(*) as total FROM charging_sessions');

    res.json({
      data: result.rows,
      count: result.rowCount,
      total: parseInt(countResult.rows[0].total),
      limit,
      offset
    });
  } catch (error) {
    console.error('Charging sessions endpoint error:', error);
    res.status(500).json({
      error: 'Failed to fetch charging sessions',
      details: error.message
    });
  }
});

app.post('/api/v1/charging-sessions', async (req, res) => {
  try {
    const {
      tenant_id, charging_station_id, vehicle_id, start_time, end_time,
      energy_kwh, cost, initial_soc_percent, final_soc_percent
    } = req.body;

    if (!tenant_id || !charging_station_id || !vehicle_id) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['tenant_id', 'charging_station_id', 'vehicle_id']
      });
    }

    const result = await pool.query(
      `INSERT INTO charging_sessions (
        tenant_id, charging_station_id, vehicle_id, start_time, end_time,
        energy_kwh, cost, initial_soc_percent, final_soc_percent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        tenant_id, charging_station_id, vehicle_id, start_time || new Date(),
        end_time, energy_kwh, cost, initial_soc_percent, final_soc_percent
      ]
    );

    res.status(201).json({
      data: result.rows[0],
      message: 'Charging session created successfully'
    });
  } catch (error) {
    console.error('Charging session creation error:', error);
    res.status(500).json({
      error: 'Failed to create charging session',
      details: error.message
    });
  }
});

// ============================================================================
// Routes API
// ============================================================================
app.get('/api/v1/routes', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;

    const result = await pool.query(
      `SELECT * FROM routes
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await pool.query('SELECT COUNT(*) as total FROM routes');

    res.json({
      data: result.rows,
      count: result.rowCount,
      total: parseInt(countResult.rows[0].total),
      limit,
      offset
    });
  } catch (error) {
    console.error('Routes endpoint error:', error);
    res.status(500).json({
      error: 'Failed to fetch routes',
      details: error.message
    });
  }
});

app.post('/api/v1/routes', async (req, res) => {
  try {
    const {
      tenant_id, route_name, start_location, end_location, waypoints,
      distance_miles, estimated_time_minutes, route_geometry
    } = req.body;

    if (!tenant_id || !route_name || !start_location || !end_location) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['tenant_id', 'route_name', 'start_location', 'end_location']
      });
    }

    const result = await pool.query(
      `INSERT INTO routes (
        tenant_id, route_name, start_location, end_location, waypoints,
        distance_miles, estimated_time_minutes, route_geometry
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        tenant_id, route_name, start_location, end_location,
        waypoints ? JSON.stringify(waypoints) : null,
        distance_miles, estimated_time_minutes,
        route_geometry ? JSON.stringify(route_geometry) : null
      ]
    );

    res.status(201).json({
      data: result.rows[0],
      message: 'Route created successfully'
    });
  } catch (error) {
    console.error('Route creation error:', error);
    res.status(500).json({
      error: 'Failed to create route',
      details: error.message
    });
  }
});

// ============================================================================
// Telematics API
// ============================================================================
app.get('/api/v1/telematics', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    const vehicleId = req.query.vehicle_id;

    let query = `SELECT * FROM telematics_data`;
    let params = [];

    if (vehicleId) {
      query += ` WHERE vehicle_id = $1`;
      params.push(vehicleId);
      query += ` ORDER BY created_at DESC LIMIT $2 OFFSET $3`;
      params.push(limit, offset);
    } else {
      query += ` ORDER BY created_at DESC LIMIT $1 OFFSET $2`;
      params = [limit, offset];
    }

    const result = await pool.query(query, params);
    const countResult = await pool.query('SELECT COUNT(*) as total FROM telematics_data');

    res.json({
      data: result.rows,
      count: result.rowCount,
      total: parseInt(countResult.rows[0].total),
      limit,
      offset
    });
  } catch (error) {
    console.error('Telematics endpoint error:', error);
    res.status(500).json({
      error: 'Failed to fetch telematics data',
      details: error.message
    });
  }
});


// ============================================================================
// Fuel Transactions API
// ============================================================================
app.get('/api/v1/fuel-transactions', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    const vehicleId = req.query.vehicle_id;

    let query = `SELECT * FROM fuel_transactions`;
    let params = [];

    if (vehicleId) {
      query += ` WHERE vehicle_id = $1`;
      params.push(vehicleId);
      query += ` ORDER BY transaction_date DESC LIMIT $2 OFFSET $3`;
      params.push(limit, offset);
    } else {
      query += ` ORDER BY transaction_date DESC LIMIT $1 OFFSET $2`;
      params = [limit, offset];
    }

    const result = await pool.query(query, params);
    const countResult = await pool.query('SELECT COUNT(*) as total FROM fuel_transactions');

    res.json({
      data: result.rows,
      count: result.rowCount,
      total: parseInt(countResult.rows[0].total),
      limit,
      offset
    });
  } catch (error) {
    console.error('Fuel transactions endpoint error:', error);
    res.status(500).json({
      error: 'Failed to fetch fuel transactions',
      details: error.message
    });
  }
});

app.post('/api/v1/fuel-transactions', async (req, res) => {
  try {
    const {
      tenant_id, vehicle_id, driver_id, transaction_date, gallons,
      cost_per_gallon, total_cost, location, odometer_reading
    } = req.body;

    if (!tenant_id || !vehicle_id || !gallons) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['tenant_id', 'vehicle_id', 'gallons']
      });
    }

    const result = await pool.query(
      `INSERT INTO fuel_transactions (
        tenant_id, vehicle_id, driver_id, transaction_date, gallons,
        cost_per_gallon, total_cost, location, odometer_reading
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        tenant_id, vehicle_id, driver_id, transaction_date || new Date(),
        gallons, cost_per_gallon, total_cost, location, odometer_reading
      ]
    );

    res.status(201).json({
      data: result.rows[0],
      message: 'Fuel transaction created successfully'
    });
  } catch (error) {
    console.error('Fuel transaction creation error:', error);
    res.status(500).json({
      error: 'Failed to create fuel transaction',
      details: error.message
    });
  }
});

// ============================================================================
// Cost Analysis API
// ============================================================================
app.get('/api/v1/cost-analysis', async (req, res) => {
  try {
    const vehicleId = req.query.vehicle_id;
    const startDate = req.query.start_date;
    const endDate = req.query.end_date;

    // Basic cost analysis aggregation
    let query = `
      SELECT
        v.id as vehicle_id,
        v.make,
        v.model,
        v.year,
        COUNT(DISTINCT m.id) as maintenance_count,
        COALESCE(SUM(m.actual_cost_cents), 0) as total_maintenance_cost_cents,
        COUNT(DISTINCT f.id) as fuel_transaction_count,
        COALESCE(SUM(f.total_cost), 0) as total_fuel_cost,
        COUNT(DISTINCT wo.id) as work_order_count,
        COALESCE(SUM(wo.labor_cost + wo.parts_cost), 0) as total_work_order_cost
      FROM vehicles v
      LEFT JOIN maintenance m ON v.id = m.vehicle_id
      LEFT JOIN fuel_transactions f ON v.id = f.vehicle_id
      LEFT JOIN work_orders wo ON v.id = wo.vehicle_id
    `;

    let params = [];
    let whereClause = [];

    if (vehicleId) {
      whereClause.push(`v.id = $${params.length + 1}`);
      params.push(vehicleId);
    }

    if (startDate && endDate) {
      whereClause.push(`(m.scheduled_date BETWEEN $${params.length + 1} AND $${params.length + 2}
                        OR f.transaction_date BETWEEN $${params.length + 1} AND $${params.length + 2})`);
      params.push(startDate, endDate);
    }

    if (whereClause.length > 0) {
      query += ` WHERE ${whereClause.join(' AND ')}`;
    }

    query += ` GROUP BY v.id, v.make, v.model, v.year ORDER BY total_maintenance_cost_cents DESC`;

    const result = await pool.query(query, params);

    res.json({
      data: result.rows,
      count: result.rowCount
    });
  } catch (error) {
    console.error('Cost analysis endpoint error:', error);
    res.status(500).json({
      error: 'Failed to fetch cost analysis',
      details: error.message
    });
  }
});


// ============================================================================
// Stats API
// ============================================================================
app.get('/api/v1/stats', async (req, res) => {
  try {
    const vehicleCount = await pool.query('SELECT COUNT(*) as count FROM vehicles');
    const driverCount = await pool.query('SELECT COUNT(*) as count FROM drivers');
    const activeVehicles = await pool.query("SELECT COUNT(*) as count FROM vehicles WHERE status = 'active'");
    const activeDrivers = await pool.query("SELECT COUNT(*) as count FROM drivers WHERE status = 'active'");

    res.json({
      vehicles: {
        total: parseInt(vehicleCount.rows[0].count),
        active: parseInt(activeVehicles.rows[0].count)
      },
      drivers: {
        total: parseInt(driverCount.rows[0].count),
        active: parseInt(activeDrivers.rows[0].count)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Stats endpoint error:', error);
    res.status(500).json({
      error: 'Failed to fetch stats',
      details: error.message
    });
  }
});

// ============================================================================
// Legacy routes (redirects to /v1/ endpoints for backwards compatibility)
// ============================================================================
app.get('/api/vehicles', (req, res) => req.app._router.handle(Object.assign(req, { url: '/api/v1/vehicles' + (req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '') }), res));
app.get('/api/vehicles/:id', (req, res) => req.app._router.handle(Object.assign(req, { url: `/api/v1/vehicles/${req.params.id}` }), res));
app.get('/api/drivers', (req, res) => req.app._router.handle(Object.assign(req, { url: '/api/v1/drivers' + (req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '') }), res));
app.get('/api/drivers/:id', (req, res) => req.app._router.handle(Object.assign(req, { url: `/api/v1/drivers/${req.params.id}` }), res));
app.get('/api/stats', (req, res) => req.app._router.handle(Object.assign(req, { url: '/api/v1/stats' }), res));

// ============================================================================
// Root API endpoint
// ============================================================================
app.get('/api', (req, res) => {
  res.json({
    name: 'Fleet Management API',
    version: '3.0.0',
    status: 'running',
    database: 'PostgreSQL (110+ tables)',
    features: {
      googleMaps: true,
      realTimeTracking: true,
      grokAI: true,
      workOrders: true,
      maintenance: true,
      safety: true,
      evCharging: true,
      telematics: true,
      costAnalytics: true
    },
    endpoints: {
      health: '/api/health',

      // Core Resources
      vehicles: '/api/v1/vehicles (GET, POST)',
      vehicle: '/api/v1/vehicles/:id (GET, PUT, DELETE)',
      drivers: '/api/v1/drivers (GET, POST)',
      driver: '/api/v1/drivers/:id (GET, PUT, DELETE)',
      stats: '/api/v1/stats',

      // Maintenance & Work Orders
      workOrders: '/api/v1/work-orders (GET, POST)',
      workOrder: '/api/v1/work-orders/:id (GET, PUT, DELETE)',
      maintenance: '/api/v1/maintenance (GET, POST)',
      maintenanceRecord: '/api/v1/maintenance/:id (PUT, DELETE)',

      // Safety & Compliance
      safetyIncidents: '/api/v1/safety-incidents (GET, POST)',
      safetyIncident: '/api/v1/safety-incidents/:id (PUT)',
      inspections: '/api/v1/inspections (GET, POST)',

      // EV Charging
      chargingStations: '/api/v1/charging-stations (GET, POST)',
      chargingSessions: '/api/v1/charging-sessions (GET, POST)',

      // Routes & Telematics
      routes: '/api/v1/routes (GET, POST)',
      telematics: '/api/v1/telematics (GET)',

      // Fuel Management
      fuelTransactions: '/api/v1/fuel-transactions (GET, POST)',

      // Cost Analytics
      costAnalysis: '/api/v1/cost-analysis (GET)'
    },
    totalEndpoints: 40,
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Fleet Management API',
    version: '3.0.0',
    status: 'operational',
    database: 'PostgreSQL (110+ tables)',
    message: 'Visit /api for full endpoint documentation',
    quickLinks: {
      api: '/api',
      health: '/health',
      vehicles: '/api/v1/vehicles',
      drivers: '/api/v1/drivers',
      workOrders: '/api/v1/work-orders',
      maintenance: '/api/v1/maintenance',
      safetyIncidents: '/api/v1/safety-incidents',
      inspections: '/api/v1/inspections',
      chargingStations: '/api/v1/charging-stations',
      routes: '/api/v1/routes',
      telematics: '/api/v1/telematics',
      fuelTransactions: '/api/v1/fuel-transactions',
      stats: '/api/v1/stats'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.url,
    method: req.method,
    message: 'Visit /api for full endpoint documentation',
    availableEndpoints: ['/api', '/health']
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 ========================================`);
  console.log(`   FleetOps API Server v3.0.0 Started`);
  console.log(`   Connected to PostgreSQL (110+ tables)`);
  console.log(`   Google Maps Integration: ENABLED`);
  console.log(`   40+ Endpoints Available`);
  console.log(`========================================`);
  console.log(``);
  console.log(`✅ API Documentation: http://localhost:${PORT}/api`);
  console.log(`📊 Health Check: http://localhost:${PORT}/health`);
  console.log(``);
  console.log(`📦 Core Resources:`);
  console.log(`   🚚 Vehicles: http://localhost:${PORT}/api/v1/vehicles`);
  console.log(`   👤 Drivers: http://localhost:${PORT}/api/v1/drivers`);
  console.log(`   📈 Stats: http://localhost:${PORT}/api/v1/stats`);
  console.log(``);
  console.log(`🔧 Maintenance:`);
  console.log(`   🛠️  Work Orders: http://localhost:${PORT}/api/v1/work-orders`);
  console.log(`   🔩 Maintenance: http://localhost:${PORT}/api/v1/maintenance`);
  console.log(``);
  console.log(`🛡️  Safety:`);
  console.log(`   🚨 Incidents: http://localhost:${PORT}/api/v1/safety-incidents`);
  console.log(`   ✅ Inspections: http://localhost:${PORT}/api/v1/inspections`);
  console.log(``);
  console.log(`🔋 EV Charging:`);
  console.log(`   ⚡ Stations: http://localhost:${PORT}/api/v1/charging-stations`);
  console.log(`   🔌 Sessions: http://localhost:${PORT}/api/v1/charging-sessions`);
  console.log(``);
  console.log(`📍 Routes & Telematics:`);
  console.log(`   🗺️  Routes: http://localhost:${PORT}/api/v1/routes`);
  console.log(`   📡 Telematics: http://localhost:${PORT}/api/v1/telematics`);
  console.log(``);
  console.log(`💰 Cost & Fuel:`);
  console.log(`   ⛽ Fuel: http://localhost:${PORT}/api/v1/fuel-transactions`);
  console.log(`   💵 Cost Analysis: http://localhost:${PORT}/api/v1/cost-analysis`);
  console.log(``);
  console.log(`Database host: ${process.env.DB_HOST || 'fleet-postgres-service'}`);
  console.log(`========================================`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  pool.end(() => {
    console.log('Database pool closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  pool.end(() => {
    console.log('Database pool closed');
    process.exit(0);
  });
});
