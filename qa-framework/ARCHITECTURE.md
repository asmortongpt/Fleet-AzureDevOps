# QA Framework - Enterprise Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Fleet QA Framework - Layer Architecture              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Layer 1: API Gateway & Load Balancer             │   │
│  │  - Rate Limiting (1000 req/min per tenant)                          │   │
│  │  - Authentication (JWT + API Keys)                                  │   │
│  │  - Request Routing (Quality Gates, RAG, CAG, MCP)                  │   │
│  │  - SSL/TLS Termination                                              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                  │                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Layer 2: Orchestration Services                  │   │
│  │  ┌───────────────┐  ┌───────────────┐  ┌────────────────┐         │   │
│  │  │ Master        │  │ Gate Runner   │  │ Remediation    │         │   │
│  │  │ Orchestrator  │→ │ Parallel Exec │→ │ Loop Manager   │         │   │
│  │  └───────────────┘  └───────────────┘  └────────────────┘         │   │
│  │                                                                     │   │
│  │  ┌───────────────┐  ┌───────────────┐  ┌────────────────┐         │   │
│  │  │ Stability     │  │ Evidence      │  │ Notification   │         │   │
│  │  │ Tracker       │  │ Collector     │  │ Service        │         │   │
│  │  └───────────────┘  └───────────────┘  └────────────────┘         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                  │                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Layer 3: AI Processing Engine                    │   │
│  │  ┌───────────────────────────────────────────────────────────────┐  │   │
│  │  │ RAG System (Retrieval-Augmented Generation)                   │  │   │
│  │  │  • Code Indexer (chunk, embed, store)                         │  │   │
│  │  │  • Vector Search (PostgreSQL pgvector + full-text)            │  │   │
│  │  │  • Context Builder (file-aware, symbol-aware)                 │  │   │
│  │  │  • Cache Layer (Redis)                                        │  │   │
│  │  └───────────────────────────────────────────────────────────────┘  │   │
│  │                                  │                                   │   │
│  │  ┌───────────────────────────────────────────────────────────────┐  │   │
│  │  │ CAG System (Context-Augmented Generation)                     │  │   │
│  │  │  • Multi-Model Support (Claude, GPT-4, Grok)                  │  │   │
│  │  │  • Prompt Engineering (templates, validation)                 │  │   │
│  │  │  • Confidence Scoring (ML-based)                              │  │   │
│  │  │  • Fix Validation (AST analysis)                              │  │   │
│  │  └───────────────────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                  │                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Layer 4: Quality Gates (10 Gates)                │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐  │   │
│  │  │ Console     │  │ Evidence    │  │ Evidence    │  │ UI E2E    │  │   │
│  │  │ Errors      │  │ Integrity   │  │ Authenticity│  │ Testing   │  │   │
│  │  │ (AST Scan)  │  │ (SHA-256)   │  │ (Ed25519)   │  │(Playwright)│  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └───────────┘  │   │
│  │                                                                     │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐  │   │
│  │  │ API         │  │ Accessibility│  │ Performance │  │ Security  │  │   │
│  │  │ Contract    │  │ (WCAG 2.1)  │  │ Testing     │  │ Scan      │  │   │
│  │  │ (Zod)       │  │ (axe-core)  │  │ (Lighthouse)│  │ (OWASP)   │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └───────────┘  │   │
│  │                                                                     │   │
│  │  ┌─────────────┐  ┌─────────────┐                                  │   │
│  │  │ Code        │  │ Test        │                                  │   │
│  │  │ Coverage    │  │ Stability   │                                  │   │
│  │  │ (Istanbul)  │  │ (3-run)     │                                  │   │
│  │  └─────────────┘  └─────────────┘                                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                  │                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Layer 5: MCP Services                            │   │
│  │  ┌───────────────┐  ┌───────────────┐  ┌────────────────┐         │   │
│  │  │ Fleet         │  │ Asset         │  │ Compliance     │         │   │
│  │  │ Telemetry     │  │ Lifecycle     │  │ Validator      │         │   │
│  │  │ (J1939/OBD2)  │  │ (TCO/Depr)    │  │ (FMCSA/DOT)   │         │   │
│  │  └───────────────┘  └───────────────┘  └────────────────┘         │   │
│  │                                                                     │   │
│  │  ┌───────────────┐  ┌───────────────┐  ┌────────────────┐         │   │
│  │  │ Maintenance   │  │ Driver        │  │ Environment    │         │   │
│  │  │ Scheduler     │  │ Safety        │  │ Monitor        │         │   │
│  │  │ (PM A/B/C)    │  │ (CSA Score)   │  │ (Metrics)      │         │   │
│  │  └───────────────┘  └───────────────┘  └────────────────┘         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                  │                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Layer 6: Data & Storage                          │   │
│  │  ┌───────────────────────────────────────────────────────────────┐  │   │
│  │  │ PostgreSQL 16 (Primary Database)                              │  │   │
│  │  │  • qa_runs, gate_results, evidence_artifacts                  │  │   │
│  │  │  • code_embeddings (RAG storage)                              │  │   │
│  │  │  • remediation_runs, fix_patterns                             │  │   │
│  │  │  • stability_tracker, ai_action_log                           │  │   │
│  │  │  • pgvector extension (semantic search)                       │  │   │
│  │  │  • Full-text search (tsvector)                                │  │   │
│  │  └───────────────────────────────────────────────────────────────┘  │   │
│  │                                  │                                   │   │
│  │  ┌───────────────────────────────────────────────────────────────┐  │   │
│  │  │ Redis 7.2 (Cache & Message Queue)                            │  │   │
│  │  │  • Gate results cache (TTL: 1h)                               │  │   │
│  │  │  • RAG query cache (TTL: 24h)                                 │  │   │
│  │  │  • Rate limiting counters                                     │  │   │
│  │  │  • Job queue (Bull MQ)                                        │  │   │
│  │  └───────────────────────────────────────────────────────────────┘  │   │
│  │                                  │                                   │   │
│  │  ┌───────────────────────────────────────────────────────────────┐  │   │
│  │  │ Evidence Vault (Encrypted Filesystem)                         │  │   │
│  │  │  • Test artifacts (JSON, screenshots, logs)                   │  │   │
│  │  │  • Cryptographic signatures (Ed25519)                         │  │   │
│  │  │  • Audit trail (immutable)                                    │  │   │
│  │  │  • Backup to Azure Blob Storage (hourly)                      │  │   │
│  │  └───────────────────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                  │                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Layer 7: Monitoring & Observability              │   │
│  │  ┌───────────────┐  ┌───────────────┐  ┌────────────────┐         │   │
│  │  │ Metrics       │  │ Logs          │  │ Traces         │         │   │
│  │  │ (Prometheus)  │  │ (ELK Stack)   │  │ (Jaeger)       │         │   │
│  │  └───────────────┘  └───────────────┘  └────────────────┘         │   │
│  │                                                                     │   │
│  │  ┌───────────────┐  ┌───────────────┐  ┌────────────────┐         │   │
│  │  │ Alerting      │  │ Dashboards    │  │ Health Checks  │         │   │
│  │  │ (Slack/PD)    │  │ (Grafana)     │  │ (/health)      │         │   │
│  │  └───────────────┘  └───────────────┘  └────────────────┘         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Key Design Principles

