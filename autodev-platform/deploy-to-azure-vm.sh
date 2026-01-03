#!/bin/bash

##############################################################################
# AutoDev Platform - Azure VM Deployment Automation
#
# This script deploys the complete autonomous development platform to an
# Azure VM, including all MCP servers, orchestrator, and infrastructure.
##############################################################################

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
VM_NAME="${VM_NAME:-autodev-vm}"
RESOURCE_GROUP="${RESOURCE_GROUP:-A_Morton}"
ADMIN_USER="${ADMIN_USER:-autodev}"
VM_SIZE="${VM_SIZE:-Standard_D8s_v3}"
DEPLOY_PATH="/opt/fleet-autodev"

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Banner
echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║   AutoDev Platform - Azure VM Deployment                      ║"
echo "║   Complete Autonomous Development System                      ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

##############################################################################
# Step 1: Check Prerequisites
##############################################################################

log_info "Checking prerequisites..."

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    log_error "Azure CLI is not installed. Please install it first."
    exit 1
fi

# Check if logged in to Azure
if ! az account show &> /dev/null; then
    log_error "Not logged in to Azure. Run 'az login' first."
    exit 1
fi

# Check if required environment variables are set
if [ -z "${ANTHROPIC_API_KEY:-}" ]; then
    log_warning "ANTHROPIC_API_KEY not set in environment"
fi

if [ -z "${OPENAI_API_KEY:-}" ]; then
    log_warning "OPENAI_API_KEY not set in environment"
fi

log_success "Prerequisites check complete"

##############################################################################
# Step 2: Create or Verify Azure VM
##############################################################################

log_info "Checking if VM exists..."

if az vm show --resource-group "$RESOURCE_GROUP" --name "$VM_NAME" &> /dev/null; then
    log_success "VM $VM_NAME already exists"
    VM_IP=$(az vm show -d --resource-group "$RESOURCE_GROUP" --name "$VM_NAME" --query publicIps -o tsv)
else
    log_info "Creating new Azure VM..."

    az vm create \
        --resource-group "$RESOURCE_GROUP" \
        --name "$VM_NAME" \
        --image Ubuntu2204 \
        --size "$VM_SIZE" \
        --admin-username "$ADMIN_USER" \
        --generate-ssh-keys \
        --public-ip-sku Standard \
        --output table

    # Get VM IP
    VM_IP=$(az vm show -d --resource-group "$RESOURCE_GROUP" --name "$VM_NAME" --query publicIps -o tsv)

    log_success "VM created successfully at $VM_IP"

    # Open required ports
    log_info "Opening firewall ports..."
    az vm open-port --port 8000-8005 --resource-group "$RESOURCE_GROUP" --name "$VM_NAME" --priority 1001
    az vm open-port --port 5555 --resource-group "$RESOURCE_GROUP" --name "$VM_NAME" --priority 1002
    log_success "Firewall configured"
fi

##############################################################################
# Step 3: Install Docker and Dependencies on VM
##############################################################################

log_info "Installing Docker and dependencies on VM..."

ssh -o StrictHostKeyChecking=no "$ADMIN_USER@$VM_IP" << 'REMOTE_SCRIPT'
set -euo pipefail

echo "[VM] Updating system packages..."
sudo apt-get update -qq

echo "[VM] Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sudo sh
    sudo systemctl enable docker
    sudo systemctl start docker
    sudo usermod -aG docker $USER
fi

echo "[VM] Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

echo "[VM] Installing additional dependencies..."
sudo apt-get install -y git make curl jq python3-pip -qq

echo "[VM] Docker and dependencies installed successfully"
REMOTE_SCRIPT

log_success "VM setup complete"

##############################################################################
# Step 4: Deploy Platform Code to VM
##############################################################################

log_info "Deploying platform code to VM..."

# Create deployment directory
ssh "$ADMIN_USER@$VM_IP" "sudo mkdir -p $DEPLOY_PATH && sudo chown -R $ADMIN_USER:$ADMIN_USER $DEPLOY_PATH"

# Copy platform files
log_info "Copying files to VM..."
rsync -avz --progress \
    --exclude='node_modules' \
    --exclude='__pycache__' \
    --exclude='.git' \
    --exclude='*.pyc' \
    ./ "$ADMIN_USER@$VM_IP:$DEPLOY_PATH/"

log_success "Files copied to VM"

##############################################################################
# Step 5: Create Environment File
##############################################################################

log_info "Creating environment file..."

ssh "$ADMIN_USER@$VM_IP" "cat > $DEPLOY_PATH/.env" << ENV_FILE
# AutoDev Platform Environment Configuration
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-autodev_secure_$(openssl rand -hex 16)}
ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
OPENAI_API_KEY=${OPENAI_API_KEY}
AZURE_DEVOPS_PAT=${AZURE_DEVOPS_PAT:-}
GEMINI_API_KEY=${GEMINI_API_KEY:-}
GROK_API_KEY=${GROK_API_KEY:-}

