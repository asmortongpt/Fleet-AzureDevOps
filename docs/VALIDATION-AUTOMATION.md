# Validation Automation & Scheduling Guide

## Cron Job Setup for Validation Runs

### Environment Configuration

Add to `.env` file:

```bash
# Validation Scheduling
VALIDATION_SCHEDULE_ENABLED=true
VALIDATION_NIGHTLY_CRON=0 1 * * *              # 01:00 UTC daily
VALIDATION_WEEKLY_CRON=0 2 ? * SUN             # 02:00 UTC Sunday
VALIDATION_MONTHLY_CRON=0 2 ? * SUN#1          # First Sunday 02:00 UTC

# Validation Settings
VALIDATION_SCOPE=full                          # full, partial, quick
VALIDATION_FAIL_ON_CRITICAL=true              # Exit with error if critical issues
VALIDATION_NOTIFICATION_ENABLED=true          # Send notifications on completion

# Notification Channels
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
EMAIL_RECIPIENTS=team@example.com
```

### Job Scheduler Configuration

**Using Bull/BullMQ for job queue:**

```typescript
// api/src/jobs/validation-scheduler.ts
import Queue from 'bull';
import cron from 'cron';
import { logger } from '../lib/logger';
import { ValidationFramework } from '../validation/ValidationFramework';

const validationQueue = new Queue('validation', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379')
  }
});

const framework = new ValidationFramework();

/**
 * Nightly Full Validation - 01:00 UTC
 */
export function scheduleNightlyValidation(): void {
  const nightlyJob = cron.job(
    process.env.VALIDATION_NIGHTLY_CRON || '0 1 * * *',
    async () => {
      logger.info('Starting scheduled nightly validation run');

      try {
        await validationQueue.add(
          {
            type: 'full',
            triggerBy: 'scheduler-nightly',
            timestamp: Date.now()
          },
          {
            priority: 5,
            attempts: 2,
            backoff: {
              type: 'exponential',
              delay: 2000
            }
          }
        );

        logger.info('Nightly validation job queued successfully');
      } catch (error) {
        logger.error('Failed to queue nightly validation', { error });
      }
    }
  );

  nightlyJob.start();
  logger.info('Nightly validation scheduled', {
    schedule: process.env.VALIDATION_NIGHTLY_CRON
  });
}

/**
 * Weekly Comprehensive Validation - 02:00 UTC Sunday
 */
export function scheduleWeeklyValidation(): void {
  const weeklyJob = cron.job(
    process.env.VALIDATION_WEEKLY_CRON || '0 2 ? * SUN',
    async () => {
      logger.info('Starting scheduled weekly validation run');

      try {
        await validationQueue.add(
          {
            type: 'comprehensive',
            triggerBy: 'scheduler-weekly',
            includePerformance: true,
            includeHistoricalAnalysis: true,
            timestamp: Date.now()
          },
          {
            priority: 7,
            attempts: 2,
            backoff: {
              type: 'exponential',
              delay: 2000
            }
          }
        );

        logger.info('Weekly validation job queued successfully');
      } catch (error) {
        logger.error('Failed to queue weekly validation', { error });
      }
    }
  );

  weeklyJob.start();
  logger.info('Weekly validation scheduled', {
    schedule: process.env.VALIDATION_WEEKLY_CRON
  });
}

/**
 * Monthly Trend Analysis - First Sunday 02:00 UTC
 */
export function scheduleMonthlyAnalysis(): void {
  const monthlyJob = cron.job(
    process.env.VALIDATION_MONTHLY_CRON || '0 2 ? * SUN#1',
    async () => {
      logger.info('Starting scheduled monthly trend analysis');

      try {
        await validationQueue.add(
          {
            type: 'monthly-analysis',
            triggerBy: 'scheduler-monthly',
            generateReport: true,
            trendPeriodDays: 30,
            timestamp: Date.now()
          },
          {
            priority: 3,
            attempts: 1
          }
        );

        logger.info('Monthly analysis job queued successfully');
      } catch (error) {
        logger.error('Failed to queue monthly analysis', { error });
      }
    }
  );

  monthlyJob.start();
  logger.info('Monthly analysis scheduled', {
    schedule: process.env.VALIDATION_MONTHLY_CRON
  });
}

/**
 * Initialize all scheduled validation jobs
 */
export function initializeScheduledValidation(): void {
  if (process.env.VALIDATION_SCHEDULE_ENABLED === 'true') {
    scheduleNightlyValidation();
    scheduleWeeklyValidation();
    scheduleMonthlyAnalysis();
    logger.info('All scheduled validation jobs initialized');
  } else {
    logger.info('Scheduled validation disabled via environment config');
  }
}
```

### Job Processing

