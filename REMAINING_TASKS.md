# Fleet CTA - Remaining Tasks & Action Items

**Generated**: 2026-02-02
**Current Status**: Development in Progress
**Priority**: High → Medium → Low

---

## 🔥 CRITICAL PRIORITY (P0) - Blocking Production

### 1. Fix Google Maps Functionality ⚠️ **BROKEN FOR 3+ DAYS**
**Status**: ❌ Not Working
**Priority**: P0 - CRITICAL
**Issue**: Maps not rendering on any page (0/6 pages working)

**Root Cause**:
- Google Maps API script removed from index.html due to Azure DevOps secret scanning
- Dynamic loading in GoogleMap.tsx component not working
- CSP (Content Security Policy) blocks required fonts.googleapis.com

**Action Items**:
- [ ] Move Google Maps API key to Azure Key Vault
- [ ] Create server-side endpoint to inject API key at runtime
- [ ] Update GoogleMap.tsx to load from secure endpoint
- [ ] Update CSP to allow fonts.googleapis.com (already done: index.html:29-30)
- [ ] Test maps on all 6 locations:
  - Dashboard (/)
  - Fleet Hub (/fleet)
  - Fleet Map Demo (/map-demo)
  - Maintenance Hub (/maintenance)
  - Safety Hub (/safety)
  - Assets Hub (/assets)

**Files Affected**:
- `index.html` (lines 72-73)
- `src/components/GoogleMap.tsx`
- `src/components/Maps/GoogleMapView.tsx`
- `src/components/Maps/ProfessionalFleetMap.tsx`

**Testing**:
```bash
node test_all_maps.cjs
```

---

### 2. Fix Backend API Server (Not Running)
**Status**: ❌ API not accessible
**Priority**: P0 - CRITICAL
**Issue**: Port 3001 not responding, MCP server cannot connect

**Action Items**:
- [ ] Check background process 695558 (npm start) status
- [ ] Restart API server if crashed:
  ```bash
  cd api-standalone
  DB_HOST=localhost npm start
  ```
- [ ] Verify API responds:
  ```bash
  curl http://localhost:3001/api/health
  ```
- [ ] Fix any startup errors in API server
- [ ] Ensure PostgreSQL container is running
- [ ] Test all API endpoints listed in docs/architecture/cta_fleet_analysis.md

**Dependencies**:
- PostgreSQL container must be running
- Environment variables properly set (.env file)

---

### 3. Verify Azure AD SSO Login Works
**Status**: ⚠️ Unknown (Port changed to 5173 but not tested)
**Priority**: P0 - CRITICAL
**Issue**: User reported login doesn't work

**Action Items**:
- [ ] Open http://localhost:5173 in browser
- [ ] Attempt Azure AD login
- [ ] Verify redirect to /auth/callback works
- [ ] Check MSAL token acquisition
- [ ] Test protected routes after login
- [ ] Verify .env has correct redirect URI:
  ```
  VITE_AZURE_AD_REDIRECT_URI=http://localhost:5173/auth/callback
  ```

**Files to Check**:
- `src/contexts/AuthContext.tsx`
- `src/pages/Login.tsx`
- `src/pages/AuthCallback.tsx`
- `.env` (VITE_AZURE_AD_* variables)

**Recent Change**: Changed Vite port from 5180 → 5173 in vite.config.ts:19

---

## 🎨 HIGH PRIORITY (P1) - User Experience

### 4. UI/UX Improvements
**Status**: 🔴 User feedback: "looks like shit", "cannot read anything"
**Priority**: P1 - HIGH
**User Quote**: *"I am very very disappointed with the overall ui and ux and you have not make any signficant changes or improvements"*

**Identified Issues**:
- Text readability problems (despite 9px → 12px accessibility fixes)
- Visual design needs improvement
- Layout/spacing issues
- Color contrast problems
- User experience feels poor

**Action Items**:
- [ ] Conduct UI/UX audit with screenshots
- [ ] Identify specific readability issues:
  - Font sizes
  - Color contrast ratios
  - Line heights
  - Spacing
- [ ] Create UI improvement plan with mockups
- [ ] Apply CTA branding guidelines consistently
- [ ] Test on multiple screen sizes
- [ ] Get user feedback on specific improvements

**Tools Available**:
- `infrastructure/fix_color_contrast.sh` (background process 91fb45)
- CTA branding constants in `src/constants/cta-branding.ts`
- Accessibility testing with axe-core

**Files to Review**:
- `src/components/layout/CommandCenterSidebar.tsx`
- `src/components/layout/CommandCenterHeader.tsx`
- `src/index.css` (global styles)
- `src/styles/enhanced-design-tokens.ts`

