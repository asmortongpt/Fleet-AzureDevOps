import { describe, it, expect, beforeEach } from 'vitest';
import { IssueTracker, IssueHistoryEntry } from '../IssueTracker';
import { ReportGenerator } from '../ReportGenerator';
import {
  ValidationIssueTracking,
  IssueAssignment,
  ImpactAssessment,
  ResolutionTracking,
  IssueMetrics
} from '../models/IssueModels';

/**
 * Comprehensive Issue Tracking Test Suite
 */
describe('IssueTracker', () => {
  let issueTracker: IssueTracker;

  beforeEach(() => {
    issueTracker = new IssueTracker();
  });

  describe('Issue Creation and Lifecycle', () => {
    it('should create a new issue with initial state', () => {
      const issue = issueTracker.createIssue({
        title: 'Text overflow in header',
        severity: 'critical',
        category: 'UI',
        description: 'Dashboard header text is overflowing',
        affectedComponent: 'DashboardHeader',
        detectedBy: 'VisualQAAgent'
      });

      expect(issue.id).toBeDefined();
      expect(issue.title).toBe('Text overflow in header');
      expect(issue.severity).toBe('critical');
      expect(issue.status).toBe('New');
      expect(issue.createdAt).toBeDefined();
      expect(issue.history).toHaveLength(1);
      expect(issue.history[0].action).toBe('created');
    });

    it('should transition issue through lifecycle states', () => {
      const issue = issueTracker.createIssue({
        title: 'Button styling issue',
        severity: 'high',
        category: 'UI',
        description: 'Button colors inconsistent',
        affectedComponent: 'PrimaryButton',
        detectedBy: 'VisualQAAgent'
      });

      const issueId = issue.id;

      // Assign issue
      issueTracker.assignIssue(issueId, 'user-123', 'john@example.com');
      let updated = issueTracker.getIssue(issueId)!;
      expect(updated.status).toBe('Assigned');
      expect(updated.assignedTo).toBe('user-123');

      // Start work
      issueTracker.updateIssueStatus(issueId, 'In Progress', 'user-123');
      updated = issueTracker.getIssue(issueId)!;
      expect(updated.status).toBe('In Progress');

      // Mark as fixed
      issueTracker.updateIssueStatus(issueId, 'Fixed', 'user-123', {
        fixDescription: 'Updated CSS styling'
      });
      updated = issueTracker.getIssue(issueId)!;
      expect(updated.status).toBe('Fixed');

      // Verify fix
      issueTracker.verifyFix(issueId, true, 'user-456', 'Fix verified in testing');
      updated = issueTracker.getIssue(issueId)!;
      expect(updated.status).toBe('Verified');

      // Close issue
      issueTracker.updateIssueStatus(issueId, 'Closed', 'user-123');
      updated = issueTracker.getIssue(issueId)!;
      expect(updated.status).toBe('Closed');
    });

    it('should allow deferring and reopening issues', () => {
      const issue = issueTracker.createIssue({
        title: 'Low priority styling',
        severity: 'low',
        category: 'UI',
        description: 'Minor visual inconsistency',
        affectedComponent: 'Badge',
        detectedBy: 'VisualQAAgent'
      });

      issueTracker.updateIssueStatus(issue.id, 'Deferred', null, {
        deferralReason: 'Lower priority, schedule for next sprint'
      });
      let updated = issueTracker.getIssue(issue.id)!;
      expect(updated.status).toBe('Deferred');

      issueTracker.reopenIssue(issue.id, 'user-123', 'Ready to work on this now');
      updated = issueTracker.getIssue(issue.id)!;
      expect(updated.status).toBe('Reopened');
    });
  });

  describe('Issue History Tracking', () => {
    it('should track all state changes in history', () => {
      const issue = issueTracker.createIssue({
        title: 'Responsive layout issue',
        severity: 'high',
        category: 'Layout',
        description: 'Layout breaks on mobile',
        affectedComponent: 'FleetOperationsHub',
        detectedBy: 'ResponsiveDesignAgent'
      });

      const initialHistoryLength = issue.history.length;

      issueTracker.addNote(issue.id, 'user-123', 'Initial investigation shows grid issue');
      let updated = issueTracker.getIssue(issue.id)!;
      expect(updated.history).toHaveLength(initialHistoryLength + 1);

      issueTracker.assignIssue(issue.id, 'user-456', 'jane@example.com');
      updated = issueTracker.getIssue(issue.id)!;
      expect(updated.history).toHaveLength(initialHistoryLength + 2);

      const history = issueTracker.getIssueHistory(issue.id);
      expect(history.length).toBeGreaterThan(0);
      expect(history.some(h => h.action === 'created')).toBe(true);
      expect(history.some(h => h.action === 'note_added')).toBe(true);
      expect(history.some(h => h.action === 'assigned')).toBe(true);
    });

    it('should include user information in history entries', () => {
      const issue = issueTracker.createIssue({
        title: 'Test issue',
        severity: 'medium',
        category: 'Testing',
        description: 'For user tracking test',
        affectedComponent: 'TestComponent',
        detectedBy: 'VisualQAAgent'
      });

      issueTracker.addNote(issue.id, 'user-123', 'This is a test note', {
        userName: 'John Doe',
        userEmail: 'john@example.com'
      });

      const history = issueTracker.getIssueHistory(issue.id);
      const noteEntry = history.find(h => h.action === 'note_added');
      expect(noteEntry?.userId).toBe('user-123');
      expect(noteEntry?.metadata?.userName).toBe('John Doe');
    });

    it('should track timestamps for all changes', async () => {
      const issue = issueTracker.createIssue({
        title: 'Timestamp test',
        severity: 'low',
        category: 'Testing',
        description: 'Test timestamp tracking',
        affectedComponent: 'TestComponent',
        detectedBy: 'VisualQAAgent'
      });

      const createdTime = issue.createdAt;
      await new Promise(resolve => setTimeout(resolve, 10));

      issueTracker.addNote(issue.id, 'user-123', 'Later note');
      const updated = issueTracker.getIssue(issue.id)!;

      expect(updated.updatedAt).toBeDefined();
      expect(updated.updatedAt > createdTime).toBe(true);
    });
  });

  describe('Issue Assignment', () => {
    it('should assign issue to team member', () => {
      const issue = issueTracker.createIssue({
        title: 'Bug to fix',
        severity: 'high',
        category: 'Bugs',
        description: 'Critical bug found',
        affectedComponent: 'VehicleMap',
        detectedBy: 'DataIntegrityAgent'
      });

      issueTracker.assignIssue(issue.id, 'user-456', 'bob@example.com');
      const updated = issueTracker.getIssue(issue.id)!;

      expect(updated.assignedTo).toBe('user-456');
      expect(updated.assignedToEmail).toBe('bob@example.com');
      expect(updated.status).toBe('Assigned');
    });

    it('should allow reassignment', () => {
      const issue = issueTracker.createIssue({
        title: 'Reassignment test',
        severity: 'medium',
        category: 'Testing',
        description: 'Test reassignment',
        affectedComponent: 'TestComponent',
        detectedBy: 'VisualQAAgent'
      });

      issueTracker.assignIssue(issue.id, 'user-123', 'user1@example.com');
      let updated = issueTracker.getIssue(issue.id)!;
      expect(updated.assignedTo).toBe('user-123');

      issueTracker.assignIssue(issue.id, 'user-789', 'user2@example.com', 'Transferred to more experienced team member');
      updated = issueTracker.getIssue(issue.id)!;
      expect(updated.assignedTo).toBe('user-789');

      const history = issueTracker.getIssueHistory(issue.id);
      const assignments = history.filter(h => h.action === 'assigned');
      expect(assignments.length).toBe(2);
    });

    it('should track assignment history with reasons', () => {
      const issue = issueTracker.createIssue({
        title: 'Assignment reason test',
        severity: 'critical',
        category: 'Testing',
        description: 'Test assignment reasons',
        affectedComponent: 'CriticalComponent',
        detectedBy: 'AccessibilityPerformanceAgent'
      });

      const reason = 'Specialist in this area';
      issueTracker.assignIssue(issue.id, 'expert-user', 'expert@example.com', reason);

      const history = issueTracker.getIssueHistory(issue.id);
      const assignment = history.find(h => h.action === 'assigned');
      expect(assignment?.metadata?.reason).toBe(reason);
    });
  });

  describe('Impact Assessment', () => {
    it('should track affected user flows', () => {
      const issue = issueTracker.createIssue({
        title: 'Navigation issue',
        severity: 'high',
        category: 'Navigation',
        description: 'Unable to navigate between hubs',
        affectedComponent: 'NavigationMenu',
        detectedBy: 'InteractionQualityAgent'
      });

      const impact: ImpactAssessment = {
        affectedUserFlows: [
          'FleetOperations > VehicleDetail',
          'ComplianceSafety > ViolationList'
        ],
        affectedPages: ['FleetOperationsHub', 'ComplianceSafetyHub'],
        userImpactLevel: 'high',
        estimatedUsersAffected: 150
      };

      issueTracker.setImpactAssessment(issue.id, impact);
      const updated = issueTracker.getIssue(issue.id)!;

      expect(updated.impactAssessment).toEqual(impact);
    });

    it('should calculate metrics based on impact', () => {
      const issue = issueTracker.createIssue({
        title: 'Critical data issue',
        severity: 'critical',
        category: 'Data',
        description: 'Data integrity problem',
        affectedComponent: 'DataStore',
        detectedBy: 'DataIntegrityAgent'
      });

      issueTracker.setImpactAssessment(issue.id, {
        affectedUserFlows: ['All read operations'],
        affectedPages: ['All pages'],
        userImpactLevel: 'critical',
        estimatedUsersAffected: 1000
      });

      const metrics = issueTracker.getIssueMetrics();
      expect(metrics.totalIssues).toBeGreaterThan(0);
      expect(metrics.issuesBySeverity.critical).toBeGreaterThan(0);
    });
  });

  describe('Resolution Tracking', () => {
    it('should record fix attempts and verification results', () => {
      const issue = issueTracker.createIssue({
        title: 'Fix tracking test',
        severity: 'medium',
        category: 'Testing',
        description: 'Test fix tracking',
        affectedComponent: 'TestComponent',
        detectedBy: 'VisualQAAgent'
      });

      issueTracker.updateIssueStatus(issue.id, 'Fixed', 'user-123', {
        fixDescription: 'Updated CSS classes'
      });

      issueTracker.verifyFix(issue.id, false, 'user-456', 'Issue still present in testing');

      let updated = issueTracker.getIssue(issue.id)!;
      expect(updated.status).toBe('Fixed');
      expect(updated.resolutionTracking).toBeDefined();
      expect(updated.resolutionTracking?.verificationAttempts).toHaveLength(1);
      expect(updated.resolutionTracking?.verificationAttempts[0].verified).toBe(false);

      issueTracker.verifyFix(issue.id, true, 'user-456', 'Fix verified successfully');
      updated = issueTracker.getIssue(issue.id)!;
      expect(updated.status).toBe('Verified');
      expect(updated.resolutionTracking?.verificationAttempts).toHaveLength(2);
    });

    it('should calculate resolution time', () => {
      const issue = issueTracker.createIssue({
        title: 'Resolution time test',
        severity: 'low',
        category: 'Testing',
        description: 'Test resolution time',
        affectedComponent: 'TestComponent',
        detectedBy: 'TypographyAgent'
      });

      issueTracker.assignIssue(issue.id, 'user-123', 'user@example.com');

      // Simulate some time passing
      const beforeFix = Date.now();
      issueTracker.updateIssueStatus(issue.id, 'Fixed', 'user-123', {
        fixDescription: 'Simple fix'
      });
      const afterFix = Date.now();

      const updated = issueTracker.getIssue(issue.id)!;
      expect(updated.resolutionTime).toBeDefined();
      expect(updated.resolutionTime! >= beforeFix - issue.createdAt.getTime()).toBe(true);
    });
  });

  describe('Searching and Filtering', () => {
    beforeEach(() => {
      // Create various issues
      issueTracker.createIssue({
        title: 'Critical UI bug',
        severity: 'critical',
        category: 'UI',
        description: 'Critical styling issue',
        affectedComponent: 'Header',
        detectedBy: 'VisualQAAgent'
      });

      issueTracker.createIssue({
        title: 'High priority layout',
        severity: 'high',
        category: 'Layout',
        description: 'Layout problem on mobile',
        affectedComponent: 'MainContent',
        detectedBy: 'ResponsiveDesignAgent'
      });

      issueTracker.createIssue({
        title: 'Medium priority feature',
        severity: 'medium',
        category: 'Feature',
        description: 'Feature not working as expected',
        affectedComponent: 'FeatureX',
        detectedBy: 'InteractionQualityAgent'
      });
    });

    it('should filter issues by severity', () => {
      const critical = issueTracker.searchIssues({ severity: 'critical' });
      expect(critical.length).toBeGreaterThan(0);
      expect(critical.every(i => i.severity === 'critical')).toBe(true);

      const high = issueTracker.searchIssues({ severity: 'high' });
      expect(high.length).toBeGreaterThan(0);
      expect(high.every(i => i.severity === 'high')).toBe(true);
    });

    it('should filter issues by status', () => {
      const newIssues = issueTracker.searchIssues({ status: 'New' });
      expect(newIssues.length).toBeGreaterThan(0);
      expect(newIssues.every(i => i.status === 'New')).toBe(true);
    });

    it('should filter issues by category', () => {
      const uiIssues = issueTracker.searchIssues({ category: 'UI' });
      expect(uiIssues.length).toBeGreaterThan(0);
      expect(uiIssues.every(i => i.category === 'UI')).toBe(true);
    });

    it('should search issues by text', () => {
      const results = issueTracker.searchIssues({ text: 'layout' });
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(i => i.title.toLowerCase().includes('layout'))).toBe(true);
    });

    it('should support multiple filters', () => {
      const results = issueTracker.searchIssues({
        severity: 'high',
        category: 'Layout'
      });
      expect(results.every(i => i.severity === 'high' && i.category === 'Layout')).toBe(true);
    });
  });

  describe('Metrics and Reporting', () => {
    beforeEach(() => {
      for (let i = 0; i < 3; i++) {
        issueTracker.createIssue({
          title: `Critical issue ${i}`,
          severity: 'critical',
          category: 'Critical',
          description: `Critical severity issue ${i}`,
          affectedComponent: `Component${i}`,
          detectedBy: 'VisualQAAgent'
        });
      }

      for (let i = 0; i < 5; i++) {
        issueTracker.createIssue({
          title: `High issue ${i}`,
          severity: 'high',
          category: 'High',
          description: `High severity issue ${i}`,
          affectedComponent: `Component${i}`,
          detectedBy: 'ResponsiveDesignAgent'
        });
      }
    });

    it('should calculate issue metrics', () => {
      const metrics = issueTracker.getIssueMetrics();

      expect(metrics.totalIssues).toBe(8);
      expect(metrics.issuesBySeverity.critical).toBe(3);
      expect(metrics.issuesBySeverity.high).toBe(5);
      expect(metrics.averageResolutionTime).toBeDefined();
      expect(metrics.falsePositiveRate).toBeDefined();
    });

    it('should track trending data', () => {
      const trending = issueTracker.getTrendingMetrics();

      expect(trending).toBeDefined();
      expect(trending.issuesCreatedToday).toBeDefined();
      expect(trending.issuesClosedToday).toBeDefined();
      expect(trending.criticalIssuesCount).toBeGreaterThan(0);
    });

    it('should calculate false positive rate', () => {
      const issue1 = issueTracker.createIssue({
        title: 'Potential false positive',
        severity: 'low',
        category: 'Testing',
        description: 'This might be a false positive',
        affectedComponent: 'TestComponent',
        detectedBy: 'VisualQAAgent'
      });

      issueTracker.updateIssueStatus(issue1.id, 'Dismissed', null, {
        dismissalReason: 'False positive - not a real issue'
      });

      const metrics = issueTracker.getIssueMetrics();
      expect(metrics.falsePositiveRate).toBeGreaterThan(0);
    });
  });
});

