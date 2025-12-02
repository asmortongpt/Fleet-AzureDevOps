#!/bin/bash

# Fleet Local - Agent Monitoring Script
# Monitors 10 parallel autonomous-coder agents and reports progress

MONITORING_FILE="IMPLEMENTATION_MONITORING.md"
UPDATE_INTERVAL=1800  # 30 minutes in seconds

echo "🔍 Fleet Local Agent Monitor Started"
echo "Monitoring 10 parallel agents..."
echo ""

# Function to count completed emulator files
count_emulators() {
    find api/src/emulators -name "*Emulator.ts" 2>/dev/null | wc -l | xargs
}

# Function to count new test files
count_tests() {
    find tests e2e -name "*.spec.ts" -o -name "*.test.ts" 2>/dev/null | wc -l | xargs
}

# Function to check if agents are still running
check_agents() {
    ps aux | grep -E "autonomous-coder" | grep -v grep | wc -l | xargs
}

# Initial counts
INITIAL_EMULATORS=$(count_emulators)
INITIAL_TESTS=$(count_tests)

echo "📊 Baseline Status:"
echo "  - Existing emulators: $INITIAL_EMULATORS"
echo "  - Existing tests: $INITIAL_TESTS"
echo "  - Target new emulators: 7"
echo "  - Target new tests: 100+"
echo ""

# Monitor loop
ITERATION=1
while true; do
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
    CURRENT_EMULATORS=$(count_emulators)
    CURRENT_TESTS=$(count_tests)
    RUNNING_AGENTS=$(check_agents)

    NEW_EMULATORS=$((CURRENT_EMULATORS - INITIAL_EMULATORS))
    NEW_TESTS=$((CURRENT_TESTS - INITIAL_TESTS))

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📈 Update #$ITERATION - $TIMESTAMP"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "🤖 Active Agents: $RUNNING_AGENTS / 10"
    echo "📦 New Emulators: $NEW_EMULATORS / 7 (Total: $CURRENT_EMULATORS)"
    echo "🧪 New Tests: $NEW_TESTS / 100+ (Total: $CURRENT_TESTS)"
    echo ""

    # Check specific emulators
    echo "🔍 Emulator Status:"
    [ -f "api/src/emulators/TaskEmulator.ts" ] && echo "  ✅ TaskEmulator" || echo "  ⏳ TaskEmulator"
    [ -f "api/src/emulators/DispatchEmulator.ts" ] && echo "  ✅ DispatchEmulator" || echo "  ⏳ DispatchEmulator"
    [ -f "api/src/emulators/InventoryEmulator.ts" ] && echo "  ✅ InventoryEmulator" || echo "  ⏳ InventoryEmulator"
    [ -f "api/src/emulators/VehicleInventoryEmulator.ts" ] && echo "  ✅ VehicleInventoryEmulator" || echo "  ⏳ VehicleInventoryEmulator"
    [ -f "api/src/emulators/RadioEmulator.ts" ] && echo "  ✅ RadioEmulator" || echo "  ⏳ RadioEmulator"
    echo ""

    # Check UI components
    echo "🎨 UI Component Status:"
    [ -f "src/components/modules/InventoryManagement.tsx" ] && echo "  ✅ InventoryManagement" || echo "  ⏳ InventoryManagement"
    [ -f "src/components/modules/VehicleInventory.tsx" ] && echo "  ✅ VehicleInventory" || echo "  ⏳ VehicleInventory"
    grep -q "DispatchConsole" src/App.tsx 2>/dev/null && echo "  ✅ DispatchConsole (fixed)" || echo "  ⏳ DispatchConsole"
    echo ""

    # Update monitoring file
    cat >> "$MONITORING_FILE" << EOF

### Update #$ITERATION - $TIMESTAMP
- **Active Agents:** $RUNNING_AGENTS / 10
- **New Emulators:** $NEW_EMULATORS / 7
- **New Tests:** $NEW_TESTS / 100+
- **Status:** ${RUNNING_AGENTS -gt 0 && echo "In Progress" || echo "Complete"}

EOF

    # Check if all agents complete
    if [ "$RUNNING_AGENTS" -eq 0 ]; then
        echo "🎉 All agents have completed!"
        echo ""
        echo "📊 Final Results:"
        echo "  - Total emulators created: $NEW_EMULATORS"
        echo "  - Total tests added: $NEW_TESTS"
        echo "  - Ready for Phase 5: Integration Testing"
        break
    fi

    # Wait for next update
    echo "⏱️  Next update in 30 minutes..."
    echo ""

    sleep $UPDATE_INTERVAL
    ITERATION=$((ITERATION + 1))
done