# Service URLs
MCP_REPO_TOOLS_URL=http://mcp-repo-tools:8001
MCP_TEST_TOOLS_URL=http://mcp-test-tools:8002
MCP_BROWSER_TOOLS_URL=http://mcp-browser-tools:8003
MCP_SECURITY_TOOLS_URL=http://mcp-security-tools:8004
MCP_DEVOPS_TOOLS_URL=http://mcp-devops-tools:8005

# Database
POSTGRES_URL=postgresql://autodev:\${POSTGRES_PASSWORD}@postgres:5432/autodev

# Redis
REDIS_URL=redis://redis:6379/0
ENV_FILE

log_success "Environment file created"

##############################################################################
# Step 6: Generate Remaining Platform Files
##############################################################################

log_info "Generating remaining platform files on VM..."

ssh "$ADMIN_USER@$VM_IP" "cd $DEPLOY_PATH && bash" << 'GENERATE_FILES'
set -euo pipefail

# Create test_tools Dockerfile
cat > mcp/test_tools/Dockerfile << 'EOF'
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    git curl nodejs npm \
    && npm install -g jest vitest pytest \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY server.py .

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8002}/health || exit 1

CMD ["python", "server.py"]
EOF

cat > mcp/test_tools/requirements.txt << 'EOF'
fastapi==0.109.0
uvicorn[standard]==0.27.0
pydantic==2.5.3
python-multipart==0.0.6
httpx==0.26.0
pytest==7.4.4
pytest-json-report==1.5.0
coverage==7.4.0
EOF

# Create browser_tools server and Dockerfile
cat > mcp/browser_tools/server.py << 'PYEOF'
"""MCP Server: Browser Tools - Playwright E2E Testing"""
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
import subprocess
import os
from datetime import datetime

app = FastAPI(title="MCP Browser Tools", version="1.0.0")

class E2ETestRequest(BaseModel):
    repo_path: str
    test_pattern: str = "**/*.spec.ts"
    browser: str = "chromium"
    headed: bool = False

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "mcp-browser-tools", "timestamp": datetime.utcnow().isoformat()}

@app.post("/e2e/run")
async def run_e2e_tests(req: E2ETestRequest):
    try:
        result = subprocess.run(
            ["npx", "playwright", "test", req.test_pattern,
             "--browser", req.browser,
             "--reporter=html,json",
             "--trace=on-first-retry"],
            cwd=req.repo_path,
            capture_output=True,
            text=True,
            timeout=600
        )
        return {
            "success": result.returncode == 0,
            "output": result.stdout,
            "report_path": f"{req.repo_path}/playwright-report/index.html"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8003)))
PYEOF

cat > mcp/browser_tools/Dockerfile << 'EOF'
FROM mcr.microsoft.com/playwright/python:v1.40.0-jammy

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY server.py .

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8003}/health || exit 1

CMD ["python", "server.py"]
EOF

cat > mcp/browser_tools/requirements.txt << 'EOF'
fastapi==0.109.0
uvicorn[standard]==0.27.0
pydantic==2.5.3
playwright==1.40.0
httpx==0.26.0
EOF

# Create security_tools server
cat > mcp/security_tools/server.py << 'PYEOF'
"""MCP Server: Security Tools - SAST, SCA, Secret Scanning"""
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
import subprocess
import os
import re
from datetime import datetime

app = FastAPI(title="MCP Security Tools", version="1.0.0")

class SecurityScanRequest(BaseModel):
    repo_path: str
    scan_type: str  # sca, sast, secrets, license

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "mcp-security-tools", "timestamp": datetime.utcnow().isoformat()}

