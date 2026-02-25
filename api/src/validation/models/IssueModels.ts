/**
 * Issue Status lifecycle states
 */
export type IssueStatus =
  | 'New'
  | 'Assigned'
  | 'In Progress'
  | 'Fixed'
  | 'Verified'
  | 'Closed'
  | 'Deferred'
  | 'Reopened'
  | 'Dismissed';

/**
 * Issue severity levels for prioritization
 */
export type IssueSeverity = 'critical' | 'high' | 'medium' | 'low';

/**
 * Issue categories for organization
 */
export type IssueCategory =
  | 'UI'
  | 'Layout'
  | 'Performance'
  | 'Accessibility'
  | 'Data'
  | 'Navigation'
  | 'Feature'
  | 'Bug'
  | 'Security'
  | 'Testing';

/**
 * User impact level for affected operations
 */
export type UserImpactLevel = 'critical' | 'high' | 'medium' | 'low';

/**
 * Individual history entry for issue tracking
 */
export interface IssueHistoryEntry {
  /** Timestamp of the change */
  timestamp: Date;

  /** Type of action performed */
  action: 'created' | 'assigned' | 'status_changed' | 'note_added' | 'reopened' | 'verified' | 'dismissed';

  /** User who performed the action */
  userId?: string;

  /** User name for display */
  userName?: string;

  /** User email */
  userEmail?: string;

  /** Description of the change */
  description: string;

  /** Additional metadata about the change */
  metadata?: Record<string, any>;
}

/**
 * Assignment information for an issue
 */
export interface IssueAssignment {
  /** User ID of assignee */
  assignedTo: string;

  /** Email of assignee */
  assignedToEmail: string;

  /** Name of assignee */
  assignedToName?: string;

  /** When the assignment was made */
  assignedAt: Date;

  /** User who made the assignment */
  assignedBy?: string;

  /** Reason for assignment */
  reason?: string;
}

/**
 * Impact assessment for issue analysis
 */
export interface ImpactAssessment {
  /** Affected user workflows/flows */
  affectedUserFlows: string[];

  /** Pages or components affected */
  affectedPages: string[];

  /** Level of user impact */
  userImpactLevel: UserImpactLevel;

  /** Estimated number of users affected */
  estimatedUsersAffected: number;

  /** Business impact description */
  businessImpact?: string;
}

/**
 * Resolution tracking for fix verification
 */
export interface ResolutionTracking {
  /** Description of the fix applied */
  fixDescription?: string;

  /** Who applied the fix */
  fixedBy?: string;

  /** When the fix was applied */
  fixedAt?: Date;

  /** Verification attempts and results */
  verificationAttempts: VerificationAttempt[];

  /** Overall resolution time in milliseconds */
  resolutionTime?: number;
}

/**
 * Individual verification attempt
 */
export interface VerificationAttempt {
  /** Whether the fix was verified as working */
  verified: boolean;

  /** Who performed the verification */
  verifiedBy: string;

  /** When verification was performed */
  verifiedAt: Date;

  /** Notes about the verification */
  notes: string;

  /** If not verified, any remaining issues */
  remainingIssues?: string[];
}

/**
 * Main issue tracking model with complete lifecycle
 */
export interface ValidationIssueTracking {
  /** Unique issue identifier */
  id: string;

  /** Issue title */
  title: string;

  /** Detailed description */
  description: string;

  /** Severity level */
  severity: IssueSeverity;

  /** Category/type of issue */
  category: IssueCategory;

  /** Current status in lifecycle */
  status: IssueStatus;

  /** Component or area affected */
  affectedComponent: string;

  /** Agent that detected the issue */
  detectedBy: string;

  /** When issue was created */
  createdAt: Date;

  /** When issue was last updated */
  updatedAt: Date;

  /** Who is assigned to fix it */
  assignedTo?: string;

  /** Email of assigned person */
  assignedToEmail?: string;

  /** Assignment details */
  assignment?: IssueAssignment;

  /** Impact assessment */
  impactAssessment?: ImpactAssessment;

  /** Resolution tracking */
  resolutionTracking?: ResolutionTracking;

  /** Total time to resolve in milliseconds */
  resolutionTime?: number;

  /** Notes added to the issue */
  notes: string[];

  /** Complete history of changes */
  history: IssueHistoryEntry[];

  /** For reopened issues, original issue ID */
  originalIssueId?: string;

