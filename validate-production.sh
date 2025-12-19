#!/bin/bash

# Fleet Production Validation Script
# Complete system validation for production readiness

set -euo pipefail

echo "=========================================="
echo "Fleet Production Validation"
echo "$(date '+%Y-%m-%d %H:%M:%S')"
echo "=========================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track validation results
VALIDATION_PASSED=true
ISSUES_FOUND=()

# Function to print colored output
print_status() {
  local status=$1
  local message=$2
  if [ "$status" = "PASS" ]; then
    echo -e "${GREEN}✓${NC} $message"
  elif [ "$status" = "FAIL" ]; then
    echo -e "${RED}✗${NC} $message"
    VALIDATION_PASSED=false
    ISSUES_FOUND+=("$message")
  else
    echo -e "${YELLOW}⚠${NC} $message"
  fi
}

# Function to check command availability
check_command() {
  if command -v $1 &> /dev/null; then
    print_status "PASS" "$1 is installed"
    return 0
  else
    print_status "FAIL" "$1 is not installed"
    return 1
  fi
}

echo ""
echo "1. ENVIRONMENT CHECK"
echo "===================="

# Check required commands
check_command "node"
check_command "npm"
check_command "git"

# Check Node version
NODE_VERSION=$(node -v)
if [[ "$NODE_VERSION" =~ ^v(1[68]|2[0-9]) ]]; then
  print_status "PASS" "Node version: $NODE_VERSION"
else
  print_status "FAIL" "Node version $NODE_VERSION is not supported (requires v16+)"
fi

echo ""
echo "2. REPOSITORY STATUS"
echo "===================="

# Check git status
if [ -d ".git" ]; then
  BRANCH=$(git branch --show-current)
  print_status "PASS" "Git repository found, current branch: $BRANCH"

  # Check for uncommitted changes
  if git diff --quiet && git diff --cached --quiet; then
    print_status "PASS" "No uncommitted changes"
  else
    print_status "WARN" "Uncommitted changes detected"
  fi
else
  print_status "FAIL" "Not a git repository"
fi

echo ""
echo "3. FRONTEND VALIDATION"
echo "======================"

# Check if frontend dependencies are installed
if [ -d "node_modules" ]; then
  print_status "PASS" "Frontend dependencies installed"
else
  print_status "FAIL" "Frontend dependencies not installed"
fi

# Check if frontend can build
echo "Building frontend..."
if npm run build &> /dev/null; then
  print_status "PASS" "Frontend build successful"

  # Check dist directory
  if [ -d "dist" ]; then
    FILE_COUNT=$(find dist -type f | wc -l)
    print_status "PASS" "Frontend dist created with $FILE_COUNT files"
  else
    print_status "FAIL" "Frontend dist directory not created"
  fi
else
  print_status "FAIL" "Frontend build failed"
fi

# Check critical frontend files
CRITICAL_FILES=(
  "src/App.tsx"
  "src/main.tsx"
  "src/components/modules/Dashboard.tsx"
  "src/hooks/use-fleet-data.ts"
  "src/contexts/DrilldownContext.tsx"
  "src/lib/navigation.tsx"
  "vite.config.ts"
  "package.json"
)

echo ""
echo "Checking critical frontend files..."
for file in "${CRITICAL_FILES[@]}"; do
  if [ -f "$file" ]; then
    print_status "PASS" "$file exists"
  else
    print_status "FAIL" "$file missing"
  fi
done

echo ""
echo "4. BACKEND API VALIDATION"
echo "========================="

cd api

# Check backend dependencies
if [ -d "node_modules" ]; then
  print_status "PASS" "Backend dependencies installed"
else
  print_status "FAIL" "Backend dependencies not installed"
fi

# Check if backend can build
echo "Building backend..."
if npm run build 2>&1 | grep -q "Found [0-9]* errors"; then
  ERROR_COUNT=$(npm run build 2>&1 | grep -oE "Found [0-9]* errors" | grep -oE "[0-9]+")
  print_status "FAIL" "Backend build has $ERROR_COUNT TypeScript errors"
else
  if [ -d "dist" ]; then
    print_status "PASS" "Backend build successful"
  else
    print_status "WARN" "Backend build completed with warnings"
  fi
fi

# Check critical backend files
BACKEND_FILES=(
  "src/server.ts"
  "src/config/database.ts"
  "src/middleware/auth.ts"
  "src/middleware/security-headers.ts"
  "src/routes/vehicles.ts"
  "package.json"
)

echo ""
echo "Checking critical backend files..."
for file in "${BACKEND_FILES[@]}"; do
  if [ -f "$file" ]; then
    print_status "PASS" "$file exists"
  else
    print_status "FAIL" "$file missing"
  fi
done

cd ..

echo ""
echo "5. DATABASE VALIDATION"
echo "====================="

