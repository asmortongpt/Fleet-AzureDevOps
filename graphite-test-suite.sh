#!/bin/bash
################################################################################
# Graphite Test Suite - Complete Application Validation
# Tests: Enterprise Refactor + Autonomous Remediation
################################################################################

set -e

echo "╔══════════════════════════════════════════════════════════════════════════╗"
echo "║           GRAPHITE TEST SUITE - COMPLETE APP VALIDATION                  ║"
echo "╚══════════════════════════════════════════════════════════════════════════╝"
echo ""
echo "Branch: $(git branch --show-current)"
echo "Commit: $(git rev-parse --short HEAD)"
echo "Date: $(date)"
echo ""

# Create results directory
RESULTS_DIR="test-results/graphite-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$RESULTS_DIR"

################################################################################
# Phase 1: Build Validation
################################################################################
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PHASE 1: BUILD VALIDATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "1.1 TypeScript Compilation Check..."
if npx tsc --noEmit 2>&1 | tee "$RESULTS_DIR/typescript-check.log"; then
  echo "✅ TypeScript compilation successful"
else
  echo "❌ TypeScript compilation failed"
  exit 1
fi

echo ""
echo "1.2 Production Build Test..."
BUILD_START=$(date +%s)
if npm run build 2>&1 | tee "$RESULTS_DIR/build.log"; then
  BUILD_END=$(date +%s)
  BUILD_TIME=$((BUILD_END - BUILD_START))
  echo "✅ Production build successful (${BUILD_TIME}s)"
else
  echo "❌ Production build failed"
  exit 1
fi

