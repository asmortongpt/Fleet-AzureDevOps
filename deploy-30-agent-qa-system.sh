#!/bin/bash
set -e

# =============================================================================
# Deploy 30-Agent QA System to Azure VM
# =============================================================================
# This script deploys the multi-agent orchestrator to the Azure VM and
# configures it to use the existing RAG/CAG/MCP quality assurance framework
# to analyze the asmortongpt/fleet codebase.
# =============================================================================

echo "🚀 Deploying 30-Agent QA System to Azure VM"
echo "============================================="

# Configuration
VM_USER="azureuser"
VM_IP="172.173.175.71"
RESOURCE_GROUP="FLEET-AI-AGENTS"
VM_NAME="fleet-build-test-vm"
QA_FRAMEWORK_PATH="/home/azureuser/qa-framework"
FLEET_REPO="https://github.com/asmortongpt/fleet.git"
FLEET_PATH="/home/azureuser/fleet-analysis"

# Step 1: Verify SSH connectivity
echo ""
echo "📡 Step 1: Verifying Azure VM connectivity..."
if ! ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no ${VM_USER}@${VM_IP} "echo 'Connected successfully'" 2>/dev/null; then
    echo "❌ Cannot connect to VM. Attempting to start VM..."
    az vm start --resource-group ${RESOURCE_GROUP} --name ${VM_NAME}
    echo "⏳ Waiting 30 seconds for VM to start..."
    sleep 30
fi

# Step 2: Check if QA framework exists
echo ""
echo "🔍 Step 2: Checking QA Framework installation..."
ssh ${VM_USER}@${VM_IP} << 'ENDSSH'
if [ ! -d "/home/azureuser/qa-framework" ]; then
    echo "❌ QA Framework not found at /home/azureuser/qa-framework"
    echo "Please ensure the RAG/CAG/MCP QA framework is installed on the VM first."
    exit 1
fi

echo "✅ QA Framework found"

# Check PostgreSQL
if ! docker ps | grep -q postgres; then
    echo "⚠️  PostgreSQL not running. Starting services..."
    cd /home/azureuser/qa-framework
    docker-compose up -d
    sleep 5
fi

echo "✅ Database services running"
ENDSSH

# Step 3: Transfer agent orchestrator files
echo ""
echo "📦 Step 3: Transferring agent orchestrator to VM..."

# Create temporary directory for transfer
TEMP_DIR=$(mktemp -d)
trap "rm -rf ${TEMP_DIR}" EXIT

# Copy agent files
mkdir -p ${TEMP_DIR}/agents
cp qa-framework/src/agents/multi-agent-orchestrator.ts ${TEMP_DIR}/agents/
cp qa-framework/src/agents/websocket-server.ts ${TEMP_DIR}/agents/

# Create transfer archive
cd ${TEMP_DIR}
tar -czf agents.tar.gz agents/

# Transfer to VM
scp agents.tar.gz ${VM_USER}@${VM_IP}:${QA_FRAMEWORK_PATH}/

# Extract on VM
ssh ${VM_USER}@${VM_IP} << 'ENDSSH'
cd /home/azureuser/qa-framework
tar -xzf agents.tar.gz
rm agents.tar.gz
echo "✅ Agent files transferred"
ENDSSH

# Step 4: Install dependencies on VM
echo ""
echo "📚 Step 4: Installing agent dependencies..."
ssh ${VM_USER}@${VM_IP} << 'ENDSSH'
cd /home/azureuser/qa-framework

# Add ws package for WebSocket server
if ! grep -q '"ws":' package.json; then
    echo "Installing ws package..."
    npm install --save ws @types/ws
fi

echo "✅ Dependencies installed"
ENDSSH

# Step 5: Clone asmortongpt/fleet repository for analysis
echo ""
echo "📥 Step 5: Cloning asmortongpt/fleet repository..."
ssh ${VM_USER}@${VM_IP} << ENDSSH
# Remove old clone if exists
if [ -d "${FLEET_PATH}" ]; then
    echo "Removing old fleet repository..."
    rm -rf ${FLEET_PATH}
fi

# Clone fresh copy
echo "Cloning asmortongpt/fleet..."
git clone ${FLEET_REPO} ${FLEET_PATH}

echo "✅ Repository cloned: \$(find ${FLEET_PATH} -name '*.ts' -o -name '*.tsx' | wc -l) TypeScript files"
ENDSSH