@app.post("/scan/secrets")
async def scan_secrets(req: SecurityScanRequest):
    """Scan for hardcoded secrets."""
    try:
        # Simple regex-based secret detection
        secret_patterns = [
            (r'(?i)(api[_-]?key|apikey)\s*[:=]\s*["\']?([a-zA-Z0-9_\-]{20,})', "API Key"),
            (r'(?i)(password|passwd|pwd)\s*[:=]\s*["\']([^"\']+)', "Password"),
            (r'(?i)(secret|token)\s*[:=]\s*["\']?([a-zA-Z0-9_\-]{20,})', "Secret/Token"),
            (r'["\']([a-f0-9]{32})["\']', "MD5 Hash"),
            (r'["\']([a-f0-9]{40})["\']', "SHA1 Hash"),
        ]

        findings = []
        for root, dirs, files in os.walk(req.repo_path):
            for file in files:
                if file.endswith(('.py', '.js', '.ts', '.env', '.config')):
                    file_path = os.path.join(root, file)
                    try:
                        with open(file_path, 'r', encoding='utf-8') as f:
                            for i, line in enumerate(f, 1):
                                for pattern, secret_type in secret_patterns:
                                    if re.search(pattern, line):
                                        findings.append({
                                            "file": file_path,
                                            "line": i,
                                            "type": secret_type,
                                            "severity": "HIGH"
                                        })
                    except Exception:
                        continue

        return {
            "success": True,
            "findings": findings,
            "total": len(findings)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/scan/sca")
async def scan_dependencies(req: SecurityScanRequest):
    """Software Composition Analysis - check dependencies for CVEs."""
    try:
        result = subprocess.run(
            ["npm", "audit", "--json"],
            cwd=req.repo_path,
            capture_output=True,
            text=True
        )
        import json
        audit_data = json.loads(result.stdout) if result.stdout else {}

        return {
            "success": True,
            "vulnerabilities": audit_data.get("vulnerabilities", {}),
            "metadata": audit_data.get("metadata", {})
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8004)))
PYEOF

cat > mcp/security_tools/Dockerfile << 'EOF'
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y git curl nodejs npm && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY server.py .

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8004}/health || exit 1

CMD ["python", "server.py"]
EOF

cat > mcp/security_tools/requirements.txt << 'EOF'
fastapi==0.109.0
uvicorn[standard]==0.27.0
pydantic==2.5.3
httpx==0.26.0
EOF

# Create devops_tools server
cat > mcp/devops_tools/server.py << 'PYEOF'
"""MCP Server: DevOps Tools - Azure DevOps, Terraform, Docker"""
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
import os
from datetime import datetime

app = FastAPI(title="MCP DevOps Tools", version="1.0.0")

class PipelineRequest(BaseModel):
    project_name: str
    repo_path: str
    target_env: str = "production"

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "mcp-devops-tools", "timestamp": datetime.utcnow().isoformat()}

@app.post("/pipeline/generate")
async def generate_pipeline(req: PipelineRequest):
    """Generate Azure DevOps pipeline YAML."""
    pipeline_yaml = f"""
trigger:
  branches:
    include:
      - main

pool:
  vmImage: 'ubuntu-latest'

variables:
  projectName: '{req.project_name}'
  environment: '{req.target_env}'

stages:
  - stage: Build
    jobs:
      - job: BuildAndTest
        steps:
          - task: NodeTool@0
            inputs:
              versionSpec: '20.x'
          - script: npm ci
            displayName: 'Install dependencies'
          - script: npm run lint
            displayName: 'Run linting'
          - script: npm test
            displayName: 'Run tests'
          - script: npm run build
            displayName: 'Build application'

  - stage: Deploy
    dependsOn: Build
    condition: succeeded()
    jobs:
      - deployment: DeployProduction
        environment: $(environment)
        strategy:
          runOnce:
            deploy:
              steps:
                - script: echo "Deploying to production"
                  displayName: 'Deploy'
"""
    return {"success": True, "pipeline_yaml": pipeline_yaml}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8005)))
PYEOF

cat > mcp/devops_tools/Dockerfile << 'EOF'
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y git curl && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY server.py .

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8005}/health || exit 1

CMD ["python", "server.py"]
EOF

cat > mcp/devops_tools/requirements.txt << 'EOF'
fastapi==0.109.0
uvicorn[standard]==0.27.0
pydantic==2.5.3
httpx==0.26.0
EOF

# Create orchestrator
mkdir -p orchestrator

cat > orchestrator/Dockerfile << 'EOF'
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y git curl postgresql-client && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["python", "main.py"]
EOF

cat > orchestrator/requirements.txt << 'EOF'
fastapi==0.109.0
uvicorn[standard]==0.27.0
pydantic==2.5.3
celery==5.3.4
redis==5.0.1
psycopg2-binary==2.9.9
sqlalchemy==2.0.25
alembic==1.13.1
httpx==0.26.0
langchain==0.1.0
openai==1.10.0
anthropic==0.8.1
pgvector==0.2.4
flower==2.0.1
EOF

cat > orchestrator/main.py << 'PYEOF'
"""AutoDev Orchestrator - Main API Server"""
from fastapi import FastAPI
from datetime import datetime
import os

app = FastAPI(title="AutoDev Orchestrator", version="1.0.0")

