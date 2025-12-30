/**
 * Report Job Processor
 *
 * Processes report generation jobs:
 * - Maintenance reports
 * - Cost analysis reports
 * - Fuel usage reports
 * - Vehicle utilization reports
 * - Driver performance reports
 * - Custom reports
 */

import fs from 'fs'
import path from 'path'

import { Job } from 'bull'
import * as XLSX from 'xlsx'

import { pool } from '../../config/database'
import logger from '../../config/logger'
import { addEmailJob } from '../queue'

/**
 * Report data generators
 */

/**
 * Generate maintenance report
 */
async function generateMaintenanceReport(parameters: any = {}) {
  const { startDate, endDate, vehicleIds, status } = parameters

  let query = `
    SELECT
      m.id,
      v.make || ' ' || v.model AS vehicle_name,
      v.vin,
      m.service_type,
      m.description,
      m.scheduled_date,
      m.completed_date,
      m.status,
      m.cost,
      m.mileage,
      vendor.name AS vendor_name
    FROM maintenance m
    LEFT JOIN vehicles v ON m.vehicle_id = v.id
    LEFT JOIN vendors vendor ON m.vendor_id = vendor.id
    WHERE 1=1
  `

  const queryParams: any[] = []
  let paramCounter = 1

  if (startDate) {
    query += ` AND m.scheduled_date >= $${paramCounter}`
    queryParams.push(startDate)
    paramCounter++
  }

  if (endDate) {
    query += ` AND m.scheduled_date <= $${paramCounter}`
    queryParams.push(endDate)
    paramCounter++
  }

  if (vehicleIds && vehicleIds.length > 0) {
    query += ` AND m.vehicle_id = ANY($${paramCounter})`
    queryParams.push(vehicleIds)
    paramCounter++
  }

  if (status) {
    query += ` AND m.status = $${paramCounter}`
    queryParams.push(status)
    paramCounter++
  }

  query += ` ORDER BY m.scheduled_date DESC`

  const result = await pool.query(query, queryParams)

  return {
    title: 'Maintenance Report',
    data: result.rows,
    summary: {
      totalRecords: result.rows.length,
      totalCost: result.rows.reduce((sum, row) => sum + (parseFloat(row.cost) || 0), 0),
      completedCount: result.rows.filter((row) => row.status === 'completed').length,
      pendingCount: result.rows.filter((row) => row.status === 'pending' || row.status === 'scheduled').length,
    },
  }
}

/**
 * Generate cost analysis report
 */
async function generateCostAnalysisReport(parameters: any = {}) {
  const { startDate, endDate, groupBy = 'vehicle' } = parameters

  const query = `
    SELECT
      v.id AS vehicle_id,
      v.make || ' ' || v.model AS vehicle_name,
      v.vin,
      COALESCE(SUM(m.cost), 0) AS maintenance_cost,
      COALESCE(SUM(f.total_cost), 0) AS fuel_cost,
      COALESCE(SUM(m.cost), 0) + COALESCE(SUM(f.total_cost), 0) AS total_cost,
      COUNT(DISTINCT m.id) AS maintenance_count,
      COUNT(DISTINCT f.id) AS fuel_transactions
    FROM vehicles v
    LEFT JOIN maintenance m ON v.id = m.vehicle_id
      AND m.completed_date >= COALESCE($1, '1900-01-01')
      AND m.completed_date <= COALESCE($2, '2100-12-31')
    LEFT JOIN fuel_transactions f ON v.id = f.vehicle_id
      AND f.date >= COALESCE($1, '1900-01-01')
      AND f.date <= COALESCE($2, '2100-12-31')
    GROUP BY v.id, v.make, v.model, v.vin
    ORDER BY total_cost DESC
  `

  const result = await pool.query(query, [startDate, endDate])

  return {
    title: 'Cost Analysis Report',
    data: result.rows,
    summary: {
      totalVehicles: result.rows.length,
      totalMaintenanceCost: result.rows.reduce((sum, row) => sum + parseFloat(row.maintenance_cost), 0),
      totalFuelCost: result.rows.reduce((sum, row) => sum + parseFloat(row.fuel_cost), 0),
      grandTotal: result.rows.reduce((sum, row) => sum + parseFloat(row.total_cost), 0),
    },
  }
}

/**
 * Generate fuel usage report
 */
