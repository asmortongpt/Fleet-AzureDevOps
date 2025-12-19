# Fleet AI Agents - Azure VM Deployment System

## Overview

This deployment system creates 5 specialized AI agents running on Azure VMs to complete the Fleet Management System development. Each agent uses external LLM APIs (Claude, GPT-4, Gemini) to generate production-ready code.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Azure Resource Group                        │
│              fleet-completion-agents-rg                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Agent 1    │  │   Agent 2    │  │   Agent 3    │      │
│  │ Data Tables  │  │   Charts     │  │    Forms     │      │
│  │              │  │              │  │              │      │
│  │ Claude 3.5   │  │  GPT-4       │  │  Gemini 1.5  │      │
│  │ Sonnet       │  │  Turbo       │  │  Pro         │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐                         │
│  │   Agent 4    │  │   Agent 5    │                         │
│  │ Performance  │  │  Storybook   │                         │
│  │              │  │              │                         │
│  │ Claude 3.5   │  │  GPT-4       │                         │
│  │ Sonnet       │  │  Turbo       │                         │
│  └──────────────┘  └──────────────┘                         │
│                                                               │
│  All VMs: Standard_B2s (2 vCPU, 4 GB RAM, Ubuntu 22.04)     │
│  Network: Virtual Network with NSG for security              │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ Git Push
                           ▼
                  ┌─────────────────┐
                  │ Azure DevOps    │
                  │ Fleet Repo      │
                  └─────────────────┘
```

## AI Agents

### Agent 1: Enterprise Data Table Builder
- **LLM**: Claude 3.5 Sonnet
- **Task**: Build EnterpriseDataTable component
- **Features**:
  - Column sorting (single + multi-column)
  - Advanced filtering (text, number, date, range)
  - Column resize/reorder via drag-and-drop
  - Row selection (single + multi-select)
  - Pagination with page size options
  - Virtual scrolling for 10,000+ rows
  - Export to CSV, Excel, PDF
  - Saved views/filters
  - Global search, inline editing, expandable rows
- **Output**: `src/components/tables/EnterpriseDataTable.tsx`

### Agent 2: Advanced Chart Library Builder
- **LLM**: GPT-4 Turbo
- **Task**: Build comprehensive chart library
- **Features**:
  - 15+ chart types (Line, Area, Bar, Pie, Donut, Gauge, Scatter, Bubble, Heatmap, TreeMap, Radar, Sparkline, Candlestick, Waterfall)
  - Dark mode support
  - Interactive tooltips and legends
  - Export to PNG, SVG, PDF
  - Zoom and pan capabilities
  - Responsive design
- **Output**: `src/components/charts/ChartLibrary.tsx`

### Agent 3: Complete Form System Builder
- **LLM**: Gemini 1.5 Pro
- **Task**: Build comprehensive form component system
- **Features**:
  - 15+ input types (Text, Number, Email, Password, TextArea, DatePicker, DateRangePicker, TimePicker, Select, Combobox, MultiSelect, RadioGroup, CheckboxGroup, Switch, Slider, FileUpload, ColorPicker, RichTextEditor, etc.)
  - Validation system (sync + async)
  - react-hook-form compatible
  - Accessibility compliant
  - Dark mode support
- **Output**: `src/components/forms/FormComponents.tsx`

### Agent 4: Performance Optimization Specialist
- **LLM**: Claude 3.5 Sonnet
- **Task**: Optimize performance and implement caching
- **Features**:
  - Vite config optimization (code splitting, bundle analysis)
  - React Query setup (caching, prefetching, optimistic updates)
  - Performance monitoring (Web Vitals, custom metrics)
  - Bundle size optimization
- **Outputs**:
  - `vite.config.optimized.ts`
  - `src/lib/react-query-setup.ts`
  - `src/lib/performance-monitoring.ts`

### Agent 5: Storybook Documentation Builder
- **LLM**: GPT-4 Turbo
- **Task**: Create comprehensive Storybook documentation
- **Features**:
  - Storybook 8 configuration
  - Story files for all components
  - Controls, actions, and docs
  - Light/dark theme toggle
  - Accessibility addon
- **Outputs**:
  - `.storybook/` configuration
  - `src/**/*.stories.tsx` for components

## Prerequisites

1. **Azure CLI** installed and authenticated:
   ```bash
   az login
   az account show
   ```

2. **API Keys** set in environment (from ~/.env):
   - `ANTHROPIC_API_KEY` - For Claude 3.5 Sonnet
   - `OPENAI_API_KEY` - For GPT-4 Turbo
   - `GEMINI_API_KEY` - For Gemini 1.5 Pro

3. **SSH Key** will be auto-generated:
   - `~/.ssh/fleet-agents-key`

4. **Git Repository** access:
   - Azure DevOps Fleet repository

## Quick Start

### 1. Deploy AI Agents

```bash
cd deployment/ai-agents
./deploy-agents.sh
```

This will:
- Create Azure resource group
- Deploy 5 VMs with networking
- Install Node.js, Python, Git on each VM
- Clone Fleet repository
- Install dependencies
- Start AI agents
- **Time**: ~10 minutes for setup, then 1-2 hours for agents to complete

### 2. Monitor Progress

```bash
# One-time status check
python3 monitor-dashboard.py

