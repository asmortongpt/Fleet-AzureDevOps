# Quick Deployment Guide - Fleet Agent Workers

**Goal:** Deploy 4 new autonomous agents (D, E, F, G) to scale from 3 to 7 total agents.

---

## Prerequisites

- ✅ SSH access to VMs (configured)
- ✅ GitHub PAT (in ~/.env)
- ✅ Anthropic API key (in ~/.env)
- ✅ Orchestrator running at http://172.191.51.49:3000

---

## 3-Step Deployment

### Step 1: Clone Repository to VMs (5 minutes)

```bash
# VM1 - Agents D & E
ssh azureuser@135.119.131.39
source /home/azureuser/fleet-agent-worker/.env
cd /workspace
git clone https://${GITHUB_TOKEN}@github.com/asmortongpt/Fleet.git
exit

# VM2 - Agents F & G
ssh azureuser@172.191.6.180
source /home/azureuser/fleet-agent-worker/.env
cd /workspace
git clone https://${GITHUB_TOKEN}@github.com/asmortongpt/Fleet.git
exit
```

### Step 2: Start Agents (2 minutes)

**Option A: Docker (Recommended)**
```bash
# VM1
ssh azureuser@135.119.131.39 "cd /home/azureuser/fleet-agent-worker && docker compose -f docker-compose.yml up -d"

# VM2
ssh azureuser@172.191.6.180 "cd /home/azureuser/fleet-agent-worker && docker compose -f docker-compose.fg.yml up -d"
```

**Option B: Direct Node.js (Faster)**
```bash
# VM1
ssh azureuser@135.119.131.39 << 'EOF'
cd /home/azureuser/fleet-agent-worker
source .env

# Start Agent D
AGENT_NAME=agent-d AGENT_ROLE=facilities-repos nohup npx tsx src/agent-worker.ts > agent-d.log 2>&1 &
echo "Agent D started: PID $!"

# Start Agent E
AGENT_NAME=agent-e AGENT_ROLE=incidents-repos nohup npx tsx src/agent-worker.ts > agent-e.log 2>&1 &
echo "Agent E started: PID $!"
EOF

# VM2
ssh azureuser@172.191.6.180 << 'EOF'
cd /home/azureuser/fleet-agent-worker
source .env

# Start Agent F
AGENT_NAME=agent-f AGENT_ROLE=remaining-repos nohup npx tsx src/agent-worker.ts > agent-f.log 2>&1 &
echo "Agent F started: PID $!"

# Start Agent G
AGENT_NAME=agent-g AGENT_ROLE=routes-migration nohup npx tsx src/agent-worker.ts > agent-g.log 2>&1 &
echo "Agent G started: PID $!"
EOF
```

### Step 3: Verify Deployment (1 minute)

```bash
cd /Users/andrewmorton/Documents/GitHub/Fleet/.orchestrator/scripts
./verify-agents.sh
```

**Expected Output:**
```
✓ Orchestrator API: Healthy
✓ Agents Registered: 7/7
✓ Tasks Available: 28
✓ Assignments: X
✓ Evidence: X

🎉 All systems operational!
```

---

## Quick Checks

### Check Registered Agents
```bash
curl -s http://172.191.51.49:3000/api/agents | jq '.agents[] | {name, role, active}'
```

### View Agent Logs (Docker)
```bash
# VM1
ssh azureuser@135.119.131.39 "cd /home/azureuser/fleet-agent-worker && docker compose logs -f agent-d"

# VM2
ssh azureuser@172.191.6.180 "cd /home/azureuser/fleet-agent-worker && docker compose logs -f agent-f"
```

### View Agent Logs (Node.js)
```bash
# VM1
ssh azureuser@135.119.131.39 "tail -f /home/azureuser/fleet-agent-worker/agent-d.log"

# VM2
ssh azureuser@172.191.6.180 "tail -f /home/azureuser/fleet-agent-worker/agent-f.log"
```

### Check Task Assignments
```bash
curl -s http://172.191.51.49:3000/api/assignments | jq '.assignments[] | {agent: .agent_name, task: .task_title, progress: .percent_complete}'
```

---

## Troubleshooting

### Agent Not Registering

```bash
# Check orchestrator is accessible
curl http://172.191.51.49:3000/health

# Check agent logs for errors
ssh azureuser@135.119.131.39 "docker compose logs agent-d | grep -i error"
```

### Git Operations Failing

```bash
# Verify GitHub token works
ssh azureuser@135.119.131.39 "cd /workspace/Fleet && git status"

# Test token manually
curl -H "Authorization: token ${GITHUB_PAT}" https://api.github.com/user
```

### Agent Stopped

```bash
# Restart Docker container
ssh azureuser@135.119.131.39 "docker compose restart agent-d"

# Or restart Node.js process
ssh azureuser@135.119.131.39 "pkill -f agent-d && cd /home/azureuser/fleet-agent-worker && AGENT_NAME=agent-d npx tsx src/agent-worker.ts &"
```

---

## Stop Agents

### Docker
```bash
ssh azureuser@135.119.131.39 "cd /home/azureuser/fleet-agent-worker && docker compose down"
ssh azureuser@172.191.6.180 "cd /home/azureuser/fleet-agent-worker && docker compose down"
```

### Node.js
```bash
ssh azureuser@135.119.131.39 "pkill -f agent-worker"
ssh azureuser@172.191.6.180 "pkill -f agent-worker"
```

---

## Next Steps After Deployment

1. **Monitor First Task Execution**
   - Watch agent logs for task claiming
   - Verify Git branch creation
   - Check commits being pushed

2. **Scale Testing**
   - Confirm all 7 agents can work in parallel
   - Monitor resource usage (CPU, memory)
   - Verify no conflicts in Git operations

3. **Production Hardening**
   - Set up systemd services for auto-restart
   - Configure log rotation
   - Add Prometheus monitoring
   - Migrate to Kubernetes (AKS)

---

## Architecture

```
Orchestrator (172.191.51.49:3000)
├── Agent A (existing)
├── Agent B (existing)
├── Agent C (existing)
├── Agent D (VM1: 135.119.131.39) ← NEW
├── Agent E (VM1: 135.119.131.39) ← NEW
├── Agent F (VM2: 172.191.6.180) ← NEW
└── Agent G (VM2: 172.191.6.180) ← NEW
```

---

**Time to Deploy:** ~8 minutes
**Complexity:** Low (copy-paste commands)
**Risk:** Low (can rollback by stopping containers)
**Impact:** 4-7x development speed increase

---

For detailed documentation, see: `.orchestrator/WORKER_DEPLOYMENT_STATUS.md`
