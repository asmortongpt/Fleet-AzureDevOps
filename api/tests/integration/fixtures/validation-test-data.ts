/**
 * Validation Integration Test Data Fixtures
 *
 * Provides comprehensive test data for validation framework integration tests
 * including multiple tenants, vehicles, users, validation results, and quality loops.
 *
 * @module tests/integration/fixtures/validation-test-data
 * @author Claude Code - Task 13
 * @date 2026-02-25
 */

import { v4 as uuidv4 } from 'uuid';
import {
  ValidationIssue,
  ChecklistStatus,
  ChecklistCategory,
  type CheckItemResult,
} from '../../../src/validation/models/ChecklistModels';
import { type ValidationIssue as DashboardIssue } from '../../../src/validation/models/DashboardModels';

// ============================================================================
// Test Tenant Configuration
// ============================================================================

export const TEST_VALIDATION_TENANTS = {
  tenant1: {
    id: '10000000-0000-0000-0000-000000000001',
    name: 'Fleet Company A',
    slug: 'fleet-a',
  },
  tenant2: {
    id: '20000000-0000-0000-0000-000000000002',
    name: 'Fleet Company B',
    slug: 'fleet-b',
  },
  tenant3: {
    id: '30000000-0000-0000-0000-000000000003',
    name: 'Fleet Company C',
    slug: 'fleet-c',
  },
} as const;

// ============================================================================
// Test Users with Different Roles
// ============================================================================

export const TEST_VALIDATION_USERS = {
  superadmin: {
    id: '11111111-1111-1111-1111-111111111111',
    tenant_id: TEST_VALIDATION_TENANTS.tenant1.id,
    email: 'superadmin@validation.test',
    first_name: 'Super',
    last_name: 'Admin',
    role: 'superadmin',
    scope_level: 'global',
  },
  admin: {
    id: '22222222-2222-2222-2222-222222222222',
    tenant_id: TEST_VALIDATION_TENANTS.tenant1.id,
    email: 'admin@validation.test',
    first_name: 'Fleet',
    last_name: 'Admin',
    role: 'admin',
    scope_level: 'tenant',
  },
  manager: {
    id: '33333333-3333-3333-3333-333333333333',
    tenant_id: TEST_VALIDATION_TENANTS.tenant1.id,
    email: 'manager@validation.test',
    first_name: 'Fleet',
    last_name: 'Manager',
    role: 'manager',
    scope_level: 'team',
  },
  driver: {
    id: '44444444-4444-4444-4444-444444444444',
    tenant_id: TEST_VALIDATION_TENANTS.tenant1.id,
    email: 'driver@validation.test',
    first_name: 'Field',
    last_name: 'Driver',
    role: 'user',
    scope_level: 'own',
  },
  viewer: {
    id: '55555555-5555-5555-5555-555555555555',
    tenant_id: TEST_VALIDATION_TENANTS.tenant1.id,
    email: 'viewer@validation.test',
    first_name: 'Read',
    last_name: 'Only',
    role: 'viewer',
    scope_level: 'own',
  },
} as const;

// ============================================================================
// Test Vehicles
// ============================================================================

export const TEST_VALIDATION_VEHICLES = {
  vehicle1: {
    id: uuidv4(),
    tenant_id: TEST_VALIDATION_TENANTS.tenant1.id,
    vin: '1HGCM82633A111111',
    license_plate: 'VAL-0001',
    make: 'Ford',
    model: 'F-250',
    year: 2021,
    status: 'active',
  },
  vehicle2: {
    id: uuidv4(),
    tenant_id: TEST_VALIDATION_TENANTS.tenant1.id,
    vin: '1FTFW1ET3EFA11111',
    license_plate: 'VAL-0002',
    make: 'Chevrolet',
    model: 'Silverado',
    year: 2022,
    status: 'active',
  },
  vehicle3: {
    id: uuidv4(),
    tenant_id: TEST_VALIDATION_TENANTS.tenant2.id,
    vin: '5TDJNRFH8LS111111',
    license_plate: 'VAL-B001',
    make: 'Toyota',
    model: 'Highlander',
    year: 2020,
    status: 'active',
  },
} as const;

