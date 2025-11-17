/**
 * Excel Export Service
 *
 * Generates Excel (XLSX), CSV, and PDF files from report data
 * Uses exceljs for Excel generation with formatting support
 *
 * Installation: npm install exceljs
 */

import { Writable } from 'stream'
import fs from 'fs/promises'
import path from 'path'

// Note: Install exceljs package for full functionality
// import ExcelJS from 'exceljs'

export interface ExportColumn {
  field: string
  label: string
  type: 'string' | 'number' | 'currency' | 'date' | 'percentage' | 'boolean'
  width?: number
  format?: string
}

export interface ExportOptions {
  title: string
  columns: ExportColumn[]
  data: any[]
  format: 'xlsx' | 'csv' | 'pdf'
  includeHeader?: boolean
  includeFooter?: boolean
  footer?: {
    text: string
    columns?: { label: string; value: any }[]
  }
  sheetName?: string
}

export class ExcelExportService {
  private readonly OUTPUT_DIR = process.env.REPORTS_OUTPUT_DIR || '/tmp/fleet-reports'

  constructor() {
    // Ensure output directory exists
    this.ensureOutputDir()
  }

  /**
   * Ensure output directory exists
   */
  private async ensureOutputDir(): Promise<void> {
    try {
      await fs.mkdir(this.OUTPUT_DIR, { recursive: true })
    } catch (error) {
      console.error('Error creating output directory:', error)
    }
  }

  /**
   * Export data to specified format
   */
  async export(options: ExportOptions): Promise<string> {
    switch (options.format) {
      case 'xlsx':
        return this.exportToExcel(options)
      case 'csv':
        return this.exportToCSV(options)
      case 'pdf':
        return this.exportToPDF(options)
      default:
        throw new Error(`Unsupported export format: ${options.format}`)
    }
  }

  /**
   * Export to Excel (XLSX)
   */
  private async exportToExcel(options: ExportOptions): Promise<string> {
    // For production use, install exceljs: npm install exceljs
    // Uncomment the code below after installing exceljs

    /*
    const ExcelJS = require('exceljs')
    const workbook = new ExcelJS.Workbook()

    // Set workbook properties
    workbook.creator = 'Fleet Management System'
    workbook.created = new Date()
    workbook.modified = new Date()

    const worksheet = workbook.addWorksheet(options.sheetName || 'Report')

    // Add title
    if (options.title) {
      worksheet.mergeCells('A1', `${String.fromCharCode(64 + options.columns.length)}1`)
      const titleCell = worksheet.getCell('A1')
      titleCell.value = options.title
      titleCell.font = { size: 16, bold: true, color: { argb: 'FF1F4788' } }
      titleCell.alignment = { vertical: 'middle', horizontal: 'center' }
      worksheet.getRow(1).height = 30

      // Add empty row
      worksheet.addRow([])
    }

    // Add header row
    const headerRow = worksheet.addRow(options.columns.map(col => col.label))
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1F4788' }
    }
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' }
    headerRow.height = 25

    // Set column widths and formats
    options.columns.forEach((col, index) => {
      const column = worksheet.getColumn(index + 1)
      column.width = col.width || this.getDefaultWidth(col.type)

      // Set number format based on type
      if (col.type === 'currency') {
        column.numFmt = '$#,##0.00'
      } else if (col.type === 'percentage') {
        column.numFmt = '0.00%'
      } else if (col.type === 'date') {
        column.numFmt = 'mm/dd/yyyy'
      } else if (col.type === 'number') {
        column.numFmt = '#,##0.00'
      }
    })

    // Add data rows
    options.data.forEach((row, rowIndex) => {
      const dataRow = worksheet.addRow(
        options.columns.map(col => this.formatCellValue(row[col.field], col.type))
      )

      // Alternate row colors
      if (rowIndex % 2 === 0) {
        dataRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF5F5F5' }
        }
      }

      dataRow.alignment = { vertical: 'middle' }
      dataRow.height = 20
    })

    // Add borders to all cells
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) { // Skip title row
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFD3D3D3' } },
            left: { style: 'thin', color: { argb: 'FFD3D3D3' } },
            bottom: { style: 'thin', color: { argb: 'FFD3D3D3' } },
            right: { style: 'thin', color: { argb: 'FFD3D3D3' } }
          }
        })
      }
    })

    // Add footer
    if (options.footer) {
      worksheet.addRow([]) // Empty row

      if (options.footer.columns) {
        const footerRow = worksheet.addRow(
          options.columns.map(col => {
            const footerCol = options.footer!.columns!.find(fc => fc.label === col.label)
            return footerCol ? footerCol.value : ''
          })
        )
        footerRow.font = { bold: true }
        footerRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFEEEEEE' }
        }
      }

      if (options.footer.text) {
        worksheet.addRow([])
        const textRow = worksheet.addRow([options.footer.text])
        textRow.font = { italic: true, size: 10 }
      }
    }

    // Auto-filter
    const headerRowNumber = options.title ? 3 : 1
    worksheet.autoFilter = {
      from: { row: headerRowNumber, column: 1 },
      to: { row: headerRowNumber, column: options.columns.length }
    }

    // Freeze header row
    worksheet.views = [
      { state: 'frozen', xSplit: 0, ySplit: headerRowNumber }
    ]

    // Generate filename and save
    const filename = `${this.sanitizeFilename(options.title)}_${Date.now()}.xlsx`
    const filepath = path.join(this.OUTPUT_DIR, filename)

    await workbook.xlsx.writeFile(filepath)

    return filepath
    */

    // Fallback: Generate CSV for now
    console.warn('ExcelJS not installed. Falling back to CSV export. Run: npm install exceljs')
    return this.exportToCSV({ ...options, format: 'csv' })
  }

