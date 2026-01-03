# Quality Assurance Framework with RAG/CAG Integration
## 7 Quality Gate Questions - Must ALL Be YES

Every completion in this codebase MUST answer YES to ALL of these questions:

## RAG/CAG Infrastructure Requirements

Before ANY quality gates can be validated, the following infrastructure MUST be in place:

### RAG (Retrieval-Augmented Generation) Infrastructure
**Purpose**: Search and retrieve relevant code patterns, documentation, and best practices from codebase and knowledge base

**Required Components**:
- [ ] Vector database (Pinecone/Weaviate/pgvector) with codebase embeddings
- [ ] Embedding generation pipeline (for code, docs, commits)
- [ ] Hybrid search (vector + keyword) capability
- [ ] Retrieval API with ACL enforcement
- [ ] MCP (Model Context Protocol) server integration
- [ ] Document ingestion pipeline with security validation

**Retrieval Security Controls**:
- [ ] Tenant-scoped retrieval (`tenant_id` in all queries)
- [ ] ACL enforcement at query time (not just ingestion)
- [ ] Metadata filters on all vector searches
- [ ] Max token limits on retrieved chunks
- [ ] Prompt injection detection on retrieved content
- [ ] Citation/source tracking for all retrieved documents

### CAG (Cache/Context-Augmented Generation) Infrastructure
**Purpose**: Cache previously computed context, embeddings, and retrieval results with proper isolation

**Required Components**:
- [ ] Cache store (Redis/Memcached) with encryption at rest
- [ ] Cache keys scoped to `tenant_id + user_id + content_hash`
- [ ] TTL configuration (retrieval: hours, responses: minutes)
- [ ] Cache invalidation on permission/document changes
- [ ] Integrity hash verification for cached content
- [ ] Conversation state persistence (if applicable)

**Cache Security Controls**:
- [ ] Zero cross-user cache leakage (strict isolation)
- [ ] Re-authorization check before cache reuse
- [ ] No secrets/PII stored unredacted in cache
- [ ] Cache poisoning defense (integrity verification)
- [ ] Automatic cache expiry on role/permission changes
- [ ] Cache access audit logging

### 1. Is this the most secure solution?
**Verification Checklist:**
- [ ] All user inputs validated (whitelist approach, not blacklist)
- [ ] SQL queries use parameterized statements ($1, $2, etc.) - NEVER string concatenation
- [ ] Passwords hashed with bcrypt/argon2 (cost >= 12)
- [ ] JWTs validated properly with signature verification
- [ ] Output escaped for context (HTML, JS, URL, SQL)
- [ ] execFile() used with arrays (NOT exec() with user input)
- [ ] shell: false when using spawn()
- [ ] No hardcoded secrets - using env vars or Azure Key Vault
- [ ] Security headers (CSP, X-Frame-Options, X-Content-Type-Options, etc.) present
- [ ] HTTPS enforced everywhere
- [ ] Least privilege applied to all operations
- [ ] Audit logging for sensitive operations
- [ ] No eval(), new Function(), or similar code execution from user input
- [ ] File uploads validated by content, not just extension
- [ ] Rate limiting on authentication and sensitive endpoints

**Evidence Required:**
- Security scan results (no critical/high vulnerabilities)
- Penetration test results (if applicable)
- Code review approval from security specialist

**RAG/CAG Validation (ACTUAL IMPLEMENTATION)**:

**RAG Queries (Execute These)**:
```bash
# Vector search for similar security implementations
curl -X POST "http://localhost:8080/rag/search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "authentication implementation with JWT validation",
    "filters": {"tenant_id": "$TENANT_ID", "category": "security"},
    "max_results": 10
  }'

# Retrieve OWASP/CWE patterns from knowledge base
curl -X POST "http://localhost:8080/rag/search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "input validation parameterized queries SQL injection prevention",
    "filters": {"source": "security-kb", "standards": ["OWASP", "CWE"]},
    "max_results": 5
  }'

# Search git history for security fix patterns
git log --all --grep="security\|CVE\|vulnerability" --format="%H %s" | head -20
```

**CAG Cache Checks**:
```bash
# Check cached security pattern results (with tenant isolation)
redis-cli GET "rag:security:patterns:${TENANT_ID}:${CONTENT_HASH}"

# Verify cache TTL and re-authorization
redis-cli TTL "rag:security:patterns:${TENANT_ID}:${CONTENT_HASH}"
```

**Validation Steps**:
1. Execute RAG search for "JWT validation", "bcrypt password hashing", "parameterized SQL"
2. Compare retrieved patterns with current implementation
3. Verify no deviations from established security patterns
4. Check cached results are scoped to tenant/user
5. Ensure prompt injection defense on retrieved docs

