# Real-World Requirements Examples

## Example 1: Tire Retail ERP & E-Commerce System

### Project Context
- **Business Objective**: Enable multi-location tire retail chain to sell online and manage operations
- **Target Users**: Customers (tire buyers), Staff (sales/service), Admins (owners/managers)
- **Success Criteria**: Launch MVP in 3 months, handle 2-5 locations, $50K monthly revenue by month 6
- **Out of Scope**: Fleet management, B2B wholesale portal (Phase 2)

### Functional Requirements

#### Epic 1: E-Commerce
**Story 1.1: Product Catalog**
- As a customer, I want to browse tires by size and vehicle, so I find compatible options quickly
- AC:
  - Search by tire size (e.g., "225/45R17")
  - Filter by brand, price, season type, rating
  - Results show 20 per page with pagination
  - Product cards show image, price, rating, stock availability

**Story 1.2: Shopping Cart**
- As a customer, I want to add tires to cart and checkout, so I can purchase online
- AC:
  - Add/remove items from cart
  - Cart persists across sessions (Redis)
  - Shows subtotal, tax, shipping cost
  - Checkout integration with Stripe

#### Epic 2: Inventory Management
**Story 2.1: Multi-Location Stock**
- As a staff member, I want to view inventory across locations, so I can fulfill orders
- AC:
  - View stock by location
  - Low-stock alerts (< reorder point)
  - Reserve inventory when order placed
  - Release inventory if order cancelled

**Story 2.2: Inter-Location Transfers**
- As a manager, I want to transfer inventory between locations, so I balance stock
- AC:
  - Create transfer request
  - Approve/deny transfer
  - Track transfer status (pending/in-transit/received)
  - Update quantities atomically

#### Epic 3: Service Scheduling
**Story 3.1: Appointment Booking**
- As a customer, I want to book installation appointments, so I get tires installed
- AC:
  - View available time slots
  - Select location, service type, date/time
  - Receive confirmation email
  - Reminder 24h before appointment

### Non-Functional Requirements

**Performance**:
- Product search: < 2s response time
- Checkout: < 1s (excluding payment processing)
- Handle 1000 concurrent users
- Database queries: < 100ms for 95th percentile

**Security**:
- Authentication: JWT (15min access, 7-day refresh tokens)
- Authorization: RBAC (Customer, Staff, Admin roles)
- Payments: PCI-DSS via Stripe (never store raw card data)
- Encryption: TLS 1.3 (transit), AES-256 (database)

**Reliability**:
- Uptime: 99.9% (< 45min downtime/month)
- Backups: Daily automated with 30-day retention
- Error handling: Graceful degradation, user-friendly messages
- Payment retries: Webhook retry logic with idempotency

**Scalability**:
- Start with 2-5 locations, scale to 20
- Support 10K products, 100K orders/year
- Redis caching for hot data (product catalog, inventory counts)
- CDN (Cloudflare) for images

### Technical Constraints
- **Stack**: React + TypeScript (frontend), Node.js + Express (backend), PostgreSQL (database)
- **Deployment**: Docker Compose (dev), AWS EC2 or Render (production)
- **Budget**: $50K development, ~$300/month hosting
- **Timeline**: 6-8 weeks MVP, then iterative releases

### Assumptions
- Users have internet and modern browsers (Chrome, Firefox, Safari, Edge)
- Stripe handles all payment processing (PCI compliance)
- Product data imported from supplier APIs
- No international shipping (US only for MVP)

### Risks
| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Stripe API downtime | High | Low | Webhook retry, idempotency keys |
| Database performance | Medium | Medium | Indexes, connection pooling, Redis cache |
| Scope creep | High | High | Strict MVP definition, Phase 2 backlog |

---

## Example 2: SaaS Invoice Management System

### Project Context
- **Business Objective**: Help freelancers create and track invoices easily
- **Target Users**: Freelancers, consultants, small service businesses (1-10 employees)
- **Success Criteria**: 1000 users in 6 months, 10% conversion to paid ($15/month)
- **Out of Scope**: Expense tracking, time tracking (Phase 2)

### Functional Requirements

#### Epic 1: Invoice Creation
**Story 1.1: Create Invoice**
- As a freelancer, I want to create professional invoices, so I get paid for work
- AC:
  - Add client details (name, email, address)
  - Add line items (description, quantity, rate)
  - Auto-calculate subtotal, tax, total
  - Save client for reuse
  - Preview before sending

**Story 1.2: Customizable Branding**
- As a freelancer, I want to add my logo and colors, so invoices look professional
- AC:
  - Upload logo (max 2MB, PNG/JPG)
  - Choose primary color (hex picker)
  - Preview updates in real-time
  - Apply to all future invoices

#### Epic 2: Invoice Delivery
**Story 2.1: Email Invoices**
- As a freelancer, I want to email invoices from the app, so I don't manually attach files
- AC:
  - Send via email with customizable message
  - Auto-generate PDF
  - Track when client opens email
  - Resend if not opened in 7 days

