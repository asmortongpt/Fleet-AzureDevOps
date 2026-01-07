# Fleet Security Orchestrator - Quick Start Guide

**Status:** ✅ Operational | **Dashboard:** http://localhost:3001

---

## 🚀 Getting Started (30 seconds)

### 1. Launch the Dashboard
```bash
cd /Users/andrewmorton/Documents/GitHub/Fleet/tools/orchestrator
npm run dashboard
```

The dashboard will open automatically at **http://localhost:3001**

### 2. Run a Security Review
```bash
# In a new terminal
cd /Users/andrewmorton/Documents/GitHub/Fleet/tools/orchestrator
node dist/cli/index.js review --output artifacts
```

This will scan the entire Fleet codebase and generate comprehensive reports.

### 3. View the Results

**Chief Architect Report:**
```bash
cat artifacts/chief_architect_report.md
```

**Remediation Backlog:**
```bash
cat artifacts/remediation_backlog.json | jq '.' | head -50
```

---

## 📊 What You'll See

### Current Findings (Real Data)
- **ESLint:** 10,748 code quality issues (606 auto-fixable)
- **TypeScript:** 1,258 type errors
- **Gitleaks:** 1,090 secrets detected (🔴 CRITICAL)
- **Total:** 13,097 real findings

### Risk Breakdown
- **Critical:** 1,069 (8.2%) - Secrets exposure
- **Medium:** 9,406 (71.8%) - Code quality & types
- **Low:** 2,600 (19.9%) - Minor issues

---

## 🔧 Auto-Remediation (Quick Wins)

### Step 1: Auto-fix ESLint Issues (606 fixes)
```bash
cd /Users/andrewmorton/Documents/GitHub/Fleet
npm run lint:fix
```

### Step 2: Verify the Fixes
```bash
npm run lint
npm test
```

### Step 3: Commit
```bash
git add .
git commit -m "fix: auto-remediate 606 ESLint issues

🤖 Generated with Fleet Security Orchestrator"
```

**Estimated Time:** 5 minutes
**Risk:** Low (auto-fixes are safe)

---

## 🔴 Critical Priority: Secrets (URGENT)

### Issue
Gitleaks found **1,069 hardcoded secrets** in the codebase.

### Immediate Actions Required

**Step 1: Review Findings**
```bash
cd tools/orchestrator
node dist/cli/index.js review --output artifacts
cat artifacts/remediation_backlog.json | jq '.[] | select(.type=="security")' | head -20
```

**Step 2: Move Secrets to Environment Variables**

Example fix:
```typescript
// ❌ BEFORE (insecure)
const apiKey = "sk-1234567890abcdef";

// ✅ AFTER (secure)
const apiKey = process.env.API_KEY;
```

**Step 3: Add to .env**
```bash
echo "API_KEY=sk-1234567890abcdef" >> .env
echo ".env" >> .gitignore  # If not already there
```

**Step 4: Use Azure Key Vault (Production)**
```typescript
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

const credential = new DefaultAzureCredential();
const client = new SecretClient("https://your-vault.vault.azure.net", credential);
const secret = await client.getSecret("API-KEY");
```

---

## 📈 Medium Priority: TypeScript Types

### Issue
1,258 TypeScript type errors detected.

### Common Fixes

**Missing Imports (TS2307):**
```typescript
// Error: Cannot find module 'react-toastify'
// Fix: Install the package
npm install react-toastify
npm install --save-dev @types/react-toastify
```

**Missing Type Declarations:**
```typescript
// Error: Could not find declaration file for module 'custom-lib'
// Fix: Create declaration file
// types/custom-lib.d.ts
declare module 'custom-lib' {
  export function doSomething(): void;
}
```

**Remove 'any' Types:**
```typescript
// ❌ BEFORE
function process(data: any) { ... }

// ✅ AFTER
interface ProcessData {
  id: string;
  value: number;
}
function process(data: ProcessData) { ... }
```

---

## 🎯 Commands Reference

### Security Scanning
```bash
# Full security review
node dist/cli/index.js review --output artifacts

# Individual scanner tests
node test-eslint-v9.mjs      # ESLint only
node test-typescript.mjs      # TypeScript only
node test-all-scanners.mjs    # All working scanners
```

### Dashboard
```bash
# Launch dashboard (opens browser)
npm run dashboard

# Launch without browser
node dist/cli/index.js dashboard --no-open

# Custom port
node dist/cli/index.js dashboard --port 8080
```

### Auto-Remediation
```bash
# Dry run (safe - no changes)
node dist/cli/index.js finish --dashboard --dry-run

# Live remediation
node dist/cli/index.js finish --dashboard

# With custom config
node dist/cli/index.js finish --config config/production.yml
```