// ============================================================================
// Validation Issues - All Severity Levels
// ============================================================================

export function createMockValidationIssue(
  overrides?: Partial<ValidationIssue>
): ValidationIssue {
  return {
    agent: 'VisualQAAgent',
    severity: 'medium',
    description: 'Test validation issue',
    screenshot: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    suggestion: 'Fix the visual issue',
    affectedComponent: 'TestComponent',
    ...overrides,
  };
}

export function createMockCriticalIssues(count: number = 3): ValidationIssue[] {
  return Array.from({ length: count }, (_, i) => ({
    agent: ['VisualQAAgent', 'ResponsiveDesignAgent', 'DataIntegrityAgent'][i % 3],
    severity: 'critical',
    description: `Critical issue ${i + 1}: System functionality blocked`,
    screenshot: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    suggestion: `Fix critical issue ${i + 1}`,
    affectedComponent: `Component${i + 1}`,
  }));
}

export function createMockHighSeverityIssues(count: number = 3): ValidationIssue[] {
  return Array.from({ length: count }, (_, i) => ({
    agent: ['TypographyAgent', 'ScrollingAuditAgent', 'InteractionQualityAgent'][i % 3],
    severity: 'high',
    description: `High issue ${i + 1}: Major functionality impaired`,
    screenshot: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    suggestion: `Fix high issue ${i + 1}`,
    affectedComponent: `HighComponent${i + 1}`,
  }));
}

export function createMockMediumSeverityIssues(count: number = 3): ValidationIssue[] {
  return Array.from({ length: count }, (_, i) => ({
    agent: 'VisualQAAgent',
    severity: 'medium',
    description: `Medium issue ${i + 1}: Minor visual or functional problem`,
    screenshot: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    suggestion: `Fix medium issue ${i + 1}`,
    affectedComponent: `MediumComponent${i + 1}`,
  }));
}

export function createMockLowSeverityIssues(count: number = 3): ValidationIssue[] {
  return Array.from({ length: count }, (_, i) => ({
    agent: 'TypographyAgent',
    severity: 'low',
    description: `Low issue ${i + 1}: Cosmetic or polish item`,
    screenshot: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    suggestion: `Fix low issue ${i + 1}`,
    affectedComponent: `LowComponent${i + 1}`,
  }));
}

// ============================================================================
// Checklist Items
// ============================================================================

export function createMockCheckItemResult(
  overrides?: Partial<CheckItemResult>
): CheckItemResult {
  return {
    id: uuidv4(),
    name: 'Test Validation Item',
    category: ChecklistCategory.VISUAL_QUALITY,
    status: ChecklistStatus.PASS,
    timestamp: new Date(),
    evidence: {
      passed: true,
      details: 'Validation passed',
    },
    blocksRelease: false,
    ...overrides,
  };
}

export function createMockChecklistItems(
  count: number = 10,
  status?: ChecklistStatus
): CheckItemResult[] {
  return Array.from({ length: count }, (_, i) => ({
    id: uuidv4(),
    name: `Checklist Item ${i + 1}`,
    category: Object.values(ChecklistCategory)[i % Object.keys(ChecklistCategory).length],
    status: status || (i % 3 === 0 ? ChecklistStatus.PASS : ChecklistStatus.WARNING),
    timestamp: new Date(),
    evidence: {
      passed: status === ChecklistStatus.PASS,
      details: `Item ${i + 1} validation details`,
    },
    blocksRelease: status === ChecklistStatus.FAIL,
  }));
}

// ============================================================================
// Dashboard Issue Models
// ============================================================================

