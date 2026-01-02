#!/bin/bash

echo "=== Fleet Management System - API Verification ==="
echo ""
echo "Backend API: http://localhost:3001"
echo "Frontend App: http://localhost:5176"
echo "Google Maps API Key: <your-google-maps-api-key>"
echo ""
echo "Testing all endpoints:"
echo ""

endpoints=("health" "api/vehicles" "api/drivers" "api/work-orders" "api/fuel-transactions" "api/routes" "api/facilities" "api/inspections" "api/incidents")

for endpoint in "${endpoints[@]}"; do
  echo "Testing /$endpoint..."
  response=$(curl -s -w "\n%{http_code}" "http://localhost:3001/$endpoint")
  status_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | head -n-1)

  if [ "$status_code" = "200" ]; then
    echo "✅ $endpoint: SUCCESS"

    # Try to extract data count
    if echo "$body" | jq -e '.data' > /dev/null 2>&1; then
      count=$(echo "$body" | jq -r '.data | length')
      echo "   📊 Records: $count"
    elif echo "$body" | jq -e '.status' > /dev/null 2>&1; then
      status=$(echo "$body" | jq -r '.status')
      db=$(echo "$body" | jq -r '.database // empty')
      echo "   📊 Status: $status"
      [ -n "$db" ] && echo "   📊 Database: $db"
    fi
  else
    echo "❌ $endpoint: FAILED (HTTP $status_code)"
  fi

  echo ""
done

echo "=== Verification Complete ==="
