# **AS-IS ANALYSIS: ASSET-DEPRECIATION MODULE**
**Fleet Management System (FMS) – Enterprise Multi-Tenant Architecture**

**Version:** 1.0
**Last Updated:** [Insert Date]
**Prepared by:** [Your Name/Team]
**Reviewed by:** [Stakeholder Names]

---

## **1. Executive Summary**
The **Asset-Depreciation Module** within the **Fleet Management System (FMS)** is responsible for tracking the financial depreciation of fleet assets (vehicles, equipment, and machinery) in compliance with **GAAP (Generally Accepted Accounting Principles)**, **IFRS (International Financial Reporting Standards)**, and **tax regulations**. This module integrates with **asset lifecycle management, financial reporting, and tax compliance** workflows.

### **Current State Rating: 72/100**
| **Category**               | **Score (0-100)** | **Key Observations** |
|----------------------------|------------------|----------------------|
| **Functional Completeness** | 75               | Meets core requirements but lacks advanced features (e.g., predictive depreciation, multi-currency support). |
| **Performance & Scalability** | 68            | Response times degrade under high load; batch processing is inefficient. |
| **Security & Compliance**   | 80               | Strong authentication but lacks fine-grained role-based access control (RBAC) and audit logging. |
| **User Experience (UX)**    | 65               | Outdated UI, poor mobile support, and limited accessibility compliance. |
| **Technical Debt**          | 55               | High legacy code dependencies, lack of automated testing, and manual deployment processes. |
| **Integration Capabilities** | 70             | Works with core FMS modules but lacks real-time API integrations with ERP systems. |
| **Maintainability**         | 60               | Monolithic architecture with poor documentation; high dependency on key personnel. |

**Overall Assessment:**
The module **meets basic operational needs** but suffers from **technical debt, performance bottlenecks, and limited scalability**. Key pain points include **manual data entry, lack of automation, and poor mobile accessibility**. Strategic improvements are required to **enhance compliance, reduce operational overhead, and support future growth**.

---

## **2. Current Features & Capabilities**

### **2.1 Core Functionality**
| **Feature**                          | **Description** | **Implementation Status** |
|--------------------------------------|----------------|--------------------------|
| **Straight-Line Depreciation**       | Standard method for calculating depreciation over an asset’s useful life. | ✅ Fully Implemented |
| **Declining Balance Depreciation**   | Accelerated depreciation method (e.g., double-declining balance). | ✅ Fully Implemented |
| **Sum-of-Years’ Digits (SYD)**       | Alternative accelerated depreciation method. | ⚠️ Partially Implemented (Manual override required) |
| **Units-of-Production Depreciation** | Depreciation based on asset usage (e.g., miles driven, hours operated). | ❌ Not Implemented |
| **Tax Depreciation (MACRS)**         | Modified Accelerated Cost Recovery System (U.S. tax compliance). | ✅ Fully Implemented (U.S. only) |
| **IFRS Depreciation Methods**        | Component-based depreciation (IFRS 16 compliance). | ⚠️ Partially Implemented (Manual adjustments needed) |
| **Depreciation Schedules**           | Automated generation of monthly/annual depreciation schedules. | ✅ Fully Implemented |
| **Asset Revaluation**                | Adjustments for fair market value changes (IFRS). | ❌ Not Implemented |
| **Impairment Testing**               | Manual impairment loss calculations. | ⚠️ Partially Implemented (No automation) |
| **Multi-Currency Support**           | Depreciation calculations in different currencies. | ❌ Not Implemented |
| **Batch Processing**                 | Bulk depreciation calculations for large fleets. | ✅ Fully Implemented (Slow performance) |
| **Audit Trail**                      | Logs changes to depreciation entries. | ✅ Fully Implemented (Basic logging) |
| **Reporting & Dashboards**           | Standard financial reports (e.g., depreciation expense, net book value). | ✅ Fully Implemented (Static reports) |
| **API Integrations**                 | REST APIs for ERP/financial system integrations. | ⚠️ Partially Implemented (Limited endpoints) |

### **2.2 Key Workflows**
1. **Asset Onboarding & Depreciation Setup**
   - Manual entry of asset details (purchase date, cost, useful life, salvage value).
   - Selection of depreciation method (default: straight-line).
   - **Pain Point:** No bulk import from procurement systems.

