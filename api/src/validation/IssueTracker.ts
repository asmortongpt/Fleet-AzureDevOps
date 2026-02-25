import { logger } from '../lib/logger';
import {
  ValidationIssueTracking,
  IssueStatus,
  IssueSeverity,
  IssueCategory,
  IssueHistoryEntry,
  ImpactAssessment,
  ResolutionTracking,
  VerificationAttempt,
  IssueMetrics,
  TrendingMetrics,
  IssueSearchCriteria,
  CreateIssueRequest
} from './models/IssueModels';

// Re-export IssueHistoryEntry for convenience
export type { IssueHistoryEntry };

/**
 * Issue Tracker
 * Manages complete lifecycle of validation issues with history tracking,
 * assignment workflow, impact assessment, and resolution tracking
 */
export class IssueTracker {
  private issues: Map<string, ValidationIssueTracking> = new Map();
  private issueSequence: number = 0;

  /**
   * Create a new issue
   */
  createIssue(request: CreateIssueRequest): ValidationIssueTracking {
    const issueId = `ISSUE-${++this.issueSequence}`;
    const now = new Date();

    const issue: ValidationIssueTracking = {
      id: issueId,
      title: request.title,
      description: request.description,
      severity: request.severity,
      category: request.category,
      status: 'New',
      affectedComponent: request.affectedComponent,
      detectedBy: request.detectedBy,
      createdAt: now,
      updatedAt: now,
      notes: [],
      history: [
        {
          timestamp: now,
          action: 'created',
          description: 'Issue created',
          metadata: {
            severity: request.severity,
            category: request.category
          }
        }
      ],
      impactAssessment: request.impactAssessment
    };

    this.issues.set(issueId, issue);
    logger.debug('Issue created', { issueId, severity: request.severity });

    return issue;
  }

  /**
   * Get issue by ID
   */
  getIssue(issueId: string): ValidationIssueTracking | undefined {
    return this.issues.get(issueId);
  }

  /**
   * Get all issues
   */
  getAllIssues(): ValidationIssueTracking[] {
    return Array.from(this.issues.values());
  }

  /**
   * Update issue status
   */
  updateIssueStatus(
    issueId: string,
    newStatus: IssueStatus,
    userId: string | null,
    metadata?: Record<string, any>
  ): void {
    const issue = this.getIssue(issueId);
    if (!issue) {
      throw new Error(`Issue not found: ${issueId}`);
    }

    const previousStatus = issue.status;
    issue.status = newStatus;
    issue.updatedAt = new Date();

    // Initialize resolution tracking if transitioning to Fixed
    if (newStatus === 'Fixed') {
      if (!issue.resolutionTracking) {
        issue.resolutionTracking = {
          fixedAt: new Date(),
          verificationAttempts: [],
          fixDescription: metadata?.fixDescription
        };
      } else {
        issue.resolutionTracking.fixedAt = new Date();
        if (metadata?.fixDescription) {
          issue.resolutionTracking.fixDescription = metadata.fixDescription;
        }
      }
      // Set resolution time when Fixed
      issue.resolutionTime = Date.now() - issue.createdAt.getTime();
    }

    // Calculate resolution time when transitioning to Verified or Closed (if not already set)
    if ((newStatus === 'Verified' || newStatus === 'Closed') && !issue.resolutionTime) {
      issue.resolutionTime = Date.now() - issue.createdAt.getTime();
    }

    // Add history entry
    this.addHistoryEntry(issue, {
      action: 'status_changed',
      description: `Status changed from ${previousStatus} to ${newStatus}`,
      userId: userId || undefined,
      metadata
    });

    logger.debug('Issue status updated', { issueId, from: previousStatus, to: newStatus });
  }

  /**
   * Assign issue to team member
   */
  assignIssue(
    issueId: string,
    userId: string,
    userEmail: string,
    reason?: string,
    userName?: string
  ): void {
    const issue = this.getIssue(issueId);
    if (!issue) {
      throw new Error(`Issue not found: ${issueId}`);
    }

    const previousAssignee = issue.assignedTo;
    issue.assignedTo = userId;
    issue.assignedToEmail = userEmail;
    issue.assignment = {
      assignedTo: userId,
      assignedToEmail: userEmail,
      assignedToName: userName,
      assignedAt: new Date(),
      reason
    };

    if (issue.status === 'New') {
      issue.status = 'Assigned';
    }

    issue.updatedAt = new Date();

    this.addHistoryEntry(issue, {
      action: 'assigned',
      description: `Assigned to ${userName || userId}`,
      userId,
      userName,
      userEmail,
      metadata: { reason, previousAssignee }
    });

    logger.debug('Issue assigned', { issueId, assignedTo: userId, reason });
  }