  /**
   * Export to CSV
   */
  private async exportToCSV(options: ExportOptions): Promise<string> {
    const lines: string[] = []

    // Add title
    if (options.title) {
      lines.push(`"${options.title}"`)
      lines.push('') // Empty line
    }

    // Add header
    lines.push(options.columns.map(col => `"${col.label}"`).join(','))

    // Add data rows
    options.data.forEach(row => {
      const values = options.columns.map(col => {
        const value = row[col.field]
        return this.formatCSVValue(value, col.type)
      })
      lines.push(values.join(','))
    })

    // Add footer
    if (options.footer) {
      lines.push('') // Empty line

      if (options.footer.columns) {
        const footerValues = options.columns.map(col => {
          const footerCol = options.footer!.columns!.find(fc => fc.label === col.label)
          return footerCol ? `"${footerCol.value}"` : '""'
        })
        lines.push(footerValues.join(','))
      }

      if (options.footer.text) {
        lines.push('') // Empty line
        lines.push(`"${options.footer.text}"`)
      }
    }

    // Generate filename and save
    const filename = `${this.sanitizeFilename(options.title)}_${Date.now()}.csv`
    const filepath = path.join(this.OUTPUT_DIR, filename)

    await fs.writeFile(filepath, lines.join('\n'), 'utf-8')

    return filepath
  }

  /**
   * Export to PDF
   */
  private async exportToPDF(options: ExportOptions): Promise<string> {
    // For production use, install pdfkit: npm install pdfkit @types/pdfkit
    // Or use puppeteer to generate PDF from HTML

    /*
    const PDFDocument = require('pdfkit')
    const doc = new PDFDocument({ margin: 50 })

    const filename = `${this.sanitizeFilename(options.title)}_${Date.now()}.pdf`
    const filepath = path.join(this.OUTPUT_DIR, filename)

    const stream = fs.createWriteStream(filepath)
    doc.pipe(stream)

    // Add title
    if (options.title) {
      doc.fontSize(20).text(options.title, { align: 'center' })
      doc.moveDown()
    }

    // Add table
    const tableTop = doc.y
    const itemHeight = 20
    const columnWidth = 80

    // Draw header
    doc.fontSize(10).fillColor('#1F4788')
    options.columns.forEach((col, i) => {
      doc.text(col.label, 50 + i * columnWidth, tableTop, {
        width: columnWidth,
        align: 'left'
      })
    })

    doc.moveTo(50, tableTop + itemHeight).lineTo(50 + options.columns.length * columnWidth, tableTop + itemHeight).stroke()

    // Draw data rows
    doc.fillColor('black')
    options.data.forEach((row, rowIndex) => {
      const y = tableTop + (rowIndex + 1) * itemHeight + 10

      options.columns.forEach((col, colIndex) => {
        const value = this.formatCellValue(row[col.field], col.type)
        doc.text(String(value), 50 + colIndex * columnWidth, y, {
          width: columnWidth,
          align: 'left'
        })
      })
    })

    doc.end()

    return new Promise((resolve, reject) => {
      stream.on('finish', () => resolve(filepath))
      stream.on('error', reject)
    })
    */

    // Fallback: Generate CSV for now
    console.warn('PDF generation not available. Falling back to CSV export. Install pdfkit or puppeteer for PDF support.')
    return this.exportToCSV({ ...options, format: 'csv' })
  }

