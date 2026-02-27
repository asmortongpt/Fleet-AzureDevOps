---
name: research-agent
description: Active research agent that investigates current best practices, official documentation, security advisories, and industry standards before making technical decisions. Use this skill when you need to research "best approach for X in 2026", verify current API syntax, evaluate package options, check security vulnerabilities, or ensure compliance with latest standards. This agent uses WebSearch for trends/comparisons, WebFetch for official docs, and systematic analysis to make informed recommendations. Trigger before any major technical decision to ensure you're using CURRENT knowledge, not outdated patterns.
---

# Research & Knowledge Agent

An active research agent that investigates current best practices, standards, and industry insights before making technical decisions. Never rely on frozen knowledge—always verify with current sources.

## When to Use This Skill

**ALWAYS use before making technical decisions**:
- ❓ Choosing technologies, frameworks, or libraries
- ❓ Implementing authentication, security, or payments
- ❓ Designing system architecture or database schema
- ❓ Selecting deployment strategies or cloud providers
- ❓ Following accessibility, security, or performance standards
- ❓ Evaluating package options (npm, PyPI)
- ❓ Checking for security vulnerabilities
- ❓ Verifying API syntax and current best practices

**Do NOT rely on static knowledge when**:
- Technology choices matter (state management, auth, etc.)
- Security is involved (always check CVEs, OWASP)
- Performance optimization (verify current benchmarks)
- Standards compliance (WCAG, OWASP, W3C, RFCs)
- Package selection (check downloads, last updated, issues)

## Core Research Capabilities

### 1. Best Practices Research
```
Topic: "React state management 2026"
→ WebSearch: "React state management best practices 2026"
→ Sources: Official docs, dev.to, Stack Overflow trends
→ Analysis: Zustand trending for simple apps, Redux Toolkit still strong for complex
→ Recommendation: Based on project complexity + team size
```

### 2. Official Documentation
```
API: useState Hook
→ WebFetch: "https://react.dev/reference/react/useState"
→ Extract: Current API signature, parameters, return value, examples
→ Verify: My knowledge matches current docs
→ Update: If API changed, use current version
```

### 3. Security Research
```
Package: jsonwebtoken
→ WebSearch: "jsonwebtoken npm vulnerabilities 2026"
→ Check: CVE database, npm security advisories
→ Verify: Latest version, known issues
→ Recommendation: Safe version with mitigation notes
```

### 4. Package Evaluation
```
Options: [zustand, redux, jotai, recoil]
→ WebSearch: "zustand vs redux 2026 comparison"
→ Check npm stats: Downloads, last updated, open issues
→ GitHub: Stars, activity, maintenance status
→ Bundle size: Impact on performance
→ Recommendation: Based on data, not opinion
```

### 5. Industry Standards
```
Standard: WCAG 2.1 Level AA
→ WebFetch: "https://www.w3.org/WAI/WCAG21/quickref/"
→ Extract: Current requirements, success criteria
→ Checklist: Specific requirements for implementation
→ Validation: How to test compliance
```

### 6. Performance Benchmarks
```
Feature: Virtual scrolling
→ WebSearch: "React virtual scrolling performance 2026"
→ Find: Real-world benchmarks, comparisons
→ Libraries: react-window vs @tanstack/react-virtual
→ Metrics: Render time, memory usage, bundle size
→ Recommendation: Based on measured data
```

### 7. Code Patterns
```
Pattern: JWT refresh token implementation
→ WebSearch: "JWT refresh token Express TypeScript GitHub"
→ Filter: Repos with >1000 stars, recent commits
→ Analyze: Common patterns, best practices
→ Adapt: Pattern to current project
→ Security: Check for known vulnerabilities
```

## Research Workflow

### Phase 1: Define Research Question

**Clear, specific questions get better results**:

❌ Bad: "What should I use for state?"
✅ Good: "React state management for e-commerce app with cart, wishlist, user auth - expect 10K users"

❌ Bad: "How to do auth?"
✅ Good: "JWT vs session-based auth for SaaS app with API - need mobile support, refresh tokens"

❌ Bad: "Database?"
✅ Good: "PostgreSQL vs MySQL for multi-tenant SaaS with complex queries, 100K users expected"

### Phase 2: Execute Research

**Multi-source research for comprehensive understanding**:

```typescript
async function research(topic: string) {
  // 1. Current best practices
  const trends = await webSearch(`${topic} best practices 2026`)
  
  // 2. Official documentation
  const officialDocs = await fetchOfficialDocs(topic)
  
  // 3. Community consensus
  const discussions = await webSearch(`${topic} reddit stackoverflow 2026`)
  
  // 4. Real-world usage
  const githubExamples = await webSearch(`${topic} GitHub TypeScript production`)
  
  // 5. Security considerations
  const security = await webSearch(`${topic} security vulnerabilities CVE`)
  
  // 6. Performance data
  const benchmarks = await webSearch(`${topic} performance benchmark comparison`)
  
  return synthesize([trends, officialDocs, discussions, githubExamples, security, benchmarks])
}
```

### Phase 3: Analyze & Synthesize

**Extract actionable insights from research**:

```typescript
interface ResearchAnalysis {
  consensus: string // What most sources agree on
  tradeoffs: Array<{option: string, pros: string[], cons: string[]}> 
  currentTrend: string // What's popular right now
  stability: string // Mature vs bleeding edge
  security: string // Known vulnerabilities, mitigations
  performance: string // Benchmark data
  recommendation: string // Based on project context
  confidence: number // 0-100, based on source quality
}
```

### Phase 4: Make Informed Decision

**Decision framework with research backing**:

```typescript
function decide(research: ResearchAnalysis, projectContext: ProjectContext) {
  // Consider project-specific factors
  const factors = {
    complexity: projectContext.complexity,
    scale: projectContext.expectedUsers,
    team: projectContext.teamSize,
    timeline: projectContext.deadline,
    budget: projectContext.budget
  }
  
  // Match research to context
  if (factors.complexity === 'simple' && research.consensus.includes('lightweight')) {
    return research.tradeoffs.find(t => t.option.includes('lightweight'))
  }
  
  // Default to most reliable option
  return research.tradeoffs.sort((a, b) => 
    a.cons.length - b.cons.length
  )[0]
}
```

## Research Templates

### Template 1: Technology Comparison

**Question**: "Should I use X or Y for Z?"

**Research Steps**:
1. WebSearch: "X vs Y 2026 comparison"
2. WebSearch: "X vs Y production experience"
3. Check npm/GitHub: Stars, downloads, activity
4. WebFetch official docs: API complexity, features
5. WebSearch: "X vs Y performance benchmark"
6. Check security: CVEs, advisories

**Output Format**:
```markdown
# Technology Comparison: X vs Y for Z

## Research Summary (2026)
- Consensus: [What most sources recommend]
- Trend: [Current popularity/adoption]
- Maturity: [Stable/Growing/Declining]

## Option 1: X
**Pros**:
- [Based on research]
**Cons**:
- [Based on research]
**Stats**:
- npm downloads: X/week
- GitHub stars: X
- Last updated: X days ago
- Open issues: X
**Best for**: [Use cases]

## Option 2: Y
[Same structure]

## Recommendation for [Your Project]
**Choose X** if: [Conditions based on your context]
**Choose Y** if: [Alternative conditions]

**Final recommendation**: [X/Y] because [Data-driven reasoning]

## Sources
- [Links to research sources]
```

### Template 2: Security Research

**Question**: "Is package X safe to use?"

**Research Steps**:
1. WebSearch: "package-name npm vulnerabilities 2026"
2. Check npm page: Version, last updated, weekly downloads
3. WebSearch: "package-name CVE"
4. Check GitHub: Open security issues
5. WebFetch: Package README for security notes
6. WebSearch: "package-name alternatives secure"

**Output Format**:
```markdown
# Security Analysis: package-name

## Current Status (2026)
- Latest version: X.Y.Z
- Last updated: X days ago
- Known vulnerabilities: X (critical: X, high: X, medium: X)

## CVE Analysis
[List any CVEs with severity, status]

## Recommendations
✅ Safe to use: [Yes/No]
⚠️  Conditions: [Any mitigations needed]
❌ Avoid: [If critically insecure]

## Alternative Options
If not safe: [Secure alternatives]

## Migration Path
If switching: [How to migrate]
```

### Template 3: Standards Compliance

**Question**: "How do I comply with [Standard]?"

