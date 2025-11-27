# Autonomous AI Agent Orchestration System
**OpenAI Codex + Google Gemini + Claude Orchestration**

## 🎯 Objective

Maximize development velocity by delegating 90% of coding work to OpenAI Codex and Google Gemini agents in Azure, while using Claude only for:
- High-level orchestration
- Quality validation
- Strategic decisions
- Final review

---

## 🤖 Agent Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLAUDE (Orchestrator)                        │
│  - Strategy & Planning                                          │
│  - Agent Assignment                                             │
│  - Quality Gates                                                │
│  - Final Approval                                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ├──────────────────┬─────────────────┐
                              ▼                  ▼                 ▼
┌─────────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│  OpenAI Codex       │ │  Google Gemini   │ │  GitHub Copilot  │
│  Azure Agents (8)   │ │  Azure Agents(6) │ │  Local Helper    │
│  - Code Generation  │ │  - Code Review   │ │  - Quick Fixes   │
│  - API Development  │ │  - Testing       │ │  - Refactoring   │
│  - Database Schemas │ │  - Documentation │ │  - Auto-complete │
│  - Component Build  │ │  - Security Scan │ │                  │
└─────────────────────┘ └──────────────────┘ └──────────────────┘
```

---

## 🚀 OpenAI Codex Agents (Azure Deployment)

### Agent 1: Frontend Component Builder
**Model**: `gpt-4-turbo` (code-davinci-002 fallback)
**Azure VM**: 4 vCPUs, 8GB RAM
**Runtime**: Node.js 20 + TypeScript
**Tasks**:
- Generate React components from specifications
- Create TypeScript interfaces and types
- Build UI layouts with Tailwind CSS
- Implement state management (Zustand)
- Create custom hooks

**Input Format**:
```json
{
  "task": "component_generation",
  "spec": {
    "name": "VehicleTelemetryDashboard",
    "type": "page",
    "features": ["real-time updates", "drill-through", "export"],
    "data_source": "WebSocket /api/obd2/:vehicleId",
    "ui_framework": "tailwind",
    "state": "zustand"
  }
}
```

**Output**: Complete `.tsx` file with tests

---

### Agent 2: Backend API Generator
**Model**: `gpt-4-turbo`
**Azure VM**: 4 vCPUs, 8GB RAM
**Runtime**: Node.js 20 + Express
**Tasks**:
- Generate Express routes
- Create API controllers
- Build database queries (parameterized, secure)
- Implement authentication middleware
- Create WebSocket endpoints

**Input Format**:
```json
{
  "task": "api_generation",
  "endpoint": {
    "method": "GET",
    "path": "/api/vehicles/:id/telemetry",
    "auth": "required",
    "response": "OBD2Data",
    "database": "vehicles",
    "realtime": true
  }
}
```

**Output**: Route file + controller + tests

---

### Agent 3: Database Schema & Migration Generator
**Model**: `gpt-4-turbo`
**Azure VM**: 2 vCPUs, 4GB RAM
**Runtime**: PostgreSQL 15
**Tasks**:
- Generate SQL schemas
- Create migration scripts
- Build seed data
- Design indexes
- Create relationships

**Input Format**:
```json
{
  "task": "database_schema",
  "tables": ["parts_inventory", "vehicle_inventory", "purchase_orders"],
  "relationships": ["parts -> vehicles", "parts -> suppliers"],
  "requirements": ["audit_trail", "soft_delete", "timestamps"]
}
```

**Output**: Migration SQL + seed data SQL

---

### Agent 4: Test Suite Generator
**Model**: `gpt-4-turbo`
**Azure VM**: 4 vCPUs, 8GB RAM
**Runtime**: Playwright + Vitest
**Tasks**:
- Generate Playwright E2E tests
- Create unit tests (Vitest)
- Build visual regression tests
- Create API integration tests
- Generate test data factories

**Input Format**:
```json
{
  "task": "test_generation",
  "target": "src/pages/VehicleTelemetry.tsx",
  "test_types": ["unit", "integration", "e2e", "visual"],
  "coverage_target": 90
}
```

**Output**: Test files with 90%+ coverage

---

### Agent 5: Microsoft 365 Emulator Builder
**Model**: `gpt-4-turbo`
**Azure VM**: 8 vCPUs, 16GB RAM
**Runtime**: Node.js 20 + WebSocket
**Tasks**:
- Build Outlook email emulator
- Build Calendar emulator
- Build Teams chat/channels
- Build Azure AD user management
- Generate realistic test data (emails, events, messages)

**Input Format**:
```json
{
  "task": "m365_emulator",
  "component": "outlook_inbox",
  "features": ["compose", "search", "folders", "attachments"],
  "test_data": {
    "emails": 100,
    "senders": 25,
    "date_range": "90_days"
  }
}
```

**Output**: Full emulator + API + UI + test data

---

### Agent 6: Parts Inventory System Builder
**Model**: `gpt-4-turbo`
**Azure VM**: 4 vCPUs, 8GB RAM
**Tasks**:
- Build parts catalog system
- Create inventory tracking
- Build vehicle-based inventory
- Generate barcode/QR support
- Create low-stock alerts

**Output**: Complete inventory system

---

### Agent 7: Florida Traffic Camera Integrator
**Model**: `gpt-4-turbo`
**Azure VM**: 8 vCPUs, 16GB RAM
**Tasks**:
- Fetch all 411 FL DOT cameras
- Create Leaflet custom layer
- Build camera feed proxy
- Generate database schema
- Create Azure Function for sync

**Output**: Complete traffic camera system

---

### Agent 8: Drill-Through System Builder
**Model**: `gpt-4-turbo`
**Azure VM**: 4 vCPUs, 8GB RAM
**Tasks**:
- Build universal drill-through modal
- Create drill-through hooks
- Add export functionality
- Implement analytics tracking

**Output**: Complete drill-through system

---

## 🧠 Google Gemini Agents (Azure Deployment)

**Total Agents**: 7 (previously 6)
**Total Resources**: 26 vCPUs, 52GB RAM

### Agent 1: Code Quality Reviewer
**Model**: `gemini-1.5-pro`
**Azure VM**: 4 vCPUs, 8GB RAM
**Tasks**:
- Review all generated code
- Check for security vulnerabilities
- Verify best practices
- Suggest optimizations
- Validate TypeScript types

**Input**: Code from OpenAI agents
**Output**: Approval + suggestions

---

### Agent 2: PDCA Loop Validator
**Model**: `gemini-1.5-pro`
**Azure VM**: 4 vCPUs, 8GB RAM
**Tasks**:
- Validate feature completeness
- Check industry relevance
- Verify detail sufficiency
- Assess relatability
- Quality scoring (1-100)

**Quality Criteria**:
```javascript
{
  "completeness": 0-25, // All functionality present
  "detail": 0-25,       // Sufficiently detailed UI/UX
  "industry_relevance": 0-25, // Matches industry standards
  "relatability": 0-25  // User-friendly, intuitive
}
```

**Minimum Passing Score**: 90/100

---

### Agent 3: Documentation Generator
**Model**: `gemini-1.5-pro`
**Azure VM**: 2 vCPUs, 4GB RAM
**Tasks**:
- Generate API documentation (OpenAPI)
- Create user guides
- Build developer docs
- Generate ER diagrams
- Create architecture diagrams

---

### Agent 4: Integration Tester
**Model**: `gemini-1.5-pro`
**Azure VM**: 4 vCPUs, 8GB RAM
**Tasks**:
- Test mobile app integration
- Verify API connectivity
- Test emulator accuracy
- Validate AI tool integration
- Check end-to-end workflows

**Validates**:
- Frontend ↔ Backend
- Mobile App ↔ API
- Emulators ↔ Database
- AI Tools ↔ System

---

### Agent 5: Performance Optimizer
**Model**: `gemini-1.5-pro`
**Azure VM**: 4 vCPUs, 8GB RAM
**Tasks**:
- Analyze bundle size
- Optimize database queries
- Reduce API latency
- Improve render performance
- Minimize network requests

**Targets**:
- Page load < 2 seconds
- API response < 200ms
- Bundle size < 500KB (gzipped)

---

### Agent 6: Accessibility Auditor
**Model**: `gemini-1.5-pro`
**Azure VM**: 2 vCPUs, 4GB RAM
**Tasks**:
- Run pa11y audits
- Check WCAG 2.1 AA compliance
- Verify keyboard navigation
- Test screen reader compatibility
- Validate color contrast

---

### Agent 7: Repository Review Agent
**Model**: `gemini-1.5-pro`
**Azure VM**: 4 vCPUs, 8GB RAM
**Tasks**:
- Scan entire codebase to identify missing/excluded functionality
- Analyze git history for recently deleted features
- Verify all documented features are implemented
- Cross-reference database schema with expected tables
- Check API endpoint coverage (CRUD completeness)
- Identify untested components (test coverage gaps)
- Generate daily restoration reports
- Auto-create GitHub issues for critical gaps

**Execution**:
- Daily automated run at 2 AM EST
- On-demand execution via `npm run repository-review:now`
- Integrates with PDCA CHECK phase

**Output**: Comprehensive restoration roadmap with priority rankings

**See**: `REPOSITORY_REVIEW_AGENT.md` for full specification

---

## 🔄 PDCA Loop with Quality Gates

### PLAN Phase (Claude Orchestration)
1. Receive user requirement
2. Break down into atomic tasks
3. Assign tasks to appropriate AI agents
4. Define success criteria
5. Set quality thresholds

**Claude Role**: Strategic planning only (minimal tokens)

---

### DO Phase (OpenAI Codex Agents)
1. **Agent 1-8 Execute in Parallel**:
   - Generate code
   - Create tests
   - Build documentation
   - Seed data

2. **Auto-commit to feature branch**:
   ```bash
   git checkout -b feature/ai-generated-{task-id}
   git add .
   git commit -m "AI Generated: {task-description}"
   git push origin feature/ai-generated-{task-id}
   ```

**Claude Role**: Monitor progress (minimal tokens)

---

### CHECK Phase (Gemini Agents + Automated Tests)

#### Level 1: Code Quality (Gemini Agent 1)
- [ ] Security scan (no vulnerabilities)
- [ ] Best practices followed
- [ ] TypeScript strict mode passes
- [ ] ESLint passes
- [ ] No console.log in production

#### Level 2: Feature Quality (Gemini Agent 2)
- [ ] **Completeness**: All functionality implemented (25/25)
- [ ] **Detail**: UI sufficiently detailed, professional (25/25)
- [ ] **Industry Relevance**: Matches industry leaders (ServiceNow, Salesforce) (25/25)
- [ ] **Relatability**: Intuitive, user-friendly (25/25)

**Minimum Score**: 90/100

#### Level 3: Integration Tests (Gemini Agent 4)
- [ ] Mobile app communicates with API
- [ ] API returns accurate data (no hardcoded)
- [ ] Emulator generates realistic data
- [ ] AI tools integrate seamlessly
- [ ] End-to-end workflows complete

#### Level 4: Automated Tests
- [ ] Playwright tests pass (90%+ coverage)
- [ ] Unit tests pass
- [ ] Visual regression tests pass
- [ ] Performance benchmarks met
- [ ] Accessibility audit passes

**If ANY check fails**: Reject and return to DO phase

---

### ACT Phase (Claude Final Approval)

#### If All Checks PASS:
1. Claude reviews summary report
2. Approves merge to main
3. Triggers deployment pipeline
4. Updates documentation
5. Tags release
6. Notifies team

#### If Any Check FAILS:
1. Gemini Agent 2 generates remediation plan
2. OpenAI agents fix issues
3. Re-run CHECK phase
4. Maximum 3 retry attempts

**Claude Role**: Final approval only (minimal tokens)

---

## 📊 Token Optimization Strategy

### Claude Usage (Target: <10% of total)
- Initial planning: ~500 tokens
- Progress monitoring: ~100 tokens/hour
- Final review: ~300 tokens
- Total per feature: ~1,500 tokens

### OpenAI Codex Usage (Target: ~60% of total)
- Code generation: ~10,000 tokens/feature
- Test generation: ~5,000 tokens/feature
- Documentation: ~2,000 tokens/feature
- Total per feature: ~17,000 tokens

### Google Gemini Usage (Target: ~30% of total)
- Code review: ~3,000 tokens/feature
- Quality validation: ~2,000 tokens/feature
- Integration testing: ~3,000 tokens/feature
- Total per feature: ~8,000 tokens

**Total per feature**: ~26,500 tokens (90% handled by OpenAI/Gemini)

---

## 🚀 Deployment Commands

### 1. Deploy OpenAI Codex Agents
```bash
cd /Users/andrewmorton/Documents/GitHub/fleet-local/azure-agents

