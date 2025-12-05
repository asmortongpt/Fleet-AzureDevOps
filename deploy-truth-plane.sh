#!/bin/bash
###############################################################################
# Deploy Truth Plane to Azure VM and Launch Maximum Resource Execution
#
# This script:
# 1. Syncs Truth Plane components to Azure VM
# 2. Launches distributed orchestrator with maximum resources
# 3. Monitors execution progress
# 4. Collects results with cryptographic proof
###############################################################################

set -e  # Exit on error

# Configuration
VM_HOST="172.191.51.49"
VM_USER="azureuser"
VM_WORKSPACE="/home/azureuser/agent-workspace/fleet-local"
LOCAL_WORKSPACE="/Users/andrewmorton/Documents/GitHub/fleet-local"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TRUTH PLANE DEPLOYMENT - Maximum Resource Execution"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Configuration:"
echo "  VM Host: $VM_HOST"
echo "  VM User: $VM_USER"
echo "  VM Workspace: $VM_WORKSPACE"
echo "  Local Workspace: $LOCAL_WORKSPACE"
echo ""

# Step 1: Sync Truth Plane components to VM
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 1: Syncing Truth Plane to Azure VM"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

rsync -avz --progress \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude 'dist' \
  --exclude '.next' \
  --exclude 'build' \
  --exclude '.cache' \
  --exclude '*.log' \
  --exclude '.env.local' \
  --exclude '.codeql-dbs' \
  --exclude '.sarif-results' \
  --exclude '.truth-plane-results' \
  -e "ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null" \
  "$LOCAL_WORKSPACE/" \
  "$VM_USER@$VM_HOST:$VM_WORKSPACE/"

echo ""
echo "✅ Truth Plane components synced to VM"
echo ""

# Step 2: Verify Truth Plane components on VM
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 2: Verifying Truth Plane Components"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "$VM_USER@$VM_HOST" << 'VERIFY_EOF'
cd /home/azureuser/agent-workspace/fleet-local

echo "📁 Truth Plane Components:"
if [ -d "truth-plane" ]; then
  echo "  ✅ truth-plane/ directory exists"
  ls -lh truth-plane/*.py | awk '{print "     -", $9, "("$5")"}'
else
  echo "  ❌ truth-plane/ directory not found"
  exit 1
fi

echo ""
echo "📁 Supporting Files:"
for file in honest-orchestrator.py production-tasks.py; do
  if [ -f "$file" ]; then
    echo "  ✅ $file exists"
  else
    echo "  ❌ $file not found"
    exit 1
  fi
done

echo ""
echo "✅ All Truth Plane components verified"
VERIFY_EOF

echo ""

# Step 3: Launch distributed execution on VM
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 3: Launching Distributed Execution with Maximum Resources"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🚀 Starting autonomous execution..."
echo "   This will use ALL available VM cores + local compute"
echo "   Progress updates every 5 seconds"
echo ""

# Launch on VM in background and tail logs
ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "$VM_USER@$VM_HOST" << 'EXECUTE_EOF' &
cd /home/azureuser/agent-workspace/fleet-local

# Make scripts executable
chmod +x truth-plane/*.py honest-orchestrator.py production-tasks.py

# Launch distributed orchestrator
python3 truth-plane/distributed-orchestrator.py 2>&1 | tee distributed-execution.log

EXECUTE_EOF

REMOTE_PID=$!

echo "   VM execution started (PID: $REMOTE_PID)"
echo ""

# Step 4: Monitor execution
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 4: Monitoring Execution Progress"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Monitor logs in real-time
sleep 5

while true; do
  # Check if execution is still running
  ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "$VM_USER@$VM_HOST" \
    "ps aux | grep '[d]istributed-orchestrator.py'" > /dev/null 2>&1

  if [ $? -ne 0 ]; then
    echo ""
    echo "✅ Execution completed"
    break
  fi

  # Show latest log output
  clear
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "LIVE EXECUTION PROGRESS"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""

  ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "$VM_USER@$VM_HOST" \
    "tail -50 /home/azureuser/agent-workspace/fleet-local/distributed-execution.log 2>/dev/null || echo 'Initializing...'"

  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "Refreshing in 5 seconds... (CTRL+C to exit monitoring)"

  sleep 5
done

# Step 5: Collect final results
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 5: Collecting Results"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Show full execution log
echo "📊 Final Execution Summary:"
echo ""
ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "$VM_USER@$VM_HOST" \
  "tail -100 /home/azureuser/agent-workspace/fleet-local/distributed-execution.log"

echo ""

# Sync results back to local
echo "📥 Syncing results back to local machine..."
echo ""

rsync -avz \
  -e "ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null" \
  "$VM_USER@$VM_HOST:$VM_WORKSPACE/.truth-plane-results/" \
  "$LOCAL_WORKSPACE/.truth-plane-results/"

rsync -avz \
  -e "ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null" \
  "$VM_USER@$VM_HOST:$VM_WORKSPACE/distributed-execution.log" \
  "$LOCAL_WORKSPACE/"

echo ""
echo "✅ Results synced to $LOCAL_WORKSPACE/.truth-plane-results/"
echo ""

# Display results location
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "DEPLOYMENT COMPLETE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📁 Results available at:"
echo "   $LOCAL_WORKSPACE/.truth-plane-results/"
echo ""
echo "📋 Execution log:"
echo "   $LOCAL_WORKSPACE/distributed-execution.log"
echo ""
echo "✅ Truth Plane execution complete with cryptographic proof"
echo ""
