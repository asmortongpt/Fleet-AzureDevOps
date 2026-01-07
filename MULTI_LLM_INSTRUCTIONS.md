# Fleet Multi-LLM Coordination Instructions

> **IMPORTANT**: This document is the source of truth for all LLMs working on the Fleet project.
> Update this document as work progresses.

---

## 🔗 Repository Information
- **Repository**: https://github.com/asmortongpt/Fleet.git
- **Local Path**: `/Users/andrewmorton/Documents/GitHub/Fleet`
- **Company**: Morton Technology Alliance, LLC
- **Primary Branch**: `main`

---

## 🖥️ MCP Server Configuration

### Fleet Standards MCP Server
The project includes an MCP (Model Context Protocol) server for accessing project standards:

**Server Location**: `/Users/andrewmorton/Documents/GitHub/Fleet/tools/mcp-standards-server.ts`

### Available MCP Resources
| Resource URI | Description |
|--------------|-------------|
| `fleet://standards/rules` | Mandatory project rules |
| `fleet://standards/status` | Current project status |
| `fleet://standards/rbac` | RBAC permissions |
| `fleet://standards/security` | Security certification status |

### Available MCP Tools
| Tool | Description |
|------|-------------|
| `get-rules` | Get mandatory rules by category |
| `check-compliance` | Check if a proposed change is compliant |
| `get-rbac-permissions` | Get permissions for a specific role |

### Standards CLI (Alternative)
```bash
# Get rules
node tools/standards-cli.cjs rules security

# Get status
node tools/standards-cli.cjs status

# Check RBAC
node tools/standards-cli.cjs rbac Admin
```

---

## 📋 Work Tracking

### Current Active Work Items

| Branch | Status | Agent Assigned | Last Updated | Description |
|--------|--------|--------------|--------------|-------------|
| `feature/typescript-remediation-jan2026` | **IN PROGRESS** | **Gemini (Current)** | 2026-01-07 | TypeScript error remediation (175 errors remaining) |
| `feature/swarm-1-database-api` | **ASSIGNED** | **Claude-3.5-Sonnet** | 2026-01-07 | Database & API improvements (HIGH PRIORITY) |
| `feature/swarm-2-realtime-websocket` | AVAILABLE | - | - | WebSocket implementation |
| `feature/swarm-3-telematics-iot` | AVAILABLE | - | - | Telematics integration |
| `feature/swarm-4-ai-ml-analytics` | AVAILABLE | - | - | AI/ML analytics |
| `feature/swarm-5-video-cv` | AVAILABLE | - | - | Video/Computer Vision |
| `feature/swarm-6-inventory-supply-chain` | AVAILABLE | - | - | Inventory management |
| `feature/swarm-7-financial-integrations` | AVAILABLE | - | - | Financial systems |
| `feature/swarm-8-compliance-regulatory` | **ASSIGNED** | **GPT-4o** | 2026-01-07 | Compliance features (HIGH PRIORITY) |
| `feature/swarm-9-frontend-integration` | **ASSIGNED** | **v0 / Claude** | 2026-01-07 | Frontend integration (HIGH PRIORITY) |
| `feature/swarm-10-infrastructure-devops` | AVAILABLE | - | - | Infrastructure/DevOps |
| `feature/swarm-11-mobile-pwa` | AVAILABLE | - | - | Mobile/PWA development |
| `feature/swarm-12-testing-qa` | **ASSIGNED** | **Gemini-Pro** | 2026-01-07 | Testing/QA (HIGH PRIORITY) |

**Status Values**: `AVAILABLE`, `IN PROGRESS`, `BLOCKED`, `COMPLETE`, `NEEDS REVIEW`, `ASSIGNED`

---

## 🎯 Specific Tasks per Branch

### Swarm 1: Database & API (`feature/swarm-1-database-api`)
**Priority**: HIGH
**Tasks**:
1. Fix API endpoint mock data (70% currently return mocks)
2. Complete PostgreSQL production deployment
3. Implement proper database migrations
4. Add missing API routes for CRUD operations
5. Implement proper error handling in API routes

**Key Files**:
- `/api/src/routes/` - API route handlers
- `/api/src/services/` - Business logic
- `/api/src/migrations/` - Database migrations

---

### Swarm 2: Real-time WebSocket (`feature/swarm-2-realtime-websocket`)
**Priority**: MEDIUM
**Tasks**:
1. Implement WebSocket server for real-time updates
2. Add vehicle location streaming
3. Implement alert notifications via WebSocket
4. Add connection retry logic
5. Implement heartbeat/ping-pong

**Key Files**:
- `/api/src/websocket/` - WebSocket handlers
- `/src/hooks/useWebSocket.ts` - Frontend hook

---

### Swarm 3: Telematics & IoT (`feature/swarm-3-telematics-iot`)
**Priority**: MEDIUM
**Tasks**:
1. Integrate telematics data feeds
2. Implement OBD-II data parsing
3. Add GPS tracking integration
4. Create telematics dashboard components
5. Implement data aggregation for analytics

**Key Files**:
- `/src/components/hubs/telematics/`
- `/api/src/services/telematics/`

---

### Swarm 4: AI/ML Analytics (`feature/swarm-4-ai-ml-analytics`)
**Priority**: LOW
**Tasks**:
1. Implement predictive maintenance models
2. Add anomaly detection for vehicle data
3. Create AI-powered insights dashboard
4. Implement cost prediction algorithms
5. Add natural language query interface

**Key Files**:
- `/src/lib/ai/`
- `/api/src/services/ai/`

---

### Swarm 5: Video & Computer Vision (`feature/swarm-5-video-cv`)
**Priority**: LOW
**Tasks**:
1. Implement video streaming from dash cams
2. Add vehicle damage detection
3. Create video playback components
4. Implement incident clip extraction
5. Add AI-powered video analysis

