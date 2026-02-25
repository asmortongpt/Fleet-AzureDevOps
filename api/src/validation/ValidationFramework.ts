import { AgentOrchestrator } from './AgentOrchestrator';
import { QualityLoopManager } from './QualityLoopManager';

export interface ValidationResult {
  visualQA: any;
  responsiveDesign: any;
  scrollingAudit: any;
  typography: any;
  interactions: any;
  dataIntegrity: any;
  timestamp: number;
  overallScore: number;
}

export interface ValidationIssue {
  agent: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  screenshot: string;
  suggestion?: string;
  affectedComponent?: string;
}

export class ValidationFramework {
  private orchestrator: AgentOrchestrator;
  private qualityLoopManager: QualityLoopManager;
  private agents: any[] = [];

  constructor() {
    this.orchestrator = new AgentOrchestrator();
    this.qualityLoopManager = new QualityLoopManager();
  }

  async initialize(): Promise<void> {
    const agents = [
      'VisualQAAgent',
      'ResponsiveDesignAgent',
      'ScrollingAuditAgent',
      'TypographyAgent',
      'InteractionQualityAgent',
      'DataIntegrityAgent'
    ];
    this.agents = agents;
  }

  getAgents(): any[] {
    return this.agents;
  }

  async runValidation(): Promise<ValidationResult> {
    const results = await this.orchestrator.executeAllAgents();
    return {
      visualQA: results.visualQA,
      responsiveDesign: results.responsiveDesign,
      scrollingAudit: results.scrollingAudit,
      typography: results.typography,
      interactions: results.interactions,
      dataIntegrity: results.dataIntegrity,
      timestamp: Date.now(),
      overallScore: this.calculateScore(results)
    };
  }

  getIssuesFromResults(results: ValidationResult): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    if (results.visualQA?.issues) {
      issues.push(...results.visualQA.issues);
    }
    if (results.responsiveDesign?.issues) {
      issues.push(...results.responsiveDesign.issues);
    }
    if (results.scrollingAudit?.issues) {
      issues.push(...results.scrollingAudit.issues);
    }
    if (results.typography?.issues) {
      issues.push(...results.typography.issues);
    }
    if (results.interactions?.issues) {
      issues.push(...results.interactions.issues);
    }
    if (results.dataIntegrity?.issues) {
      issues.push(...results.dataIntegrity.issues);
    }

    return issues.sort((a, b) => {
      const severityMap = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityMap[b.severity] - severityMap[a.severity];
    });
  }

  private calculateScore(results: any): number {
    const criticalCount = this.countIssuesBySeverity(results, 'critical');
    const highCount = this.countIssuesBySeverity(results, 'high');
    const mediumCount = this.countIssuesBySeverity(results, 'medium');

    return Math.max(0, 100 - (criticalCount * 25 + highCount * 10 + mediumCount * 5));
  }

  private countIssuesBySeverity(results: any, severity: string): number {
    let count = 0;
    Object.values(results).forEach((agent: any) => {
      if (agent?.issues) {
        count += agent.issues.filter((i: any) => i.severity === severity).length;
      }
    });
    return count;
  }
}
