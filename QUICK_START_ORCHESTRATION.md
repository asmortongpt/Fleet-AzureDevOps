# Fleet Orchestration System - Quick Start

**🚀 Fast Track: Deploy orchestration infrastructure in 30 minutes**

---

## Prerequisites Checklist

- [ ] Azure CLI authenticated (`az account show`)
- [ ] GitHub PAT with repo access
- [ ] SSH access to fleet-agent-orchestrator (172.191.51.49)

---

## Step 1: SSH to Orchestrator VM (2 minutes)

```bash
# Option A: Direct SSH
ssh azureuser@172.191.51.49

# Option B: Azure CLI
az vm run-command invoke \
  --resource-group FLEET-AI-AGENTS \
  --name fleet-agent-orchestrator \
  --command-id RunShellScript \
  --scripts "whoami && hostname"
```

---

## Step 2: Clone & Setup (5 minutes)

```bash
# Clone Fleet repository
git clone https://github.com/asmortongpt/Fleet.git /opt/fleet
cd /opt/fleet/.orchestrator

# Create environment file
cat > .env << 'EOF'
ORCHESTRATOR_DB_PASSWORD=FleetOrch2025SecurePass!
GITHUB_PAT=YOUR_GITHUB_PAT_HERE
NODE_ENV=production
LOG_LEVEL=info
PORT=3000
EOF

# IMPORTANT: Replace YOUR_GITHUB_PAT_HERE with actual token
```

---

## Step 3: Start Infrastructure (15 minutes)

```bash
# Install Docker (if needed)
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER

# Install Docker Compose (if needed)
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Node.js 20 (if needed)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Start database and Redis
docker-compose up -d postgres redis

# Wait for database to be ready
sleep 30
```

---

## Step 4: Build & Deploy API (10 minutes)

```bash
# Install dependencies
cd /opt/fleet/.orchestrator/api
npm install --legacy-peer-deps

# Build TypeScript
npm run build

# Seed database with tasks
npm run seed

# Start orchestrator API
cd /opt/fleet/.orchestrator
docker-compose up -d orchestrator
```

---

## Step 5: Verify Deployment (3 minutes)

```bash
# Check all services running
docker ps

# Expected output:
# fleet-orchestrator-api
# fleet-orchestrator-db
# fleet-orchestrator-redis

# Test API health
curl http://localhost:3000/health

# Expected: {"status":"healthy","timestamp":"...","uptime":...}

# View tasks
curl http://localhost:3000/api/tasks | jq

# View agents
curl http://localhost:3000/api/agents | jq

# View progress summary
curl http://localhost:3000/api/progress/summary | jq
```

---

## Step 6: Monitor Logs (ongoing)

```bash
# View all logs
docker-compose logs -f

# View orchestrator only
docker-compose logs -f orchestrator

# View database logs
docker-compose logs -f postgres
```

---

## API Endpoints Reference

### Core Operations
```bash
# Get all tasks
curl http://172.191.51.49:3000/api/tasks

# Get ready tasks (no blockers)
curl http://172.191.51.49:3000/api/tasks/ready/list

# Get agent status
curl http://172.191.51.49:3000/api/agents

# Get progress summary
curl http://172.191.51.49:3000/api/progress/summary

# Get merge queue
curl http://172.191.51.49:3000/api/git/merge-queue
```

### Agent Operations
```bash
# Register agent (heartbeat)
curl -X POST http://172.191.51.49:3000/api/agents/heartbeat \
  -H "Content-Type: application/json" \
  -d '{
    "name": "agent-d",
    "llm_model": "claude-sonnet-4",
    "role": "maintenance-repository",
    "vm_host": "fleet-dev-agent-01"
  }'
```

### Task Assignment
```bash
# Assign task to agent
curl -X POST http://172.191.51.49:3000/api/assignments \
  -H "Content-Type: application/json" \
  -d '{
    "task_id": "TASK_UUID_HERE",
    "agent_id": "AGENT_UUID_HERE",
    "notes": "Starting maintenance repositories"
  }'
```

---

## Troubleshooting

### API not responding
```bash
docker-compose restart orchestrator
docker-compose logs orchestrator
```

### Database errors
```bash
docker-compose restart postgres
docker exec fleet-orchestrator-db psql -U orchestrator -d fleet_orchestrator -c "SELECT 1"
```

### Port already in use
```bash
sudo lsof -i :3000
sudo kill -9 <PID>
docker-compose up -d orchestrator
```

### Reset everything
```bash
docker-compose down -v
docker-compose up -d postgres redis
sleep 30
cd api && npm run seed && cd ..
docker-compose up -d orchestrator
```

---

## Next Steps After Deployment

1. **Verify orchestrator responding:**
   ```bash
   curl http://172.191.51.49:3000/health
   ```

2. **Review seeded tasks:**
   ```bash
   curl http://172.191.51.49:3000/api/tasks | jq '.tasks[] | {epic: .epic_number, issue: .issue_number, title: .title}'
   ```

3. **Check agent status:**
   ```bash
   curl http://172.191.51.49:3000/api/agents | jq
   ```

4. **Deploy worker agents** (Phase 2):
   - Implement agent Docker images
   - Deploy to fleet-dev-agent-01 and agent-settings
   - Configure agents to report to orchestrator

5. **Build dashboard** (Phase 3):
   - React app with real-time monitoring
   - WebSocket connection to orchestrator
   - Agent status grid, progress charts

---

## Performance Expectations

### Current (3 Agents)
- Velocity: 18.8x
- ETA: ~3 weeks

### After VM Deployment (7 Agents)
- Velocity: ~50x
- ETA: ~10-12 days

### Target (16+ Agents)
- Velocity: **100x+**
- ETA: **5-7 days**

---

## Key Files

- **Schema:** `/opt/fleet/.orchestrator/db/schema.sql`
- **API:** `/opt/fleet/.orchestrator/api/src/server.ts`
- **Config:** `/opt/fleet/.orchestrator/docker-compose.yml`
- **Logs:** `/opt/fleet/.orchestrator/logs/`

---

## Support Resources

- **Full Guide:** `.orchestrator/DEPLOYMENT_GUIDE.md`
- **Status:** `ORCHESTRATION_INFRASTRUCTURE_STATUS.md`
- **Summary:** `DISTRIBUTED_DEPLOYMENT_SUMMARY.md`

---

**Total Time:** 30-45 minutes
**Status:** Production-ready orchestration hub
**Next:** Deploy worker agents (Phase 2)

---

*Quick reference for Fleet distributed agent orchestration deployment*
