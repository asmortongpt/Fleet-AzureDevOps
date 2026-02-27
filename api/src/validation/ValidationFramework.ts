import { AgentOrchestrator, ExecutionResults } from './AgentOrchestrator';
import { QualityLoopManager } from './QualityLoopManager';
import { logger } from '../lib/logger';

/**
 * Result from a single validation agent
 */
export interface AgentResult {
  issues: ValidationIssue[];
  timestamp?: number;
  metadata?: Record<string, any>;
}

/**
 * Complete validation result from all agents
 */
export interface ValidationResult {
  visualQA: AgentResult;
  responsiveDesign: AgentResult;
  scrollingAudit: AgentResult;
  typography: AgentResult;
  interactions: AgentResult;
  dataIntegrity: AgentResult;
  timestamp: number;
  overallScore: number;
}

/**
 * Individual quality issue detected by an agent
 */
export interface ValidationIssue {
  agent: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  screenshot: string; // Base64-encoded PNG or URL
  suggestion?: string;
  affectedComponent?: string;
}

/**
 * Core validation framework orchestrating 6 specialized agents
 * Executes validation in parallel and aggregates results with quality scoring
 */
export class ValidationFramework {
  private orchestrator: AgentOrchestrator;
  private qualityLoopManager: QualityLoopManager;
  private readonly availableAgents: string[] = [];

  // Quality score constants
  private readonly SEVERITY_WEIGHTS: Record<string, number> = {
    critical: 25,
    high: 10,
    medium: 5,
    low: 0
  };
  private readonly MAX_QUALITY_SCORE = 100;
  private readonly AGENT_NAMES: string[] = [
    'VisualQAAgent',
    'ResponsiveDesignAgent',
    'ScrollingAuditAgent',
    'TypographyAgent',
    'InteractionQualityAgent',
    'DataIntegrityAgent'
  ];

  /**
   * Initialize the validation framework with orchestrator and quality loop manager
   */
  constructor() {
    this.orchestrator = new AgentOrchestrator();
    this.qualityLoopManager = new QualityLoopManager();
    this.availableAgents = this.AGENT_NAMES;
  }

  /**
   * Initialize the validation framework and load all agents
   * @throws Error if initialization fails
   */
  async initialize(): Promise<void> {
    try {
      logger.debug('Initializing validation framework with agents', {
        agentCount: this.availableAgents.length
      });
      // Validation of agent list
      if (!this.availableAgents || this.availableAgents.length === 0) {
        throw new Error('No validation agents available');
      }
    } catch (error) {
      logger.error('Failed to initialize validation framework', { error });
      throw error;
    }
  }

  /**
   * Get list of all available agents
   * @returns Array of agent names
   */
  getAgents(): string[] {
    return [...this.availableAgents]; // Return copy to prevent mutations
  }

  /**
   * Run validation across all agents in parallel
   * @returns Complete validation result with aggregated scores
   * @throws Error if execution fails
   */
  async runValidation(): Promise<ValidationResult> {
    try {
      logger.debug('Starting validation run');
      const startTime = Date.now();

      const results = await this.orchestrator.executeAllAgents();

      logger.debug('Agent execution completed', {
        duration: Date.now() - startTime,
        agentCount: 6
      });

      return {
        visualQA: results.visualQA || { issues: [], timestamp: Date.now() },
        responsiveDesign: results.responsiveDesign || { issues: [], timestamp: Date.now() },
        scrollingAudit: results.scrollingAudit || { issues: [], timestamp: Date.now() },
        typography: results.typography || { issues: [], timestamp: Date.now() },
        interactions: results.interactions || { issues: [], timestamp: Date.now() },
        dataIntegrity: results.dataIntegrity || { issues: [], timestamp: Date.now() },
        timestamp: Date.now(),
        overallScore: this.calculateScore(results)
      };
    } catch (error) {
      logger.error('Validation execution failed', { error });
      throw new Error(
        `Validation framework failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Extract and sort all issues from validation results
   * Issues are sorted by severity (critical > high > medium > low)
   * @param results Validation results from all agents
   * @returns Array of issues sorted by severity descending
   * @throws Error if results is null or undefined
   */
  getIssuesFromResults(results: ValidationResult | null | undefined): ValidationIssue[] {
    // Input validation
    if (!results || typeof results !== 'object') {
      logger.debug('Invalid results input to getIssuesFromResults', { results });
      return [];
    }

    const issues: ValidationIssue[] = [];

    // Extract issues from all agents using DRY pattern
    const agentKeys: (keyof ValidationResult)[] = [
      'visualQA',
      'responsiveDesign',
      'scrollingAudit',
      'typography',
      'interactions',
      'dataIntegrity'
    ];

    for (const agentKey of agentKeys) {
      const agentResult = results[agentKey];
      if (agentResult && typeof agentResult === 'object' && 'issues' in agentResult && Array.isArray((agentResult as AgentResult).issues)) {
        issues.push(...(agentResult as AgentResult).issues);
      }
    }

    // Sort by severity (high value = high severity)
    const severityMap: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
    issues.sort((a, b) => severityMap[b.severity] - severityMap[a.severity]);

    logger.debug('Extracted and sorted issues', {
      totalIssues: issues.length,
      bySeverity: {
        critical: issues.filter(i => i.severity === 'critical').length,
        high: issues.filter(i => i.severity === 'high').length,
        medium: issues.filter(i => i.severity === 'medium').length,
        low: issues.filter(i => i.severity === 'low').length
      }
    });

    return issues;
  }

  /**
   * Calculate overall quality score (0-100)
   * Based on issue counts weighted by severity
   * @param results Validation results from ExecutionResults
   * @returns Quality score 0-100
   */
  private calculateScore(results: ExecutionResults): number {
    const severityCounts = this.countIssuesBySeverity(results);

    const penalties =
      (severityCounts.critical * this.SEVERITY_WEIGHTS.critical) +
      (severityCounts.high * this.SEVERITY_WEIGHTS.high) +
      (severityCounts.medium * this.SEVERITY_WEIGHTS.medium);

    const score = this.MAX_QUALITY_SCORE - penalties;
    const finalScore = Math.max(0, score); // Ensure >= 0

    logger.debug('Calculated quality score', {
      finalScore,
      ...severityCounts,
      penalties
    });

    return finalScore;
  }

  /**
   * Count issues by severity level across all agent results
   * Only iterates known agent results, not metadata fields
   * @param results All agent results
   * @returns Count object with critical, high, medium, low counts
   */
  private countIssuesBySeverity(results: ExecutionResults): {
    critical: number;
    high: number;
    medium: number;
    low: number;
  } {
    const counts = { critical: 0, high: 0, medium: 0, low: 0 };

    // Only iterate known agent result fields
    const agentKeys: (keyof ExecutionResults)[] = [
      'visualQA',
      'responsiveDesign',
      'scrollingAudit',
      'typography',
      'interactions',
      'dataIntegrity'
    ];

    for (const agentKey of agentKeys) {
      const agent = results[agentKey];
      if (agent?.issues && Array.isArray(agent.issues)) {
        for (const issue of agent.issues) {
          if (issue.severity === 'critical') {
            counts.critical++;
          } else if (issue.severity === 'high') {
            counts.high++;
          } else if (issue.severity === 'medium') {
            counts.medium++;
          } else {
            counts.low++;
          }
        }
      }
    }

    return counts;
  }
}