### 1. Scalability
- **Horizontal Scaling**: All services containerized and stateless
- **Load Balancing**: Nginx with round-robin and least-connections
- **Caching**: Multi-tier (Redis + CDN)
- **Database**: Read replicas for query scaling

### 2. Reliability
- **High Availability**: 99.9% uptime SLA
- **Fault Tolerance**: Automatic failover and retry mechanisms
- **Data Durability**: Multi-region backups (RPO: 1 hour, RTO: 15 min)
- **Circuit Breakers**: Prevent cascade failures

### 3. Security
- **Zero Trust**: All internal communication authenticated
- **Encryption**: At-rest (AES-256) and in-transit (TLS 1.3)
- **Secrets Management**: Azure Key Vault integration
- **Audit Logging**: Immutable audit trail with cryptographic proof

### 4. Performance
- **Sub-second Response**: 95th percentile < 1s
- **Throughput**: 10,000 gate executions/hour
- **RAG Query**: < 100ms (cached), < 500ms (uncached)
- **CAG Generation**: < 5s per fix

### 5. Observability
- **Metrics**: Real-time performance monitoring
- **Logs**: Structured JSON logging with correlation IDs
- **Traces**: Distributed tracing across all services
- **Alerts**: Proactive notification on anomalies

## Technology Stack

