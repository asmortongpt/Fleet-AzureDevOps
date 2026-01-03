#!/bin/bash

# Test all API endpoints
API_BASE="http://localhost:3001/api"

endpoints=(
  "vehicles"
  "drivers"
  "work-orders"
  "fuel-transactions"
  "routes"
  "facilities"
  "inspections"
  "incidents"
  "gps-tracks"
  "geofences"
  "maintenance-records"
  "maintenance-schedules"
  "parts"
  "vendors"
  "invoices"
  "purchase-orders"
  "tasks"
  "costs"
  "ev/chargers"
  "damage"
  "config"
  "feature-flags"
)

echo "=========================================="
echo "API Endpoint Health Check"
echo "=========================================="
echo ""

success_count=0
error_count=0

for endpoint in "${endpoints[@]}"; do
  printf "Testing %-30s ... " "/api/$endpoint"
  http_code=$(curl -s -o /dev/null -w "%{http_code}" "$API_BASE/$endpoint")

  if [ "$http_code" = "200" ]; then
    echo "✅ OK ($http_code)"
    ((success_count++))
  else
    echo "❌ FAILED ($http_code)"
    ((error_count++))
  fi
done

echo ""
echo "=========================================="
echo "Summary:"
echo "  ✅ Success: $success_count"
echo "  ❌ Errors: $error_count"
echo "=========================================="
