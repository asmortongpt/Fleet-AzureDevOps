#!/bin/bash

################################################################################
# Agent 3: Code Quality Reviewer
# Analyzes code complexity, test coverage, duplication, and technical debt
################################################################################

set -e

AGENT_NAME="Code Quality Reviewer"
OUTPUT_DIR="${OUTPUT_DIR:-/tmp/fleet-review-results}"
REPORT_FILE="$OUTPUT_DIR/03-code-quality-report.json"
REPO_DIR="${REPO_DIR:-/home/azurereviewer/fleet-review}"

mkdir -p "$OUTPUT_DIR"

log_info() { echo "[$(date +'%Y-%m-%d %H:%M:%S')] [INFO] $1"; }
log_error() { echo "[$(date +'%Y-%m-%d %H:%M:%S')] [ERROR] $1" >&2; }
log_success() { echo "[$(date +'%Y-%m-%d %H:%M:%S')] [SUCCESS] $1"; }

log_info "Starting $AGENT_NAME..."
cd "$REPO_DIR"

################################################################################
# Initialize Report
################################################################################

cat > "$REPORT_FILE" <<'INIT'
{
  "agent": "Code Quality Reviewer",
  "timestamp": "",
  "repository": "",
  "findings": {
    "critical": [],
    "high": [],
    "medium": [],
    "low": [],
    "info": []
  },
  "summary": {
    "totalIssues": 0,
    "criticalCount": 0,
    "highCount": 0,
    "mediumCount": 0,
    "lowCount": 0,
    "infoCount": 0
  },
  "metrics": {
    "complexity": {},
    "testCoverage": {},
    "duplication": {},
    "codeSmells": {}
  },
  "remediationTime": "0 hours"
}
INIT

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
jq --arg ts "$TIMESTAMP" --arg repo "$REPO_DIR" \
  '.timestamp = $ts | .repository = $repo' "$REPORT_FILE" > /tmp/tmp.$$ && mv /tmp/tmp.$$ "$REPORT_FILE"

################################################################################
# 1. ESLint Analysis
################################################################################

log_info "Running ESLint analysis..."

npm run lint -- --format json --output-file "$OUTPUT_DIR/eslint-report.json" 2>/dev/null || true

if [ -f "$OUTPUT_DIR/eslint-report.json" ]; then
  ESLINT_ERRORS=$(jq '[.[] | select(.errorCount > 0)] | length' "$OUTPUT_DIR/eslint-report.json" 2>/dev/null || echo "0")
  ESLINT_WARNINGS=$(jq '[.[] | select(.warningCount > 0)] | length' "$OUTPUT_DIR/eslint-report.json" 2>/dev/null || echo "0")

  log_info "ESLint: $ESLINT_ERRORS files with errors, $ESLINT_WARNINGS with warnings"

  if [ "$ESLINT_ERRORS" -gt 10 ]; then
    FINDING="{\"category\":\"linting\",\"severity\":\"high\",\"title\":\"Extensive ESLint violations\",\"description\":\"$ESLINT_ERRORS files have ESLint errors\",\"remediation\":\"Fix ESLint errors systematically. Configure pre-commit hooks to prevent new violations.\",\"effort\":\"16-24 hours\",\"file\":\"multiple\"}"
    jq --argjson f "$FINDING" '.findings.high += [$f]' "$REPORT_FILE" > /tmp/tmp.$$ && mv /tmp/tmp.$$ "$REPORT_FILE"
  fi
fi

################################################################################
# 2. TypeScript Strict Mode Check
################################################################################

log_info "Checking TypeScript configuration..."