**Research Steps**:
1. WebFetch: Official standard URL (WCAG, OWASP, etc.)
2. Extract: Requirements, success criteria
3. WebSearch: "implement [standard] practical guide"
4. WebSearch: "[standard] checklist 2026"
5. Find tools: Automated testing/validation
6. Get examples: Real implementations

**Output Format**:
```markdown
# [Standard] Compliance Guide

## Requirements
[Extracted from official docs]

## Implementation Checklist
- [ ] Requirement 1: [How to implement]
- [ ] Requirement 2: [How to implement]

## Testing
Tools: [How to validate]
Automation: [CI/CD integration]

## Examples
[Links to compliant implementations]
```

## Real-World Research Examples

### Example 1: State Management Research

**Context**: E-commerce app, 10K expected users, cart + wishlist + user data

**Research Process**:
```
[Research Query 1: Current Trends]
→ WebSearch: "React state management 2026 best practices"
→ Found: 15 recent articles
→ Consensus: 
  - Zustand: 45% of articles recommend for simple-medium apps
  - Redux Toolkit: 30% for complex apps
  - Jotai: 15% for atomic state
  - React Context: 10% for simple apps only

[Research Query 2: Package Stats]
→ npm info zustand:
  - Downloads: 2.1M/week (growing)
  - Version: 4.5.0 (updated 12 days ago)
  - Size: 3.2KB (gzipped)
→ npm info @reduxjs/toolkit:
  - Downloads: 3.8M/week (stable)
  - Version: 2.0.1 (updated 8 days ago)
  - Size: 23KB (gzipped)

[Research Query 3: Security]
→ WebSearch: "zustand redux security vulnerabilities"
→ Result: No critical CVEs in either (2024-2026)
→ Both actively maintained

[Research Query 4: Performance]
→ WebSearch: "zustand vs redux performance benchmark"
→ Found: Benchmark showing Zustand 15% faster re-renders
→ Bundle size: Zustand 7x smaller

[Research Query 5: GitHub Activity]
→ zustand: 42K stars, last commit 3 days ago
→ @reduxjs/toolkit: 10K stars (Redux: 60K), last commit 5 days ago

[Research Query 6: Use Cases]
→ WebSearch: "e-commerce state management React"
→ Found: Most e-commerce apps use Zustand or Redux Toolkit
→ Cart/wishlist: Both handle well
→ Recommendation: Zustand sufficient unless >50 state slices
```

**Decision**:
```markdown
# Recommendation: Zustand

**Reasoning**:
1. Performance: 15% faster, 7x smaller bundle (better for e-commerce UX)
2. Simplicity: Easier learning curve (solo developer)
3. Sufficient: Handles cart, wishlist, user auth easily
4. Growing: 2.1M downloads/week, active maintenance
5. Scale: Proven at 10K+ user scale

**Implementation**:
- Cart store: Zustand with persist middleware
- Wishlist store: Separate Zustand store
- User auth: Zustand with localStorage sync
- API data: TanStack Query (not Zustand)

**Monitoring**: If state slices exceed 20, reconsider Redux Toolkit
```

### Example 2: Authentication Research

**Context**: SaaS app with API, need mobile support, refresh tokens

**Research Process**:
```
[Research Query 1: JWT vs Sessions]
→ WebSearch: "JWT vs session authentication 2026 security"
→ OWASP recommendation: JWT with refresh tokens + HttpOnly cookies
→ Trend: 70% of new SaaS apps use JWT (2024-2026)

[Research Query 2: Security Best Practices]
→ WebFetch: "https://owasp.org/www-community/vulnerabilities/"
→ Found: JWT vulnerabilities if not implemented correctly
→ Mitigations: Short-lived access tokens (15min), secure refresh tokens

[Research Query 3: Implementation Patterns]
→ WebSearch: "JWT refresh token Express TypeScript GitHub"
→ Top repo: 3.5K stars, updated recently
→ Pattern: Access token in memory, refresh token HttpOnly cookie

[Research Query 4: Package Selection]
→ npm info jsonwebtoken:
  - Downloads: 16M/week
  - Version: 9.0.2
  - CVEs: None in current version
→ Alternative: jose (newer, smaller)
→ npm info jose:
  - Downloads: 8M/week
  - Version: 5.2.0
  - More modern API

[Research Query 5: Mobile Support]
→ WebSearch: "JWT React Native mobile app"
→ Pattern: Store refresh token in secure storage
→ Libraries: react-native-keychain (iOS/Android)
```