/**
 * Report Generator Test Suite
 */
describe('ReportGenerator', () => {
  let issueTracker: IssueTracker;
  let reportGenerator: ReportGenerator;

  beforeEach(() => {
    issueTracker = new IssueTracker();
    reportGenerator = new ReportGenerator(issueTracker);

    // Create sample issues
    const issue1 = issueTracker.createIssue({
      title: 'Critical styling issue',
      severity: 'critical',
      category: 'UI',
      description: 'Text overflow in dashboard',
      affectedComponent: 'DashboardHeader',
      detectedBy: 'VisualQAAgent'
    });

    const issue2 = issueTracker.createIssue({
      title: 'Responsive layout broken',
      severity: 'high',
      category: 'Layout',
      description: 'Layout breaks on mobile',
      affectedComponent: 'FleetOperationsHub',
      detectedBy: 'ResponsiveDesignAgent'
    });

    // Assign and work on issues
    issueTracker.assignIssue(issue1.id, 'user-123', 'john@example.com');
    issueTracker.updateIssueStatus(issue1.id, 'In Progress', 'user-123');

    issueTracker.assignIssue(issue2.id, 'user-456', 'jane@example.com');
  });

  describe('JSON Export', () => {
    it('should generate valid JSON export', () => {
      const json = reportGenerator.generateReport('json');

      expect(json).toBeDefined();
      const parsed = JSON.parse(json);

      expect(parsed.issues).toBeDefined();
      expect(Array.isArray(parsed.issues)).toBe(true);
      expect(parsed.metadata).toBeDefined();
      expect(parsed.metadata.generatedAt).toBeDefined();
    });

    it('should include all issue data in JSON', () => {
      const json = reportGenerator.generateReport('json');
      const parsed = JSON.parse(json);

      expect(parsed.issues.length).toBeGreaterThan(0);
      const firstIssue = parsed.issues[0];
      expect(firstIssue.id).toBeDefined();
      expect(firstIssue.title).toBeDefined();
      expect(firstIssue.severity).toBeDefined();
      expect(firstIssue.status).toBeDefined();
    });
  });

  describe('CSV Export', () => {
    it('should generate valid CSV export', () => {
      const csv = reportGenerator.generateReport('csv');

      expect(csv).toBeDefined();
      expect(typeof csv).toBe('string');
      expect(csv.includes('Title')).toBe(true);
      expect(csv.includes('Severity')).toBe(true);
    });

    it('should include header row in CSV', () => {
      const csv = reportGenerator.generateReport('csv');
      const lines = csv.split('\n');

      expect(lines.length).toBeGreaterThan(1);
      expect(lines[0]).toContain('ID');
      expect(lines[0]).toContain('Title');
    });

    it('should handle special characters in CSV', () => {
      issueTracker.createIssue({
        title: 'Issue with "quotes" and, commas',
        severity: 'medium',
        category: 'Testing',
        description: 'Description with special chars: "test", value',
        affectedComponent: 'TestComponent',
        detectedBy: 'VisualQAAgent'
      });

      const csv = reportGenerator.generateReport('csv');
      expect(csv).toBeDefined();
      expect(csv.includes('quotes')).toBe(true);
    });
  });

  describe('HTML Export', () => {
    it('should generate valid HTML export', () => {
      const html = reportGenerator.generateReport('html');

      expect(html).toBeDefined();
      expect(html.includes('<html')).toBe(true);
      expect(html.includes('</html>')).toBe(true);
      expect(html.includes('<!DOCTYPE html>')).toBe(true);
    });

    it('should include styling in HTML', () => {
      const html = reportGenerator.generateReport('html');

      expect(html.includes('<style')).toBe(true);
      expect(html.includes('</style>')).toBe(true);
      expect(html.includes('background-color')).toBe(true);
    });

    it('should include all issue details in HTML', () => {
      const html = reportGenerator.generateReport('html');

      expect(html.includes('Critical styling issue')).toBe(true);
      expect(html.includes('Responsive layout broken')).toBe(true);
    });
  });

  describe('PDF Export', () => {
    it('should generate PDF buffer', async () => {
      const pdf = await reportGenerator.generateReportAsync('pdf');

      expect(pdf).toBeDefined();
      expect(pdf instanceof Buffer).toBe(true);
      expect(pdf.length).toBeGreaterThan(0);
    });

    it('should create valid PDF structure', async () => {
      const pdf = await reportGenerator.generateReportAsync('pdf');

      // PDF files start with %PDF
      const header = pdf.toString('utf8', 0, 4);
      expect(header).toBe('%PDF');
    });
  });

  describe('Report Summary', () => {
    it('should generate summary report', () => {
      const summary = reportGenerator.generateSummary();

      expect(summary).toBeDefined();
      expect(summary.totalIssues).toBeGreaterThan(0);
      expect(summary.issuesBySeverity).toBeDefined();
      expect(summary.generatedAt).toBeDefined();
    });

    it('should include metrics in summary', () => {
      const summary = reportGenerator.generateSummary();

      expect(summary.criticalCount).toBeDefined();
      expect(summary.highCount).toBeDefined();
      expect(summary.mediumCount).toBeDefined();
      expect(summary.lowCount).toBeDefined();
    });
  });

  describe('Report Filtering', () => {
    it('should filter issues in report by severity', () => {
      const json = reportGenerator.generateReport('json', { severity: 'critical' });
      const parsed = JSON.parse(json);

      expect(parsed.issues.every((i: any) => i.severity === 'critical')).toBe(true);
    });

    it('should filter issues in report by status', () => {
      const json = reportGenerator.generateReport('json', { status: 'New' });
      const parsed = JSON.parse(json);

      expect(parsed.issues.every((i: any) => i.status === 'New')).toBe(true);
    });
  });
});
