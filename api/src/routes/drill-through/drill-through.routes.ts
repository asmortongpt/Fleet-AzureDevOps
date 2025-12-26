import ExcelJS from 'exceljs';
import { Router, Request, Response } from 'express';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { Pool } from 'pg';

import { csrfProtection } from '../../middleware/csrf'

const router = Router();

// Database pool (should be injected via DI in production)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * Universal drill-through endpoint
 * GET /api/drill-through/:entityType
 */
router.get('/:entityType', async (req: Request, res: Response) => {
  try {
    const { entityType } = req.params;
    const { page = '1', pageSize = '50', filters = '{}' } = req.query;

    const pageNum = parseInt(page as string, 10);
    const pageSizeNum = parseInt(pageSize as string, 10);
    const offset = (pageNum - 1) * pageSizeNum;

    let parsedFilters: Record<string, any> = {};
    try {
      parsedFilters = JSON.parse(filters as string);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid filters JSON' });
    }

    // Build query based on entity type
    const { query, countQuery, params, summary } = buildDrillThroughQuery(
      entityType,
      parsedFilters,
      pageSizeNum,
      offset
    );

    // Execute count query
    const countResult = await pool.query(countQuery, params.slice(0, -2));
    const totalCount = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalCount / pageSizeNum);

    // Execute data query
    const dataResult = await pool.query(query, params);

    // Get summary stats if available
    let summaryData = null;
    if (summary) {
      const summaryResult = await pool.query(summary.query, summary.params);
      summaryData = summaryResult.rows[0];
    }

    res.json({
      totalCount,
      data: dataResult.rows,
      page: pageNum,
      pageSize: pageSizeNum,
      totalPages,
      summary: summaryData,
    });
  } catch (error) {
    console.error('Drill-through error:', error);
    res.status(500).json({ error: 'Failed to fetch drill-through data' });
  }
});

/**
 * Export drill-through data
 * GET /api/drill-through/:entityType/export
 */