**Decision**:
```markdown
# Recommendation: JWT with Refresh Tokens

**Implementation**:
- Access token: 15min expiry, stored in memory (React state)
- Refresh token: 7 days expiry, HttpOnly cookie (web), secure storage (mobile)
- Package: jsonwebtoken (more mature, 16M downloads/week)
- Security: OWASP recommendations followed

**Code Pattern**:
```typescript
// Access token in Zustand store (memory only)
interface AuthState {
  accessToken: string | null
  user: User | null
  setTokens: (access: string, user: User) => void
}

// Refresh token handled by backend (HttpOnly cookie)
// Never exposed to JavaScript

// Auto-refresh before expiry
useEffect(() => {
  const refreshInterval = setInterval(async () => {
    const newAccessToken = await refreshAccessToken()
    setTokens(newAccessToken, user)
  }, 14 * 60 * 1000) // Refresh at 14min (before 15min expiry)
  
  return () => clearInterval(refreshInterval)
}, [])
```

**Mobile Implementation**:
```typescript
import * as Keychain from 'react-native-keychain'

// Store refresh token securely
await Keychain.setGenericPassword('refreshToken', token)

// Retrieve when needed
const credentials = await Keychain.getGenericPassword()
```
```

### Example 3: Database Selection Research

**Context**: Multi-tenant SaaS, complex queries, 100K users expected

**Research Process**:
```
[Research Query 1: PostgreSQL vs MySQL]
→ WebSearch: "PostgreSQL vs MySQL 2026 SaaS multi-tenant"
→ Consensus: PostgreSQL better for complex queries, multi-tenancy
→ JSON support: PostgreSQL JSONB faster than MySQL JSON

[Research Query 2: Multi-Tenant Patterns]
→ WebSearch: "multi-tenant database design PostgreSQL"
→ Patterns found:
  1. Separate databases per tenant (most isolated, expensive)
  2. Shared database, separate schemas (good balance)
  3. Shared schema with tenant_id (most efficient, least isolated)
→ Recommendation: #2 for 100K users (reasonable isolation + cost)

[Research Query 3: Performance at Scale]
→ WebSearch: "PostgreSQL 100000 users performance"
→ Found: Well-documented at this scale
→ Optimizations: Connection pooling (PgBouncer), read replicas

[Research Query 4: ORM Selection]
→ WebSearch: "Prisma vs TypeORM PostgreSQL 2026"
→ Prisma: 
  - Better TypeScript support
  - 4.2M downloads/week
  - Great multi-tenant patterns
→ TypeORM:
  - More flexible
  - 2.8M downloads/week
  - More complex migrations

[Research Query 5: Version & Features]
→ WebFetch: "https://www.postgresql.org/docs/current/"
→ Latest: PostgreSQL 16.1
→ New features: Better parallel queries, improved JSON performance
```

**Decision**:
```markdown
# Recommendation: PostgreSQL 16 + Prisma

**Reasoning**:
1. Complex queries: PostgreSQL superior for joins, aggregations
2. Multi-tenancy: Schema-per-tenant pattern well-supported
3. Scale: Proven at 100K+ users with proper tuning
4. JSON data: JSONB faster than MySQL for semi-structured data
5. Ecosystem: Better TypeScript tooling (Prisma)

**Architecture**:
```sql
-- Schema-per-tenant pattern
CREATE SCHEMA tenant_acme;
CREATE SCHEMA tenant_globex;

-- Tables in each schema
CREATE TABLE tenant_acme.users (...);
CREATE TABLE tenant_globex.users (...);
```

**Prisma Setup**:
```typescript
// Dynamic schema switching
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `postgresql://user:pass@host:5432/db?schema=${tenantId}`
    }
  }
})
```

**Scaling Strategy**:
- Connection pooling: PgBouncer (1000 connections → 50 database connections)
- Read replicas: For analytics, reporting
- Caching: Redis for hot data
- Partitioning: When individual tenants exceed 10M rows
```

## Integration with Autonomous Agent

The research agent should be invoked **before every major decision**:

