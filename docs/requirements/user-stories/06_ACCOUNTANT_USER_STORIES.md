# Accountant / Finance Manager - User Stories

**Role**: Accountant / Finance Manager
**Access Level**: Financial (Read-only operations, full financial data)
**Primary Interface**: Web Dashboard
**Version**: 1.0
**Date**: November 11, 2025

---

## Epic 1: Invoice Processing and Approval

### US-AC-001: Vendor Invoice Processing
**As an** Accountant
**I want to** receive, validate, and process vendor invoices for fleet-related expenses
**So that** I can ensure accurate payment processing and proper cost allocation

**Priority**: High
**Story Points**: 8
**Sprint**: 1

#### Acceptance Criteria:
- [ ] I can receive invoices via email integration, manual upload, or EDI
- [ ] System automatically extracts invoice data (vendor, amount, date, PO number) using OCR
- [ ] I can match invoices to existing work orders and purchase orders (3-way match)
- [ ] System flags discrepancies between invoice, PO, and work order amounts
- [ ] I can categorize expenses by GL account code and cost center
- [ ] I can split invoices across multiple vehicles or departments
- [ ] System validates vendor information against approved vendor master
- [ ] I can add notes, attachments, and coding instructions to invoices
- [ ] Invoice status tracking: received → validated → coded → approved → paid
- [ ] I receive alerts for duplicate invoices or unusual amounts

#### Dependencies:
- OCR/document processing service
- Work order management system
- Vendor master data
- General ledger chart of accounts

#### Technical Notes:
- API Endpoint: POST `/api/accounting/invoices`
- OCR Provider: Azure Form Recognizer or AWS Textract
- Storage: invoice_documents (blob), invoice_header, invoice_line_items
- Integration: Email (Microsoft Graph API), EDI (AS2/X12)

---

### US-AC-002: Approval Workflow Management
**As an** Accountant
**I want to** route invoices through multi-level approval workflows
**So that** invoices are reviewed and authorized before payment according to company policy

**Priority**: High
**Story Points**: 5
**Sprint**: 1

#### Acceptance Criteria:
- [ ] I can configure approval workflows based on amount thresholds and expense types
- [ ] System automatically routes invoices to appropriate approvers
- [ ] Approvers receive email/in-app notifications with invoice details
- [ ] I can view approval status and history for all invoices
- [ ] Approvers can approve, reject, or request additional information
- [ ] Rejected invoices return to me with comments for correction
- [ ] System enforces approval hierarchy (Manager → Director → VP for >$10K)
- [ ] I can override or expedite approvals in emergency situations (with audit log)
- [ ] Dashboard shows pending approvals by approver and aging
- [ ] System sends escalation reminders for approvals pending >5 business days

#### Dependencies:
- User role hierarchy
- Notification service
- Approval policy configuration

#### Technical Notes:
- API Endpoint: POST `/api/accounting/approvals/{invoice_id}`
- Workflow Engine: Custom state machine or BPM tool
- States: pending_approval → approved → rejected → payment_ready
- Notifications: Email + in-app alerts

---

### US-AC-003: Fuel Card Reconciliation
**As an** Accountant
**I want to** reconcile fuel card transactions against vehicle fueling records
**So that** I can detect fraud, errors, and unauthorized fuel purchases

**Priority**: High
**Story Points**: 8
**Sprint**: 2

#### Acceptance Criteria:
- [ ] System imports fuel card transaction files from providers (WEX, Voyager, Comdata)
- [ ] I can view side-by-side comparison of card transactions vs driver-reported fueling
- [ ] System auto-matches transactions using vehicle number, date, and location
- [ ] Unmatched transactions are flagged for investigation (different vehicle, time, or amount)
- [ ] I can mark transactions as verified, disputed, or fraudulent
- [ ] Dashboard shows reconciliation rate and outstanding discrepancies
- [ ] I can export exception reports for management review
- [ ] System calculates fuel cost variances and identifies pricing outliers
- [ ] I can block compromised cards and request replacements
- [ ] Monthly reconciliation summary auto-generates for accounting close

#### Dependencies:
- Fuel card provider integration (API or file import)
- Driver fueling transaction records
- Vehicle assignment data