2. **Depreciation Calculation & Posting**
   - Automated monthly depreciation calculations.
   - Manual override for adjustments (e.g., impairment, revaluation).
   - **Pain Point:** No real-time recalculations; batch processing is slow.

3. **Financial Reporting**
   - Standard reports (depreciation expense, net book value, tax depreciation).
   - Export to Excel/PDF.
   - **Pain Point:** No custom report builder; static templates only.

4. **Tax & Compliance**
   - MACRS (U.S.) and IFRS compliance.
   - **Pain Point:** No support for other tax regimes (e.g., UK GAAP, Canadian CCA).

5. **Audit & Reconciliation**
   - Basic change logs for depreciation entries.
   - **Pain Point:** No automated reconciliation with general ledger.

---

## **3. Data Models & Architecture**

### **3.1 Database Schema (Key Tables)**
| **Table**               | **Description** | **Key Fields** |
|-------------------------|----------------|----------------|
| `assets`                | Fleet assets (vehicles, equipment). | `asset_id`, `asset_name`, `purchase_date`, `cost`, `salvage_value`, `useful_life`, `depreciation_method`, `status` |
| `depreciation_schedules` | Monthly/annual depreciation entries. | `schedule_id`, `asset_id`, `period`, `depreciation_amount`, `net_book_value`, `posted_date` |
| `depreciation_methods`  | Supported depreciation methods. | `method_id`, `method_name`, `description`, `formula` |
| `tax_depreciation_rules` | Tax-specific depreciation rules (e.g., MACRS). | `rule_id`, `country_code`, `asset_class`, `recovery_period`, `bonus_depreciation` |
| `asset_usage`           | Usage-based depreciation data (e.g., miles, hours). | `usage_id`, `asset_id`, `period`, `units_used`, `total_units` |
| `audit_logs`            | Changes to depreciation entries. | `log_id`, `asset_id`, `changed_by`, `change_date`, `old_value`, `new_value` |

### **3.2 System Architecture**
- **Monolithic Backend (Java/Spring Boot)**
  - Single codebase with tight coupling between modules.
  - **Pain Point:** Difficult to scale or modify independently.
- **Frontend (AngularJS 1.x)**
  - Outdated framework with poor mobile responsiveness.
  - **Pain Point:** High maintenance cost; no modern UI components.
- **Database (Oracle 12c)**
  - Relational database with stored procedures for depreciation logic.
  - **Pain Point:** No NoSQL support for unstructured data (e.g., usage logs).
- **Batch Processing (Spring Batch)**
  - Nightly depreciation calculations.
  - **Pain Point:** Slow for large fleets (>10,000 assets).
- **API Layer (RESTful)**
  - Limited endpoints for ERP integrations.
  - **Pain Point:** No GraphQL or WebSocket support for real-time updates.

### **3.3 Data Flow**
1. **Asset Registration**
   - Procurement system → FMS → `assets` table.
2. **Depreciation Setup**
   - Manual entry → `depreciation_methods` → `assets`.
3. **Depreciation Calculation**
   - Batch job → `depreciation_schedules` → General Ledger (via API).
4. **Reporting**
   - `depreciation_schedules` → BI tool (e.g., Tableau) → Financial reports.

---

## **4. Performance Metrics**

### **4.1 Response Times**
| **Operation**                     | **Avg. Response Time (ms)** | **95th Percentile (ms)** | **Notes** |
|-----------------------------------|----------------------------|--------------------------|-----------|
| Load Asset List (100 assets)      | 850                        | 1,200                    | Slow due to AngularJS rendering. |
| Depreciation Schedule Calculation (Single Asset) | 450 | 700 | Acceptable. |
| Batch Depreciation (1,000 assets) | 12,000                     | 18,000                   | **Critical bottleneck.** |
| Report Generation (PDF)           | 2,500                      | 4,000                    | Slow due to Oracle query optimization. |
| API Call (Get Depreciation Entry) | 300                        | 500                      | Acceptable. |

### **4.2 Throughput & Scalability**
| **Metric**               | **Current Value** | **Target (Post-Improvement)** | **Gap** |
|--------------------------|------------------|-------------------------------|---------|
| Assets Processed/Hour    | 5,000            | 50,000                        | 90%     |
| Concurrent Users         | 50               | 500                           | 90%     |
| API Requests/Second      | 20               | 200                           | 90%     |
| Batch Job Completion Time (10K assets) | 4 hours | 30 minutes | **92% improvement needed** |

