# Domain-Specific Requirements Checklists

## E-Commerce Requirements

### Product Management
- [ ] Product catalog with search/filter
- [ ] Product variants (size, color, etc.)
- [ ] Inventory tracking (quantity on hand, reserved)
- [ ] Product images (multiple angles, zoom)
- [ ] Product reviews and ratings
- [ ] Product recommendations ("you may also like")
- [ ] SKU/barcode management
- [ ] Product categories and tags
- [ ] Bulk product import/export

### Shopping Experience
- [ ] Shopping cart (guest and authenticated)
- [ ] Wishlist / favorites
- [ ] Product comparison tool
- [ ] Size/compatibility guides
- [ ] Gift wrapping options
- [ ] Product availability notifications
- [ ] Recently viewed products
- [ ] Search with autocomplete
- [ ] Advanced filtering (price, brand, ratings)

### Checkout & Payments
- [ ] Guest checkout vs. account required
- [ ] Multiple payment methods (cards, wallets, PayPal)
- [ ] Saved payment methods
- [ ] Shipping address validation
- [ ] Multiple shipping addresses
- [ ] Shipping cost calculation
- [ ] Tax calculation (by jurisdiction)
- [ ] Discount codes / promotions
- [ ] Gift cards / store credit
- [ ] Order review before final submission

### Order Management
- [ ] Order confirmation (email + page)
- [ ] Order tracking with status updates
- [ ] Order history (customer view)
- [ ] Order cancellation (before shipping)
- [ ] Returns and refunds process
- [ ] Exchange process
- [ ] Partial refunds
- [ ] Order notes (customer to seller)
- [ ] Invoice generation

### Customer Account
- [ ] Registration (email, social login)
- [ ] Email verification
- [ ] Password reset
- [ ] Profile management
- [ ] Address book
- [ ] Payment methods management
- [ ] Order history
- [ ] Wishlist
- [ ] Notifications preferences
- [ ] Account deletion (GDPR)

### Admin Panel
- [ ] Product CRUD
- [ ] Order management (view, update status, refund)
- [ ] Customer management
- [ ] Inventory management
- [ ] Reports (sales, products, customers)
- [ ] Discount code management
- [ ] Email template management
- [ ] User roles and permissions

---

## SaaS Application Requirements

### User Management
- [ ] Signup (email, SSO, invitation-only)
- [ ] Email verification
- [ ] Multi-factor authentication (MFA)
- [ ] Password policies (complexity, expiration)
- [ ] User roles and permissions (RBAC)
- [ ] Team/organization management
- [ ] User invitations
- [ ] User deactivation/deletion
- [ ] Audit logs (who did what when)

### Subscription & Billing
- [ ] Pricing tiers (free, paid, enterprise)
- [ ] Free trial (duration, credit card required?)
- [ ] Subscription management (upgrade, downgrade)
- [ ] Payment method management
- [ ] Billing history and invoices
- [ ] Usage-based billing (if applicable)
- [ ] Seat-based billing (if multi-user)
- [ ] Annual vs. monthly plans
- [ ] Subscription cancellation
- [ ] Proration on plan changes
- [ ] Failed payment handling
- [ ] Dunning (retry failed payments)

### Data & Privacy
- [ ] Data export (CSV, JSON)
- [ ] Data import (bulk upload)
- [ ] Data retention policies
- [ ] Data deletion (account closure)
- [ ] GDPR compliance (consent, right to be forgotten)
- [ ] Data encryption (rest and transit)
- [ ] Backup and recovery
- [ ] Multi-region data residency (if international)

### Integrations
- [ ] API documentation (RESTful, GraphQL)
- [ ] API keys/tokens management
- [ ] Webhooks (event notifications)
- [ ] OAuth integrations (Google, Slack, etc.)
- [ ] Third-party app marketplace
- [ ] Import from competitors (migration tool)
- [ ] Export to other tools

### Notifications
- [ ] Email notifications
- [ ] In-app notifications
- [ ] Push notifications (mobile)
- [ ] SMS notifications (optional)
- [ ] Notification preferences (per-type opt-in/out)
- [ ] Digest emails (daily, weekly summary)

### Analytics & Reporting
- [ ] Usage analytics (features used, time spent)
- [ ] User activity logs
- [ ] Custom reports
- [ ] Export reports (PDF, CSV, Excel)
- [ ] Dashboards (configurable widgets)
- [ ] Scheduled reports (email delivery)

---

## Mobile App Requirements

### Core Functionality
- [ ] User authentication (email, phone, biometric)
- [ ] Onboarding flow (tutorial, permissions)
- [ ] Push notifications
- [ ] Offline mode (cache data locally)
- [ ] Sync when online
- [ ] Deep linking (open specific screens)
- [ ] Camera access (photo upload, QR scanner)
- [ ] Location services (GPS)
- [ ] Contacts access (if sharing features)

### Performance
- [ ] App launch time (< 3s)
- [ ] Screen transitions (smooth 60 FPS)
- [ ] Image loading (progressive, lazy)
- [ ] Network error handling (offline indicators)
- [ ] Battery optimization
- [ ] Memory management (no leaks)

### Platform-Specific
- [ ] iOS support (minimum version?)
- [ ] Android support (minimum version?)
- [ ] Tablet support (adaptive layouts)
- [ ] Dark mode
- [ ] Accessibility (VoiceOver, TalkBack)
- [ ] Localization (languages)
- [ ] App store assets (screenshots, description)
- [ ] App store guidelines compliance

### Updates & Maintenance
- [ ] Over-the-air updates (hot code push)
- [ ] App version checking
- [ ] Force update mechanism
- [ ] Crash reporting (Sentry, Crashlytics)
- [ ] Analytics (Firebase, Mixpanel)
- [ ] Feature flags (gradual rollout)

