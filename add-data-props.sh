#!/bin/bash

# Add data?: any prop to component interfaces that need it
# This fixes TS2322 errors where components are passed a data prop

set -e

echo "🔧 Adding data props to component interfaces..."

# Get list of components that are called with data prop from App.tsx errors
components_needing_data=(
  "src/components/FleetDashboard.tsx:FleetDashboardProps"
  "src/components/modules/FleetMonitoring.tsx:FleetMonitoringProps"
  "src/components/modules/DispatchConsole.tsx:DispatchConsoleProps"
  "src/components/modules/RouteOptimization.tsx:RouteOptimizationProps"
  "src/components/modules/DriverPerformance.tsx:DriverPerformanceProps"
  "src/components/modules/VehicleTracking.tsx:VehicleTrackingProps"
  "src/components/modules/MaintenanceManager.tsx:MaintenanceManagerProps"
  "src/components/modules/AssetManagement.tsx:AssetManagementProps"
  "src/components/modules/FuelManagement.tsx:FuelManagementProps"
  "src/components/modules/PeopleManagement.tsx:PeopleManagementProps"
)

fixed=0

for entry in "${components_needing_data[@]}"; do
  IFS=':' read -r file interface <<< "$entry"

  if [ ! -f "$file" ]; then
    echo "⚠️  Skipping $file (not found)"
    continue
  fi

  # Check if interface exists and doesn't already have data prop
  if grep -q "interface $interface" "$file" && ! grep -A 5 "interface $interface" "$file" | grep -q "data?:"; then
    echo "✓ Adding data prop to $interface in $file"

    # Add data?: any right after the interface opening brace
    sed -i '' "/interface $interface.*{/a\\
  data?: any\\
" "$file"
    ((fixed++))
  fi
done

echo ""
echo "✅ Added data prop to $fixed component interfaces"

# Count remaining errors
REMAINING=$(npx tsc --noEmit 2>&1 | grep -c "error TS" || echo "0")
echo "📊 Remaining TypeScript errors: $REMAINING"
