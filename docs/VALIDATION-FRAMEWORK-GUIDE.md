# Validation Framework Guide

## Quick Start (5 min read)

The Fleet-CTA Validation Framework is a comprehensive quality assurance system that continuously validates your fleet management application across 6 specialized agents. It automatically detects and reports issues with visual quality, responsive design, performance, accessibility, and data integrity.

**Get started in 3 steps:**

1. **Health Check**: Visit `/api/validation/status/health` to verify the framework is running
2. **Run Validation**: Trigger a validation run via the validation dashboard
3. **View Results**: Navigate to `/validation/dashboard` to see issues and quality scores

---

## Architecture Overview (10 min read)

### Framework Components

The validation framework consists of:

1. **7-Layer Validation Approach**
   - Layer 1: Visual QA Detection
   - Layer 2: Responsive Design Verification
   - Layer 3: Scrolling & Performance Audit
   - Layer 4: Typography & Font Consistency
   - Layer 5: Interaction Quality
   - Layer 6: Data Integrity Verification
   - Layer 7: Quality Loop & Orchestration

2. **6 Specialized Agents**
   - Each agent runs autonomously
   - Parallel execution for speed
   - Independent result aggregation
   - Real-time status reporting

3. **Quality Loop Manager**
   - Aggregates all agent results
   - Calculates quality scores (0-100)
   - Prioritizes issues by severity
   - Tracks trends over time

4. **Central Orchestrator**
   - Manages agent execution
   - Handles failures gracefully
   - Provides comprehensive logging
   - Supports concurrent runs

### System Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Validation Framework                       │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  REST API Layer                                   │  │
│  │  /api/validation/status                          │  │
│  │  /api/validation/dashboard                       │  │
│  │  /api/validation/issues                          │  │
│  └──────────────────────────────────────────────────┘  │
│                        ↓                                │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Orchestrator Layer                              │  │
│  │  - Manages 6 agents                              │  │
│  │  - Parallel execution                            │  │
│  │  - Error handling                                │  │
│  └──────────────────────────────────────────────────┘  │
│      ↓       ↓        ↓       ↓       ↓       ↓       │
│  ┌──────────────────────────────────────────────────┐  │
│  │           6 Validation Agents                    │  │
│  │ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐  │  │
│  │ │Visual│ │Resp. │ │Scroll│ │Typo. │ │Inter.│  │  │
│  │ │ QA  │ │Design│ │Audit │ │raph  │ │ QA   │  │  │
│  │ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘  │  │
│  │            ┌──────────────────────┐           │  │
│  │            │  Data Integrity      │           │  │
│  │            │  Verification        │           │  │
│  │            └──────────────────────┘           │  │
│  └──────────────────────────────────────────────────┘  │
│                        ↓                                │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Quality Loop & Result Aggregation               │  │
│  │  - Score calculation                             │  │
│  │  - Issue deduplication                           │  │
│  │  - Severity ranking                              │  │
│  └──────────────────────────────────────────────────┘  │
│                        ↓                                │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Persistence Layer                               │  │
│  │  - PostgreSQL database                           │  │
│  │  - Redis caching                                 │  │
│  │  - Historical trends                             │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 6 Specialized Agents (15 min read)

### 1. Visual QA Agent

**Purpose**: Detects visual inconsistencies, layout issues, and design problems

**What it validates:**
- Color consistency (brand colors, contrast ratios)
- Layout alignment and spacing
- Element sizing consistency
- Visual hierarchy
- Shadow and border consistency

**Example Issues Detected:**
- "Heading color doesn't match brand palette (expected #007AFF, found #0080FF)"
- "Button padding inconsistent (12px vs 16px)"
- "Low contrast ratio: 2.5:1 (minimum required: 4.5:1)"

**Configuration:**
```typescript
const visualQAAgent = new VisualQAAgent({
  contrastThreshold: 4.5,    // WCAG AA standard
  colorTolerance: 5,         // % variance allowed
  alignmentTolerance: 2      // px variance allowed
});
```

---

### 2. Responsive Design Agent

**Purpose**: Verifies layouts work correctly on all screen sizes