router.get('/:entityType/export', async (req: Request, res: Response) => {
  try {
    const { entityType } = req.params;
    const { filters = '{}', format = 'csv' } = req.query;

    let parsedFilters: Record<string, any> = {};
    try {
      parsedFilters = JSON.parse(filters as string);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid filters JSON' });
    }

    // Build query without pagination
    const { query, params } = buildDrillThroughQuery(
      entityType,
      parsedFilters,
      1000000, // Large limit for export
      0
    );

    // Remove LIMIT and OFFSET from params
    const exportParams = params.slice(0, -2);
    const exportQuery = query.replace(/LIMIT \$\d+ OFFSET \$\d+/, '');

    const result = await pool.query(exportQuery, exportParams);

    const filename = `${entityType}_export_${new Date().toISOString().split('T')[0]}`;

    switch (format) {
      case 'csv':
        exportCSV(res, result.rows, filename);
        break;
      case 'excel':
        await exportExcel(res, result.rows, filename, entityType);
        break;
      case 'pdf':
        await exportPDF(res, result.rows, filename, entityType);
        break;
      default:
        res.status(400).json({ error: 'Invalid export format' });
    }
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

/**
 * Track drill-through analytics
 * POST /api/drill-through/analytics
 */
router.post('/analytics', csrfProtection, async (req: Request, res: Response) => {
  try {
    const { entityType, filters, recordCount, exported, exportFormat } = req.body;
    const userId = (req as any).user?.id || null;

    await pool.query(
      `INSERT INTO drill_through_analytics
       (user_id, entity_type, filters, record_count, exported, export_format)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, entityType, JSON.stringify(filters), recordCount, exported, exportFormat]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to track analytics' });
  }
});

/**
 * Build SQL query based on entity type and filters
 */
function buildDrillThroughQuery(
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
  const filterConditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  // Add filter conditions
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        filterConditions.push(`${key} = ANY($${paramIndex})`);
        params.push(value);
      } else {
        filterConditions.push(`${key} = $${paramIndex}`);
        params.push(value);
      }
      paramIndex++;
    }
  });

  const whereClause =
    filterConditions.length > 0 ? `WHERE ${filterConditions.join(' AND ')}` : '';

  // Entity-specific queries
  let baseQuery = '';
  let summaryQuery = '';

  switch (entityType) {
    case 'vehicles':
      baseQuery = `
        SELECT id, vin, year, make, model, license_plate, status, department,
               assigned_driver, mileage, fuel_type, location
        FROM vehicles
        ${whereClause}
        ORDER BY id DESC
      `;
      summaryQuery = `
        SELECT
          COUNT(*) as total_vehicles,
          COUNT(DISTINCT department) as departments,
          SUM(mileage) as total_mileage,
          COUNT(*) FILTER (WHERE status = 'active') as active_vehicles
        FROM vehicles
        ${whereClause}
      `;
      break;

    case 'trips':
      baseQuery = `
        SELECT t.id, t.vehicle_id, v.vin, t.driver_id, u.name as driver_name,
               t.start_time, t.end_time, t.distance, t.fuel_used, t.purpose
        FROM trips t
        LEFT JOIN vehicles v ON t.vehicle_id = v.id
        LEFT JOIN users u ON t.driver_id = u.id
        ${whereClause}
        ORDER BY t.start_time DESC
      `;
      summaryQuery = `
        SELECT
          COUNT(*) as total_trips,
          SUM(distance) as total_distance,
          SUM(fuel_used) as total_fuel,
          AVG(distance) as avg_distance
        FROM trips t
        ${whereClause}
      `;
      break;

    case 'fuel_transactions':
      baseQuery = `
        SELECT ft.id, ft.vehicle_id, v.vin, ft.date, ft.gallons, ft.cost,
               ft.odometer, ft.fuel_type, ft.vendor, ft.location
        FROM fuel_transactions ft
        LEFT JOIN vehicles v ON ft.vehicle_id = v.id
        ${whereClause}
        ORDER BY ft.date DESC
      `;
      summaryQuery = `
        SELECT
          COUNT(*) as total_transactions,
          SUM(gallons) as total_gallons,
          SUM(cost) as total_cost,
          AVG(cost / NULLIF(gallons, 0)) as avg_price_per_gallon
        FROM fuel_transactions ft
        ${whereClause}
      `;
      break;

    case 'maintenance_records':
      baseQuery = `
        SELECT mr.id, mr.vehicle_id, v.vin, mr.date, mr.type, mr.description,
               mr.cost, mr.vendor, mr.next_service_date
        FROM maintenance_records mr
        LEFT JOIN vehicles v ON mr.vehicle_id = v.id
        ${whereClause}
        ORDER BY mr.date DESC
      `;
      summaryQuery = `
        SELECT
          COUNT(*) as total_services,
          SUM(cost) as total_cost,
          AVG(cost) as avg_cost,
          COUNT(DISTINCT vehicle_id) as vehicles_serviced
        FROM maintenance_records mr
        ${whereClause}
      `;
      break;

    case 'traffic_cameras':
      baseQuery = `
        SELECT id, fdot_id, name, description, latitude, longitude,
               road, direction, county, status, last_updated
        FROM traffic_cameras
        ${whereClause}
        ORDER BY county, road
      `;
      break;

    case 'traffic_incidents':
      baseQuery = `
        SELECT id, incident_id, type, description, latitude, longitude,
               road, county, start_time, end_time, severity, lanes_affected
        FROM traffic_incidents
        ${whereClause}
        ORDER BY start_time DESC
      `;
      break;

    default:
      throw new Error(`Unsupported entity type: ${entityType}`);
  }

  // Add pagination
  params.push(limit, offset);
  const query = `${baseQuery} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  const countQuery = `SELECT COUNT(*) FROM (${baseQuery.replace(/ORDER BY .*/, '')}) as count_query`;

  const result: any = {
    query,
    countQuery,
    params,
  };

  if (summaryQuery) {
    result.summary = {
      query: summaryQuery,
      params: params.slice(0, -2),
    };
  }

  return result;
}

/**
 * Export data as CSV
 */
function exportCSV(res: Response, data: any[], filename: string) {
  if (data.length === 0) {
    return res.status(404).json({ error: 'No data to export' });
  }

  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(','),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          // Escape quotes and wrap in quotes if contains comma
          const stringValue = value === null ? '' : String(value);
          return stringValue.includes(',')
            ? `"${stringValue.replace(/"/g, '""')}"`
            : stringValue;
        })
        .join(',')
    ),
  ].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
  res.send(csv);
}

/**
 * Export data as Excel
 */
async function exportExcel(res: Response, data: any[], filename: string, sheetName: string) {
  if (data.length === 0) {
    return res.status(404).json({ error: 'No data to export' });
  }

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  // Add headers
  const headers = Object.keys(data[0]);
  worksheet.columns = headers.map((header) => ({
    header: header.toUpperCase().replace(/_/g, ' '),
    key: header,
    width: 20,
  }));

  // Style header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' },
  };
  worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

  // Add data
  data.forEach((row) => {
    worksheet.addRow(row);
  });

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
  res.send(Buffer.from(buffer));
}

/**
 * Export data as PDF
 */
async function exportPDF(res: Response, data: any[], filename: string, title: string) {
  if (data.length === 0) {
    return res.status(404).json({ error: 'No data to export' });
  }

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let page = pdfDoc.addPage([842, 595]); // A4 landscape
  const { width, height } = page.getSize();
  const fontSize = 9;
  const margin = 50;
  let yPosition = height - margin;

  // Title
  page.drawText(title.toUpperCase().replace(/_/g, ' '), {
    x: margin,
    y: yPosition,
    size: 16,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  yPosition -= 30;

  // Headers
  const headers = Object.keys(data[0]);
  const columnWidth = (width - 2 * margin) / headers.length;

  headers.forEach((header, index) => {
    page.drawText(header.toUpperCase().replace(/_/g, ' '), {
      x: margin + index * columnWidth,
      y: yPosition,
      size: fontSize,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
  });
  yPosition -= 20;

  // Data rows
  for (const row of data) {
    if (yPosition < margin) {
      page = pdfDoc.addPage([842, 595]);
      yPosition = height - margin;
    }

    headers.forEach((header, index) => {
      const value = row[header] === null ? '' : String(row[header]);
      const truncated = value.length > 25 ? value.substring(0, 22) + '...' : value;

      page.drawText(truncated, {
        x: margin + index * columnWidth,
        y: yPosition,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      });
    });
    yPosition -= 15;
  }

  const pdfBytes = await pdfDoc.save();

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
  res.send(Buffer.from(pdfBytes));
}

export default router;