if [ -f "tsconfig.json" ]; then
  STRICT=$(jq -r '.compilerOptions.strict // false' tsconfig.json)

  if [ "$STRICT" != "true" ]; then
    FINDING="{\"category\":\"typescript\",\"severity\":\"high\",\"title\":\"TypeScript strict mode disabled\",\"description\":\"TypeScript strict mode is not enabled, allowing unsafe type operations\",\"remediation\":\"Enable strict mode in tsconfig.json and fix type errors\",\"effort\":\"24-40 hours\",\"file\":\"tsconfig.json\",\"codeExample\":\"{\\n  \\\"compilerOptions\\\": {\\n    \\\"strict\\\": true,\\n    \\\"strictNullChecks\\\": true,\\n    \\\"noImplicitAny\\\": true\\n  }\\n}\"}"
    jq --argjson f "$FINDING" '.findings.high += [$f]' "$REPORT_FILE" > /tmp/tmp.$$ && mv /tmp/tmp.$$ "$REPORT_FILE"
  fi
fi

################################################################################
# 3. Complexity Analysis
################################################################################

log_info "Analyzing cyclomatic complexity..."

# Analyze with complexity-report
complexity-report src --format json > "$OUTPUT_DIR/complexity.json" 2>/dev/null || true

if [ -f "$OUTPUT_DIR/complexity.json" ]; then
  # Find functions with high complexity (>15)
  HIGH_COMPLEXITY=$(jq '[.. | objects | select(.complexity > 15)] | length' "$OUTPUT_DIR/complexity.json" 2>/dev/null || echo "0")

  if [ "$HIGH_COMPLEXITY" -gt 0 ]; then
    log_info "Found $HIGH_COMPLEXITY functions with complexity >15"

    FINDING="{\"category\":\"complexity\",\"severity\":\"medium\",\"title\":\"High cyclomatic complexity\",\"description\":\"$HIGH_COMPLEXITY functions have complexity >15, making them hard to test and maintain\",\"remediation\":\"Refactor complex functions into smaller, testable units. Target complexity <10.\",\"effort\":\"12-20 hours\",\"file\":\"multiple\",\"codeExample\":\"// Break down complex functions\\nfunction processVehicle(vehicle) {\\n  validateVehicle(vehicle)  // Extract validation\\n  const enriched = enrichVehicleData(vehicle)  // Extract enrichment\\n  return formatVehicleResponse(enriched)  // Extract formatting\\n}\"}"
    jq --argjson f "$FINDING" '.findings.medium += [$f]' "$REPORT_FILE" > /tmp/tmp.$$ && mv /tmp/tmp.$$ "$REPORT_FILE"
  fi

  AVG_COMPLEXITY=$(jq '.report.aggregate.complexity.cyclomatic // 0' "$OUTPUT_DIR/complexity.json" 2>/dev/null || echo "0")
  jq --argjson comp "{\"averageComplexity\":$AVG_COMPLEXITY,\"highComplexityFunctions\":$HIGH_COMPLEXITY}" \
    '.metrics.complexity = $comp' "$REPORT_FILE" > /tmp/tmp.$$ && mv /tmp/tmp.$$ "$REPORT_FILE"
fi

################################################################################
# 4. Code Duplication Analysis
################################################################################

log_info "Detecting code duplication..."

jscpd src --format json --output "$OUTPUT_DIR/duplication.json" 2>/dev/null || true

if [ -f "$OUTPUT_DIR/duplication.json" ]; then
  DUPLICATION_PCT=$(jq '.statistics.total.percentage // 0' "$OUTPUT_DIR/duplication.json" 2>/dev/null || echo "0")

  log_info "Code duplication: ${DUPLICATION_PCT}%"

  if (( $(echo "$DUPLICATION_PCT > 10" | bc -l) )); then
    FINDING="{\"category\":\"duplication\",\"severity\":\"medium\",\"title\":\"Excessive code duplication\",\"description\":\"${DUPLICATION_PCT}% of code is duplicated (threshold: 10%)\",\"remediation\":\"Extract duplicated code into reusable functions, components, or utilities.\",\"effort\":\"8-12 hours\",\"file\":\"multiple\",\"codeExample\":\"// Extract common patterns\\nexport function formatCurrency(amount: number) {\\n  return new Intl.NumberFormat('en-US', {\\n    style: 'currency',\\n    currency: 'USD'\\n  }).format(amount)\\n}\"}"
    jq --argjson f "$FINDING" '.findings.medium += [$f]' "$REPORT_FILE" > /tmp/tmp.$$ && mv /tmp/tmp.$$ "$REPORT_FILE"
  fi

  jq --argjson dup "{\"percentage\":$DUPLICATION_PCT}" \
    '.metrics.duplication = $dup' "$REPORT_FILE" > /tmp/tmp.$$ && mv /tmp/tmp.$$ "$REPORT_FILE"
