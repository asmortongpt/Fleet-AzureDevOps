#!/bin/bash

# ============================================================================
# VALIDATE ALL 5 ENDPOINTS WITH DATADOG AND CURSOR - NO SIMULATION
# ============================================================================

export DATADOG_API_KEY='ba1ff705ce2a02dd6271ad9acd9f7902'
export CURSOR_API_KEY='key_ce65a79afc7a70003e063568db8961baaf5a7021dda86ebf8be6aa6ac2ed858e'

PROJECT_ROOT="/Users/andrewmorton/Documents/GitHub/fleet-local"
VALIDATOR="$PROJECT_ROOT/deployment/validation/datadog-cursor-validation.py"

echo "================================================================================"
echo "🚀 VALIDATING ALL 5 ENDPOINTS WITH DATADOG AND CURSOR"
echo "================================================================================"
echo ""

# Array of endpoints to validate
declare -a ENDPOINTS=(
    "$PROJECT_ROOT/server/src/routes/work-orders.ts:/api/work-orders"
    "$PROJECT_ROOT/server/src/routes/fuel-transactions.ts:/api/fuel-transactions"
    "$PROJECT_ROOT/server/src/routes/routes.ts:/api/routes"
    "$PROJECT_ROOT/server/src/routes/maintenance.ts:/api/maintenance"
    "$PROJECT_ROOT/server/src/routes/inspections.ts:/api/inspections"
)

TOTAL=0
PASSED=0
FAILED=0

# Validate each endpoint
for endpoint_data in "${ENDPOINTS[@]}"; do
    IFS=':' read -r file_path endpoint <<< "$endpoint_data"

    echo "--------------------------------------------------------------------------------"
    echo "Testing: $(basename $file_path) → $endpoint"
    echo "--------------------------------------------------------------------------------"

    if python3 "$VALIDATOR" "$file_path" "$endpoint"; then
        echo "✅ PASSED"
        ((PASSED++))
    else
        echo "❌ FAILED"
        ((FAILED++))
    fi

    ((TOTAL++))
    echo ""
done

echo "================================================================================"
echo "📊 FINAL RESULTS"
echo "================================================================================"
echo "Total Endpoints: $TOTAL"
echo "✅ Passed: $PASSED"
echo "❌ Failed: $FAILED"
echo "Success Rate: $(awk "BEGIN {printf \"%.1f\", ($PASSED/$TOTAL)*100}")%"
echo "================================================================================"

if [ $FAILED -eq 0 ]; then
    echo "🎉 ALL ENDPOINTS VALIDATED SUCCESSFULLY!"
    exit 0
else
    echo "⚠️  Some endpoints need improvement"
    exit 1
fi