#### Technical Notes:
- API Endpoint: GET `/api/accounting/fuel-reconciliation`
- File Import: Parse CSV/XML from fuel card providers
- Matching Algorithm: Fuzzy matching on vehicle + timestamp ±2 hours
- Storage: fuel_card_transactions, fuel_reconciliation_results

---

## Epic 2: Financial Reporting and Analysis

### US-AC-004: Cost Center Reporting
**As an** Accountant
**I want to** generate detailed cost reports by department, location, or vehicle type
**So that** I can provide accurate financial data for internal chargebacks and P&L analysis

**Priority**: High
**Story Points**: 8
**Sprint**: 2

#### Acceptance Criteria:
- [ ] I can define cost centers (departments, locations, divisions, projects)
- [ ] System allocates all fleet costs to appropriate cost centers automatically
- [ ] I can generate cost reports by period (monthly, quarterly, annually)
- [ ] Reports show costs by category: fuel, maintenance, parts, insurance, depreciation
- [ ] I can drill down from summary to transaction-level detail
- [ ] System calculates cost allocation percentages for shared vehicles
- [ ] I can compare cost center performance period-over-period
- [ ] Reports support internal chargeback billing to departments
- [ ] I can export reports to Excel with pivot tables for further analysis
- [ ] Dashboard shows top cost centers and variances from prior periods

#### Dependencies:
- Cost center master data
- Vehicle-to-cost-center assignment rules
- Complete transaction history

#### Technical Notes:
- API Endpoint: GET `/api/accounting/cost-center-reports`
- Allocation Rules: Direct assignment, usage-based, or percentage split
- Report Formats: PDF, Excel, CSV
- Storage: cost_centers, cost_allocations, transaction_cost_mappings

---

### US-AC-005: Depreciation Schedule Management
**As an** Accountant
**I want to** manage vehicle depreciation schedules and calculate monthly depreciation expense
**So that** I can maintain accurate fixed asset records and financial statements

**Priority**: High
**Story Points**: 5
**Sprint**: 2

#### Acceptance Criteria:
- [ ] I can set depreciation method for each vehicle (straight-line, declining balance, units of production)
- [ ] System calculates monthly depreciation expense automatically
- [ ] I can define useful life, salvage value, and depreciation start date
- [ ] Dashboard shows current book value for all fleet assets
- [ ] System generates depreciation journal entries for GL posting
- [ ] I can run depreciation reports by vehicle, type, or acquisition year
- [ ] System handles adjustments for major overhauls extending useful life
- [ ] I can export fixed asset schedule for audit and tax purposes
- [ ] System alerts me when vehicles reach fully depreciated status
- [ ] I can compare book value vs market value for impairment testing

#### Dependencies:
- Vehicle acquisition data (cost, date)
- Disposal tracking
- GL integration

#### Technical Notes:
- API Endpoint: GET `/api/accounting/depreciation`
- Calculation: Monthly batch job on last day of month
- Methods: Straight-line (most common), 150% declining balance, MACRS
- Storage: depreciation_schedules, monthly_depreciation_expense

---

### US-AC-006: Total Cost of Ownership (TCO) Analysis
**As an** Accountant
**I want to** analyze complete lifecycle costs for vehicles and fleet segments
**So that** I can provide financial insights for replacement and acquisition decisions

**Priority**: Medium
**Story Points**: 8
**Sprint**: 3

#### Acceptance Criteria:
- [ ] System calculates TCO including: acquisition, fuel, maintenance, insurance, depreciation, disposal
- [ ] I can compare TCO across vehicle makes, models, and years
- [ ] Dashboard shows TCO trends over vehicle lifecycle (year 1-7)
- [ ] I can identify high-cost outlier vehicles for replacement consideration
- [ ] System provides TCO per mile and TCO per day metrics
- [ ] I can export TCO analysis for fleet manager and executive review
- [ ] Analysis includes EV-specific costs (charging, battery replacement)
- [ ] I can run "what-if" scenarios for fleet composition changes
- [ ] System calculates break-even points for EVs vs ICE vehicles
- [ ] Reports show total economic impact of ownership decisions