```typescript
// Process validation jobs from queue
validationQueue.process(async (job) => {
  logger.info('Processing validation job', {
    jobId: job.id,
    type: job.data.type
  });

  try {
    const result = await framework.runValidation();

    // Update metrics
    framework.recordValidationRun(
      result.overallScore,
      job.progress() as number,
      result.overallScore < 70 ? 1 : 0
    );

    // Send notifications
    if (process.env.VALIDATION_NOTIFICATION_ENABLED === 'true') {
      await notifyCompletion(result);
    }

    return result;
  } catch (error) {
    logger.error('Validation job failed', {
      jobId: job.id,
      error: error instanceof Error ? error.message : String(error)
    });

    throw error; // Will retry per backoff config
  }
});

// Listen for job completion
validationQueue.on('completed', (job) => {
  logger.info('Validation job completed', {
    jobId: job.id,
    result: job.returnvalue
  });
});

// Listen for job failures
validationQueue.on('failed', (job, err) => {
  logger.error('Validation job permanently failed', {
    jobId: job.id,
    error: err.message,
    attempts: job.attemptsMade
  });
});
```

---

## CI/CD Pipeline Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/validation-on-pr.yml
name: Run Validation Framework on PR

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]

jobs:
  validation:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: fleet_db
          POSTGRES_USER: fleet_user
          POSTGRES_PASSWORD: fleet_password
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: |
          npm install --legacy-peer-deps
          cd api && npm install && cd ..

      - name: Run type checking
        run: npm run typecheck

      - name: Run linting
        run: npm run lint

      - name: Run unit tests
        run: npm test

      - name: Setup database
        env:
          DATABASE_URL: postgresql://fleet_user:fleet_password@localhost:5432/fleet_db
        run: |
          cd api
          npm run migrate
          cd ..

      - name: Run validation framework
        env:
          DATABASE_URL: postgresql://fleet_user:fleet_password@localhost:5432/fleet_db
          REDIS_URL: redis://localhost:6379
          SKIP_AUTH: true
          NODE_ENV: test
        run: |
          npm run validation:run -- \
            --scope full \
            --fail-on-critical true \
            --output ./validation-report.json

      - name: Upload validation report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: validation-report
          path: validation-report.json

      - name: Comment PR with results
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const report = JSON.parse(fs.readFileSync('./validation-report.json', 'utf8'));

            const comment = `## 🔍 Validation Framework Results

            **Quality Score:** ${report.qualityScore}/100
            **Critical Issues:** ${report.criticalCount}
            **High Issues:** ${report.highCount}
            **Validation Time:** ${report.executionTime}ms

            [View Full Report](https://github.com/${{ github.repository }}/actions/runs/${{ github.run_id }})
            `;

            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: comment
            });

      - name: Fail if critical issues
        if: failure()
        run: |
          echo "❌ Validation found critical issues"
          exit 1
```

### Pre-Deployment Validation

```yaml
# .github/workflows/validation-before-deploy.yml
name: Validate Before Deployment

on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Target environment'
        required: true
        default: 'staging'
        type: choice
        options:
          - staging
          - production

jobs:
  pre_deploy_validation:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: |
          npm install --legacy-peer-deps
          cd api && npm install && cd ..

      - name: Run comprehensive validation
        env:
          VALIDATION_SCOPE: comprehensive
          VALIDATION_FAIL_ON_CRITICAL: true
          DATABASE_URL: ${{ secrets[format('{0}_DATABASE_URL', github.event.inputs.environment)] }}
          REDIS_URL: ${{ secrets[format('{0}_REDIS_URL', github.event.inputs.environment)] }}
        run: |
          npm run validation:run -- \
            --scope comprehensive \
            --fail-on-critical true \
            --environment ${{ github.event.inputs.environment }}

      - name: Performance baseline check
        run: |
          npm run validation:performance-check -- \
            --baseline ./performance-baselines/${{ github.event.inputs.environment }}.json

      - name: Notify deployment team
        if: success()
        run: |
          echo "✅ Pre-deployment validation passed"
          echo "Safe to proceed with deployment"

      - name: Notify on failure
        if: failure()
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: "❌ Pre-deployment validation failed for ${{ github.event.inputs.environment }}"
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

---

## Scheduled Validation Cadence

### Daily Schedule (Optimized for Business Hours)

**Nightly Run (01:00 UTC / 8 PM EST):**
- Scope: Full validation
- Duration: 45-60 seconds
- Agents: All 6 running in parallel
- Report: Email summary + Slack notification
- Retention: 7 days

**Hourly Quick Check (Every Hour):**
- Scope: Quick (visual QA only)
- Duration: 10-15 seconds
- Agents: VisualQAAgent only
- Report: Dashboard update only
- Retention: 24 hours

### Weekly Schedule

**Comprehensive Run (Sunday 02:00 UTC):**
- Scope: Full + Performance analysis
- Duration: 2-3 minutes
- Includes: Resource utilization, trends
- Report: Full HTML report + Archives
- Retention: 90 days