async function generateFuelUsageReport(parameters: any = {}) {
  const { startDate, endDate, vehicleIds } = parameters

  let query = `
    SELECT
      f.id,
      v.make || ' ' || v.model AS vehicle_name,
      v.vin,
      f.date,
      f.gallons,
      f.cost_per_gallon,
      f.total_cost,
      f.odometer,
      f.location,
      LAG(f.odometer) OVER (PARTITION BY v.id ORDER BY f.date) AS previous_odometer,
      (f.odometer - LAG(f.odometer) OVER (PARTITION BY v.id ORDER BY f.date)) / NULLIF(f.gallons, 0) AS mpg
    FROM fuel_transactions f
    JOIN vehicles v ON f.vehicle_id = v.id
    WHERE 1=1
  `

  const queryParams: any[] = []
  let paramCounter = 1

  if (startDate) {
    query += ` AND f.date >= $${paramCounter}`
    queryParams.push(startDate)
    paramCounter++
  }

  if (endDate) {
    query += ` AND f.date <= $${paramCounter}`
    queryParams.push(endDate)
    paramCounter++
  }

  if (vehicleIds && vehicleIds.length > 0) {
    query += ` AND f.vehicle_id = ANY($${paramCounter})`
    queryParams.push(vehicleIds)
    paramCounter++
  }

  query += ` ORDER BY f.date DESC`

  const result = await pool.query(query, queryParams)

  return {
    title: 'Fuel Usage Report',
    data: result.rows,
    summary: {
      totalTransactions: result.rows.length,
      totalGallons: result.rows.reduce((sum, row) => sum + parseFloat(row.gallons), 0),
      totalCost: result.rows.reduce((sum, row) => sum + parseFloat(row.total_cost), 0),
      averageMpg: result.rows.filter((row) => row.mpg).reduce((sum, row, _, arr) => sum + parseFloat(row.mpg) / arr.length, 0),
    },
  }
}

/**
 * Generate vehicle utilization report
 */
async function generateVehicleUtilizationReport(parameters: any = {}) {
  const { startDate, endDate } = parameters

  const query = `
    SELECT
      v.id,
      v.make || ' ' || v.model AS vehicle_name,
      v.vin,
      v.status,
      COUNT(DISTINCT va.id) AS assignment_count,
      COUNT(DISTINCT t.id) AS trip_count,
      COALESCE(SUM(t.distance), 0) AS total_distance,
      COALESCE(SUM(t.duration), 0) AS total_duration_minutes
    FROM vehicles v
    LEFT JOIN vehicle_assignments va ON v.id = va.vehicle_id
      AND va.start_date >= COALESCE($1, '1900-01-01')
      AND va.start_date <= COALESCE($2, '2100-12-31')
    LEFT JOIN trips t ON v.id = t.vehicle_id
      AND t.start_time >= COALESCE($1, '1900-01-01')
      AND t.start_time <= COALESCE($2, '2100-12-31')
    GROUP BY v.id, v.make, v.model, v.vin, v.status
    ORDER BY total_distance DESC
  `

  const result = await pool.query(query, [startDate, endDate])

  return {
    title: 'Vehicle Utilization Report',
    data: result.rows,
    summary: {
      totalVehicles: result.rows.length,
      totalTrips: result.rows.reduce((sum, row) => sum + parseInt(row.trip_count), 0),
      totalDistance: result.rows.reduce((sum, row) => sum + parseFloat(row.total_distance), 0),
      averageUtilization: result.rows.reduce((sum, row) => sum + parseInt(row.trip_count) / result.rows.length, 0),
    },
  }
}

/**
 * Generate driver performance report
 */
async function generateDriverPerformanceReport(parameters: any = {}) {
  const { startDate, endDate, driverIds } = parameters

  let query = `
    SELECT
      d.id,
      d.first_name || ' ' || d.last_name AS driver_name,
      d.license_number,
      d.status,
      COUNT(DISTINCT t.id) AS trip_count,
      COALESCE(SUM(t.distance), 0) AS total_distance,
      COALESCE(AVG(t.avg_speed), 0) AS average_speed,
      COUNT(DISTINCT i.id) AS incident_count,
      COUNT(DISTINCT si.id) AS safety_incident_count
    FROM drivers d
    LEFT JOIN trips t ON d.id = t.driver_id
      AND t.start_time >= COALESCE($1, '1900-01-01')
      AND t.start_time <= COALESCE($2, '2100-12-31')
    LEFT JOIN incidents i ON d.id = i.driver_id
      AND i.date >= COALESCE($1, '1900-01-01')
      AND i.date <= COALESCE($2, '2100-12-31')
    LEFT JOIN safety_incidents si ON d.id = si.driver_id
      AND si.incident_date >= COALESCE($1, '1900-01-01')
      AND si.incident_date <= COALESCE($2, '2100-12-31')
    WHERE 1=1
  `

  const queryParams: any[] = [startDate, endDate]
  let paramCounter = 3

  if (driverIds && driverIds.length > 0) {
    query += ` AND d.id = ANY($${paramCounter})`
    queryParams.push(driverIds)
    paramCounter++
  }

  query += ` GROUP BY d.id, d.first_name, d.last_name, d.license_number, d.status
             ORDER BY total_distance DESC`

  const result = await pool.query(query, queryParams)

  return {
    title: 'Driver Performance Report',
    data: result.rows,
    summary: {
      totalDrivers: result.rows.length,
      totalTrips: result.rows.reduce((sum, row) => sum + parseInt(row.trip_count), 0),
      totalDistance: result.rows.reduce((sum, row) => sum + parseFloat(row.total_distance), 0),
      totalIncidents: result.rows.reduce((sum, row) => sum + parseInt(row.incident_count) + parseInt(row.safety_incident_count), 0),
    },
  }
}

/**
 * Export report to Excel
 */