---

### 5. Test MCP Server with Real API Calls
**Status**: ⚠️ Configured but not tested with live data
**Priority**: P1 - HIGH

**Action Items**:
- [ ] Ensure API server is running (see task #2)
- [ ] Restart Claude Desktop to load MCP config
- [ ] Test each of 23 MCP tools:
  - **Vehicles** (5 tools): list, get, location, status, telemetry
  - **Drivers** (4 tools): list, get, schedule, safety score
  - **Maintenance** (4 tools): schedules, history, recommendations, create work order
  - **Compliance** (3 tools): status, inspections, violations
  - **Analytics** (4 tools): fleet stats, cost analysis, utilization, fuel efficiency
  - **Routes** (3 tools): list routes, details, optimize
- [ ] Verify data returns correctly
- [ ] Test error handling with invalid inputs
- [ ] Validate JSON schemas match API responses

**Testing Commands** (in Claude Desktop/Codex):
```
"Use fleet-cta MCP server"
"List all vehicles in the fleet"
"Get fleet statistics"
"Show maintenance schedules for this week"
```

**Known Dependency**: API server must be running on port 3001

---

## 📋 MEDIUM PRIORITY (P2) - Functionality & Polish

### 6. Create MCP Server Evaluations
**Status**: 📝 Partially started, needs completion
**Priority**: P2 - MEDIUM

**Action Items**:
- [ ] Create 10 complex evaluation questions (read-only, non-destructive)
- [ ] Verify each answer manually using MCP tools
- [ ] Ensure questions are:
  - Independent (don't depend on each other)
  - Complex (require multiple tool calls)
  - Realistic (actual use cases)
  - Stable (answers won't change over time)
- [ ] Create XML evaluation file
- [ ] Document in mcp-server/evaluations/

**Reference**: See `/Users/andrewmorton/.claude/plugins/marketplaces/anthropic-agent-skills/skills/mcp-builder/reference/evaluation.md`

**Example Questions**:
- "Which driver has the worst safety score in the past 90 days?"
- "What is the total maintenance cost for diesel vehicles this quarter?"
- "How many vehicles are overdue for inspection?"

---

### 7. Commit and Push Changes to GitHub
**Status**: ⚠️ Multiple uncommitted changes
**Priority**: P2 - MEDIUM

**Uncommitted Changes**:
- ✅ MCP server implementation (mcp-server/ directory)
- ✅ E2E documentation (docs/architecture/)
- ✅ External integrations guide
- ⚠️ Modified files in api/ and src/
- ⚠️ vite.config.ts (port change)
- ⚠️ index.html (CSP updates)

**Action Items**:
- [ ] Review all changes with `git diff`
- [ ] Stage MCP server and documentation:
  ```bash
  git add mcp-server/ docs/architecture/
  ```
- [ ] Commit with descriptive message
- [ ] Handle secret scanning issue (Google Maps API key)
- [ ] Push to feature branch
- [ ] Create PR if ready for review

**Blocked By**: Secret scanning prevents push with API key in index.html

---

### 8. Background Process Management
**Status**: ⚠️ Multiple background processes running
**Priority**: P2 - MEDIUM

**Running Processes**:
1. **695558**: `export DB_HOST=localhost && npm start` (API server)
2. **cad9d2**: `python3 e2e_production_workflow.py`
3. **41b677**: `python3 e2e_extended_workflows.py`
4. **91fb45**: `infrastructure/fix_color_contrast.sh`
5. **dca65d**: `cd api && npm run build && export DB_HOST=localhost && npm start`
6. **f96444**: `DB_HOST=localhost npm run dev &`
7. **eecf7f**: `DB_HOST=localhost npm run dev`
8. **22b625**: `npm run dev`
9. **39794e**: `node verify_a11y_fixes.cjs`

**Action Items**:
- [ ] Check output of each process with BashOutput
- [ ] Identify which are still needed
- [ ] Kill completed or failed processes
- [ ] Ensure only necessary processes remain:
  - API server (one instance)
  - Vite dev server (one instance on 5173)
  - Database container

**Cleanup Commands**:
```bash
# Check process status
jobs

# Kill specific process
kill %<job_number>

# Kill all node processes
pkill -f "node.*vite"
pkill -f "npm start"
```

---

## 📦 LOW PRIORITY (P3) - Nice to Have

### 9. Production Deployment Preparation
**Status**: 📝 Documented but not executed
**Priority**: P3 - LOW

**Action Items**:
- [ ] Review PRODUCTION_READINESS_*.md files
- [ ] Address items in production readiness checklist
- [ ] Configure Azure Static Web Apps deployment
- [ ] Set up Azure Key Vault for secrets
- [ ] Configure CI/CD pipeline
- [ ] Set up monitoring and logging
- [ ] Performance testing

**Files to Review**:
- `PRODUCTION_READINESS_ENDPOINT_MATRIX.md`
- `PRODUCTION_READINESS_TODO_TRIAGE.md`

---

### 10. Update All Documentation
**Status**: ⚠️ Some docs outdated
**Priority**: P3 - LOW

**Action Items**:
- [ ] Update README.md with latest features
- [ ] Update CLAUDE.md with new MCP server info
- [ ] Document map fix solution (once resolved)
- [ ] Update API documentation if endpoints changed
- [ ] Create deployment guide
- [ ] Update troubleshooting section

**Recent Additions**:
- ✅ E2E workflow documentation (docs/architecture/)
- ✅ MCP server documentation (mcp-server/)
- ✅ External integrations guide

---

### 11. Accessibility Compliance
**Status**: ⚠️ Fixes applied but user not satisfied
**Priority**: P3 - LOW (already done basic fixes)

**Completed**:
- ✅ Fixed text-[9px] → text-xs in 3 files
- ✅ Updated CSP to allow Google Fonts

**Remaining**:
- [ ] Run full accessibility audit
- [ ] Fix any WCAG 2.1 AA violations found
- [ ] Test with screen readers
- [ ] Verify keyboard navigation
- [ ] Check color contrast ratios (use contrast checker script)

**Tools**:
- axe-core (already initialized in src/main.tsx)
- Background process 91fb45 (fix_color_contrast.sh)

---

### 12. Spider Certification
**Status**: ⚠️ 302/551 items (54.8% complete)
**Priority**: P3 - LOW

**Action Items**:
- [ ] Review certification results
- [ ] Address failing items
- [ ] Re-run spider certification tests
- [ ] Target 90%+ pass rate

**Files**:
- `tests/certification/spider-certification.spec.ts`
- Background processes running certification scripts

---

## 🔧 TECHNICAL DEBT

### 13. Code Quality Improvements
**Action Items**:
- [ ] Fix any remaining TypeScript errors
- [ ] Address ESLint warnings
- [ ] Remove unused imports
- [ ] Clean up console.log statements
- [ ] Add JSDoc comments to public APIs
- [ ] Improve error handling consistency

---

### 14. Testing Coverage
**Action Items**:
- [ ] Write unit tests for MCP tools
- [ ] Create integration tests for API endpoints
- [ ] Add E2E tests for critical user flows
- [ ] Test MCP server with various input scenarios
- [ ] Playwright visual regression tests

---

## 📊 SUMMARY

**Total Tasks**: 14
**Critical (P0)**: 3 tasks
**High (P1)**: 2 tasks
**Medium (P2)**: 4 tasks
**Low (P3)**: 5 tasks

**Immediate Next Steps**:
1. ✅ Fix Google Maps (P0) - **MOST CRITICAL**
2. ✅ Restart API server and verify it works (P0)
3. ✅ Test Azure AD login (P0)
4. ✅ UI/UX improvements based on user feedback (P1)
5. ✅ Test MCP server with real API calls (P1)

---

## 🎯 SUCCESS CRITERIA

**Minimum Viable Product (MVP)**:
- [ ] Maps render correctly on all pages
- [ ] API server running and responding
- [ ] Azure AD login works
- [ ] MCP server connects and returns data
- [ ] Basic UI is readable and functional

**Production Ready**:
- [ ] All P0 and P1 tasks complete
- [ ] No security vulnerabilities
- [ ] Performance benchmarks met
- [ ] Documentation complete and accurate
- [ ] Tests passing

---

## 📞 SUPPORT & RESOURCES

**Documentation**:
- E2E Architecture: `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/docs/architecture/`
- MCP Server: `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/mcp-server/`
- API Reference: Documented in E2E docs

**Testing Tools**:
- `test_all_maps.cjs` - Test map rendering
- `test_app_playwright.cjs` - E2E app testing
- `check_map_errors.cjs` - Map diagnostics

**Commands**:
```bash
# Start frontend
npm run dev

# Start API
cd api-standalone && DB_HOST=localhost npm start

# Start PostgreSQL
docker start fleet-postgres

# Test maps
node test_all_maps.cjs

# MCP server
cd mcp-server && npm start
```

---

**Last Updated**: 2026-02-02 14:55 EST
**Next Review**: After completing P0 tasks