  /**
   * Add note to issue
   */
  addNote(
    issueId: string,
    userId: string,
    noteText: string,
    metadata?: Record<string, any>
  ): void {
    const issue = this.getIssue(issueId);
    if (!issue) {
      throw new Error(`Issue not found: ${issueId}`);
    }

    issue.notes.push(noteText);
    issue.updatedAt = new Date();

    this.addHistoryEntry(issue, {
      action: 'note_added',
      description: noteText,
      userId,
      metadata
    });

    logger.debug('Note added to issue', { issueId, userId });
  }

  /**
   * Verify fix
   */
  verifyFix(issueId: string, verified: boolean, userId: string, notes: string): void {
    const issue = this.getIssue(issueId);
    if (!issue) {
      throw new Error(`Issue not found: ${issueId}`);
    }

    if (!issue.resolutionTracking) {
      issue.resolutionTracking = {
        verificationAttempts: []
      };
    }

    const attempt: VerificationAttempt = {
      verified,
      verifiedBy: userId,
      verifiedAt: new Date(),
      notes
    };

    issue.resolutionTracking.verificationAttempts.push(attempt);

    if (verified) {
      issue.status = 'Verified';
      if (issue.resolutionTracking.fixedAt) {
        issue.resolutionTime = Date.now() - issue.createdAt.getTime();
      }
    }

    issue.updatedAt = new Date();

    this.addHistoryEntry(issue, {
      action: 'verified',
      description: `Fix ${verified ? 'verified' : 'verification failed'}`,
      userId,
      metadata: { verified, notes }
    });

    logger.debug('Fix verified', { issueId, verified, userId });
  }

  /**
   * Get issue history
   */
  getIssueHistory(issueId: string): IssueHistoryEntry[] {
    const issue = this.getIssue(issueId);
    if (!issue) {
      return [];
    }
    return [...issue.history];
  }

  /**
   * Set impact assessment
   */
  setImpactAssessment(issueId: string, impact: ImpactAssessment): void {
    const issue = this.getIssue(issueId);
    if (!issue) {
      throw new Error(`Issue not found: ${issueId}`);
    }

    issue.impactAssessment = impact;
    issue.updatedAt = new Date();

    logger.debug('Impact assessment set', { issueId, affectedUsers: impact.estimatedUsersAffected });
  }

  /**
   * Reopen issue
   */
  reopenIssue(issueId: string, userId: string, reason?: string): void {
    const issue = this.getIssue(issueId);
    if (!issue) {
      throw new Error(`Issue not found: ${issueId}`);
    }

    issue.status = 'Reopened';
    issue.updatedAt = new Date();

    this.addHistoryEntry(issue, {
      action: 'reopened',
      description: `Issue reopened: ${reason || 'No reason provided'}`,
      userId,
      metadata: { reason }
    });

    logger.debug('Issue reopened', { issueId, userId });
  }

  /**
   * Search and filter issues
   */
  searchIssues(criteria: IssueSearchCriteria): ValidationIssueTracking[] {
    let results = this.getAllIssues();

    if (criteria.severity) {
      results = results.filter(i => i.severity === criteria.severity);
    }

    if (criteria.status) {
      results = results.filter(i => i.status === criteria.status);
    }

    if (criteria.category) {
      results = results.filter(i => i.category === criteria.category);
    }

    if (criteria.assignedTo) {
      results = results.filter(i => i.assignedTo === criteria.assignedTo);
    }

    if (criteria.affectedComponent) {
      results = results.filter(i => i.affectedComponent === criteria.affectedComponent);
    }

    if (criteria.text) {
      const searchText = criteria.text.toLowerCase();
      results = results.filter(
        i =>
          i.title.toLowerCase().includes(searchText) ||
          i.description.toLowerCase().includes(searchText)
      );
    }

    if (criteria.dateFrom) {
      results = results.filter(i => i.createdAt >= criteria.dateFrom!);
    }

    if (criteria.dateTo) {
      results = results.filter(i => i.createdAt <= criteria.dateTo!);
    }

    return results;
  }

