# Fleet Standards & Orchestration - MCP Resource Registry

## Purpose
This document provides a complete inventory of all standards, documentation, backlog files,
Git branches, and orchestration configuration for multi-LLM alignment via MCP.

**Master Config File**: `FLEET_ORCHESTRATION_CONFIG.json`  
**GitHub Sync Workflow**: `.github/workflows/orchestrator-sync.yml`

---

## 📁 CORE CONTEXT FILES

### Universal LLM Context
| File | Path | Description | MCP URI |
|------|------|-------------|---------|
| **LLM Context** | `.llm-context.json` | Universal context for all LLMs | `fleet://context/llm` |
| **System Prompt** | `LLM_SYSTEM_PROMPT.txt` | Copy-paste prompt for any LLM | `fleet://context/prompt` |
| **Standards CLI** | `tools/standards-cli.cjs` | CLI tool for querying standards | `fleet://tools/cli` |
| **MCP Server** | `tools/mcp-standards-server.ts` | MCP server implementation | `fleet://tools/mcp-server` |

---

## 📊 SECURITY & COMPLIANCE DOCUMENTS

### FedRAMP Certification Artifacts
| File | Path | Description | MCP URI |
|------|------|-------------|---------|
| **Certification Report** | `api/FEDRAMP_CERTIFICATION_FINAL.json` | Complete FedRAMP assessment | `fleet://security/certification` |
| **POA&M** | `api/POAM_JAN2026.json` | Plan of Action & Milestones | `fleet://security/poam` |
| **SSP Summary** | `api/SSP_SUMMARY_JAN2026.json` | System Security Plan | `fleet://security/ssp` |
| **Pentest Plan** | `api/PENETRATION_TEST_PLAN.json` | Security test plan | `fleet://security/pentest` |
| **Deployment Checklist** | `api/PRODUCTION_DEPLOYMENT_CHECKLIST.json` | Production checklist | `fleet://deployment/checklist` |

### Security Progress Tracking
| File | Path | Description | MCP URI |
|------|------|-------------|---------|
| **Certification Progress** | `.agent/security_certification_progress.json` | Progress tracking | `fleet://security/progress` |
| **Remediation Summary** | `.agent/security_remediation_final.json` | Fix documentation | `fleet://security/remediation` |
| **Certification Report** | `.agent/certification_report_jan2026.json` | Detailed report | `fleet://security/report` |

---

## 🔑 RBAC & PERMISSIONS

| File | Path | Description | MCP URI |
|------|------|-------------|---------|
| **RBAC Truth Table** | `.agent/rbac_truth_table.json` | Complete permission matrix | `fleet://rbac/truth-table` |
| **Modules Config** | `api/src/permissions/config/modules.json` | Module access rules | `fleet://rbac/modules` |
| **Actions Config** | `api/src/permissions/config/actions.json` | Action permissions | `fleet://rbac/actions` |

---

## 📋 REQUIREMENTS & ORCHESTRATION

### Master Orchestrator
| File | Path | Description | MCP URI |
|------|------|-------------|---------|
| **Requirements Dashboard** | `docs/archive/COMPREHENSIVE_REQUIREMENTS.html` | 147 features, EVM metrics | `fleet://requirements/dashboard` |
| **Execution Plan** | `/tmp/fleet-master-execution-plan.md` | 12 swarms, 156 agents | `fleet://orchestrator/plan` |
| **Orchestrator Agent** | `/tmp/master-orchestrator-agent.cjs` | Coordination script | `fleet://orchestrator/agent` |

### Inventory & Progress
| File | Path | Description | MCP URI |
|------|------|-------------|---------|
| **App Inventory** | `.agent/app_inventory.json` | Application inventory | `fleet://inventory/app` |
| **Exhaustive Inventory** | `.agent/exhaustive_inventory.json` | Detailed inventory | `fleet://inventory/exhaustive` |
| **Review Report** | `.agent/exhaustive_review_report.json` | Review findings | `fleet://inventory/review` |

---

## 🐛 REMEDIATION BACKLOG

| File | Path | Description | MCP URI |
|------|------|-------------|---------|
| **Remediation Backlog** | `tools/orchestrator/artifacts/remediation_backlog.json` | 2,259 findings | `fleet://backlog/full` |
| **Validated Status** | `tools/orchestrator/artifacts/VALIDATED_STATUS_JAN2026.json` | Cross-referenced status | `fleet://backlog/validated` |

### Backlog Summary
- **Total Findings**: 2,259
- **Security (gitleaks)**: 1,069 → **FALSE POSITIVES** (example tokens)
- **Quality (TypeScript)**: 1,189 → **1,253 actual errors**
- **Test**: 1

