# Fleet Security Orchestrator

> **Enterprise-grade AI-powered unified vulnerability management and autonomous remediation platform**

## Overview

The Fleet Security Orchestrator is a production-ready, autonomous security and quality assurance system that integrates multiple scanning tools, correlates findings, calculates risk scores, and provides AI-assisted remediation guidance.

### Key Features

- **🔍 Multi-Scanner Integration**: Semgrep, Trivy, Gitleaks, ESLint, TypeScript, Test Analysis
- **🧠 AI-Powered Analysis**: LangChain orchestration with OpenAI, Anthropic Claude, and Google Gemini
- **📊 Risk Correlation**: Dependency graph analysis with blast radius calculation
- **🤖 Autonomous Remediation**: Automated fix verification with safe rollback
- **✅ Verification Gates**: Security, quality, test, and build gates
- **📈 Comprehensive Reporting**: Chief Architect reports, remediation backlogs, risk clusters
- **🔄 Dual-Repo Sync**: Automatic synchronization to GitHub and Azure DevOps

## Architecture

```
tools/
├── orchestrator/           # Main orchestration engine
│   ├── scanners/          # Scanner integrations
│   ├── normalizer/        # Normalization engine
│   ├── correlator/        # Correlation & graph analysis
│   ├── reporter/          # Report generation
│   └── config/            # Configuration
├── remediator/            # Autonomous remediation engine
│   ├── fixers/            # Issue-specific fixers
│   ├── verifier/          # Verification loop
│   └── strategies/        # Remediation strategies
├── gates/                 # Verification gates
│   ├── definitions/       # Gate definitions
│   ├── runner/            # Gate execution engine
│   └── reports/           # Gate outputs
└── repo_sync/             # Dual-repo synchronization
    ├── github/            # GitHub operations
    ├── devops/            # Azure DevOps operations
    └── strategies/        # Sync strategies
```

## Features

### 1. Comprehensive Scanner Integration
- **SAST**: Semgrep, SonarQube
- **Dependency**: Trivy, OSV-Scanner, SBOM (CycloneDX)
- **Secrets**: gitleaks
- **DAST**: OWASP ZAP baseline
- **Code Quality**: ESLint, TypeScript compiler
- **Tests**: Unit, integration, E2E (Playwright)
- **IaC**: Checkov, tfsec (optional)

### 2. Canonical Schema
All findings normalized to:
```typescript
{
  id: string
  fingerprint: string
  type: 'security' | 'quality' | 'dependency' | 'architecture' | 'test'
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  title: string
  description: string
  location: { file, line, column }
  cwe?: string
  cve?: string
  blast_radius: number
  risk_score: number
  remediation: { strategy, effort, confidence }
  evidence: { scanner, timestamp, raw_output }
}
```

### 3. Correlation Graph
- File → Component → Service → Dependency nodes
- Blast radius calculation
- Risk clustering
- Impact analysis

### 4. Risk Scoring Model
```
risk_score = exploitability × exposure × blast_radius × asset_criticality
```

### 5. Verification Gates
All gates must pass before declaring success:
- Security scan gates
- Code quality gates
- Test coverage gates
- Build gates
- Deployment gates

## Usage

### Review Mode
```bash
make review
# or
./orchestrator review
```

Generates:
- `artifacts/chief_architect_report.md`
- `artifacts/remediation_backlog.json`
- `artifacts/risk_clusters.json`
- `artifacts/evidence_manifest.json`

### Autonomous Remediation Mode
```bash
make finish
# or
./orchestrator finish
```

Performs autonomous remediation loops until all gates pass.

## CI/CD Integration

### GitHub Actions
- Automated scans on PR
- Report generation
- Optional auto-remediation on command

### Azure DevOps
- Integrates with existing pipeline
- Minimal modifications
- Artifact storage

## Dual-Repo Sync

All changes committed to both:
1. GitHub repository (primary)
2. Azure DevOps repository (deployment)

Sync strategies:
- Mirror commits (same diff)
- Artifact sync (generated manifests)

## Evidence & Auditability

All evidence stored in `artifacts/`:
- Scanner outputs (JSON)
- Gate logs
- Reports
- Remediation history
- Commit hashes

## Security