# Deploy all 8 OpenAI agents
./deploy-openai-agents.sh

# Verify deployment
az vm list --resource-group fleet-ai-agents --output table
```

### 2. Deploy Gemini Agents
```bash
# Deploy all 6 Gemini agents
./deploy-gemini-agents.sh

# Verify deployment
az vm list --resource-group fleet-ai-agents --output table
```

### 3. Start Orchestration
```bash
# Start Claude orchestrator (local)
npm run orchestrate

# Monitor all agents
npm run monitor-agents
```

---

## 📋 Agent Task Queue

### Priority 1 (Start Immediately)
1. **OpenAI Agent 5**: Build Microsoft 365 Emulators
2. **OpenAI Agent 6**: Build Parts Inventory System
3. **OpenAI Agent 7**: Integrate Florida Traffic Cameras
4. **OpenAI Agent 8**: Build Drill-Through System

### Priority 2 (After database seeded)
1. **OpenAI Agent 1**: Build all missing page components
2. **OpenAI Agent 2**: Build all missing API endpoints
3. **OpenAI Agent 3**: Generate remaining migrations
4. **OpenAI Agent 4**: Generate comprehensive test suite

### Continuous
- **Gemini Agent 1**: Review all code as it's generated
- **Gemini Agent 2**: Validate quality on every commit
- **Gemini Agent 4**: Integration testing every 2 hours
- **Gemini Agent 5**: Performance optimization daily
- **Gemini Agent 6**: Accessibility audit daily

---

## 🎯 Success Metrics

### Development Velocity
- **Target**: 20+ features per day (with 14 parallel agents)
- **Claude Token Savings**: 90% reduction
- **Quality Score**: 95+ average
- **Test Coverage**: 90%+
- **Deployment Frequency**: Every 2 hours

### Quality Assurance
- **Industry Relevance Score**: 95/100
- **Feature Detail Score**: 95/100
- **Relatability Score**: 95/100
- **Completeness Score**: 100/100

### Integration Accuracy
- **Mobile ↔ API**: 100% functional
- **API ↔ Database**: 100% accurate (no hardcoded data)
- **Emulator ↔ Real**: 95%+ realistic
- **AI Tools ↔ System**: 100% integrated

---

## 🛡️ Safety & Rollback

### Automatic Rollback Triggers
- Test coverage drops below 85%
- Performance regression > 20%
- Security vulnerabilities detected
- Accessibility violations
- Quality score < 90

### Manual Review Required
- Architecture changes
- Database schema changes
- Security-critical code
- Payment processing
- Authentication flows

---

## 📞 Agent Communication Protocol

### Agent → Claude (Minimal)
- Task completion notification
- Blocking errors only
- Critical decisions only

### Agent → Agent (Frequent)
- Code handoffs
- Test results
- Review feedback

### Claude → User (Regular)
- Progress updates every hour
- Quality gate results
- Deployment notifications

---

## 🔐 API Keys & Credentials

All stored in Azure Key Vault:
- `OPENAI_API_KEY`
- `GEMINI_API_KEY`
- `GITHUB_PAT`
- `AZURE_DEVOPS_PAT`
- `DATABASE_CONNECTION_STRING`

---

## ✅ Next Steps

1. ✅ Created this orchestration plan
2. ⏳ Deploy OpenAI Codex agents to Azure
3. ⏳ Deploy Gemini agents to Azure
4. ⏳ Configure agent task queue
5. ⏳ Start PDCA loop
6. ⏳ Monitor and optimize

---

**Estimated Time to Full Restoration**: 24-36 hours with all agents running in parallel

**Claude Token Usage**: <5,000 tokens for entire restoration (99% savings)