fi

################################################################################
# 5. Test Coverage Analysis
################################################################################

log_info "Analyzing test coverage..."

# Run tests with coverage (if configured)
npm run test:coverage 2>&1 | tee "$OUTPUT_DIR/coverage-output.txt" || log_info "Coverage not available"

# Check for coverage reports
if [ -f "coverage/coverage-summary.json" ]; then
  COVERAGE=$(jq '.total.lines.pct // 0' coverage/coverage-summary.json)

  log_info "Test coverage: ${COVERAGE}%"

  if (( $(echo "$COVERAGE < 50" | bc -l) )); then
    FINDING="{\"category\":\"testing\",\"severity\":\"high\",\"title\":\"Insufficient test coverage\",\"description\":\"Test coverage is ${COVERAGE}% (minimum: 80%)\",\"remediation\":\"Write unit tests for critical business logic, integration tests for API endpoints, E2E tests for user flows.\",\"effort\":\"40-60 hours\",\"file\":\"tests/\",\"codeExample\":\"describe('VehicleService', () => {\\n  it('should create vehicle with valid data', async () => {\\n    const vehicle = await createVehicle(validData)\\n    expect(vehicle.id).toBeDefined()\\n    expect(vehicle.status).toBe('active')\\n  })\\n  \\n  it('should reject invalid VIN', async () => {\\n    await expect(createVehicle({ vin: 'INVALID' }))\\n      .rejects.toThrow('Invalid VIN format')\\n  })\\n})\"}"
    jq --argjson f "$FINDING" '.findings.high += [$f]' "$REPORT_FILE" > /tmp/tmp.$$ && mv /tmp/tmp.$$ "$REPORT_FILE"
  elif (( $(echo "$COVERAGE < 80" | bc -l) )); then
    FINDING="{\"category\":\"testing\",\"severity\":\"medium\",\"title\":\"Below target test coverage\",\"description\":\"Test coverage is ${COVERAGE}% (target: 80%)\",\"remediation\":\"Increase test coverage to 80%+ focusing on critical paths\",\"effort\":\"20-30 hours\",\"file\":\"tests/\"}"
    jq --argjson f "$FINDING" '.findings.medium += [$f]' "$REPORT_FILE" > /tmp/tmp.$$ && mv /tmp/tmp.$$ "$REPORT_FILE"
  fi

  jq --argjson cov "{\"linesCovered\":$COVERAGE}" \
    '.metrics.testCoverage = $cov' "$REPORT_FILE" > /tmp/tmp.$$ && mv /tmp/tmp.$$ "$REPORT_FILE"
else
  log_info "No coverage data found"

  FINDING="{\"category\":\"testing\",\"severity\":\"critical\",\"title\":\"No test coverage data\",\"description\":\"No test coverage reports found. Testing infrastructure may not be configured.\",\"remediation\":\"Set up Jest/Vitest with coverage reporting. Add npm script for test:coverage.\",\"effort\":\"8 hours\",\"file\":\"package.json\"}"
  jq --argjson f "$FINDING" '.findings.critical += [$f]' "$REPORT_FILE" > /tmp/tmp.$$ && mv /tmp/tmp.$$ "$REPORT_FILE"
fi

################################################################################
# 6. Code Smell Detection
################################################################################

log_info "Detecting code smells..."

CODE_SMELLS=0

# Long files (>500 lines)
LONG_FILES=$(find src -name "*.ts" -o -name "*.tsx" | while read f; do
  LINES=$(wc -l < "$f")
  if [ "$LINES" -gt 500 ]; then
    echo "$f:$LINES"
  fi
done | tee "$OUTPUT_DIR/long-files.txt" | wc -l)

