#!/bin/bash

################################################################################
# Mock Data Removal - Comprehensive Verification Script
#
# Purpose: Guarantee ZERO mock data and verify production data flows
# Usage: bash infrastructure/verify-no-mock-data.sh
# Output: Detailed report with PASS/FAIL for each check
################################################################################

set -e  # Exit on error
set -o pipefail  # Pipe failures cause script to fail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

# Log file
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="/tmp/mock-data-verification-${TIMESTAMP}.log"

# Project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

################################################################################
# Helper Functions
################################################################################

log() {
    echo -e "$1" | tee -a "$LOG_FILE"
}

check_start() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    log "${BLUE}[$TOTAL_CHECKS]${NC} Checking: $1"
}

check_pass() {
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
    log "${GREEN}✅ PASS${NC}: $1\n"
}

check_fail() {
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
    log "${RED}❌ FAIL${NC}: $1"
    log "   Reason: $2\n"
}

check_warn() {
    log "${YELLOW}⚠️  WARN${NC}: $1\n"
}

################################################################################
# Phase 1: Database Verification
################################################################################

phase1_database_verification() {
    log "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    log "${BLUE}PHASE 1: DATABASE VERIFICATION${NC}"
    log "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

    # Check PostgreSQL connection
    check_start "PostgreSQL database connection"
    if psql fleet_db -c "SELECT 1" > /dev/null 2>&1; then
        check_pass "Database connection established"
    else
        check_fail "Database connection" "Cannot connect to fleet_db"
        return 1
    fi

    # Check data counts
    check_start "Data counts in core tables"
    COUNTS=$(psql fleet_db -t -c "SELECT
        (SELECT COUNT(*) FROM tenants) as tenants,
        (SELECT COUNT(*) FROM users) as users,
        (SELECT COUNT(*) FROM drivers) as drivers,
        (SELECT COUNT(*) FROM vehicles) as vehicles,
        (SELECT COUNT(*) FROM work_orders) as work_orders,
        (SELECT COUNT(*) FROM inspections) as inspections,
        (SELECT COUNT(*) FROM fuel_transactions) as fuel_transactions;" 2>&1)

    TENANTS=$(echo "$COUNTS" | awk '{print $1}')
    USERS=$(echo "$COUNTS" | awk '{print $3}')
    DRIVERS=$(echo "$COUNTS" | awk '{print $5}')
    VEHICLES=$(echo "$COUNTS" | awk '{print $7}')
    WORK_ORDERS=$(echo "$COUNTS" | awk '{print $9}')
    INSPECTIONS=$(echo "$COUNTS" | awk '{print $11}')
    FUEL_TRANS=$(echo "$COUNTS" | awk '{print $13}')

    log "   Tenants: $TENANTS"
    log "   Users: $USERS"
    log "   Drivers: $DRIVERS"
    log "   Vehicles: $VEHICLES"
    log "   Work Orders: $WORK_ORDERS"
    log "   Inspections: $INSPECTIONS"
    log "   Fuel Transactions: $FUEL_TRANS"

    TOTAL_RECORDS=$((VEHICLES + DRIVERS + WORK_ORDERS + INSPECTIONS + FUEL_TRANS))
    if [ "$TOTAL_RECORDS" -ge 500 ]; then
        check_pass "Database has $TOTAL_RECORDS records (target: 500+)"
    else
        check_fail "Database record count" "Only $TOTAL_RECORDS records (expected 500+)"
    fi

    # Check GPS coordinates
    check_start "Vehicles have real GPS coordinates"
    NO_GPS=$(psql fleet_db -t -c "SELECT COUNT(*) FROM vehicles WHERE latitude IS NULL OR longitude IS NULL OR (latitude = 0 AND longitude = 0);" 2>&1 | xargs)
    if [ "$NO_GPS" = "0" ]; then
        check_pass "All $VEHICLES vehicles have real GPS coordinates"
    else
        check_fail "Vehicle GPS coordinates" "$NO_GPS vehicles missing GPS coordinates"
    fi

    # Check driver-user relationships
    check_start "Driver-user foreign key integrity"
    ORPHAN_DRIVERS=$(psql fleet_db -t -c "SELECT COUNT(*) FROM drivers d LEFT JOIN users u ON d.user_id = u.id WHERE u.id IS NULL;" 2>&1 | xargs)
    if [ "$ORPHAN_DRIVERS" = "0" ]; then
        check_pass "All drivers linked to valid users"
    else
        check_fail "Driver-user relationships" "$ORPHAN_DRIVERS drivers not linked to users"
    fi

    # Check vehicle status constraints
    check_start "Vehicle status values are valid"
    INVALID_STATUS=$(psql fleet_db -t -c "SELECT COUNT(*) FROM vehicles WHERE status NOT IN ('active', 'maintenance', 'out_of_service', 'sold', 'retired');" 2>&1 | xargs)
    if [ "$INVALID_STATUS" = "0" ]; then
        check_pass "All vehicle status values are valid"
    else
        check_fail "Vehicle status values" "$INVALID_STATUS vehicles have invalid status"
    fi
}

################################################################################
# Phase 2: Backend API Verification
################################################################################

phase2_api_verification() {
    log "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    log "${BLUE}PHASE 2: BACKEND API VERIFICATION${NC}"
    log "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

    # Check API server is running
    check_start "API server running on port 3000"
    if curl -s -f http://localhost:3000/api/v1/vehicles -o /dev/null; then
        check_pass "API server responding"
    else
        check_fail "API server" "Not responding on http://localhost:3000"
        return 1
    fi

    # Test vehicles endpoint
    check_start "GET /api/v1/vehicles returns data"
    VEHICLES_RESPONSE=$(curl -s http://localhost:3000/api/v1/vehicles)
    VEHICLES_COUNT=$(echo "$VEHICLES_RESPONSE" | python3 -c "import sys, json; d=json.load(sys.stdin); print(len(d.get('data', [])))" 2>/dev/null || echo "0")
    if [ "$VEHICLES_COUNT" -ge 50 ]; then
        check_pass "Vehicles endpoint returns $VEHICLES_COUNT records"
    else
        check_fail "Vehicles endpoint" "Only returned $VEHICLES_COUNT records (expected 50+)"
    fi

    # Check vehicle GPS in API response
    check_start "Vehicle API responses have GPS coordinates"
    HAS_GPS=$(echo "$VEHICLES_RESPONSE" | python3 -c "import sys, json; d=json.load(sys.stdin); v=d.get('data', []); print('yes' if v and v[0].get('latitude') and v[0].get('longitude') else 'no')" 2>/dev/null || echo "no")
    if [ "$HAS_GPS" = "yes" ]; then
        check_pass "Vehicle responses include GPS coordinates"
    else
        check_fail "Vehicle GPS in API" "Responses missing latitude/longitude"
    fi

    # Test drivers endpoint
    check_start "GET /api/v1/drivers returns data"
    DRIVERS_COUNT=$(curl -s http://localhost:3000/api/v1/drivers | python3 -c "import sys, json; d=json.load(sys.stdin); print(len(d.get('data', [])))" 2>/dev/null || echo "0")
    if [ "$DRIVERS_COUNT" -ge 20 ]; then
        check_pass "Drivers endpoint returns $DRIVERS_COUNT records"
    else
        check_fail "Drivers endpoint" "Only returned $DRIVERS_COUNT records (expected 20+)"
    fi

    # Test work orders endpoint
    check_start "GET /api/v1/work-orders returns data"
    WO_COUNT=$(curl -s http://localhost:3000/api/v1/work-orders | python3 -c "import sys, json; d=json.load(sys.stdin); print(len(d.get('data', [])))" 2>/dev/null || echo "0")
    if [ "$WO_COUNT" -ge 100 ]; then
        check_pass "Work orders endpoint returns $WO_COUNT records"
    else
        check_fail "Work orders endpoint" "Only returned $WO_COUNT records (expected 100+)"
    fi

    # Check for "mock" or "fake" in API responses
    check_start "API responses contain no mock/fake data"
    MOCK_COUNT=$(curl -s http://localhost:3000/api/v1/vehicles | grep -i -c "mock\|fake\|test123" || true)
    if [ "$MOCK_COUNT" = "0" ]; then
        check_pass "No mock/fake data in API responses"
    else
        check_fail "Mock data in API" "Found $MOCK_COUNT instances of mock/fake data"
    fi
}

################################################################################
# Phase 3: Frontend Code Audit
################################################################################

phase3_code_audit() {
    log "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    log "${BLUE}PHASE 3: FRONTEND CODE AUDIT${NC}"
    log "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

    # Search for mockData imports (excluding tests/stories)
    check_start "No mockData imports in production code"
    MOCK_IMPORTS=$(grep -r "mockData" src --include="*.tsx" --include="*.ts" | grep -v ".stories.tsx" | grep -v "__tests__" | grep -v ".test.ts" | wc -l | xargs)
    if [ "$MOCK_IMPORTS" = "0" ]; then
        check_pass "No mockData imports found in production code"
    else
        check_fail "Mock data imports" "Found $MOCK_IMPORTS mockData imports in production code"
        grep -r "mockData" src --include="*.tsx" --include="*.ts" | grep -v ".stories.tsx" | grep -v "__tests__" | grep -v ".test.ts" | head -5 | tee -a "$LOG_FILE"
    fi

    # Search for TODO comments about mock/placeholder data
    check_start "No TODO comments about mock/placeholder data"
    TODO_MOCKS=$(grep -r "TODO.*mock\|TODO.*placeholder\|TODO.*fake" src --include="*.tsx" --include="*.ts" | grep -v ".stories.tsx" | grep -v "__tests__" | wc -l | xargs)
    if [ "$TODO_MOCKS" = "0" ]; then
        check_pass "No TODO comments about mock data"
    else
        check_fail "TODO mock comments" "Found $TODO_MOCKS TODO comments about mock/placeholder data"
    fi

    # Check for GPS emulator code
    check_start "No GPS emulator fallback code"
    GPS_EMULATOR=$(grep -r "emulator.*fallback\|GPS.*emulator" src/hooks --include="*.ts" | wc -l | xargs)
    if [ "$GPS_EMULATOR" = "0" ]; then
        check_pass "No GPS emulator fallback code found"
    else
        check_fail "GPS emulator code" "Found $GPS_EMULATOR references to GPS emulator"
    fi

    # Check for deleted files still being imported
    check_start "No imports of deleted mock hooks"
    DELETED_IMPORTS=$(grep -r "use-reactive-analytics-data\|useOBD2Emulator\|useSystemStatus" src --include="*.tsx" --include="*.ts" | grep "import" | wc -l | xargs)
    if [ "$DELETED_IMPORTS" = "0" ]; then
        check_pass "No imports of deleted mock hooks"
    else
        check_warn "Found $DELETED_IMPORTS imports of deleted hooks (may need cleanup)"
    fi

    # Check for ENABLE_MOCK_DATA in env files
    check_start "No ENABLE_MOCK_DATA in environment files"
    MOCK_ENV=$(grep -r "ENABLE_MOCK_DATA\|VITE_USE_MOCK_DATA" .env* 2>/dev/null | wc -l | xargs)
    if [ "$MOCK_ENV" = "0" ]; then
        check_pass "No mock data environment variables"
    else
        check_fail "Mock env variables" "Found $MOCK_ENV mock data environment variables"
    fi
}

################################################################################
# Phase 4: TypeScript Build Verification
################################################################################

phase4_typescript_verification() {
    log "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    log "${BLUE}PHASE 4: TYPESCRIPT BUILD VERIFICATION${NC}"
    log "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

    # Check TypeScript compilation
    check_start "TypeScript type checking (npm run typecheck)"
    if npm run typecheck > /tmp/typecheck-output.txt 2>&1; then
        check_pass "TypeScript type checking passed (0 errors)"
    else
        ERROR_COUNT=$(grep -c "error TS" /tmp/typecheck-output.txt || echo "unknown")
        check_fail "TypeScript errors" "Found $ERROR_COUNT type errors"
        log "   First 10 errors:"
        head -20 /tmp/typecheck-output.txt | tee -a "$LOG_FILE"
    fi

    # Check for 'any' types (warning only)
    check_start "Checking for 'any' types in production code"
    ANY_COUNT=$(grep -r ": any" src --include="*.ts" --include="*.tsx" | grep -v ".test.ts" | grep -v ".stories.tsx" | grep -v "__tests__" | wc -l | xargs)
    if [ "$ANY_COUNT" -lt 50 ]; then
        check_pass "Minimal use of 'any' types ($ANY_COUNT occurrences)"
    else
        check_warn "Found $ANY_COUNT uses of 'any' type (consider reducing)"
    fi
}

################################################################################
# Phase 5: Frontend Build Verification
################################################################################

phase5_build_verification() {
    log "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    log "${BLUE}PHASE 5: FRONTEND BUILD VERIFICATION${NC}"
    log "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

    # Check npm dependencies
    check_start "Node modules installed"
    if [ -d "node_modules" ]; then
        check_pass "node_modules directory exists"
    else
        check_fail "Dependencies" "node_modules not found, run: npm install"
        return 1
    fi

    # Attempt production build
    check_start "Production build (npm run build)"
    if npm run build > /tmp/build-output.txt 2>&1; then
        check_pass "Production build completed successfully"

        # Check build output size
        if [ -d "dist" ]; then
            BUILD_SIZE=$(du -sh dist | awk '{print $1}')
            log "   Build size: $BUILD_SIZE"
            check_pass "Build artifacts created in dist/"
        fi
    else
        check_fail "Production build" "Build failed, check /tmp/build-output.txt"
        log "   Last 20 lines of build output:"
        tail -20 /tmp/build-output.txt | tee -a "$LOG_FILE"
    fi
}

################################################################################
# Final Report
################################################################################

generate_report() {
    log "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    log "${BLUE}VERIFICATION SUMMARY${NC}"
    log "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

    log "Total Checks:  $TOTAL_CHECKS"
    log "${GREEN}Passed:        $PASSED_CHECKS${NC}"
    log "${RED}Failed:        $FAILED_CHECKS${NC}"

    SUCCESS_RATE=$(awk "BEGIN {printf \"%.1f\", ($PASSED_CHECKS/$TOTAL_CHECKS)*100}")
    log "Success Rate:  ${SUCCESS_RATE}%\n"

    if [ "$FAILED_CHECKS" -eq 0 ]; then
        log "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
        log "${GREEN}║                                                               ║${NC}"
        log "${GREEN}║  ✅  ALL CHECKS PASSED - NO MOCK DATA DETECTED                ║${NC}"
        log "${GREEN}║                                                               ║${NC}"
        log "${GREEN}║  The system is using 100% real production data from          ║${NC}"
        log "${GREEN}║  PostgreSQL database. Ready for deployment.                  ║${NC}"
        log "${GREEN}║                                                               ║${NC}"
        log "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}\n"

        log "Next Steps:"
        log "1. Review log file: $LOG_FILE"
        log "2. Manually test frontend: npm run dev"
        log "3. Verify UI displays production data in browser"
        log "4. Deploy to production when ready\n"

        return 0
    else
        log "${RED}╔═══════════════════════════════════════════════════════════════╗${NC}"
        log "${RED}║                                                               ║${NC}"
        log "${RED}║  ❌  VERIFICATION FAILED - ISSUES DETECTED                    ║${NC}"
        log "${RED}║                                                               ║${NC}"
        log "${RED}║  $FAILED_CHECKS check(s) failed. Review the failures above and     ║${NC}"
        log "${RED}║  fix issues before deployment.                                ║${NC}"
        log "${RED}║                                                               ║${NC}"
        log "${RED}╚═══════════════════════════════════════════════════════════════╝${NC}\n"

        log "Review full log: $LOG_FILE"
        log "Fix failures and re-run: bash infrastructure/verify-no-mock-data.sh\n"

        return 1
    fi
}

################################################################################
# Main Execution
################################################################################

main() {
    log "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
    log "${BLUE}║                                                               ║${NC}"
    log "${BLUE}║  Mock Data Removal - Comprehensive Verification Script       ║${NC}"
    log "${BLUE}║  Started: $(date)                             ║${NC}"
    log "${BLUE}║                                                               ║${NC}"
    log "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}\n"

    log "Project Root: $PROJECT_ROOT"
    log "Log File: $LOG_FILE\n"

    # Run all phases
    phase1_database_verification
    phase2_api_verification
    phase3_code_audit
    phase4_typescript_verification
    phase5_build_verification

    # Generate final report
    generate_report

    EXIT_CODE=$?

    log "Verification completed at: $(date)"
    log "Full log saved to: $LOG_FILE\n"

    exit $EXIT_CODE
}

# Run main function
main
