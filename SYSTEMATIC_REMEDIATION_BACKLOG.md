# Fleet Systematic Remediation Backlog

**Generated:** 2026-01-07
**Current Status:** 10,281 issues remaining (4.3% complete)
**Total Issues:** 15,871 originally identified

---

## 📋 Table of Contents

1. [Quick Wins (1-2 days)](#quick-wins-1-2-days)
2. [Critical Security (Week 1)](#critical-security-week-1)
3. [High Priority Dependencies (Week 1-2)](#high-priority-dependencies-week-1-2)
4. [TypeScript Type Safety (Week 2-3)](#typescript-type-safety-week-2-3)
5. [Code Quality Improvements (Week 3-4)](#code-quality-improvements-week-3-4)
6. [Long-term Improvements (Month 2+)](#long-term-improvements-month-2)

---

## Quick Wins (1-2 days)

### 🎯 Priority: IMMEDIATE | Effort: LOW | Risk: LOW

### Item 1: Run Remaining Auto-Fixes

**Status:** ⚠️ Not Started
**Impact:** 258 issues fixed automatically
**Time:** 5 minutes
**Risk Level:** Low (automated safe fixes)

**Detailed Plan:**

1. **Backup current state**
   ```bash
   git add .
   git commit -m "chore: snapshot before auto-fix batch 2"
   git push origin main && git push azure main
   ```

2. **Run auto-fix**
   ```bash
   npm run lint -- --fix
   ```

3. **Review changes**
   ```bash
   git diff
   ```

4. **Verify no breaking changes**
   ```bash
   npm test
   npm run typecheck
   npm run build
   ```

5. **Commit**
   ```bash
   git add .
   git commit -m "fix: apply remaining ESLint auto-fixes (258 issues)

   - Fixed formatting issues
   - Corrected import ordering
   - Applied consistent code style

   🤖 Generated with [Claude Code](https://claude.com/claude-code)

   Co-Authored-By: Claude <noreply@anthropic.com>"
   git push origin main && git push azure main
   ```

**Expected Outcome:** 258 fewer issues, cleaner codebase

**Success Criteria:**
- [ ] All tests pass
- [ ] TypeScript compiles
- [ ] Build succeeds
- [ ] Pushed to both repos

---

### Item 2: Fix Orchestrator 'any' Types

**Status:** ⚠️ Not Started
**Impact:** 25 'any' types → proper interfaces
**Time:** 1-2 hours
**Risk Level:** Low (isolated to orchestrator tool)

**Files to Fix:**
- `tools/orchestrator/src/dashboard/server.ts` (2 'any' types)
- `tools/orchestrator/src/scanners/base-scanner.ts` (4 'any' types)
- `tools/orchestrator/src/scanners/eslint-scanner.ts` (1 'any' type)
- `tools/orchestrator/src/scanners/gitleaks-scanner.ts` (2 'any' types)
- `tools/orchestrator/src/scanners/semgrep-scanner.ts` (4 'any' types)
- `tools/orchestrator/src/scanners/test-scanner.ts` (6 'any' types)
- `tools/orchestrator/src/scanners/trivy-scanner.ts` (2 'any' types)
- `tools/orchestrator/src/types/canonical.ts` (1 'any' type)
- `verify-production.ts` (2 'any' types)

**Detailed Plan:**

1. **Create scanner output interfaces**
   ```typescript
   // tools/orchestrator/src/types/scanner-outputs.ts

   export interface ESLintMessage {
     ruleId: string | null;
     severity: number;
     message: string;
     line: number;
     column: number;
     nodeType: string;
     messageId?: string;
     endLine?: number;
     endColumn?: number;
   }

   export interface ESLintResult {
     filePath: string;
     messages: ESLintMessage[];
     errorCount: number;
     warningCount: number;
     fixableErrorCount: number;
     fixableWarningCount: number;
   }

   export interface GitleaksFinding {
     Description: string;
     StartLine: number;
     EndLine: number;
     StartColumn: number;
     EndColumn: number;
     Match: string;
     Secret: string;
     File: string;
     Commit: string;
     Entropy: number;
     Author: string;
     Email: string;
     Date: string;
     Message: string;
     Tags: string[];
     RuleID: string;
   }

   export interface TrivyVulnerability {
     VulnerabilityID: string;
     PkgName: string;
     InstalledVersion: string;
     FixedVersion: string;
     Severity: string;
     Title: string;
     Description: string;
     References: string[];
   }

   export interface SemgrepFinding {
     check_id: string;
     path: string;
     start: { line: number; col: number };
     end: { line: number; col: number };
     extra: {
       message: string;
       severity: string;
       metadata: Record<string, unknown>;
     };
   }
   ```

2. **Update base-scanner.ts**
   ```typescript
   // Replace lines 16, 33, 38, 51
   export abstract class BaseScanner<RawOutput = unknown> {
     protected config: Record<string, unknown>;

     abstract scan(targetPath: string): Promise<RawOutput>;
     abstract normalize(rawOutput: RawOutput): CanonicalFinding[];

     protected createEvidence(raw: unknown): Evidence {
       // Proper implementation
     }
   }
   ```

3. **Update each scanner** to use proper types from scanner-outputs.ts

4. **Test changes**
   ```bash
   cd tools/orchestrator
   npm run build
   npm run lint
   npm test
   ```

5. **Commit**
   ```bash
   git add tools/orchestrator
   git commit -m "fix(orchestrator): replace 'any' types with proper scanner interfaces

   - Created scanner-outputs.ts with all scanner output types
   - Updated BaseScanner to use generics properly
   - Fixed all 25 'any' type violations in orchestrator

   🤖 Generated with [Claude Code](https://claude.com/claude-code)

   Co-Authored-By: Claude <noreply@anthropic.com>"
   git push origin main && git push azure main
   ```

**Success Criteria:**
- [ ] Zero 'any' types in tools/orchestrator/
- [ ] All orchestrator tests pass
- [ ] Dashboard still works
- [ ] Scanners still function

---

### Item 3: Fix 2 Parsing Errors

**Status:** ⚠️ Not Started
**Impact:** 2 test files compile cleanly
**Time:** 30 minutes
**Risk Level:** Low

**Files:**
1. `api/src/__tests__/security/sql-injection.test.ts:98`
2. `api/src/__tests__/services/DocumentAiService.test.ts:2278`

**Detailed Plan:**

1. **Review sql-injection.test.ts:98**
   ```bash
   cat api/src/__tests__/security/sql-injection.test.ts | sed -n '95,100p'
   ```

   - Likely a syntax error (missing comma, extra character)
   - Fix the syntax issue
   - Verify test still runs

2. **Review DocumentAiService.test.ts:2278**
   ```bash
   cat api/src/__tests__/services/DocumentAiService.test.ts | sed -n '2275,2280p'
   ```

   - Likely a similar syntax error
   - Fix the syntax issue
   - Verify test still runs

3. **Test fixes**
   ```bash
   npm run lint -- api/src/__tests__/security/sql-injection.test.ts
   npm run lint -- api/src/__tests__/services/DocumentAiService.test.ts
   npm test -- sql-injection
   npm test -- DocumentAiService
   ```

4. **Commit**
   ```bash
   git add api/src/__tests__
   git commit -m "fix(tests): resolve parsing errors in test files

   - Fixed syntax error in sql-injection.test.ts:98
   - Fixed syntax error in DocumentAiService.test.ts:2278
   - All tests passing

   🤖 Generated with [Claude Code](https://claude.com/claude-code)

   Co-Authored-By: Claude <noreply@anthropic.com>"
   git push origin main && git push azure main
   ```

**Success Criteria:**
- [ ] Both files parse without errors
- [ ] Tests run successfully
- [ ] No regression

---

## Critical Security (Week 1)

### 🔴 Priority: CRITICAL | Effort: HIGH | Risk: HIGH

### Item 4: Secrets Audit and Categorization

**Status:** ⚠️ Not Started
**Impact:** Understand which of 3,797 secrets are real vs false positives
**Time:** 2-3 days
**Risk Level:** High (data breach if real secrets exposed)

**Detailed Plan:**

**Day 1: Extract and Categorize**

1. **Extract all secret findings**
   ```bash
   cd tools/orchestrator
   cat artifacts/remediation_backlog.json | \
     jq '.[] | select(.type=="security")' > ../secrets_audit.json
   ```

2. **Categorize by type**
   ```bash
   # Group by rule ID
   cat ../secrets_audit.json | \
     jq -s 'group_by(.title) | map({rule: .[0].title, count: length, examples: [.[0].location.file]})' > \
     ../secrets_by_type.json
   ```

3. **Create audit spreadsheet**
   - Export to CSV for review
   - Columns: File, Line, Type, Likely Real?, Action, Notes

   ```bash
   cat ../secrets_audit.json | \
     jq -r '["File","Line","Type","Secret_Preview","Action"],
            (.[] | [.location.file, .location.line, .title, .description[0:50], "REVIEW"]) |
            @csv' > ../secrets_audit.csv
   ```

4. **Manual review process**
   - Open secrets_audit.csv
   - For each finding:
     - **False Positive** (example data, test fixtures) → Mark "IGNORE"
     - **Real Secret** → Mark "CRITICAL" + type (API key, password, token)
     - **Uncertain** → Mark "INVESTIGATE"

**Day 2: Plan Migration**

5. **Create .env.example template**
   ```bash
   # Based on real secrets found, create template
   touch .env.example
   ```

   Example content:
   ```env
   # Database
   DATABASE_URL=postgresql://user:password@localhost:5432/fleet_db
   DATABASE_PASSWORD=your_secure_password_here

   # API Keys
   OPENAI_API_KEY=sk-your-openai-key-here
   ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here
   GOOGLE_MAPS_API_KEY=your-google-maps-key

   # Azure
   AZURE_CLIENT_ID=your-azure-client-id
   AZURE_CLIENT_SECRET=your-azure-client-secret
   AZURE_TENANT_ID=your-azure-tenant-id

   # JWT
   JWT_SECRET=your-jwt-secret-minimum-32-characters

   # Session
   SESSION_SECRET=your-session-secret-minimum-32-characters
   ```

6. **Document Azure Key Vault setup**
   ```bash
   touch docs/AZURE_KEY_VAULT_SETUP.md
   ```

**Day 3: Begin Migration**

7. **Create migration script**
   ```bash
   touch api/src/scripts/migrate-secrets-to-env.ts
   ```

   Content:
   ```typescript
   /**
    * Script to help migrate hardcoded secrets to environment variables
    *
    * Usage: node migrate-secrets-to-env.ts <file-with-secrets>
    */

   import fs from 'fs';
   import path from 'path';

   const secretsToMigrate = [
     // List generated from audit
   ];

   function migrateFile(filePath: string) {
     let content = fs.readFileSync(filePath, 'utf-8');
     let modified = false;

     secretsToMigrate.forEach(secret => {
       if (content.includes(secret.value)) {
         content = content.replace(
           secret.value,
           `process.env.${secret.envVar} || ''`
         );
         modified = true;
         console.log(`✓ Migrated ${secret.envVar} in ${filePath}`);
       }
     });

     if (modified) {
       fs.writeFileSync(filePath, content);
     }
   }

   // Process files
   ```

8. **Test migration process**
   - Pick 5-10 low-risk files
   - Migrate secrets
   - Add to .env
   - Test that application still works
   - Verify secrets not in code

**Commits:**

```bash
# Day 1
git add secrets_audit.json secrets_by_type.json secrets_audit.csv
git commit -m "security: audit all 3,797 secret findings

- Extracted all Gitleaks findings
- Categorized by secret type
- Created CSV for manual review

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Day 2
git add .env.example docs/AZURE_KEY_VAULT_SETUP.md
git commit -m "security: create environment variable templates

- Added .env.example with all required secrets
- Documented Azure Key Vault setup process
- Prepared for secret migration

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Day 3
git add api/src/scripts/migrate-secrets-to-env.ts
git commit -m "security: add secret migration tooling

- Created automated migration script
- Tested on sample files
- Ready for full migration

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

git push origin main && git push azure main
```

**Success Criteria:**
- [ ] All 3,797 findings categorized
- [ ] Real secrets identified
- [ ] .env.example created
- [ ] Migration plan documented
- [ ] Initial test migrations successful

---

### Item 5: Execute Secret Migration

**Status:** ⚠️ Not Started (depends on Item 4)
**Impact:** Remove all hardcoded secrets from codebase
**Time:** 2-3 days
**Risk Level:** High (could break app if done wrong)

**Detailed Plan:**

**Phase 1: Low-Risk Migration (Day 1)**

1. **Migrate test/dev secrets first**
   - Test fixtures
   - Development credentials
   - Example data

   Files to prioritize:
   - `api/src/__tests__/**/*` (test files)
   - `*.example.ts` (example files)
   - Development configuration

2. **Update test configuration**
   ```typescript
   // Before
   const testApiKey = 'sk-test-1234567890';

   // After
   const testApiKey = process.env.TEST_API_KEY || 'sk-test-mock-key';
   ```

3. **Run test suite**
   ```bash
   npm test
   ```

**Phase 2: Production Secrets (Day 2-3)**

4. **Migrate critical production secrets**
   - Database credentials
   - API keys (OpenAI, Anthropic, Google, etc.)
   - Azure credentials
   - JWT secrets

   Priority order:
   1. Database passwords
   2. API keys
   3. Encryption keys
   4. OAuth secrets

5. **For each secret type:**
   ```bash
   # Example: OpenAI API Key

   # 1. Find all occurrences
   grep -r "sk-[A-Za-z0-9]" --include="*.ts" --include="*.tsx" .

   # 2. Replace with env var
   # Use migration script from Item 4

   # 3. Add to .env (local) and Azure Key Vault (production)

   # 4. Test functionality

   # 5. Verify secret removed from code
   ```

6. **Update deployment documentation**
   - CI/CD pipeline secrets
   - Environment setup guide
   - Production deployment checklist

**Phase 3: Verification (Day 3)**

7. **Re-scan codebase**
   ```bash
   cd tools/orchestrator
   node dist/cli/index.js review --output artifacts

   # Check secrets count
   cat artifacts/remediation_backlog.json | \
     jq '[.[] | select(.type=="security")] | length'
   ```

8. **Rotate all exposed credentials**
   - Generate new API keys
   - Update in Azure Key Vault
   - Update in .env
   - Test services still work
   - Revoke old keys

**Commits:**

```bash
# Phase 1
git add api/src/__tests__ .env.example
git commit -m "security: migrate test secrets to environment variables

- Migrated all test fixture secrets
- Updated test configuration
- All tests passing with env vars

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Phase 2
git add api/src .env.example
git commit -m "security: migrate production secrets to environment variables

- Migrated database credentials
- Migrated all API keys
- Migrated JWT and session secrets
- Updated deployment docs

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Phase 3
git add .
git commit -m "security: rotate all exposed credentials

- Generated new API keys
- Updated Azure Key Vault
- Revoked old credentials
- Verified zero secrets in code

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

git push origin main && git push azure main
```

**Success Criteria:**
- [ ] Zero hardcoded secrets in codebase
- [ ] All secrets in .env or Azure Key Vault
- [ ] All functionality still works
- [ ] Old credentials rotated/revoked
- [ ] Re-scan shows 0 critical secrets

---

## High Priority Dependencies (Week 1-2)

### 🟠 Priority: HIGH | Effort: MEDIUM | Risk: MEDIUM

### Item 6: Update Vulnerable Dependencies

**Status:** ⚠️ Not Started
**Impact:** Fix 64 known vulnerabilities
**Time:** 1-2 days
**Risk Level:** Medium (may have breaking changes)

**Vulnerable Packages (from Trivy):**
- @langchain/core
- @modelcontextprotocol/sdk
- jsonwebtoken
- jws
- node-forge
- expr-eval

**Detailed Plan:**

**Day 1: Analysis**

1. **Extract Trivy findings**
   ```bash
   cat tools/orchestrator/artifacts/remediation_backlog.json | \
     jq '.[] | select(.type=="dependency")' > dependency_vulnerabilities.json
   ```

2. **Check current versions**
   ```bash
   npm list @langchain/core
   npm list jsonwebtoken
   npm list node-forge
   # ... etc for each vulnerable package
   ```

3. **Check for available updates**
   ```bash
   npm outdated
   ```

4. **Review breaking changes**
   - Check each package's CHANGELOG
   - Note breaking changes
   - Plan code updates needed

**Day 2: Updates**

5. **Update packages one at a time**
   ```bash
   # Example: jsonwebtoken
   npm update jsonwebtoken

   # Run tests
   npm test

   # If tests pass, commit
   git add package.json package-lock.json
   git commit -m "security: update jsonwebtoken to fix vulnerabilities"

   # If tests fail, review breaking changes and fix code
   ```

6. **For packages with breaking changes**
   - Update code to match new API
   - Update tests
   - Verify functionality
   - Document changes

7. **Final verification**
   ```bash
   # Re-run Trivy
   cd tools/orchestrator
   node dist/cli/index.js review --output artifacts

   # Check vulnerability count
   cat artifacts/remediation_backlog.json | \
     jq '[.[] | select(.type=="dependency")] | length'
   ```

**Commit:**

```bash
git add package.json package-lock.json api/src
git commit -m "security: update all vulnerable dependencies

- Updated @langchain/core to vX.X.X
- Updated jsonwebtoken to vX.X.X
- Updated node-forge to vX.X.X
- Fixed breaking changes in API usage
- All tests passing
- Vulnerabilities reduced from 64 to X

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
git push origin main && git push azure main
```

**Success Criteria:**
- [ ] All 64 vulnerabilities addressed
- [ ] Tests pass with new versions
- [ ] No functionality regression
- [ ] Breaking changes documented

---

## TypeScript Type Safety (Week 2-3)

### 🟡 Priority: MEDIUM | Effort: HIGH | Risk: MEDIUM

### Item 7: Fix TypeScript Type Errors

**Status:** ⚠️ Not Started
**Impact:** 1,258 type errors resolved
**Time:** 5-7 days
**Risk Level:** Medium (may expose logic bugs)

**Error Categories (from TypeScript scanner):**

1. **TS2307: Cannot find module** (~400 errors)
   - Missing imports
   - Incorrect module paths
   - Missing type declarations

2. **TS2339: Property does not exist** (~300 errors)
   - Missing type definitions
   - Incorrect interface usage

3. **TS2345: Argument type mismatch** (~200 errors)
   - Incorrect function signatures
   - Type incompatibility

4. **Other type errors** (~358 errors)

**Detailed Plan:**

**Day 1-2: Missing Imports (TS2307)**

1. **Extract TS2307 errors**
   ```bash
   npm run typecheck 2>&1 | grep "TS2307" > ts2307_errors.txt
   ```

2. **Common fixes**
   ```typescript
   // Error: Cannot find module 'react-toastify'
   // Fix: Install missing package
   npm install react-toastify
   npm install --save-dev @types/react-toastify

   // Error: Cannot find module '@/utils/helper'
   // Fix: Check path alias or correct import
   ```

3. **Process systematically**
   ```bash
   # For each error:
   # 1. Install missing package OR
   # 2. Fix import path OR
   # 3. Create type declaration file
   ```

**Day 3-4: Property Errors (TS2339)**

4. **Extract TS2339 errors**
   ```bash
   npm run typecheck 2>&1 | grep "TS2339" > ts2339_errors.txt
   ```

5. **Common fixes**
   ```typescript
   // Error: Property 'foo' does not exist on type 'Bar'

   // Fix 1: Add property to interface
   interface Bar {
     foo: string; // Add missing property
     existing: number;
   }

   // Fix 2: Use optional chaining if property may not exist
   const value = obj.foo?.bar;

   // Fix 3: Add type assertion if you know better than TypeScript
   const value = (obj as BarWithFoo).foo;
   ```

**Day 5-6: Type Mismatches (TS2345)**

6. **Extract TS2345 errors**
   ```bash
   npm run typecheck 2>&1 | grep "TS2345" > ts2345_errors.txt
   ```

7. **Common fixes**
   ```typescript
   // Error: Argument of type 'string' not assignable to 'number'

   // Fix: Correct the type
   function doSomething(id: number) { ... }
   doSomething(parseInt(userId)); // Parse string to number

   // Or update function signature if string is correct
   function doSomething(id: string | number) { ... }
   ```

**Day 7: Verification**

8. **Run full type check**
   ```bash
   npm run typecheck
   ```

9. **Enable strict mode (gradually)**
   ```json
   // tsconfig.json
   {
     "compilerOptions": {
       "strict": false, // Still false for now
       "noImplicitAny": true, // Enable one strict check at a time
       "strictNullChecks": false // Enable later
     }
   }
   ```

**Commits (daily):**

```bash
# Day 1-2
git add api/src package.json
git commit -m "fix(types): resolve TS2307 missing module errors - Batch 1

- Installed missing @types packages
- Fixed import paths
- Created type declaration files for untyped modules
- Resolved ~200 TS2307 errors

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Day 3-4
git add api/src src
git commit -m "fix(types): resolve TS2339 property errors - Batch 2

- Added missing properties to interfaces
- Implemented optional chaining where appropriate
- Created proper type definitions
- Resolved ~150 TS2339 errors

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Continue pattern for remaining errors

git push origin main && git push azure main
```

**Success Criteria:**
- [ ] TypeScript errors reduced to < 100
- [ ] All critical type errors resolved
- [ ] No new type errors introduced
- [ ] Tests still passing

---

### Item 8: Remove Remaining 'any' Types

**Status:** ⚠️ Not Started
**Impact:** ~80 'any' types in application code
**Time:** 3-5 days
**Risk Level:** Low

**Detailed Plan:**

1. **Find all remaining 'any' types**
   ```bash
   npx eslint . --format json 2>&1 | \
     jq '.[] | select(.messages[].ruleId == "@typescript-eslint/no-explicit-any")' > \
     remaining_any_types.json
   ```

2. **Prioritize by file criticality**
   - Core services (high priority)
   - Routes/controllers (high priority)
   - Utilities (medium priority)
   - Test files (low priority - already done)

3. **Process each file**
   ```typescript
   // Pattern for each 'any' replacement:

   // Before
   function processData(data: any) {
     return data.value;
   }

   // After
   interface ProcessableData {
     value: string | number;
     metadata?: Record<string, unknown>;
   }

   function processData(data: ProcessableData) {
     return data.value;
   }
   ```

4. **Commit in batches of 10-15 files**

**Success Criteria:**
- [ ] Zero 'any' types in src/ and api/src/
- [ ] All replaced with proper types
- [ ] TypeScript compilation successful

---

## Code Quality Improvements (Week 3-4)

### 🟢 Priority: LOW | Effort: HIGH | Risk: LOW

### Item 9: Backend Non-null Assertion Removal

**Status:** ⚠️ Not Started
**Impact:** 814 unsafe ! operators removed
**Time:** 3-4 days
**Risk Level:** Low

**Detailed Plan:**

1. **Find all backend non-null assertions**
   ```bash
   npm run lint 2>&1 | \
     grep "@typescript-eslint/no-non-null-assertion" | \
     grep "api/src/" > backend_assertions.txt
   ```

2. **Common patterns to fix**
   ```typescript
   // Pattern 1: Database queries
   // Before
   const user = await db.query('...').then(r => r.rows[0]!);

   // After
   const result = await db.query('...');
   if (!result.rows[0]) {
     throw new Error('User not found');
   }
   const user = result.rows[0];

   // Pattern 2: Service initialization
   // Before
   return this.client!.doSomething();

   // After
   if (!this.client) {
     throw new Error('Client not initialized');
   }
   return this.client.doSomething();

   // Pattern 3: Map/Array access
   // Before
   const value = map.get(key)!;

   // After
   const value = map.get(key);
   if (!value) {
     throw new Error(`Key ${key} not found`);
   }
   ```

3. **Process by service layer**
   - Day 1: Repositories (highest risk)
   - Day 2: Services
   - Day 3: Routes/Controllers
   - Day 4: Utilities

**Success Criteria:**
- [ ] Zero ! operators in backend code
- [ ] Proper error handling in place
- [ ] Tests updated to handle errors

---

### Item 10: Complex Code Quality Issues

**Status:** ⚠️ Not Started
**Impact:** ~10,000 remaining ESLint issues
**Time:** Ongoing (2-3 weeks)
**Risk Level:** Low

**Categories:**

1. **React Best Practices** (~2,000 issues)
   - Accessibility violations
   - Hook dependency issues
   - Prop types

2. **Code Complexity** (~1,500 issues)
   - Functions too long
   - Cyclomatic complexity
   - Nesting too deep

3. **Import/Export** (~1,000 issues)
   - Unused imports
   - Import ordering
   - Circular dependencies

4. **Naming Conventions** (~800 issues)
   - Variable naming
   - Function naming
   - Consistent patterns

5. **Other Quality** (~4,700 issues)
   - Various code smells
   - Consistency issues
   - Best practices

**Detailed Plan:**

**Week 1: React Best Practices**

1. **Fix accessibility issues**
   ```bash
   npm run lint 2>&1 | \
     grep "jsx-a11y" > accessibility_issues.txt
   ```

   Common fixes:
   - Add alt text to images
   - Add labels to form inputs
   - Add ARIA attributes
   - Ensure keyboard navigation

2. **Fix Hook dependencies**
   ```bash
   npm run lint 2>&1 | \
     grep "react-hooks/exhaustive-deps" > hook_deps.txt
   ```

   Fix: Add missing dependencies to useEffect/useCallback/useMemo

**Week 2: Code Complexity**

3. **Refactor complex functions**
   - Identify functions with complexity > 15
   - Break into smaller functions
   - Improve readability

4. **Reduce nesting**
   - Use early returns
   - Extract conditions to functions
   - Flatten nested if statements

**Week 3: Imports and Cleanup**

5. **Remove unused imports**
   ```bash
   npm run lint -- --fix  # Many auto-fixable
   ```

6. **Fix import ordering**
   - External packages first
   - Internal imports second
   - Type imports last

**Success Criteria:**
- [ ] ESLint errors < 1,000
- [ ] All critical issues resolved
- [ ] Code more maintainable
- [ ] Complexity reduced

---

## Long-term Improvements (Month 2+)

### Item 11: Increase Test Coverage

**Current:** 85%
**Target:** 90%+
**Time:** 1-2 weeks

**Plan:**
1. Identify uncovered code
2. Write tests for critical paths
3. Add integration tests
4. Add E2E tests

---

### Item 12: Enable TypeScript Strict Mode

**Current:** strict: false
**Target:** strict: true
**Time:** 2-3 weeks

**Plan:**
1. Enable one strict flag at a time
2. Fix errors for each flag
3. Gradually enable full strict mode

---

## 📊 Progress Tracking

### Weekly Goals

**Week 1:**
- [ ] Item 1: Auto-fixes (258 issues)
- [ ] Item 2: Orchestrator 'any' types (25 issues)
- [ ] Item 3: Parsing errors (2 issues)
- [ ] Item 4: Secrets audit (start)
- [ ] Item 6: Dependencies (start)

**Week 2:**
- [ ] Item 5: Secret migration (complete)
- [ ] Item 6: Dependencies (complete)
- [ ] Item 7: TypeScript errors (start)

**Week 3:**
- [ ] Item 7: TypeScript errors (continue)
- [ ] Item 8: Remaining 'any' types (start)
- [ ] Item 9: Backend assertions (start)

**Week 4:**
- [ ] Item 8: Remaining 'any' types (complete)
- [ ] Item 9: Backend assertions (complete)
- [ ] Item 10: Code quality (start)

---

## 🎯 Success Metrics

### End of Month 1:
- **ESLint Issues:** < 5,000 (from 10,281)
- **TypeScript Errors:** < 100 (from 1,258)
- **Critical Secrets:** 0 (from 3,797)
- **Vulnerable Dependencies:** 0 (from 64)
- **Test Coverage:** 90%+ (from 85%)

### End of Month 2:
- **ESLint Issues:** < 1,000
- **TypeScript Errors:** 0
- **TypeScript Strict Mode:** Enabled
- **Code Complexity:** All functions < 15
- **Test Coverage:** 95%+

---

## 📝 Notes

- **Commit frequently** - Small, atomic commits are easier to review and revert
- **Test before committing** - Always run tests, lint, and build
- **Push to both repos** - `git push origin main && git push azure main`
- **Document breaking changes** - Update README and migration guides
- **Track progress** - Update this file as items are completed

---

*Generated by Fleet Security Orchestrator*
*Date: 2026-01-07*
*Based on: 15,871 findings from comprehensive security scan*