### Core Platform
- **Runtime**: Node.js 20 LTS (TypeScript 5.3)
- **Framework**: Express.js (API), Playwright (Testing)
- **Build**: ESBuild (compilation), TSX (execution)

### Databases
- **Primary**: PostgreSQL 16 with pgvector
- **Cache**: Redis 7.2 with persistence
- **Vector**: PostgreSQL pgvector (hybrid with full-text)

### AI/ML
- **LLM**: Anthropic Claude 3.5 Sonnet (primary)
- **Fallback**: OpenAI GPT-4 Turbo, Grok
- **Embeddings**: OpenAI text-embedding-3-small
- **Inference**: Local caching to reduce API costs

### Infrastructure
- **Containers**: Docker 24+, Docker Compose
- **Orchestration**: Kubernetes (optional production)
- **CI/CD**: GitHub Actions
- **Cloud**: Azure (VM, Blob Storage, Key Vault)

### Monitoring
- **Metrics**: Prometheus + Grafana
- **Logs**: Elasticsearch + Logstash + Kibana (ELK)
- **Tracing**: Jaeger (OpenTelemetry)
- **Alerting**: Slack, PagerDuty

## Component Details

### RAG System Architecture

```typescript
interface RAGPipeline {
  // Stage 1: Indexing
  indexer: CodeIndexer
  chunker: SemanticChunker     // Smart chunking (functions, classes)
  embedder: EmbeddingGenerator  // OpenAI embeddings
  storage: VectorStore          // pgvector + metadata

  // Stage 2: Retrieval
  searcher: HybridSearch        // Vector + full-text + keyword
  reranker: ScoreReranker       // LLM-based reranking
  contextBuilder: ContextBuilder // Build prompt context

  // Stage 3: Caching
  cache: RAGCache               // Redis-backed intelligent cache
  invalidation: CacheInvalidator // Git-aware invalidation
}
```

**Indexing Strategy**:
- **Semantic Chunking**: Split on function/class boundaries
- **Overlap**: 10-line overlap between chunks for context
- **Metadata**: File path, symbols, imports, dependencies
- **Embeddings**: 1536-dimensional vectors (OpenAI)
- **Storage**: PostgreSQL with pgvector extension

**Retrieval Strategy**:
- **Hybrid Search**: Combine vector similarity + full-text + keyword
- **Reranking**: Use Claude to rerank top 20 results to top 5
- **Context Window**: Max 8K tokens (GPT-4) / 100K tokens (Claude)
- **Caching**: Cache query results for 24 hours

### CAG System Architecture

```typescript
interface CAGPipeline {
  // Stage 1: Analysis
  violationDetector: ViolationAnalyzer
  contextRetriever: RAGRetriever
  impactAnalyzer: ImpactAnalyzer

  // Stage 2: Generation
  promptBuilder: PromptTemplate
  llmOrchestrator: MultiModelOrchestrator
  responseParser: StructuredParser

  // Stage 3: Validation
  syntaxValidator: ASTValidator
  testRunner: UnitTestRunner
  confidenceScorer: MLScorer

  // Stage 4: Application
  diffGenerator: UnifiedDiffCreator
  safeApplier: AtomicApplier
  rollbackManager: RollbackHandler
}
```

**Fix Generation Strategy**:
- **Multi-Shot Prompting**: Provide 3-5 examples of similar fixes
- **Chain-of-Thought**: Ask LLM to explain reasoning
- **Self-Consistency**: Generate 3 fixes, pick most common
- **Verification**: Run AST parsing and basic tests

### Quality Gates Architecture

Each gate follows this pattern:

```typescript
interface QualityGate {
  name: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  timeout: number  // milliseconds

  // Execution
  async execute(context: GateContext): Promise<GateResult>
  async validate(result: GateResult): Promise<boolean>

  // Evidence
  async collectEvidence(): Promise<Evidence>
  async signEvidence(evidence: Evidence): Promise<Signature>

  // Scoring
  calculateScore(result: GateResult): number  // 0-10
  getMaxScore(): number
}
```