- No arbitrary shell execution
- Sandboxed remediation
- All changes reviewed by gates
- Audit trail for compliance

## Requirements

- Node.js 20+
- Python 3.11+
- Docker
- Azure CLI
- GitHub CLI

## Installation

### Prerequisites

- **Node.js**: ≥18.0.0
- **Security Tools** (optional but recommended):
  - Semgrep: `pip3 install semgrep`
  - Trivy: `brew install trivy`
  - Gitleaks: `brew install gitleaks`

### Install Dependencies

```bash
# From project root
cd tools/orchestrator
npm install
npm run build
```

## Usage

### 1. Review Command

Run all scanners and generate comprehensive reports:

```bash
# From Fleet root
make review

# Or directly
cd tools/orchestrator
npm run review
```

**Output**:
- `artifacts/chief_architect_report.md` - Executive summary with recommendations
- `artifacts/remediation_backlog.json` - Prioritized findings with metadata
- `artifacts/risk_clusters.json` - Grouped findings by risk
- `artifacts/dependency_graph.json` - Architecture visualization

### 2. Finish Command

Autonomous remediation until all verification gates pass:

```bash
make finish

# With options
cd tools/orchestrator
node dist/cli/index.js finish --max-iterations 10 --dry-run
```

### 3. Individual Scanner

Run a specific scanner:

```bash
cd tools/orchestrator
node dist/cli/index.js scan semgrep
node dist/cli/index.js scan eslint
node dist/cli/index.js scan trivy
```

## Configuration

Edit `config/production.yml` to customize:

```yaml
scanners:
  semgrep:
    enabled: true
    rules: ["p/security-audit", "p/typescript"]

  trivy:
    enabled: true
    severity: ["CRITICAL", "HIGH", "MEDIUM"]

gates:
  security:
    max_critical: 0
    max_high: 0

  quality:
    max_eslint_errors: 0
    max_ts_errors: 0

  tests:
    min_coverage: 80

remediation:
  auto_fix: true
  verify_each_iteration: true
  rollback_on_failure: true

ai:
  providers:
    anthropic:
      enabled: true
      model: "claude-3-5-sonnet-20241022"
```

## Workflow Integration

### Makefile

```bash
make review          # Run security review
make finish          # Autonomous remediation
make scan-semgrep    # Run specific scanner
make ci-check        # All CI checks
```

### GitHub Actions

```yaml
name: Security Review
on: [push, pull_request]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: make install
      - run: make review
      - uses: actions/upload-artifact@v3
        with:
          name: security-reports
          path: tools/orchestrator/artifacts/
```

## Security & Compliance

### Parameterized Queries Enforcement

The orchestrator specifically checks for SQL injection vulnerabilities and enforces parameterized queries:

```typescript
// ❌ NEVER: String concatenation
const query = `SELECT * FROM users WHERE id = ${userId}`;

// ✅ ALWAYS: Parameterized queries
const query = 'SELECT * FROM users WHERE id = $1';
db.query(query, [userId]);
```

### FedRAMP-Grade Security

- ✅ No hardcoded secrets (enforced by Gitleaks)
- ✅ TLS 1.2+ required
- ✅ All inputs validated
- ✅ Least privilege access
- ✅ Comprehensive audit logging

## Development

### Build

```bash
npm run build       # Compile TypeScript
npm run dev         # Watch mode
npm run typecheck   # Type checking only
```

### Testing

```bash
npm test            # Run tests
npm run test:watch  # Watch mode
```

### Linting

```bash
npm run lint        # Check code quality
```

## Troubleshooting

### Scanner Not Found

If a scanner is not installed:

```bash
# Install missing tools
make install-tools

# Or disable in config
vim config/production.yml
# Set enabled: false for unavailable scanners
```

### Permission Errors

Ensure the orchestrator has write access to the artifacts directory:

```bash
mkdir -p tools/orchestrator/artifacts
chmod 755 tools/orchestrator/artifacts
```

## Support

For issues or questions:
1. Check the logs: `tools/orchestrator/logs/`
2. Review configuration: `tools/orchestrator/config/production.yml`
3. Run in verbose mode: `LOG_LEVEL=debug npm run review`

## License

Proprietary - Capital Tech Alliance

---

**Generated by Fleet Security Orchestrator v1.0.0**