### **4.3 Key Performance Issues**
1. **Slow Batch Processing**
   - Current implementation uses **single-threaded Spring Batch**.
   - **Root Cause:** No parallel processing or distributed computing.
2. **High Database Load**
   - Depreciation calculations run **complex stored procedures** in Oracle.
   - **Root Cause:** No caching or query optimization.
3. **Frontend Bottlenecks**
   - AngularJS 1.x has **poor rendering performance** for large datasets.
4. **API Latency**
   - No **caching layer** (e.g., Redis) for frequent queries.

---

## **5. Security Assessment**

### **5.1 Authentication & Authorization**
| **Aspect**               | **Current Implementation** | **Risk Level** | **Recommendation** |
|--------------------------|---------------------------|----------------|--------------------|
| **Authentication**       | OAuth 2.0 (Okta)          | Low            | ✅ Maintain. |
| **Authorization**        | Role-Based (Basic)        | Medium         | **Implement fine-grained RBAC.** |
| **Session Management**   | JWT with 1-hour expiry    | Low            | ✅ Maintain. |
| **Password Policies**    | 8 chars, no MFA           | Medium         | **Enforce MFA & password complexity.** |
| **API Security**         | API keys (static)         | High           | **Replace with OAuth 2.0 client credentials.** |

### **5.2 Data Protection**
| **Aspect**               | **Current Implementation** | **Risk Level** | **Recommendation** |
|--------------------------|---------------------------|----------------|--------------------|
| **Encryption at Rest**   | Oracle TDE (Transparent Data Encryption) | Low | ✅ Maintain. |
| **Encryption in Transit** | TLS 1.2                   | Low            | ✅ Maintain. |
| **PII Handling**         | No masking in logs        | Medium         | **Implement data masking.** |
| **Audit Logging**        | Basic (who, when)         | High           | **Enhance with "what changed" details.** |
| **Backup & Recovery**    | Nightly backups           | Medium         | **Implement point-in-time recovery.** |

### **5.3 Compliance**
| **Standard**             | **Compliance Status** | **Gap** |
|--------------------------|----------------------|---------|
| **GDPR**                 | Partial              | No right-to-erasure automation. |
| **SOX (Sarbanes-Oxley)** | Partial              | No automated segregation of duties (SoD). |
| **ISO 27001**            | Not Certified        | No formal ISMS. |
| **PCI DSS**              | N/A                  | ✅ Not applicable. |

---

## **6. Accessibility Review (WCAG Compliance)**

### **6.1 WCAG 2.1 AA Compliance Assessment**
| **Criteria**             | **Status** | **Issues** |
|--------------------------|-----------|------------|
| **Perceivable**          | ❌ Fail    | - No alt text for images. <br> - Low color contrast (4.5:1 not met). <br> - No keyboard navigation for dropdowns. |
| **Operable**             | ⚠️ Partial | - No skip links. <br> - No ARIA labels for dynamic content. |
| **Understandable**       | ⚠️ Partial | - No error suggestions for forms. <br> - No consistent navigation. |
| **Robust**               | ❌ Fail    | - AngularJS 1.x is outdated (not supported by modern screen readers). |

### **6.2 Mobile Accessibility**
| **Aspect**               | **Status** | **Issues** |
|--------------------------|-----------|------------|
| **Responsive Design**    | ❌ Fail    | - Fixed-width layouts. <br> - No touch-friendly controls. |
| **Screen Reader Support** | ❌ Fail   | - No ARIA attributes. <br> - Poor focus management. |
| **Performance on Mobile** | ❌ Fail   | - Slow load times (>5s). <br> - No lazy loading. |

**Recommendation:**
- **Upgrade to WCAG 2.1 AA compliance** (estimated effort: 3-6 months).
- **Replace AngularJS with React/Angular 15+** for better accessibility support.

---

## **7. Mobile Capabilities Assessment**

### **7.1 Current Mobile Support**
| **Feature**              | **Status** | **Notes** |
|--------------------------|-----------|-----------|
| **Responsive UI**        | ❌ No      | Desktop-only. |
| **Mobile App (iOS/Android)** | ❌ No | No native/hybrid app. |
| **Offline Mode**         | ❌ No      | Requires constant internet. |
| **Touch Optimization**   | ❌ No      | Small buttons, no swipe gestures. |
| **Push Notifications**   | ❌ No      | No alerts for depreciation deadlines. |

