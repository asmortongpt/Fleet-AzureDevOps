# Requirements Document Templates

## Standard Requirements Specification

```markdown
# [Project Name] - Requirements Specification

## 1. Executive Summary
**Project Goal**: [One sentence - why this exists]
**Target Users**: [Who will use this]
**Success Criteria**: [How we measure success]

## 2. Stakeholders
| Role | Name | Responsibilities |
|------|------|------------------|
| Product Owner | | Defines business requirements |
| Technical Lead | | Ensures technical feasibility |
| End Users | | Validates usability |

## 3. Functional Requirements

### 3.1 Core Features (Must Have - MVP)
1. **[Feature 1]**: [Description, user value]
2. **[Feature 2]**: [Description, user value]

### 3.2 Phase 2 Features (Should Have)
1. **[Feature 3]**: [Description]

### 3.3 Future Enhancements (Could Have)
1. **[Feature 4]**: [Description]

## 4. Non-Functional Requirements

### 4.1 Performance
- Page load: < 3s on 4G
- API response: < 500ms (95th percentile)
- Concurrent users: 1000+

### 4.2 Security
- Authentication: JWT with refresh tokens
- Authorization: Role-based access control (RBAC)
- Encryption: TLS 1.3 (transit), AES-256 (rest)

### 4.3 Reliability
- Uptime: 99.9%
- Backups: Daily, 30-day retention
- Error handling: Graceful degradation

### 4.4 Usability
- Mobile responsive (iOS Safari, Chrome Android)
- Accessibility: WCAG 2.1 Level AA
- Browser support: Latest 2 versions

## 5. Technical Constraints
- Stack: [Languages, frameworks]
- Deployment: [Cloud provider]
- Budget: [Cost limits]
- Timeline: [Key milestones]
- Integrations: [Existing systems]

## 6. User Stories Backlog
[See detailed stories section]

## 7. Assumptions
- Users have internet and modern browsers
- Third-party services available (Stripe, SendGrid)
- Data import possible from supplier APIs

## 8. Constraints
- MVP launch: 3 months
- Budget: $50K development
- Compliance: PCI-DSS for payments

## 9. Risks & Mitigation
| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| API downtime | High | Medium | Cache locally, retry logic |
| Payment failures | High | Low | Webhooks, idempotency |

## 10. Open Questions
1. International shipping? (Decide: [Date])
2. Multi-language support? (Decide: [Date])
3. Returns policy? (Decide: [Date])

## 11. Glossary
**SKU**: Stock Keeping Unit
**API**: Application Programming Interface
[Domain-specific terms...]
```

## User Story Template

```markdown
## Story: [Short Title]

**ID**: US-001
**Epic**: [Parent Epic]

**User Story**:
As a [role]
I want to [action]
So that [value]

**Acceptance Criteria**:
1. Given [precondition]
   When [action]
   Then [result]

2. Given [another context]
   When [action]
   Then [result]

**Priority**: Must Have / Should Have / Could Have

**Estimate**: [Story points / T-shirt size]

**Dependencies**: [Other stories]

**Technical Notes**:
- [Implementation considerations]
- [Security requirements]
- [Performance requirements]

**UI/UX Notes**:
- [Mockup references]
- [Design patterns]
- [Accessibility]

**Test Scenarios**:
- Happy path: [Normal flow]
- Edge cases: [Boundaries]
- Error cases: [Failures]
```

## Technical Specifications Template

```markdown
# Technical Specification: [Feature Name]

## Overview
[2-3 sentences describing what this builds]

## Architecture

### Components
1. **Frontend**: [Technology, responsibilities]
2. **Backend**: [Technology, responsibilities]
3. **Database**: [Technology, schema notes]
4. **External Services**: [APIs, integrations]

### Data Flow
```
User → Frontend → API Gateway → Backend Service → Database
                              ↓
                       External API (e.g., Stripe)
```

## API Endpoints

### POST /api/v1/orders
**Purpose**: Create new order
**Auth**: Required (JWT)
**Request**:
```json
{
  "customer_id": "uuid",
  "items": [
    {"product_id": "uuid", "quantity": 2}
  ]
}
```
**Response**:
```json
{
  "order_id": "uuid",
  "status": "pending",
  "total": 150.00
}
```

## Database Schema

### orders table
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY |
| customer_id | UUID | FK users(id) |
| status | ENUM | NOT NULL |
| total | DECIMAL(10,2) | NOT NULL |
| created_at | TIMESTAMP | DEFAULT NOW() |

**Indexes**: 
- `idx_orders_customer` on customer_id
- `idx_orders_status` on status

## Security Considerations
- Input validation: Zod schemas
- SQL injection: Parameterized queries (Prisma)
- XSS: React auto-escaping
- CSRF: SameSite cookies + tokens
- Rate limiting: 100 req/15min per IP

## Performance Targets
- Order creation: < 300ms
- List orders: < 200ms (with pagination)
- Database queries: < 50ms

## Error Handling
| Error | HTTP Code | User Message |
|-------|-----------|--------------|
| Invalid input | 400 | "Please check your input" |
| Unauthorized | 401 | "Please log in" |
| Payment failed | 402 | "Payment declined" |
| Server error | 500 | "Something went wrong" |

## Testing Strategy
- Unit tests: Service methods (80% coverage)
- Integration tests: API endpoints
- E2E tests: Complete order flow
- Load tests: 1000 concurrent orders

## Deployment Plan
1. Deploy to staging
2. Run smoke tests
3. Deploy to production (rolling update)
4. Monitor error rates (< 0.1%)
5. Rollback if errors spike

## Rollback Plan
If errors exceed 1%:
1. Stop deployment
2. Revert to previous version
3. Investigate root cause
4. Fix and redeploy

## Monitoring
- Error tracking: Sentry
- Performance: Prometheus + Grafana
- Logs: CloudWatch
- Alerts: PagerDuty (errors > 1%)
```

## Non-Functional Requirements Checklist

### Performance
- [ ] Page load time specified (e.g., < 3s)
- [ ] API response time specified (e.g., < 500ms)
- [ ] Concurrent user capacity (e.g., 1000+)
- [ ] Database query optimization strategy
- [ ] Caching strategy defined

### Security
- [ ] Authentication method (JWT, OAuth, etc.)
- [ ] Authorization model (RBAC, ABAC)
- [ ] Data encryption (transit and rest)
- [ ] Input validation strategy
- [ ] Rate limiting defined
- [ ] Security audit planned

### Reliability
- [ ] Uptime target (e.g., 99.9%)
- [ ] Backup strategy (frequency, retention)
- [ ] Disaster recovery plan
- [ ] Error handling approach
- [ ] Monitoring and alerting setup

### Usability
- [ ] Mobile responsive requirements
- [ ] Accessibility standards (WCAG 2.1)
- [ ] Browser support matrix
- [ ] Internationalization needs
- [ ] User testing plan

### Scalability
- [ ] Expected growth trajectory
- [ ] Horizontal vs. vertical scaling plan
- [ ] Database scaling strategy
- [ ] CDN for static assets
- [ ] Load balancing approach

### Compliance
- [ ] GDPR compliance (if EU users)
- [ ] PCI-DSS (if handling payments)
- [ ] HIPAA (if healthcare data)
- [ ] Industry-specific regulations
- [ ] Data retention policies

### Maintenance
- [ ] Logging strategy
- [ ] Debugging tools
- [ ] Update/patch process
- [ ] Technical debt management
- [ ] Documentation requirements
