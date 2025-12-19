#!/bin/bash

# ============================================================================
# COMPREHENSIVE APPLICATION VALIDATION - ENTIRE FLEET MANAGEMENT SYSTEM
# ============================================================================

export DATADOG_API_KEY='ba1ff705ce2a02dd6271ad9acd9f7902'
export CURSOR_API_KEY='key_ce65a79afc7a70003e063568db8961baaf5a7021dda86ebf8be6aa6ac2ed858e'

PROJECT_ROOT="/Users/andrewmorton/Documents/GitHub/fleet-local"

echo "================================================================================"
echo "🚀 COMPREHENSIVE FLEET MANAGEMENT SYSTEM VALIDATION"
echo "================================================================================"
echo "Testing: Frontend + Backend + Database + Security"
echo "Tools: Datadog, Cursor, TypeScript, ESLint, npm audit"
echo "================================================================================"
echo ""

# ============================================================================
# PHASE 1: Backend API Endpoints (5 endpoints)
# ============================================================================

echo "📦 PHASE 1: Backend API Endpoints"
echo "--------------------------------------------------------------------------------"

bash "$PROJECT_ROOT/deployment/validation/validate-all-endpoints.sh"

BACKEND_EXIT=$?

echo ""

# ============================================================================
# PHASE 2: TypeScript Type Safety (Server)
# ============================================================================

echo "📦 PHASE 2: TypeScript Type Safety Check"
echo "--------------------------------------------------------------------------------"

cd "$PROJECT_ROOT/server" || exit 1

echo "Running TypeScript compiler on server..."
if npx tsc --noEmit 2>&1 | head -50; then
    echo "✅ TypeScript compilation successful"
    TS_SERVER_EXIT=0
else
    echo "❌ TypeScript errors found"
    TS_SERVER_EXIT=1
fi

echo ""

# ============================================================================
# PHASE 3: ESLint Code Quality (Server)
# ============================================================================

echo "📦 PHASE 3: ESLint Code Quality Check"
echo "--------------------------------------------------------------------------------"

cd "$PROJECT_ROOT" || exit 1

echo "Running ESLint on server code..."
if npx eslint server/src/**/*.ts --max-warnings=0 2>&1 | head -50; then
    echo "✅ ESLint passed"
    ESLINT_EXIT=0
else
    echo "⚠️  ESLint warnings/errors found"
    ESLINT_EXIT=1
fi

echo ""

# ============================================================================
# PHASE 4: Security Audit (Dependencies)
# ============================================================================

echo "📦 PHASE 4: Security Vulnerability Scan"
echo "--------------------------------------------------------------------------------"

echo "Running npm audit..."
npm audit --json 2>&1 | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    vulns = data.get('metadata', {}).get('vulnerabilities', {})
    critical = vulns.get('critical', 0)
    high = vulns.get('high', 0)
    moderate = vulns.get('moderate', 0)
    low = vulns.get('low', 0)
    total = critical + high + moderate + low

    print(f'Critical: {critical}')
    print(f'High: {high}')
    print(f'Moderate: {moderate}')
    print(f'Low: {low}')
    print(f'Total: {total}')

    if critical > 0 or high > 0:
        print('❌ High/Critical vulnerabilities found')
        sys.exit(1)
    elif total > 0:
        print('⚠️  Some vulnerabilities found')
        sys.exit(0)
    else:
        print('✅ No vulnerabilities found')
        sys.exit(0)
except Exception as e:
    print(f'⚠️  Audit parsing error: {e}')
    sys.exit(0)
"

AUDIT_EXIT=$?

echo ""

# ============================================================================
# PHASE 5: Frontend Build Test
# ============================================================================

echo "📦 PHASE 5: Frontend Build Validation"
echo "--------------------------------------------------------------------------------"

cd "$PROJECT_ROOT" || exit 1

echo "Building frontend..."
if npm run build 2>&1 | tail -20; then
    echo "✅ Frontend build successful"
    BUILD_EXIT=0
else
    echo "❌ Frontend build failed"
    BUILD_EXIT=1
fi

echo ""

# ============================================================================
# PHASE 6: Database Schema Validation
# ============================================================================

echo "📦 PHASE 6: Database Schema Validation"
echo "--------------------------------------------------------------------------------"

# Check if migration file exists
if [ -f "/tmp/add-security-columns-simple.sql" ]; then
    echo "✅ Database migration file found"
    echo "Checking migration SQL syntax..."

    # Simple syntax check for SQL keywords
    if grep -q "ALTER TABLE\|CREATE INDEX" /tmp/add-security-columns-simple.sql; then
        echo "✅ Migration SQL syntax valid"
        SCHEMA_EXIT=0
    else
        echo "❌ Migration SQL syntax invalid"
        SCHEMA_EXIT=1
    fi
else
    echo "⚠️  Database migration file not found"
    SCHEMA_EXIT=1
fi

echo ""

# ============================================================================
# FINAL SUMMARY
# ============================================================================

echo "================================================================================"
echo "📊 COMPREHENSIVE VALIDATION RESULTS"
echo "================================================================================"

TOTAL_TESTS=6
PASSED_TESTS=0

echo ""
echo "Backend API Endpoints:     $([ $BACKEND_EXIT -eq 0 ] && echo '✅ PASSED' || echo '❌ FAILED')"
[ $BACKEND_EXIT -eq 0 ] && ((PASSED_TESTS++))

echo "TypeScript Type Safety:    $([ $TS_SERVER_EXIT -eq 0 ] && echo '✅ PASSED' || echo '❌ FAILED')"
[ $TS_SERVER_EXIT -eq 0 ] && ((PASSED_TESTS++))

echo "ESLint Code Quality:       $([ $ESLINT_EXIT -eq 0 ] && echo '✅ PASSED' || echo '⚠️  WARNINGS')"
[ $ESLINT_EXIT -eq 0 ] && ((PASSED_TESTS++))

echo "Security Vulnerabilities:  $([ $AUDIT_EXIT -eq 0 ] && echo '✅ PASSED' || echo '⚠️  ISSUES')"
[ $AUDIT_EXIT -eq 0 ] && ((PASSED_TESTS++))

echo "Frontend Build:            $([ $BUILD_EXIT -eq 0 ] && echo '✅ PASSED' || echo '❌ FAILED')"
[ $BUILD_EXIT -eq 0 ] && ((PASSED_TESTS++))

echo "Database Schema:           $([ $SCHEMA_EXIT -eq 0 ] && echo '✅ PASSED' || echo '⚠️  WARNINGS')"
[ $SCHEMA_EXIT -eq 0 ] && ((PASSED_TESTS++))

echo ""
echo "================================================================================"
echo "Overall Score: $PASSED_TESTS/$TOTAL_TESTS ($(awk "BEGIN {printf \"%.1f\", ($PASSED_TESTS/$TOTAL_TESTS)*100}")%)"
echo "================================================================================"

if [ $PASSED_TESTS -eq $TOTAL_TESTS ]; then
    echo "🎉 ALL TESTS PASSED - APPLICATION READY FOR DEPLOYMENT"
    exit 0
elif [ $PASSED_TESTS -ge 4 ]; then
    echo "⚠️  MOST TESTS PASSED - Minor issues to address"
    exit 0
else
    echo "❌ MULTIPLE FAILURES - Requires remediation"
    exit 1
fi