**What it validates:**
- Breakpoint transitions (mobile, tablet, desktop)
- Text readability at all sizes
- Touch target sizes (minimum 44px × 44px)
- Image responsiveness
- Overflow handling

**Tested Breakpoints:**
- Mobile: 320px, 375px, 425px
- Tablet: 768px, 1024px
- Desktop: 1440px, 1920px

**Example Issues Detected:**
- "Text unreadable on mobile (9px < minimum 12px)"
- "Button too small for touch (36px × 36px < 44px × 44px)"
- "Content overflow: 450px container, 500px content"

---

### 3. Scrolling Audit Agent

**Purpose**: Detects scrolling performance issues and jank

**What it validates:**
- Scroll performance (60 FPS target)
- Jank detection during scroll
- Infinite scroll behavior
- Scroll event listeners efficiency
- Virtual scrolling opportunities

**Metrics Tracked:**
- Frame drops during scroll
- Average scroll FPS
- Repaint/Layout thrashing
- Scroll listener count

**Example Issues Detected:**
- "Scroll jank detected: 42 FPS (target 60 FPS)"
- "Performance: 12 inefficient scroll listeners on same element"
- "Render lock: 450ms during scroll (should be <16ms)"

---

### 4. Typography Agent

**Purpose**: Validates font consistency and readability

**What it validates:**
- Font family consistency
- Font size hierarchy
- Line height ratios
- Letter spacing
- Font weight usage

**Typography Standards:**
- Maximum 2-3 font families per page
- Line height: 1.5× for body, 1.2× for headings
- Font sizes: [12px, 14px, 16px, 18px, 20px, 24px, 28px, 32px, 36px, 40px]
- Weight usage: Regular (400), Medium (500), Semibold (600), Bold (700)

**Example Issues Detected:**
- "Font family inconsistency: 'Roboto' vs 'Inter' on same page"
- "Line height too tight: 1.2 for body text (should be ≥1.5)"
- "Font size not in standard scale: 15px (use 14px or 16px)"

---

### 5. Interaction Quality Agent

**Purpose**: Validates user interactions and UI responsiveness

**What it validates:**
- Button click responsiveness
- Form submission handling
- Hover/focus states
- Animation smoothness
- Touch event handling
- Keyboard navigation

**Interaction Standards:**
- Click response: <100ms
- Form submission: <2s
- Animation: 60 FPS, <500ms duration
- Keyboard accessible: all interactive elements

**Example Issues Detected:**
- "Button unresponsive: click handled after 250ms (target <100ms)"
- "Missing focus state on input element"
- "Animation janky: 32 FPS (target 60 FPS)"
- "Keyboard trap: focus cannot escape modal"

---

### 6. Data Integrity Agent

**Purpose**: Validates data consistency and database integrity

**What it validates:**
- Data type consistency
- Missing or null values
- Referential integrity
- Data staleness
- Duplicate detection
- Index usage

**Checks Performed:**
- NULL value analysis
- Foreign key validation
- Type mismatch detection
- Query performance analysis
- Cache invalidation verification

**Example Issues Detected:**
- "Orphaned vehicle record: vehicle_id 42 references missing driver"
- "Stale data: telematics_data not updated in 2+ hours"
- "Type mismatch: latitude stored as TEXT instead of NUMERIC"
- "Missing index: 10M rows scanned for driver_id lookup"

---

## Quality Loop Mechanism & Workflow (15 min read)

### Quality Scoring Algorithm

Quality Score = 100 - Penalties

**Severity Weights:**
- Critical: -25 points per issue
- High: -10 points per issue
- Medium: -5 points per issue
- Low: 0 points (informational)

**Example Calculation:**
```
Base Score: 100
Deductions:
  - 3 critical issues: 3 × -25 = -75
  - 2 high issues: 2 × -10 = -20
  - 1 medium issue: 1 × -5 = -5
  - 4 low issues: 4 × 0 = 0
─────────────────────────
Final Score: 100 - 75 - 20 - 5 = 0 (Failing)
```

### Issue Resolution Workflow

