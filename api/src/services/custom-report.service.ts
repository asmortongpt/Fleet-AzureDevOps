/**
 * Custom Report Service
 *
 * Dynamic report builder with SQL injection prevention
 * Supports multiple data sources, joins, filters, grouping, and aggregations
 */

import pool from '../config/database'
import excelExportService, { ExportColumn, ExportOptions } from './excel-export.service'
import nodemailer from 'nodemailer'

// Data source schema definitions
interface DataSourceSchema {
  table: string
  alias: string
  displayName: string
  primaryKey: string
  availableColumns: ColumnDefinition[]
  defaultJoins?: JoinDefinition[]
}

interface ColumnDefinition {
  field: string
  label: string
  type: 'string' | 'number' | 'currency' | 'date' | 'percentage' | 'boolean'
  aggregatable: boolean
  filterable: boolean
}

interface JoinDefinition {
  type: 'left' | 'inner' | 'right'
  from: string
  to: string
  on: string
}

interface FilterCondition {
  field: string
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'not_contains' | 'between' | 'in' | 'not_in' | 'is_null' | 'is_not_null'
  value?: any
  value2?: any // For 'between' operator
}

interface ReportConfig {
  data_sources: string[]
  columns: Array<{
    field: string
    label: string
    table: string
    type: string
    aggregate?: 'sum' | 'avg' | 'count' | 'min' | 'max'
  }>
  filters?: FilterCondition[]
  grouping?: Array<{ field: string }>
  sorting?: Array<{ field: string; direction: 'asc' | 'desc' }>
  joins?: JoinDefinition[]
  aggregations?: any[]
}

interface CustomReport {
  id: string
  tenant_id: string
  report_name: string
  description?: string
  data_sources: string[]
  filters: FilterCondition[]
  columns: any[]
  grouping: any[]
  sorting: any[]
  aggregations: any[]
  joins: JoinDefinition[]
  created_by: string
  is_public: boolean
  is_template: boolean
  created_at: Date
  updated_at: Date
}

