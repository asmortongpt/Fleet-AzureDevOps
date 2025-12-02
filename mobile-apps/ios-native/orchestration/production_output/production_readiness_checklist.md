Below is a **comprehensive production readiness checklist** with **pass/fail criteria** and **owner assignments** for each category. This checklist is designed for enterprise-grade applications and aligns with industry best practices (e.g., NIST, OWASP, SRE principles).

---

### **1. Code Quality**
**Owner:** Dev Team / QA Lead

| **Check**                          | **Pass Criteria**                                                                                     | **Fail Criteria**                                                                                     | **Owner**       |
|-------------------------------------|--------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------|------------------|
| **Linting & Formatting**            | 100% compliance with ESLint/Prettier/Black/Pylint (no errors, warnings reviewed).                       | Linting errors exist without justification.                                                            | Dev Team        |
| **Unit Test Coverage**              | ≥ 80% coverage for critical paths (90%+ preferred). Tests pass in CI.                                   | Coverage < 80% or critical tests fail.                                                                 | QA Lead         |
| **Integration Testing**             | All API/service interactions tested (mocked external dependencies). No flaky tests.                  | Untested integrations or >5% flaky tests.                                                              | QA Lead         |
| **Static Code Analysis (SAST)**     | No critical/vulnerabilities (SonarQube/Snyk/Checkmarx). High-severity issues remediated.               | Unresolved critical/high-severity issues.                                                              | Security Team   |
| **Dependency Scanning**              | No known vulnerabilities in dependencies (OWASP DC, Snyk, Dependabot).                                | Unpatched critical CVEs in production dependencies.                                                     | Dev Team        |
| **Branch Protection**                | Main branch requires: 2 PR approvals, passing CI, no force pushes.                                     | Direct pushes to main or skipped reviews.                                                             | DevOps          |
| **Immutable Artifacts**              | Build artifacts are immutable (no hotfixes to binaries; rebuild required for changes).                  | Manual modifications to deployed artifacts.                                                           | DevOps          |

---

### **2. Security**
**Owner:** Security Team / DevSecOps

| **Check**                          | **Pass Criteria**                                                                                     | **Fail Criteria**                                                                                     | **Owner**       |
|-------------------------------------|--------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------|------------------|
| **Authentication**                  | MFA enforced for all users. OAuth2/OIDC or SAML for APIs. No hardcoded credentials.                   | Basic auth, missing MFA, or credentials in code/repos.                                                 | Security Team   |
| **Authorization**                   | Role-Based Access Control (RBAC) with least privilege. Regular access reviews.                         | Over-permissive roles (e.g., `admin` by default).                                                      | Security Team   |
| **Encryption**                      | TLS 1.2+ (1.3 preferred) for all traffic. Data at rest encrypted (AES-256). KMS/HSM for secrets.       | Weak ciphers (e.g., TLS 1.0), unencrypted PII, or secrets in plaintext.                               | Security Team   |
| **Secrets Management**              | Secrets rotated every 90 days. No secrets in code/repos (use Vault/AWS Secrets Manager).              | Secrets committed to Git or shared via chat/email.                                                     | DevOps          |
| **Vulnerability Scanning (DAST)**   | No critical/high vulnerabilities in OWASP ZAP/Burp scans. False positives documented.                 | Exploitable vulnerabilities (e.g., SQLi, XSS) in production.                                           | Security Team   |
| **API Security**                    | Rate limiting, input validation, and OpenAPI/Swagger docs. No exposed debug endpoints.                | Missing rate limits, unvalidated inputs, or `/debug` endpoints accessible.                              | Backend Team    |
| **Third-Party Audits**               | Penetration test completed in last 6 months. No critical findings unaddressed.                        | Unmitigated critical findings from audits.                                                            | Security Team   |
| **Security Headers**                | CSP, HSTS, X-Frame-Options, and XSS Protection headers configured.                                    | Missing critical headers (e.g., `Content-Security-Policy`).                                           | Frontend Team   |

---

### **3. Performance**
**Owner:** Performance Engineer / SRE

| **Check**                          | **Pass Criteria**                                                                                     | **Fail Criteria**                                                                                     | **Owner**       |
|-------------------------------------|--------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------|------------------|
| **Load Testing**                    | System handles 2x expected peak load (≤500ms p99 latency, 0% errors).                                  | Crashes, timeouts, or >1% errors under load.                                                          | SRE             |
| **Stress Testing**                  | Graceful degradation under 4x load (e.g., circuit breakers, queues).                                  | Cascading failures or unrecoverable crashes.                                                          | SRE             |
| **Database Optimization**           | Queries optimized (indexes, no `SELECT *`). No N+1 queries.                                           | Unindexed foreign keys, full-table scans in production.                                                | DBA             |
| **CDN Caching**                     | Static assets cached (Cache-Control headers, ≥80% hit ratio).                                          | Low cache hit ratio (<60%) or missing headers.                                                        | DevOps          |
| **Cold Start Time**                 | Serverless functions initialize in <500ms.                                                           | Cold starts >2s.                                                                                       | Backend Team    |
| **Resource Limits**                 | CPU/Memory limits set (e.g., Kubernetes requests/limits). No OOM kills in last 30 days.               | Unbounded resource usage or frequent OOMs.                                                             | DevOps          |

