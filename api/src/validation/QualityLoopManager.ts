import { logger } from '../lib/logger';

/**
 * Quality loop stage tracking
 */
interface LoopStage {
  detectedAt: Date;
  stage: 'Detected' | 'In Progress' | 'Fixed' | 'Verified' | 'Closed';
  transitions: Array<{
    stage: string;
    timestamp: Date;
    by: string;
    reason?: string;
  }>;
}

/**
 * Manages quality loop tracking and re-validation of detected issues
 */
export class QualityLoopManager {
  private loopStages: Map<string, LoopStage> = new Map();

  /**
   * Track an issue through the quality loop
   * @param issue Issue to track
   * @throws Error if tracking fails
   */
  trackIssue(issue: any): void {
    if (!issue.id) {
      throw new Error('Issue must have an ID to track');
    }

    try {
      // Record the loop entry
      this.loopStages.set(issue.id, {
        detectedAt: new Date(),
        stage: 'Detected',
        transitions: [
          {
            stage: 'Detected',
            timestamp: new Date(),
            by: 'system'
          }
        ]
      });

      logger.info(`Quality loop tracking started for issue ${issue.id}`, {
        severity: issue.severity,
        title: issue.title
      });
    } catch (error) {
      logger.error(`Failed to track issue ${issue.id}`, { error });
      throw new Error(
        `Quality loop tracking failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Reopen an issue for re-testing after developer fix
   * @param issueId ID of issue to retest
   * @throws Error if retest operation fails
   */
  reopenIssueForRetest(issueId: string): void {
    const loop = this.loopStages.get(issueId);

    if (!loop) {
      throw new Error(`No quality loop found for issue ${issueId}`);
    }

    try {
      // Record reopening transition
      loop.stage = 'Detected';
      loop.transitions.push({
        stage: 'Detected',
        timestamp: new Date(),
        by: 'system',
        reason: 'Reopened for retest after developer fix'
      });

      logger.info(`Issue ${issueId} reopened for retest`, {
        transitionCount: loop.transitions.length
      });
    } catch (error) {
      logger.error(`Failed to reopen issue ${issueId}`, { error });
      throw new Error(
        `Retest operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Record a transition to a new stage
   * @param issueId Issue ID
   * @param newStage New stage
   * @param reason Optional reason for transition
   */
  transitionIssue(
    issueId: string,
    newStage: 'Detected' | 'In Progress' | 'Fixed' | 'Verified' | 'Closed',
    reason?: string
  ): void {
    const loop = this.loopStages.get(issueId);

    if (!loop) {
      throw new Error(`No quality loop found for issue ${issueId}`);
    }

    loop.stage = newStage;
    loop.transitions.push({
      stage: newStage,
      timestamp: new Date(),
      by: 'system',
      reason
    });

    logger.debug(`Issue ${issueId} transitioned to ${newStage}`, { reason });
  }

  /**
   * Get the current stage of an issue
   * @param issueId Issue ID
   * @returns Current stage or undefined if not tracked
   */
  getIssueStage(issueId: string): LoopStage | undefined {
    return this.loopStages.get(issueId);
  }

  /**
   * Get all tracked issues
   * @returns Map of all tracked issues
   */
  getAllTrackedIssues(): Map<string, LoopStage> {
    return new Map(this.loopStages);
  }
}