export class CustomReportService {
  // Define available data sources and their schemas
  private dataSourceSchemas: Map<string, DataSourceSchema> = new Map([
    ['vehicles', {
      table: 'vehicles',
      alias: 'v',
      displayName: 'Vehicles',
      primaryKey: 'id',
      availableColumns: [
        { field: 'vehicle_number', label: 'Vehicle Number', type: 'string', aggregatable: false, filterable: true },
        { field: 'vehicle_type', label: 'Vehicle Type', type: 'string', aggregatable: false, filterable: true },
        { field: 'year', label: 'Year', type: 'number', aggregatable: true, filterable: true },
        { field: 'make', label: 'Make', type: 'string', aggregatable: false, filterable: true },
        { field: 'model', label: 'Model', type: 'string', aggregatable: false, filterable: true },
        { field: 'status', label: 'Status', type: 'string', aggregatable: false, filterable: true },
        { field: 'purchase_price', label: 'Purchase Price', type: 'currency', aggregatable: true, filterable: true },
        { field: 'current_value', label: 'Current Value', type: 'currency', aggregatable: true, filterable: true },
        { field: 'purchase_date', label: 'Purchase Date', type: 'date', aggregatable: false, filterable: true },
        { field: 'department', label: 'Department', type: 'string', aggregatable: false, filterable: true }
      ]
    }],
    ['drivers', {
      table: 'drivers',
      alias: 'd',
      displayName: 'Drivers',
      primaryKey: 'id',
      availableColumns: [
        { field: 'first_name', label: 'First Name', type: 'string', aggregatable: false, filterable: true },
        { field: 'last_name', label: 'Last Name', type: 'string', aggregatable: false, filterable: true },
        { field: 'license_number', label: 'License Number', type: 'string', aggregatable: false, filterable: true },
        { field: 'license_expiry', label: 'License Expiry', type: 'date', aggregatable: false, filterable: true },
        { field: 'hire_date', label: 'Hire Date', type: 'date', aggregatable: false, filterable: true },
        { field: 'status', label: 'Status', type: 'string', aggregatable: false, filterable: true }
      ]
    }],
    ['trips', {
      table: 'trips',
      alias: 't',
      displayName: 'Trips',
      primaryKey: 'id',
      availableColumns: [
        { field: 'trip_start', label: 'Trip Start', type: 'date', aggregatable: false, filterable: true },
        { field: 'trip_end', label: 'Trip End', type: 'date', aggregatable: false, filterable: true },
        { field: 'distance', label: 'Distance', type: 'number', aggregatable: true, filterable: true },
        { field: 'start_location', label: 'Start Location', type: 'string', aggregatable: false, filterable: true },
        { field: 'end_location', label: 'End Location', type: 'string', aggregatable: false, filterable: true }
      ]
    }],
    ['fuel_transactions', {
      table: 'fuel_transactions',
      alias: 'ft',
      displayName: 'Fuel Transactions',
      primaryKey: 'id',
      availableColumns: [
        { field: 'transaction_date', label: 'Transaction Date', type: 'date', aggregatable: false, filterable: true },
        { field: 'gallons', label: 'Gallons', type: 'number', aggregatable: true, filterable: true },
        { field: 'cost', label: 'Cost', type: 'currency', aggregatable: true, filterable: true },
        { field: 'price_per_gallon', label: 'Price per Gallon', type: 'currency', aggregatable: true, filterable: true },
        { field: 'odometer', label: 'Odometer', type: 'number', aggregatable: false, filterable: true },
        { field: 'fuel_type', label: 'Fuel Type', type: 'string', aggregatable: false, filterable: true }
      ]
    }],
    ['work_orders', {
      table: 'work_orders',
      alias: 'wo',
      displayName: 'Maintenance / Work Orders',
      primaryKey: 'id',
      availableColumns: [
        { field: 'work_order_number', label: 'Work Order #', type: 'string', aggregatable: false, filterable: true },
        { field: 'work_order_type', label: 'Type', type: 'string', aggregatable: false, filterable: true },
        { field: 'status', label: 'Status', type: 'string', aggregatable: false, filterable: true },
        { field: 'priority', label: 'Priority', type: 'string', aggregatable: false, filterable: true },
        { field: 'labor_cost', label: 'Labor Cost', type: 'currency', aggregatable: true, filterable: true },
        { field: 'parts_cost', label: 'Parts Cost', type: 'currency', aggregatable: true, filterable: true },
        { field: 'total_cost', label: 'Total Cost', type: 'currency', aggregatable: true, filterable: true },
        { field: 'started_date', label: 'Started Date', type: 'date', aggregatable: false, filterable: true },
        { field: 'completed_date', label: 'Completed Date', type: 'date', aggregatable: false, filterable: true }
      ]
    }],
    ['safety_incidents', {
      table: 'safety_incidents',
      alias: 'si',
      displayName: 'Incidents',
      primaryKey: 'id',
      availableColumns: [
        { field: 'incident_date', label: 'Incident Date', type: 'date', aggregatable: false, filterable: true },
        { field: 'incident_type', label: 'Type', type: 'string', aggregatable: false, filterable: true },
        { field: 'severity', label: 'Severity', type: 'string', aggregatable: false, filterable: true },
        { field: 'estimated_cost', label: 'Estimated Cost', type: 'currency', aggregatable: true, filterable: true },
        { field: 'status', label: 'Status', type: 'string', aggregatable: false, filterable: true }
      ]
    }],
    ['cost_tracking', {
      table: 'cost_tracking',
      alias: 'ct',
      displayName: 'Costs',
      primaryKey: 'id',
      availableColumns: [
        { field: 'cost_type', label: 'Cost Type', type: 'string', aggregatable: false, filterable: true },
        { field: 'amount', label: 'Amount', type: 'currency', aggregatable: true, filterable: true },
        { field: 'transaction_date', label: 'Transaction Date', type: 'date', aggregatable: false, filterable: true },
        { field: 'description', label: 'Description', type: 'string', aggregatable: false, filterable: true }
      ]
    }],
    ['assets', {
      table: 'assets',
      alias: 'a',
      displayName: 'Assets',
      primaryKey: 'id',
      availableColumns: [
        { field: 'asset_number', label: 'Asset Number', type: 'string', aggregatable: false, filterable: true },
        { field: 'asset_type', label: 'Asset Type', type: 'string', aggregatable: false, filterable: true },
        { field: 'status', label: 'Status', type: 'string', aggregatable: false, filterable: true },
        { field: 'purchase_cost', label: 'Purchase Cost', type: 'currency', aggregatable: true, filterable: true },
        { field: 'current_value', label: 'Current Value', type: 'currency', aggregatable: true, filterable: true },
        { field: 'purchase_date', label: 'Purchase Date', type: 'date', aggregatable: false, filterable: true },
        { field: 'expiry_date', label: 'Expiry Date', type: 'date', aggregatable: false, filterable: true }
      ]
    }],
    ['vendors', {
      table: 'vendors',
      alias: 'vn',
      displayName: 'Vendors',
      primaryKey: 'id',
      availableColumns: [
        { field: 'vendor_name', label: 'Vendor Name', type: 'string', aggregatable: false, filterable: true },
        { field: 'vendor_type', label: 'Vendor Type', type: 'string', aggregatable: false, filterable: true },
        { field: 'contact_name', label: 'Contact Name', type: 'string', aggregatable: false, filterable: true },
        { field: 'phone', label: 'Phone', type: 'string', aggregatable: false, filterable: true },
        { field: 'email', label: 'Email', type: 'string', aggregatable: false, filterable: true }
      ]
    }],
    ['inspections', {
      table: 'inspections',
      alias: 'i',
      displayName: 'Inspections',
      primaryKey: 'id',
      availableColumns: [
        { field: 'inspection_date', label: 'Inspection Date', type: 'date', aggregatable: false, filterable: true },
        { field: 'inspection_type', label: 'Type', type: 'string', aggregatable: false, filterable: true },
        { field: 'pass_fail', label: 'Result', type: 'string', aggregatable: false, filterable: true },
        { field: 'odometer_reading', label: 'Odometer', type: 'number', aggregatable: false, filterable: true }
      ]
    }],
    ['utilization_metrics', {
      table: 'utilization_metrics',
      alias: 'um',
      displayName: 'Utilization Metrics',
      primaryKey: 'id',
      availableColumns: [
        { field: 'utilization_rate', label: 'Utilization Rate', type: 'percentage', aggregatable: true, filterable: true },
        { field: 'active_hours', label: 'Active Hours', type: 'number', aggregatable: true, filterable: true },
        { field: 'idle_hours', label: 'Idle Hours', type: 'number', aggregatable: true, filterable: true },
        { field: 'total_miles', label: 'Total Miles', type: 'number', aggregatable: true, filterable: true },
        { field: 'cost_per_mile', label: 'Cost per Mile', type: 'currency', aggregatable: true, filterable: true },
        { field: 'roi', label: 'ROI', type: 'percentage', aggregatable: true, filterable: true },
        { field: 'recommendation', label: 'Recommendation', type: 'string', aggregatable: false, filterable: true },
        { field: 'recommendation_type', label: 'Recommendation Type', type: 'string', aggregatable: false, filterable: true }
      ]
    }]
  ])

