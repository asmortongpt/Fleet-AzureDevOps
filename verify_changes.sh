#!/bin/bash

echo "==================================================================="
echo "MINIMALIST DESIGN VERIFICATION SCRIPT"
echo "==================================================================="
echo ""

echo "✅ 1. Checking minimalist CSS theme..."
if grep -q "minimalist-nav-width: 176px" src/styles/minimalist-theme.css; then
    echo "   ✓ Navigation width set to 176px"
else
    echo "   ✗ Navigation width NOT updated"
fi

echo ""
echo "✅ 2. Checking CommandCenterSidebar..."
if grep -q 'className="w-44"' src/components/layout/CommandCenterSidebar.tsx; then
    echo "   ✓ Sidebar using w-44 (176px)"
else
    echo "   ✗ Sidebar NOT updated to w-44"
fi

echo ""
echo "✅ 3. Checking CommandCenterHeader..."
if grep -q 'className="h-11' src/components/layout/CommandCenterHeader.tsx; then
    echo "   ✓ Header using h-11 (44px)"
else
    echo "   ✗ Header NOT updated to h-11"
fi

echo ""
echo "✅ 4. Checking mass replacements..."
OLD_LARGE=$(grep -r "text-4xl\|text-3xl" src/ 2>/dev/null | wc -l)
OLD_PADDING=$(grep -r "p-8\|p-6\|px-8\|px-6\|py-8\|py-6" src/ 2>/dev/null | wc -l)
echo "   • Remaining text-4xl/3xl: $OLD_LARGE (should be <50)"
echo "   • Remaining p-8/6 padding: $OLD_PADDING (should be <100)"

echo ""
echo "✅ 5. Checking dev server..."
if lsof -i :5173 > /dev/null 2>&1; then
    echo "   ✓ Dev server running on port 5173"
    echo "   → View at: http://localhost:5173"
else
    echo "   ✗ Dev server NOT running"
fi

echo ""
echo "==================================================================="
echo "VERIFICATION COMPLETE"
echo "==================================================================="