@app.get("/")
async def root():
    return {"message": "AutoDev Orchestrator API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "orchestrator",
        "timestamp": datetime.utcnow().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
PYEOF

cat > orchestrator/tasks.py << 'PYEOF'
"""Celery tasks for AutoDev Platform"""
from celery import Celery
import os

redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
app = Celery("autodev", broker=redis_url, backend=redis_url)

@app.task
def example_task(x, y):
    return x + y
PYEOF

# Create no_ai_fingerprints gate
mkdir -p scripts/gates

cat > scripts/gates/no_ai_fingerprints.sh << 'GEOF'
#!/bin/bash
# Quality Gate: No AI Fingerprints
# Detects TODO, placeholder functions, mock data, AI-generated patterns

REPO_PATH="${1:-.}"
FAILURES=0

echo "Scanning for AI fingerprints in $REPO_PATH..."

# Check for TODO/FIXME
TODO_COUNT=$(grep -r "TODO\|FIXME" "$REPO_PATH" --include="*.ts" --include="*.tsx" --include="*.py" --include="*.js" | wc -l)
if [ "$TODO_COUNT" -gt 0 ]; then
    echo "FAIL: Found $TODO_COUNT TODO/FIXME comments"
    FAILURES=$((FAILURES + 1))
fi

# Check for placeholder functions
PLACEHOLDER_COUNT=$(grep -r "throw new Error.*not implemented\|raise NotImplementedError\|# TODO:" "$REPO_PATH" --include="*.ts" --include="*.tsx" --include="*.py" | wc -l)
if [ "$PLACEHOLDER_COUNT" -gt 0 ]; then
    echo "FAIL: Found $PLACEHOLDER_COUNT placeholder functions"
    FAILURES=$((FAILURES + 1))
fi

# Check for mock data arrays in production code
MOCK_DATA_COUNT=$(grep -r "const mockData.*=.*\[\|mock_data.*=" "$REPO_PATH/src" --include="*.ts" --include="*.tsx" --include="*.py" 2>/dev/null | wc -l)
if [ "$MOCK_DATA_COUNT" -gt 0 ]; then
    echo "FAIL: Found $MOCK_DATA_COUNT mock data declarations in src/"
    FAILURES=$((FAILURES + 1))
fi

if [ $FAILURES -eq 0 ]; then
    echo "PASS: No AI fingerprints detected"
    exit 0
else
    echo "FAIL: Detected $FAILURES AI fingerprint issues"
    exit 1
fi
GEOF

chmod +x scripts/gates/no_ai_fingerprints.sh

echo "Platform files generated successfully"
GENERATE_FILES

log_success "Platform files generated"

##############################################################################
# Step 7: Build and Start Platform
##############################################################################

log_info "Building and starting platform on VM..."

ssh "$ADMIN_USER@$VM_IP" "cd $DEPLOY_PATH && newgrp docker << 'BUILD_CMD'
set -euo pipefail

echo '[VM] Building Docker images...'
docker-compose build --parallel

echo '[VM] Starting services...'
docker-compose up -d

echo '[VM] Waiting for services to be ready...'
sleep 15

echo '[VM] Verifying services...'
docker-compose ps

echo '[VM] Platform started successfully'
BUILD_CMD
"

log_success "Platform started on VM"

##############################################################################
# Step 8: Verify Deployment
##############################################################################

log_info "Verifying deployment..."

sleep 5

# Check each service
SERVICES=("orchestrator:8000" "mcp-repo-tools:8001" "mcp-test-tools:8002" "mcp-browser-tools:8003" "mcp-security-tools:8004" "mcp-devops-tools:8005")

for service in "${SERVICES[@]}"; do
    NAME="${service%%:*}"
    PORT="${service##*:}"

    if curl -f -s "http://$VM_IP:$PORT/health" > /dev/null 2>&1; then
        log_success "$NAME health check passed"
    else
        log_warning "$NAME health check failed (may still be starting)"
    fi
done

##############################################################################
# Summary
##############################################################################

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║   Deployment Complete!                                         ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo "VM IP Address: $VM_IP"
echo ""
echo "Service Endpoints:"
echo "  Orchestrator:     http://$VM_IP:8000"
echo "  Repo Tools:       http://$VM_IP:8001"
echo "  Test Tools:       http://$VM_IP:8002"
echo "  Browser Tools:    http://$VM_IP:8003"
echo "  Security Tools:   http://$VM_IP:8004"
echo "  DevOps Tools:     http://$VM_IP:8005"
echo "  Flower (Celery):  http://$VM_IP:5555"
echo ""
echo "To connect to VM:"
echo "  ssh $ADMIN_USER@$VM_IP"
echo ""
echo "To view logs:"
echo "  ssh $ADMIN_USER@$VM_IP 'cd $DEPLOY_PATH && docker-compose logs -f'"
echo ""
echo "To restart services:"
echo "  ssh $ADMIN_USER@$VM_IP 'cd $DEPLOY_PATH && docker-compose restart'"
echo ""

log_success "AutoDev Platform deployment complete!"