### 2. Is this the best architecture?
**Verification Checklist:**
- [ ] Follows SOLID principles
- [ ] Proper separation of concerns
- [ ] Scalable design (handles 10x growth)
- [ ] Maintainable (clear naming, documented patterns)
- [ ] Testable (dependencies injected, mocks possible)
- [ ] Error handling comprehensive
- [ ] Logging at appropriate levels
- [ ] Performance optimized (no N+1 queries, proper indexing)
- [ ] Caching strategy implemented where appropriate
- [ ] Database transactions used correctly
- [ ] Race conditions eliminated
- [ ] Idempotent operations where needed
- [ ] Follows established patterns in codebase
- [ ] No code duplication (DRY principle)

**Evidence Required:**
- Architecture diagram (if new pattern)
- Performance benchmarks
- Load test results (if applicable)

**RAG/CAG Validation (ACTUAL IMPLEMENTATION)**:

**RAG Queries (Execute These)**:
```bash
# Search for similar component architectures
curl -X POST "http://localhost:8080/rag/search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "service layer pattern dependency injection error handling",
    "filters": {"tenant_id": "$TENANT_ID", "file_type": ["ts", "js"], "category": "architecture"},
    "max_results": 15
  }'

# Retrieve database schema patterns
curl -X POST "http://localhost:8080/rag/search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "database migration schema foreign key constraints indexes",
    "filters": {"path": "*/migrations/*", "tenant_id": "$TENANT_ID"},
    "max_results": 10
  }'

# Find API endpoint conventions
grep -r "app\\.get\\|app\\.post\\|app\\.put\\|app\\.delete" --include="*.ts" --include="*.js" | head -30
```

**CAG Cache Checks**:
```bash
# Get cached architecture patterns
redis-cli GET "rag:architecture:patterns:${TENANT_ID}:${COMPONENT_TYPE}:${CONTENT_HASH}"

# Check for stale cache (must re-auth if permissions changed)
redis-cli HGET "cag:auth:${TENANT_ID}:${USER_ID}" "last_permission_change"
```

**Validation Steps**:
1. RAG search for similar service/controller implementations
2. Compare retrieved architectural patterns with current design
3. Verify database schema follows migration naming conventions
4. Ensure API routes match REST/resource conventions found in codebase
5. Validate cached patterns are not stale (check TTL < permission change time)

### 3. Is this the best user interface?
**Verification Checklist:**
- [ ] WCAG 2.1 AA compliant (minimum)
- [ ] All interactive elements keyboard accessible
- [ ] Focus indicators visible and clear
- [ ] Color contrast meets WCAG AA (4.5:1 for text, 3:1 for large text)
- [ ] ARIA labels on all icon-only buttons
- [ ] Proper heading hierarchy (h1 -> h2 -> h3, no skipping)
- [ ] Form validation errors accessible
- [ ] Loading states announced to screen readers
- [ ] Skip links present and functional
- [ ] Semantic HTML used
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Touch targets >= 44x44px
- [ ] No keyboard traps
- [ ] Focus management in modals/dialogs
- [ ] Consistent design language
- [ ] Intuitive navigation
- [ ] Fast load times (LCP < 2.5s, FID < 100ms, CLS < 0.1)

**Evidence Required:**
- axe DevTools scan (0 violations)
- Lighthouse accessibility score >= 95
- Manual keyboard navigation test passed
- Screen reader test passed (NVDA/JAWS)
- User testing feedback (if applicable)

**RAG/CAG Validation (ACTUAL IMPLEMENTATION)**:

**RAG Queries (Execute These)**:
```bash
# Search for UI component patterns
curl -X POST "http://localhost:8080/rag/search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "React component ARIA accessibility keyboard navigation focus management",
    "filters": {"tenant_id": "$TENANT_ID", "file_type": ["tsx", "jsx"], "category": "ui"},
    "max_results": 20
  }'

# Retrieve design system tokens and breakpoints
curl -X POST "http://localhost:8080/rag/search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "theme design tokens breakpoints responsive mobile tablet desktop",
    "filters": {"path": "**/styles/**", "tenant_id": "$TENANT_ID"},
    "max_results": 5
  }'

# Find existing ARIA implementations
grep -r "aria-label\|aria-describedby\|role=" --include="*.tsx" --include="*.jsx" | head -40
```

**CAG Cache Checks**:
```bash
# Cached design system patterns
redis-cli GET "rag:ui:design-system:${TENANT_ID}:${CONTENT_HASH}"

# Cached accessibility test results
redis-cli GET "cag:a11y:results:${TENANT_ID}:${COMPONENT_ID}"
```

