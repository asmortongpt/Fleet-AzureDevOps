import logger from '../config/logger';
import {
  ValidationIssue,
  DashboardSummary,
  QualityLoopStage,
  IssueSeverity,
  IssueStatus,
  DASHBOARD_CONFIG,
  IssueFilterCriteria,
  AgentName,
  AGENT_NAMES,
  HtmlRenderOptions
} from './models/DashboardModels';

/**
 * Dashboard Service
 * Manages quality loop tracking, issue storage, scoring, and HTML rendering
 */
export class DashboardService {
  private issues: Map<string, ValidationIssue> = new Map();
  private issueSequence: number = 0;
  private issueTracker?: any;

  /**
   * Constructor optionally accepts IssueTracker for integration
   * If not provided, DashboardService uses internal issue storage
   */
  constructor(issueTracker?: any) {
    this.issueTracker = issueTracker;
  }

  /**
   * Add a new issue to the dashboard
   * @param issue Issue to add
   * @throws Error if issue is invalid
   */
  addIssue(issue: ValidationIssue): void {
    if (!issue || !issue.id) {
      throw new Error('Issue must have a valid ID');
    }

    if (!AGENT_NAMES.includes(issue.agent as AgentName)) {
      throw new Error(`Invalid agent: ${issue.agent}`);
    }

    if (!['critical', 'high', 'medium', 'low'].includes(issue.severity)) {
      throw new Error(`Invalid severity: ${issue.severity}`);
    }

    this.issues.set(issue.id, {
      ...issue,
      updatedAt: new Date().toISOString()
    });

    logger.debug('Issue added to dashboard', { issueId: issue.id, agent: issue.agent });
  }

  /**
   * Get all issues, optionally filtered
   * @param criteria Optional filter criteria
   * @returns Array of matching issues
   */
  getIssues(criteria?: IssueFilterCriteria): ValidationIssue[] {
    let results = Array.from(this.issues.values());

    if (criteria?.severity) {
      results = results.filter(i => i.severity === criteria.severity);
    }

    if (criteria?.agent) {
      results = results.filter(i => i.agent === criteria.agent);
    }

    if (criteria?.loopStage) {
      results = results.filter(i => i.loopStage === criteria.loopStage);
    }

    if (criteria?.status) {
      results = results.filter(i => i.status === criteria.status);
    }

    if (criteria?.affectedComponent) {
      results = results.filter(i => i.affectedComponent === criteria.affectedComponent);
    }

    if (criteria?.createdAfter) {
      results = results.filter(i => new Date(i.createdAt) >= new Date(criteria.createdAfter!));
    }

    if (criteria?.createdBefore) {
      results = results.filter(i => new Date(i.createdAt) <= new Date(criteria.createdBefore!));
    }

    return results;
  }

  /**
   * Get a specific issue by ID
   * @param issueId Issue ID
   * @returns Issue or undefined if not found
   */
  getIssueById(issueId: string): ValidationIssue | undefined {
    return this.issues.get(issueId);
  }

  /**
   * Get issues filtered by severity
   * @param severity Severity level
   * @returns Array of issues with that severity
   */
  getIssuesBySeverity(severity: IssueSeverity): ValidationIssue[] {
    return this.getIssues({ severity });
  }

  /**
   * Get issues filtered by agent
   * @param agent Agent name
   * @returns Array of issues from that agent
   */
  getIssuesByAgent(agent: string): ValidationIssue[] {
    return this.getIssues({ agent: agent as AgentName });
  }

  /**
   * Get issues filtered by loop stage
   * @param loopStage Quality loop stage
   * @returns Array of issues at that stage
   */
  getIssuesByLoopStage(loopStage: QualityLoopStage): ValidationIssue[] {
    return this.getIssues({ loopStage });
  }

  /**
   * Update issue status in quality loop
   * @param issueId Issue ID
   * @param newStage New stage
   * @throws Error if issue not found or invalid transition
   */
  updateIssueStatus(issueId: string, newStage: QualityLoopStage): void {
    const issue = this.issues.get(issueId);
    if (!issue) {
      throw new Error(`Issue not found: ${issueId}`);
    }

    // Validate stage transition
    const stageIndex = DASHBOARD_CONFIG.QUALITY_LOOP_STAGES.indexOf(newStage);
    if (stageIndex === -1) {
      throw new Error(`Invalid stage: ${newStage}`);
    }

    issue.loopStage = newStage;
    issue.status = newStage;
    issue.updatedAt = new Date().toISOString();

    logger.debug('Issue status updated', { issueId, newStage });
  }