---

## Internal Dashboard / Admin Tool Requirements

### Data Sources
- [ ] Database connections (Postgres, MySQL, etc.)
- [ ] API integrations (Stripe, Zendesk, etc.)
- [ ] File uploads (CSV, Excel)
- [ ] Real-time data streams (websockets)
- [ ] Scheduled data refresh

### Visualizations
- [ ] Line charts (trends over time)
- [ ] Bar charts (comparisons)
- [ ] Pie charts (proportions)
- [ ] Tables (sortable, filterable)
- [ ] KPI cards (big numbers with trends)
- [ ] Heatmaps
- [ ] Geo maps (if location data)

### Interactivity
- [ ] Date range picker
- [ ] Filters (department, region, product)
- [ ] Drill-down (click chart to see details)
- [ ] Export (CSV, PDF, PNG)
- [ ] Save views (bookmark filter combinations)
- [ ] Share dashboards (links, embeds)
- [ ] Scheduled reports (email delivery)

### User Management
- [ ] SSO integration (Okta, Auth0)
- [ ] Role-based access (CEO sees all, managers see department)
- [ ] Audit logs (track who viewed what)
- [ ] Custom roles and permissions

### Performance
- [ ] Dashboard load time (< 3s)
- [ ] Query optimization (indexes, caching)
- [ ] Pagination (large datasets)
- [ ] Lazy loading (load charts as scrolled)
- [ ] Background jobs (heavy computations)

---

## API Requirements

### Core Functionality
- [ ] RESTful endpoints (or GraphQL schema)
- [ ] Versioning (/v1/, /v2/)
- [ ] Authentication (API keys, OAuth, JWT)
- [ ] Authorization (scopes, permissions)
- [ ] Rate limiting (requests per minute/hour)
- [ ] Pagination (cursor or offset-based)
- [ ] Filtering and sorting
- [ ] Search functionality
- [ ] Webhooks (event notifications)
- [ ] Idempotency (duplicate request handling)

### Documentation
- [ ] OpenAPI / Swagger spec
- [ ] Interactive API explorer (Swagger UI, Postman)
- [ ] Code examples (cURL, Python, JS)
- [ ] Error codes and messages
- [ ] Authentication guide
- [ ] Quickstart tutorial
- [ ] Changelog (version history)

### Performance
- [ ] Response time SLA (< 500ms for 95th percentile)
- [ ] Caching (Redis, CDN)
- [ ] Compression (gzip, br)
- [ ] Connection pooling (database)
- [ ] Async processing (long-running tasks)

### Reliability
- [ ] Health check endpoint (/health)
- [ ] Uptime monitoring (Pingdom, UptimeRobot)
- [ ] Error tracking (Sentry)
- [ ] Retry logic (exponential backoff)
- [ ] Circuit breaker (fail fast if service down)
- [ ] Graceful degradation

### Security
- [ ] HTTPS only (TLS 1.3)
- [ ] Input validation (sanitize all inputs)
- [ ] Output encoding (prevent XSS)
- [ ] SQL injection protection (parameterized queries)
- [ ] CORS configuration (whitelist origins)
- [ ] Security headers (CSP, HSTS, X-Frame-Options)
- [ ] API key rotation
- [ ] Audit logging (track all API calls)

---

## Compliance Requirements

### GDPR (EU Data Privacy)
- [ ] Consent mechanism (opt-in)
- [ ] Right to access (user can view their data)
- [ ] Right to rectification (user can correct data)
- [ ] Right to erasure (user can delete account)
- [ ] Right to portability (export data)
- [ ] Data breach notification (72-hour window)
- [ ] Privacy policy (clear, accessible)
- [ ] Data processing agreements (with vendors)

### PCI-DSS (Payment Card Industry)
- [ ] Never store full card numbers
- [ ] Never store CVV/CVC
- [ ] Use payment gateway (Stripe, PayPal)
- [ ] Secure transmission (HTTPS)
- [ ] Access controls (who can see payment data)
- [ ] Logging and monitoring (payment events)

### HIPAA (Healthcare Data)
- [ ] Encryption (rest and transit)
- [ ] Access controls (role-based)
- [ ] Audit logs (track all access)
- [ ] Business associate agreements (BAAs with vendors)
- [ ] Data backup and recovery
- [ ] Incident response plan

### SOC 2 (Security & Availability)
- [ ] Security policies documented
- [ ] Access controls (MFA, least privilege)
- [ ] Monitoring and alerting
- [ ] Vulnerability scanning
- [ ] Penetration testing
- [ ] Incident response plan
- [ ] Business continuity plan
- [ ] Annual audit by third party

---

## Non-Functional Requirements Checklist

### Performance
- [ ] Page load time targets
- [ ] API response time targets
- [ ] Database query optimization
- [ ] Caching strategy
- [ ] CDN for static assets
- [ ] Load testing plan

### Security
- [ ] Authentication method
- [ ] Authorization model
- [ ] Data encryption
- [ ] Input validation
- [ ] Rate limiting
- [ ] Security audit plan

### Reliability
- [ ] Uptime target (SLA)
- [ ] Backup strategy
- [ ] Disaster recovery plan
- [ ] Error handling
- [ ] Monitoring and alerting

### Scalability
- [ ] Expected growth
- [ ] Scaling strategy (horizontal/vertical)
- [ ] Database scaling plan
- [ ] Load balancing

### Usability
- [ ] Mobile responsive
- [ ] Accessibility standards
- [ ] Browser support
- [ ] Internationalization

### Maintainability
- [ ] Logging strategy
- [ ] Debugging tools
- [ ] Update process
- [ ] Documentation
