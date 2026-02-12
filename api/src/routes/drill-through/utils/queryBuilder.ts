/**
 * Drill-Through Query Builder
 * Constructs parameterized SQL queries based on entity type, filters, and pagination.
 */

// Whitelist of allowed entity types mapped to their table configurations
const ENTITY_CONFIG: Record<string, {
  table: string;
  selectColumns: string;
  joins?: string;
  orderBy: string;
  summarySelect?: string;
  summaryFrom?: string;
}> = {
  vehicles: {
    table: 'vehicles',
    selectColumns: `id, vin, year, make, model, license_plate, status, department,
                    assigned_driver, mileage, fuel_type, location, tenant_id`,
    orderBy: 'id DESC',
    summarySelect: `COUNT(*) as total_vehicles,
                    COUNT(DISTINCT department) as departments,
                    SUM(mileage) as total_mileage,
                    COUNT(*) FILTER (WHERE status = 'active') as active_vehicles`,
  },
  trips: {
    table: 'trips',
    selectColumns: `t.id, t.vehicle_id, v.vin, t.driver_id, u.first_name || ' ' || u.last_name as driver_name,
                    t.start_time, t.end_time, t.distance, t.fuel_used, t.purpose`,
    joins: 'LEFT JOIN vehicles v ON t.vehicle_id = v.id LEFT JOIN users u ON t.driver_id = u.id',
    orderBy: 't.start_time DESC',
    summarySelect: `COUNT(*) as total_trips, SUM(t.distance) as total_distance,
                    SUM(t.fuel_used) as total_fuel, AVG(t.distance) as avg_distance`,
    summaryFrom: 'trips t',
  },
  fuel_transactions: {
    table: 'fuel_transactions',
    selectColumns: `ft.id, ft.vehicle_id, v.vin, ft.date, ft.gallons, ft.cost,
                    ft.odometer, ft.fuel_type, ft.vendor, ft.location`,
    joins: 'LEFT JOIN vehicles v ON ft.vehicle_id = v.id',
    orderBy: 'ft.date DESC',
    summarySelect: `COUNT(*) as total_transactions, SUM(ft.gallons) as total_gallons,
                    SUM(ft.cost) as total_cost, AVG(ft.cost / NULLIF(ft.gallons, 0)) as avg_price_per_gallon`,
    summaryFrom: 'fuel_transactions ft',
  },
  maintenance_records: {
    table: 'maintenance_records',
    selectColumns: `mr.id, mr.vehicle_id, v.vin, mr.date, mr.type, mr.description,
                    mr.cost, mr.vendor, mr.next_service_date`,
    joins: 'LEFT JOIN vehicles v ON mr.vehicle_id = v.id',
    orderBy: 'mr.date DESC',
    summarySelect: `COUNT(*) as total_services, SUM(mr.cost) as total_cost,
                    AVG(mr.cost) as avg_cost, COUNT(DISTINCT mr.vehicle_id) as vehicles_serviced`,
    summaryFrom: 'maintenance_records mr',
  },
  drivers: {
    table: 'drivers',
    selectColumns: `d.id, u.first_name, u.last_name, u.email, d.license_number,
                    d.license_expiry, d.status, d.employee_number, d.tenant_id`,
    joins: 'LEFT JOIN users u ON d.user_id = u.id',
    orderBy: 'u.last_name ASC, u.first_name ASC',
  },
  inspections: {
    table: 'inspections',
    selectColumns: `id, vehicle_id, type, status, started_at, completed_at,
                    inspector_name, result, tenant_id`,
    orderBy: 'started_at DESC',
  },
  incidents: {
    table: 'incidents',
    selectColumns: `id, vehicle_id, type, severity, status, incident_date,
                    description, location, tenant_id`,
    orderBy: 'incident_date DESC',
  },
  traffic_cameras: {
    table: 'traffic_cameras',
    selectColumns: `id, fdot_id, name, description, latitude, longitude,
                    road, direction, county, status, last_updated`,
    orderBy: 'county, road',
  },
  traffic_incidents: {
    table: 'traffic_incidents',
    selectColumns: `id, incident_id, type, description, latitude, longitude,
                    road, county, start_time, end_time, severity, lanes_affected`,
    orderBy: 'start_time DESC',
  },
};

// Whitelist of allowed filter column names to prevent SQL injection
const ALLOWED_FILTER_COLUMNS = new Set([
  'tenant_id', 'status', 'department', 'fuel_type', 'type', 'severity',
  'vehicle_id', 'driver_id', 'county', 'road', 'direction', 'make',
  'model', 'year', 'assignment_type', 'lifecycle_state', 'vendor',
  'purpose', 'location', 'license_plate', 'vin',
]);

