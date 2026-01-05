#!/bin/bash

# ============================================================================
# Fleet Quality Assurance Framework Deployment Script
# ============================================================================
# Purpose: Deploy QA Framework with RAG/CAG/MCP to Azure VM
# Target VM: fleet-build-test-vm (172.173.175.71)
# Components: RAG indexing, CAG fixes, 10 quality gates, MCP servers
# Date: 2026-01-04
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
VM_IP="${AZURE_VM_IP:-172.173.175.71}"
VM_USER="${AZURE_VM_USER:-azureuser}"
QA_DIR="qa-framework"

echo -e "${BLUE}=============================================="
echo "Fleet QA Framework Deployment"
echo "===============================================${NC}"
echo "VM: $VM_IP"
echo "User: $VM_USER"
echo ""

# Function to print status
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[i]${NC} $1"
}

# Step 1: Check prerequisites
print_info "Checking prerequisites..."
if [ -z "$ANTHROPIC_API_KEY" ]; then
    print_error "ANTHROPIC_API_KEY not set"
    echo "Please set: export ANTHROPIC_API_KEY=your-key"
    exit 1
fi
print_status "Prerequisites OK"

# Step 2: Retrieve QA framework from VM
print_info "Retrieving existing QA framework from VM..."
ssh ${VM_USER}@${VM_IP} "cd ~ && tar -czf qa-framework-backup.tar.gz qa-framework/"
scp ${VM_USER}@${VM_IP}:~/qa-framework-backup.tar.gz /tmp/
print_status "Framework retrieved"

# Step 3: Extract and prepare
print_info "Preparing deployment package..."
cd /tmp
tar -xzf qa-framework-backup.tar.gz
cd qa-framework

# Update .env with fresh API keys
cat > .env <<EOF
# Database
DATABASE_URL=postgresql://qauser:qapass_secure_2026@localhost:5433/fleet_qa
REDIS_URL=redis://localhost:6380

# AI APIs
ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
OPENAI_API_KEY=${OPENAI_API_KEY:-}
GROK_API_KEY=${GROK_API_KEY:-}

# Paths
FLEETOPS_PATH=/home/${VM_USER}/Fleet
EVIDENCE_VAULT=/home/${VM_USER}/qa-framework/evidence-vault
EOF

# Create README for deployment
cat > DEPLOYMENT_README.md <<'EOFREADME'
# QA Framework Deployment

## Quick Start

1. **Start Infrastructure**:
   ```bash
   docker-compose up -d
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Index Codebase (RAG)**:
   ```bash
   npx tsx -e "
   import { SimpleRAGIndexer } from './src/rag/indexer.js';
   const indexer = new SimpleRAGIndexer();
   await indexer.indexRepository('/home/azureuser/Fleet');
   await indexer.close();
   console.log('✅ RAG indexing complete');
   "
   ```

4. **Run Quality Gates**:
   ```bash
   npx tsx src/orchestrator/master.ts
   ```

5. **Run AI Remediation** (if needed):
   ```bash
   npx tsx src/loop/remediation-loop.ts
   ```

6. **View Results**:
   ```bash
   cat PRODUCTION_READINESS_REPORT_100.md
   ```

## Health Checks

```bash
# Database
psql -U qauser -h localhost -p 5433 -d fleet_qa -c "SELECT COUNT(*) FROM code_embeddings;"

# Redis
redis-cli -h localhost -p 6380 PING

# Docker services
docker-compose ps
```

## Maintenance

### View Logs
```bash
docker-compose logs -f
```

### Backup Evidence
```bash
tar -czf evidence-backup-$(date +%Y%m%d).tar.gz evidence-vault/
```

### Restart Services
```bash
docker-compose restart
```
EOFREADME

# Create quick setup script
cat > setup.sh <<'EOFSETUP'
#!/bin/bash
set -e

echo "🚀 Setting up QA Framework..."

# Start Docker services
echo "📦 Starting Docker services..."
docker-compose up -d

# Wait for PostgreSQL
echo "⏳ Waiting for PostgreSQL..."
until docker-compose exec -T postgres pg_isready -U qauser -d fleet_qa; do
  sleep 2
done

# Install dependencies
echo "📚 Installing Node.js dependencies..."
npm install --legacy-peer-deps

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Index codebase: npx tsx src/rag/indexer.ts"
echo "  2. Run gates: npx tsx src/orchestrator/master.ts"
echo ""
EOFSETUP

chmod +x setup.sh

# Archive updated framework
cd /tmp
tar -czf qa-framework-deploy.tar.gz qa-framework/
print_status "Deployment package prepared"

# Step 4: Transfer to VM
print_info "Transferring to Azure VM..."
scp qa-framework-deploy.tar.gz ${VM_USER}@${VM_IP}:/tmp/
print_status "Transfer complete"

# Step 5: Deploy on VM
print_info "Deploying on Azure VM..."
ssh ${VM_USER}@${VM_IP} <<'EOFVM'
set -e

cd ~

# Backup existing if present
if [ -d "qa-framework" ]; then
    echo "📦 Backing up existing installation..."
    mv qa-framework qa-framework.backup.$(date +%Y%m%d_%H%M%S)
fi

# Extract new deployment
echo "📂 Extracting deployment..."
tar -xzf /tmp/qa-framework-deploy.tar.gz

cd qa-framework

# Run setup
echo "⚙️  Running setup..."
bash setup.sh

echo ""
echo "======================================"
echo "✅ QA Framework Deployed!"
echo "======================================"
echo "Location: ~/qa-framework"
echo ""
echo "Next steps:"
echo "  1. Index codebase:"
echo "     cd ~/qa-framework"
echo "     npx tsx -e \"import { SimpleRAGIndexer } from './src/rag/indexer.js'; const i = new SimpleRAGIndexer(); await i.indexRepository('$HOME/Fleet'); await i.close();\""
echo ""
echo "  2. Run quality gates:"
echo "     npx tsx src/orchestrator/master.ts"
echo ""
echo "  3. View results:"
echo "     cat PRODUCTION_READINESS_REPORT_100.md"
echo "======================================"
EOFVM

print_status "Deployment complete!"

# Cleanup
rm -rf /tmp/qa-framework /tmp/qa-framework-deploy.tar.gz /tmp/qa-framework-backup.tar.gz

echo ""
echo -e "${GREEN}======================================"
echo "✅ QA Framework Successfully Deployed!"
echo "======================================${NC}"
echo "VM: $VM_IP"
echo "Location: /home/${VM_USER}/qa-framework"
echo ""
echo "Test deployment:"
echo "  ssh ${VM_USER}@${VM_IP} 'cd qa-framework && docker-compose ps'"
echo ""
echo "Next: Index codebase and run gates"
echo ""
