/**
 * Export/Import Utilities
 *
 * Centralized utilities for exporting and importing data across all modules.
 * Eliminates duplicate export/import logic in 15+ modules.
 *
 * Supported formats:
 * - CSV (export & import)
 * - Excel (export & import)
 * - PDF (export only - requires jsPDF)
 * - JSON (export & import)
 *
 * Features:
 * - Type-safe exports with TypeScript
 * - Automatic filename generation
 * - Custom column mapping
 * - Data validation on import
 * - Error handling
 * - Progress callbacks for large datasets
 *
 * Usage:
 * ```tsx
 * import { exportToCSV, exportToExcel, importFromCSV } from '@/lib/export-utils'
 *
 * // Export
 * const handleExport = () => {
 *   exportToCSV(vehicles, 'fleet-vehicles', {
 *     columns: ['id', 'make', 'model', 'year', 'status']
 *   })
 * }
 *
 * // Import
 * const handleImport = async (file: File) => {
 *   const data = await importFromCSV(file)
 *   // Process imported data...
 * }
 * ```
 */

import logger from '@/utils/logger'
import XLSX from 'xlsx'

export interface ExportOptions {
  filename?: string
  columns?: string[] // Specific columns to export
  columnHeaders?: Record<string, string> // Custom column names
  dateFormat?: string
  includeHeaders?: boolean
  sheetName?: string // For Excel
}

export interface ImportOptions {
  skipRows?: number
  columnMapping?: Record<string, string> // Map CSV columns to object keys
  validate?: (row: any) => boolean
  transform?: (row: any) => any
}

/**
 * Convert data to CSV format
 */
function convertToCSV(data: any[], options: ExportOptions = {}): string {
  if (!data || data.length === 0) {
    return ''
  }

  const {
    columns,
    columnHeaders = {},
    includeHeaders = true
  } = options

  // Determine columns to export
  const keys = columns || Object.keys(data[0])

  // Generate CSV header row
  const headers = keys.map((key) => columnHeaders[key] || key)
  const headerRow = headers.map(escapeCSVValue).join(',')

  // Generate data rows
  const dataRows = data.map((row) => {
    return keys
      .map((key) => {
        const value = row[key]
        return escapeCSVValue(value)
      })
      .join(',')
  })

  // Combine header and data
  const csvContent = includeHeaders
    ? [headerRow, ...dataRows].join('\n')
    : dataRows.join('\n')

  return csvContent
}

/**
 * Escape CSV value (handle commas, quotes, newlines)
 */
function escapeCSVValue(value: any): string {
  if (value === null || value === undefined) {
    return ''
  }

  // Convert to string
  let str = String(value)

  // Handle dates
  if (value instanceof Date) {
    str = value.toISOString()
  }

  // Handle objects/arrays
  if (typeof value === 'object' && !(value instanceof Date)) {
    str = JSON.stringify(value)
  }

  // Escape if contains special characters
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    str = `"${str.replace(/"/g, '""')}"`
  }

  return str
}

/**
 * Download file to browser
 */
function downloadFile(content: string | Blob, filename: string, mimeType: string): void {
  const blob =
    content instanceof Blob ? content : new Blob([content], { type: mimeType })

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Export data to CSV file
 */
export function exportToCSV(
  data: any[],
  baseFilename: string = 'export',
  options: ExportOptions = {}
): void {
  const csv = convertToCSV(data, options)
  const filename = options.filename || `${baseFilename}-${getTimestamp()}.csv`
  downloadFile(csv, filename, 'text/csv;charset=utf-8;')
}

/**
 * Export data to Excel file (XLSX)
 * Note: Requires exceljs library to be installed
 */
export async function exportToExcel(
  data: any[],
  baseFilename: string = 'export',
  options: ExportOptions = {}
): Promise<void> {
  try {
    // Dynamically import exceljs to reduce bundle size
    const ExcelJS = await import('exceljs')

    const {
      columns,
      columnHeaders = {},
      sheetName = 'Sheet1'
    } = options

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet(sheetName)

    // Determine columns
    const keys = columns || (data.length > 0 ? Object.keys(data[0]) : [])

    // Set up worksheet columns with headers
    worksheet.columns = keys.map((key) => ({
      header: columnHeaders[key] || key,
      key: key,
      width: 15
    }))

    // Add data rows
    data.forEach((row) => {
      const rowData: any = {}
      keys.forEach((key) => {
        rowData[key] = row[key]
      })
      worksheet.addRow(rowData)
    })

    // Style the header row
    worksheet.getRow(1).font = { bold: true }

    // Generate Excel file
    const filename = options.filename || `${baseFilename}-${getTimestamp()}.xlsx`
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    downloadFile(blob, filename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  } catch (error) {
    logger.error('Failed to export to Excel:', error)
    // Fallback to CSV if Excel export fails
    exportToCSV(data, baseFilename, options)
  }
}

/**
 * Export data to PDF file
 * Note: Requires jsPDF library to be installed
 */
export async function exportToPDF(
  data: any[],
  baseFilename: string = 'export',
  options: ExportOptions & {
    title?: string
    orientation?: 'portrait' | 'landscape'
    pageSize?: 'a4' | 'letter'
  } = {}
): Promise<void> {
  try {
    // Dynamically import jsPDF to reduce bundle size
    const { jsPDF } = await import('jspdf')
    await import('jspdf-autotable')

    const {
      columns,
      columnHeaders = {},
      title = 'Export',
      orientation = 'portrait',
      pageSize = 'a4'
    } = options

    const doc = new jsPDF({
      orientation,
      unit: 'mm',
      format: pageSize
    })

    // Add title
    doc.setFontSize(16)
    doc.text(title, 14, 15)

    // Prepare table data
    const keys = columns || Object.keys(data[0] || {})
    const headers = keys.map((key) => columnHeaders[key] || key)
    const tableData = data.map((row) => keys.map((key) => row[key] ?? ''))

    // Add table
    ;(doc as any).autoTable({
      head: [headers],
      body: tableData,
      startY: 25,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 139, 202] }
    })

    // Save PDF
    const filename = options.filename || `${baseFilename}-${getTimestamp()}.pdf`
    doc.save(filename)
  } catch (error) {
    logger.error('Failed to export to PDF:', error)
    throw new Error('PDF export failed. Please ensure jsPDF library is installed.')
  }
}