### Monthly Schedule

**Trend Analysis (First Sunday 02:00 UTC):**
- Analyzes: Last 30 days of data
- Generates: Trend report, metrics summary
- Compares: Month-over-month
- Report: Executive summary + detailed analysis
- Retention: 1 year

---

## Automated Reporting

### Email Report Template

```html
<!-- Daily Validation Report -->
Subject: [FLEET] Validation Report - Feb 25, 2026

Dear Team,

Your daily validation framework report for February 25, 2026 is ready.

📊 Summary:
- Quality Score: 78.5/100 (↑ 2.3 from yesterday)
- Critical Issues: 0 (No change)
- High Issues: 3 (↓ 1 from yesterday)
- Validation Time: 47 seconds

🔴 Critical Issues: None

🟠 High Severity Issues:
1. ResponsiveDesignAgent: Button unresponsive on mobile (42px touch target)
2. TypographyAgent: Font size inconsistency in headers
3. DataIntegrityAgent: 2 orphaned vehicle records

💡 Recommendations:
- Address high-severity issues within 24 hours
- No action required for medium/low issues
- Quality score trend is positive

📈 Trend (Last 7 Days):
Avg Quality Score: 76.2 (trending up)
Issue Detection Rate: 14.2 per validation run

🔗 View Full Dashboard: http://fleet.internal/validation/dashboard
📋 View Detailed Report: http://reports.internal/validation/2026-02-25

Questions? Contact: validation-team@example.com
```

### Slack Notification Format

```json
{
  "text": "📊 Daily Validation Report",
  "attachments": [
    {
      "color": "#36a64f",
      "title": "Quality Score: 78.5/100",
      "title_link": "http://fleet.internal/validation/dashboard",
      "fields": [
        {
          "title": "Critical Issues",
          "value": "0",
          "short": true
        },
        {
          "title": "High Issues",
          "value": "3 ↓1",
          "short": true
        },
        {
          "title": "Validation Time",
          "value": "47 seconds",
          "short": true
        },
        {
          "title": "Trend",
          "value": "↑ Improving",
          "short": true
        }
      ],
      "actions": [
        {
          "type": "button",
          "text": "View Dashboard",
          "url": "http://fleet.internal/validation/dashboard"
        }
      ]
    }
  ]
}
```

---

## Issue Notification Workflow

### Automated Issue Escalation

```typescript
// api/src/jobs/issue-escalation.ts

async function escalateIssues(): Promise<void> {
  const issues = await issueRepository.getUnresolvedCriticalIssues();

  for (const issue of issues) {
    const hoursSinceCreation = (Date.now() - issue.createdAt) / (1000 * 60 * 60);

    // 0-4 hours: Slack notification
    if (hoursSinceCreation < 4) {
      await notifySlack(issue, 'dev-team');
    }

    // 4-8 hours: Email notification
    if (hoursSinceCreation >= 4 && hoursSinceCreation < 8) {
      await notifyEmail(issue, ['lead@example.com']);
    }

    // 8-24 hours: Escalate to manager
    if (hoursSinceCreation >= 8 && hoursSinceCreation < 24) {
      await notifyManager(issue);
    }

    // 24+ hours: PagerDuty incident
    if (hoursSinceCreation >= 24) {
      await createPagerDutyIncident(issue);
    }
  }
}
```

---

## Dashboard Auto-Refresh

### Real-Time Dashboard Updates

```typescript
// Frontend: src/pages/ValidationDashboard.tsx

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

export function ValidationDashboard() {
  // Refresh every 30 seconds
  const { data: status } = useQuery(
    ['validation-status'],
    () => fetch('/api/validation/status').then(r => r.json()),
    {
      refetchInterval: 30000,
      refetchOnWindowFocus: true,
      staleTime: 5000
    }
  );

  // WebSocket connection for real-time updates
  useEffect(() => {
    const ws = new WebSocket('wss://api.internal/api/validation/ws');

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'validation-complete') {
        queryClient.invalidateQueries(['validation-status']);
      }

      if (data.type === 'issue-detected') {
        // Update issues list in real-time
        queryClient.setQueryData(['issues'], (old: any) => ({
          ...old,
          issues: [data.issue, ...old.issues]
        }));
      }
    };

    return () => ws.close();
  }, []);

  return (
    <div className="dashboard">
      <h1>Validation Framework Status</h1>
      <QualityScoreGauge score={status?.qualityScore} />
      <AgentStatusGrid agents={status?.agents} />
      <IssuesList issues={status?.issues} />
    </div>
  );
}
```

---

## Batch Processing for Large Datasets

### Handling Large Validation Runs