  /**
   * Approve an issue
   * @param issueId Issue ID
   * @throws Error if issue not found
   */
  approveIssue(issueId: string): void {
    const issue = this.issues.get(issueId);
    if (!issue) {
      throw new Error(`Issue not found: ${issueId}`);
    }

    issue.status = 'Approved';
    issue.loopStage = 'Approved';
    issue.updatedAt = new Date().toISOString();

    logger.debug('Issue approved', { issueId });
  }

  /**
   * Dismiss an issue as false positive
   * @param issueId Issue ID
   * @param reason Reason for dismissal
   * @throws Error if issue not found
   */
  dismissIssue(issueId: string, reason: string): void {
    if (!reason) {
      throw new Error('Dismissal reason is required');
    }

    const issue = this.issues.get(issueId);
    if (!issue) {
      throw new Error(`Issue not found: ${issueId}`);
    }

    issue.status = 'Dismissed';
    issue.dismissalReason = reason;
    issue.updatedAt = new Date().toISOString();

    logger.debug('Issue dismissed', { issueId, reason });
  }

  /**
   * Calculate overall quality score (0-100)
   * Based on active issues weighted by severity
   * Dismissed and Approved issues do not count against score
   * @returns Quality score
   */
  calculateQualityScore(): number {
    const activeIssues = this.getIssues().filter(
      i => !['Approved', 'Dismissed'].includes(i.status)
    );

    let penalties = 0;

    for (const issue of activeIssues) {
      const weight = DASHBOARD_CONFIG.SEVERITY_WEIGHTS[issue.severity];
      penalties += weight;
    }

    const score = Math.max(
      DASHBOARD_CONFIG.MIN_QUALITY_SCORE,
      DASHBOARD_CONFIG.MAX_QUALITY_SCORE - penalties
    );

    logger.debug('Quality score calculated', {
      score,
      activeIssues: activeIssues.length,
      penalties
    });

    return score;
  }

  /**
   * Get dashboard summary
   * @returns Summary of all issues and metrics
   */
  getDashboardSummary(): DashboardSummary {
    const allIssues = this.getIssues();
    const activeIssues = allIssues.filter(i => !['Approved', 'Dismissed'].includes(i.status));

    const issuesBySeverity: Record<IssueSeverity, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };

    const issuesByAgent: Record<string, number> = {};
    const issuesByLoopStage: Record<QualityLoopStage, number> = {
      Detected: 0,
      Diagnosed: 0,
      Fixed: 0,
      Verified: 0,
      Approved: 0
    };

    // Count issues by severity
    for (const severity of Object.keys(issuesBySeverity) as IssueSeverity[]) {
      issuesBySeverity[severity] = allIssues.filter(i => i.severity === severity).length;
    }

    // Count issues by agent
    for (const agent of AGENT_NAMES) {
      const count = allIssues.filter(i => i.agent === agent).length;
      if (count > 0) {
        issuesByAgent[agent] = count;
      }
    }

    // Count issues by loop stage
    for (const stage of DASHBOARD_CONFIG.QUALITY_LOOP_STAGES) {
      issuesByLoopStage[stage] = allIssues.filter(i => i.loopStage === stage).length;
    }

    // Find the most recently updated issue (not first in array)
    const lastUpdatedIssue = allIssues.length > 0
      ? allIssues.reduce((latest, current) => {
          const latestTime = new Date(latest.updatedAt).getTime();
          const currentTime = new Date(current.updatedAt).getTime();
          return currentTime > latestTime ? current : latest;
        })
      : null;

    const summary: DashboardSummary = {
      totalIssues: allIssues.length,
      qualityScore: this.calculateQualityScore(),
      issuesBySeverity,
      issuesByAgent,
      issuesByLoopStage,
      lastUpdated: lastUpdatedIssue ? lastUpdatedIssue.updatedAt : new Date().toISOString(),
      generatedAt: new Date().toISOString()
    };

    logger.debug('Dashboard summary generated', {
      totalIssues: summary.totalIssues,
      qualityScore: summary.qualityScore
    });