  /** Optional dismissal reason */
  dismissalReason?: string;
}

/**
 * Metrics for issue tracking analysis
 */
export interface IssueMetrics {
  /** Total number of issues */
  totalIssues: number;

  /** Issues breakdown by severity */
  issuesBySeverity: Record<IssueSeverity, number>;

  /** Issues breakdown by status */
  issuesByStatus: Record<IssueStatus, number>;

  /** Issues breakdown by category */
  issuesByCategory: Record<IssueCategory, number>;

  /** Average resolution time in milliseconds */
  averageResolutionTime: number;

  /** Percentage of issues that were false positives */
  falsePositiveRate: number;

  /** Average time to assignment */
  averageTimeToAssignment: number;

  /** Open issues count */
  openIssues: number;

  /** Closed issues count */
  closedIssues: number;

  /** Critical issues count */
  criticalIssuesCount: number;
}

/**
 * Trending metrics for dashboard display
 */
export interface TrendingMetrics {
  /** Issues created today */
  issuesCreatedToday: number;

  /** Issues closed today */
  issuesClosedToday: number;

  /** Current critical issues */
  criticalIssuesCount: number;

  /** Issues trending up/down (week-over-week) */
  trendDirection: 'up' | 'down' | 'stable';

  /** Percentage change from last week */
  trendPercentage: number;

  /** Most active category this week */
  topCategory: string;

  /** Average resolution time this week */
  weeklyAverageResolutionTime: number;
}

/**
 * Search/filter criteria for issue queries
 */
export interface IssueSearchCriteria {
  /** Filter by severity */
  severity?: IssueSeverity;

  /** Filter by status */
  status?: IssueStatus;

  /** Filter by category */
  category?: IssueCategory;

  /** Filter by assignee */
  assignedTo?: string;

  /** Text search in title and description */
  text?: string;

  /** Filter by affected component */
  affectedComponent?: string;

  /** Filter by date range */
  dateFrom?: Date;
  dateTo?: Date;
}

/**
 * Report export format options
 */
export type ReportFormat = 'json' | 'csv' | 'html' | 'pdf';

/**
 * Report generation options
 */
export interface ReportOptions {
  /** Filter criteria for issues to include */
  severity?: IssueSeverity;
  status?: IssueStatus;
  category?: IssueCategory;

  /** Include historical data */
  includeHistory?: boolean;

  /** Include impact assessment */
  includeImpact?: boolean;

  /** Sort by field */
  sortBy?: keyof ValidationIssueTracking;

  /** Sort direction */
  sortDirection?: 'asc' | 'desc';
}

/**
 * Report summary data
 */
export interface ReportSummary {
  /** Total issues in report */
  totalIssues: number;

  /** Count by severity */
  issuesBySeverity: Record<IssueSeverity, number>;

  /** Count by status */
  issuesByStatus: Record<IssueStatus, number>;

  /** Critical issues count */
  criticalCount: number;

  /** High severity count */
  highCount: number;

  /** Medium severity count */
  mediumCount: number;

  /** Low severity count */
  lowCount: number;

  /** When report was generated */
  generatedAt: Date;

  /** Average resolution time */
  averageResolutionTime: number;

  /** False positive rate */
  falsePositiveRate: number;
}

/**
 * REST API request/response types
 */
export interface CreateIssueRequest {
  title: string;
  description: string;
  severity: IssueSeverity;
  category: IssueCategory;
  affectedComponent: string;
  detectedBy: string;
  impactAssessment?: ImpactAssessment;
}

export interface UpdateIssueRequest {
  title?: string;
  description?: string;
  severity?: IssueSeverity;
  status?: IssueStatus;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface AssignIssueRequest {
  assignedTo: string;
  assignedToEmail: string;
  assignedToName?: string;
  reason?: string;
}

export interface VerifyFixRequest {
  verified: boolean;
  verifiedBy: string;
  notes: string;
  remainingIssues?: string[];
}

export interface IssueResponse {
  success: boolean;
  data: ValidationIssueTracking;
  error?: string;
}

export interface IssuesListResponse {
  success: boolean;
  data: ValidationIssueTracking[];
  meta: {
    total: number;
    count: number;
    generatedAt: string;
  };
  error?: string;
}

export interface MetricsResponse {
  success: boolean;
  data: IssueMetrics;
  error?: string;
}