### **7.2 Mobile Use Cases**
| **Use Case**             | **Current Support** | **Pain Points** |
|--------------------------|---------------------|-----------------|
| **Field Asset Inspection** | ❌ No             | No mobile data entry. |
| **Depreciation Approvals** | ❌ No            | Must use desktop for approvals. |
| **Real-Time Reporting**  | ❌ No               | No mobile dashboards. |

**Recommendation:**
- **Develop a cross-platform mobile app (React Native/Flutter).**
- **Implement offline-first architecture for field operations.**

---

## **8. Current Limitations & Pain Points**

### **8.1 Functional Limitations**
| **Limitation**                          | **Impact** | **Workaround** |
|-----------------------------------------|------------|----------------|
| No **units-of-production depreciation** | Cannot track usage-based depreciation (e.g., forklifts, generators). | Manual Excel calculations. |
| No **multi-currency support**           | Cannot handle international fleets with assets in different currencies. | Manual currency conversion. |
| No **predictive depreciation**          | Cannot forecast future depreciation based on usage trends. | Manual projections. |
| No **automated impairment testing**     | Must manually check for asset impairments. | Manual Excel-based testing. |
| No **real-time recalculations**         | Depreciation is only updated nightly. | Manual recalculations. |

### **8.2 Technical Pain Points**
| **Pain Point**                          | **Root Cause** | **Impact** |
|-----------------------------------------|----------------|------------|
| **Slow batch processing**               | Single-threaded Spring Batch | Delays in financial reporting. |
| **Outdated frontend (AngularJS 1.x)**   | Legacy codebase | High maintenance cost; poor UX. |
| **Monolithic architecture**             | Tight coupling | Difficult to scale or modify. |
| **No API versioning**                   | Hardcoded endpoints | Breaking changes on updates. |
| **Manual deployment process**           | No CI/CD pipeline | Slow releases; high risk of errors. |
| **Poor error handling**                 | Generic 500 errors | Difficult debugging. |

### **8.3 User Pain Points**
| **Pain Point**                          | **Impact** | **Example** |
|-----------------------------------------|------------|-------------|
| **Manual data entry**                   | High operational overhead | Users must manually input asset details. |
| **No bulk import**                      | Time-consuming | No CSV/Excel import for assets. |
| **Static reports**                      | Limited flexibility | Cannot customize reports without IT support. |
| **No mobile support**                   | Reduced productivity | Field teams cannot access depreciation data. |
| **Poor error messages**                 | Frustration | "An error occurred" with no details. |

---

## **9. Technical Debt Analysis**

### **9.1 Code Quality Metrics**
| **Metric**               | **Current Value** | **Industry Benchmark** | **Risk** |
|--------------------------|------------------|------------------------|----------|
| **Code Duplication**     | 22%              | <5%                    | High     |
| **Cyclomatic Complexity** | 35 (avg)         | <10                    | High     |
| **Test Coverage**        | 30%              | >80%                   | Critical |
| **Technical Debt Ratio** | 45%              | <10%                   | High     |
| **Legacy Dependencies**  | 12 (EOL libraries) | 0                     | High     |

### **9.2 Key Technical Debts**
| **Debt Item**                          | **Description** | **Estimated Effort** | **Priority** |
|----------------------------------------|----------------|----------------------|--------------|
| **AngularJS 1.x Migration**            | Upgrade to React/Angular 15+. | 6-9 months | High |
| **Batch Processing Optimization**      | Replace Spring Batch with distributed processing (e.g., Apache Spark). | 3-4 months | Critical |
| **API Modernization**                  | Add GraphQL, WebSockets, and versioning. | 2-3 months | High |
| **Database Optimization**              | Add caching (Redis), query tuning. | 1-2 months | Medium |
| **Automated Testing**                  | Increase test coverage to 80%. | 3-5 months | High |
| **CI/CD Pipeline**                     | Implement GitHub Actions/Jenkins. | 1-2 months | Medium |

---

## **10. Technology Stack**

