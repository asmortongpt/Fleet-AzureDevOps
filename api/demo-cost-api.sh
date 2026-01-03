#!/bin/bash

# Cost Emulator API Demonstration Script
# This script demonstrates all the Cost API endpoints

API_URL="http://localhost:3001/api/costs"

echo "🚀 Cost Emulator API Demo"
echo "=========================="
echo ""

# 1. Get all costs with pagination
echo "1. Getting recent costs (page 1, 10 items)..."
curl -s "$API_URL?page=1&pageSize=10" | jq '{
  total: .pagination.total,
  totalAmount: .summary.totalAmount,
  firstCost: .data[0] | {id, category, amount, description, vendorName}
}' 2>/dev/null || echo "  ❌ Server not running. Start with: npm start"

echo ""

# 2. Get costs for a specific vehicle
echo "2. Getting costs for Vehicle 1..."
curl -s "$API_URL/vehicle/1" | jq '{
  vehicleId: .vehicleSummary.vehicleId,
  totalCost: .vehicleSummary.totalCost,
  costCount: .vehicleSummary.costCount,
  topCategory: .vehicleSummary.categoryBreakdown[0]
}' 2>/dev/null || echo "  ❌ Server not running"

echo ""

# 3. Get cost analytics
echo "3. Getting cost analytics..."
curl -s "$API_URL/analytics" | jq '{
  totalCosts: .analytics.totalCosts,
  costPerMile: .analytics.costPerMile,
  costPerVehicle: .analytics.costPerVehicle,
  topCategory: .analytics.topExpenseCategories[0],
  forecast: {
    nextMonth: .forecast.nextMonth,
    confidence: .forecast.confidence
  }
}' 2>/dev/null || echo "  ❌ Server not running"

echo ""

# 4. Get budget tracking
echo "4. Getting budget status for current month..."
curl -s "$API_URL/budget" | jq '{
  currentMonth: .data[0].month,
  totalBudgeted: .data[0].totalBudgeted,
  totalActual: .data[0].totalActual,
  overallStatus: .data[0].overallStatus,
  categoriesOverBudget: [.data[0].categories[] | select(.status == "over") | {category, variancePercent}]
}' 2>/dev/null || echo "  ❌ Server not running"

echo ""

# 5. Get budget alerts
echo "5. Getting budget alerts..."
curl -s "$API_URL/budget/alerts" | jq '{
  totalAlerts: .summary.totalAlerts,
  overBudgetCount: .summary.overBudgetCount,
  topAlert: .alerts[0]
}' 2>/dev/null || echo "  ❌ Server not running"

echo ""

# 6. Get department analysis
echo "6. Getting department cost breakdown..."
curl -s "$API_URL/department-analysis" | jq '{
  totalCost: .totalCost,
  topDepartments: .departments[0:3]
}' 2>/dev/null || echo "  ❌ Server not running"

echo ""

# 7. Get vendor analysis
echo "7. Getting top vendors by spend..."
curl -s "$API_URL/vendor-analysis?limit=5" | jq '{
  totalVendors: .summary.totalVendors,
  topVendor: .vendors[0],
  averagePerVendor: .summary.averagePerVendor
}' 2>/dev/null || echo "  ❌ Server not running"

echo ""

# 8. Get dashboard summary
echo "8. Getting dashboard summary..."
curl -s "$API_URL/dashboard" | jq '{
  currentMonth: .currentMonth,
  yearToDate: .yearToDate,
  budget: .budget,
  forecast: .forecast
}' 2>/dev/null || echo "  ❌ Server not running"

echo ""

# 9. Create a new cost entry
echo "9. Creating a new cost entry..."
NEW_COST=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "vehicleId": 5,
    "category": "fuel",
    "amount": 92.75,
    "date": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'",
    "description": "API Demo - Fuel Purchase",
    "vendorName": "Demo Gas Station",
    "department": "Operations",
    "paymentMethod": "fleet_card"
  }' 2>/dev/null)

if [ ! -z "$NEW_COST" ]; then
  echo "$NEW_COST" | jq '{
    message: .message,
    newCostId: .data.id,
    amount: .data.amount,
    vendor: .data.vendorName
  }'
else
  echo "  ❌ Server not running"
fi

echo ""
echo "=========================="
echo "✅ Demo Complete!"
echo ""
echo "To export costs as CSV:"
echo "  curl '$API_URL/export' -o costs.csv"
echo ""
echo "To filter costs by category:"
echo "  curl '$API_URL?category=fuel&pageSize=20'"
echo ""
echo "To get costs for a date range:"
echo "  curl '$API_URL?startDate=2025-11-01&endDate=2025-11-30'"