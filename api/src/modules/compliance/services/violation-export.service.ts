import { pool } from '../../../config/database';
import logger from '../../../utils/logger';
import { Parser } from 'json2csv';
import PDFDocument from 'pdfkit';
import { Readable } from 'stream';

/**
 * Violation Export Service
 * Handles CSV, PDF, and Excel exports of violation data
 */

interface ExportOptions {
  format: 'csv' | 'pdf' | 'excel';
  tenantId: string;
  filters?: {
    violationType?: string[];
    severity?: string[];
    status?: string[];
    dateFrom?: string;
    dateTo?: string;
  };
  includeResolved?: boolean;
  includeComments?: boolean;
  groupBy?: 'type' | 'severity' | 'vehicle' | 'driver' | 'date';
}

export class ViolationExportService {
  /**
   * Export violations to CSV
   */
  static async exportToCSV(options: ExportOptions): Promise<string> {
    try {
      const violations = await this.fetchViolationsForExport(options);

      const fields = [
        { label: 'ID', value: 'id' },
        { label: 'Date Occurred', value: 'occurred_at' },
        { label: 'Date Detected', value: 'detected_at' },
        { label: 'Type', value: 'violation_type' },
        { label: 'Severity', value: 'severity' },
        { label: 'Status', value: 'status' },
        { label: 'Policy Name', value: 'policy_name' },
        { label: 'Description', value: 'description' },
        { label: 'Vehicle Number', value: 'vehicle_number' },
        { label: 'Driver Name', value: 'driver_name' },
        { label: 'Threshold Value', value: 'threshold_value' },
        { label: 'Actual Value', value: 'actual_value' },
        { label: 'Difference', value: 'difference' },
        { label: 'Unit', value: 'unit' },
        { label: 'Location', value: 'location_address' },
        { label: 'Resolution', value: 'resolution' },
        { label: 'Resolution Notes', value: 'resolution_notes' },
        { label: 'Resolved At', value: 'resolved_at' },
        { label: 'Resolved By', value: 'resolved_by_name' },
        { label: 'Override Requested', value: 'override_requested' },
        { label: 'Override Approved', value: 'override_approved' },
        { label: 'Override Reason', value: 'override_reason' },
      ];

      const parser = new Parser({ fields });
      const csv = parser.parse(violations);

      logger.info('CSV export generated', { recordCount: violations.length });

      return csv;
    } catch (error) {
      logger.error('Failed to export CSV', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Export violations to PDF
   */
  static async exportToPDF(options: ExportOptions): Promise<Buffer> {
    try {
      const violations = await this.fetchViolationsForExport(options);

      return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Title
        doc.fontSize(20).font('Helvetica-Bold').text('Policy Violations Report', { align: 'center' });
        doc.moveDown();

        // Metadata
        doc.fontSize(10).font('Helvetica');
        doc.text(`Generated: ${new Date().toLocaleString()}`, { align: 'right' });
        doc.text(`Total Records: ${violations.length}`, { align: 'right' });
        doc.moveDown(2);

        // Summary statistics
        const stats = this.calculateSummaryStats(violations);
        doc.fontSize(14).font('Helvetica-Bold').text('Summary', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica');
        doc.text(`Total Violations: ${stats.total}`);
        doc.text(`Critical: ${stats.critical} | High: ${stats.high} | Medium: ${stats.medium} | Low: ${stats.low}`);
        doc.text(`Open: ${stats.open} | Resolved: ${stats.resolved}`);
        doc.moveDown(2);

        // Violations table
        doc.fontSize(14).font('Helvetica-Bold').text('Violations', { underline: true });
        doc.moveDown(0.5);

        violations.forEach((v, index) => {
          // Check if we need a new page
          if (doc.y > 700) {
            doc.addPage();
          }

          doc.fontSize(11).font('Helvetica-Bold');
          doc.text(`${index + 1}. ${v.violation_type.toUpperCase()}`, { continued: false });

          doc.fontSize(9).font('Helvetica');
          doc.text(`   Severity: ${v.severity} | Status: ${v.status}`, { indent: 20 });
          doc.text(`   Date: ${new Date(v.occurred_at).toLocaleDateString()}`, { indent: 20 });

          if (v.vehicle_number) {
            doc.text(`   Vehicle: ${v.vehicle_number}`, { indent: 20 });
          }

          if (v.driver_name) {
            doc.text(`   Driver: ${v.driver_name}`, { indent: 20 });
          }

          doc.text(`   Description: ${v.description}`, { indent: 20 });

          if (v.threshold_value && v.actual_value) {
            doc.text(`   Threshold: ${v.threshold_value} ${v.unit} | Actual: ${v.actual_value} ${v.unit} (Diff: +${v.difference} ${v.unit})`, { indent: 20 });
          }

          if (v.resolution_notes) {
            doc.text(`   Resolution: ${v.resolution_notes}`, { indent: 20 });
          }

          doc.moveDown(0.5);
        });

        // Footer
        const pageCount = doc.bufferedPageRange().count;
        for (let i = 0; i < pageCount; i++) {
          doc.switchToPage(i);
          doc.fontSize(8).text(
            `Page ${i + 1} of ${pageCount}`,
            50,
            doc.page.height - 50,
            { align: 'center' }
          );
        }

        doc.end();

        logger.info('PDF export generated', { recordCount: violations.length });
      });
    } catch (error) {
      logger.error('Failed to export PDF', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Export violations to Excel (XLSX)
   * Note: Requires xlsx package to be installed
   */
  static async exportToExcel(options: ExportOptions): Promise<Buffer> {
    try {
      // For now, return CSV format (can be opened in Excel)
      // To implement true XLSX, install 'xlsx' package and use it here
      const csv = await this.exportToCSV(options);
      return Buffer.from(csv, 'utf-8');
    } catch (error) {
      logger.error('Failed to export Excel', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Generate compliance report
   */
  static async generateComplianceReport(options: {
    tenantId: string;
    reportType: 'monthly' | 'quarterly' | 'annual';
    startDate: string;
    endDate: string;
  }): Promise<Buffer> {
    try {
      const { tenantId, reportType, startDate, endDate } = options;

      // Fetch violations for the period
      const violations = await this.fetchViolationsForExport({
        tenantId,
        format: 'pdf',
        filters: {
          dateFrom: startDate,
          dateTo: endDate,
        },
        includeResolved: true,
      });

      // Generate comprehensive PDF report
      return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Title Page
        doc.fontSize(24).font('Helvetica-Bold').text('Compliance Report', { align: 'center' });
        doc.moveDown();
        doc.fontSize(16).font('Helvetica').text(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Review`, { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(12).text(`Period: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`, { align: 'center' });
        doc.moveDown(3);

        // Executive Summary
        doc.fontSize(18).font('Helvetica-Bold').text('Executive Summary', { underline: true });
        doc.moveDown();

        const stats = this.calculateSummaryStats(violations);
        doc.fontSize(12).font('Helvetica');
        doc.text(`Total Policy Violations: ${stats.total}`);
        doc.moveDown(0.5);
        doc.text(`Breakdown by Severity:`);
        doc.text(`  • Critical: ${stats.critical} (${((stats.critical / stats.total) * 100).toFixed(1)}%)`);
        doc.text(`  • High: ${stats.high} (${((stats.high / stats.total) * 100).toFixed(1)}%)`);
        doc.text(`  • Medium: ${stats.medium} (${((stats.medium / stats.total) * 100).toFixed(1)}%)`);
        doc.text(`  • Low: ${stats.low} (${((stats.low / stats.total) * 100).toFixed(1)}%)`);
        doc.moveDown();
        doc.text(`Resolution Status:`);
        doc.text(`  • Resolved: ${stats.resolved} (${((stats.resolved / stats.total) * 100).toFixed(1)}%)`);
        doc.text(`  • Open: ${stats.open} (${((stats.open / stats.total) * 100).toFixed(1)}%)`);
        doc.moveDown(2);

        // Top Violation Types
        doc.fontSize(16).font('Helvetica-Bold').text('Top Violation Types', { underline: true });
        doc.moveDown();

        const typeCounts = this.groupByViolationType(violations);
        const topTypes = Object.entries(typeCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5);

        doc.fontSize(12).font('Helvetica');
        topTypes.forEach(([type, count], index) => {
          doc.text(`${index + 1}. ${type}: ${count} violations`);
        });
        doc.moveDown(2);

        // Policy Effectiveness
        doc.addPage();
        doc.fontSize(18).font('Helvetica-Bold').text('Policy Effectiveness Analysis', { underline: true });
        doc.moveDown();

        doc.fontSize(12).font('Helvetica');
        doc.text('Based on violation trends and resolution rates, the following observations are made:');
        doc.moveDown(0.5);

        // Calculate effectiveness metrics
        const resolutionRate = (stats.resolved / stats.total) * 100;
        const criticalRate = (stats.critical / stats.total) * 100;

        if (resolutionRate >= 80) {
          doc.text('✓ Policy enforcement is effective with a high resolution rate.', { indent: 20 });
        } else if (resolutionRate >= 60) {
          doc.text('⚠ Policy enforcement is moderate. Consider additional training.', { indent: 20 });
        } else {
          doc.text('✗ Policy enforcement needs improvement. Review enforcement procedures.', { indent: 20 });
        }
        doc.moveDown(0.5);

        if (criticalRate <= 5) {
          doc.text('✓ Critical violations are minimal, indicating good compliance.', { indent: 20 });
        } else if (criticalRate <= 15) {
          doc.text('⚠ Critical violations are moderate. Review high-risk policies.', { indent: 20 });
        } else {
          doc.text('✗ High number of critical violations. Immediate policy review required.', { indent: 20 });
        }
        doc.moveDown(2);

        // Recommendations
        doc.fontSize(16).font('Helvetica-Bold').text('Recommendations', { underline: true });
        doc.moveDown();

        doc.fontSize(12).font('Helvetica');
        doc.text('1. Review policies with the highest violation rates');
        doc.text('2. Provide additional training for drivers with multiple violations');
        doc.text('3. Consider revising thresholds for policies with >20% violation rate');
        doc.text('4. Implement automated alerts for critical violations');
        doc.text('5. Schedule quarterly policy effectiveness reviews');
        doc.moveDown(2);

        // Appendix - Detailed Violations
        doc.addPage();
        doc.fontSize(18).font('Helvetica-Bold').text('Appendix: Detailed Violations', { underline: true });
        doc.moveDown();

        violations.slice(0, 50).forEach((v, index) => {
          if (doc.y > 700) {
            doc.addPage();
          }

          doc.fontSize(10).font('Helvetica-Bold');
          doc.text(`${index + 1}. ${v.violation_type}`, { continued: false });

          doc.fontSize(9).font('Helvetica');
          doc.text(`   ${v.severity} | ${v.status} | ${new Date(v.occurred_at).toLocaleDateString()}`, { indent: 20 });
          if (v.vehicle_number) doc.text(`   Vehicle: ${v.vehicle_number}`, { indent: 20 });
          if (v.driver_name) doc.text(`   Driver: ${v.driver_name}`, { indent: 20 });

          doc.moveDown(0.3);
        });

        if (violations.length > 50) {
          doc.moveDown();
          doc.text(`... and ${violations.length - 50} more violations (see CSV export for full list)`);
        }

        // Footer on all pages
        const pageCount = doc.bufferedPageRange().count;
        for (let i = 0; i < pageCount; i++) {
          doc.switchToPage(i);
          doc.fontSize(8).text(
            `Compliance Report - Page ${i + 1} of ${pageCount} - Generated ${new Date().toLocaleDateString()}`,
            50,
            doc.page.height - 50,
            { align: 'center' }
          );
        }

        doc.end();

        logger.info('Compliance report generated', {
          reportType,
          violationCount: violations.length,
        });
      });
    } catch (error) {
      logger.error('Failed to generate compliance report', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Fetch violations for export with filters
   */
  private static async fetchViolationsForExport(options: ExportOptions): Promise<any[]> {
    let query = `
      SELECT * FROM policy_violations
      WHERE tenant_id = $1
    `;

    const params: any[] = [options.tenantId];
    let paramCount = 2;

    if (options.filters) {
      if (options.filters.violationType && options.filters.violationType.length > 0) {
        query += ` AND violation_type = ANY($${paramCount}::text[])`;
        params.push(options.filters.violationType);
        paramCount++;
      }

      if (options.filters.severity && options.filters.severity.length > 0) {
        query += ` AND severity = ANY($${paramCount}::text[])`;
        params.push(options.filters.severity);
        paramCount++;
      }

      if (options.filters.status && options.filters.status.length > 0) {
        query += ` AND status = ANY($${paramCount}::text[])`;
        params.push(options.filters.status);
        paramCount++;
      }

      if (options.filters.dateFrom) {
        query += ` AND occurred_at >= $${paramCount}`;
        params.push(options.filters.dateFrom);
        paramCount++;
      }

      if (options.filters.dateTo) {
        query += ` AND occurred_at <= $${paramCount}`;
        params.push(options.filters.dateTo);
        paramCount++;
      }
    }

    if (!options.includeResolved) {
      query += ` AND status != 'resolved'`;
    }

    query += ` ORDER BY occurred_at DESC`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Calculate summary statistics
   */
  private static calculateSummaryStats(violations: any[]): any {
    return {
      total: violations.length,
      critical: violations.filter(v => v.severity === 'critical').length,
      high: violations.filter(v => v.severity === 'high').length,
      medium: violations.filter(v => v.severity === 'medium').length,
      low: violations.filter(v => v.severity === 'low').length,
      open: violations.filter(v => v.status === 'open' || v.status === 'acknowledged' || v.status === 'under_review').length,
      resolved: violations.filter(v => v.status === 'resolved').length,
    };
  }

  /**
   * Group violations by type
   */
  private static groupByViolationType(violations: any[]): Record<string, number> {
    return violations.reduce((acc, v) => {
      acc[v.violation_type] = (acc[v.violation_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
}

export default ViolationExportService;
