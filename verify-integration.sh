#!/bin/bash

# Virtual Garage 3D Integration Verification Script
# Date: November 9, 2025
# Purpose: Verify all components of OSHA + 3D integration are properly installed

set -e

echo "======================================"
echo "Virtual Garage 3D Integration Verification"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track results
PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0

# Helper functions
pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASS_COUNT++))
}

fail() {
    echo -e "${RED}✗${NC} $1"
    ((FAIL_COUNT++))
}

warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARN_COUNT++))
}

info() {
    echo -e "  → $1"
}

section() {
    echo ""
    echo "===== $1 ====="
}

# 1. Check Frontend Files
section "Frontend Components"

if [ -f "src/components/modules/VirtualGarage.tsx" ]; then
    LINES=$(wc -l < "src/components/modules/VirtualGarage.tsx")
    if [ "$LINES" -gt 700 ]; then
        pass "VirtualGarage.tsx exists ($LINES lines)"
    else
        warn "VirtualGarage.tsx exists but seems incomplete ($LINES lines, expected 730+)"
    fi
else
    fail "VirtualGarage.tsx not found"
fi

if [ -f "src/components/modules/OSHAForms.tsx" ]; then
    if grep -q "handleViewIn3D" "src/components/modules/OSHAForms.tsx"; then
        pass "OSHAForms.tsx has 3D integration (handleViewIn3D found)"
    else
        fail "OSHAForms.tsx missing handleViewIn3D function"
    fi

    if grep -q "Cube" "src/components/modules/OSHAForms.tsx"; then
        pass "OSHAForms.tsx imports Cube icon"
    else
        fail "OSHAForms.tsx missing Cube icon import"
    fi
else
    fail "OSHAForms.tsx not found"
fi

if [ -f "src/lib/navigation.tsx" ]; then
    if grep -q "virtual-garage" "src/lib/navigation.tsx"; then
        pass "navigation.tsx includes virtual-garage menu item"
    else
        fail "navigation.tsx missing virtual-garage menu item"
    fi
else
    fail "navigation.tsx not found"
fi

if [ -f "src/App.tsx" ]; then
    if grep -q "VirtualGarage" "src/App.tsx"; then
        pass "App.tsx imports VirtualGarage component"
    else
        fail "App.tsx missing VirtualGarage import"
    fi

    if grep -q 'case "virtual-garage"' "src/App.tsx"; then
        pass "App.tsx has virtual-garage routing"
    else
        fail "App.tsx missing virtual-garage case in switch"
    fi
else
    fail "App.tsx not found"
fi

# 2. Check Backend Files
section "Backend API"

if [ -f "api/src/routes/damage-reports.ts" ]; then
    LINES=$(wc -l < "api/src/routes/damage-reports.ts")
    if [ "$LINES" -gt 230 ]; then
        pass "damage-reports.ts exists ($LINES lines)"
    else
        warn "damage-reports.ts exists but seems incomplete ($LINES lines)"
    fi

    # Check for all CRUD endpoints
    if grep -q "router.get('/'," "api/src/routes/damage-reports.ts"; then
        pass "GET / endpoint exists"
    else
        fail "GET / endpoint missing"
    fi

    if grep -q "router.post('/'," "api/src/routes/damage-reports.ts"; then
        pass "POST / endpoint exists"
    else
        fail "POST / endpoint missing"
    fi

    if grep -q "router.put('/:id'," "api/src/routes/damage-reports.ts"; then
        pass "PUT /:id endpoint exists"
    else
        fail "PUT /:id endpoint missing"
    fi

    if grep -q "router.delete('/:id'," "api/src/routes/damage-reports.ts"; then
        pass "DELETE /:id endpoint exists"
    else
        fail "DELETE /:id endpoint missing"
    fi
else
    fail "damage-reports.ts not found"
fi

if [ -f "api/src/server.ts" ]; then
    if grep -q "damageReportsRoutes" "api/src/server.ts"; then
        pass "server.ts imports damage-reports routes"
    else
        fail "server.ts missing damage-reports import"
    fi

    if grep -q "/api/damage-reports" "api/src/server.ts"; then
        pass "server.ts mounts damage-reports routes"
    else
        fail "server.ts missing damage-reports route mounting"
    fi
else
    fail "server.ts not found"
fi

# 3. Check Database Files
section "Database Schema"

if [ -f "database/schema.sql" ]; then
    if grep -q "CREATE TABLE damage_reports" "database/schema.sql"; then
        pass "schema.sql contains damage_reports table"

        # Check for required fields
        if grep -q "triposr_task_id" "database/schema.sql"; then
            pass "damage_reports has triposr_task_id field"
        else
            fail "damage_reports missing triposr_task_id field"
        fi

        if grep -q "triposr_status" "database/schema.sql"; then
            pass "damage_reports has triposr_status field"
        else
            fail "damage_reports missing triposr_status field"
        fi

        if grep -q "triposr_model_url" "database/schema.sql"; then
            pass "damage_reports has triposr_model_url field"
        else
            fail "damage_reports missing triposr_model_url field"
        fi
    else
        fail "schema.sql missing damage_reports table"
    fi
else
    fail "schema.sql not found"
fi

if [ -f "database/migrations/001_add_damage_reports.sql" ]; then
    pass "Migration script exists"