    return summary;
  }

  /**
   * Generate HTML dashboard view
   * @param options Optional rendering options
   * @returns HTML string
   */
  generateHtmlDashboard(options?: Partial<HtmlRenderOptions>): string {
    const opts: HtmlRenderOptions = {
      includeAnnotations: true,
      includeDiagnostics: true,
      includeFixes: true,
      sortBySeverity: true,
      groupByAgent: true,
      theme: 'dark',
      cssInline: true,
      ...options
    };

    const summary = this.getDashboardSummary();
    const issues = opts.sortBySeverity
      ? this.getIssues().sort((a, b) => {
          const severityOrder: Record<IssueSeverity, number> = {
            critical: 4,
            high: 3,
            medium: 2,
            low: 1
          };
          return severityOrder[b.severity] - severityOrder[a.severity];
        })
      : this.getIssues();

    let html = this.getHtmlHead(opts);
    html += '<body>';
    html += this.getHtmlHeader(summary);
    html += this.getHtmlSummary(summary);

    if (opts.groupByAgent) {
      html += this.getHtmlIssuesByAgent(issues, opts);
    } else {
      html += this.getHtmlIssuesList(issues, opts);
    }

    html += '</body></html>';

    return html;
  }

  /**
   * Get HTML head section with styles
   */
  private getHtmlHead(opts: HtmlRenderOptions): string {
    const isDark = opts.theme === 'dark';
    const bgColor = isDark ? '#1a1a1a' : '#ffffff';
    const textColor = isDark ? '#ffffff' : '#000000';
    const borderColor = isDark ? '#333333' : '#e0e0e0';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Quality Loop Dashboard</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: ${bgColor};
      color: ${textColor};
      line-height: 1.6;
    }

    .container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 20px;
    }

    header {
      border-bottom: 1px solid ${borderColor};
      padding-bottom: 20px;
      margin-bottom: 30px;
    }

    h1 {
      font-size: 32px;
      margin-bottom: 10px;
    }

    .score-badge {
      display: inline-block;
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 24px;
      font-weight: bold;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      margin-bottom: 20px;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }

    .summary-card {
      padding: 20px;
      border: 1px solid ${borderColor};
      border-radius: 8px;
      background-color: ${isDark ? '#242424' : '#f5f5f5'};
    }

    .summary-card h3 {
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 10px;
      opacity: 0.7;
    }

    .summary-card .value {
      font-size: 32px;
      font-weight: bold;
    }

    .issues-section {
      margin-bottom: 40px;
    }

    .agent-group {
      margin-bottom: 30px;
    }

    .agent-title {
      font-size: 20px;
      font-weight: bold;
      padding: 15px;
      background-color: ${isDark ? '#242424' : '#f0f0f0'};
      border-radius: 8px;
      margin-bottom: 15px;
      border-left: 4px solid #667eea;
    }

    .issue-card {
      border: 1px solid ${borderColor};
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
      background-color: ${isDark ? '#242424' : '#f9f9f9'};
    }

    .issue-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 15px;
    }

    .issue-title {
      font-size: 18px;
      font-weight: bold;
      flex: 1;
    }

    .severity-badge {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .severity-critical {
      background-color: #dc3545;
      color: white;
    }

    .severity-high {
      background-color: #fd7e14;
      color: white;
    }

    .severity-medium {
      background-color: #ffc107;
      color: #000;
    }

    .severity-low {
      background-color: #17a2b8;
      color: white;
    }

    .loop-badge {
      display: inline-block;
      margin-left: 10px;
      padding: 6px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
      background-color: #667eea;
      color: white;
    }

    .issue-detail {
      margin-bottom: 15px;
    }

    .issue-detail-label {
      font-weight: bold;
      margin-bottom: 5px;
      opacity: 0.8;
    }

    .issue-detail-content {
      margin-left: 15px;
      padding: 10px;
      background-color: ${isDark ? '#1a1a1a' : '#ffffff'};
      border-left: 2px solid #667eea;
    }

    .screenshot {
      margin: 20px 0;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid ${borderColor};
    }

    .screenshot img {
      max-width: 100%;
      height: auto;
      display: block;
    }

    .diagnostic-info {
      padding: 15px;
      background-color: ${isDark ? '#1a1a1a' : '#ffffff'};
      border-left: 4px solid #ffc107;
      margin: 15px 0;
    }

    .suggested-fix {
      padding: 15px;
      background-color: ${isDark ? '#1a1a1a' : '#ffffff'};
      border-left: 4px solid #28a745;
      margin: 15px 0;
    }

    .affected-component {
      display: inline-block;
      padding: 4px 8px;
      background-color: #667eea;
      color: white;
      border-radius: 4px;
      font-size: 12px;
      margin-right: 10px;
    }

    footer {
      border-top: 1px solid ${borderColor};
      padding-top: 20px;
      margin-top: 40px;
      opacity: 0.7;
      font-size: 12px;
    }
  </style>
</head>`;
  }

  /**
   * Get HTML header with title and score
   */
  private getHtmlHeader(summary: DashboardSummary): string {
    const scoreColor = summary.qualityScore >= 80 ? '#28a745' :
                       summary.qualityScore >= 60 ? '#ffc107' : '#dc3545';

    return `<div class="container">
  <header>
    <h1>Quality Loop Dashboard</h1>
    <div class="score-badge" style="background: linear-gradient(135deg, ${scoreColor} 0%, ${scoreColor}cc 100%)">
      Score: ${summary.qualityScore}/100
    </div>
  </header>`;
  }

  /**
   * Get HTML summary section
   */
  private getHtmlSummary(summary: DashboardSummary): string {
    return `<div class="summary-grid">
    <div class="summary-card">
      <h3>Total Issues</h3>
      <div class="value">${summary.totalIssues}</div>
    </div>
    <div class="summary-card">
      <h3>Critical</h3>
      <div class="value" style="color: #dc3545">${summary.issuesBySeverity.critical}</div>
    </div>
    <div class="summary-card">
      <h3>High</h3>
      <div class="value" style="color: #fd7e14">${summary.issuesBySeverity.high}</div>
    </div>
    <div class="summary-card">
      <h3>Medium</h3>
      <div class="value" style="color: #ffc107">${summary.issuesBySeverity.medium}</div>
    </div>
    <div class="summary-card">
      <h3>Low</h3>
      <div class="value" style="color: #17a2b8">${summary.issuesBySeverity.low}</div>
    </div>
    <div class="summary-card">
      <h3>Approved</h3>
      <div class="value" style="color: #28a745">${summary.issuesByLoopStage.Approved}</div>
    </div>
  </div>`;
  }

  /**
   * Get HTML issues list grouped by agent
   */
  private getHtmlIssuesByAgent(issues: ValidationIssue[], opts: HtmlRenderOptions): string {
    const groupedByAgent = new Map<string, ValidationIssue[]>();

    for (const issue of issues) {
      if (!groupedByAgent.has(issue.agent)) {
        groupedByAgent.set(issue.agent, []);
      }
      groupedByAgent.get(issue.agent)!.push(issue);
    }

    let html = '<div class="issues-section">';

    for (const [agent, agentIssues] of groupedByAgent) {
      html += `<div class="agent-group">
        <div class="agent-title">${agent} (${agentIssues.length})</div>`;

      for (const issue of agentIssues) {
        html += this.getHtmlIssueCard(issue, opts);
      }

      html += '</div>';
    }

    html += '</div>';
    return html;
  }

  /**
   * Get HTML issues list
   */
  private getHtmlIssuesList(issues: ValidationIssue[], opts: HtmlRenderOptions): string {
    let html = '<div class="issues-section">';

    for (const issue of issues) {
      html += this.getHtmlIssueCard(issue, opts);
    }

    html += '</div>';
    return html;
  }

  /**
   * Get HTML for single issue card
   */
  private getHtmlIssueCard(issue: ValidationIssue, opts: HtmlRenderOptions): string {
    const componentBadge = issue.affectedComponent
      ? `<span class="affected-component">${issue.affectedComponent}</span>`
      : '';

    let html = `<div class="issue-card">
      <div class="issue-header">
        <div>
          <div class="issue-title">${this.escapeHtml(issue.description)}</div>
          <div style="margin-top: 8px">
            ${componentBadge}
            <span class="severity-badge severity-${issue.severity}">${issue.severity}</span>
            <span class="loop-badge">${issue.loopStage}</span>
          </div>
        </div>
      </div>`;

    if (opts.includeDiagnostics && issue.diagnosticInfo) {
      html += `<div class="diagnostic-info">
        <strong>Diagnostic Info:</strong> ${this.escapeHtml(issue.diagnosticInfo)}
      </div>`;
    }

    if (opts.includeFixes && issue.suggestedFix) {
      html += `<div class="suggested-fix">
        <strong>Suggested Fix:</strong> ${this.escapeHtml(issue.suggestedFix)}
      </div>`;
    }

    if (opts.includeAnnotations && issue.annotatedScreenshot) {
      html += `<div class="screenshot">
        <img src="${this.escapeHtml(issue.annotatedScreenshot)}" alt="Annotated screenshot" />
      </div>`;
    }

    html += '</div>';
    return html;
  }

  /**
   * Escape HTML special characters
   */
  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }
}