### **10.1 Backend**
| **Component**          | **Technology** | **Version** | **Status** |
|------------------------|----------------|-------------|------------|
| **Framework**          | Spring Boot    | 2.3.x       | ⚠️ Outdated |
| **Language**           | Java           | 8           | ⚠️ EOL (2022) |
| **Database**           | Oracle         | 12c         | ⚠️ Outdated |
| **Batch Processing**   | Spring Batch   | 4.2.x       | ⚠️ Outdated |
| **API**                | REST (Jersey)  | 2.25.x      | ⚠️ Outdated |

### **10.2 Frontend**
| **Component**          | **Technology** | **Version** | **Status** |
|------------------------|----------------|-------------|------------|
| **Framework**          | AngularJS      | 1.8.x       | ❌ EOL (2021) |
| **UI Library**         | Bootstrap 3    | 3.4.x       | ⚠️ Outdated |
| **Charts**             | Chart.js       | 2.9.x       | ⚠️ Outdated |

### **10.3 DevOps & Infrastructure**
| **Component**          | **Technology** | **Version** | **Status** |
|------------------------|----------------|-------------|------------|
| **CI/CD**              | Jenkins        | 2.204       | ⚠️ Outdated |
| **Containerization**   | Docker         | 19.03       | ⚠️ Outdated |
| **Orchestration**      | Kubernetes     | 1.18        | ⚠️ Outdated |
| **Monitoring**         | Prometheus     | 2.15        | ⚠️ Outdated |

**Recommendation:**
- **Upgrade to Java 17+ and Spring Boot 3.x.**
- **Migrate frontend to React/Angular 15+.**
- **Modernize CI/CD with GitHub Actions or ArgoCD.**

---

## **11. Competitive Analysis vs. Industry Standards**

### **11.1 Comparison with Leading Fleet Management Systems**
| **Feature**                          | **Our System** | **Samsara** | **Geotab** | **Fleetio** | **Industry Best** |
|--------------------------------------|----------------|-------------|------------|-------------|-------------------|
| **Depreciation Methods**             | 4              | 5           | 5          | 4           | 6+                |
| **Multi-Currency Support**           | ❌ No          | ✅ Yes      | ✅ Yes     | ❌ No       | ✅ Yes            |
| **Predictive Depreciation**          | ❌ No          | ✅ Yes      | ⚠️ Partial | ❌ No       | ✅ Yes            |
| **Mobile App**                       | ❌ No          | ✅ Yes      | ✅ Yes     | ✅ Yes      | ✅ Yes            |
| **ERP Integration (APIs)**           | ⚠️ Partial     | ✅ Yes      | ✅ Yes     | ✅ Yes      | ✅ Yes            |
| **Automated Impairment Testing**     | ❌ No          | ✅ Yes      | ⚠️ Partial | ❌ No       | ✅ Yes            |
| **WCAG 2.1 AA Compliance**           | ❌ No          | ✅ Yes      | ⚠️ Partial | ⚠️ Partial  | ✅ Yes            |
| **Real-Time Depreciation Updates**   | ❌ No          | ✅ Yes      | ✅ Yes     | ⚠️ Partial  | ✅ Yes            |

### **11.2 Key Gaps**
1. **Lack of Predictive Analytics**
   - Competitors (Samsara, Geotab) use **AI/ML for depreciation forecasting**.
2. **Poor Mobile Support**
   - No native app; competitors offer **offline mode and push notifications**.
3. **Limited ERP Integrations**
   - Competitors support **real-time sync with SAP, Oracle, NetSuite**.
4. **No Automated Impairment Testing**
   - Competitors use **market data to trigger impairment alerts**.

---

## **12. Detailed Recommendations for Improvement**

### **12.1 Short-Term (0-6 Months)**
| **Recommendation**                     | **Effort** | **Impact** | **Priority** |
|----------------------------------------|------------|------------|--------------|
| **Upgrade AngularJS to React/Angular 15+** | High | High | Critical |
| **Implement WCAG 2.1 AA Compliance**   | Medium | High | High |
| **Optimize Batch Processing (Parallelize)** | Medium | High | Critical |
| **Add Multi-Currency Support**         | Medium | Medium | High |
| **Enhance API Security (OAuth 2.0)**   | Low | Medium | High |
| **Improve Error Handling & Logging**   | Low | Medium | Medium |

