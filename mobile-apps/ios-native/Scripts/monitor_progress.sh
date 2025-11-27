#!/bin/bash
#
# Monitor AI Feature Generation Progress
#

echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║          Fleet Management - AI Generation Monitor               ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""

TOTAL_FEATURES=71
GENERATED_COUNT=$(ls -1 App/Views/Generated/*.swift 2>/dev/null | wc -l | tr -d ' ')

echo "📊 Current Progress:"
echo "   Generated: $GENERATED_COUNT / $TOTAL_FEATURES features"

PERCENT=$((GENERATED_COUNT * 100 / TOTAL_FEATURES))
echo "   Progress: $PERCENT%"

echo ""
echo "📁 Generated Files:"
ls -1t App/Views/Generated/*.swift 2>/dev/null | head -10 | while read file; do
    basename "$file" | sed 's/\.swift$//'
done

echo ""
echo "📋 Recent Output (last 20 lines):"
tail -20 complete_generation.log 2>/dev/null || echo "   (No log file yet)"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💡 To monitor in real-time: tail -f complete_generation.log"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
