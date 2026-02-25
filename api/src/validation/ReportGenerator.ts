import { logger } from '../lib/logger';
import { IssueTracker } from './IssueTracker';
import {
  ReportFormat,
  ReportOptions,
  ReportSummary,
  ValidationIssueTracking
} from './models/IssueModels';

/**
 * Report Generator
 * Generates reports in multiple formats: JSON, CSV, HTML, PDF
 */
export class ReportGenerator {
  constructor(private issueTracker: IssueTracker) {}

  /**
   * Generate report in specified format (synchronous)
   */
  generateReport(
    format: ReportFormat,
    options?: ReportOptions
  ): string {
    switch (format) {
      case 'json':
        return this.generateJsonReport(options);
      case 'csv':
        return this.generateCsvReport(options);
      case 'html':
        return this.generateHtmlReport(options);
      default:
        throw new Error(`Unsupported report format: ${format}`);
    }
  }

  /**
   * Generate report asynchronously (for formats requiring async processing)
   */
  async generateReportAsync(
    format: ReportFormat,
    options?: ReportOptions
  ): Promise<Buffer> {
    switch (format) {
      case 'pdf':
        return this.generatePdfReport(options);
      default:
        // For other formats, convert sync result to buffer
        const result = this.generateReport(format, options);
        return Buffer.from(result, 'utf-8');
    }
  }

  /**
   * Generate JSON report
   */
  private generateJsonReport(options?: ReportOptions): string {
    const issues = this.getFilteredIssues(options);
    const sortedIssues = this.sortIssues(issues, options);

    const summary = this.generateSummary(options);

    const report = {
      metadata: {
        generatedAt: new Date().toISOString(),
        format: 'json',
        version: '1.0',
        totalIssuesIncluded: sortedIssues.length
      },
      summary,
      issues: sortedIssues.map(issue => ({
        id: issue.id,
        title: issue.title,
        description: issue.description,
        severity: issue.severity,
        category: issue.category,
        status: issue.status,
        affectedComponent: issue.affectedComponent,
        detectedBy: issue.detectedBy,
        createdAt: issue.createdAt.toISOString(),
        updatedAt: issue.updatedAt.toISOString(),
        assignedTo: issue.assignedTo || null,
        assignedToEmail: issue.assignedToEmail || null,
        impactAssessment: issue.impactAssessment || null,
        resolutionTime: issue.resolutionTime || null,
        notesCount: issue.notes.length,
        historyCount: issue.history.length
      }))
    };

    logger.debug('JSON report generated', { issueCount: sortedIssues.length });
    return JSON.stringify(report, null, 2);
  }

  /**
   * Generate CSV report
   */
  private generateCsvReport(options?: ReportOptions): string {
    const issues = this.getFilteredIssues(options);
    const sortedIssues = this.sortIssues(issues, options);

    // CSV header
    const headers = [
      'ID',
      'Title',
      'Description',
      'Severity',
      'Category',
      'Status',
      'Affected Component',
      'Detected By',
      'Created At',
      'Updated At',
      'Assigned To',
      'Assigned Email',
      'Notes Count',
      'History Count'
    ];

    const rows: string[] = [headers.join(',')];

    for (const issue of sortedIssues) {
      const row = [
        this.escapeCsv(issue.id),
        this.escapeCsv(issue.title),
        this.escapeCsv(issue.description),
        this.escapeCsv(issue.severity),
        this.escapeCsv(issue.category),
        this.escapeCsv(issue.status),
        this.escapeCsv(issue.affectedComponent),
        this.escapeCsv(issue.detectedBy),
        this.escapeCsv(issue.createdAt.toISOString()),
        this.escapeCsv(issue.updatedAt.toISOString()),
        this.escapeCsv(issue.assignedTo || ''),
        this.escapeCsv(issue.assignedToEmail || ''),
        String(issue.notes.length),
        String(issue.history.length)
      ];

      rows.push(row.join(','));
    }

    logger.debug('CSV report generated', { issueCount: sortedIssues.length });
    return rows.join('\n');
  }