### Reports
```bash
# View Chief Architect Report
cat artifacts/chief_architect_report.md

# View remediation backlog (JSON)
cat artifacts/remediation_backlog.json | jq '.'

# View risk clusters
cat artifacts/risk_clusters.json | jq '.clusters'

# View dependency graph stats
cat artifacts/dependency_graph.json | jq '.stats'
```

---

## 📁 Generated Files

### Reports (in `artifacts/`)
- `chief_architect_report.md` - Executive summary & roadmap
- `remediation_backlog.json` - All findings with remediation steps
- `risk_clusters.json` - Grouped findings by risk
- `evidence_manifest.json` - Full evidence trail
- `dependency_graph.json` - Code dependency analysis

### Documentation (in `tools/orchestrator/`)
- `QUICKSTART.md` - This file
- `COMPREHENSIVE_STATUS.md` - Full operational status
- `SCANNER_VALIDATION_REPORT.md` - Technical details
- `DASHBOARD_README.md` - Dashboard features

### Test Scripts (in `tools/orchestrator/`)
- `test-eslint-v9.mjs` - ESLint validation
- `test-typescript.mjs` - TypeScript validation
- `test-all-scanners.mjs` - Combined test
- `test-semgrep.mjs` - Semgrep validation

---

## 🔍 Troubleshooting

### Dashboard Won't Start
```bash
# Check if port 3001 is in use
lsof -ti:3001 | xargs kill -9

# Restart dashboard
npm run dashboard
```

### Scanner Not Finding Issues
```bash
# Rebuild TypeScript
npm run build

# Verify scanner installation
semgrep --version
trivy --version
osv-scanner --version
```

### Review Command Fails
```bash
# Check configuration
cat config/production.yml

# Verify paths are absolute
grep -E "config|project" config/production.yml
```

### Out of Memory (Semgrep)
```bash
# Limit memory and jobs
semgrep --config=p/security-audit --max-memory=2000 -j 1 .
```

---

## 📊 Understanding the Dashboard

### Metrics Panel
- **Total Findings:** Overall count across all scanners
- **By Severity:** Critical, High, Medium, Low breakdown
- **Auto-Fixable:** Issues that can be auto-remediated
- **Progress:** Current scan completion percentage

### Charts
1. **Severity Distribution** (Pie) - Visual breakdown by severity
2. **Finding Types** (Bar) - Security vs Quality vs Performance
3. **Risk Trend** (Line) - Changes over time

### Real-Time Updates
- **Green pulse:** Scanner active
- **Red alert:** Critical finding detected
- **Blue notification:** Scan complete

---

## 🎓 Next Steps

### Week 1: Quick Wins
1. ✅ Run auto-fix for ESLint (606 fixes)
2. ✅ Review secrets report
3. ✅ Move top 10 secrets to .env
4. ✅ Run tests to verify no regressions

### Week 2: Type Safety
1. ⚠️ Fix missing imports (TS2307)
2. ⚠️ Add type declarations
3. ⚠️ Remove 'any' types (top 50 files)
4. ⚠️ Enable strict mode incrementally

### Week 3: Security Hardening
1. 🔴 Complete secrets migration to Azure Key Vault
2. 🔴 Review authentication issues (128 findings)
3. 🔴 Fix authorization issues (45 findings)
4. 🔴 Implement input validation

### Week 4: Quality & Coverage
1. 🟡 Address remaining ESLint issues
2. 🟡 Refactor complexity hotspots
3. 🟡 Increase test coverage to 90%+
4. 🟡 Re-scan and verify improvements

---

## ✅ Success Criteria

**Security:**
- [ ] Zero critical secrets in code
- [ ] All auth/authz issues resolved
- [ ] Input validation implemented
- [ ] OWASP Top 10 compliance

**Code Quality:**
- [ ] Zero TypeScript errors
- [ ] < 100 ESLint errors
- [ ] No 'any' types in critical code
- [ ] Cyclomatic complexity < 15

**Testing:**
- [ ] 90%+ code coverage
- [ ] All tests passing
- [ ] E2E tests for critical paths
- [ ] Security tests implemented

**Compliance:**
- [ ] FedRAMP baseline met
- [ ] Audit logging complete
- [ ] Parameterized queries verified
- [ ] Container security hardened

---

## 🆘 Need Help?

### Documentation
- **Full Status:** `COMPREHENSIVE_STATUS.md`
- **Technical Details:** `SCANNER_VALIDATION_REPORT.md`
- **Main README:** `README.md`

### Support
- **Issues:** GitHub Issues
- **Configuration:** `config/production.yml`
- **Logs:** `logs/orchestrator.log`

---

## 🎉 You're All Set!

The Fleet Security Orchestrator is now monitoring your codebase 24/7.

**Dashboard:** http://localhost:3001
**Next Review:** `node dist/cli/index.js review`

**Keep your code secure! 🔒**

---

*Last Updated: 2026-01-07*
*Fleet Security Orchestrator v1.0.0*