if [ "$LONG_FILES" -gt 0 ]; then
  CODE_SMELLS=$((CODE_SMELLS + 1))
  FINDING="{\"category\":\"code-smell\",\"severity\":\"low\",\"title\":\"Overly long files\",\"description\":\"$LONG_FILES files exceed 500 lines\",\"remediation\":\"Split large files into smaller, focused modules\",\"effort\":\"6-10 hours\",\"file\":\"multiple\"}"
  jq --argjson f "$FINDING" '.findings.low += [$f]' "$REPORT_FILE" > /tmp/tmp.$$ && mv /tmp/tmp.$$ "$REPORT_FILE"
fi

# Long functions (>50 lines)
LONG_FUNCTIONS=$(grep -r "function\|const.*=" --include="*.ts" --include="*.tsx" src/ | \
  awk '/function|const.*=/ {file=$1; line=$2} /{/ {start=line} /}/ {if(line-start>50) print file":"start}' | \
  wc -l 2>/dev/null || echo "0")

if [ "$LONG_FUNCTIONS" -gt 5 ]; then
  CODE_SMELLS=$((CODE_SMELLS + 1))
  FINDING="{\"category\":\"code-smell\",\"severity\":\"low\",\"title\":\"Long functions detected\",\"description\":\"Multiple functions exceed 50 lines\",\"remediation\":\"Extract subfunctions for better readability and testability\",\"effort\":\"4-8 hours\",\"file\":\"multiple\"}"
  jq --argjson f "$FINDING" '.findings.low += [$f]' "$REPORT_FILE" > /tmp/tmp.$$ && mv /tmp/tmp.$$ "$REPORT_FILE"
fi

# Magic numbers
MAGIC_NUMBERS=$(grep -r "[0-9]\{3,\}" --include="*.ts" --include="*.tsx" src/ | \
  grep -v "test\|spec" | wc -l)

if [ "$MAGIC_NUMBERS" -gt 20 ]; then
  CODE_SMELLS=$((CODE_SMELLS + 1))
  FINDING="{\"category\":\"code-smell\",\"severity\":\"low\",\"title\":\"Magic numbers in code\",\"description\":\"Many hardcoded numeric values without explanation\",\"remediation\":\"Replace magic numbers with named constants\",\"effort\":\"2-4 hours\",\"file\":\"multiple\",\"codeExample\":\"// Bad\\nif (timeout > 3000) { ... }\\n\\n// Good\\nconst MAX_REQUEST_TIMEOUT_MS = 3000\\nif (timeout > MAX_REQUEST_TIMEOUT_MS) { ... }\"}"
  jq --argjson f "$FINDING" '.findings.low += [$f]' "$REPORT_FILE" > /tmp/tmp.$$ && mv /tmp/tmp.$$ "$REPORT_FILE"
fi

# Console.log statements (potential debug code)
DEBUG_LOGS=$(grep -rc "console\\.log\|console\\.debug" --include="*.ts" --include="*.tsx" src/ | \
  awk -F: '{sum+=$2} END {print sum}')

if [ "$DEBUG_LOGS" -gt 10 ]; then
  CODE_SMELLS=$((CODE_SMELLS + 1))
  FINDING="{\"category\":\"code-smell\",\"severity\":\"low\",\"title\":\"Debug console statements in code\",\"description\":\"$DEBUG_LOGS console.log/debug statements found\",\"remediation\":\"Remove or replace with proper logging framework\",\"effort\":\"2 hours\",\"file\":\"multiple\",\"codeExample\":\"// Use proper logging\\nimport { logger } from '@/lib/logger'\\n\\nlogger.debug('Vehicle processed', { vehicleId })\"}"
  jq --argjson f "$FINDING" '.findings.low += [$f]' "$REPORT_FILE" > /tmp/tmp.$$ && mv /tmp/tmp.$$ "$REPORT_FILE"
fi

log_info "Code smells detected: $CODE_SMELLS categories"

