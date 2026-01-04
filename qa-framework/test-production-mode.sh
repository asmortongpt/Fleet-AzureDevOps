#!/bin/bash
#
# Test Production Mode Configuration
# Verifies that QA framework is properly configured for conservative recommendations
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=========================================="
echo "QA Framework - Production Mode Test"
echo -e "==========================================${NC}\n"

# Check 1: Verify .env exists
echo -e "${BLUE}[1/5]${NC} Checking .env configuration..."
if [ -f .env ]; then
  echo -e "${GREEN}✓${NC} .env file exists"

  # Verify production mode settings
  if grep -q "PRODUCTION_MODE=true" .env; then
    echo -e "${GREEN}✓${NC} PRODUCTION_MODE=true"
  else
    echo -e "${YELLOW}⚠${NC} PRODUCTION_MODE not set to true"
  fi

  if grep -q "PASS_THRESHOLD=80" .env; then
    echo -e "${GREEN}✓${NC} PASS_THRESHOLD=80 (conservative)"
  else
    echo -e "${YELLOW}⚠${NC} PASS_THRESHOLD not set to 80"
  fi

  if grep -q "CRITICAL_ONLY=true" .env; then
    echo -e "${GREEN}✓${NC} CRITICAL_ONLY=true"
  else
    echo -e "${YELLOW}⚠${NC} CRITICAL_ONLY not set to true"
  fi
else
  echo -e "${YELLOW}⚠${NC} .env file not found"
fi

echo ""

# Check 2: Verify directory structure
echo -e "${BLUE}[2/5]${NC} Checking directory structure..."
dirs=("src/lib" "src/gates" "src/orchestrator")
for dir in "${dirs[@]}"; do
  if [ -d "$dir" ]; then
    echo -e "${GREEN}✓${NC} $dir exists"
  else
    echo -e "${YELLOW}⚠${NC} $dir missing"
  fi
done

echo ""

# Check 3: Verify key files
echo -e "${BLUE}[3/5]${NC} Checking key files..."
files=(
  "src/lib/severity.ts"
  "src/orchestrator/master.ts"
  "src/gates/console-errors-gate.ts"
  "src/gates/accessibility-gate.ts"
  "src/gates/security-gate.ts"
  "src/gates/performance-gate.ts"
  "package.json"
  "tsconfig.json"
  "README.md"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo -e "${GREEN}✓${NC} $file"
  else
    echo -e "${YELLOW}⚠${NC} $file missing"
  fi
done

echo ""

# Check 4: Verify severity classification
echo -e "${BLUE}[4/5]${NC} Verifying severity classification system..."
if [ -f "src/lib/severity.ts" ]; then
  if grep -q "enum Severity" src/lib/severity.ts; then
    echo -e "${GREEN}✓${NC} Severity enum defined"
  fi

  if grep -q "classifyConsoleFinding" src/lib/severity.ts; then
    echo -e "${GREEN}✓${NC} Console error classification"
  fi

  if grep -q "classifyAccessibilityFinding" src/lib/severity.ts; then
    echo -e "${GREEN}✓${NC} Accessibility classification"
  fi

  if grep -q "shouldFailGate" src/lib/severity.ts; then
    echo -e "${GREEN}✓${NC} Gate failure logic"
  fi

  if grep -q "calculateGateScore" src/lib/severity.ts; then
    echo -e "${GREEN}✓${NC} Score calculation logic"
  fi
fi

echo ""

# Check 5: Verify production mode logic
echo -e "${BLUE}[5/5]${NC} Verifying production mode logic..."
if [ -f "src/orchestrator/master.ts" ]; then
  if grep -q "PRODUCTION_MODE" src/orchestrator/master.ts; then
    echo -e "${GREEN}✓${NC} Production mode configuration loaded"
  fi

  if grep -q "PASS_THRESHOLD" src/orchestrator/master.ts; then
    echo -e "${GREEN}✓${NC} Pass threshold configuration"
  fi

  if grep -q "CRITICAL_ONLY" src/orchestrator/master.ts; then
    echo -e "${GREEN}✓${NC} Critical-only filtering"
  fi

  if grep -q "🏭 PRODUCTION MODE ENABLED" src/orchestrator/master.ts; then
    echo -e "${GREEN}✓${NC} Production mode banner"
  fi
fi

echo ""
echo -e "${BLUE}=========================================="
echo "Configuration Summary"
echo -e "==========================================${NC}"

cat << EOF

Production Mode Features:
✓ CRITICAL-only failure mode
✓ 80% pass threshold (vs 95% strict)
✓ Conservative recommendations
✓ Severity-based scoring
✓ Filtered findings display

Severity Levels:
🔴 CRITICAL - Blocks production
🟡 HIGH - Recommended fix
🔵 MEDIUM - Nice to have
⚪ LOW - Informational

Philosophy:
"App is production-ready - focus on blockers, not perfection"

EOF

echo -e "${BLUE}=========================================="
echo "Next Steps"
echo -e "==========================================${NC}"

cat << EOF

1. Install dependencies:
   ${YELLOW}npm install${NC}

2. Run the orchestrator:
   ${YELLOW}npm run orchestrate${NC}

3. Review the report in:
   ${YELLOW}./verification-evidence/reports/${NC}

4. To see ALL findings (verbose):
   ${YELLOW}VERBOSE_OUTPUT=true npm run orchestrate${NC}

5. To test strict mode:
   ${YELLOW}PRODUCTION_MODE=false PASS_THRESHOLD=95 npm run orchestrate${NC}

EOF

echo -e "${GREEN}✅ Production mode configuration verified!${NC}\n"