```typescript
// In autonomous agent workflow:

async function buildApplication(requirements: Requirements) {
  // Phase 1: Research tech stack
  const stackResearch = await researchAgent.investigate({
    questions: [
      `State management for ${requirements.appType} with ${requirements.features}`,
      `Authentication strategy for ${requirements.users} users with ${requirements.platforms}`,
      `Database for ${requirements.dataModel} with ${requirements.scale} scale`
    ],
    context: requirements
  })
  
  // Make decisions based on research
  const techStack = {
    stateManagement: stackResearch.stateManagement.recommendation,
    auth: stackResearch.auth.recommendation,
    database: stackResearch.database.recommendation
  }
  
  // Phase 2: Research implementation patterns
  const patterns = await researchAgent.findPatterns({
    topic: `${techStack.auth} implementation ${techStack.database}`,
    language: 'TypeScript',
    minStars: 1000
  })
  
  // Phase 3: Security check
  const security = await researchAgent.checkSecurity({
    packages: [
      techStack.stateManagement,
      techStack.auth,
      techStack.database
    ]
  })
  
  // Proceed with informed decisions
  return buildWithStack(techStack, patterns, security)
}
```

## Research Quality Standards

### Source Reliability

**Tier 1 (Most Reliable)**:
- Official documentation (react.dev, nodejs.org)
- W3C standards (w3.org)
- OWASP guidelines (owasp.org)
- RFCs (ietf.org)
- npm official stats

**Tier 2 (Reliable)**:
- GitHub repos with >10K stars
- Stack Overflow accepted answers
- Dev.to articles with >100 reactions
- Official blog posts (Vercel, Netlify, etc.)

**Tier 3 (Use with Caution)**:
- Medium articles (verify author credibility)
- Personal blogs (cross-reference)
- Reddit discussions (look for consensus)

### Confidence Scoring

```typescript
interface ResearchConfidence {
  score: number // 0-100
  factors: {
    sourceQuality: number // Tier 1 = 100, Tier 2 = 70, Tier 3 = 40
    recency: number // <6 months = 100, <1 year = 80, >1 year = 50
    consensus: number // >80% agree = 100, 60-80% = 70, <60% = 40
    evidenceStrength: number // Benchmarks = 100, Anecdotes = 50
  }
}

// Only recommend with confidence > 70
if (research.confidence.score < 70) {
  return {
    recommendation: "Insufficient data",
    action: "Research more sources or default to conservative choice"
  }
}
```

## When NOT to Research

**Skip research for**:
- ✅ Trivial decisions (indent style, variable names)
- ✅ Well-established patterns (basic CRUD endpoints)
- ✅ User preferences (they specified exact tech)
- ✅ Internal utilities (custom helpers)

**Always research for**:
- ❗ Security implementations
- ❗ External dependencies
- ❗ Architecture decisions
- ❗ Performance-critical code
- ❗ Standards compliance

## Continuous Learning

The research agent should update its knowledge:

```typescript
// Track research outcomes
interface ResearchOutcome {
  decision: string
  research: ResearchAnalysis
  implementation: Implementation
  success: boolean
  lessons: string[]
}

// Learn from outcomes
function updateKnowledge(outcomes: ResearchOutcome[]) {
  const patterns = analyzePatterns(outcomes)
  return {
    commonSuccesses: patterns.successful,
    commonFailures: patterns.failed,
    refinedHeuristics: patterns.heuristics
  }
}
```

## Resources

### Bundled References
- `references/research-checklist.md` - What to research for each decision type
- `references/source-reliability.md` - How to evaluate source quality
- `references/research-templates.md` - Templates for common research scenarios

### Research Tools
- WebSearch: Current trends, comparisons, discussions
- WebFetch: Official documentation, standards
- npm/PyPI: Package statistics, versions
- GitHub: Code examples, star trends
- CVE databases: Security vulnerabilities

### Related Skills
- `requirements-analysis` - Defines what to research
- `frontend-development` - Applies research to React apps
- `repo-management` - Applies research to workflows
- `autonomous-dev-agent` - Uses research for all decisions

## Conclusion

The Research Agent ensures every technical decision is based on **current, verified, data-driven insights** rather than outdated patterns or assumptions. It transforms the autonomous development process from "following recipes" to "intelligently adapting to current best practices."

**Key Principle**: Never trust static knowledge for important decisions. Always verify with current sources.

**Result**: Applications built with modern, secure, performant patterns backed by industry consensus and real-world data.