# Step 6: Create agent startup script on VM
echo ""
echo "🔧 Step 6: Creating agent startup script..."
ssh ${VM_USER}@${VM_IP} << 'ENDSSH'
cat > /home/azureuser/qa-framework/start-agents.ts << 'EOF'
import { MultiAgentOrchestrator } from './src/agents/multi-agent-orchestrator'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()

async function main() {
  console.log('🤖 Starting 30-Agent QA System')
  console.log('================================')

  // Initialize orchestrator
  const orchestrator = new MultiAgentOrchestrator(
    process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/qa_framework',
    process.env.REDIS_URL || 'redis://localhost:6380',
    {
      openai: process.env.OPENAI_API_KEY!,
      grok: process.env.GROK_API_KEY!,
      anthropic: process.env.ANTHROPIC_API_KEY!
    },
    8080  // WebSocket port
  )

  // Start analyzing the fleet repository
  const report = await orchestrator.analyzeCodebase('/home/azureuser/fleet-analysis')

  console.log('\n✅ Analysis Complete!')
  console.log('===================')
  console.log(JSON.stringify(report, null, 2))

  process.exit(0)
}

main().catch((error) => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})
EOF

echo "✅ Startup script created"
ENDSSH

# Step 7: Verify environment variables on VM
echo ""
echo "🔐 Step 7: Verifying API keys..."
ssh ${VM_USER}@${VM_IP} << 'ENDSSH'
cd /home/azureuser/qa-framework

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Creating from template..."
    cat > .env << 'EOF'
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/qa_framework
REDIS_URL=redis://localhost:6380

# AI API Keys (REQUIRED - set these!)
OPENAI_API_KEY=${OPENAI_API_KEY}
GROK_API_KEY=${GROK_API_KEY}
ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
EOF
fi

# Validate API keys are set
if ! grep -q "^OPENAI_API_KEY=sk-" .env 2>/dev/null; then
    echo "⚠️  OPENAI_API_KEY not set in .env"
fi

if ! grep -q "^GROK_API_KEY=xai-" .env 2>/dev/null; then
    echo "⚠️  GROK_API_KEY not set in .env"
fi

if ! grep -q "^ANTHROPIC_API_KEY=sk-ant-" .env 2>/dev/null; then
    echo "⚠️  ANTHROPIC_API_KEY not set in .env"
fi

echo "✅ Environment configuration checked"
ENDSSH

# Step 8: Build TypeScript on VM
echo ""
echo "🔨 Step 8: Building TypeScript..."
ssh ${VM_USER}@${VM_IP} << 'ENDSSH'
cd /home/azureuser/qa-framework
npm run build
echo "✅ Build complete"
ENDSSH

# Step 9: Start the agents in background
echo ""
echo "🚀 Step 9: Starting 30-agent analysis..."
ssh ${VM_USER}@${VM_IP} << 'ENDSSH'
cd /home/azureuser/qa-framework

# Kill any existing agent processes
pkill -f "start-agents" || true

# Start agents in background with logging
echo "Starting agents..."
nohup npx ts-node start-agents.ts > agent-output.log 2>&1 &
AGENT_PID=$!

echo "✅ Agents started with PID: ${AGENT_PID}"
echo "📊 WebSocket server available at: ws://172.173.175.71:8080"
echo "📝 Logs available at: /home/azureuser/qa-framework/agent-output.log"
echo ""
echo "To monitor progress:"
echo "  ssh azureuser@172.173.175.71 'tail -f /home/azureuser/qa-framework/agent-output.log'"
ENDSSH

# Final instructions
echo ""
echo "✅ Deployment Complete!"
echo "======================="
echo ""
echo "📊 Real-time monitoring:"
echo "  WebSocket: ws://172.173.175.71:8080"
echo ""
echo "📝 View logs:"
echo "  ssh ${VM_USER}@${VM_IP} 'tail -f ${QA_FRAMEWORK_PATH}/agent-output.log'"
echo ""
echo "🔍 Check agent status:"
echo "  ssh ${VM_USER}@${VM_IP} 'ps aux | grep start-agents'"
echo ""
echo "The 30 agents are now analyzing the asmortongpt/fleet codebase using:"
echo "  ✓ RAG (Retrieval-Augmented Generation) for code context"
echo "  ✓ CAG (Context-Augmented Generation) for AI-powered fixes"
echo "  ✓ MCP (Model Context Protocol) for quality gates"
echo "  ✓ PostgreSQL for knowledge base and embeddings"
echo "  ✓ Redis for caching"
echo ""
echo "Analysis in progress... This may take 30-60 minutes for full codebase."