export function createMockDashboardIssue(
  overrides?: Partial<DashboardIssue>
): DashboardIssue {
  return {
    id: uuidv4(),
    agent: 'VisualQAAgent',
    severity: 'medium',
    description: 'Test dashboard issue',
    screenshot: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    affectedComponent: 'TestComponent',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    loopStage: 'detected',
    status: 'open',
    ...overrides,
  };
}

// ============================================================================
// Quality Loop Workflow Data
// ============================================================================

export interface QualityLoopWorkflowData {
  issueId: string;
  detected: Date;
  diagnosed: Date;
  fixed: Date;
  verified: Date;
  approved: Date;
}

export function createMockQualityLoopWorkflow(): QualityLoopWorkflowData {
  const detected = new Date();
  const diagnosed = new Date(detected.getTime() + 30 * 60000); // 30 mins later
  const fixed = new Date(diagnosed.getTime() + 120 * 60000); // 2 hours later
  const verified = new Date(fixed.getTime() + 60 * 60000); // 1 hour later
  const approved = new Date(verified.getTime() + 30 * 60000); // 30 mins later

  return {
    issueId: `QL-${uuidv4()}`,
    detected,
    diagnosed,
    fixed,
    verified,
    approved,
  };
}

// ============================================================================
// Pre-Flight Checklist Scenarios
// ============================================================================

export interface PreFlightChecklistScenario {
  name: string;
  items: CheckItemResult[];
  expectedStatus: 'ready' | 'issues' | 'blocked';
  blockingItemCount: number;
}

export function createPassingChecklistScenario(): PreFlightChecklistScenario {
  return {
    name: 'All Items Passing',
    items: createMockChecklistItems(20, ChecklistStatus.PASS),
    expectedStatus: 'ready',
    blockingItemCount: 0,
  };
}

export function createWarningChecklistScenario(): PreFlightChecklistScenario {
  const items = [
    ...createMockChecklistItems(15, ChecklistStatus.PASS),
    ...createMockChecklistItems(5, ChecklistStatus.WARNING),
  ];
  return {
    name: 'Items with Warnings',
    items,
    expectedStatus: 'issues',
    blockingItemCount: 0,
  };
}

export function createBlockingChecklistScenario(): PreFlightChecklistScenario {
  const items = [
    ...createMockChecklistItems(10, ChecklistStatus.PASS),
    ...createMockChecklistItems(5, ChecklistStatus.WARNING),
  ];
  // Add blocking items
  const blockingItems = createMockChecklistItems(3, ChecklistStatus.FAIL);
  items.push(...blockingItems);

  return {
    name: 'Critical Blocking Items',
    items,
    expectedStatus: 'blocked',
    blockingItemCount: 3,
  };
}

// ============================================================================
// Multi-Agent Validation Results
// ============================================================================

export interface MultiAgentValidationResults {
  visualQA: { issues: ValidationIssue[] };
  responsiveDesign: { issues: ValidationIssue[] };
  scrollingAudit: { issues: ValidationIssue[] };
  typography: { issues: ValidationIssue[] };
  interactions: { issues: ValidationIssue[] };
  dataIntegrity: { issues: ValidationIssue[] };
  timestamp: number;
  overallScore: number;
}