1. **Detection**: Agents discover issues during validation run
2. **Classification**: Issues assigned severity level
3. **Aggregation**: Duplicate issues merged, trends analyzed
4. **Reporting**: Dashboard updated with findings
5. **Acknowledgment**: Team reviews and prioritizes
6. **Resolution**: Developers fix issues
7. **Verification**: Validation re-run confirms fix
8. **Closure**: Issue archived with resolution notes

### Quality Loop Cycle

```
Hour 0: Scheduled validation run → Detect issues
Hour 1: Dashboard alerts team → Issues assigned
Hour 2-4: Developers investigate → Begin fixes
Hour 4-8: Testing and review → Verify fixes
Hour 8: Validation re-run → Confirm resolution
Hour 9+: Archive resolved issues → Report metrics
```

---

## How to Run Validation (10 min read)

### Method 1: Dashboard Trigger

1. Navigate to `http://localhost:5173/validation/dashboard`
2. Click "Run Validation Now" button
3. Wait for completion (typically 30-60 seconds)
4. Review results in dashboard

### Method 2: REST API

**Trigger validation run:**
```bash
curl -X POST http://localhost:3001/api/validation/run \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"triggerBy": "manual", "scope": "full"}'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "runId": "val-20260225-143022",
    "status": "running",
    "startedAt": 1677331822000,
    "estimatedDuration": 45000
  }
}
```

### Method 3: Automated Scheduling

Validation runs automatically on schedule:
- **Nightly**: 01:00 UTC (full validation)
- **Weekly**: Sunday 02:00 UTC (comprehensive run)
- **Monthly**: First Sunday 02:00 UTC (trend analysis)

Check `/api/validation/status` for last run details.

### Method 4: CI/CD Pipeline

Run in GitHub Actions before deployment:
```yaml
- name: Run Validation Framework
  run: |
    npm run validation:run -- \
      --scope full \
      --fail-on-critical true \
      --output ./validation-report.json
```

---

## How to Interpret Results (15 min read)

### Dashboard Overview

The dashboard displays:

1. **Quality Score** (0-100)
   - 90-100: Excellent (green)
   - 75-90: Good (yellow)
   - 60-75: Fair (orange)
   - <60: Poor (red)

2. **Issue Summary**
   - Count by severity (critical, high, medium, low)
   - Issues detected this run
   - Improvement from previous run

3. **Agent Status**
   - All 6 agents' results
   - Individual scores
   - Execution time

4. **Recent Issues**
   - Newest issues detected
   - Trend over last 7 runs
   - Resolution status

### Issue Details

Each issue includes:

```json
{
  "id": "iss-20260225-001",
  "agent": "VisualQAAgent",
  "severity": "high",
  "title": "Color Palette Mismatch",
  "description": "Button color #FF0000 doesn't match brand red #E74C3C",
  "affectedComponent": "PrimaryButton",
  "location": "/src/components/buttons/PrimaryButton.tsx:42",
  "screenshot": "https://s3.../screenshot-high-color.png",
  "suggestion": "Update color to #E74C3C in theme.ts",
  "detectedAt": 1677331822000,
  "resolvedAt": null,
  "tags": ["visual", "branding", "consistency"]
}
```

### Reading Quality Trends

Navigate to `/api/validation/status/metrics` to see:

```json
{
  "metrics": {
    "issueDetectionRate": 14.2,        // Issues per 100 validations
    "averageQualityScore": 78.5,       // 30-day average
    "validationRunCount": 89,          // Total runs
    "averageExecutionTime": 42000,     // ms
    "totalIssuesDetected": 1263,       // Lifetime total
    "criticalIssueCount": 23,          // Never resolved
    "highSeverityCount": 156           // Partially resolved
  },
  "trends": {
    "qualityTrend": "improving",       // improving|stable|degrading
    "issueDetectionTrend": "improving",
    "performanceTrend": "stable"
  }
}
```

### Performance Baseline

Check `/api/validation/status/performance`:

```json
{
  "baseline": {
    "agentExecutionTimes": {
      "VisualQAAgent": 8200,             // ms
      "ResponsiveDesignAgent": 12500,
      "ScrollingAuditAgent": 6800,
      "TypographyAgent": 4100,
      "InteractionQualityAgent": 15300,
      "DataIntegrityAgent": 3200
    },
    "resourceUtilization": {
      "memory": {
        "used": 256,                      // MB
        "available": 512,
        "percentage": 50
      },
      "cpu": {
        "usage": 42.5,                    // %
        "cores": 4
      }
    },
    "cacheHitRate": 0.87                  // 87% cache hit
  }
}
```

---

## How to Resolve Issues (20 min read)

### Issue Resolution Process

1. **Understand the Issue**
   - Read full description and suggestion
   - View affected component screenshot
   - Check location in code

2. **Verify the Issue**
   - Reproduce locally
   - Check if intentional
   - Review related PRs/issues

3. **Fix the Issue**
   - Update code according to suggestion
   - Test locally before committing
   - Document changes

4. **Verify Resolution**
   - Run validation to confirm fix
   - Check that issue is marked resolved
   - Verify no new issues introduced

### Example Resolution: Visual QA Issue

**Issue Detected:**
```
Agent: VisualQAAgent
Severity: High
Title: Button Padding Inconsistent
Description: PrimaryButton has 12px padding, SecondaryButton has 16px
Location: /src/components/buttons/index.tsx
```

**Resolution Steps:**

1. Open the button component file:
```bash
cd /Users/andrewmorton/Documents/GitHub/Fleet-CTA
code src/components/buttons/index.tsx
```

2. Find the button definitions:
```typescript
// Before
const PrimaryButton = styled.button`
  padding: 12px 16px;  // ← Issue here
`;

const SecondaryButton = styled.button`
  padding: 16px 20px;
`;

// After
const PrimaryButton = styled.button`
  padding: 16px 20px;  // ← Fixed to match
`;

const SecondaryButton = styled.button`
  padding: 16px 20px;
`;
```

3. Test locally:
```bash
npm run dev
# Navigate to buttons showcase page and verify consistency
```

4. Commit changes:
```bash
git add src/components/buttons/index.tsx
git commit -m "fix: Standardize button padding to 16px 20px"
```

5. Verify resolution:
```bash
curl http://localhost:3001/api/validation/run \
  -H "Authorization: Bearer TOKEN" \
  -X POST
# Wait for run to complete
curl http://localhost:3001/api/validation/issues \
  -H "Authorization: Bearer TOKEN" | grep "Button Padding"
# Should return empty array confirming fix
```

### Example Resolution: Data Integrity Issue

**Issue Detected:**
```
Agent: DataIntegrityAgent
Severity: Critical
Title: Orphaned Vehicle Records
Description: 42 vehicles reference non-existent driver IDs
Location: vehicle.driver_id → driver.id
```

**Resolution Steps:**

1. Identify orphaned records:
```sql
SELECT v.id, v.driver_id
FROM vehicles v
LEFT JOIN drivers d ON v.driver_id = d.id
WHERE d.id IS NULL AND v.driver_id IS NOT NULL
LIMIT 10;
```

2. Choose resolution strategy:
   - **Option A**: Delete orphaned vehicles
   - **Option B**: Set driver_id to NULL
   - **Option C**: Add database constraint

3. Implement fix (Option C - prevent future issues):
```sql
ALTER TABLE vehicles
ADD CONSTRAINT fk_vehicles_driver_id
FOREIGN KEY (driver_id) REFERENCES drivers(id)
ON DELETE SET NULL;
```

4. Handle existing orphaned records:
```sql
UPDATE vehicles
SET driver_id = NULL
WHERE driver_id NOT IN (SELECT id FROM drivers);
```

5. Verify fix:
```sql
SELECT COUNT(*) FROM vehicles WHERE driver_id NOT IN
(SELECT id FROM drivers) AND driver_id IS NOT NULL;
-- Result should be 0
```

6. Re-run validation:
```bash
curl http://localhost:3001/api/validation/run -X POST
```

### Common Resolution Patterns