#### Dependencies:
- Complete cost history for all vehicles
- Depreciation data
- Disposal/resale values
- Industry benchmarks (optional)

#### Technical Notes:
- API Endpoint: GET `/api/accounting/tco-analysis`
- Calculation: Sum all cost categories / total miles (or total days)
- Time Periods: By vehicle age (year 1, year 2, etc.)
- Visualization: Stacked area charts, comparison tables

---

## Epic 3: Budget Management

### US-AC-007: Annual Budget Planning
**As an** Accountant
**I want to** create and manage annual fleet budgets by category and cost center
**So that** I can control spending and provide accurate financial forecasts

**Priority**: High
**Story Points**: 8
**Sprint**: 1

#### Acceptance Criteria:
- [ ] I can create annual budgets by category (fuel, maintenance, parts, insurance, etc.)
- [ ] System allows budget allocation by month to account for seasonality
- [ ] I can copy prior year budgets and apply percentage increases
- [ ] Budget entry supports multiple cost centers and departments
- [ ] I can model budget scenarios (conservative, expected, aggressive)
- [ ] System validates budget totals against company guidelines
- [ ] I can submit budgets for approval through workflow
- [ ] Dashboard shows budget status: draft → submitted → approved → active
- [ ] I can export budget vs actual reports throughout the year
- [ ] System locks prior period budgets to prevent unauthorized changes

#### Dependencies:
- Historical spending data
- Cost center definitions
- Approval workflow

#### Technical Notes:
- API Endpoint: POST `/api/accounting/budgets`
- Storage: budget_master, budget_details, budget_versions
- Versioning: Track budget changes and approval history
- Calculations: Monthly allocation with mid-year adjustments

---

### US-AC-008: Budget Variance Analysis
**As an** Accountant
**I want to** monitor actual spending against budget and analyze variances
**So that** I can identify overspending and take corrective action

**Priority**: High
**Story Points**: 5
**Sprint**: 2

#### Acceptance Criteria:
- [ ] Dashboard shows real-time budget vs actual for current month and YTD
- [ ] I can view variances as dollar amounts and percentages
- [ ] System highlights unfavorable variances exceeding threshold (>10%)
- [ ] I can drill down to transaction detail for any variance
- [ ] I can add variance explanations and corrective action notes
- [ ] System forecasts year-end spending based on current run rate
- [ ] I receive alerts when categories approach budget limits (>90%)
- [ ] Reports show variance trends over multiple periods
- [ ] I can export variance analysis for management review
- [ ] Dashboard provides variance commentary templates for reporting

#### Dependencies:
- Active budget data
- Real-time transaction posting
- Forecasting algorithms

#### Technical Notes:
- API Endpoint: GET `/api/accounting/budget-variance`
- Calculation: Actual - Budget, (Actual - Budget) / Budget * 100
- Forecasting: Linear regression or average monthly burn rate
- Alerts: Automated threshold monitoring (daily job)

---

## Epic 4: Tax Reporting and Compliance

### US-AC-009: IFTA Reporting
**As an** Accountant
**I want to** generate quarterly IFTA (International Fuel Tax Agreement) reports
**So that** I can comply with multi-jurisdiction fuel tax requirements and avoid penalties

**Priority**: High
**Story Points**: 13
**Sprint**: 3

#### Acceptance Criteria:
- [ ] System tracks miles driven and fuel purchased by jurisdiction
- [ ] I can import GPS-based mileage data from telematics systems
- [ ] System calculates fuel tax owed or credits by state/province
- [ ] I can review and adjust jurisdiction mileage allocations
- [ ] System generates IFTA-compliant quarterly reports (form format)
- [ ] I can export IFTA data for filing with state tax authorities
- [ ] Dashboard shows estimated tax liability throughout the quarter
- [ ] System validates data completeness before report generation
- [ ] I can handle special cases (exempt vehicles, exempt fuel purchases)
- [ ] Archive previous quarters for audit purposes
- [ ] System calculates penalties for late filing based on deadline dates
- [ ] I receive reminders 30/15/5 days before IFTA filing deadlines

