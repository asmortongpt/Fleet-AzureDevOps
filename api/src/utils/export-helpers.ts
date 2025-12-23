/**
 * Export Helper Utilities - Eliminates duplicate export/download code
 * Provides consistent JSON, CSV, and Excel export functionality
 */

import { Response } from 'express';

import logger from '../config/logger';

/**
 * Export formats
 */
export enum ExportFormat {
  JSON = 'json',
  CSV = 'csv',
  EXCEL = 'excel',
}

/**
 * Column configuration for exports
 */
export interface ExportColumn {
  key: string;
  label: string;
  format?: (value: any) => string;
}

/**
 * Export configuration
 */
export interface ExportConfig {
  filename: string;
  columns?: ExportColumn[];
  format: ExportFormat;
  includeHeaders?: boolean;
}

/**
 * Format data for export based on column configuration
 */
function formatDataForExport(
  data: any[],
  columns?: ExportColumn[]
): Record<string, any>[] {
  if (!columns || columns.length === 0) {
    return data;
  }

  return data.map((row) => {
    const formatted: Record<string, any> = {};
    columns.forEach((col) => {
      const value = row[col.key];
      formatted[col.label] = col.format ? col.format(value) : value;
    });
    return formatted;
  });
}

/**
 * Export data as JSON
 */
export function exportJSON(
  res: Response,
  data: any[],
  filename: string
): void {
  const jsonData = JSON.stringify(data, null, 2);

  res.setHeader('Content-Type', 'application/json');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${filename}.json"`
  );
  res.setHeader('Content-Length', Buffer.byteLength(jsonData));

  logger.info('Exported JSON', { filename, rows: data.length });
  res.send(jsonData);
}

/**
 * Convert data to CSV format
 */
function arrayToCSV(data: Record<string, any>[], includeHeaders = true): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const rows: string[] = [];

  if (includeHeaders) {
    rows.push(headers.map(escapeCSVValue).join(','));
  }

  data.forEach((row) => {
    const values = headers.map((header) => {
      const value = row[header];
      return escapeCSVValue(value);
    });
    rows.push(values.join(','));
  });

  return rows.join('\n');
}

/**
 * Escape CSV value to handle commas, quotes, and newlines
 */
function escapeCSVValue(value: any): string {
  if (value === null || value === undefined) return '';

  const stringValue = String(value);

  // If value contains comma, quote, or newline, wrap in quotes and escape existing quotes
  if (
    stringValue.includes(',') ||
    stringValue.includes('"') ||
    stringValue.includes('\n')
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

/**
 * Export data as CSV
 */
export function exportCSV(
  res: Response,
  data: any[],
  config: Omit<ExportConfig, 'format'>
): void {
  const formattedData = formatDataForExport(data, config.columns);
  const csv = arrayToCSV(formattedData, config.includeHeaders !== false);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${config.filename}.csv"`
  );
  res.setHeader('Content-Length', Buffer.byteLength(csv));

  logger.info('Exported CSV', { filename: config.filename, rows: data.length });
  res.send(csv);
}

/**
 * Generic export handler - routes to appropriate export function
 */
export function exportData(
  res: Response,
  data: any[],
  config: ExportConfig
): void {
  switch (config.format) {
    case ExportFormat.JSON:
      return exportJSON(res, data, config.filename);

    case ExportFormat.CSV:
      return exportCSV(res, data, {
        filename: config.filename,
        columns: config.columns,
        includeHeaders: config.includeHeaders,
      });

    case ExportFormat.EXCEL:
      // For Excel export, we'll delegate to the existing excel-export service
      // This is handled separately due to the complexity of Excel generation
      throw new Error(
        'Excel export should use ExcelExportService directly'
      );

    default:
      throw new Error(`Unsupported export format: ${config.format}`);
  }
}

/**
 * Parse export format from query parameter or header
 */
export function parseExportFormat(
  formatParam?: string
): ExportFormat | null {
  if (!formatParam) return null;

  const normalized = formatParam.toLowerCase();
  switch (normalized) {
    case 'json':
      return ExportFormat.JSON;
    case 'csv':
      return ExportFormat.CSV;
    case 'excel':
    case 'xlsx':
      return ExportFormat.EXCEL;
    default:
      return null;
  }
}

/**
 * Common export column configurations
 */
export const CommonExportColumns = {
  vehicle: [
    { key: 'id', label: 'ID' },
    { key: 'make', label: 'Make' },
    { key: 'model', label: 'Model' },
    { key: 'year', label: 'Year' },
    { key: 'vin', label: 'VIN' },
    { key: 'license_plate', label: 'License Plate' },
    { key: 'status', label: 'Status' },
    {
      key: 'created_at',
      label: 'Created At',
      format: (date: string) => new Date(date).toLocaleDateString(),
    },
  ],

  driver: [
    { key: 'id', label: 'ID' },
    { key: 'first_name', label: 'First Name' },
    { key: 'last_name', label: 'Last Name' },
    { key: 'email', label: 'Email' },
    { key: 'license_number', label: 'License Number' },
    { key: 'status', label: 'Status' },
    {
      key: 'created_at',
      label: 'Created At',
      format: (date: string) => new Date(date).toLocaleDateString(),
    },
  ],

  workOrder: [
    { key: 'id', label: 'ID' },
    { key: 'title', label: 'Title' },
    { key: 'description', label: 'Description' },
    { key: 'status', label: 'Status' },
    { key: 'priority', label: 'Priority' },
    { key: 'vehicle_id', label: 'Vehicle ID' },
    {
      key: 'created_at',
      label: 'Created At',
      format: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      key: 'due_date',
      label: 'Due Date',
      format: (date: string) =>
        date ? new Date(date).toLocaleDateString() : 'N/A',
    },
  ],

  maintenance: [
    { key: 'id', label: 'ID' },
    { key: 'vehicle_id', label: 'Vehicle ID' },
    { key: 'service_type', label: 'Service Type' },
    { key: 'description', label: 'Description' },
    { key: 'cost', label: 'Cost', format: (val: number) => `$${val.toFixed(2)}` },
    { key: 'odometer', label: 'Odometer' },
    {
      key: 'service_date',
      label: 'Service Date',
      format: (date: string) => new Date(date).toLocaleDateString(),
    },
  ],
};

/**
 * Helper function to add export endpoint to any router
 * Usage: router.get('/export', createExportHandler('vehicles', vehicleService))
 */
export function createExportEndpoint(
  resourceName: string,
  serviceName: string,
  columns?: ExportColumn[]
) {
  return async (req: any, res: Response) => {
    const format = parseExportFormat(req.query.format as string) || ExportFormat.CSV;
    const tenantId = req.user?.tenant_id;

    if (!tenantId) {
      res.status(400).json({ error: 'Tenant ID is required' });
      return;
    }

    try {
      // Get data from service
      const container = (req as any).container || require('../container').container;
      const service = container.resolve(serviceName);
      const methodName = `getAll${resourceName.charAt(0).toUpperCase() + resourceName.slice(1)}`;
      const data = await service[methodName](tenantId);

      // Export data
      const timestamp = new Date().toISOString().split('T')[0];
      exportData(res, data, {
        filename: `${resourceName}-${timestamp}`,
        format,
        columns,
        includeHeaders: true,
      });
    } catch (error) {
      logger.error('Export failed', { error, resourceName, tenantId });
      res.status(500).json({ error: 'Export failed' });
    }
  };
}