---

### **4. Scalability**
**Owner:** DevOps / SRE

| **Check**                          | **Pass Criteria**                                                                                     | **Fail Criteria**                                                                                     | **Owner**       |
|-------------------------------------|--------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------|------------------|
| **Auto-Scaling**                    | Horizontal scaling configured (e.g., Kubernetes HPA, AWS ASG). Scale-up/down tested.                 | Manual scaling or failed scale tests.                                                                | DevOps          |
| **Database Scaling**                | Read replicas for read-heavy workloads. Sharding plan for >10M users.                                 | Single write master with no failover.                                                                 | DBA             |
| **Stateless Services**              | All services stateless (session data in Redis/DB).                                                   | Local session storage or sticky sessions.                                                            | Backend Team    |
| **Caching Strategy**                | Multi-layer caching (CDN, Redis, DB query cache). Cache invalidation tested.                          | Missing caches for high-traffic endpoints.                                                            | Backend Team    |
| **Queue-Based Processing**          | Async tasks use queues (e.g., SQS, RabbitMQ). No blocking calls.                                      | Synchronous processing for long-running tasks.                                                        | Backend Team    |
| **Regional Deployment**             | Multi-region deployment for global apps (failover tested).                                            | Single-region deployment for critical services.                                                       | DevOps          |

---

### **5. Monitoring**
**Owner:** SRE / Observability Team

| **Check**                          | **Pass Criteria**                                                                                     | **Fail Criteria**                                                                                     | **Owner**       |
|-------------------------------------|--------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------|------------------|
| **Logging**                         | Structured logs (JSON) with correlation IDs. Retention ≥30 days.                                       | Unstructured logs or missing critical events.                                                          | DevOps          |
| **Metrics**                        | Key metrics collected (latency, error rates, saturation). Prometheus/Grafana dashboards.              | Missing metrics for SLIs (e.g., request success rate).                                                | SRE             |
| **Alerts**                         | Alerts on SLO breaches (e.g., error budget burn). No alert fatigue (<5 false positives/week).          | Missing alerts for critical failures or >10 false positives/day.                                      | SRE             |
| **Distributed Tracing**             | End-to-end traces for critical paths (Jaeger/Zipkin).                                                 | No tracing for cross-service calls.                                                                   | Backend Team    |
| **Synthetic Monitoring**            | External uptime checks (e.g., Pingdom) for critical user journeys.                                    | No synthetic checks for core flows.                                                                   | SRE             |
| **Incident Response**               | Runbooks for top 5 failure modes. On-call rotation documented.                                        | No runbooks or untriaged pages.                                                                       | SRE             |

---

### **6. Documentation**
**Owner:** Tech Lead / Documentation Owner

| **Check**                          | **Pass Criteria**                                                                                     | **Fail Criteria**                                                                                     | **Owner**       |
|-------------------------------------|--------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------|------------------|
| **Code Documentation**              | Critical classes/methods documented (e.g., JSDoc, Swagger).                                          | Undocumented APIs or complex logic.                                                                   | Dev Team        |
| **API Documentation**               | OpenAPI/Swagger docs with examples. Versioned for breaking changes.                                    | Outdated or missing API specs.                                                                        | Backend Team    |
| **Deployment Guide**                | Step-by-step deployment instructions (including rollback).                                           | Manual steps not automated or undocumented.                                                           | DevOps          |
| **Architecture Diagram**            | Up-to-date diagram (e.g., C4 model) with data flows.                                                   | No diagram or outdated components.                                                                    | Tech Lead       |
| **Troubleshooting Guide**           | Common issues and debug steps documented.                                                              | No guide for top support tickets.                                                                      | Support Team    |
| **Compliance Documentation**        | Data flow diagrams, PII inventory, and retention policies.                                            | Missing compliance artifacts for audits.                                                              | Security Team   |

---

### **7. Disaster Recovery (DR)**
**Owner:** DevOps / Security Team

| **Check**                          | **Pass Criteria**                                                                                     | **Fail Criteria**                                                                                     | **Owner**       |
|-------------------------------------|--------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------|------------------|
| **Backups**                        | Automated backups (daily for DBs, weekly for configs). Tested restore every 6 months.                 | No backups or untested restores.                                                                      | DevOps          |
| **RPO/RTO**                        | RPO ≤15 mins for critical data. RTO ≤1 hour.                                                          | RPO >1 hour or RTO >4 hours.                                                                          | DevOps          |
| **Failover Testing**                | Annual failover test (e.g., region outage).                                                           | No failover test in last 12 months.                                                                   | SRE             |
| **Chaos Engineering**               | Regular chaos tests (e.g., kill pods, network latency).                                               | No chaos testing or unmitigated failures.                                                            | SRE             |
| **Disaster Recovery Plan**         | Documented DR plan with roles/responsibilities.                                                       | No DR plan or untrained staff.                                                                         | Security Team   |