#### Dependencies:
- GPS/telematics mileage by jurisdiction
- Fuel purchase records with location data
- IFTA tax rate tables by jurisdiction
- Vehicle IFTA registration status

#### Technical Notes:
- API Endpoint: GET `/api/accounting/ifta-report`
- Calculation: (Total miles * MPG - Fuel purchased) * Tax rate per jurisdiction
- Standards: IFTA-compliant XML/PDF export
- Storage: ifta_mileage_summary, ifta_fuel_summary, ifta_filings

---

### US-AC-010: Tax Exemption Management
**As an** Accountant
**I want to** manage tax-exempt fuel purchases and track exemption certificates
**So that** I can maximize tax savings and maintain compliance with tax authority requirements

**Priority**: Medium
**Story Points**: 5
**Sprint**: 3

#### Acceptance Criteria:
- [ ] I can record tax exemption certificates by vehicle and jurisdiction
- [ ] System tracks expiration dates for exemption certificates
- [ ] I can flag fuel purchases as tax-exempt with exemption reason
- [ ] Dashboard shows tax savings from exemptions by period
- [ ] System validates exemption eligibility against vehicle type and usage
- [ ] I receive alerts 60/30 days before exemption certificate expiration
- [ ] I can upload and store exemption certificate documents
- [ ] Reports show audit trail of all tax-exempt transactions
- [ ] System prevents incorrect exemption claims (alerts for review)
- [ ] I can export exemption reports for tax authority audits

#### Dependencies:
- Fuel transaction records
- Vehicle registration and classification
- Document storage

#### Technical Notes:
- API Endpoint: POST `/api/accounting/tax-exemptions`
- Storage: tax_exemption_certificates, exempt_fuel_transactions
- Validation: Rules engine for exemption eligibility
- Alerts: Certificate expiration monitoring

---

## Epic 5: Vendor Payment Management

### US-AC-011: Payment Processing and Batching
**As an** Accountant
**I want to** process vendor payments efficiently through batch payment runs
**So that** I can meet payment terms, optimize cash flow, and maintain vendor relationships

**Priority**: High
**Story Points**: 8
**Sprint**: 2

#### Acceptance Criteria:
- [ ] I can select approved invoices for payment batch processing
- [ ] System groups payments by vendor, payment method, and due date
- [ ] I can filter invoices by payment terms (Net 30, Net 60, 2/10 Net 30)
- [ ] System calculates early payment discounts and recommends optimal payment timing
- [ ] I can generate ACH payment files for bank upload
- [ ] I can print check batches with remittance details
- [ ] System updates invoice status to "paid" and records payment date
- [ ] I can handle partial payments and payment allocation
- [ ] Dashboard shows upcoming payment obligations (aging report)
- [ ] I can export payment registers for cash flow forecasting
- [ ] System integrates with accounting software (QuickBooks, SAP, NetSuite)
- [ ] I receive confirmation when bank processes payment file

#### Dependencies:
- Approved invoices
- Vendor banking information
- Bank integration (ACH file format)
- Accounting system API

#### Technical Notes:
- API Endpoint: POST `/api/accounting/payment-batch`
- File Format: NACHA ACH file or bank-specific format
- Integration: QuickBooks API, SAP BAPI, NetSuite SuiteTalk
- Storage: payment_batches, payment_transactions

---

### US-AC-012: 1099 Vendor Reporting
**As an** Accountant
**I want to** track 1099-eligible vendor payments and generate annual 1099 forms
**So that** I can comply with IRS reporting requirements

**Priority**: Medium
**Story Points**: 5
**Sprint**: 4

#### Acceptance Criteria:
- [ ] I can designate vendors as 1099-eligible and collect W-9 information
- [ ] System tracks year-to-date payments to 1099 vendors
- [ ] I can categorize payments by 1099 box (Box 1 - Rents, Box 2 - Royalties, etc.)
- [ ] Dashboard shows vendors approaching $600 threshold for reporting
- [ ] I can generate 1099-NEC forms at year-end
- [ ] System exports 1099 data for e-filing with IRS
- [ ] I can print 1099 forms for mailing to vendors
- [ ] Reports show audit trail of all 1099 payments
- [ ] System validates vendor TIN (Tax ID Number) against IRS database
- [ ] I receive alerts for missing or invalid W-9 forms