  /**
   * Format cell value based on type
   */
  private formatCellValue(value: any, type: string): any {
    if (value === null || value === undefined) {
      return ''
    }

    switch (type) {
      case 'currency':
        return typeof value === 'number' ? value : parseFloat(value) || 0
      case 'percentage':
        return typeof value === 'number' ? value / 100 : parseFloat(value) / 100 || 0
      case 'date':
        return value instanceof Date ? value : new Date(value)
      case 'number':
        return typeof value === 'number' ? value : parseFloat(value) || 0
      case 'boolean':
        return Boolean(value)
      default:
        return String(value)
    }
  }

  /**
   * Format CSV value with proper escaping
   */
  private formatCSVValue(value: any, type: string): string {
    if (value === null || value === undefined) {
      return '""'
    }

    let formatted: string

    switch (type) {
      case 'currency':
        formatted = `$${parseFloat(value).toFixed(2)}`
        break
      case 'percentage':
        formatted = `${parseFloat(value).toFixed(2)}%`
        break
      case 'date':
        formatted = value instanceof Date ? value.toLocaleDateString() : new Date(value).toLocaleDateString()
        break
      case 'number':
        formatted = parseFloat(value).toFixed(2)
        break
      case 'boolean':
        formatted = Boolean(value) ? 'Yes' : 'No'
        break
      default:
        formatted = String(value)
    }

    // Escape quotes and wrap in quotes if contains comma or quote
    if (formatted.includes(',') || formatted.includes('"') || formatted.includes('\n')) {
      formatted = `"${formatted.replace(/"/g, '""')}"`
    } else {
      formatted = `"${formatted}"`
    }

    return formatted
  }

  /**
   * Get default column width based on type
   */
  private getDefaultWidth(type: string): number {
    switch (type) {
      case 'currency':
      case 'number':
      case 'percentage':
        return 15
      case 'date':
        return 12
      case 'boolean':
        return 10
      default:
        return 20
    }
  }

  /**
   * Sanitize filename
   */
  private sanitizeFilename(filename: string): string {
    return filename
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .substring(0, 50)
  }

  /**
   * Delete file
   */
  async deleteFile(filepath: string): Promise<void> {
    try {
      await fs.unlink(filepath)
    } catch (error) {
      console.error('Error deleting file:', error)
    }
  }

  /**
   * Get file stats
   */
  async getFileStats(filepath: string): Promise<{ size: number; created: Date } | null> {
    try {
      const stats = await fs.stat(filepath)
      return {
        size: stats.size,
        created: stats.birthtime
      }
    } catch (error) {
      console.error('Error getting file stats:', error)
      return null
    }
  }

  /**
   * Clean old files (older than specified days)
   */
  async cleanOldFiles(daysOld: number = 7): Promise<number> {
    try {
      const files = await fs.readdir(this.OUTPUT_DIR)
      const now = Date.now()
      const maxAge = daysOld * 24 * 60 * 60 * 1000
      let deletedCount = 0

      for (const file of files) {
        const filepath = path.join(this.OUTPUT_DIR, file)
        const stats = await fs.stat(filepath)

        if (now - stats.birthtimeMs > maxAge) {
          await fs.unlink(filepath)
          deletedCount++
        }
      }

      return deletedCount
    } catch (error) {
      console.error('Error cleaning old files:', error)
      return 0
    }
  }
}

export default new ExcelExportService()