# Continuous monitoring (refreshes every 30 seconds)
watch -n 30 python3 monitor-dashboard.py
```

### 3. Check Individual Agent Logs

```bash
# SSH to specific VM
ssh -i ~/.ssh/fleet-agents-key azureuser@<PUBLIC_IP>

# View agent log
tail -f ~/agent.log

# Check agent status
cat ~/fleet-agent/fleet/agent*-status.json
```

### 4. Verify Commits

Once agents complete, check the repository:

```bash
git fetch origin
git log origin/stage-a/requirements-inception --oneline | head -10
```

You should see 5 new commits:
- feat: Add enterprise data table with all features
- feat: Add advanced chart library with 15+ chart types
- feat: Add complete form component system
- feat: Add performance optimizations and monitoring
- docs: Add Storybook documentation for all components

### 5. Integration

Follow the [Integration Plan](INTEGRATION_PLAN.md) to merge agent outputs:

```bash
# Pull all changes
git pull origin stage-a/requirements-inception

# Run integration tests
npm install --legacy-peer-deps
npm run build
npm run test
npm run storybook
```

### 6. Cleanup

When done, stop agents and delete resources:

```bash
./stop-agents.sh
```

## File Structure

```
deployment/ai-agents/
├── README.md                           # This file
├── INTEGRATION_PLAN.md                 # Step-by-step integration guide
├── deploy-agents.sh                    # Main deployment script
├── monitor-dashboard.py                # Real-time monitoring dashboard
├── stop-agents.sh                      # Cleanup script (auto-generated)
├── vm-init-template.sh                 # VM initialization template
├── agent1-enterprise-data-table.py     # Agent 1 Python script
├── agent2-advanced-chart-library.py    # Agent 2 Python script
├── agent3-complete-form-system.py      # Agent 3 Python script
├── agent4-performance-optimization.py  # Agent 4 Python script
└── agent5-storybook-documentation.py   # Agent 5 Python script
```

## Cost Estimate

**VM Configuration**: Standard_B2s (2 vCPU, 4 GB RAM)
- **Azure Pricing**: ~$0.04/hour per VM
- **Total**: 5 VMs × $0.04/hour = $0.20/hour
- **2-hour run**: ~$0.40
- **Storage**: ~$0.10 for 128 GB OS disks
- **Network**: Minimal (outbound data transfer)

**Total Estimated Cost**: ~$0.50 - $1.00 for complete run

## Troubleshooting

### Agent Not Starting

1. SSH to VM:
   ```bash
   ssh -i ~/.ssh/fleet-agents-key azureuser@<PUBLIC_IP>
   ```

2. Check initialization log:
   ```bash
   tail -100 ~/init.log
   ```

3. Check agent status:
   ```bash
   systemctl status fleet-agent
   ```

4. Manually run agent:
   ```bash
   cd ~/fleet-agent/fleet
   source ../venv/bin/activate
   python agent.py
   ```

### Agent Failed

1. Check agent log:
   ```bash
   tail -100 ~/agent.log
   ```

2. Check status JSON:
   ```bash
   cat ~/fleet-agent/fleet/agent*-status.json
   ```

3. Common issues:
   - **API Key Invalid**: Check environment variables
   - **Rate Limit**: Wait and retry
   - **Git Push Failed**: Check repository access
   - **Timeout**: Extend timeout in agent script

### VM Connection Issues

1. Check VM is running:
   ```bash
   az vm get-instance-view -g fleet-completion-agents-rg -n <VM_NAME>
   ```

2. Verify NSG rules:
   ```bash
   az network nsg rule list -g fleet-completion-agents-rg --nsg-name fleet-agents-nsg
   ```

3. Check public IP:
   ```bash
   az vm show -g fleet-completion-agents-rg -n <VM_NAME> -d --query publicIps -o tsv
   ```

## Security Considerations

1. **API Keys**: Stored in VM environment variables only
2. **SSH Keys**: Generated locally, private key never uploaded
3. **Network**: NSG restricts access to SSH only
4. **Git Credentials**: Embedded in repo URL (Azure DevOps PAT)
5. **VM Access**: Only accessible via SSH with private key

## Success Criteria

- ✅ All 5 VMs deployed successfully
- ✅ All agents running without errors
- ✅ All agents completed and pushed commits
- ✅ All expected files generated
- ✅ No security vulnerabilities introduced
- ✅ Code passes TypeScript compilation
- ✅ All tests pass

## Next Steps

1. **Review Integration Plan**: See [INTEGRATION_PLAN.md](INTEGRATION_PLAN.md)
2. **Pull Changes**: `git pull origin stage-a/requirements-inception`
3. **Test Locally**: `npm install && npm run build && npm run test`
4. **Review Code**: Carefully review all generated code
5. **Integrate**: Follow integration steps
6. **Deploy**: Push to production

## Support

For issues or questions:
- **Email**: andrew.m@capitaltechalliance.com
- **Repository**: Fleet Management System - Azure DevOps
- **Documentation**: This README and INTEGRATION_PLAN.md

## License

Generated code follows the Fleet Management System license.
AI-generated code is reviewed and maintained by Capital Tech Alliance.

---

**Generated**: 2025-11-28
**Author**: Andrew Morton
**System**: Fleet AI Agents Deployment