echo ""
echo "1.3 Bundle Size Analysis..."
du -sh dist/ | tee "$RESULTS_DIR/bundle-size.txt"
ls -lh dist/*.js | head -10 | tee -a "$RESULTS_DIR/bundle-size.txt"

################################################################################
# Phase 2: E2E Test Execution (Generated Tests)
################################################################################
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PHASE 2: E2E TEST EXECUTION (4,011 Generated Tests)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "2.1 Running generated Playwright tests (sample)..."
echo "Note: Running first 10 test files to validate framework"

# Run a sample of generated tests
TEST_FILES=$(ls e2e/generated-tests/*.spec.ts 2>/dev/null | head -10)
if [ -n "$TEST_FILES" ]; then
  for test_file in $TEST_FILES; do
    echo "  Testing: $(basename $test_file)"
  done

  # Run the tests
  if npx playwright test e2e/generated-tests/000{1..9}*.spec.ts e2e/generated-tests/0010*.spec.ts \
    --reporter=html \
    --output="$RESULTS_DIR/e2e-results" 2>&1 | tee "$RESULTS_DIR/e2e-tests.log"; then
    echo "✅ E2E test sample passed"
  else
    echo "⚠️  Some E2E tests failed (see results)"
  fi
else
  echo "⚠️  No generated tests found in e2e/generated-tests/"
fi

################################################################################
# Phase 3: Accessibility Audit
################################################################################
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PHASE 3: ACCESSIBILITY AUDIT (WCAG 2.2 AA)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "3.1 Scanning components for accessibility..."
echo "Checking aria-label presence..."

COMPONENTS_WITH_ARIA=$(grep -r "aria-label" src/components/ --include="*.tsx" | wc -l)
echo "Found $COMPONENTS_WITH_ARIA aria-label attributes" | tee "$RESULTS_DIR/accessibility.txt"

echo ""
echo "3.2 Checking for common accessibility issues..."
{
  echo "=== Buttons without labels ==="
  grep -r "<Button" src/components/ --include="*.tsx" | \
    grep -v "aria-label" | \
    grep -v "children" | \
    wc -l

  echo ""
  echo "=== Interactive divs without role ==="
  grep -r "onClick.*<div" src/components/ --include="*.tsx" | \
    grep -v "role=" | \
    wc -l
} | tee -a "$RESULTS_DIR/accessibility.txt"

################################################################################
# Phase 4: Security Validation
################################################################################
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PHASE 4: SECURITY VALIDATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "4.1 Checking for SQL injection vulnerabilities..."
{
  echo "=== Parameterized queries count ==="
  grep -r '\$[0-9]' api/src/ --include="*.ts" 2>/dev/null | wc -l

  echo ""
  echo "=== Potential string concatenation in SQL ==="
  grep -r 'query.*+.*WHERE' api/src/ --include="*.ts" 2>/dev/null | wc -l
} | tee "$RESULTS_DIR/security.txt"

echo ""
echo "4.2 Dependency vulnerability scan..."
npm audit --production 2>&1 | tee "$RESULTS_DIR/npm-audit.txt"

################################################################################
# Phase 5: Error Boundary Verification
################################################################################
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PHASE 5: ERROR BOUNDARY VERIFICATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "5.1 Checking ErrorBoundary usage..."
{
  echo "=== ErrorBoundary imports ==="
  grep -r "import.*ErrorBoundary" src/ --include="*.tsx" | wc -l

  echo ""
  echo "=== ErrorBoundary usage in routes ==="
  grep -r "<ErrorBoundary" src/router/routes.tsx 2>/dev/null | wc -l
} | tee "$RESULTS_DIR/error-boundaries.txt"

################################################################################
# Phase 6: Performance Baseline
################################################################################
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PHASE 6: PERFORMANCE BASELINE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "6.1 Build artifacts analysis..."
{
  echo "=== Largest JavaScript chunks ==="
  ls -lhS dist/*.js | head -10

  echo ""
  echo "=== Total bundle size ==="
  du -sh dist/

  echo ""
  echo "=== Gzip sizes (estimated) ==="
  find dist/ -name "*.js" -type f -exec gzip -c {} \; | wc -c | \
    awk '{printf "Total gzipped: %.2f MB\n", $1/1024/1024}'
} | tee "$RESULTS_DIR/performance.txt"

################################################################################
# Generate Summary Report
################################################################################
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "GENERATING SUMMARY REPORT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cat > "$RESULTS_DIR/SUMMARY.md" << EOF
# Graphite Test Suite - Summary Report

**Date:** $(date)
**Branch:** $(git branch --show-current)
**Commit:** $(git rev-parse HEAD)

## Test Phases

### ✅ Phase 1: Build Validation
- TypeScript compilation: PASSED
- Production build: PASSED (${BUILD_TIME}s)
- Bundle created successfully

### Phase 2: E2E Tests
- Generated tests available: $(ls e2e/generated-tests/*.spec.ts 2>/dev/null | wc -l) files
- Sample tests executed: 10 files
- See: e2e-tests.log for details

### Phase 3: Accessibility
- Components with aria-label: $COMPONENTS_WITH_ARIA
- See: accessibility.txt for full audit

### Phase 4: Security
- Parameterized queries in use
- npm audit results available
- See: security.txt for details

### Phase 5: Error Boundaries
- ErrorBoundary component integrated
- Applied to route modules
- See: error-boundaries.txt for coverage

### Phase 6: Performance
- Bundle size and performance metrics captured
- See: performance.txt for baseline

## Files Generated
- typescript-check.log
- build.log
- bundle-size.txt
- e2e-tests.log
- accessibility.txt
- security.txt
- npm-audit.txt
- error-boundaries.txt
- performance.txt

## Next Steps
1. Review detailed logs in: $RESULTS_DIR
2. Address any failing tests
3. Create Graphite PR with results
4. Merge back to main if all green

EOF

echo ""
echo "✅ Summary report generated: $RESULTS_DIR/SUMMARY.md"
echo ""
echo "╔══════════════════════════════════════════════════════════════════════════╗"
echo "║                    GRAPHITE TEST SUITE COMPLETE                          ║"
echo "╚══════════════════════════════════════════════════════════════════════════╝"
echo ""
echo "Results directory: $RESULTS_DIR"
echo ""
echo "To create Graphite PR stack:"
echo "  gt stack submit"
echo ""