# Check for migration files
if [ -d "api/migrations" ]; then
  MIGRATION_COUNT=$(ls api/migrations/*.sql 2>/dev/null | wc -l)
  if [ $MIGRATION_COUNT -gt 0 ]; then
    print_status "PASS" "Found $MIGRATION_COUNT migration files"
  else
    print_status "FAIL" "No migration files found"
  fi
else
  print_status "FAIL" "Migrations directory not found"
fi

echo ""
echo "6. SECURITY VALIDATION"
echo "====================="

# Check for .env files in git
if git ls-files | grep -q "\.env$"; then
  print_status "FAIL" ".env files found in git repository"
else
  print_status "PASS" "No .env files in git repository"
fi

# Check for sensitive patterns
echo "Checking for exposed secrets..."
SENSITIVE_PATTERNS=(
  "sk-[a-zA-Z0-9]{48}"  # OpenAI API key pattern
  "AIza[a-zA-Z0-9]{35}"  # Google API key pattern
  "ghp_[a-zA-Z0-9]{36}"  # GitHub token pattern
)

FOUND_SECRETS=false
for pattern in "${SENSITIVE_PATTERNS[@]}"; do
  if grep -r "$pattern" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" . 2>/dev/null | grep -v node_modules | grep -v dist > /dev/null; then
    print_status "FAIL" "Potential secrets found matching pattern: $pattern"
    FOUND_SECRETS=true
  fi
done

if [ "$FOUND_SECRETS" = false ]; then
  print_status "PASS" "No hardcoded secrets detected"
fi

# Check security headers implementation
if grep -q "helmet" api/src/server.ts 2>/dev/null; then
  print_status "PASS" "Helmet security headers configured"
else
  print_status "FAIL" "Helmet security headers not found"
fi

# Check CSRF protection
if grep -q "csrf" api/src/server.ts 2>/dev/null; then
  print_status "PASS" "CSRF protection configured"
else
  print_status "FAIL" "CSRF protection not found"
fi

echo ""
echo "7. CONFIGURATION VALIDATION"
echo "==========================="

# Check for example env files
ENV_EXAMPLES=(
  ".env.example"
  "api/.env.example"
)

for file in "${ENV_EXAMPLES[@]}"; do
  if [ -f "$file" ]; then
    print_status "PASS" "$file exists"
  else
    print_status "WARN" "$file missing (needed for deployment)"
  fi
done

# Check Azure configuration
if [ -f "azure-pipelines.yml" ]; then
  print_status "PASS" "Azure Pipelines configuration found"
else
  print_status "WARN" "Azure Pipelines configuration not found"
fi

echo ""
echo "8. TESTING VALIDATION"
echo "===================="

# Check for test files
TEST_COUNT=$(find . -name "*.spec.ts" -o -name "*.spec.tsx" -o -name "*.test.ts" -o -name "*.test.tsx" 2>/dev/null | grep -v node_modules | wc -l)
if [ $TEST_COUNT -gt 0 ]; then
  print_status "PASS" "Found $TEST_COUNT test files"
else
  print_status "FAIL" "No test files found"
fi

# Check Playwright configuration
if [ -f "playwright.config.ts" ]; then
  print_status "PASS" "Playwright E2E testing configured"
else
  print_status "WARN" "Playwright configuration not found"
fi

echo ""
echo "9. PERFORMANCE VALIDATION"
echo "========================"

# Check bundle size
if [ -f "dist/index.html" ]; then
  MAIN_JS=$(find dist -name "index-*.js" 2>/dev/null | head -1)
  if [ -n "$MAIN_JS" ]; then
    SIZE_KB=$(du -k "$MAIN_JS" | cut -f1)
    if [ $SIZE_KB -lt 1000 ]; then
      print_status "PASS" "Main bundle size: ${SIZE_KB}KB (< 1MB)"
    else
      print_status "WARN" "Main bundle size: ${SIZE_KB}KB (> 1MB)"
    fi
  fi
fi

# Check for lazy loading
if grep -q "React.lazy" src/App.tsx 2>/dev/null; then
  LAZY_COUNT=$(grep -c "React.lazy" src/App.tsx)
  print_status "PASS" "Found $LAZY_COUNT lazy-loaded modules"
else
  print_status "FAIL" "No lazy loading detected"
fi

echo ""
echo "10. MODULE INVENTORY"
echo "===================="

# Count modules
if [ -d "src/components/modules" ]; then
  MODULE_COUNT=$(ls src/components/modules/*.tsx 2>/dev/null | wc -l)
  if [ $MODULE_COUNT -gt 40 ]; then
    print_status "PASS" "Found $MODULE_COUNT modules (expected 50+)"
  else
    print_status "WARN" "Found only $MODULE_COUNT modules (expected 50+)"
  fi
else
  print_status "FAIL" "Modules directory not found"
fi

echo ""
echo "=========================================="
echo "VALIDATION SUMMARY"
echo "=========================================="

if [ "$VALIDATION_PASSED" = true ]; then
  echo -e "${GREEN}✓ All validations passed!${NC}"
  echo "The Fleet Management System is ready for production deployment."
else
  echo -e "${RED}✗ Validation failed with ${#ISSUES_FOUND[@]} issues:${NC}"
  echo ""
  for issue in "${ISSUES_FOUND[@]}"; do
    echo "  - $issue"
  done
  echo ""
  echo "Please fix the issues above before deploying to production."
  exit 1
fi

echo ""
echo "Validation completed at $(date '+%Y-%m-%d %H:%M:%S')"