jq --argjson smells "{\"totalCategories\":$CODE_SMELLS}" \
  '.metrics.codeSmells = $smells' "$REPORT_FILE" > /tmp/tmp.$$ && mv /tmp/tmp.$$ "$REPORT_FILE"

################################################################################
# 7. Documentation Coverage
################################################################################

log_info "Checking documentation coverage..."

# Count functions/classes with JSDoc
TOTAL_FUNCTIONS=$(grep -rc "^function\|^export function\|^const.*=.*=>" --include="*.ts" src/ | \
  awk -F: '{sum+=$2} END {print sum}')

DOCUMENTED=$(grep -rB1 "^/\*\*" --include="*.ts" src/ | grep -c "function\|const.*=" || echo "0")

if [ "$TOTAL_FUNCTIONS" -gt 0 ]; then
  DOC_PCT=$((DOCUMENTED * 100 / TOTAL_FUNCTIONS))
  log_info "Documentation coverage: ${DOC_PCT}%"

  if [ "$DOC_PCT" -lt 50 ]; then
    FINDING="{\"category\":\"documentation\",\"severity\":\"medium\",\"title\":\"Poor documentation coverage\",\"description\":\"Only ${DOC_PCT}% of functions have JSDoc comments\",\"remediation\":\"Add JSDoc comments to public functions and complex logic\",\"effort\":\"8-12 hours\",\"file\":\"multiple\",\"codeExample\":\"/**\\n * Creates a new vehicle in the fleet\\n * @param vehicleData - Vehicle information\\n * @returns Created vehicle with ID\\n * @throws {ValidationError} If VIN is invalid\\n */\\nexport async function createVehicle(vehicleData: VehicleInput): Promise<Vehicle> { ... }\"}"
    jq --argjson f "$FINDING" '.findings.medium += [$f]' "$REPORT_FILE" > /tmp/tmp.$$ && mv /tmp/tmp.$$ "$REPORT_FILE"
  fi
fi

################################################################################
# 8. Calculate Summary
################################################################################

jq '
  .summary.criticalCount = (.findings.critical | length) |
  .summary.highCount = (.findings.high | length) |
  .summary.mediumCount = (.findings.medium | length) |
  .summary.lowCount = (.findings.low | length) |
  .summary.infoCount = (.findings.info | length) |
  .summary.totalIssues = (.summary.criticalCount + .summary.highCount + .summary.mediumCount + .summary.lowCount + .summary.infoCount)
' "$REPORT_FILE" > /tmp/tmp.$$ && mv /tmp/tmp.$$ "$REPORT_FILE"

TOTAL_EFFORT=0
for severity in critical high medium low; do
  EFFORT=$(jq -r ".findings.$severity[].effort // \"0 hours\"" "$REPORT_FILE" | \
    sed 's/[^0-9]*//g' | awk '{sum+=$1} END {print sum}')
  TOTAL_EFFORT=$((TOTAL_EFFORT + EFFORT))
done

jq --arg time "$TOTAL_EFFORT hours" \
  '.remediationTime = $time' "$REPORT_FILE" > /tmp/tmp.$$ && mv /tmp/tmp.$$ "$REPORT_FILE"

################################################################################
# Summary
################################################################################

CRITICAL=$(jq '.summary.criticalCount' "$REPORT_FILE")
HIGH=$(jq '.summary.highCount' "$REPORT_FILE")
MEDIUM=$(jq '.summary.mediumCount' "$REPORT_FILE")
LOW=$(jq '.summary.lowCount' "$REPORT_FILE")
TOTAL=$(jq '.summary.totalIssues' "$REPORT_FILE")

log_success "Code quality review complete!"
echo "----------------------------------------"
echo "Code Quality Summary:"
echo "  Critical: $CRITICAL"
echo "  High: $HIGH"
echo "  Medium: $MEDIUM"
echo "  Low: $LOW"
echo "  Total Issues: $TOTAL"
echo "  Estimated Remediation: $TOTAL_EFFORT hours"
echo "----------------------------------------"
echo "Report saved to: $REPORT_FILE"

exit 0