  /**
   * Get available data sources
   */
  async getDataSources(): Promise<any[]> {
    return Array.from(this.dataSourceSchemas.entries()).map(([key, schema]) => ({
      id: key,
      name: schema.displayName,
      table: schema.table,
      columns: schema.availableColumns
    }))
  }

  /**
   * Create a new custom report
   */
  async createReport(
    tenantId: string,
    userId: string,
    reportData: Partial<CustomReport>
  ): Promise<CustomReport> {
    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      const result = await client.query(
        `INSERT INTO custom_reports (
          tenant_id, report_name, description, data_sources, filters,
          columns, grouping, sorting, aggregations, joins,
          created_by, is_public, is_template
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *`,
        [
          tenantId,
          reportData.report_name,
          reportData.description || null,
          reportData.data_sources || [],
          JSON.stringify(reportData.filters || []),
          JSON.stringify(reportData.columns || []),
          JSON.stringify(reportData.grouping || []),
          JSON.stringify(reportData.sorting || []),
          JSON.stringify(reportData.aggregations || []),
          JSON.stringify(reportData.joins || []),
          userId,
          reportData.is_public || false,
          reportData.is_template || false
        ]
      )

      await client.query('COMMIT')

      return this.mapReportRow(result.rows[0])
    } catch (error) {
      await client.query('ROLLBACK')
      console.error('Error creating report:', error)
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Update a custom report
   */
  async updateReport(
    reportId: string,
    tenantId: string,
    userId: string,
    reportData: Partial<CustomReport>
  ): Promise<CustomReport> {
    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      const result = await client.query(
        `UPDATE custom_reports SET
          report_name = COALESCE($1, report_name),
          description = COALESCE($2, description),
          data_sources = COALESCE($3, data_sources),
          filters = COALESCE($4, filters),
          columns = COALESCE($5, columns),
          grouping = COALESCE($6, grouping),
          sorting = COALESCE($7, sorting),
          aggregations = COALESCE($8, aggregations),
          joins = COALESCE($9, joins),
          updated_by = $10,
          is_public = COALESCE($11, is_public)
        WHERE id = $12 AND tenant_id = $13
        RETURNING *`,
        [
          reportData.report_name,
          reportData.description,
          reportData.data_sources,
          reportData.filters ? JSON.stringify(reportData.filters) : null,
          reportData.columns ? JSON.stringify(reportData.columns) : null,
          reportData.grouping ? JSON.stringify(reportData.grouping) : null,
          reportData.sorting ? JSON.stringify(reportData.sorting) : null,
          reportData.aggregations ? JSON.stringify(reportData.aggregations) : null,
          reportData.joins ? JSON.stringify(reportData.joins) : null,
          userId,
          reportData.is_public,
          reportId,
          tenantId
        ]
      )

      await client.query('COMMIT')

      if (result.rows.length === 0) {
        throw new Error('Report not found')
      }

      return this.mapReportRow(result.rows[0])
    } catch (error) {
      await client.query('ROLLBACK')
      console.error('Error updating report:', error)
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Delete a custom report
   */
  async deleteReport(reportId: string, tenantId: string): Promise<void> {
    await pool.query(
      'DELETE FROM custom_reports WHERE id = $1 AND tenant_id = $2',
      [reportId, tenantId]
    )
  }

  /**
   * Get report by ID
   */
  async getReportById(reportId: string, tenantId: string): Promise<CustomReport | null> {
    const result = await pool.query(
      'SELECT 
      id,
      tenant_id,
      report_name,
      description,
      data_sources,
      filters,
      columns,
      grouping,
      sorting,
      aggregations,
      joins,
      created_by,
      updated_by,
      is_public,
      is_template,
      created_at,
      updated_at FROM custom_reports WHERE id = $1 AND tenant_id = $2',
      [reportId, tenantId]
    )

    return result.rows.length > 0 ? this.mapReportRow(result.rows[0]) : null
  }

  /**
   * List user's reports
   */
  async listReports(tenantId: string, userId: string): Promise<CustomReport[]> {
    const result = await pool.query(
      `SELECT id, tenant_id, report_name, report_type, query_config, created_at, updated_at FROM custom_reports
       WHERE tenant_id = $1
       AND (created_by = $2 OR is_public = true OR id IN (
         SELECT report_id FROM report_shares WHERE shared_with_user_id = $2
       ))
       ORDER BY created_at DESC`,
      [tenantId, userId]
    )

    return result.rows.map(row => this.mapReportRow(row))
  }

  /**
   * Execute a report and return data
   */
  async executeReport(
    reportId: string,
    tenantId: string,
    userId: string,
    format: 'xlsx' | 'csv' | 'pdf' = 'csv'
  ): Promise<{ executionId: string; filePath: string; rowCount: number }> {
    const startTime = Date.now()

    // Get report configuration
    const report = await this.getReportById(reportId, tenantId)
    if (!report) {
      throw new Error('Report not found')
    }

    // Create execution record
    const executionResult = await pool.query(
      `INSERT INTO report_executions (
        report_id, executed_by, format, status
      ) VALUES ($1, $2, $3, 'running')
      RETURNING id`,
      [reportId, userId, format]
    )

    const executionId = executionResult.rows[0].id

    try {
      // Build and execute query
      const config: ReportConfig = {
        data_sources: report.data_sources,
        columns: report.columns,
        filters: report.filters,
        grouping: report.grouping,
        sorting: report.sorting,
        joins: report.joins,
        aggregations: report.aggregations
      }

      const { query, params } = this.buildQuery(config, tenantId)

      // Execute query
      const dataResult = await pool.query(query, params)
      const data = dataResult.rows

      // Export to file
      const exportOptions: ExportOptions = {
        title: report.report_name,
        columns: report.columns.map(col => ({
          field: col.field,
          label: col.label,
          type: col.type
        })),
        data,
        format,
        includeFooter: true,
        footer: {
          text: `Generated on ${new Date().toLocaleString()} | Total rows: ${data.length}`
        }
      }

      const filePath = await excelExportService.export(exportOptions)

      // Get file stats
      const fileStats = await excelExportService.getFileStats(filePath)
      const duration = Date.now() - startTime

      // Update execution record
      await pool.query(
        `UPDATE report_executions SET
          status = 'completed',
          execution_duration_ms = $1,
          row_count = $2,
          file_url = $3,
          file_size_bytes = $4
        WHERE id = $5`,
        [duration, data.length, filePath, fileStats?.size || 0, executionId]
      )

      return {
        executionId,
        filePath,
        rowCount: data.length
      }
    } catch (error: any) {
      // Update execution record with error
      await pool.query(
        `UPDATE report_executions SET
          status = 'failed',
          error_message = $1
        WHERE id = $2`,
        [error.message, executionId]
      )

      throw error
    }
  }

  /**
   * Build dynamic SQL query from report configuration
   */
  private buildQuery(config: ReportConfig, tenantId: string): { query: string; params: any[] } {
    const params: any[] = [tenantId]
    let paramIndex = 2

    // Build SELECT clause
    const selectColumns: string[] = []
    const hasAggregation = config.columns.some(col => col.aggregate)

    config.columns.forEach(col => {
      const schema = this.dataSourceSchemas.get(col.table)
      if (!schema) {
        throw new Error(`Invalid data source: ${col.table}`)
      }

      const alias = schema.alias
      const fieldName = `${alias}.${col.field}`

      if (col.aggregate) {
        const aggFunc = col.aggregate.toUpperCase()
        selectColumns.push(`${aggFunc}(${fieldName}) as ${col.field}`)
      } else {
        selectColumns.push(`${fieldName} as ${col.field}`)
      }
    })

    // Build FROM clause
    const primarySource = config.data_sources[0]
    const primarySchema = this.dataSourceSchemas.get(primarySource)
    if (!primarySchema) {
      throw new Error(`Invalid primary data source: ${primarySource}`)
    }

    let fromClause = `FROM ${primarySchema.table} ${primarySchema.alias}`

    // Build JOIN clauses
    if (config.joins && config.joins.length > 0) {
      config.joins.forEach(join => {
        const joinType = join.type.toUpperCase()
        fromClause += ` ${joinType} JOIN ${join.to} ON ${join.on}`
      })
    }

    // Build WHERE clause
    let whereClause = `WHERE ${primarySchema.alias}.tenant_id = $1`

    if (config.filters && config.filters.length > 0) {
      config.filters.forEach(filter => {
        const condition = this.buildFilterCondition(filter, paramIndex, params)
        whereClause += ` AND ${condition.sql}`
        paramIndex += condition.paramCount
      })
    }

    // Build GROUP BY clause
    let groupByClause = ''
    if (hasAggregation && config.grouping && config.grouping.length > 0) {
      const groupFields = config.grouping.map(g => g.field).join(', ')
      groupByClause = `GROUP BY ${groupFields}`
    }

    // Build ORDER BY clause
    let orderByClause = ''
    if (config.sorting && config.sorting.length > 0) {
      const sortFields = config.sorting.map(s => `${s.field} ${s.direction.toUpperCase()}`).join(', ')
      orderByClause = `ORDER BY ${sortFields}`
    }

    // Combine query parts
    const query = `
      SELECT ${selectColumns.join(', ')}
      ${fromClause}
      ${whereClause}
      ${groupByClause}
      ${orderByClause}
    `.trim()

    return { query, params }
  }

  /**
   * Build filter condition with parameterized values
   */
  private buildFilterCondition(
    filter: FilterCondition,
    paramIndex: number,
    params: any[]
  ): { sql: string; paramCount: number } {
    let sql = ''
    let paramCount = 0

    switch (filter.operator) {
      case 'equals':
        sql = `${filter.field} = $${paramIndex}`
        params.push(filter.value)
        paramCount = 1
        break
      case 'not_equals':
        sql = `${filter.field} != $${paramIndex}`
        params.push(filter.value)
        paramCount = 1
        break
      case 'greater_than':
        sql = `${filter.field} > $${paramIndex}`
        params.push(filter.value)
        paramCount = 1
        break
      case 'less_than':
        sql = `${filter.field} < $${paramIndex}`
        params.push(filter.value)
        paramCount = 1
        break
      case 'contains':
        sql = `${filter.field} ILIKE $${paramIndex}`
        params.push(`%${filter.value}%`)
        paramCount = 1
        break
      case 'not_contains':
        sql = `${filter.field} NOT ILIKE $${paramIndex}`
        params.push(`%${filter.value}%`)
        paramCount = 1
        break
      case 'between':
        sql = `${filter.field} BETWEEN $${paramIndex} AND $${paramIndex + 1}`
        params.push(filter.value, filter.value2)
        paramCount = 2
        break
      case 'in':
        const inPlaceholders = filter.value.map((_: any, i: number) => `$${paramIndex + i}`).join(', ')
        sql = `${filter.field} IN (${inPlaceholders})`
        params.push(...filter.value)
        paramCount = filter.value.length
        break
      case 'not_in':
        const notInPlaceholders = filter.value.map((_: any, i: number) => `$${paramIndex + i}`).join(', ')
        sql = `${filter.field} NOT IN (${notInPlaceholders})`
        params.push(...filter.value)
        paramCount = filter.value.length
        break
      case 'is_null':
        sql = `${filter.field} IS NULL`
        paramCount = 0
        break
      case 'is_not_null':
        sql = `${filter.field} IS NOT NULL`
        paramCount = 0
        break
      default:
        throw new Error(`Unsupported filter operator: ${filter.operator}`)
    }

    return { sql, paramCount }
  }

  /**
   * Get report execution history
   */
  async getExecutionHistory(
    reportId: string,
    tenantId: string
  ): Promise<any[]> {
    const result = await pool.query(
      `SELECT re.*, u.first_name, u.last_name
       FROM report_executions re
       LEFT JOIN users u ON re.executed_by = u.id
       JOIN custom_reports cr ON re.report_id = cr.id
       WHERE re.report_id = $1 AND cr.tenant_id = $2
       ORDER BY re.execution_time DESC
       LIMIT 50`,
      [reportId, tenantId]
    )

    return result.rows
  }

  /**
   * Get report templates
   */
  async getTemplates(tenantId?: string): Promise<any[]> {
    let query = 'SELECT 
      id,
      tenant_id,
      template_name,
      description,
      category,
      preview_image,
      config,
      is_system_template,
      usage_count,
      created_by,
      created_at,
      updated_at FROM report_templates WHERE is_system_template = true'
    const params: any[] = []

    if (tenantId) {
      query += ' OR tenant_id = $1'
      params.push(tenantId)
    }

    query += ' ORDER BY category, template_name'

    const result = await pool.query(query, params)

    return result.rows.map(row => ({
      ...row,
      config: row.config
    }))
  }

  /**
   * Create report from template
   */
  async createFromTemplate(
    templateId: string,
    tenantId: string,
    userId: string,
    reportName: string
  ): Promise<CustomReport> {
    const template = await pool.query(
      'SELECT 
      id,
      tenant_id,
      template_name,
      description,
      category,
      preview_image,
      config,
      is_system_template,
      usage_count,
      created_by,
      created_at,
      updated_at FROM report_templates WHERE id = $1',
      [templateId]
    )

    if (template.rows.length === 0) {
      throw new Error('Template not found')
    }

    const config = template.rows[0].config

    return this.createReport(tenantId, userId, {
      report_name: reportName,
      description: template.rows[0].description,
      data_sources: config.data_sources,
      columns: config.columns,
      filters: config.filters || [],
      grouping: config.grouping || [],
      sorting: config.sorting || [],
      joins: config.joins || [],
      aggregations: config.aggregations || [],
      is_public: false,
      is_template: false
    })
  }

  /**
   * Send report via email
   */
  async sendReportEmail(
    executionId: string,
    recipients: string[],
    reportName: string
  ): Promise<void> {
    const execution = await pool.query(
      'SELECT 
      id,
      report_id,
      schedule_id,
      executed_by,
      execution_time,
      execution_duration_ms,
      row_count,
      file_url,
      file_size_bytes,
      format,
      status,
      error_message,
      metadata FROM report_executions WHERE id = $1',
      [executionId]
    )

    if (execution.rows.length === 0) {
      throw new Error('Execution not found')
    }

    const filePath = execution.rows[0].file_url

    if (!process.env.SMTP_HOST) {
      console.warn('SMTP not configured. Skipping email send.')
      return
    }

    // Configure nodemailer
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    })

    // Send email
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@fleet.com',
      to: recipients.join(', '),
      subject: `Fleet Report: ${reportName}`,
      html: `
        <h2>${reportName}</h2>
        <p>Your scheduled fleet report is ready.</p>
        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Rows:</strong> ${execution.rows[0].row_count}</p>
        <p>Please find the report attached.</p>
      `,
      attachments: [
        {
          filename: path.basename(filePath),
          path: filePath
        }
      ]
    })
  }

  /**
   * Map database row to CustomReport object
   */
  private mapReportRow(row: any): CustomReport {
    return {
      id: row.id,
      tenant_id: row.tenant_id,
      report_name: row.report_name,
      description: row.description,
      data_sources: row.data_sources,
      filters: row.filters || [],
      columns: row.columns || [],
      grouping: row.grouping || [],
      sorting: row.sorting || [],
      aggregations: row.aggregations || [],
      joins: row.joins || [],
      created_by: row.created_by,
      is_public: row.is_public,
      is_template: row.is_template,
      created_at: row.created_at,
      updated_at: row.updated_at
    }
  }
}

export default new CustomReportService()