**Validation Steps**:
1. RAG search for similar form/modal/button components
2. Compare ARIA patterns with retrieved implementations
3. Verify design tokens match cached design system values
4. Ensure keyboard nav matches patterns from similar components
5. Check cached a11y results are not stale (TTL verification)

### 4. Is it ready for a Fortune 50 company client?
**Verification Checklist:**
- [ ] Enterprise-grade error handling
- [ ] Comprehensive logging and monitoring
- [ ] Disaster recovery plan documented
- [ ] Multi-tenant support working correctly
- [ ] Row-level security (RLS) enforced in database
- [ ] Audit trail for all operations
- [ ] Data retention policy implemented
- [ ] GDPR/compliance features working
- [ ] SSO/SAML integration tested
- [ ] Role-based access control (RBAC) enforced
- [ ] API versioning strategy in place
- [ ] Documentation complete (API docs, user guides, admin guides)
- [ ] Deployment automation working
- [ ] Rollback procedures documented
- [ ] Health check endpoints functional
- [ ] Metrics and alerting configured
- [ ] Load balancing capable
- [ ] Database backups automated
- [ ] Secrets management using Azure Key Vault
- [ ] CI/CD pipeline with quality gates
- [ ] Zero-downtime deployment capable

**Evidence Required:**
- Deployment runbook
- Disaster recovery test results
- Load test results (1000+ concurrent users)
- Security compliance report
- API documentation

**RAG/CAG Validation (ACTUAL IMPLEMENTATION)**:

**RAG Queries (Execute These)**:
```bash
# Search for enterprise SSO/SAML implementations
curl -X POST "http://localhost:8080/rag/search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "SSO SAML OAuth Azure AD authentication enterprise multi-tenant",
    "filters": {"tenant_id": "$TENANT_ID", "category": "enterprise-auth"},
    "max_results": 10
  }'

# Retrieve RLS (Row-Level Security) patterns
curl -X POST "http://localhost:8080/rag/search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "row level security RLS tenant isolation database policy",
    "filters": {"path": "*/migrations/*", "content_type": "sql"},
    "max_results": 8
  }'

# Find audit logging patterns
grep -r "audit\\.log\\|auditLogger\\|trackEvent" --include="*.ts" --include="*.js" | head -30
```

**CAG Cache Checks**:
```bash
# Cached enterprise patterns (must have tenant isolation)
redis-cli GET "rag:enterprise:patterns:${TENANT_ID}:${CONTENT_HASH}"

# Verify no cross-tenant cache leakage
redis-cli KEYS "rag:enterprise:patterns:*" | grep -v "${TENANT_ID}" || echo "OK: No cache leakage"
```

**Validation Steps**:
1. RAG search for SSO/SAML integration patterns
2. Verify RLS policies match retrieved database patterns
3. Compare audit logging with established implementations
4. Ensure CI/CD configs retrieved from git match current setup
5. Validate cached enterprise patterns have tenant isolation (key includes tenant_id)

### 5. Is it the highest quality?
**Verification Checklist:**
- [ ] All tests passing (unit, integration, E2E)
- [ ] Code coverage >= 80%
- [ ] No linting errors
- [ ] No TypeScript errors
- [ ] No console.log in production code
- [ ] No TODO/FIXME comments (create tickets instead)
- [ ] Code reviewed by at least one other developer
- [ ] Performance benchmarks meet targets
- [ ] No memory leaks detected
- [ ] No blocking operations on main thread
- [ ] Proper error boundaries in React
- [ ] Loading states for all async operations
- [ ] Optimistic UI updates where appropriate
- [ ] Proper cleanup in useEffect hooks
- [ ] No prop drilling (use context/state management)
- [ ] Memoization used for expensive calculations
- [ ] Lazy loading for large components
- [ ] Code splitting implemented
- [ ] Images optimized (WebP, proper sizing)
- [ ] Bundle size within budget

**Evidence Required:**
- Test coverage report
- Lighthouse performance score >= 90
- Chrome DevTools performance profile
- Bundle size analysis

**RAG/CAG Validation:**
- [ ] Search for existing test patterns and test utilities in codebase
- [ ] Retrieve testing best practices from documentation
- [ ] Validate code style against ESLint/Prettier configurations
- [ ] Check performance optimization patterns in similar components
- [ ] Compare bundle configuration with existing webpack/vite setups
- [ ] Retrieve established memoization and lazy loading patterns
- [ ] Validate error boundary implementations against existing patterns