else
    warn "Migration script not found (may not be needed if schema.sql already applied)"
fi

# 4. Check Dependencies
section "NPM Dependencies"

if [ -f "package.json" ]; then
    if grep -q "@react-three/fiber" "package.json"; then
        pass "package.json includes @react-three/fiber"
    else
        fail "package.json missing @react-three/fiber dependency"
    fi

    if grep -q "@react-three/drei" "package.json"; then
        pass "package.json includes @react-three/drei"
    else
        fail "package.json missing @react-three/drei dependency"
    fi

    if grep -q "\"three\"" "package.json"; then
        pass "package.json includes three"
    else
        fail "package.json missing three dependency"
    fi

    if grep -q "react-dropzone" "package.json"; then
        pass "package.json includes react-dropzone"
    else
        fail "package.json missing react-dropzone dependency"
    fi
else
    fail "package.json not found"
fi

if [ -d "node_modules/@react-three/fiber" ]; then
    pass "React Three Fiber installed"
else
    warn "React Three Fiber not installed - run: npm install"
fi

if [ -d "node_modules/@react-three/drei" ]; then
    pass "@react-three/drei installed"
else
    warn "@react-three/drei not installed - run: npm install"
fi

if [ -d "node_modules/three" ]; then
    pass "Three.js installed"
else
    warn "Three.js not installed - run: npm install"
fi

# 5. Check Documentation
section "Documentation"

if [ -f "VIRTUAL_GARAGE_INTEGRATION_COMPLETE.md" ]; then
    pass "Integration documentation exists"
else
    warn "Integration documentation not found"
fi

if [ -f "TESTING_GUIDE_OSHA_3D.md" ]; then
    pass "Testing guide exists"
else
    warn "Testing guide not found"
fi

if [ -f "TRIPOSR_DEPLOYMENT_COMPLETE.md" ]; then
    pass "TripoSR deployment documentation exists"
else
    warn "TripoSR deployment documentation not found"
fi

# 6. Check File Structure
section "Directory Structure"

REQUIRED_DIRS=(
    "src/components/modules"
    "src/lib"
    "api/src/routes"
    "database"
)

for dir in "${REQUIRED_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        pass "Directory exists: $dir"
    else
        fail "Directory missing: $dir"
    fi
done

# 7. Code Quality Checks
section "Code Quality"

# Check for TypeScript syntax (basic check)
if [ -f "src/components/modules/VirtualGarage.tsx" ]; then
    if grep -q "export function VirtualGarage" "src/components/modules/VirtualGarage.tsx" || \
       grep -q "export const VirtualGarage" "src/components/modules/VirtualGarage.tsx"; then
        pass "VirtualGarage has proper export"
    else
        fail "VirtualGarage missing proper export statement"
    fi
fi

# Check for proper imports in OSHAForms
if [ -f "src/components/modules/OSHAForms.tsx" ]; then
    if grep -q 'import.*Cube.*@phosphor-icons/react' "src/components/modules/OSHAForms.tsx"; then
        pass "OSHAForms imports Cube icon correctly"
    else
        fail "OSHAForms has incorrect Cube icon import"
    fi
fi

# 8. Database Connection Check (optional)
section "Optional Checks"

if command -v psql &> /dev/null; then
    info "PostgreSQL client found"
    if [ ! -z "$DATABASE_URL" ]; then
        info "Attempting to check database..."
        if psql "$DATABASE_URL" -c "SELECT table_name FROM information_schema.tables WHERE table_name = 'damage_reports';" 2>/dev/null | grep -q "damage_reports"; then
            pass "damage_reports table exists in database"
        else
            warn "damage_reports table not found in database - run migration script"
        fi
    else
        info "DATABASE_URL not set, skipping database check"
    fi
else
    info "psql not found, skipping database check"
fi

# 9. TripoSR Service Check (optional)
if command -v kubectl &> /dev/null; then
    info "kubectl found, checking TripoSR service..."
    if kubectl get pods -n fleet-management -l app=triposr &> /dev/null; then
        POD_COUNT=$(kubectl get pods -n fleet-management -l app=triposr --no-headers 2>/dev/null | wc -l)
        if [ "$POD_COUNT" -gt 0 ]; then
            pass "TripoSR service found in AKS ($POD_COUNT pod(s))"
        else
            warn "TripoSR service not deployed to AKS yet"
        fi
    else
        info "Cannot connect to AKS cluster or fleet-management namespace"
    fi
else
    info "kubectl not found, skipping TripoSR service check"
fi

# 10. Summary
section "Summary"

echo ""
echo "======================================"
echo "VERIFICATION RESULTS"
echo "======================================"
echo -e "${GREEN}Passed:${NC}  $PASS_COUNT"
echo -e "${RED}Failed:${NC}  $FAIL_COUNT"
echo -e "${YELLOW}Warnings:${NC} $WARN_COUNT"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "${GREEN}✓ All critical checks passed!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Install dependencies: npm install"
    echo "2. Run database migration: psql -f database/migrations/001_add_damage_reports.sql"
    echo "3. Start dev server: npm run dev"
    echo "4. Follow testing guide: TESTING_GUIDE_OSHA_3D.md"
    exit 0
else
    echo -e "${RED}✗ Integration has critical issues${NC}"
    echo ""
    echo "Please fix the failed checks before proceeding."
    exit 1
fi
