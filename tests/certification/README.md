# Full-System Spider Certification Framework

## Overview

This certification framework implements a comprehensive, evidence-based testing system that:

✅ **Crawls EVERYTHING**: Every page, feature, action, endpoint, service, integration
✅ **Uses REAL DATA**: No mocks or placeholders (configurable)
✅ **Captures Visual Evidence**: Screenshots, videos, traces, DOM snapshots
✅ **Scores 1-1000**: Every item scored across 13 categories
✅ **Enforces Hard Gates**: Correctness and Accuracy must be 1000/1000
✅ **Requires ≥990**: All items must score ≥990 to pass certification
✅ **Auto-Remediates**: Loops until all items pass with evidence
✅ **Produces Audit Report**: Complete certification report with evidence index

## Honesty Contract (Fail-Closed)

This framework follows strict honesty rules:

- **No "PASS" without evidence artifacts**
- Unknown/untestable items marked as **FAIL**
- Cannot claim success without verifiable proof
- Loop continues until ALL items pass

## Scoring System

### Hard Gates (Must be 1000/1000)

1. **Correctness**: Feature functions 100% correctly
2. **Accuracy**: Calculations/analytics are 100% accurate

If either gate fails → **Total score = 0** and item FAILS

### Scored Categories (1-1000 each)

- Accessibility (WCAG compliance, ARIA, keyboard nav)
- Usability (clicks to complete, form friction)
- Visual Appeal (layout, typography, clarity)
- Performance (load time, TTI, responsiveness)
- Responsive Design (works across viewports)
- Reactive Design (real-time updates, no reloads)
- Fits Without Scrolling (above-the-fold completion)
- Reliability (deterministic, no flakiness)
- Scalability (pagination, caching, efficient queries)
- Architecture (separation of concerns, observability)
- Industry Relevance (domain workflows, compliance)

### Minimum Score: 990/1000

**Every item must score ≥ 990 to pass certification.**

This allows only **10 points of deductions total** across all categories, enforcing near-perfection.

## What Gets Tested

### UI Surfaces
- All routes and pages
- Subpages, tabs, modals, drawers
- Role-specific surfaces
- Every interactive control
- All workflows (create/edit/delete/search/export)

### API Surfaces
- REST endpoints (all routes, verbs, versions)
- GraphQL operations
- Webhooks
- Public API + internal services
- Auth endpoints

### Background Systems
- Microservices
- Cron/scheduled jobs
- Queue workers
- Event bus streams
- Notification services
- File/object storage
- Search indexes
- Caching layers

### Integrations
- External APIs
- Identity providers
- Third-party services
- Webhook recipients
- Outbound connectors

### AI Features
- LLM/chat features
- Agent workflows
- Scoring/classification models
- Retrieval/search
- Recommendations
- Tool-using AI actions
- Guardrails/safety

## Evidence Captured

For every item tested:

### Visual Evidence
- Screenshots (before/after actions)
- Full-page screenshots
- Video recordings
- Playwright traces
- DOM snapshots

### Technical Evidence
- Console logs
- Network logs/HAR files
- API request/response captures
- Database verification queries
- Assertion results
- Performance metrics

## Remediation Loop

```
┌─────────────────────────────────────┐
│  1. Discover All Testable Surfaces  │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  2. Test Each Item + Capture        │
│     Evidence                         │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  3. Score (1-1000) + Check Gates    │
└────────────┬────────────────────────┘
             │
             ▼
        All ≥990?
             │
       ┌─────┴─────┐
       │           │
      YES          NO
       │           │
       │           ▼
       │   ┌──────────────────────┐
       │   │  4. Generate          │
       │   │     Remediation Plan  │
       │   └──────────┬───────────┘
       │              │
       │              ▼
       │   ┌──────────────────────┐
       │   │  5. Apply Fixes       │
       │   └──────────┬───────────┘
       │              │
       │              ▼
       │   Loop ───►  GOTO Step 2
       │   (Max 5 loops)
       │
       ▼
┌─────────────────────────────────────┐
│  6. Generate Certification Report   │
│     ✅ CERTIFIED                     │
└─────────────────────────────────────┘
```

## Running the Tests

### Quick Start

```bash
# Install dependencies (if not already done)
npm install

# Run the spider certification test
npx playwright test tests/certification/spider-certification.spec.ts --reporter=line

# View results
open test-results/certification-evidence/certification-report.json
```

### With Visual Report

```bash
npx playwright test tests/certification/spider-certification.spec.ts --reporter=html

# Open HTML report
npx playwright show-report
```

### Configuration

Edit `CONFIG` in `spider-certification.spec.ts`:

```typescript
const CONFIG = {
  baseUrl: 'http://localhost:5174',      // Frontend URL
  apiBaseUrl: 'http://localhost:3000',   // API URL
  evidenceDir: './test-results/certification-evidence',
  minScore: 990,                         // Minimum score to pass
  maxRemediationLoops: 5,                // Prevent infinite loops
  useRealData: true,                     // Use real data (not mocks)
};
```

