#!/bin/bash

# Fleet Local - Agent Monitoring Script (5-minute updates)
# Monitors 10 parallel autonomous-coder agents and reports progress

MONITORING_FILE="IMPLEMENTATION_MONITORING.md"
UPDATE_INTERVAL=300  # 5 minutes in seconds

echo "🔍 Fleet Local Agent Monitor Started"
echo "Monitoring 10 parallel agents with 5-minute updates..."
echo ""

# Function to count completed emulator files
count_emulators() {
    find api/src/emulators -name "*Emulator.ts" 2>/dev/null | wc -l | xargs
}

# Function to count new test files
count_tests() {
    find . -name "*.spec.ts" -o -name "*.test.ts" 2>/dev/null | wc -l | xargs
}

# Function to get file sizes for progress indication
get_emulator_sizes() {
    local total=0
    for file in api/src/emulators/*Emulator.ts; do
        if [ -f "$file" ]; then
            size=$(wc -l < "$file" 2>/dev/null || echo 0)
            total=$((total + size))
        fi
    done
    echo $total
}

# Initial counts
INITIAL_EMULATORS=$(count_emulators)
INITIAL_TESTS=$(count_tests)
INITIAL_LINES=$(get_emulator_sizes)

echo "📊 Baseline Status:"
echo "  - Existing emulators: $INITIAL_EMULATORS"
echo "  - Existing tests: $INITIAL_TESTS"
echo "  - Emulator code lines: $INITIAL_LINES"
echo "  - Target new emulators: 7"
echo "  - Target new tests: 100+"
echo ""

# Monitor loop
ITERATION=1
START_TIME=$(date +%s)

while true; do
    CURRENT_TIME=$(date +%s)
    ELAPSED=$((CURRENT_TIME - START_TIME))
    ELAPSED_MIN=$((ELAPSED / 60))

    TIMESTAMP=$(date '+%H:%M:%S')
    CURRENT_EMULATORS=$(count_emulators)
    CURRENT_TESTS=$(count_tests)
    CURRENT_LINES=$(get_emulator_sizes)

    NEW_EMULATORS=$((CURRENT_EMULATORS - INITIAL_EMULATORS))
    NEW_TESTS=$((CURRENT_TESTS - INITIAL_TESTS))
    NEW_LINES=$((CURRENT_LINES - INITIAL_LINES))

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📈 Update #$ITERATION - $TIMESTAMP (Elapsed: ${ELAPSED_MIN}m)"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "📦 New Emulators: $NEW_EMULATORS / 7 (Total: $CURRENT_EMULATORS)"
    echo "🧪 New Tests: $NEW_TESTS / 100+ (Total: $CURRENT_TESTS)"
    echo "📝 New Code Lines: $NEW_LINES"
    echo ""

    # Check specific emulators with file size
    echo "🔍 Emulator Status:"
    for emulator in "TaskEmulator" "DispatchEmulator" "InventoryEmulator" "VehicleInventoryEmulator" "RadioEmulator"; do
        FILE="api/src/emulators/${emulator}.ts"
        if [ -f "$FILE" ]; then
            LINES=$(wc -l < "$FILE" 2>/dev/null)
            echo "  ✅ ${emulator} ($LINES lines)"
        else
            echo "  ⏳ ${emulator}"
        fi
    done
    echo ""

    # Check UI components
    echo "🎨 UI Component Status:"
    for component in "InventoryManagement" "VehicleInventory"; do
        FILE="src/components/modules/${component}.tsx"
        if [ -f "$FILE" ]; then
            LINES=$(wc -l < "$FILE" 2>/dev/null)
            echo "  ✅ ${component} ($LINES lines)"
        else
            echo "  ⏳ ${component}"
        fi
    done

    # Check dispatch console fix
    if grep -q "case 'dispatch-console':" src/App.tsx 2>/dev/null && grep -A1 "case 'dispatch-console':" src/App.tsx | grep -q "DispatchConsole"; then
        echo "  ✅ DispatchConsole (routing fixed)"
    else
        echo "  ⏳ DispatchConsole"
    fi
    echo ""

    # Check for new migrations
    MIGRATIONS=$(find api/src/db/migrations -name "*.sql" 2>/dev/null | wc -l | xargs)
    echo "🗄️  Database Migrations: $MIGRATIONS"
    echo ""

    # Check for AI integration files
    echo "🤖 AI Integration:"
    [ -f "api/src/services/ai-dispatch.ts" ] && echo "  ✅ AI Dispatch Service" || echo "  ⏳ AI Dispatch Service"
    [ -f "api/src/services/ai-task-prioritization.ts" ] && echo "  ✅ AI Task Prioritization" || echo "  ⏳ AI Task Prioritization"
    echo ""

    # Update monitoring file
    cat >> "$MONITORING_FILE" << EOF

### Update #$ITERATION - $TIMESTAMP (${ELAPSED_MIN}m elapsed)
- **New Emulators:** $NEW_EMULATORS / 7
- **New Tests:** $NEW_TESTS / 100+
- **New Code Lines:** $NEW_LINES
- **Status:** In Progress

EOF

    # Progress bar
    PROGRESS=$((NEW_EMULATORS * 100 / 7))
    BARS=$((PROGRESS / 5))
    printf "Progress: ["
    for i in $(seq 1 20); do
        if [ $i -le $BARS ]; then
            printf "="
        else
            printf " "
        fi
    done
    printf "] %d%%\n" $PROGRESS
    echo ""

    # Check if we've likely completed (all 7 emulators present)
    if [ "$NEW_EMULATORS" -ge 7 ] && [ "$NEW_TESTS" -gt 50 ]; then
        echo "🎉 Major milestone reached! All emulators appear to be complete!"
        echo ""
        echo "📊 Final Check Results:"
        echo "  - Total new emulators: $NEW_EMULATORS"
        echo "  - Total new tests: $NEW_TESTS"
        echo "  - New code lines: $NEW_LINES"
        echo ""
        echo "✅ Ready for Phase 5: Comprehensive Integration Testing"
        break
    fi

    # Wait for next update
    echo "⏱️  Next update in 5 minutes..."
    echo ""

    sleep $UPDATE_INTERVAL
    ITERATION=$((ITERATION + 1))
done
