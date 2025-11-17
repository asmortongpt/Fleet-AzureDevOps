/**
 * Performance Budget Checker
 *
 * Validates benchmark results against defined performance budgets.
 * Exits with error code if critical budgets are exceeded.
 *
 * Run with: npm run bench:budget
 */

import fs from 'fs';
import path from 'path';

// ============================================================================
// Types
// ============================================================================

interface BudgetMetric {
  budget: number;
  unit: string;
  severity: 'critical' | 'warning';
  description: string;
  inverse?: boolean;
}

interface Budget {
  description: string;
  metrics: Record<string, BudgetMetric>;
}

interface PerformanceBudget {
  budgets: Record<string, Budget>;
  regressionThresholds: {
    warning: number;
    critical: number;
  };
}

interface BenchmarkResult {
  name: string;
  medianTime: number;
  meanTime: number;
  opsPerSecond: number;
}

// ============================================================================
// Load Files
// ============================================================================

const BUDGET_FILE = path.join(__dirname, '..', 'performance-budget.json');
const RESULTS_FILE = path.join(__dirname, 'reports', 'latest-results.json');

function loadBudget(): PerformanceBudget {
  try {
    const content = fs.readFileSync(BUDGET_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Failed to load budget file: ${BUDGET_FILE}`);
    process.exit(1);
  }
}

function loadResults(): { results: BenchmarkResult[] } {
  try {
    const content = fs.readFileSync(RESULTS_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Failed to load results file: ${RESULTS_FILE}`);
    console.error('Run benchmarks first with: npm run bench');
    process.exit(1);
  }
}

// ============================================================================
// Budget Checking
// ============================================================================

interface Violation {
  benchmark: string;
  metric: string;
  actual: number;
  budget: number;
  unit: string;
  severity: 'critical' | 'warning';
  exceeded: number;
  exceededPercent: number;
}

function checkBudgets(
  budget: PerformanceBudget,
  results: BenchmarkResult[]
): Violation[] {
  const violations: Violation[] = [];

  // Map benchmark names to budget metrics
  const benchmarkMap = new Map(results.map(r => [r.name, r]));

  // Check each budget category
  Object.entries(budget.budgets).forEach(([categoryName, category]) => {
    Object.entries(category.metrics).forEach(([metricName, metric]) => {
      // Try to find matching benchmark
      const matchingBenchmark = findMatchingBenchmark(metricName, benchmarkMap);

      if (matchingBenchmark) {
        const actual = matchingBenchmark.medianTime;
        const budgetValue = metric.budget;
        const inverse = metric.inverse || false;

        // Check if budget is exceeded
        const exceeded = inverse
          ? budgetValue - actual // For metrics where lower is worse (e.g., FPS)
          : actual - budgetValue;

        if (exceeded > 0) {
          const exceededPercent = (exceeded / budgetValue) * 100;

          violations.push({
            benchmark: matchingBenchmark.name,
            metric: metricName,
            actual,
            budget: budgetValue,
            unit: metric.unit,
            severity: metric.severity,
            exceeded,
            exceededPercent,
          });
        }
      }
    });
  });

  return violations;
}

function findMatchingBenchmark(
  metricName: string,
  benchmarks: Map<string, BenchmarkResult>
): BenchmarkResult | null {
  // Direct match
  if (benchmarks.has(metricName)) {
    return benchmarks.get(metricName)!;
  }

  // Fuzzy match - try to find by keywords
  const keywords = metricName.toLowerCase().split(/[-_]/);

  for (const [name, benchmark] of benchmarks) {
    const benchmarkLower = name.toLowerCase();
    if (keywords.every(kw => benchmarkLower.includes(kw))) {
      return benchmark;
    }
  }

  return null;
}

// ============================================================================
// Reporting
// ============================================================================

function printReport(violations: Violation[]): void {
  console.log('\n📊 Performance Budget Check\n');
  console.log('='.repeat(80));

  if (violations.length === 0) {
    console.log('\n✅ All benchmarks are within budget!\n');
    return;
  }

  const critical = violations.filter(v => v.severity === 'critical');
  const warnings = violations.filter(v => v.severity === 'warning');

  if (critical.length > 0) {
    console.log(`\n🔴 ${critical.length} CRITICAL budget violation(s):\n`);
    printViolations(critical);
  }

  if (warnings.length > 0) {
    console.log(`\n⚠️  ${warnings.length} WARNING budget violation(s):\n`);
    printViolations(warnings);
  }

  console.log('\n' + '='.repeat(80));
  console.log(`\nTotal violations: ${violations.length}`);
  console.log(`  Critical: ${critical.length}`);
  console.log(`  Warnings: ${warnings.length}\n`);
}

function printViolations(violations: Violation[]): void {
  console.log('┌─────────────────────────────────────┬──────────────┬──────────────┬────────────┐');
  console.log('│ Benchmark                           │ Actual       │ Budget       │ Exceeded   │');
  console.log('├─────────────────────────────────────┼──────────────┼──────────────┼────────────┤');

  violations.forEach(v => {
    const icon = v.severity === 'critical' ? '🔴' : '⚠️';
    const exceededStr = `+${v.exceededPercent.toFixed(1)}%`;

    console.log(
      `│ ${icon} ${v.benchmark.padEnd(32).substring(0, 32)} │ ` +
      `${formatValue(v.actual, v.unit).padStart(12)} │ ` +
      `${formatValue(v.budget, v.unit).padStart(12)} │ ` +
      `${exceededStr.padStart(10)} │`
    );
  });

  console.log('└─────────────────────────────────────┴──────────────┴──────────────┴────────────┘');
}

function formatValue(value: number, unit: string): string {
  if (unit === 'ms') {
    return `${value.toFixed(2)} ms`;
  } else if (unit === 'MB') {
    return `${value.toFixed(2)} MB`;
  } else if (unit === 'fps') {
    return `${value.toFixed(0)} fps`;
  } else if (unit === 'KB') {
    return `${value.toFixed(0)} KB`;
  } else if (unit === 'percent') {
    return `${value.toFixed(1)}%`;
  } else {
    return `${value.toFixed(2)} ${unit}`;
  }
}

// ============================================================================
// Main
// ============================================================================

function main(): void {
  console.log('Loading performance budget...');
  const budget = loadBudget();

  console.log('Loading benchmark results...');
  const { results } = loadResults();

  console.log(`Checking ${results.length} benchmarks against budget...`);

  const violations = checkBudgets(budget, results);

  printReport(violations);

  // Save report
  const reportPath = path.join(__dirname, 'reports', 'budget-report.json');
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        violations,
        passed: violations.length === 0,
        critical: violations.filter(v => v.severity === 'critical').length,
        warnings: violations.filter(v => v.severity === 'warning').length,
      },
      null,
      2
    )
  );

  console.log(`\n📄 Budget report saved to ${reportPath}\n`);

  // Exit with error if critical violations
  const criticalViolations = violations.filter(v => v.severity === 'critical');
  if (criticalViolations.length > 0) {
    console.error('❌ Critical performance budget violations detected!');
    console.error('Fix these issues before merging.\n');
    process.exit(1);
  }

  if (violations.length > 0) {
    console.warn('⚠️  Performance budget warnings detected.');
    console.warn('Consider optimizing these areas.\n');
    process.exit(0); // Don't fail on warnings
  }

  console.log('✅ All performance budgets passed!\n');
  process.exit(0);
}

// Run
if (require.main === module) {
  main();
}

export { checkBudgets, loadBudget, loadResults };