## Output Files

After running, you'll find:

```
test-results/certification-evidence/
├── inventory.json                      # Full inventory of tested items
├── certification-report.json           # Final certification report
├── page-fleet-<timestamp>.png          # Page screenshots
├── endpoint-GET-api-vehicles-<timestamp>.png
└── ... (all evidence artifacts)
```

## Certification Report Structure

```json
{
  "runId": "cert-1234567890",
  "timestamp": "2026-02-01T12:00:00.000Z",
  "status": "CERTIFIED" | "NOT_CERTIFIED",
  "inventory": {
    "totalItems": 150,
    "itemsByType": {
      "page": 9,
      "feature": 45,
      "action": 50,
      "endpoint": 30,
      "service": 10,
      "ai": 6
    },
    "coverage": {
      "discovered": 150,
      "attempted": 150,
      "verified": 148,
      "failed": 2,
      "blocked": 0
    }
  },
  "scores": {
    "overall": 995,
    "byCategory": {
      "correctness": 1000,
      "accuracy": 1000,
      "accessibility": 998,
      "usability": 997,
      // ... all categories
    }
  },
  "failures": [
    // Items that scored < 990
  ],
  "blockers": [],
  "remediationLoops": 2
}
```

## Extending the Framework

### Add New Test Targets

Edit `InventoryDiscovery.discoverAll()`:

```typescript
// Add custom discovery
const customItems = await this.discoverCustomFeatures(page);
items.push(...customItems);
```

### Add New Scoring Categories

1. Add category to `CategoryScores` interface
2. Add weight to `ScoringEngine.scoreItem()`
3. Add scoring logic based on metrics

### Add API Testing

Implement `TestExecutor.testEndpoint()`:

```typescript
static async testEndpoint(item: TestItem): Promise<void> {
  const response = await fetch(`${CONFIG.apiBaseUrl}${item.endpoint}`);
  // Validate response, capture evidence, score
}
```

### Add Custom Metrics

Pass custom metrics to `ScoringEngine.scoreItem()`:

```typescript
const metrics = {
  correctnessFailures: 0,
  accuracyFailures: 0,
  customMetric: calculateCustomMetric(),
  // ...
};
```

## Troubleshooting

### Test Hangs

- Check `baseUrl` is correct and app is running
- Increase timeouts in `page.goto()` calls
- Check for infinite loading states

### Items Marked UNMEASURABLE

- Add test instrumentation
- Implement missing test logic
- Ensure endpoints are discoverable

### Low Scores

- Review deductions in report
- Check evidence artifacts (screenshots)
- Fix issues and re-run

### Max Loops Reached

- Some items cannot be auto-fixed
- Manual intervention required
- Check `failures` in report for specific issues

## Best Practices

1. **Run incrementally**: Start with small subsets, expand gradually
2. **Fix gates first**: Correctness and Accuracy are critical
3. **Use evidence**: Always review screenshots/logs for context
4. **Document blockers**: If something can't be tested, document why
5. **Version control reports**: Track certification over time

## Integration with CI/CD

### GitHub Actions

```yaml
- name: Run Spider Certification
  run: npx playwright test tests/certification/spider-certification.spec.ts

- name: Upload Certification Report
  uses: actions/upload-artifact@v3
  with:
    name: certification-report
    path: test-results/certification-evidence/
```

### Azure DevOps

```yaml
- script: npx playwright test tests/certification/spider-certification.spec.ts
  displayName: 'Spider Certification'

- task: PublishBuildArtifacts@1
  inputs:
    pathToPublish: 'test-results/certification-evidence'
    artifactName: 'CertificationReport'
```

### Gating Deployments

```bash
#!/bin/bash
# Gate deployment on certification status

npx playwright test tests/certification/spider-certification.spec.ts

STATUS=$(jq -r '.status' test-results/certification-evidence/certification-report.json)

if [ "$STATUS" != "CERTIFIED" ]; then
  echo "❌ Certification failed - blocking deployment"
  exit 1
fi

echo "✅ Certification passed - proceeding with deployment"
```

## FAQ

**Q: How long does a full run take?**
A: Depends on inventory size. Expect 5-30 minutes for full app.

**Q: Can I run specific items only?**
A: Yes - filter `inventory.items` before testing.

**Q: What if I don't have a backend API?**
A: Set `CONFIG.useRealData = false` and skip endpoint tests.

**Q: Can I customize scoring weights?**
A: Yes - edit `weights` in `ScoringEngine.scoreItem()`.

**Q: How do I know what to fix?**
A: Check `deductions` array in failing items - each has specific reason + evidence.

## License

This framework is part of the Fleet-CTA project.

## Support

For issues or questions:
1. Check evidence artifacts for root cause
2. Review deductions in certification report
3. Consult remediation steps
4. Open issue with full report attached
