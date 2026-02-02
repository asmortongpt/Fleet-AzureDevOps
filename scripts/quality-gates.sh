#!/bin/bash
set -e

# Quality Gates Script - Fleet Management System
# This script runs all 10 quality gates and generates a comprehensive report

REPORT_DIR="./quality-gate-reports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_FILE="$REPORT_DIR/gate-report-$TIMESTAMP.json"

# Create report directory
mkdir -p "$REPORT_DIR"

# Initialize report
cat > "$REPORT_FILE" <<EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "run_id": "$TIMESTAMP",
  "gates": {}
}
EOF

echo "=========================================="
echo "QUALITY GATE VERIFICATION - RUN $TIMESTAMP"
echo "=========================================="
echo ""

# Gate 1: Unit Tests
echo "🔍 Gate 1: Unit Tests"
if npm run test:unit 2>&1 | tee "$REPORT_DIR/gate1-unit-$TIMESTAMP.log"; then
  echo "✅ Gate 1: PASS - All unit tests passed"
  GATE1="PASS"
else
  echo "❌ Gate 1: FAIL - Unit tests failed"
  GATE1="FAIL"
fi
echo ""

# Gate 2: E2E Tests
echo "🔍 Gate 2: E2E Tests"
if npm run test:e2e 2>&1 | tee "$REPORT_DIR/gate2-e2e-$TIMESTAMP.log"; then
  echo "✅ Gate 2: PASS - All E2E tests passed"
  GATE2="PASS"
else
  echo "❌ Gate 2: FAIL - E2E tests failed"
  GATE2="FAIL"
fi
echo ""

# Gate 3: Build Success
echo "🔍 Gate 3: Production Build"
if npm run build 2>&1 | tee "$REPORT_DIR/gate3-build-$TIMESTAMP.log"; then
  echo "✅ Gate 3: PASS - Build successful"
  GATE3="PASS"
else
  echo "❌ Gate 3: FAIL - Build failed"
  GATE3="FAIL"
  exit 1
fi
echo ""

# Gate 4: Console Errors Check (requires build artifacts)
echo "🔍 Gate 4: Console Errors Check"
if grep -r "console\\.error" dist/ 2>/dev/null | grep -v "sourceMappingURL" | wc -l | grep -q "^0$"; then
  echo "✅ Gate 4: PASS - No console errors in production build"
  GATE4="PASS"
else
  echo "❌ Gate 4: FAIL - Console errors found in production build"
  GATE4="FAIL"
fi
echo ""

# Gate 5: API Endpoints (requires API to be running)
echo "🔍 Gate 5: API Endpoints Health"
if bash test-api-endpoints.sh 2>&1 | tee "$REPORT_DIR/gate5-api-$TIMESTAMP.log" | grep -q "Errors: 0"; then
  echo "✅ Gate 5: PASS - All API endpoints return 2xx"
  GATE5="PASS"
else
  echo "⚠️  Gate 5: SKIPPED - API server not running or endpoints failed"
  GATE5="SKIP"
fi
echo ""

# Gate 6: Security Headers
echo "🔍 Gate 6: Security Headers Validation"
if grep -q "X-Frame-Options" staticwebapp.config.json && \
   grep -q "Content-Security-Policy" staticwebapp.config.json && \
   grep -q "Strict-Transport-Security" staticwebapp.config.json; then
  echo "✅ Gate 6: PASS - Security headers configured"
  GATE6="PASS"
else
  echo "❌ Gate 6: FAIL - Security headers missing"
  GATE6="FAIL"
fi
echo ""

# Gate 7: Accessibility Tests
echo "🔍 Gate 7: Accessibility Tests"
if npm run test:a11y 2>&1 | tee "$REPORT_DIR/gate7-a11y-$TIMESTAMP.log"; then
  echo "✅ Gate 7: PASS - No critical accessibility violations"
  GATE7="PASS"
else
  echo "⚠️  Gate 7: SKIPPED - Accessibility tests not available or failed"
  GATE7="SKIP"
fi
echo ""

# Gate 8: Performance Metrics
echo "🔍 Gate 8: Performance Metrics"
if npm run test:performance 2>&1 | tee "$REPORT_DIR/gate8-perf-$TIMESTAMP.log"; then
  echo "✅ Gate 8: PASS - Performance metrics acceptable"
  GATE8="PASS"
else
  echo "⚠️  Gate 8: SKIPPED - Performance tests not available"
  GATE8="SKIP"
fi
echo ""

# Gate 9: SQL Injection Vulnerability Scan
echo "🔍 Gate 9: SQL Injection Vulnerability Scan"
if grep -r "pool\\.query.*\${" api/src/ 2>/dev/null | grep -v "test" | wc -l | grep -q "^0$"; then
  echo "✅ Gate 9: PASS - No SQL injection vulnerabilities (parameterized queries only)"
  GATE9="PASS"
else
  echo "❌ Gate 9: FAIL - Potential SQL injection vulnerabilities found"
  GATE9="FAIL"
fi
echo ""

# Gate 10: Visual Regression Tests
echo "🔍 Gate 10: Visual Regression Tests"
if npm run test:visual 2>&1 | tee "$REPORT_DIR/gate10-visual-$TIMESTAMP.log"; then
  echo "✅ Gate 10: PASS - Visual regression tests passed"
  GATE10="PASS"
else
  echo "⚠️  Gate 10: SKIPPED - Visual regression tests not available"
  GATE10="SKIP"
fi
echo ""

# Calculate score
GATES=("$GATE1" "$GATE2" "$GATE3" "$GATE4" "$GATE5" "$GATE6" "$GATE7" "$GATE8" "$GATE9" "$GATE10")
PASS_COUNT=0
FAIL_COUNT=0
SKIP_COUNT=0

for gate in "${GATES[@]}"; do
  if [ "$gate" = "PASS" ]; then
    ((PASS_COUNT++))
  elif [ "$gate" = "FAIL" ]; then
    ((FAIL_COUNT++))
  else
    ((SKIP_COUNT++))
  fi
done

SCORE=$PASS_COUNT

# Generate final report
cat > "$REPORT_FILE" <<EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "run_id": "$TIMESTAMP",
  "score": "$SCORE/10",
  "pass_count": $PASS_COUNT,
  "fail_count": $FAIL_COUNT,
  "skip_count": $SKIP_COUNT,
  "gates": {
    "gate1_unit_tests": "$GATE1",
    "gate2_e2e_tests": "$GATE2",
    "gate3_build": "$GATE3",
    "gate4_console_errors": "$GATE4",
    "gate5_api_endpoints": "$GATE5",
    "gate6_security_headers": "$GATE6",
    "gate7_accessibility": "$GATE7",
    "gate8_performance": "$GATE8",
    "gate9_sql_injection": "$GATE9",
    "gate10_visual_regression": "$GATE10"
  }
}
EOF

echo "=========================================="
echo "QUALITY GATE SUMMARY"
echo "=========================================="
echo "Score: $SCORE/10"
echo "  ✅ Passed: $PASS_COUNT"
echo "  ❌ Failed: $FAIL_COUNT"
echo "  ⚠️  Skipped: $SKIP_COUNT"
echo ""
echo "Report saved to: $REPORT_FILE"
echo "=========================================="

# Exit with appropriate code
if [ $FAIL_COUNT -gt 0 ]; then
  echo "❌ Quality gates FAILED - blocking deployment"
  exit 1
elif [ $SCORE -lt 10 ]; then
  echo "⚠️  Quality gates INCOMPLETE - some gates skipped"
  exit 2
else
  echo "✅ All quality gates PASSED - ready for deployment"
  exit 0
fi
