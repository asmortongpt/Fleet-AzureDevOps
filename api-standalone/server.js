const express = require('express');
const { Pool } = require('pg');
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

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

// Configure multer for file uploads
const uploadDir = '/tmp/fleet-uploads';
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

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
      `SELECT
        id, vin, make, model, year, license_plate, vehicle_type, fuel_type, status,
        odometer as mileage,
        latitude, longitude,

        -- Physical Specifications
        engine_size, engine_cylinders, horsepower, transmission_type, transmission_gears,
        drivetrain, exterior_color, interior_color, body_style, doors, seating_capacity,

        -- DOT Compliance & Weights
        gvwr, gcwr, curb_weight, payload_capacity, towing_capacity,
        dot_number, mc_number, dot_inspection_due_date,

        -- Title & Registration
        title_status, title_state, registration_number, registration_state, registration_expiry_date,

        -- Financial & Depreciation
        purchase_date, purchase_price, salvage_value, useful_life_years, useful_life_miles,
        depreciation_method, accumulated_depreciation, current_value,

        -- EV-Specific
        battery_capacity_kwh, battery_health_percent, charge_port_type, estimated_range_miles,

        -- Telematics
        telematics_device_id, telematics_provider, last_telematics_sync,
        gps_device_id, last_gps_update, speed, heading,

        -- Maintenance
        oil_change_interval_miles, tire_rotation_interval_miles,
        last_oil_change_date, last_oil_change_mileage, last_tire_rotation_date,

        -- Acquisition
        acquisition_type, lease_end_date, lease_monthly_payment, lessor_name,

        -- Assignments
        assigned_driver_id, assigned_facility_id,

        -- Metadata
        telematics_data, photos, notes, created_at, updated_at
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

        -- Personal Info (from users table)
        u.first_name,
        u.last_name,
        u.email,
        u.phone,

        -- Address
        d.address,
        d.city,
        d.state,
        d.zip_code,

        -- License Info
        d.license_number,
        d.license_state,
        d.license_expiration,
        d.license_issued_date,
        d.license_restrictions,
        d.cdl_class,
        d.cdl_endorsements,

        -- CDL Endorsements (booleans)
        d.endorsement_hazmat,
        d.endorsement_tanker,
        d.endorsement_passenger,
        d.endorsement_school_bus,
        d.endorsement_doubles,

        -- Medical Certification (DOT)
        d.medical_card_number,
        d.medical_examiner_name,
        d.medical_certification_date,
        d.medical_expiry_date,
        d.medical_card_expiration,
        d.medical_restrictions,
        d.self_certified_status,

        -- Drug & Alcohol Testing
        d.last_drug_test_date,
        d.last_drug_test_result,
        d.last_alcohol_test_date,
        d.last_alcohol_test_result,
        d.clearinghouse_consent_date,
        d.clearinghouse_last_query_date,

        -- Employment
        d.hire_date,
        d.termination_date,
        d.status,
        d.pay_type,
        d.pay_rate,
        d.employment_classification,

        -- HOS Configuration
        d.hos_cycle,
        d.eld_username,
        d.eld_exempt,

        -- Performance Metrics
        d.safety_score,
        d.efficiency_score,
        d.accident_free_days,
        d.violation_free_days,
        d.speeding_incidents_count,
        d.harsh_braking_count,
        d.total_miles_driven,
        d.total_hours_driven,
        d.incidents_count,
        d.violations_count,

        -- Emergency Contact
        d.emergency_contact_name,
        d.emergency_contact_phone,
        d.emergency_contact_2_name,
        d.emergency_contact_2_phone,

        -- Metadata
        d.notes,
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
      'SELECT * FROM drivers WHERE id = $1',
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

// ============================================================================
// Documents API
// ============================================================================

// Helper function to calculate file hashes
async function calculateFileHashes(filePath) {
  const fileBuffer = await fs.readFile(filePath);

  const md5Hash = crypto.createHash('md5').update(fileBuffer).digest('hex');
  const sha256Hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

  return { md5Hash, sha256Hash };
}

// Upload document endpoint
app.post('/api/v1/documents', upload.single('file'), async (req, res) => {
  const client = await pool.connect();

  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { originalname, filename, mimetype, size, path: filePath } = req.file;

    // Calculate MD5 and SHA256 hashes
    console.log('Calculating file hashes...');
    const { md5Hash, sha256Hash } = await calculateFileHashes(filePath);

    // Extract metadata from request body
    const {
      tenant_id = null,
      entity_type = 'document',
      entity_id = null,
      uploaded_by = null,
      is_public = false
    } = req.body;

    // Insert into storage_files table
    const result = await client.query(
      `INSERT INTO storage_files (
        tenant_id,
        file_name,
        file_path,
        file_size_bytes,
        mime_type,
        storage_provider,
        uploaded_by,
        entity_type,
        entity_id,
        is_public,
        metadata,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      RETURNING id, file_name, file_path, file_size_bytes, mime_type, storage_provider, created_at`,
      [
        tenant_id,
        originalname,
        filePath,
        size,
        mimetype,
        'local',
        uploaded_by,
        entity_type,
        entity_id,
        is_public,
        JSON.stringify({
          original_filename: originalname,
          stored_filename: filename,
          file_hash_md5: md5Hash,
          file_hash_sha256: sha256Hash,
          ocr_status: 'pending',
          virus_scan_status: 'pending'
        })
      ]
    );

    const document = result.rows[0];

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      document: {
        id: document.id,
        file_name: document.file_name,
        file_path: document.file_path,
        file_size_bytes: document.file_size_bytes,
        mime_type: document.mime_type,
        storage_provider: document.storage_provider,
        file_hash_md5: md5Hash,
        file_hash_sha256: sha256Hash,
        ocr_status: 'pending',
        virus_scan_status: 'pending',
        created_at: document.created_at
      }
    });

  } catch (error) {
    console.error('Document upload error:', error);

    // Clean up the uploaded file on error
    try {
      if (req.file && req.file.path) {
        await fs.unlink(req.file.path);
      }
    } catch (unlinkError) {
      console.error('Error cleaning up file:', unlinkError);
    }

    res.status(500).json({
      error: 'Failed to upload document',
      details: error.message
    });
  } finally {
    client.release();
  }
});

// Get all documents
app.get('/api/v1/documents', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    const entity_type = req.query.entity_type;
    const entity_id = req.query.entity_id;

    let query = `
      SELECT
        id,
        tenant_id,
        file_name,
        file_path,
        file_size_bytes,
        mime_type,
        storage_provider,
        uploaded_by,
        entity_type,
        entity_id,
        is_public,
        metadata,
        created_at,
        updated_at
      FROM storage_files
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (entity_type) {
      query += ` AND entity_type = $${paramIndex}`;
      params.push(entity_type);
      paramIndex++;
    }

    if (entity_id) {
      query += ` AND entity_id = $${paramIndex}`;
      params.push(entity_id);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    const countResult = await pool.query('SELECT COUNT(*) as total FROM storage_files');

    res.json({
      documents: result.rows,
      data: result.rows,
      count: result.rowCount,
      total: parseInt(countResult.rows[0].total),
      limit,
      offset
    });
  } catch (error) {
    console.error('Documents endpoint error:', error);
    res.status(500).json({
      error: 'Failed to fetch documents',
      details: error.message
    });
  }
});