  /**
   * Generate HTML report
   */
  private generateHtmlReport(options?: ReportOptions): string {
    const issues = this.getFilteredIssues(options);
    const sortedIssues = this.sortIssues(issues, options);
    const summary = this.generateSummary(options);

    const issuesByCategory = this.groupIssuesByCategory(sortedIssues);

    let htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Issue Tracking Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      background-color: #f5f5f5;
      color: #333;
      line-height: 1.6;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background-color: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 {
      color: #2c3e50;
      border-bottom: 3px solid #3498db;
      padding-bottom: 10px;
    }
    h2 {
      color: #34495e;
      margin-top: 30px;
      border-left: 4px solid #3498db;
      padding-left: 10px;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin: 20px 0;
    }
    .summary-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
    }
    .summary-card.critical { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
    .summary-card.high { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); }
    .summary-card.medium { background: linear-gradient(135deg, #30cfd0 0%, #330867 100%); }
    .summary-card.low { background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); color: #333; }
    .summary-card h3 {
      margin: 0 0 10px 0;
      font-size: 14px;
      opacity: 0.9;
    }
    .summary-card .value {
      font-size: 32px;
      font-weight: bold;
    }
    .issues-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    .issues-table th {
      background-color: #34495e;
      color: white;
      padding: 12px;
      text-align: left;
      font-weight: 600;
    }
    .issues-table td {
      padding: 12px;
      border-bottom: 1px solid #ecf0f1;
    }
    .issues-table tr:hover {
      background-color: #f8f9fa;
    }
    .severity-badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
      color: white;
    }
    .severity-critical { background-color: #e74c3c; }
    .severity-high { background-color: #f39c12; }
    .severity-medium { background-color: #f1c40f; color: #333; }
    .severity-low { background-color: #27ae60; }
    .status-badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      background-color: #ecf0f1;
      color: #34495e;
    }
    .category-section {
      margin: 20px 0;
      padding: 15px;
      background-color: #f8f9fa;
      border-left: 4px solid #3498db;
      border-radius: 4px;
    }
    .category-title {
      font-size: 18px;
      font-weight: bold;
      color: #2c3e50;
      margin-bottom: 10px;
    }
    .metadata {
      font-size: 12px;
      color: #7f8c8d;
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #ecf0f1;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Issue Tracking Report</h1>
    <div class="metadata">Generated at: ${new Date().toLocaleString()}</div>

    <h2>Summary</h2>
    <div class="summary-grid">
      <div class="summary-card critical">
        <h3>Critical</h3>
        <div class="value">${summary.criticalCount}</div>
      </div>
      <div class="summary-card high">
        <h3>High</h3>
        <div class="value">${summary.highCount}</div>
      </div>
      <div class="summary-card medium">
        <h3>Medium</h3>
        <div class="value">${summary.mediumCount}</div>
      </div>
      <div class="summary-card low">
        <h3>Low</h3>
        <div class="value">${summary.lowCount}</div>
      </div>
    </div>
`;

    // Issues grouped by category
    for (const [category, categoryIssues] of Object.entries(issuesByCategory)) {
      htmlContent += `
    <div class="category-section">
      <div class="category-title">${category} (${categoryIssues.length} issues)</div>
      <table class="issues-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Title</th>
            <th>Severity</th>
            <th>Status</th>
            <th>Assigned To</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
`;

      for (const issue of categoryIssues) {
        const assignedDisplay = issue.assignedToEmail || issue.assignedTo || 'Unassigned';
        htmlContent += `
          <tr>
            <td>${this.escapeHtml(issue.id)}</td>
            <td>${this.escapeHtml(issue.title)}</td>
            <td><span class="severity-badge severity-${issue.severity}">${issue.severity.toUpperCase()}</span></td>
            <td><span class="status-badge">${this.escapeHtml(issue.status)}</span></td>
            <td>${this.escapeHtml(assignedDisplay)}</td>
            <td>${issue.createdAt.toLocaleDateString()}</td>
          </tr>
`;
      }

      htmlContent += `
        </tbody>
      </table>
    </div>
`;
    }

    htmlContent += `
    <div class="metadata">
      <strong>Report Metadata:</strong><br>
      Total Issues: ${sortedIssues.length}<br>
      Average Resolution Time: ${Math.round(summary.averageResolutionTime / 1000 / 60)} minutes<br>
      False Positive Rate: ${summary.falsePositiveRate.toFixed(2)}%
    </div>
  </div>
</body>
</html>`;

    logger.debug('HTML report generated', { issueCount: sortedIssues.length });
    return htmlContent;
  }

  /**
   * Generate PDF report
   * Currently not implemented - use HTML format instead
   */
  private async generatePdfReport(options?: ReportOptions): Promise<Buffer> {
    logger.warn('PDF export requested but not yet implemented');
    // TODO: Implement with PDFKit or Puppeteer when needed
    // For now, throw error indicating feature not available
    throw new Error('PDF export is not yet implemented. Please use HTML or CSV format instead.');
  }

  /**
   * Generate summary report
   */
  generateSummary(options?: ReportOptions): ReportSummary {
    const issues = this.getFilteredIssues(options);
    const metrics = this.issueTracker.getIssueMetrics();

    return {
      totalIssues: issues.length,
      issuesBySeverity: metrics.issuesBySeverity,
      issuesByStatus: metrics.issuesByStatus,
      criticalCount: metrics.criticalIssuesCount,
      highCount: metrics.issuesBySeverity.high,
      mediumCount: metrics.issuesBySeverity.medium,
      lowCount: metrics.issuesBySeverity.low,
      generatedAt: new Date(),
      averageResolutionTime: metrics.averageResolutionTime,
      falsePositiveRate: metrics.falsePositiveRate
    };
  }

  /**
   * Get filtered issues based on options
   */
  private getFilteredIssues(options?: ReportOptions): ValidationIssueTracking[] {
    const criteria: any = {};

    if (options?.severity) {
      criteria.severity = options.severity;
    }

    if (options?.status) {
      criteria.status = options.status;
    }

    if (options?.category) {
      criteria.category = options.category;
    }

    return this.issueTracker.searchIssues(criteria);
  }

  /**
   * Sort issues
   */
  private sortIssues(
    issues: ValidationIssueTracking[],
    options?: ReportOptions
  ): ValidationIssueTracking[] {
    const sorted = [...issues];
    const sortBy = options?.sortBy || 'severity';
    const sortDirection = options?.sortDirection || 'desc';

    sorted.sort((a, b) => {
      let aVal = (a as any)[sortBy];
      let bVal = (b as any)[sortBy];

      // Handle severity sorting
      if (sortBy === 'severity') {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        aVal = (severityOrder as any)[aVal] || 0;
        bVal = (severityOrder as any)[bVal] || 0;
      }

      // Handle status sorting
      if (sortBy === 'status') {
        const statusOrder: Record<string, number> = {
          New: 1,
          Assigned: 2,
          'In Progress': 3,
          Fixed: 4,
          Verified: 5,
          Closed: 6,
          Deferred: 7,
          Reopened: 8,
          Dismissed: 9
        };
        aVal = statusOrder[aVal] || 0;
        bVal = statusOrder[bVal] || 0;
      }

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal as string).toLowerCase();
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }

      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return sorted;
  }

  /**
   * Group issues by category
   */
  private groupIssuesByCategory(
    issues: ValidationIssueTracking[]
  ): Record<string, ValidationIssueTracking[]> {
    const grouped: Record<string, ValidationIssueTracking[]> = {};

    for (const issue of issues) {
      if (!grouped[issue.category]) {
        grouped[issue.category] = [];
      }
      grouped[issue.category].push(issue);
    }

    return grouped;
  }

  /**
   * Escape CSV values
   */
  private escapeCsv(value: string): string {
    if (!value) return '';

    // Quote and escape if contains comma, quote, or newline
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }

    return value;
  }

  /**
   * Escape HTML
   */
  private escapeHtml(text: string): string {
    if (!text) return '';

    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };

    return text.replace(/[&<>"']/g, char => map[char]);
  }
}