function exportToExcel(reportData: any, filename: string): string {
  const wb = XLSX.utils.book_new()

  // Add data sheet
  const ws = XLSX.utils.json_to_sheet(reportData.data)
  XLSX.utils.book_append_sheet(wb, ws, 'Data')

  // Add summary sheet
  const summaryWs = XLSX.utils.json_to_sheet([reportData.summary])
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary')

  // Create output directory if it doesn't exist
  const outputDir = path.join(process.cwd(), 'reports')
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  const filepath = path.join(outputDir, filename)
  XLSX.writeFile(wb, filepath)

  return filepath
}

/**
 * Export report to CSV
 */
function exportToCsv(reportData: any, filename: string): string {
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(reportData.data)
  XLSX.utils.book_append_sheet(wb, ws, 'Data')

  const outputDir = path.join(process.cwd(), 'reports')
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  const filepath = path.join(outputDir, filename)
  XLSX.writeFile(wb, filepath, { bookType: 'csv' })

  return filepath
}

/**
 * Process report job
 */
export async function processReportJob(job: Job): Promise<any> {
  const { reportType, userId, parameters, format = 'excel', deliveryMethod = 'download', recipients } = job.data

  logger.info(`Processing report job ${job.id}`, {
    reportType,
    userId,
    format,
    deliveryMethod,
  })

  try {
    let reportData: any

    // Generate report based on type
    switch (reportType) {
      case 'maintenance':
        reportData = await generateMaintenanceReport(parameters)
        break
      case 'cost-analysis':
        reportData = await generateCostAnalysisReport(parameters)
        break
      case 'fuel-usage':
        reportData = await generateFuelUsageReport(parameters)
        break
      case 'vehicle-utilization':
        reportData = await generateVehicleUtilizationReport(parameters)
        break
      case 'driver-performance':
        reportData = await generateDriverPerformanceReport(parameters)
        break
      default:
        throw new Error(`Unknown report type: ${reportType}`)
    }

    // Export report to file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `${reportType}-${timestamp}.${format === 'csv' ? 'csv' : 'xlsx'}`
    const filepath = format === 'csv' ? exportToCsv(reportData, filename) : exportToExcel(reportData, filename)

    logger.info(`Report generated: ${filepath}`)

    // Store report metadata in database
    const reportRecord = await pool.query(
      `INSERT INTO report_history
       (user_id, report_type, parameters, format, filename, filepath, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING id`,
      [userId, reportType, JSON.stringify(parameters), format, filename, filepath, 'completed']
    )

    const reportId = reportRecord.rows[0].id

    // Handle delivery method
    if (deliveryMethod === 'email' && recipients && recipients.length > 0) {
      // Send report via email
      await addEmailJob({
        to: recipients,
        subject: `Fleet Report: ${reportData.title}`,
        html: `
          <h2>${reportData.title}</h2>
          <p>Your requested report has been generated and is attached to this email.</p>
          <h3>Summary:</h3>
          <ul>
            ${Object.entries(reportData.summary)
              .map(([key, value]) => `<li><strong>${key}:</strong> ${value}</li>`)
              .join('')}
          </ul>
          <p>Report generated on: ${new Date().toLocaleString()}</p>
        `,
        attachments: [
          {
            filename,
            path: filepath,
          },
        ],
      })

      logger.info(`Report ${reportId} sent via email to ${recipients.join(', ')}`)
    }

    return {
      success: true,
      reportId,
      reportType,
      filename,
      filepath,
      recordCount: reportData.data.length,
      summary: reportData.summary,
      deliveryMethod,
      generatedAt: new Date().toISOString(),
    }
  } catch (error: any) {
    logger.error(`Failed to generate report in job ${job.id}:`, error)

    // Log failed report
    await pool.query(
      `INSERT INTO report_history
       (user_id, report_type, parameters, format, status, error, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [userId, reportType, JSON.stringify(parameters), format, 'failed', error.message]
    )

    throw error
  }
}

/**
 * Get report file
 */
export async function getReportFile(reportId: string): Promise<string | null> {
  const result = await pool.query(`SELECT filepath FROM report_history WHERE id = $1 AND status = 'completed'`, [
    reportId,
  ])

  if (result.rows.length === 0) {
    return null
  }

  return result.rows[0].filepath
}

/**
 * Clean old report files
 */
export async function cleanOldReports(daysOld: number = 30): Promise<number> {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysOld)

  const result = await pool.query(
    `SELECT filepath FROM report_history
     WHERE created_at < $1 AND status = 'completed'`,
    [cutoffDate]
  )

  let deletedCount = 0

  for (const row of result.rows) {
    try {
      if (fs.existsSync(row.filepath)) {
        fs.unlinkSync(row.filepath)
        deletedCount++
      }
    } catch (error) {
      logger.error(`Failed to delete report file ${row.filepath}:`, error)
    }
  }

  // Update database
  await pool.query(
    `UPDATE report_history
     SET status = 'deleted'
     WHERE created_at < $1 AND status = 'completed'`,
    [cutoffDate]
  )

  logger.info(`Cleaned ${deletedCount} old report files`)
  return deletedCount
}
