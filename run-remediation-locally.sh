#!/bin/bash
set -e

echo "========================================"
echo "Fleet Remediation - Running Locally"
echo "========================================"
echo "Date: $(date)"
echo ""

cd /Users/andrewmorton/Documents/GitHub/Fleet

# Create results directory
mkdir -p /tmp/fleet-remediation-results

echo "Step 1: TypeScript Compilation Analysis"
echo "========================================"
cd api
npm install --legacy-peer-deps 2>&1 | tail -20 || true
npx tsc --noEmit --skipLibCheck 2>&1 | tee /tmp/fleet-remediation-results/typescript-errors.txt || true

TOTAL_TS_ERRORS=$(grep "error TS" /tmp/fleet-remediation-results/typescript-errors.txt | wc -l || echo "0")
echo "Total TypeScript Errors: $TOTAL_TS_ERRORS"
echo ""

echo "Step 2: Code Quality Analysis"
echo "========================================"

# Find large files (>400 lines - monolithic files)
echo "Large TypeScript files (>400 lines):"
find src -name "*.ts" -exec wc -l {} \; 2>/dev/null | awk '$1 > 400 {print $1, $2}' | sort -rn | tee /tmp/fleet-remediation-results/large-files.txt

# Check for code duplication patterns
echo ""
echo "Checking authentication code duplication:"
grep -r "verify\|authenticate\|authorize" src/middleware --include="*.ts" 2>/dev/null | wc -l | tee -a /tmp/fleet-remediation-results/auth-duplication.txt

echo ""
echo "Step 3: Security Audit"
echo "========================================"

# Check for hardcoded secrets
echo "Checking for hardcoded secrets..."
grep -r "password\|secret\|api_key\|token" src --include="*.ts" | grep -v "process.env" | grep -v "//\|/\*" | wc -l | tee /tmp/fleet-remediation-results/potential-secrets.txt

# Check SQL injection vulnerabilities
echo ""
echo "Checking for SQL injection risks..."
grep -r "\${.*}\|' + \|\" + " src --include="*.ts" | grep -i "query\|sql" | wc -l | tee /tmp/fleet-remediation-results/sql-injection-risks.txt

echo ""
echo "Step 4: Performance Analysis"
echo "========================================"

# Check for synchronous operations in async contexts
echo "Checking for blocking operations..."
grep -r "readFileSync\|writeFileSync\|execSync" src --include="*.ts" | wc -l | tee /tmp/fleet-remediation-results/blocking-operations.txt

# Check worker thread usage
echo ""
echo "Checking worker thread usage..."
grep -r "worker_threads\|Worker(" src --include="*.ts" | wc -l | tee /tmp/fleet-remediation-results/worker-threads.txt

echo ""
echo "Step 5: Architecture Analysis"
echo "========================================"

# Check dependency injection
echo "Checking dependency injection patterns..."
find src -name "*.ts" -exec grep -l "constructor(" {} \; | wc -l | tee /tmp/fleet-remediation-results/di-usage.txt

# Check rate limiting
echo ""
echo "Checking rate limiting implementation..."
grep -r "rateLimit\|express-rate-limit" src --include="*.ts" | wc -l | tee /tmp/fleet-remediation-results/rate-limiting.txt

# Check CORS configuration
echo ""
echo "Checking CORS configuration..."
grep -r "cors(" src --include="*.ts" | wc -l | tee /tmp/fleet-remediation-results/cors-config.txt

echo ""
echo "Step 6: Generating Final Report"
echo "========================================"

cat > /tmp/fleet-remediation-results/REMEDIATION_REPORT.md <<EOF
# Fleet Management System - Local Remediation Report
Date: $(date)

## TypeScript Analysis
- Total Errors: $TOTAL_TS_ERRORS
- See: /tmp/fleet-remediation-results/typescript-errors.txt

## Code Quality Issues
- Large Files (>400 lines): $(wc -l < /tmp/fleet-remediation-results/large-files.txt || echo "0")
- Authentication Duplication Points: $(cat /tmp/fleet-remediation-results/auth-duplication.txt)

## Security Issues
- Potential Hardcoded Secrets: $(cat /tmp/fleet-remediation-results/potential-secrets.txt)
- SQL Injection Risks: $(cat /tmp/fleet-remediation-results/sql-injection-risks.txt)

## Performance Issues
- Blocking Operations: $(cat /tmp/fleet-remediation-results/blocking-operations.txt)
- Worker Thread Usage: $(cat /tmp/fleet-remediation-results/worker-threads.txt)

## Architecture Analysis
- Dependency Injection Usage: $(cat /tmp/fleet-remediation-results/di-usage.txt) classes
- Rate Limiting Implementations: $(cat /tmp/fleet-remediation-results/rate-limiting.txt)
- CORS Configurations: $(cat /tmp/fleet-remediation-results/cors-config.txt)

## Recommendations

### High Priority (Complete This Week)
1. Fix TypeScript strict mode errors
2. Remove any hardcoded secrets
3. Implement rate limiting on all public endpoints
4. Add SQL injection protection

### Medium Priority (Complete Next Week)
1. Break down monolithic files into smaller modules
2. Implement worker threads for CPU-intensive operations
3. Standardize dependency injection across all services

### Low Priority (Future Sprint)
1. Reduce authentication code duplication
2. Optimize CORS configuration
3. Add comprehensive API documentation

## Next Steps
All analysis results saved to: /tmp/fleet-remediation-results/
EOF

cat /tmp/fleet-remediation-results/REMEDIATION_REPORT.md

echo ""
echo "========================================"
echo "Remediation Complete!"
echo "Results: /tmp/fleet-remediation-results/"
echo "========================================"