export function createMockMultiAgentResults(
  severityDistribution: 'all_pass' | 'mixed' | 'all_fail' = 'mixed'
): MultiAgentValidationResults {
  let visualQAIssues: ValidationIssue[] = [];
  let responsiveIssues: ValidationIssue[] = [];
  let scrollingIssues: ValidationIssue[] = [];
  let typographyIssues: ValidationIssue[] = [];
  let interactionIssues: ValidationIssue[] = [];
  let dataIssues: ValidationIssue[] = [];

  if (severityDistribution === 'all_pass') {
    // No issues
  } else if (severityDistribution === 'mixed') {
    visualQAIssues = [createMockCriticalIssues(1)[0]];
    responsiveIssues = [createMockHighSeverityIssues(1)[0]];
    scrollingIssues = [createMockMediumSeverityIssues(1)[0]];
    typographyIssues = [createMockLowSeverityIssues(1)[0]];
    interactionIssues = [createMockHighSeverityIssues(1)[0]];
    dataIssues = [createMockCriticalIssues(1)[0]];
  } else if (severityDistribution === 'all_fail') {
    visualQAIssues = createMockCriticalIssues(2);
    responsiveIssues = createMockCriticalIssues(2);
    scrollingIssues = createMockHighSeverityIssues(2);
    typographyIssues = createMockHighSeverityIssues(2);
    interactionIssues = createMockCriticalIssues(2);
    dataIssues = createMockCriticalIssues(2);
  }

  const allIssues = [
    ...visualQAIssues,
    ...responsiveIssues,
    ...scrollingIssues,
    ...typographyIssues,
    ...interactionIssues,
    ...dataIssues,
  ];

  // Calculate score: 100 - (critical: 25, high: 10, medium: 5, low: 0)
  const criticalCount = allIssues.filter(i => i.severity === 'critical').length;
  const highCount = allIssues.filter(i => i.severity === 'high').length;
  const mediumCount = allIssues.filter(i => i.severity === 'medium').length;

  const score = Math.max(
    0,
    100 - (criticalCount * 25 + highCount * 10 + mediumCount * 5)
  );

  return {
    visualQA: { issues: visualQAIssues },
    responsiveDesign: { issues: responsiveIssues },
    scrollingAudit: { issues: scrollingIssues },
    typography: { issues: typographyIssues },
    interactions: { issues: interactionIssues },
    dataIntegrity: { issues: dataIssues },
    timestamp: Date.now(),
    overallScore: score,
  };
}

// ============================================================================
// Error Recovery Scenarios
// ============================================================================

export interface ErrorRecoveryScenario {
  name: string;
  errorType: 'timeout' | 'screenshot_failure' | 'api_error' | 'db_error';
  retryCount: number;
  shouldRecover: boolean;
}

export function createErrorRecoveryScenarios(): ErrorRecoveryScenario[] {
  return [
    {
      name: 'Agent Timeout - Should Recover',
      errorType: 'timeout',
      retryCount: 3,
      shouldRecover: true,
    },
    {
      name: 'Screenshot Failure - Graceful Degradation',
      errorType: 'screenshot_failure',
      retryCount: 2,
      shouldRecover: true,
    },
    {
      name: 'API Error - Transaction Rollback',
      errorType: 'api_error',
      retryCount: 2,
      shouldRecover: true,
    },
    {
      name: 'Database Error - Connection Reset',
      errorType: 'db_error',
      retryCount: 3,
      shouldRecover: true,
    },
  ];
}

// ============================================================================
// Performance Baseline Data
// ============================================================================

export interface PerformanceBaseline {
  agentExecutionTime: number; // milliseconds
  parallelExecutionTime: number; // milliseconds
  issueDetectionTime: number; // milliseconds
  dashboardRenderTime: number; // milliseconds
  reportGenerationTime: number; // milliseconds
}

export const EXPECTED_PERFORMANCE_BASELINES = {
  agentExecutionTime: 5000, // 5 seconds max per agent
  parallelExecutionTime: 8000, // 8 seconds max for all agents in parallel
  issueDetectionTime: 1000, // 1 second max
  dashboardRenderTime: 500, // 500ms max
  reportGenerationTime: 2000, // 2 seconds max
} as const;

// ============================================================================
// Helper Functions
// ============================================================================

export function generateValidationRunId(): string {
  return `VAL-RUN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function generateIssueId(): string {
  return `ISSUE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function measureExecutionTime<T>(
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const startTime = Date.now();
  const result = await fn();
  const duration = Date.now() - startTime;
  return { result, duration };
}