```typescript
// api/src/validation/BatchValidator.ts

export class BatchValidator {
  private readonly BATCH_SIZE = 1000;
  private readonly CONCURRENT_BATCHES = 5;

  async runBatchValidation(itemIds: string[]): Promise<ValidationResult[]> {
    const batches = chunk(itemIds, this.BATCH_SIZE);
    const results: ValidationResult[] = [];

    for (let i = 0; i < batches.length; i += this.CONCURRENT_BATCHES) {
      const concurrentBatches = batches.slice(i, i + this.CONCURRENT_BATCHES);

      const batchResults = await Promise.all(
        concurrentBatches.map(batch =>
          this.validateBatch(batch)
        )
      );

      results.push(...batchResults.flat());

      // Update progress
      const progressPercent = (i + concurrentBatches.length) / batches.length * 100;
      logger.info(`Batch validation progress: ${progressPercent.toFixed(0)}%`);
    }

    return results;
  }

  private async validateBatch(itemIds: string[]): Promise<ValidationResult[]> {
    // Process batch without overwhelming system
    const results: ValidationResult[] = [];

    for (const itemId of itemIds) {
      const result = await this.validateItem(itemId);
      results.push(result);

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    return results;
  }
}
```

---

## Performance Optimization

### Caching Validation Results

```typescript
// api/src/validation/CachedValidator.ts

export class CachedValidator {
  private cache: Map<string, ValidationResult> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  async getValidationResult(component: string): Promise<ValidationResult> {
    const cached = this.cache.get(component);

    // Return cached if still valid
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      logger.debug('Cache hit for component', { component });
      return cached;
    }

    // Otherwise validate
    logger.debug('Cache miss for component', { component });
    const result = await this.validateComponent(component);

    // Store in cache
    this.cache.set(component, {
      ...result,
      timestamp: Date.now()
    });

    return result;
  }

  clearExpiredCache(): void {
    const now = Date.now();
    let cleared = 0;

    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.CACHE_TTL) {
        this.cache.delete(key);
        cleared++;
      }
    }

    if (cleared > 0) {
      logger.info('Cleared expired cache entries', { count: cleared });
    }
  }
}
```

### Query Optimization

```typescript
// API queries use indexes for performance

// Before - Full table scan
SELECT * FROM validation_runs WHERE severity = 'critical';

// After - Indexed query
SELECT * FROM validation_runs
WHERE severity = 'critical'
  AND timestamp > NOW() - INTERVAL '7 days'
ORDER BY timestamp DESC
LIMIT 100;

-- Index created for this query:
CREATE INDEX idx_validation_runs_severity_timestamp
  ON validation_runs(severity, timestamp DESC);
```

---

## Data Retention Policies

### Retention Schedule

| Data Type | Retention | Archive | Deletion |
|-----------|-----------|---------|----------|
| Daily reports | 7 days | S3 | Auto delete |
| Weekly reports | 90 days | S3 | Auto delete |
| Monthly reports | 1 year | Glacier | Auto delete |
| Raw metrics | 30 days | - | Auto delete |
| Critical issues | 1 year | S3 | Manual review |
| Issue history | 6 months | S3 | Auto delete |

### Cleanup Jobs

```typescript
// api/src/jobs/cleanup-scheduler.ts

export function scheduleCleanupJobs(): void {
  // Daily cleanup at 03:00 UTC
  cron.job('0 3 * * *', async () => {
    logger.info('Starting cleanup jobs');

    await cleanupOldReports();
    await archiveMetrics();
    await purgeExpiredData();

    logger.info('Cleanup jobs completed');
  }).start();
}

async function cleanupOldReports(): Promise<void> {
  const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days

  const result = await db.query(`
    DELETE FROM validation_runs
    WHERE timestamp < $1
  `, [cutoffDate]);

  logger.info('Cleaned old reports', {
    deletedCount: result.rowCount
  });
}
```

---

## Troubleshooting Automation

### Jobs Not Running

```bash
# Check cron job status
ps aux | grep "node.*validation"

# Check Bull job queue
redis-cli
> KEYS validation*
> HGETALL bull:validation:scheduled

# Check logs
tail -f api/logs/validation-combined.log

# Manually trigger validation
curl -X POST http://localhost:3001/api/validation/run \
  -H "Authorization: Bearer $TOKEN"
```

### Performance Issues

```bash
# Check if batches are processing
redis-cli
> HGETALL bull:validation:progress

# Monitor system resources
top -p $(pgrep -f "node.*api")

# Check database load
psql -c "SELECT query, calls, mean_time FROM pg_stat_statements ORDER BY mean_time DESC;"
```

---

## Documentation References

- [Validation Framework Guide](./VALIDATION-FRAMEWORK-GUIDE.md)
- [Deployment Procedures](./DEPLOYMENT-PROCEDURES.md)
- [Monitoring & Alerts](./MONITORING-AND-ALERTS.md)
