// Minimal test of the problematic section
const pool = { query: async (...args: any[]) => ({ rows: [] }) };
const req = { user: { tenant_id: '1', id: '1' }, params: { id: '1' }, body: {} };

async function test() {
  const validated = {
    facility_id: '123',
    work_order_number: 'WO-001',
    vehicle_id: 'v1',
    assigned_technician_id: 't1',
    type: 'maintenance',
    priority: 'high',
    status: 'pending',
    description: 'Test',
    odometer_reading: 1000,
    engine_hours_reading: 100,
    scheduled_start: new Date(),
    scheduled_end: new Date(),
    notes: 'test',
  };

  // This is the exact code from lines 150-164
  if (validated.facility_id) {
    const userResult = await pool.query(
      'SELECT facility_ids, scope_level FROM users WHERE id = $1',
      [req.user!.id]
    )
    const user = userResult.rows[0]

    if (user.scope_level === 'team' && user.facility_ids) {
      if (!user.facility_ids.includes(validated.facility_id)) {
        return { error: 'Cannot create work order for facility outside your scope' };
      }
    }
  }

  // This is the exact code from lines 166-172
  const result = await pool.query(
    `INSERT INTO work_orders (
      tenant_id, work_order_number, vehicle_id, facility_id, assigned_technician_id,
      type, priority, status, description, odometer_reading, engine_hours_reading,
      scheduled_start, scheduled_end, notes, created_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    RETURNING *`,
    [
      req.user!.tenant_id,
      validated.work_order_number,
      validated.vehicle_id,
      validated.facility_id,
      validated.assigned_technician_id,
      validated.type,
      validated.priority,
      validated.status,
      validated.description,
      validated.odometer_reading,
      validated.engine_hours_reading,
      validated.scheduled_start,
      validated.scheduled_end,
      validated.notes,
      req.user!.id,
    ]
  )

  return result;
}

test();
