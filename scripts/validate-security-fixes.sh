#!/bin/bash

# Security Validation Script
# Validates that all code injection vulnerabilities have been fixed

set -e

echo "🔒 Security Validation: Code Injection Fixes"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

VIOLATIONS=0

# Check 1: No eval() in production code
echo "📋 Check 1: Scanning for eval() usage..."
EVAL_RESULTS=$(grep -r "eval(" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
  --exclude-dir=node_modules \
  --exclude-dir=dist \
  --exclude-dir=build \
  --exclude-dir=.next \
  --exclude="*.test.ts" \
  --exclude="*.test.tsx" \
  --exclude="*.spec.ts" \
  --exclude="test-*.js" \
  src/ api/src/ 2>/dev/null | grep -v "// " | grep -v "/\*" | grep -v "\$eval" | grep -v "client.eval" || true)

if [ -z "$EVAL_RESULTS" ]; then
  echo -e "${GREEN}✅ PASS: No eval() usage found in production code${NC}"
else
  echo -e "${RED}❌ FAIL: eval() usage detected:${NC}"
  echo "$EVAL_RESULTS"
  VIOLATIONS=$((VIOLATIONS + 1))
fi
echo ""

# Check 2: No new Function() in production code
echo "📋 Check 2: Scanning for Function() constructor usage..."
FUNCTION_RESULTS=$(grep -r "new Function(" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
  --exclude-dir=node_modules \
  --exclude-dir=dist \
  --exclude-dir=build \
  --exclude-dir=.next \
  --exclude="*.test.ts" \
  --exclude="*.test.tsx" \
  --exclude="*.spec.ts" \
  src/ api/src/ 2>/dev/null | grep -v "// " | grep -v "/\*" || true)

if [ -z "$FUNCTION_RESULTS" ]; then
  echo -e "${GREEN}✅ PASS: No Function() constructor usage found in production code${NC}"
else
  echo -e "${RED}❌ FAIL: Function() constructor usage detected:${NC}"
  echo "$FUNCTION_RESULTS"
  VIOLATIONS=$((VIOLATIONS + 1))
fi
echo ""

# Check 3: Safe libraries are used
echo "📋 Check 3: Verifying safe expression evaluation libraries..."
SAFE_LIBS=0

if grep -q "expr-eval" api/src/services/documents/workflow-engine.ts 2>/dev/null; then
  echo -e "${GREEN}✅ Workflow Engine uses expr-eval${NC}"
  SAFE_LIBS=$((SAFE_LIBS + 1))
else
  echo -e "${RED}❌ Workflow Engine not using expr-eval${NC}"
  VIOLATIONS=$((VIOLATIONS + 1))
fi

if grep -q "mathjs" src/components/reports/DynamicReportRenderer.tsx 2>/dev/null; then
  echo -e "${GREEN}✅ Report Renderer uses mathjs${NC}"
  SAFE_LIBS=$((SAFE_LIBS + 1))
else
  echo -e "${RED}❌ Report Renderer not using mathjs${NC}"
  VIOLATIONS=$((VIOLATIONS + 1))
fi

if grep -q "json-logic-js" src/lib/policy-engine/policy-enforcement-engine.ts 2>/dev/null; then
  echo -e "${GREEN}✅ Policy Engine uses json-logic-js${NC}"
  SAFE_LIBS=$((SAFE_LIBS + 1))
else
  echo -e "${RED}❌ Policy Engine not using json-logic-js${NC}"
  VIOLATIONS=$((VIOLATIONS + 1))
fi
echo ""

# Check 4: Dependencies installed
echo "📋 Check 4: Verifying security dependencies installed..."
if [ -f "package.json" ]; then
  if grep -q "\"expr-eval\"" package.json && \
     grep -q "\"mathjs\"" package.json && \
     grep -q "\"json-logic-js\"" package.json; then
    echo -e "${GREEN}✅ All security dependencies are in package.json${NC}"
  else
    echo -e "${YELLOW}⚠️  WARNING: Some security dependencies may be missing from package.json${NC}"
    VIOLATIONS=$((VIOLATIONS + 1))
  fi
else
  echo -e "${YELLOW}⚠️  WARNING: package.json not found${NC}"
fi
echo ""

# Summary
echo "=============================================="
echo "🔒 Security Validation Summary"
echo "=============================================="
if [ $VIOLATIONS -eq 0 ]; then
  echo -e "${GREEN}✅ ALL CHECKS PASSED${NC}"
  echo ""
  echo "Code injection vulnerabilities have been successfully remediated:"
  echo "  • eval() replaced with expr-eval in Workflow Engine"
  echo "  • eval() replaced with mathjs in Report Renderer"
  echo "  • Function() replaced with json-logic-js in Policy Engine"
  echo ""
  echo "Security posture: COMPLIANT ✅"
  exit 0
else
  echo -e "${RED}❌ $VIOLATIONS VIOLATIONS FOUND${NC}"
  echo ""
  echo "Please review and fix the violations above."
  exit 1
fi