#### Dependencies:
- Vendor master data with TIN
- Payment transaction history
- 1099 form templates

#### Technical Notes:
- API Endpoint: GET `/api/accounting/1099-report`
- Threshold: $600 annual payments trigger reporting requirement
- Forms: 1099-NEC, 1099-MISC
- E-filing: IRS FIRE system or third-party service
- Storage: vendor_1099_status, annual_1099_summary

---

## Summary Statistics

**Total User Stories**: 12
**Total Story Points**: 86
**Estimated Sprints**: 4 (2-week sprints)
**Estimated Timeline**: 8-10 weeks

### Priority Breakdown:
- **High Priority**: 9 stories (66 points)
- **Medium Priority**: 3 stories (20 points)

### Epic Breakdown:
1. Invoice Processing and Approval: 3 stories (21 points)
2. Financial Reporting and Analysis: 3 stories (21 points)
3. Budget Management: 2 stories (13 points)
4. Tax Reporting and Compliance: 2 stories (18 points)
5. Vendor Payment Management: 2 stories (13 points)

---

## Integration Requirements

### Accounting Systems:
- **QuickBooks Online/Desktop**: Invoice sync, GL posting, payment export
- **SAP**: Material master, purchase orders, invoice verification (MIRO)
- **NetSuite**: Vendor bills, expense reports, payment processing
- **Microsoft Dynamics**: Accounts payable module integration

### Banking/Payment:
- **ACH Payment Processing**: NACHA file generation for bank upload
- **Positive Pay**: Check fraud prevention file export
- **Wire Transfer**: Bank-specific payment instructions

### Tax/Compliance:
- **IFTA Filing Systems**: State tax authority portal integration
- **IRS FIRE**: Electronic 1099 filing
- **Tax Rate Services**: Vertex, Avalara for automated tax calculations

### Data Sources:
- **Fuel Card Providers**: WEX, Voyager, Comdata transaction files
- **Telematics**: GPS mileage and jurisdiction tracking
- **Document Management**: Invoice OCR and attachment storage

---

## Financial Controls and Audit Trail

### Segregation of Duties:
- **Invoice Entry**: Accountant or AP Clerk
- **Invoice Approval**: Manager, Director, or VP (based on amount)
- **Payment Processing**: Accountant or Controller
- **Bank Reconciliation**: Different person than payment processor

### Audit Requirements:
- All transactions maintain complete audit trail (who, what, when)
- Invoice images stored with retention policy (7 years)
- Payment batches immutable after bank submission
- Budget changes require approval and version tracking
- Year-end financial data locked after audit completion

### Security:
- Role-based access to financial data
- Multi-factor authentication required for payment processing
- IP restrictions for payment approval
- Encryption of sensitive vendor banking information

---

## Key Performance Indicators (KPIs)

### Processing Efficiency:
- Invoice processing time: <3 business days from receipt to approval
- Payment cycle time: Within vendor payment terms (98%+ on-time)
- Fuel reconciliation rate: >95% auto-matched transactions

### Cost Management:
- Budget variance: ±5% by category
- Cost per mile: Track trend and benchmark against industry
- Early payment discount capture rate: >80% of available discounts

### Compliance:
- IFTA filing: 100% on-time quarterly submissions
- 1099 accuracy: Zero IRS penalty notices
- Audit findings: Zero material weaknesses

### Cash Flow:
- Days payable outstanding (DPO): 30-45 days
- Working capital optimization: Minimize idle cash while meeting obligations

---

## Related Documents
- Use Cases: `use-cases/06_ACCOUNTANT_USE_CASES.md`
- Test Cases: `test-cases/06_ACCOUNTANT_TEST_CASES.md`
- Workflows: `workflows/06_ACCOUNTANT_WORKFLOWS.md`
- Data Model: `data-model/FINANCIAL_SCHEMA.md`

---

*Next: System Administrator User Stories (`07_SYSTEM_ADMIN_USER_STORIES.md`)*
