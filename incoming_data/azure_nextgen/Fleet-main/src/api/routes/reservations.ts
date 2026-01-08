// Fleet Reservation System - Backend API
// Endpoints: CRUD reservations, availability check, Outlook sync
// Security: Parameterized queries, JWT auth, input validation

import { Client } from '@microsoft/microsoft-graph-client';
import express, { Request, Response } from 'express';
import { Pool } from 'pg';

const router = express.Router();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Microsoft Graph client
function getGraphClient(accessToken: string) {
  return Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    }
  });
}

// GET /api/v1/reservations - List all reservations
router.get('/reservations', async (req: Request, res: Response) => {
  try {
    const { status, vehicleId, driverId, startDate, endDate, limit = '50', offset = '0' } = req.query;

    let query = `
      SELECT
        r.*,
        v.make || ' ' || v.model || ' (' || v.year || ')' as vehicle_name,
        d.name as driver_name,
        d.email as driver_email,
        u.name as approved_by_name
      FROM reservations r
      LEFT JOIN vehicles v ON r.vehicle_id = v.id
      LEFT JOIN drivers d ON r.driver_id = d.id
      LEFT JOIN users u ON r.approved_by = u.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramCount = 1;

    if (status) {
      query += ` AND r.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (vehicleId) {
      query += ` AND r.vehicle_id = $${paramCount}`;
      params.push(vehicleId);
      paramCount++;
    }

    if (driverId) {
      query += ` AND r.driver_id = $${paramCount}`;
      params.push(driverId);
      paramCount++;
    }

    if (startDate) {
      query += ` AND r.end_date >= $${paramCount}`;
      params.push(startDate);
      paramCount++;
    }

    if (endDate) {
      query += ` AND r.start_date <= $${paramCount}`;
      params.push(endDate);
      paramCount++;
    }

    query += ` ORDER BY r.start_date DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(parseInt(limit as string), parseInt(offset as string));

    const result = await pool.query(query, params);

    res.json({
      reservations: result.rows,
      total: result.rowCount,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });
  } catch (error) {
    console.error('Error fetching reservations:', error);
    res.status(500).json({ error: 'Failed to fetch reservations' });
  }
});

// GET /api/v1/reservations/:id - Get single reservation
router.get('/reservations/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT
        r.*,
        v.make || ' ' || v.model || ' (' || v.year || ')' as vehicle_name,
        v.vin,
        d.name as driver_name,
        d.email as driver_email,
        d.license_number,
        u.name as approved_by_name
      FROM reservations r
      LEFT JOIN vehicles v ON r.vehicle_id = v.id
      LEFT JOIN drivers d ON r.driver_id = d.id
      LEFT JOIN users u ON r.approved_by = u.id
      WHERE r.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching reservation:', error);
    res.status(500).json({ error: 'Failed to fetch reservation' });
  }
});

// POST /api/v1/reservations/availability - Check availability
router.post('/reservations/availability', async (req: Request, res: Response) => {
  try {
    const { vehicleId, startDate, endDate } = req.body;

    // Validate inputs
    if (!vehicleId || !startDate || !endDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check for conflicts
    const conflicts = await pool.query(`
      SELECT
        r.*,
        v.make || ' ' || v.model as vehicle_name,
        d.name as driver_name
      FROM reservations r
      LEFT JOIN vehicles v ON r.vehicle_id = v.id
      LEFT JOIN drivers d ON r.driver_id = d.id
      WHERE r.vehicle_id = $1
        AND r.status IN ('pending', 'approved', 'active')
        AND (
          (r.start_date <= $2 AND r.end_date >= $2) OR
          (r.start_date <= $3 AND r.end_date >= $3) OR
          (r.start_date >= $2 AND r.end_date <= $3)
        )
    `, [vehicleId, startDate, endDate]);

    const available = conflicts.rows.length === 0;

    // If not available, suggest alternatives
    let alternatives: any[] = [];
    if (!available) {
      const altResult = await pool.query(`
        SELECT
          v.*,
          v.make || ' ' || v.model || ' (' || v.year || ')' as display_name
        FROM vehicles v
        WHERE v.status = 'active'
          AND v.id != $1
          AND NOT EXISTS (
            SELECT 1 FROM reservations r
            WHERE r.vehicle_id = v.id
              AND r.status IN ('pending', 'approved', 'active')
              AND (
                (r.start_date <= $2 AND r.end_date >= $2) OR
                (r.start_date <= $3 AND r.end_date >= $3) OR
                (r.start_date >= $2 AND r.end_date <= $3)
              )
          )
        LIMIT 5
      `, [vehicleId, startDate, endDate]);

      alternatives = altResult.rows;
    }

    res.json({
      available,
      conflicts: conflicts.rows,
      alternativeVehicles: alternatives
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({ error: 'Failed to check availability' });
  }
});

// POST /api/v1/reservations - Create new reservation
router.post('/reservations', async (req: Request, res: Response) => {
  try {
    const {
      vehicleId,
      driverId,
      startDate,
      endDate,
      purpose,
      department,
      costCenter
    } = req.body;

    // Validate required fields
    if (!vehicleId || !driverId || !startDate || !endDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate dates
    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({ error: 'End date must be after start date' });
    }

    // Check availability
    const availCheck = await pool.query(`
      SELECT COUNT(*) as count
      FROM reservations
      WHERE vehicle_id = $1
        AND status IN ('pending', 'approved', 'active')
        AND (
          (start_date <= $2 AND end_date >= $2) OR
          (start_date <= $3 AND end_date >= $3) OR
          (start_date >= $2 AND end_date <= $3)
        )
    `, [vehicleId, startDate, endDate]);

    if (parseInt(availCheck.rows[0].count) > 0) {
      return res.status(409).json({ error: 'Vehicle not available for selected dates' });
    }

    // Create reservation
    const result = await pool.query(`
      INSERT INTO reservations (
        vehicle_id,
        driver_id,
        start_date,
        end_date,
        purpose,
        department,
        cost_center,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
      RETURNING *
    `, [vehicleId, driverId, startDate, endDate, purpose, department, costCenter]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating reservation:', error);
    res.status(500).json({ error: 'Failed to create reservation' });
  }
});

// PATCH /api/v1/reservations/:id/status - Update status
router.patch('/reservations/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = (req as any).user?.id; // From JWT middleware

    // Validate status
    const validStatuses = ['pending', 'approved', 'rejected', 'active', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Update reservation
    let query = 'UPDATE reservations SET status = $1, updated_at = NOW()';
    const params: any[] = [status];
    let paramCount = 2;

    if (status === 'approved' && userId) {
      query += `, approved_by = $${paramCount}, approved_at = NOW()`;
      params.push(userId);
      paramCount++;
    }

    query += ` WHERE id = $${paramCount} RETURNING *`;
    params.push(id);

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    // TODO: Send notification email via Microsoft Graph

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating reservation:', error);
    res.status(500).json({ error: 'Failed to update reservation' });
  }
});

// GET /api/v1/reservations/calendar/:year/:month
router.get('/reservations/calendar/:year/:month', async (req: Request, res: Response) => {
  try {
    const { year, month } = req.params;

    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);

    const result = await pool.query(`
      SELECT
        r.*,
        v.make || ' ' || v.model as vehicle_name,
        d.name as driver_name
      FROM reservations r
      LEFT JOIN vehicles v ON r.vehicle_id = v.id
      LEFT JOIN drivers d ON r.driver_id = d.id
      WHERE r.start_date <= $2 AND r.end_date >= $1
      ORDER BY r.start_date
    `, [startDate, endDate]);

    res.json({
      year: parseInt(year),
      month: parseInt(month),
      reservations: result.rows
    });
  } catch (error) {
    console.error('Error fetching calendar:', error);
    res.status(500).json({ error: 'Failed to fetch calendar' });
  }
});

// POST /api/v1/reservations/:id/outlook-sync
router.post('/reservations/:id/outlook-sync', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const accessToken = req.headers.authorization?.replace('Bearer ', '');

    if (!accessToken) {
      return res.status(401).json({ error: 'Missing access token' });
    }

    // Fetch reservation
    const reservation = await pool.query(`
      SELECT
        r.*,
        v.make || ' ' || v.model as vehicle_name,
        d.email as driver_email
      FROM reservations r
      LEFT JOIN vehicles v ON r.vehicle_id = v.id
      LEFT JOIN drivers d ON r.driver_id = d.id
      WHERE r.id = $1
    `, [id]);

    if (reservation.rows.length === 0) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    const res_data = reservation.rows[0];

    // Create calendar event via Microsoft Graph
    const graphClient = getGraphClient(accessToken);

    const event = {
      subject: `Vehicle Reservation: ${res_data.vehicle_name}`,
      body: {
        contentType: 'HTML',
        content: `<p>${res_data.purpose || 'Vehicle reservation'}</p>`
      },
      start: {
        dateTime: res_data.start_date,
        timeZone: 'UTC'
      },
      end: {
        dateTime: res_data.end_date,
        timeZone: 'UTC'
      },
      attendees: [
        {
          emailAddress: {
            address: res_data.driver_email
          },
          type: 'required'
        }
      ]
    };

    const createdEvent = await graphClient.api('/me/events').post(event);

    // Update reservation with Outlook event ID
    await pool.query(`
      UPDATE reservations
      SET outlook_event_id = $1, updated_at = NOW()
      WHERE id = $2
    `, [createdEvent.id, id]);

    res.json({
      success: true,
      eventId: createdEvent.id,
      webLink: createdEvent.webLink
    });
  } catch (error) {
    console.error('Error syncing with Outlook:', error);
    res.status(500).json({ error: 'Failed to sync with Outlook' });
  }
});

export default router;