**Story 2.2: Payment Link**
- As a freelancer, I want clients to pay via Stripe link, so I get paid faster
- AC:
  - Include "Pay Now" button in email
  - Stripe-hosted payment page
  - Auto-mark invoice as paid when payment succeeds
  - Send payment receipt to client

#### Epic 3: Payment Tracking
**Story 3.1: Dashboard**
- As a freelancer, I want to see unpaid invoices, so I follow up proactively
- AC:
  - List all invoices (unpaid highlighted)
  - Filter by status (draft/sent/viewed/paid)
  - Show total outstanding amount
  - Send payment reminders (1-click)

### Non-Functional Requirements

**Performance**:
- Invoice creation: < 1s
- PDF generation: < 3s
- Dashboard load: < 2s

**Security**:
- Authentication: Email/password + OAuth (Google)
- Authorization: Each user sees only their invoices
- Stripe keys: Encrypted in database
- Rate limiting: 100 invoices/day per user (free tier)

**Reliability**:
- Uptime: 99.5% (acceptable for freemium)
- Email delivery: Retry failed sends 3 times
- Data backups: Daily

**Usability**:
- Mobile responsive (80% users on mobile)
- Accessibility: Keyboard navigation, screen reader support
- Onboarding: 5-minute guided setup

### Technical Constraints
- **Stack**: Next.js (frontend + backend), Supabase (database + auth), Resend (email)
- **Deployment**: Vercel (free tier initially)
- **Budget**: $0 infrastructure initially (free tiers), scale to $100/month at 1000 users
- **Timeline**: 4 weeks MVP

### Assumptions
- Stripe integration handles all payment complexity
- PDF generation uses library (e.g., PDFKit, not manual HTML-to-PDF)
- Users trust email delivery (no SMS notifications needed)

---

## Example 3: Internal Analytics Dashboard

### Project Context
- **Business Objective**: Give leadership visibility into key metrics (sales, support, engineering)
- **Target Users**: C-suite executives, department heads (20 users)
- **Success Criteria**: Replace 10+ spreadsheets with single dashboard, used daily
- **Out of Scope**: Raw data exploration (use Metabase for that)

### Functional Requirements

#### Epic 1: Data Integration
**Story 1.1: Connect Data Sources**
- As an admin, I want to connect Postgres, Stripe, Zendesk, so dashboard shows live data
- AC:
  - OAuth or API key authentication
  - Test connection before saving
  - Handle API rate limits gracefully
  - Refresh data every 5 minutes

#### Epic 2: Visualizations
**Story 2.1: Sales Metrics**
- As a CEO, I want to see monthly revenue trend, so I track growth
- AC:
  - Line chart with 12 months of data
  - Compare to previous period (% change)
  - Drill down to weekly/daily
  - Export to CSV

**Story 2.2: Support Metrics**
- As a Head of Support, I want to see ticket resolution time, so I improve SLAs
- AC:
  - Average resolution time (last 30 days)
  - Trend over time (improving/declining)
  - Breakdown by priority (high/medium/low)
  - Alert if SLA breached

#### Epic 3: Customization
**Story 3.1: Custom Dashboards**
- As a user, I want to create personal dashboards, so I see relevant metrics
- AC:
  - Drag-and-drop widgets
  - Save multiple dashboard layouts
  - Share dashboard with team (read-only link)
  - Schedule email snapshots (daily/weekly)

### Non-Functional Requirements

**Performance**:
- Dashboard load: < 3s (with 20 widgets)
- Chart rendering: < 500ms
- Data refresh: Every 5 minutes (background job)

**Security**:
- Authentication: SSO (Okta)
- Authorization: Row-level security (users see only their department data)
- API keys: Encrypted, never exposed to frontend

**Reliability**:
- Uptime: 99.9% during business hours (6am-6pm)
- Data staleness: Acceptable up to 10 minutes
- Graceful degradation: Show last known good data if API down

### Technical Constraints
- **Stack**: React + TypeScript, Python (FastAPI), PostgreSQL, Redis
- **Deployment**: Internal Kubernetes cluster
- **Budget**: $5K development (internal team), $500/month compute
- **Timeline**: 6 weeks

### Assumptions
- All data sources have APIs
- Users have SSO credentials (no separate signup)
- Real-time updates not required (5-minute lag acceptable)

---

## Common Patterns Across Examples

### 1. Always Define Users and Use Cases
Every example specifies:
- WHO uses it (personas)
- WHAT they need to do (jobs-to-be-done)
- WHY they need it (business value)

### 2. Prioritize with MoSCoW
- **Must Have**: Core functionality for MVP
- **Should Have**: Important but can wait
- **Could Have**: Nice-to-have enhancements
- **Won't Have**: Explicitly deferred

### 3. Quantify Non-Functional Requirements
- Performance: < 3s, not "fast"
- Security: HTTPS + JWT, not "secure"
- Reliability: 99.9%, not "highly available"

### 4. Document Assumptions and Risks
- Assumptions: What we believe to be true (may change)
- Risks: What could go wrong (with mitigation plans)

### 5. Technical Constraints Drive Architecture
- Budget → Choose managed services vs. self-hosted
- Timeline → MVP scope, not feature-complete
- Team skills → Pick familiar technologies
