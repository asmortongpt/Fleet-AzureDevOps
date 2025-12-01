# Azure AI Agent Orchestrator for Fleet UI Rebuild

This system provisions Azure VMs and coordinates multiple AI coding agents (OpenAI Codex, Gemini Jules, Claude Sonnet) to rebuild the entire Fleet UI following Bloomberg Terminal design patterns.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ Azure VM (Standard_D8s_v3 - 8 vCPUs, 32GB RAM)             │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Orchestrator (Python)                                 │  │
│  │  - Task queue management                              │  │
│  │  - Agent coordination                                 │  │
│  │  - Progress tracking                                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                   │
│     ┌────────────────────┼────────────────────┐            │
│     │                    │                    │             │
│  ┌──▼────┐         ┌─────▼──┐         ┌──────▼─┐          │
│  │OpenAI │         │ Gemini │         │ Claude │          │
│  │ Codex │         │ Jules  │         │ Sonnet │          │
│  └───────┘         └────────┘         └────────┘          │
│                                                              │
│  Each agent:                                                │
│  - Receives UI rebuild tasks                                │
│  - Generates production code                                │
│  - Writes files to Fleet repository                         │
│  - Commits changes to Git                                   │
└─────────────────────────────────────────────────────────────┘
```

## Prerequisites

1. **Azure CLI** installed and authenticated
2. **API Keys** for:
   - OpenAI (GPT-4/Codex)
   - Google Gemini
   - Anthropic Claude
3. **GitHub Personal Access Token** with repo write access

## Quick Start

### Step 1: Set up environment variables

```bash
cp .env.example .env
# Edit .env with your API keys
```

### Step 2: Provision Azure VM

```bash
chmod +x provision-dev-vm.sh
./provision-dev-vm.sh
```

This creates:
- Resource Group: `fleet-dev-agents-rg`
- VM: `fleet-dev-agent-01` (8 vCPUs, 32GB RAM)
- Installs: Node.js, Git, Python 3.11, Docker
- Clones Fleet repository
- Sets up agent workspace

### Step 3: SSH into VM

```bash
# Get connection info
cat azure-vm-info.txt

# Connect
ssh azureuser@<VM_IP>
```

### Step 4: Start the orchestrator

```bash
cd /home/azureuser/agent-workspace

# Copy your .env file
scp .env azureuser@<VM_IP>:/home/azureuser/agent-workspace/

# Activate Python environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run orchestrator
python3 agent-orchestrator.py
```

## What It Does

The orchestrator executes 13 tasks to rebuild the Fleet UI:

### Phase 1: Design System (Tasks 1-5)
- Create enterprise design tokens
- Build DataGrid component
- Build KPIStrip component
- Build SidePanel component
- Build CommandPalette component

### Phase 2: Core Views (Tasks 6-10)
- Rebuild Dashboard
- Rebuild Vehicles view
- Rebuild Live Map
- Rebuild Maintenance view
- Rebuild Drivers view

### Phase 3: Integration & Polish (Tasks 11-13)
- Wire up to existing APIs
- Add keyboard navigation & accessibility
- Create E2E tests

## Task Assignment

Tasks are intelligently distributed across agents:

- **OpenAI Codex**: Best for component architecture
- **Gemini Jules**: Excellent for complex data grids
- **Claude Sonnet**: Superior for TypeScript types and accessibility

## Monitoring Progress

The orchestrator provides real-time progress updates:

```
🚀 Starting AI Agent Orchestrator
📋 Total tasks: 13
🤖 Agents: 3

🤖 [openai_codex] Executing task: task-001
  ✅ Created: src/styles/enterprise-tokens.css

🤖 [gemini_jules] Executing task: task-002
  ✅ Created: src/components/enterprise/DataGrid.tsx
  ✅ Created: src/components/enterprise/DataGrid.css

📊 Progress: 2/13 completed | 1 in progress | 10 pending | 0 failed
```

## Output

All generated code is:
- Written to `/home/azureuser/Fleet`
- Committed to Git with descriptive messages
- Production-ready TypeScript/React
- Follows Bloomberg Terminal design system
- Includes full accessibility support

## Cost Estimation

**Azure VM**: ~$0.38/hour (Standard_D8s_v3)
**API Costs** (estimated for full rebuild):
- OpenAI GPT-4: ~$20-30
- Google Gemini: ~$10-15
- Anthropic Claude: ~$15-20

**Total estimated cost**: $50-75 for complete rebuild

## Cleanup

```bash
# Delete Azure resources when done
az group delete --name fleet-dev-agents-rg --yes --no-wait
```

## Customization

Edit `agent-orchestrator.py` to:
- Add more tasks
- Change agent assignments
- Modify the design specification
- Add new AI providers
- Customize commit messages

## Troubleshooting

**Issue**: VM provisioning fails
```bash
# Check Azure CLI authentication
az login
az account list
```

**Issue**: Agent fails with API error
```bash
# Check API keys in .env
cat .env

# Test API connectivity
python3 -c "import openai; print(openai.api_key)"
```

**Issue**: Git commits fail
```bash
# Configure git on VM
git config --global user.name "AI Agent"
git config --global user.email "agent@fleet.dev"
```

## Advanced Usage

### Run specific tasks only

Edit `UI_REBUILD_TASKS` in `agent-orchestrator.py` to include only desired tasks.

### Use different VM sizes

For faster execution, use larger VMs:
- `Standard_D16s_v3` (16 vCPUs, 64GB RAM) - ~$0.76/hour
- `Standard_D32s_v3` (32 vCPUs, 128GB RAM) - ~$1.52/hour

### Parallel VMs

Provision multiple VMs and split tasks across them for even faster completion.

## Support

For issues or questions, refer to:
- [Fleet Repository](https://github.com/asmortongpt/Fleet)
- [Azure VM Documentation](https://docs.microsoft.com/en-us/azure/virtual-machines/)
- [OpenAI API Docs](https://platform.openai.com/docs)