**Parallel Execution**:
- Gates run in parallel within priority groups
- Critical gates block on failure
- Evidence collected asynchronously
- Results aggregated and scored

## Data Flow

### Quality Gate Execution Flow

```
1. User triggers gate run (manual or CI/CD)
   ↓
2. Master Orchestrator creates qa_run record
   ↓
3. Orchestrator spawns gate runners in parallel
   ↓
4. Each gate:
   a. Executes checks
   b. Collects evidence (artifacts, logs, screenshots)
   c. Calculates score (0-10)
   d. Stores results in gate_results table
   ↓
5. Evidence Collector gathers all artifacts
   ↓
6. Cryptographic Service:
   a. Generates SHA-256 hashes
   b. Creates Ed25519 signatures
   c. Stores in evidence_signatures table
   ↓
7. Orchestrator calculates final score (0-100)
   ↓
8. Report Generator creates JSON + Markdown reports
   ↓
9. Notification Service sends alerts (Slack, email)
   ↓
10. (Optional) Remediation Loop triggered if score < threshold
```

### AI Remediation Flow

```
1. Remediation Loop retrieves failing gates
   ↓
2. For each violation:
   a. RAG System retrieves relevant code context
   b. CAG System generates fix using Claude + context
   c. Fix Validator checks syntax and confidence
   ↓
3. If confidence > 80%:
   a. Apply fix atomically
   b. Log to remediation_runs table
   c. Update fix_patterns for learning
   ↓
4. Re-run affected gates
   ↓
5. Stability Tracker increments run count
   ↓
6. If 3 consecutive passes with score ≥ 95%:
   a. Mark for auto-merge
   b. Send approval notification
   ↓
7. Iterate until max iterations (5) or all gates pass
```

## Security Architecture

### Authentication & Authorization

```typescript
interface SecurityLayer {
  authentication: {
    jwt: JWTValidator          // Short-lived tokens (15 min)
    apiKey: APIKeyValidator    // Long-lived (rotated monthly)
    mfa: MFAValidator          // TOTP-based
  }

  authorization: {
    rbac: RoleBasedAccess      // Admin, Developer, Viewer
    abac: AttributeBasedAccess // Tenant-based isolation
    rateLimit: RateLimiter     // Per-tenant limits
  }

  encryption: {
    atRest: AES256Encryption   // Database + evidence vault
    inTransit: TLS13           // All network communication
    secrets: AzureKeyVault     // API keys, credentials
  }

  audit: {
    logger: AuditLogger        // Immutable audit trail
    signer: CryptoSigner       // Ed25519 signatures
    retention: RetentionPolicy // 7 years
  }
}
```

### Network Security

- **Firewall**: Allow only necessary ports (443, 5433, 6380)
- **VPN**: Require VPN for database/Redis access
- **WAF**: Web Application Firewall (Azure WAF)
- **DDoS Protection**: Azure DDoS Protection Standard

## Performance Optimization

### Caching Strategy

```
Level 1: Application Cache (in-memory, LRU)
  - Gate results: 5 minutes
  - RAG queries: 1 hour

Level 2: Redis Cache
  - Gate results: 1 hour
  - RAG queries: 24 hours
  - AI API responses: 7 days

Level 3: Database Query Cache
  - PostgreSQL shared_buffers: 2GB
  - Prepared statements

Level 4: CDN Cache (if applicable)
  - Static assets: 30 days
  - API responses: 5 minutes
```

### Database Optimization

- **Indexes**: Covering indexes for all common queries
- **Partitioning**: Time-based partitioning for qa_runs (monthly)
- **Connection Pooling**: Max 100 connections, min 10
- **Query Optimization**: EXPLAIN ANALYZE for all slow queries
- **Vacuum**: Automatic vacuuming every 6 hours

### Code Optimization

- **Parallel Processing**: Worker threads for CPU-bound tasks
- **Streaming**: Stream large files instead of loading in memory
- **Lazy Loading**: Load gates and modules on-demand
- **Tree Shaking**: Remove unused code with ESBuild
- **Minification**: Minify production builds

## Disaster Recovery

### Backup Strategy