**Quick Fixes (< 5 minutes):**
- Typography: Update font sizes in theme.ts
- Colors: Update color values in constants
- Spacing: Adjust padding/margin in styled components

**Medium Fixes (5-30 minutes):**
- Responsive Design: Add breakpoint styles
- Interactions: Add event handlers
- Accessibility: Add ARIA attributes

**Complex Fixes (> 30 minutes):**
- Data Integrity: Database migrations
- Performance: Component refactoring
- Scrolling: Virtual scroll implementation

---

## Advanced Customization (20 min read)

### Configuring Agent Thresholds

Edit agent configurations in `/api/src/validation/agents/`:

```typescript
// VisualQAAgent - Increase color tolerance
const config = {
  contrastThreshold: 7.0,      // WCAG AAA
  colorTolerance: 10,          // 10% variance
  alignmentTolerance: 4        // 4px variance
};

// ResponsiveDesignAgent - Add custom breakpoint
const breakpoints = [
  { width: 320, name: 'mobile-xs' },
  { width: 375, name: 'mobile-sm' },
  { width: 425, name: 'mobile-md' },
  { width: 640, name: 'tablet-sm' },  // Add custom
  { width: 768, name: 'tablet' },
  { width: 1024, name: 'desktop-sm' },
  { width: 1440, name: 'desktop' },
  { width: 1920, name: 'desktop-lg' }
];
```

### Adding Custom Validation Rules

Create a new agent:

```typescript
// /api/src/validation/agents/CustomBrandAgent.ts
import { BaseAgent } from './BaseAgent';

export class CustomBrandAgent extends BaseAgent {
  constructor(config?: any) {
    super('CustomBrandAgent');
    this.config = config || {};
  }

  async execute(): Promise<void> {
    // Your custom validation logic
    const issues = await this.validateBrandCompliance();
    this.setResults(issues);
  }

  private async validateBrandCompliance(): Promise<any[]> {
    // Implement custom brand rules
    return [];
  }
}
```

Register in orchestrator:

```typescript
// /api/src/validation/AgentOrchestrator.ts
private agents = [
  // ... existing agents
  new CustomBrandAgent()
];
```

### Configuring Validation Schedule

Edit cron jobs in `/api/src/jobs/`:

```typescript
// telematics-sync.ts or validation-scheduler.ts
const schedule = {
  nightly: '0 1 * * *',           // 01:00 UTC daily
  weekly: '0 2 ? * SUN',          // 02:00 UTC Sunday
  monthly: '0 2 ? * SUN#1',       // First Sunday 02:00 UTC
  custom: process.env.VALIDATION_CRON || '*/5 * * * *'
};
```

### Filtering Issues by Category

Custom issue queries:

```bash
# Get only critical issues
curl http://localhost:3001/api/validation/issues?severity=critical

# Get only typography issues
curl http://localhost:3001/api/validation/issues?agent=TypographyAgent

# Get unresolved responsive design issues
curl http://localhost:3001/api/validation/issues?agent=ResponsiveDesignAgent&status=unresolved

# Get issues from last 7 days
curl http://localhost:3001/api/validation/issues?days=7&severity=high,critical
```

---

## API Reference (15 min read)

### Status Endpoints

#### GET /api/validation/status
Returns overall framework status and deployment information.

**Response:**
```json
{
  "success": true,
  "data": {
    "timestamp": 1677331822000,
    "deploymentStatus": {
      "version": "1.0.0",
      "environment": "production",
      "supportsGracefulShutdown": true,
      "rollbackSupported": true,
      "lastDeployment": 1677325000000
    },
    "components": {
      "validation": { "status": "healthy", "responseTime": 45 },
      "database": { "status": "healthy", "responseTime": 12 },
      "cache": { "status": "healthy", "responseTime": 2 }
    },
    "qualityScore": 78.5,
    "activeValidationRuns": 0
  }
}
```

#### GET /api/validation/status/health
Kubernetes liveness probe. Returns 200 if healthy, 503 if not.

**Response:** Same as `/status` with focused health data.

#### GET /api/validation/status/ready
Kubernetes readiness probe. Returns 200 if ready, 503 if not.