---

### **8. Compliance**
**Owner:** Compliance Officer / Security Team

| **Check**                          | **Pass Criteria**                                                                                     | **Fail Criteria**                                                                                     | **Owner**       |
|-------------------------------------|--------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------|------------------|
| **GDPR/CCPA**                      | Data subject access request (DSAR) process tested. PII encrypted.                                    | No DSAR process or unencrypted PII.                                                                   | Legal Team      |
| **SOC 2 Type II**                  | Annual audit passed. Controls for security, availability, processing integrity.                       | Failed audit or missing controls.                                                                     | Compliance      |
| **HIPAA (if applicable)**          | BAAs signed. Access logs for PHI.                                                                      | No BAAs or unlogged PHI access.                                                                       | Security Team   |
| **PCI DSS (if applicable)**        | No cardholder data storage. Quarterly vulnerability scans.                                             | Stored CVV numbers or failed scans.                                                                   | Security Team   |
| **Data Retention**                 | Retention policies enforced (e.g., 90 days for logs).                                                | Indefinite retention or no policy.                                                                    | Legal Team      |

---

### **9. User Acceptance Testing (UAT)**
**Owner:** QA / Product Manager

| **Check**                          | **Pass Criteria**                                                                                     | **Fail Criteria**                                                                                     | **Owner**       |
|-------------------------------------|--------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------|------------------|
| **Test Plan**                      | Documented test cases covering all user journeys.                                                     | Missing test cases for critical flows.                                                                | QA Lead         |
| **UAT Environment**                 | Production-like environment (data anonymized).                                                        | Staging diverges from production.                                                                     | DevOps          |
| **User Feedback**                  | ≥5 end-users test the system. No blocker bugs.                                                        | Blocker bugs reported by users.                                                                       | Product Manager |
| **Accessibility**                  | WCAG 2.1 AA compliance (tested with axe/WAVE).                                                       | Critical accessibility violations.                                                                   | Frontend Team   |
| **Localization**                   | All UI strings externalized. Tested in ≥2 languages.                                                  | Hardcoded strings or broken translations.                                                             | Frontend Team   |

---

### **10. Go-Live Plan & Rollback**
**Owner:** Release Manager / DevOps

| **Check**                          | **Pass Criteria**                                                                                     | **Fail Criteria**                                                                                     | **Owner**       |
|-------------------------------------|--------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------|------------------|
| **Deployment Strategy**             | Blue-green or canary deployment. Rollback tested.                                                     | Big-bang deployment or untested rollback.                                                             | DevOps          |
| **Feature Flags**                   | Critical features behind flags. Kill switch for emergencies.                                          | No flags for high-risk changes.                                                                       | Dev Team        |
| **Rollback Plan**                  | Documented rollback steps for DB schema, config, and code.                                            | No rollback plan or untried rollback.                                                                 | DevOps          |
| **Post-Mortem Template**           | Template for incident retrospectives.                                                                | No post-mortem process.                                                                               | SRE             |
| **Stakeholder Communication**      | Go-live announcement to users/support.                                                               | Unannounced changes or missing support prep.                                                          | Product Manager |
| **War Room Setup**                 | Dedicated Slack/Zoom channel for go-live. On-call team standby.                                       | No war room or untriaged issues.                                                                       | SRE             |

---

### **Sign-Off**
| **Category**       | **Owner**               | **Status (Pass/Fail)** | **Notes**                          | **Date**       |
|--------------------|-------------------------|------------------------|------------------------------------|----------------|
| Code Quality       | Dev Team / QA Lead      |                        |                                    |                |
| Security           | Security Team           |                        |                                    |                |
| Performance        | SRE                     |                        |                                    |                |
| Scalability        | DevOps                  |                        |                                    |                |
| Monitoring         | Observability Team     |                        |                                    |                |
| Documentation      | Tech Lead               |                        |                                    |                |
| Disaster Recovery  | DevOps / Security       |                        |                                    |                |
| Compliance         | Compliance Officer      |                        |                                    |                |
| UAT                | QA / Product Manager    |                        |                                    |                |
| Go-Live Plan       | Release Manager         |                        |                                    |                |

---
### **Final Approval**
- **CISO Sign-Off:** _______________________ (Security)
- **CTO Sign-Off:** _______________________ (Technical)
- **Product Owner Sign-Off:** _______________________ (Business)

---
### **Notes:**
1. **Automate Checks:** Integrate with CI/CD (e.g., GitHub Actions, Argo Workflows) to enforce pass/fail gates.
2. **Evidence:** Attach screenshots/logs (e.g., SonarQube report, load test results) for audit trails.
3. **Exceptions:** Document any justified failures with mitigation plans (e.g., "Legacy system; upgrade planned Q3 2024").

This checklist is **audit-ready** and aligns with **ISO 27001, NIST CSF, and SRE best practices**. Adjust severity thresholds (e.g., test coverage %) based on your risk appetite.