#!/bin/bash

# Full Remediation Analysis Orchestrator
# Runs all analysis tools in sequence

set -e

echo "================================================================================"
echo "FLEET MANAGEMENT SYSTEM - COMPLETE REMEDIATION ANALYSIS"
echo "================================================================================"
echo ""
echo "This script will perform a comprehensive analysis of the entire codebase."
echo "Expected duration: 10-15 minutes"
echo ""

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

echo "Project Root: $PROJECT_ROOT"
echo ""

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 is required but not found."
    exit 1
fi

echo "Python version: $(python3 --version)"
echo ""

# Install dependencies
echo "================================================================================"
echo "STEP 0: Installing Dependencies"
echo "================================================================================"
echo ""

pip3 install --quiet tqdm 2>&1 | grep -v "already satisfied" || true

echo "✓ Dependencies installed"
echo ""

# Step 1: UI Scanner
echo "================================================================================"
echo "STEP 1: Scanning All UI Elements"
echo "================================================================================"
echo ""

python3 "$SCRIPT_DIR/comprehensive_ui_scanner.py"

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ UI scanning complete"
else
    echo ""
    echo "✗ UI scanning failed"
    exit 1
fi

echo ""

# Step 2: Route Mapper
echo "================================================================================"
echo "STEP 2: Mapping All Routes and Pages"
echo "================================================================================"
echo ""

python3 "$SCRIPT_DIR/route_mapper.py"

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ Route mapping complete"
else
    echo ""
    echo "✗ Route mapping failed"
    exit 1
fi

echo ""

# Step 3: Test Coverage Analyzer
echo "================================================================================"
echo "STEP 3: Analyzing Test Coverage"
echo "================================================================================"
echo ""

python3 "$SCRIPT_DIR/test_coverage_analyzer.py"

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ Coverage analysis complete"
else
    echo ""
    echo "✗ Coverage analysis failed"
    exit 1
fi

echo ""

# Step 4: Generate Remediation Cards
echo "================================================================================"
echo "STEP 4: Generating Remediation Cards"
echo "================================================================================"
echo ""

python3 "$SCRIPT_DIR/generate_all_cards.py"

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ Card generation complete"
else
    echo ""
    echo "✗ Card generation failed"
    exit 1
fi

echo ""

# Generate final summary
echo "================================================================================"
echo "STEP 5: Generating Final Summary"
echo "================================================================================"
echo ""

# Count files in remediation-data
DATA_DIR="$PROJECT_ROOT/remediation-data"
if [ -d "$DATA_DIR" ]; then
    echo "Data files generated:"
    ls -lh "$DATA_DIR"
    echo ""
fi

# Check for main outputs
echo "Main deliverables:"
echo ""

if [ -f "$PROJECT_ROOT/REMEDIATION_CARDS_ALL.md" ]; then
    SIZE=$(du -h "$PROJECT_ROOT/REMEDIATION_CARDS_ALL.md" | cut -f1)
    LINES=$(wc -l < "$PROJECT_ROOT/REMEDIATION_CARDS_ALL.md")
    echo "  ✓ REMEDIATION_CARDS_ALL.md ($SIZE, $LINES lines)"
fi

if [ -f "$DATA_DIR/COMPLETE_UI_INVENTORY.csv" ]; then
    LINES=$(wc -l < "$DATA_DIR/COMPLETE_UI_INVENTORY.csv")
    echo "  ✓ COMPLETE_UI_INVENTORY.csv ($((LINES-1)) elements)"
fi

if [ -f "$DATA_DIR/ROUTE_ANALYSIS.json" ]; then
    ROUTES=$(python3 -c "import json; print(len(json.load(open('$DATA_DIR/ROUTE_ANALYSIS.json'))))")
    echo "  ✓ ROUTE_ANALYSIS.json ($ROUTES routes)"
fi

if [ -f "$DATA_DIR/TEST_COVERAGE_GAPS.json" ]; then
    GAPS=$(python3 -c "import json; print(len(json.load(open('$DATA_DIR/TEST_COVERAGE_GAPS.json'))))")
    echo "  ✓ TEST_COVERAGE_GAPS.json ($GAPS gaps)"
fi

echo ""
echo "================================================================================"
echo "ANALYSIS COMPLETE"
echo "================================================================================"
echo ""
echo "Next steps:"
echo "  1. Review REMEDIATION_CARDS_ALL.md for detailed remediation plan"
echo "  2. Import CSV files into project management tool"
echo "  3. Prioritize critical and high-priority items"
echo "  4. Assign team members to remediation tasks"
echo ""
echo "Recommended timeline: 8-10 weeks with 4-6 developers"
echo ""
echo "================================================================================"