---

## 🧠 GEMINI KNOWLEDGE BASE (AI Reference)

### Security Standards
| File | Path | Description |
|------|------|-------------|
| **Certification Standards** | `~/.gemini/antigravity/knowledge/fleet_production_readiness/artifacts/security/SECURITY_CERTIFICATION_STANDARDS.md` | Security rules reference |
| **RBAC Deep Dive** | `~/.gemini/antigravity/knowledge/fleet_production_readiness/artifacts/security/rbac_architecture_deep_dive.md` | RBAC architecture |

### Governance
| File | Path | Description |
|------|------|-------------|
| **MCP/RAG/CAG Guide** | `~/.gemini/antigravity/knowledge/fleet_production_readiness/artifacts/governance/MCP_RAG_CAG_STANDARDS_ENFORCEMENT.md` | Standards enforcement |
| **Multi-LLM Strategy** | `~/.gemini/antigravity/knowledge/fleet_production_readiness/artifacts/governance/MULTI_LLM_ALIGNMENT_STRATEGY.md` | LLM alignment |
| **Excellence Engine** | `~/.gemini/antigravity/knowledge/fleet_production_readiness/artifacts/governance/autonomous_excellence_engine.md` | Quality standards |

---

## 🔧 MCP SERVER CONFIGURATION

### Recommended MCP Resources to Expose

```javascript
const MCP_RESOURCES = {
  // Core Context
  'fleet://context/llm': '.llm-context.json',
  'fleet://context/prompt': 'LLM_SYSTEM_PROMPT.txt',
  
  // Security & Compliance
  'fleet://security/certification': 'api/FEDRAMP_CERTIFICATION_FINAL.json',
  'fleet://security/poam': 'api/POAM_JAN2026.json',
  'fleet://security/ssp': 'api/SSP_SUMMARY_JAN2026.json',
  'fleet://security/progress': '.agent/security_certification_progress.json',
  
  // RBAC
  'fleet://rbac/truth-table': '.agent/rbac_truth_table.json',
  'fleet://rbac/modules': 'api/src/permissions/config/modules.json',
  'fleet://rbac/actions': 'api/src/permissions/config/actions.json',
  
  // Backlog & Status
  'fleet://backlog/validated': 'tools/orchestrator/artifacts/VALIDATED_STATUS_JAN2026.json',
  'fleet://backlog/full': 'tools/orchestrator/artifacts/remediation_backlog.json',
  
  // Requirements
  'fleet://requirements/dashboard': 'docs/archive/COMPREHENSIVE_REQUIREMENTS.html',
  
  // Deployment
  'fleet://deployment/checklist': 'api/PRODUCTION_DEPLOYMENT_CHECKLIST.json',
  'fleet://deployment/pentest': 'api/PENETRATION_TEST_PLAN.json'
};
```

### MCP Tools to Expose

```javascript
const MCP_TOOLS = [
  {
    name: 'get_mandatory_rules',
    description: 'Get security, code quality, or architecture rules'
  },
  {
    name: 'check_compliance',
    description: 'Validate if a proposed change is compliant'
  },
  {
    name: 'get_rbac_permissions',
    description: 'Get permissions for a specific role'
  },
  {
    name: 'get_current_status',
    description: 'Get validated project status and EVM metrics'
  },
  {
    name: 'get_backlog_summary',
    description: 'Get remediation backlog summary by category'
  }
];
```

---

## 📊 QUICK STATS

| Category | Count | Status |
|----------|-------|--------|
| Core Context Files | 4 | ✅ Ready |
| Security Documents | 8 | ✅ Ready |
| RBAC Documents | 3 | ✅ Ready |
| Requirements | 3 | ✅ Ready |
| Backlog Files | 2 | ✅ Ready |
| Knowledge Base | 5 | ✅ Ready |
| **Total MCP Resources** | **25** | ✅ |

---

## 🚀 USAGE

### Claude Desktop Config
```json
{
  "mcpServers": {
    "fleet-standards": {
      "command": "npx",
      "args": ["ts-node", "/Users/andrewmorton/Documents/GitHub/Fleet/tools/mcp-standards-server.ts"]
    }
  }
}
```

### CLI Usage
```bash
node tools/standards-cli.cjs status
node tools/standards-cli.cjs rules security
node tools/standards-cli.cjs rbac Driver
node tools/standards-cli.cjs check "Add new endpoint" security,rbac
```

---

*Generated: 2026-01-07T18:46:00Z*
*For: Multi-LLM Alignment via MCP*
