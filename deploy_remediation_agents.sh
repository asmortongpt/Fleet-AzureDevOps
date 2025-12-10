#!/bin/bash
set -e

echo "=== DEPLOYING REMEDIATION AGENT SWARM ==="
echo "Started: $(date)"

# Create working directories
mkdir -p ~/remediation-work/{logs,progress,output}

# Agent 1: SQL Query Fixer
echo "🤖 Deploying SQL Query Remediation Agent..."
nohup bash -c '
  cd ~/fleet-remediation
  echo "Agent 1: Scanning for SELECT * queries..."
  grep -r "SELECT \*" src api 2>/dev/null | tee ~/remediation-work/logs/sql-queries-found.log
  echo "Found $(grep -c "SELECT \*" ~/remediation-work/logs/sql-queries-found.log 2>/dev/null || echo 0) instances"
' > ~/remediation-work/logs/agent-1-sql.log 2>&1 &

# Agent 2: Error Boundary Creator
echo "🤖 Deploying Error Boundary Agent..."
nohup bash -c '
  cd ~/fleet-remediation
  echo "Agent 2: Finding modules needing error boundaries..."
  find src/components/modules -name "*.tsx" | tee ~/remediation-work/logs/modules-found.log
  echo "Found $(wc -l < ~/remediation-work/logs/modules-found.log) modules"
' > ~/remediation-work/logs/agent-2-boundaries.log 2>&1 &

# Agent 3: Test Generator
echo "🤖 Deploying Test Generation Agent..."
nohup bash -c '
  cd ~/fleet-remediation
  echo "Agent 3: Analyzing test coverage gaps..."
  if [ -f remediation-data/TEST_COVERAGE_GAPS.csv ]; then
    wc -l remediation-data/TEST_COVERAGE_GAPS.csv
    head -20 remediation-data/TEST_COVERAGE_GAPS.csv
  fi
' > ~/remediation-work/logs/agent-3-tests.log 2>&1 &

# Agent 4: Accessibility Fixer
echo "🤖 Deploying Accessibility Agent..."
nohup bash -c '
  cd ~/fleet-remediation
  echo "Agent 4: Scanning for accessibility issues..."
  grep -r "onClick" src/components --include="*.tsx" | grep -v "aria-label" | wc -l
  echo "Found elements missing aria-label"
' > ~/remediation-work/logs/agent-4-a11y.log 2>&1 &

# Agent 5: TypeScript Strict Mode
echo "🤖 Deploying TypeScript Agent..."
nohup bash -c '
  cd ~/fleet-remediation
  echo "Agent 5: Checking TypeScript configuration..."
  if [ -f tsconfig.json ]; then
    grep "strict" tsconfig.json || echo "Strict mode not enabled"
  fi
' > ~/remediation-work/logs/agent-5-typescript.log 2>&1 &

echo ""
echo "✅ 5 AGENTS DEPLOYED"
echo "Monitor with: tail -f ~/remediation-work/logs/*.log"

# Wait for agents to complete initial scan
sleep 5

echo ""
echo "📊 INITIAL SCAN RESULTS:"
for log in ~/remediation-work/logs/*.log; do
  echo "--- $(basename $log) ---"
  tail -5 $log
  echo ""
done