```
Frequency:
  - Database: Every 6 hours (Azure Blob Storage)
  - Evidence Vault: Hourly (geo-redundant)
  - Configuration: On every change (Git)

Retention:
  - Daily backups: 30 days
  - Weekly backups: 12 weeks
  - Monthly backups: 12 months
  - Yearly backups: 7 years

Testing:
  - Restore test: Monthly
  - Failover drill: Quarterly
```

### High Availability

- **Active-Passive**: Primary VM + standby replica
- **Health Checks**: Every 30 seconds
- **Automatic Failover**: < 60 seconds
- **Data Sync**: Real-time replication (streaming replication)

## Monitoring & Alerting

### Key Metrics

```yaml
System Health:
  - CPU usage > 80% for 5 min → Warning
  - Memory usage > 90% → Critical
  - Disk usage > 85% → Warning
  - Network errors > 1% → Warning

Application Performance:
  - API response time p95 > 2s → Warning
  - API response time p99 > 5s → Critical
  - Error rate > 1% → Critical
  - Queue depth > 1000 → Warning

Database:
  - Connection pool exhaustion → Critical
  - Query time p95 > 1s → Warning
  - Deadlocks > 0 → Warning
  - Replication lag > 10s → Critical

AI Services:
  - Claude API latency > 10s → Warning
  - API error rate > 5% → Critical
  - Cost > $100/day → Warning

Quality Gates:
  - Gate failure rate > 10% → Warning
  - Score drop > 20 points → Critical
  - Remediation loop stuck → Critical
```

### Alert Routing

```
Critical → PagerDuty + Slack #ops + Email
Warning → Slack #ops
Info → Email digest (daily)
```

## Cost Optimization

### AI API Cost Management

```typescript
interface CostOptimization {
  caching: {
    cacheHitRate: '> 70%',      // Target hit rate
    ttl: '24 hours',             // Query result TTL
    strategy: 'Intelligent invalidation'
  }

  modelSelection: {
    simple: 'Claude Haiku',      // $0.25/MTok (console fixes)
    medium: 'Claude Sonnet',     // $3/MTok (complex fixes)
    complex: 'Claude Opus',      // $15/MTok (architecture)
  }

  batchProcessing: {
    batchSize: 10,                // Process 10 fixes together
    dedupe: true,                 // Remove duplicate requests
    compression: 'gzip',          // Compress prompts
  }

  budgets: {
    daily: '$50',                 // Alert at $45
    monthly: '$1000',             // Hard limit
    perTenant: '$100/month'       // Tenant-specific limits
  }
}
```

**Expected Monthly Costs** (100K lines of code):
- Indexing (one-time): $5
- Daily gate runs (30): $20
- Remediation (10 runs): $100
- Monitoring: $50
- **Total**: ~$175/month

## Scaling Strategy

### Vertical Scaling (Current)
- VM: 4 vCPU, 16GB RAM
- Database: 2 vCPU, 8GB RAM
- Redis: 1GB RAM

### Horizontal Scaling (Future)
```
Phase 1 (100-1000 users):
  - Add read replicas for PostgreSQL
  - Redis cluster (3 nodes)
  - Load balancer (Nginx)

Phase 2 (1000-10000 users):
  - Kubernetes cluster (3-10 nodes)
  - Managed PostgreSQL (Azure Database)
  - Managed Redis (Azure Cache)
  - CDN for static assets

Phase 3 (10000+ users):
  - Multi-region deployment
  - Global load balancing
  - Cassandra for time-series data
  - Elasticsearch for log aggregation
```

## Compliance & Governance

### Regulatory Compliance
- **SOC 2 Type II**: Security, availability, confidentiality
- **GDPR**: Data privacy and right to deletion
- **ISO 27001**: Information security management
- **HIPAA**: (if handling health data)

### Data Retention
- **Audit Logs**: 7 years (regulatory requirement)
- **Evidence**: 1 year (configurable)
- **AI Interactions**: 90 days
- **Personal Data**: Deleted on request

### Privacy
- **Data Minimization**: Collect only necessary data
- **Anonymization**: PII removed from logs
- **Encryption**: All data encrypted at rest
- **Access Control**: Role-based access only

---

**Version**: 2.0.0
**Last Updated**: 2026-01-04
**Maintainer**: Fleet DevOps Team
**License**: Proprietary