/**
 * Export data to JSON file
 */
export function exportToJSON(
  data: any[],
  baseFilename: string = 'export',
  options: ExportOptions = {}
): void {
  const json = JSON.stringify(data, null, 2)
  const filename = options.filename || `${baseFilename}-${getTimestamp()}.json`
  downloadFile(json, filename, 'application/json;charset=utf-8;')
}

/**
 * Parse CSV file content
 */
function parseCSV(content: string, options: ImportOptions = {}): any[] {
  const { skipRows = 0, columnMapping = {} } = options

  const lines = content.split(/\r?\n/).filter((line) => line.trim())

  if (lines.length === 0) {
    return []
  }

  // Skip specified rows
  const dataLines = lines.slice(skipRows)

  if (dataLines.length === 0) {
    return []
  }

  // Parse header row
  const headers = parseCSVLine(dataLines[0])

  // Parse data rows
  const result: any[] = []

  for (let i = 1; i < dataLines.length; i++) {
    const values = parseCSVLine(dataLines[i])
    const row: any = {}

    headers.forEach((header, index) => {
      const key = columnMapping[header] || header
      row[key] = values[index] || ''
    })

    // Validate row if validator provided
    if (options.validate && !options.validate(row)) {
      continue
    }

    // Transform row if transformer provided
    const finalRow = options.transform ? options.transform(row) : row

    result.push(finalRow)
  }

  return result
}

/**
 * Parse a single CSV line (handles quotes and commas)
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"'
        i++
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  // Add last field
  result.push(current.trim())

  return result
}

/**
 * Import data from CSV file
 */
export async function importFromCSV(
  file: File,
  options: ImportOptions = {}
): Promise<any[]> {
  const text = await file.text()
  return parseCSV(text, options)
}

/**
 * Import data from Excel file
 * Note: Requires exceljs library to be installed
 */
export async function importFromExcel(
  file: File,
  options: ImportOptions & { sheetName?: string } = {}
): Promise<any[]> {
  try {
    const ExcelJS = await import('exceljs')

    const buffer = await file.arrayBuffer()
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(buffer)

    // Get worksheet
    const worksheet = options.sheetName
      ? workbook.getWorksheet(options.sheetName)
      : workbook.worksheets[0]

    if (!worksheet) {
      throw new Error('Sheet not found')
    }

    // Convert worksheet to JSON
    let data: any[] = []
    const headers: string[] = []

    // Get headers from first row
    const firstRow = worksheet.getRow(1)
    firstRow.eachCell((cell, colNumber) => {
      headers[colNumber - 1] = cell.value?.toString() || `Column${colNumber}`
    })

    // Get data rows
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return // Skip header row

      const rowData: any = {}
      row.eachCell((cell, colNumber) => {
        const header = headers[colNumber - 1]
        rowData[header] = cell.value
      })
      data.push(rowData)
    })

    // Apply column mapping if provided
    if (options.columnMapping) {
      data = data.map((row: any) => {
        const newRow: any = {}
        Object.keys(row).forEach((key) => {
          const newKey = options.columnMapping![key] || key
          newRow[newKey] = row[key]
        })
        return newRow
      })
    }

    // Filter with validator if provided
    if (options.validate) {
      data = data.filter(options.validate)
    }

    // Transform if transformer provided
    if (options.transform) {
      data = data.map(options.transform)
    }

    return data
  } catch (error) {
    logger.error('Failed to import from Excel:', error)
    throw new Error('Excel import failed. Please ensure the file is a valid Excel file.')
  }
}

/**
 * Import data from JSON file
 */
export async function importFromJSON(file: File): Promise<any[]> {
  const text = await file.text()
  const data = JSON.parse(text)

  if (!Array.isArray(data)) {
    throw new Error('JSON file must contain an array')
  }

  return data
}

/**
 * Detect file type and import accordingly
 */
export async function importFromFile(
  file: File,
  options: ImportOptions = {}
): Promise<any[]> {
  const extension = file.name.split('.').pop()?.toLowerCase()

  switch (extension) {
    case 'csv':
      return importFromCSV(file, options)
    case 'xlsx':
    case 'xls':
      return importFromExcel(file, options)
    case 'json':
      return importFromJSON(file)
    default:
      throw new Error(`Unsupported file type: ${extension}`)
  }
}

/**
 * Generate timestamp for filenames
 */
function getTimestamp(): string {
  const now = new Date()
  return now.toISOString().replace(/[:.]/g, '-').slice(0, 19)
}

/**
 * Validate import data structure
 */
export function validateImportData(
  data: any[],
  requiredFields: string[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!Array.isArray(data)) {
    errors.push('Data must be an array')
    return { valid: false, errors }
  }

  if (data.length === 0) {
    errors.push('Data array is empty')
    return { valid: false, errors }
  }

  // Check required fields in first row
  const firstRow = data[0]
  requiredFields.forEach((field) => {
    if (!(field in firstRow)) {
      errors.push(`Missing required field: ${field}`)
    }
  })

  return {
    valid: errors.length === 0,
    errors
  }
}