### **12.2 Medium-Term (6-12 Months)**
| **Recommendation**                     | **Effort** | **Impact** | **Priority** |
|----------------------------------------|------------|------------|--------------|
| **Migrate to Microservices Architecture** | High | High | Critical |
| **Implement Predictive Depreciation (ML)** | High | High | High |
| **Develop Mobile App (React Native)**  | High | High | High |
| **Add Automated Impairment Testing**   | Medium | High | High |
| **Upgrade to Java 17 & Spring Boot 3.x** | Medium | Medium | High |
| **Implement CI/CD Pipeline (GitHub Actions)** | Medium | Medium | Medium |

### **12.3 Long-Term (12-24 Months)**
| **Recommendation**                     | **Effort** | **Impact** | **Priority** |
|----------------------------------------|------------|------------|--------------|
| **Adopt Event-Driven Architecture**    | High | High | High |
| **Integrate with AI-Powered Analytics** | High | High | High |
| **Implement Blockchain for Audit Trail** | High | Medium | Low |
| **Expand to Global Tax Compliance**    | Medium | High | Medium |

### **12.4 Quick Wins (Low Effort, High Impact)**
| **Recommendation**                     | **Effort** | **Impact** |
|----------------------------------------|------------|------------|
| **Add Bulk Asset Import (CSV/Excel)**  | Low        | High       |
| **Improve Error Messages**             | Low        | Medium     |
| **Add Keyboard Navigation**            | Low        | Medium     |
| **Implement Caching (Redis)**          | Low        | High       |

---

## **13. Conclusion & Next Steps**

### **13.1 Summary of Findings**
- The **Asset-Depreciation Module** is **functional but outdated**, with **critical gaps in performance, scalability, and user experience**.
- **Technical debt is high**, with **legacy dependencies and poor test coverage**.
- **Competitors offer superior features** (predictive analytics, mobile apps, ERP integrations).
- **Security and compliance** are **partially addressed** but require enhancements.

### **13.2 Recommended Roadmap**
| **Phase** | **Timeline** | **Key Deliverables** |
|-----------|-------------|----------------------|
| **Phase 1 (0-6 Months)** | Q1-Q2 2024 | - AngularJS → React migration <br> - WCAG 2.1 AA compliance <br> - Batch processing optimization <br> - Multi-currency support |
| **Phase 2 (6-12 Months)** | Q3-Q4 2024 | - Microservices migration <br> - Predictive depreciation (ML) <br> - Mobile app development <br> - Automated impairment testing |
| **Phase 3 (12-24 Months)** | 2025 | - Event-driven architecture <br> - AI-powered analytics <br> - Global tax compliance |

### **13.3 Next Steps**
1. **Prioritize Phase 1 initiatives** (AngularJS migration, WCAG compliance, batch optimization).
2. **Form a cross-functional team** (Dev, QA, UX, Security) for execution.
3. **Engage stakeholders** for approval on long-term architectural changes.
4. **Monitor KPIs** (response times, error rates, user satisfaction) post-implementation.

---

## **14. Appendix**

### **14.1 Glossary**
| **Term**               | **Definition** |
|------------------------|----------------|
| **GAAP**               | Generally Accepted Accounting Principles. |
| **IFRS**               | International Financial Reporting Standards. |
| **MACRS**              | Modified Accelerated Cost Recovery System (U.S. tax depreciation). |
| **WCAG**               | Web Content Accessibility Guidelines. |
| **RBAC**               | Role-Based Access Control. |
| **TDE**                | Transparent Data Encryption. |

### **14.2 References**
- **GAAP/IFRS Depreciation Guidelines** – [FASB](https://www.fasb.org/), [IASB](https://www.ifrs.org/)
- **WCAG 2.1 AA** – [W3C Web Accessibility Initiative](https://www.w3.org/WAI/standards-guidelines/wcag/)
- **Spring Batch Optimization** – [Spring Documentation](https://spring.io/projects/spring-batch)
- **React Native for Mobile** – [React Native Docs](https://reactnative.dev/)

### **14.3 Stakeholder Sign-Off**
| **Role**               | **Name**       | **Signature** | **Date** |
|------------------------|----------------|---------------|----------|
| **Product Owner**      | [Name]         |               |          |
| **Engineering Lead**   | [Name]         |               |          |
| **Security Officer**   | [Name]         |               |          |
| **Finance Lead**       | [Name]         |               |          |

---
**End of Document**