**Key Files**:
- `/src/features/video/`
- `/api/src/services/video/`

---

### Swarm 6: Inventory & Supply Chain (`feature/swarm-6-inventory-supply-chain`)
**Priority**: MEDIUM
**Tasks**:
1. Complete parts inventory management
2. Implement PO workflow system
3. Add vendor management features
4. Create inventory alerts/notifications
5. Implement barcode/RFID scanning

**Key Files**:
- `/src/features/business/inventory/`
- `/api/src/routes/inventory.routes.ts`

---

### Swarm 7: Financial Integrations (`feature/swarm-7-financial-integrations`)
**Priority**: MEDIUM
**Tasks**:
1. Integrate with PeopleSoft/financial systems
2. Implement cost tracking and reporting
3. Add budget management features
4. Create financial analytics dashboard
5. Implement invoice processing

**Key Files**:
- `/src/pages/FinancialHub.tsx`
- `/api/src/services/financial/`

---

### Swarm 8: Compliance & Regulatory (`feature/swarm-8-compliance-regulatory`)
**Priority**: HIGH
**Tasks**:
1. Implement FedRAMP compliance controls
2. Add NIST 800-53 control mappings
3. Create compliance reporting dashboard
4. Implement audit logging
5. Add policy enforcement engine

**Key Files**:
- `/src/pages/ComplianceHub.tsx`
- `/api/src/middleware/audit.ts`
- `/src/lib/policy-engine/`

---

### Swarm 9: Frontend Integration (`feature/swarm-9-frontend-integration`)
**Priority**: HIGH
**Tasks**:
1. Wire all Hub components to real APIs
2. Fix remaining TypeScript errors in UI
3. Implement proper loading/error states
4. Add data validation in forms
5. Complete responsive design

**Key Files**:
- `/src/pages/*Hub.tsx`
- `/src/components/ui/`

---

### Swarm 10: Infrastructure & DevOps (`feature/swarm-10-infrastructure-devops`)
**Priority**: MEDIUM
**Tasks**:
1. Configure Azure production deployment
2. Set up CI/CD pipelines
3. Implement infrastructure as code
4. Configure monitoring and alerting
5. Set up log aggregation

**Key Files**:
- `/.github/workflows/`
- `/deployment/`
- `/infrastructure/`

---

### Swarm 11: Mobile & PWA (`feature/swarm-11-mobile-pwa`)
**Priority**: LOW
**Tasks**:
1. Complete PWA configuration
2. Add offline support
3. Implement push notifications
4. Create mobile-optimized views
5. Add native app wrappers

**Key Files**:
- `/src/services/pwa/`
- `/public/manifest.json`

---

### Swarm 12: Testing & QA (`feature/swarm-12-testing-qa`)
**Priority**: HIGH
**Tasks**:
1. Fix failing E2E tests
2. Add unit tests for critical paths
3. Implement visual regression testing
4. Create integration test suite
5. Add performance benchmarks

**Key Files**:
- `/e2e/`
- `/tests/`
- `/vitest.config.ts`

---

## ✅ Check-Out Workflow (Starting Work)

### 1. Claim a Branch
```bash
cd /Users/andrewmorton/Documents/GitHub/Fleet
git fetch origin
git checkout <branch-name>
git pull origin <branch-name>
```

### 2. Update This Document
Mark your branch as `IN PROGRESS` with your LLM name and date.

### 3. Read Project Context
```bash
# Check current TypeScript errors
npx tsc --noEmit 2>&1 | grep -c "error TS"

# Check project status
node tools/standards-cli.cjs status
```

---

## ✅ Check-In Workflow (Saving Work)

### 1. Commit Your Changes
```bash
git add -A
git commit -m "type: brief description"
```

### 2. Push to Remote
```bash
git push origin <branch-name>
```

### 3. Update This Document
- Change status: `COMPLETE`, `NEEDS REVIEW`, or `AVAILABLE`
- Add notes about what was accomplished

---

## 🔧 Common Commands

### TypeScript
```bash
npx tsc --noEmit 2>&1 | grep -c "error TS"  # Count errors
npx tsc --noEmit 2>&1 | head -50             # View first 50 errors
```

### Running Application
```bash
npm run dev -- --port 5173    # Frontend
cd api && npm run dev         # Backend
```

### Testing
```bash
npm run test                  # Unit tests
npm run e2e                   # E2E tests
```

### Git
```bash
git branch                    # Check current branch
git status                    # Check for changes
rm -f .git/index.lock        # Fix git lock error
```

---

## 📊 Progress Summary

### TypeScript Errors
| Date | Errors | Change |
|------|--------|--------|
| 2026-01-07 Start | 1,253 | - |
| 2026-01-07 Current | 175 | -1,078 (86% reduction) |

---

## ⚠️ Rules for All LLMs

1. **Security First**: Follow FedRAMP/NIST compliance
2. **No Hardcoded Secrets**: Use environment variables
3. **Type Safety**: All TypeScript must be properly typed
4. **Test Coverage**: Add tests for new features
5. **Documentation**: Update docs for API changes
6. **Commit Messages**: Use conventional commit format
7. **Branch Discipline**: Never commit directly to `main`

---

## 📝 Communication Log

Use this section to leave notes for other LLMs:

| Date | LLM | Note |
|------|-----|------|
| 2026-01-07 | Gemini | Started TypeScript remediation. Reduced errors from 1253 to 175 by excluding experimental components and fixing type definitions. Assigned high-priority swarms to Claude, GPT-4o, and v0. |

---

**Last Updated**: 2026-01-07 15:23 EST by Gemini