// Get single document
app.get('/api/v1/documents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM storage_files WHERE id = $1',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json({
      document: result.rows[0],
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Document fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch document',
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
// Work Orders API (Enhanced)
// ============================================================================
app.get('/api/v1/work-orders', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;

    const result = await pool.query(
      `SELECT * FROM work_orders ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await pool.query('SELECT COUNT(*) as total FROM work_orders');

    res.json({
      work_orders: result.rows,
      data: result.rows,
      count: result.rowCount,
      total: parseInt(countResult.rows[0].total),
      limit,
      offset
    });
  } catch (error) {
    console.error('Work orders endpoint error:', error);
    res.status(500).json({ error: 'Failed to fetch work orders', details: error.message });
  }
});

app.get('/api/v1/work-orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM work_orders WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Work order not found' });
    }

    res.json({ work_order: result.rows[0], data: result.rows[0] });
  } catch (error) {
    console.error('Work order fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch work order', details: error.message });
  }
});

// ============================================================================
// Inspections API (Enhanced with DVIR)
// ============================================================================
app.get('/api/v1/inspections', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;

    const result = await pool.query(
      `SELECT * FROM inspections ORDER BY inspection_date DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await pool.query('SELECT COUNT(*) as total FROM inspections');

    res.json({
      inspections: result.rows,
      data: result.rows,
      count: result.rowCount,
      total: parseInt(countResult.rows[0].total),
      limit,
      offset
    });
  } catch (error) {
    console.error('Inspections endpoint error:', error);
    res.status(500).json({ error: 'Failed to fetch inspections', details: error.message });
  }
});

app.get('/api/v1/inspections/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM inspections WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Inspection not found' });
    }

    res.json({ inspection: result.rows[0], data: result.rows[0] });
  } catch (error) {
    console.error('Inspection fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch inspection', details: error.message });
  }
});

