/**
 * Quality loop stages for tracking issue progression
 */
export type QualityLoopStage =
  | 'Detected'
  | 'Diagnosed'
  | 'Fixed'
  | 'Verified'
  | 'Approved';

/**
 * Issue severity levels for prioritization
 */
export type IssueSeverity = 'critical' | 'high' | 'medium' | 'low';

/**
 * Issue status for tracking through workflow
 */
export type IssueStatus =
  | 'Detected'
  | 'Diagnosed'
  | 'Fixed'
  | 'Verified'
  | 'Approved'
  | 'Dismissed';

/**
 * Agent names that can report issues
 */
export const AGENT_NAMES = [
  'VisualQAAgent',
  'ResponsiveDesignAgent',
  'ScrollingAuditAgent',
  'TypographyAgent',
  'InteractionQualityAgent',
  'DataIntegrityAgent',
  'AccessibilityPerformanceAgent'
] as const;

export type AgentName = typeof AGENT_NAMES[number];

/**
 * Validation issue with quality loop tracking
 */
export interface ValidationIssue {
  /** Unique identifier for the issue */
  id: string;

  /** Agent that detected this issue */
  agent: AgentName;

  /** Severity level (critical=25pts, high=10pts, medium=5pts, low=1pt) */
  severity: IssueSeverity;

  /** Human-readable description of the issue */
  description: string;

  /** Base64-encoded screenshot showing the issue */
  screenshot: string;

  /** Optional affected component or selector */
  affectedComponent?: string;

  /** Diagnostic information and root cause analysis */
  diagnosticInfo?: string;

  /** Suggested fix or remediation steps */
  suggestedFix?: string;

  /** Current status in quality loop */
  status: IssueStatus;

  /** Current stage in quality loop */
  loopStage: QualityLoopStage;

  /** Timestamp when issue was first detected */
  createdAt: string;

  /** Timestamp of last update */
  updatedAt: string;

  /** Screenshot with visual annotations (circles, arrows, highlights) */
  annotatedScreenshot: string;

  /** Optional reason for dismissal (if status is Dismissed) */
  dismissalReason?: string;

  /** Optional fix details (if status is Fixed) */
  fixDetails?: string;

  /** Optional verification notes */
  verificationNotes?: string;
}

/**
 * Summary statistics for dashboard display
 */
export interface DashboardSummary {
  /** Total number of issues */
  totalIssues: number;

  /** Overall quality score (0-100) */
  qualityScore: number;

  /** Issues grouped by severity */
  issuesBySeverity: Record<IssueSeverity, number>;

  /** Issues grouped by agent name */
  issuesByAgent: Record<string, number>;

  /** Issues grouped by loop stage */
  issuesByLoopStage: Record<QualityLoopStage, number>;

  /** Timestamp of last update */
  lastUpdated: string;

  /** Timestamp when dashboard was generated */
  generatedAt: string;
}

/**
 * API response wrapper for consistency
 */
export interface ApiResponse<T> {
  /** Whether the request was successful */
  success: boolean;

  /** Response data */
  data: T;

  /** Optional error message */
  error?: string;

  /** Optional metadata */
  meta?: Record<string, any>;
}

/**
 * Severity weight configuration for score calculation
 */
export interface SeverityWeights {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

/**
 * Quality loop stage transition configuration
 */
export interface LoopStageTransition {
  from: QualityLoopStage;
  to: QualityLoopStage;
  requiresData?: string[];
}

/**
 * Dashboard configuration constants
 */
export const DASHBOARD_CONFIG = {
  /** Maximum quality score */
  MAX_QUALITY_SCORE: 100,

  /** Minimum quality score */
  MIN_QUALITY_SCORE: 0,

  /** Quality loop stages in order */
  QUALITY_LOOP_STAGES: [
    'Detected',
    'Diagnosed',
    'Fixed',
    'Verified',
    'Approved'
  ] as const,

  /** Severity weights for scoring */
  SEVERITY_WEIGHTS: {
    critical: 25,
    high: 10,
    medium: 5,
    low: 1
  } as const,

  /** Valid issue statuses */
  ISSUE_STATUSES: [
    'Detected',
    'Diagnosed',
    'Fixed',
    'Verified',
    'Approved',
    'Dismissed'
  ] as const
};

/**
 * Filter criteria for retrieving issues
 */
export interface IssueFilterCriteria {
  /** Filter by severity level */
  severity?: IssueSeverity;

  /** Filter by agent name */
  agent?: AgentName;

  /** Filter by quality loop stage */
  loopStage?: QualityLoopStage;

  /** Filter by status */
  status?: IssueStatus;

  /** Filter by affected component */
  affectedComponent?: string;

  /** Date range filter (ISO string) */
  createdAfter?: string;
  createdBefore?: string;
}

/**
 * Annotated screenshot metadata for visual evidence
 */
export interface AnnotationMetadata {
  /** Original screenshot URL or base64 */
  originalScreenshot: string;

  /** List of annotations applied */
  annotations: Annotation[];

  /** Annotation timestamp */
  annotatedAt: string;

  /** Tool or method used for annotation */
  annotationType: 'circles' | 'arrows' | 'highlights' | 'text' | 'mixed';
}

/**
 * Individual annotation on a screenshot
 */
export interface Annotation {
  /** Type of annotation */
  type: 'circle' | 'arrow' | 'highlight' | 'text';

  /** X coordinate (percentage of image width) */
  x: number;

  /** Y coordinate (percentage of image height) */
  y: number;

  /** Optional width for annotations */
  width?: number;

  /** Optional height for annotations */
  height?: number;

  /** Color of annotation (hex or named) */
  color?: string;

  /** Label text for annotation */
  label?: string;

  /** Optional thickness of annotation */
  thickness?: number;
}

/**
 * HTML rendering options
 */
export interface HtmlRenderOptions {
  /** Include annotated screenshots */
  includeAnnotations: boolean;

  /** Include diagnostic information */
  includeDiagnostics: boolean;

  /** Include suggested fixes */
  includeFixes: boolean;

  /** Sort issues by severity */
  sortBySeverity: boolean;

  /** Group issues by agent */
  groupByAgent: boolean;

  /** Theme: 'light' or 'dark' */
  theme: 'light' | 'dark';

  /** Include CSS inline or external */
  cssInline: boolean;
}