function sanitizeColumnName(column: string): string {
  // Only allow alphanumeric and underscore characters
  return column.replace(/[^a-zA-Z0-9_]/g, '');
}

export function buildQuery(filters: any): { query: string; params: any[] } {
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (filters.tenantId) {
    conditions.push(`tenant_id = $${paramIndex++}`);
    params.push(filters.tenantId);
  }

  if (filters.status) {
    conditions.push(`status = $${paramIndex++}`);
    params.push(filters.status);
  }

  if (filters.department) {
    conditions.push(`department = $${paramIndex++}`);
    params.push(filters.department);
  }

  if (filters.dateFrom) {
    conditions.push(`created_at >= $${paramIndex++}::timestamp`);
    params.push(filters.dateFrom);
  }

  if (filters.dateTo) {
    conditions.push(`created_at <= $${paramIndex++}::timestamp`);
    params.push(filters.dateTo);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const table = sanitizeColumnName(filters.table || 'vehicles');

  // Verify the table is in our allowed entity config
  if (!ENTITY_CONFIG[table]) {
    return {
      query: `SELECT * FROM vehicles WHERE tenant_id = $1 LIMIT 50`,
      params: [filters.tenantId || '']
    };
  }

  const config = ENTITY_CONFIG[table];
  const query = `SELECT ${config.selectColumns} FROM ${config.table} ${whereClause} ORDER BY ${config.orderBy}`;

  return { query, params };
}

export function buildDrillThroughQuery(
  entityType: string,
  filters: Record<string, any>,
  limit: number,
  offset: number
): {
  query: string;
  countQuery: string;
  params: any[];
  summary?: { query: string; params: any[] };
} {
  const config = ENTITY_CONFIG[entityType];
  if (!config) {
    throw new Error(`Unsupported entity type: ${entityType}. Allowed types: ${Object.keys(ENTITY_CONFIG).join(', ')}`);
  }

  const filterConditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  // Build parameterized filter conditions using only whitelisted column names
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null) continue;

    const sanitizedKey = sanitizeColumnName(key);
    if (!ALLOWED_FILTER_COLUMNS.has(sanitizedKey)) continue;

    // Determine correct column prefix based on entity type
    let columnRef = sanitizedKey;
    if (config.joins) {
      // For joined queries, use the main table alias
      const tableAlias = entityType === 'trips' ? 't'
        : entityType === 'fuel_transactions' ? 'ft'
        : entityType === 'maintenance_records' ? 'mr'
        : entityType === 'drivers' ? 'd'
        : '';
      if (tableAlias) {
        columnRef = `${tableAlias}.${sanitizedKey}`;
      }
    }

    if (Array.isArray(value)) {
      filterConditions.push(`${columnRef} = ANY($${paramIndex})`);
      params.push(value);
    } else {
      filterConditions.push(`${columnRef} = $${paramIndex}`);
      params.push(value);
    }
    paramIndex++;
  }

  const whereClause = filterConditions.length > 0
    ? `WHERE ${filterConditions.join(' AND ')}`
    : '';

  // Construct the table reference (with alias for joined tables)
  const tableAlias = config.joins
    ? `${config.table} ${config.table === 'trips' ? 't' : config.table === 'fuel_transactions' ? 'ft' : config.table === 'maintenance_records' ? 'mr' : config.table === 'drivers' ? 'd' : ''}`
    : config.table;
  const joinClause = config.joins || '';

  const baseQuery = `SELECT ${config.selectColumns} FROM ${tableAlias} ${joinClause} ${whereClause} ORDER BY ${config.orderBy}`;

  // Add pagination params
  params.push(limit, offset);
  const query = `${baseQuery} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;

  // Count query uses the same filters but no ORDER BY, LIMIT, or OFFSET
  const countBase = `SELECT COUNT(*) FROM ${tableAlias} ${joinClause} ${whereClause}`;
  const countQuery = countBase;

  const result: {
    query: string;
    countQuery: string;
    params: any[];
    summary?: { query: string; params: any[] };
  } = {
    query,
    countQuery,
    params,
  };

  // Build summary query if the entity type has summary config
  if (config.summarySelect) {
    const summaryFrom = config.summaryFrom || config.table;
    const summaryJoins = config.joins || '';
    result.summary = {
      query: `SELECT ${config.summarySelect} FROM ${summaryFrom} ${summaryJoins} ${whereClause}`,
      params: params.slice(0, -2), // Exclude LIMIT/OFFSET params
    };
  }

  return result;
}
