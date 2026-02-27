# Validation Framework Guide

## Overview

The validation framework orchestrates 6 specialized agents to ensure production-ready quality across visual design, responsive behavior, user interactions, and data integrity. This framework provides systematic quality assurance before customer testing.

## Agents

The validation framework coordinates the following 6 agents:

1. **Visual QA Agent** - Pixel-perfect visual inspection
   - Checks color contrast and accessibility
   - Validates visual hierarchy and alignment
   - Detects rendering artifacts

2. **Responsive Design Agent** - 6-breakpoint responsive testing
   - Tests at 320px, 480px, 768px, 1024px, 1440px, and 1920px breakpoints
   - Validates layout integrity and element visibility
   - Ensures no content overflow or distortion

3. **Scrolling Audit Agent** - Detects unnecessary scrolling
   - Identifies horizontal scrollbars when they shouldn't exist
   - Validates vertical scroll positioning and behavior
   - Checks for content clipping

4. **Typography Agent** - Text overflow and font integrity
   - Validates font rendering and fallbacks
   - Detects text overflow and clipping
   - Checks line height and spacing consistency

5. **Interaction Quality Agent** - Component state validation
   - Tests button click handlers and state changes
   - Validates form input behavior
   - Checks hover, focus, and active states

6. **Data Integrity Agent** - End-to-end data flow verification
   - Validates API response formats
   - Checks data consistency across page loads
   - Detects missing or malformed data fields

## Quality Loop

The validation process follows a structured quality loop:

```
Issues Detected → Diagnosis → Developer Fix → Re-validation → Approval
```

### Issue Severity Levels

- **Critical** (0-20 points): Breaks functionality or is completely unusable
- **High** (20-40 points): Significantly impacts usability or user experience
- **Medium** (40-70 points): Minor usability issues or non-critical bugs
- **Low** (70-100 points): Cosmetic issues or edge cases

### Overall Score Calculation

The overall score is calculated as:
- Base: 100 points
- Critical issue penalty: -25 points each
- High issue penalty: -10 points each
- Medium issue penalty: -5 points each

Minimum score: 0 points (all types of issues present)

## ValidationFramework API

### Constructor

```typescript
const framework = new ValidationFramework();
```

### Methods

#### initialize()

Initializes all 6 validation agents.

```typescript
await framework.initialize();
```

#### getAgents()

Returns array of agent names.

```typescript
const agents = framework.getAgents();
// Returns: ['VisualQAAgent', 'ResponsiveDesignAgent', ...]
```

#### runValidation()

Executes all agents in parallel and returns consolidated results.

```typescript
const result = await framework.runValidation();
// Returns: ValidationResult with all agent outputs and overall score
```

#### getIssuesFromResults(results)

Extracts and sorts issues by severity.

```typescript
const issues = framework.getIssuesFromResults(result);
// Returns: ValidationIssue[] sorted by severity (critical → low)
```

## ValidationResult Interface

```typescript
interface ValidationResult {
  visualQA: any;
  responsiveDesign: any;
  scrollingAudit: any;
  typography: any;
  interactions: any;
  dataIntegrity: any;
  timestamp: number;
  overallScore: number;
}
```

## ValidationIssue Interface

```typescript
interface ValidationIssue {
  agent: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  screenshot: string;
  suggestion?: string;
  affectedComponent?: string;
}
```

## Usage Example

```typescript
import { ValidationFramework } from '@/validation/ValidationFramework';

// Create framework instance
const framework = new ValidationFramework();

// Initialize agents
await framework.initialize();

// Run validation
const result = await framework.runValidation();

// Extract issues
const issues = framework.getIssuesFromResults(result);

// Check score
if (result.overallScore < 80) {
  console.warn(`Quality score: ${result.overallScore}/100`);
  issues.forEach(issue => {
    console.error(`[${issue.severity}] ${issue.description}`);
  });
}
```

## Testing

All validation tests use real data and follow the zero-mocks policy:

```bash
cd api && npm test -- --run src/__tests__/validation/framework.test.ts
```

## Architecture

The validation framework uses:

- **AgentOrchestrator**: Coordinates parallel execution of all 6 agents
- **QualityLoopManager**: Tracks issues through diagnosis and resolution
- **ValidationFramework**: Main orchestrator class providing unified API

All agents execute in parallel for performance, with results consolidated and issues automatically sorted by severity.

## Environment Variables

Currently no environment variables required. Configuration is code-based.

## Future Enhancements

- Database persistence for validation history
- Webhook notifications for critical issues
- Automated screenshot storage and retrieval
- Integration with CI/CD pipelines
- Custom severity thresholds per component type
- Agent-specific configuration options