### 6. Is it the most accurate?
**Verification Checklist:**
- [ ] Business logic matches requirements exactly
- [ ] Calculations verified with test cases
- [ ] Edge cases handled (null, undefined, empty, negative, overflow)
- [ ] Timezone handling correct
- [ ] Currency formatting correct
- [ ] Date/time calculations accurate
- [ ] Floating point precision handled (using decimal libraries for money)
- [ ] Rounding behavior documented and correct
- [ ] Validation rules match business requirements
- [ ] Database constraints match validation rules
- [ ] API contracts match frontend expectations
- [ ] Error messages accurate and helpful
- [ ] Success messages accurate
- [ ] Notifications triggered at correct times
- [ ] Real-time updates reflect actual data
- [ ] Cache invalidation working correctly
- [ ] Optimistic updates rollback on failure
- [ ] Race conditions eliminated in concurrent operations
- [ ] Eventual consistency handled correctly

**Evidence Required:**
- Unit tests for all edge cases
- Integration tests verifying end-to-end accuracy
- Business stakeholder sign-off
- QA validation

**RAG/CAG Validation:**
- [ ] Retrieve business logic validation patterns from codebase
- [ ] Search for existing calculation implementations and verify consistency
- [ ] Validate data type handling against established patterns
- [ ] Check timezone/currency handling in similar features
- [ ] Retrieve validation rule patterns from API and database layers
- [ ] Compare error message formats with existing messages
- [ ] Validate cache invalidation strategies against existing implementations

### 7. Is it knowledge-base validated (RAG/CAG)?
**Verification Checklist:**
- [ ] Code patterns match existing codebase conventions (RAG verified)
- [ ] Implementation follows documented best practices (CAG verified)
- [ ] Similar features were searched and patterns reused
- [ ] No reinvention of existing solutions
- [ ] Naming conventions match codebase standards
- [ ] File structure follows project organization patterns
- [ ] Dependencies align with established tech stack
- [ ] Configuration follows existing patterns (.env, config files)
- [ ] API contracts consistent with existing endpoints
- [ ] Database migrations follow established naming/structure
- [ ] Commit messages follow conventional commits pattern
- [ ] PR/documentation follows project templates
- [ ] Code comments follow project documentation standards
- [ ] Import/export patterns match module organization
- [ ] Type definitions consistent with existing TypeScript patterns

**Evidence Required:**
- RAG search results showing similar implementations
- CAG context validation report
- Code similarity analysis
- Pattern consistency check results

**RAG/CAG Validation:**
- [ ] Execute RAG search for all major components/patterns being implemented
- [ ] Retrieve project-specific conventions from documentation
- [ ] Search git history for related changes and learn from them
- [ ] Query knowledge base for architectural decisions (ADRs)
- [ ] Validate against coding standards documents
- [ ] Check stack overflow/project wiki for established solutions
- [ ] Ensure MCP (Model Context Protocol) servers are queried for relevant context

---

## Quality Loop Process

When ANY code is completed:

1. **RAG/CAG Pre-Check**: Query knowledge base and codebase for similar implementations
2. **Self-Assessment**: Go through all 7 quality gates
3. **Evidence Collection**: Gather required evidence for each gate
4. **RAG Validation**: Search codebase for patterns and validate consistency
5. **CAG Validation**: Ensure proper context from documentation and best practices
6. **Verification**: Run automated checks (tests, linting, security scans)
7. **Fix Issues**: If ANY gate is NO, fix the issues
8. **Re-verify**: Run checks again with RAG/CAG validation
9. **Loop Until All YES**: Do not proceed until ALL 7 gates pass

## RAG/CAG Integration Requirements

All quality gates MUST use:

- **RAG (Retrieval-Augmented Generation)**: Search and retrieve relevant code patterns, documentation, and best practices from the codebase and knowledge base
- **CAG (Context-Augmented Generation)**: Ensure all decisions are made with full context of project standards, architectural decisions, and established patterns
- **MCP (Model Context Protocol)**: Query MCP servers for additional context and validation
- **Knowledge Base Queries**: Validate against project wiki, ADRs, Stack Overflow, and internal documentation

## Enforcement

This is NOT a suggestion. This is a REQUIREMENT for all code in this repository.

- No code merges until all 7 gates pass (including RAG/CAG validation)
- No deployment until all 7 gates pass
- RAG/CAG validation must be documented in PR descriptions
- No exceptions unless approved by project lead
- Quality is not negotiable

## Current Status

Last Updated: 2026-01-03
Quality Framework Version: 2.0 (with RAG/CAG integration)
All code MUST comply with this framework.