**Response:**
```json
{
  "success": true,
  "data": {
    "ready": true,
    "agentsReady": ["VisualQAAgent", "ResponsiveDesignAgent", ...],
    "agentsFailing": [],
    "schemaReady": true,
    "cachesWarmed": true
  }
}
```

#### GET /api/validation/status/agents
Returns status of all 6 validation agents.

**Response:**
```json
{
  "success": true,
  "data": {
    "agents": [
      {
        "name": "VisualQAAgent",
        "status": "operational",
        "lastRun": 1677331822000,
        "issueCount": 3,
        "averageExecutionTime": 8200
      }
      // ... more agents
    ],
    "summary": {
      "totalAgents": 6,
      "operationalAgents": 6,
      "degradedAgents": 0,
      "failedAgents": 0
    }
  }
}
```

#### GET /api/validation/status/metrics
Returns framework performance metrics.

#### GET /api/validation/status/performance
Returns performance baseline and resource utilization.

### Dashboard Endpoints

#### GET /api/validation/dashboard
Get overall dashboard data with quality scores and recent issues.

#### GET /api/validation/issues
Query issues with filtering options.

**Query Parameters:**
- `severity`: critical|high|medium|low
- `agent`: Agent name
- `status`: unresolved|resolved|dismissed
- `days`: Number of days to look back
- `limit`: Results per page
- `offset`: Pagination offset

---

## FAQ & Troubleshooting (10 min read)

### Q: Why is my quality score 0?

**A:** Critical issues have severe penalties. To improve:
1. Get a summary: `curl http://localhost:3001/api/validation/issues?severity=critical`
2. Address each critical issue
3. Re-run validation: `curl -X POST http://localhost:3001/api/validation/run`

### Q: Agent X hasn't run in hours, what's wrong?

**A:** Check agent health:
```bash
curl http://localhost:3001/api/validation/status/agents
```

If showing "failed" status:
1. Check backend logs: `npm run dev` in api/ folder
2. Verify database connection
3. Verify Redis connection
4. Check for errors in `agent-name.logs`

### Q: How do I run validation locally for testing?

**A:** Use the test endpoints:
```bash
npm test -- src/validation/__tests__/deployment.test.ts
```

Or manually via API:
```bash
curl -X POST http://localhost:3001/api/validation/run \
  -H "Authorization: Bearer $(get-dev-token)" \
  -H "Content-Type: application/json"
```

### Q: Can I exclude certain issues?

**A:** Yes, mark as dismissed via dashboard or API:
```bash
curl -X PATCH http://localhost:3001/api/validation/issues/{id} \
  -H "Authorization: Bearer TOKEN" \
  -d '{"status": "dismissed", "reason": "false positive"}'
```

### Q: How often should validation run?

**A:** Recommended schedule:
- **Development**: Every 15-30 minutes
- **Staging**: Every 1-2 hours
- **Production**: Nightly + post-deployment

### Q: What's acceptable quality score?

**A:** Guidelines:
- **≥90**: Excellent - Ready for production
- **80-90**: Good - Minor issues to address
- **70-80**: Fair - Notable issues need attention
- **<70**: Poor - Critical issues must be fixed

---

## Support & Escalation

### Get Help

1. **Documentation**: This guide
2. **Dashboard**: `/validation/dashboard` - View all issues
3. **API Docs**: Swagger available at `/api-docs`
4. **Logs**: Backend logs at `api/logs/validation-*.log`

### Report Issues

Found a bug in the validation framework?

1. Check existing issues on GitHub
2. Provide:
   - Framework version
   - Agent that failed
   - Error message
   - Steps to reproduce

### Performance Issues

If validation runs are slow:

1. Check `/api/validation/status/performance`
2. Identify slow agents
3. Consider configuring thresholds
4. Contact ops team for infrastructure tuning

---

## Next Steps

- [Deployment Procedures](./DEPLOYMENT-PROCEDURES.md)
- [Monitoring & Alerts](./MONITORING-AND-ALERTS.md)
- [Automation Setup](./VALIDATION-AUTOMATION.md)