// ============================================================================
// Fuel Transactions API (Enhanced with IFTA)
// ============================================================================
app.get('/api/v1/fuel-transactions', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;

    const result = await pool.query(
      `SELECT * FROM fuel_transactions ORDER BY transaction_date DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await pool.query('SELECT COUNT(*) as total FROM fuel_transactions');

    res.json({
      fuel_transactions: result.rows,
      data: result.rows,
      count: result.rowCount,
      total: parseInt(countResult.rows[0].total),
      limit,
      offset
    });
  } catch (error) {
    console.error('Fuel transactions endpoint error:', error);
    res.status(500).json({ error: 'Failed to fetch fuel transactions', details: error.message });
  }
});

// ============================================================================
// Root API endpoint
// ============================================================================
app.get('/api', (req, res) => {
  res.json({
    name: 'Fleet Management API',
    version: '2.0.1',
    status: 'running',
    features: {
      googleMaps: true,
      realTimeTracking: true,
      grokAI: true
    },
    endpoints: {
      health: '/api/health',
      vehicles: '/api/v1/vehicles',
      drivers: '/api/v1/drivers',
      documents: '/api/v1/documents',
      stats: '/api/v1/stats',
      workOrders: '/api/v1/work-orders',
      inspections: '/api/v1/inspections',
      fuelTransactions: '/api/v1/fuel-transactions'
    },
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Fleet Management API',
    version: '2.0.1',
    status: 'operational',
    endpoints: ['/api', '/health', '/api/health', '/api/v1/vehicles', '/api/v1/drivers', '/api/v1/documents', '/api/v1/stats', '/api/v1/work-orders', '/api/v1/inspections', '/api/v1/fuel-transactions']
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.url,
    method: req.method,
    availableEndpoints: ['/api', '/health', '/api/health', '/api/v1/vehicles', '/api/v1/drivers', '/api/v1/documents', '/api/v1/stats', '/api/v1/work-orders', '/api/v1/inspections', '/api/v1/fuel-transactions']
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
  console.log(`   FleetOps API Server v2.0.1 Started`);
  console.log(`   Connected to PostgreSQL`);
  console.log(`   Google Maps Integration: ENABLED`);
  console.log(`========================================`);
  console.log(``);
  console.log(`✅ API: http://localhost:${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/health`);
  console.log(`📊 Health: http://localhost:${PORT}/api/health`);
  console.log(`🚚 Vehicles: http://localhost:${PORT}/api/v1/vehicles`);
  console.log(`👤 Drivers: http://localhost:${PORT}/api/v1/drivers`);
  console.log(`📄 Documents: http://localhost:${PORT}/api/v1/documents`);
  console.log(`📈 Stats: http://localhost:${PORT}/api/v1/stats`);
  console.log(`🔧 Work Orders: http://localhost:${PORT}/api/v1/work-orders`);
  console.log(`🔍 Inspections: http://localhost:${PORT}/api/v1/inspections`);
  console.log(`⛽ Fuel: http://localhost:${PORT}/api/v1/fuel-transactions`);
  console.log(``);
  console.log(`Database host: ${process.env.DB_HOST || 'fleet-postgres-service'}`);
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