  /**
   * Get issue metrics
   */
  getIssueMetrics(): IssueMetrics {
    const issues = this.getAllIssues();
    const totalIssues = issues.length;

    const issuesBySeverity: Record<IssueSeverity, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };

    const issuesByStatus: Record<IssueStatus, number> = {
      New: 0,
      Assigned: 0,
      'In Progress': 0,
      Fixed: 0,
      Verified: 0,
      Closed: 0,
      Deferred: 0,
      Reopened: 0,
      Dismissed: 0
    };

    const issuesByCategory: Record<string, number> = {};

    let totalResolutionTime = 0;
    let resolvedIssuesCount = 0;
    let dismissedCount = 0;
    let openIssuesCount = 0;
    let closedIssuesCount = 0;
    let timeToAssignmentSum = 0;
    let assignedIssuesCount = 0;

    for (const issue of issues) {
      issuesBySeverity[issue.severity]++;
      issuesByStatus[issue.status]++;

      issuesByCategory[issue.category] = (issuesByCategory[issue.category] || 0) + 1;

      if (issue.status === 'Closed' || issue.status === 'Verified') {
        closedIssuesCount++;
        if (issue.resolutionTime) {
          totalResolutionTime += issue.resolutionTime;
          resolvedIssuesCount++;
        }
      } else if (issue.status !== 'Dismissed' && issue.status !== 'Deferred') {
        openIssuesCount++;
      }

      if (issue.status === 'Dismissed') {
        dismissedCount++;
      }

      if (issue.assignment) {
        assignedIssuesCount++;
        const assignmentDelay = issue.assignment.assignedAt.getTime() - issue.createdAt.getTime();
        timeToAssignmentSum += assignmentDelay;
      }
    }

    return {
      totalIssues,
      issuesBySeverity,
      issuesByStatus,
      issuesByCategory,
      averageResolutionTime: resolvedIssuesCount > 0 ? totalResolutionTime / resolvedIssuesCount : 0,
      falsePositiveRate: totalIssues > 0 ? (dismissedCount / totalIssues) * 100 : 0,
      averageTimeToAssignment: assignedIssuesCount > 0 ? timeToAssignmentSum / assignedIssuesCount : 0,
      openIssues: openIssuesCount,
      closedIssues: closedIssuesCount,
      criticalIssuesCount: issuesBySeverity.critical
    };
  }

  /**
   * Get trending metrics
   */
  getTrendingMetrics(): TrendingMetrics {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    const issues = this.getAllIssues();

    let issuesCreatedToday = 0;
    let issuesClosedToday = 0;
    let issuesCreatedLastWeek = 0;
    let categoryCount: Record<string, number> = {};
    let weeklyResolutionTimes: number[] = [];

    for (const issue of issues) {
      if (issue.createdAt >= today) {
        issuesCreatedToday++;
      }

      if (issue.createdAt >= lastWeek && issue.createdAt < today) {
        issuesCreatedLastWeek++;
        categoryCount[issue.category] = (categoryCount[issue.category] || 0) + 1;
        if (issue.resolutionTime) {
          weeklyResolutionTimes.push(issue.resolutionTime);
        }
      }

      if ((issue.status === 'Closed' || issue.status === 'Verified') && issue.updatedAt >= today) {
        issuesClosedToday++;
      }
    }

    const metrics = this.getIssueMetrics();
    const trendPercentage = issuesCreatedLastWeek > 0 ? ((issuesCreatedToday - issuesCreatedLastWeek) / issuesCreatedLastWeek) * 100 : 0;

    const topCategory = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';

    const weeklyAverageResolutionTime =
      weeklyResolutionTimes.length > 0
        ? weeklyResolutionTimes.reduce((a, b) => a + b) / weeklyResolutionTimes.length
        : 0;

    return {
      issuesCreatedToday,
      issuesClosedToday,
      criticalIssuesCount: metrics.criticalIssuesCount,
      trendDirection: trendPercentage > 10 ? 'up' : trendPercentage < -10 ? 'down' : 'stable',
      trendPercentage,
      topCategory,
      weeklyAverageResolutionTime
    };
  }

  /**
   * Add history entry (internal use)
   */
  private addHistoryEntry(issue: ValidationIssueTracking, entry: Omit<IssueHistoryEntry, 'timestamp'>): void {
    issue.history.push({
      timestamp: new Date(),
      ...entry
    });
  }
}
