# Fleet Management System - Comprehensive Verification Plan

## Executive Summary
This document provides a systematic approach to verify that the Fleet Management System is:
- ✅ 100% free of mock data
- ✅ FedRAMP compliant
- ✅ All AI features connected and working
- ✅ Every button, page, link, calculation, and feature fully functional

---

## Phase 1: Data Layer Verification (No Mock Data)

### 1.1 Identify All Mock Data Sources
**Location**: `src/lib/mockData.ts`
**Action**: Remove or disable all mock data generators

```typescript
// Files to audit:
- src/lib/mockData.ts (REMOVE)
- src/hooks/use-fleet-data.ts (Replace with API calls)
- src/lib/kv.ts (Remove localStorage, use API)
```

### 1.2 Database Connection Verification
**Objective**: Ensure PostgreSQL is connected and all schemas exist

```bash
# Test database connectivity
kubectl exec -it fleet-postgres-0 -n fleet-management -- psql -U fleetadmin -d fleetdb -c "SELECT version();"

# Verify schemas exist
kubectl exec -it fleet-postgres-0 -n fleet-management -- psql -U fleetadmin -d fleetdb -c "\dt"
```

**Required Tables**:
- [ ] vehicles
- [ ] drivers
- [ ] facilities
- [ ] work_orders
- [ ] maintenance_schedules
- [ ] fuel_transactions
- [ ] routes
- [ ] geofences
- [ ] telemetry_data
- [ ] inspection_forms
- [ ] osha_reports
- [ ] safety_incidents
- [ ] policies
- [ ] video_events
- [ ] charging_stations
- [ ] purchase_orders
- [ ] communication_logs
- [ ] users
- [ ] tenants (multi-tenancy)
- [ ] audit_logs (FedRAMP requirement)

### 1.3 API Backend Implementation
**Objective**: Build complete REST API with all CRUD endpoints

**Required Endpoints**:
```
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/vehicles
POST   /api/vehicles
PUT    /api/vehicles/:id
DELETE /api/vehicles/:id
GET    /api/drivers
POST   /api/drivers
PUT    /api/drivers/:id
DELETE /api/drivers/:id
GET    /api/work-orders
POST   /api/work-orders
PUT    /api/work-orders/:id
DELETE /api/work-orders/:id
... (repeat for all 31 modules)
```

### 1.4 Frontend API Integration
**Objective**: Replace all localStorage/mock data with API calls

**Files to Update**:
- [ ] `src/hooks/use-fleet-data.ts` - Replace with `useSWR` or `react-query`
- [ ] `src/hooks/use-kv.ts` - Remove or convert to API cache
- [ ] All components using `useKV` - Replace with API hooks

---

## Phase 2: FedRAMP Compliance Verification

### 2.1 Access Control (AC)
- [ ] **AC-2**: Account Management - User provisioning/deprovisioning
- [ ] **AC-3**: Access Enforcement - RBAC implemented
- [ ] **AC-6**: Least Privilege - Role-based permissions
- [ ] **AC-7**: Failed Login Attempts - Account lockout after 3 failures
- [ ] **AC-8**: System Use Notification - Login banner displayed
- [ ] **AC-17**: Remote Access - VPN/bastion for admin access

**Verification**:
```bash
# Test account lockout
curl -X POST http://68.220.148.2/api/auth/login -d '{"email":"test@test.com","password":"wrong"}' -H "Content-Type: application/json"
# After 3 attempts, should receive 423 Locked

# Test RBAC
curl -H "Authorization: Bearer <driver-token>" http://68.220.148.2/api/admin/users
# Should receive 403 Forbidden
```

### 2.2 Audit and Accountability (AU)
- [ ] **AU-2**: Audit Events - All system events logged
- [ ] **AU-3**: Audit Record Content - Who, what, when, where, outcome
- [ ] **AU-6**: Audit Review - Dashboard for reviewing logs
- [ ] **AU-9**: Protection of Audit Information - Immutable logs
- [ ] **AU-12**: Audit Generation - Automated logging across all systems

**Verification**:
```sql
-- Check audit logs table
SELECT * FROM audit_logs WHERE created_at > NOW() - INTERVAL '1 hour' ORDER BY created_at DESC LIMIT 100;

-- Verify audit log integrity
SELECT COUNT(*) FROM audit_logs WHERE hash IS NULL OR hash = '';
-- Should return 0
```

### 2.3 System and Communications Protection (SC)
- [ ] **SC-7**: Boundary Protection - Firewall rules configured
- [ ] **SC-8**: Transmission Confidentiality - TLS 1.2+ only
- [ ] **SC-12**: Cryptographic Key Management - Azure Key Vault
- [ ] **SC-13**: Cryptographic Protection - AES-256 for data at rest
- [ ] **SC-28**: Data at Rest Protection - Database encryption enabled

**Verification**:
```bash
# Test TLS version
openssl s_client -connect 68.220.148.2:443 -tls1_2

# Verify database encryption
kubectl exec -it fleet-postgres-0 -n fleet-management -- psql -U fleetadmin -d fleetdb -c "SHOW ssl;"
# Should return 'on'

# Check Azure Key Vault integration
az keyvault secret list --vault-name fleet-keyvault
```

### 2.4 System and Information Integrity (SI)
- [ ] **SI-2**: Flaw Remediation - CVE scanning enabled
- [ ] **SI-3**: Malicious Code Protection - Container scanning
- [ ] **SI-4**: Information System Monitoring - Azure Monitor enabled
- [ ] **SI-10**: Input Validation - All user inputs sanitized
- [ ] **SI-11**: Error Handling - No sensitive info in errors

**Verification**:
```bash
# Test input validation
curl -X POST http://68.220.148.2/api/vehicles -d '{"vin":"<script>alert(1)</script>"}' -H "Content-Type: application/json"
# Should return 400 Bad Request with sanitized error

# Check container vulnerability scanning
az acr repository show-tags --name fleetappregistry --repository fleet-app --query "[?contains(@, 'latest')]"
trivy image fleetappregistry.azurecr.io/fleet-app:latest
```

---

## Phase 3: AI Integration Verification

### 3.1 OpenAI Integration
**Features Using OpenAI**:
- Natural language queries in Analytics module
- AI Assistant chatbot
- Receipt processing (OCR + GPT-4)

**Verification**:
```bash
# Test OpenAI API key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# Test natural language query
curl -X POST http://68.220.148.2/api/analytics/query \
  -d '{"query":"Show me vehicles with fuel efficiency below 15 MPG"}' \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>"
```

### 3.2 Claude Integration
**Features Using Claude**:
- Document analysis
- Policy recommendations
- Complex reasoning tasks

**Verification**:
```bash
# Test Claude API key
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $CLAUDE_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "Content-Type: application/json" \
  -d '{"model":"claude-3-sonnet-20240229","max_tokens":10,"messages":[{"role":"user","content":"Hi"}]}'
```

### 3.3 Azure OpenAI Integration
**Features Using Azure OpenAI**:
- Predictive maintenance forecasting
- Route optimization suggestions

**Verification**:
```bash
# Test Azure OpenAI endpoint
curl https://andre-m9qftqda-eastus2.cognitiveservices.azure.com/openai/deployments/gpt-4.5-preview/chat/completions?api-version=2023-05-15 \
  -H "api-key: $AZURE_OPENAI_KEY" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello"}]}'
```

### 3.4 Other AI Services
- [ ] **Perplexity AI**: Research and external data queries
- [ ] **Gemini**: Vision tasks (damage assessment)
- [ ] **Hume AI**: Driver emotion/stress detection
- [ ] **Mistral AI**: Multilingual support

---

## Phase 4: Comprehensive Feature Testing

### 4.1 Authentication & Authorization
- [ ] Login works with real database users
- [ ] Password reset via email (sara@capitaltechalliance.com)
- [ ] Multi-factor authentication (MFA) option
- [ ] Role-based access control (Admin, Fleet Manager, Driver, Technician)
- [ ] Session timeout after 30 minutes inactivity
- [ ] Audit log entry on login/logout

### 4.2 Dashboard Module
- [ ] Real-time metrics displayed (vehicles, drivers, work orders)
- [ ] Charts populated with real database data
- [ ] Alerts/notifications work
- [ ] Quick actions link to correct pages
- [ ] Widget customization persists to database

### 4.3 Fleet Management Module (31 Features)
**GPS Tracking**:
- [ ] Map displays with Azure Maps
- [ ] Vehicle markers show real GPS coordinates
- [ ] Vehicle filtering works
- [ ] Click vehicle marker shows popup with details
- [ ] Real-time location updates every 30 seconds

**Vehicle Management**:
- [ ] Add new vehicle → saves to database
- [ ] Edit vehicle → updates database
- [ ] Delete vehicle → removes from database with confirmation
- [ ] VIN validation works
- [ ] Upload vehicle photos → stores in Azure Blob Storage
- [ ] Vehicle history shows all events

**Driver Management**:
- [ ] Add/edit/delete drivers
- [ ] Driver license expiration alerts
- [ ] Driver safety scores calculated correctly
- [ ] Driver assignments to vehicles work
- [ ] Driver performance reports generated

**Work Orders**:
- [ ] Create work order → saves to database
- [ ] Assign technician → updates database
- [ ] Upload photos → Azure Blob Storage
- [ ] Status changes tracked in audit log
- [ ] Work order calculations (labor + parts = total) accurate
- [ ] Work order completion triggers email notification

**Maintenance Schedules**:
- [ ] Predictive maintenance based on mileage/engine hours
- [ ] Maintenance alerts sent before due date
- [ ] Maintenance history tracked
- [ ] Recurring maintenance schedules work
- [ ] Integration with work orders

**Fuel Management**:
- [ ] Fuel transactions recorded
- [ ] Fuel efficiency calculations accurate (MPG = Miles / Gallons)
- [ ] Fuel cost tracking
- [ ] Integration with FDOT rates API
- [ ] Fuel card reconciliation

**Route Management**:
- [ ] Create routes with waypoints
- [ ] Route optimization suggests best path
- [ ] Map displays route on Azure Maps
- [ ] Delivery tracking
- [ ] Route completion updates database

**Geofencing**:
- [ ] Create geofence on map
- [ ] Geofence breach alerts work
- [ ] Geofence history tracked
- [ ] Multiple geofences supported

**Inspections**:
- [ ] Pre-trip inspection forms
- [ ] Custom form builder works
- [ ] Signature capture
- [ ] Photo attachments
- [ ] Inspection results saved to database

**OSHA & Safety**:
- [ ] OSHA forms (300, 300A, 301) generated
- [ ] Safety incident reporting
- [ ] Safety training tracking
- [ ] Safety metrics dashboard

**Telematics**:
- [ ] Live vehicle telemetry data
- [ ] Diagnostic trouble codes (DTCs)
- [ ] Engine fault alerts
- [ ] Integration with OBD2 devices

**Video Telematics**:
- [ ] Video events display
- [ ] Video playback works
- [ ] Event filtering (harsh braking, speeding, etc.)
- [ ] Video download

**EV Charging**:
- [ ] Charging station map
- [ ] Start/stop charging session
- [ ] Charging cost calculations
- [ ] Battery health monitoring

**Procurement**:
- [ ] Create purchase orders
- [ ] Vendor management
- [ ] Approval workflow
- [ ] Purchase order tracking

**Communication Logs**:
- [ ] Log communications
- [ ] Searchable history
- [ ] Integration with email/SMS

**AI Assistant**:
- [ ] Chatbot responds with OpenAI
- [ ] Context-aware answers
- [ ] Action suggestions (create work order, etc.)

**Analytics**:
- [ ] Natural language queries work
- [ ] Reports generated correctly
- [ ] Data visualizations accurate
- [ ] Export to PDF/Excel

**Policy Engine**:
- [ ] Create/edit policies
- [ ] Policy enforcement rules
- [ ] Policy violation alerts

**Receipt Processing**:
- [ ] Upload receipt image
- [ ] OCR extracts data
- [ ] Data accuracy verified
- [ ] Saves to fuel transactions or expenses

**Enhanced Map Layers**:
- [ ] Weather overlay works
- [ ] Traffic overlay works
- [ ] Layer toggles work
- [ ] Map layers persist

**Route Optimization**:
- [ ] Multi-stop route optimization
- [ ] Time window constraints
- [ ] Vehicle capacity constraints
- [ ] Optimization results accurate

... (Continue for all 31 modules)

---

## Phase 5: Automated Testing

### 5.1 Unit Tests
```bash
npm run test:unit
# All tests should pass
```

### 5.2 Integration Tests
```bash
npm run test:integration
# All API endpoints should return 200/201 with valid data
```

### 5.3 End-to-End Tests
```bash
npx playwright test
# All E2E tests should pass
```

### 5.4 Security Testing
```bash
# OWASP ZAP scan
docker run -t owasp/zap2docker-stable zap-baseline.py -t http://68.220.148.2

# SQL injection testing
sqlmap -u "http://68.220.148.2/api/vehicles?id=1" --batch

# XSS testing
curl -X POST http://68.220.148.2/api/vehicles -d '{"name":"<script>alert(1)</script>"}' -H "Content-Type: application/json"
```

### 5.5 Performance Testing
```bash
# Load testing with k6
k6 run load-test.js
# Should handle 1000 concurrent users without errors
```

---

## Phase 6: Production Verification Checklist

### 6.1 Infrastructure
- [ ] Application deployed to AKS: http://68.220.148.2
- [ ] PostgreSQL database running and connected
- [ ] Redis cache running
- [ ] Azure Blob Storage configured for file uploads
- [ ] Azure Key Vault storing secrets
- [ ] Azure Monitor collecting logs
- [ ] SSL/TLS certificate valid

### 6.2 Data Verification
- [ ] Zero mock data in production
- [ ] All data comes from PostgreSQL
- [ ] No localStorage usage except auth tokens
- [ ] Database backups configured (daily)
- [ ] Data retention policies implemented

### 6.3 Security Verification
- [ ] All FedRAMP controls implemented
- [ ] No secrets in code or environment variables
- [ ] Secrets stored in Azure Key Vault
- [ ] Container images scanned for vulnerabilities
- [ ] Network policies configured
- [ ] Pod security policies enforced

### 6.4 AI Verification
- [ ] All AI API keys valid and working
- [ ] Rate limits not exceeded
- [ ] Error handling for AI service failures
- [ ] Fallback mechanisms in place

### 6.5 Functionality Verification
- [ ] Every page loads without errors
- [ ] Every button performs correct action
- [ ] Every link navigates correctly
- [ ] All calculations accurate
- [ ] All forms validate and submit
- [ ] All CRUD operations work
- [ ] All real-time updates work

---

## Phase 7: Final Production Deployment

### 7.1 Pre-Deployment Checklist
- [ ] All tests passing (unit, integration, E2E)
- [ ] Security scan clean
- [ ] Performance benchmarks met
- [ ] Documentation complete
- [ ] Backup and rollback plan ready

### 7.2 Deployment Steps
```bash
# 1. Build production image
npm run build
docker build -t fleetappregistry.azurecr.io/fleet-app:v1.0.0 .

# 2. Push to registry
docker push fleetappregistry.azurecr.io/fleet-app:v1.0.0

# 3. Deploy to AKS
kubectl set image deployment/fleet-app fleet-app=fleetappregistry.azurecr.io/fleet-app:v1.0.0 -n fleet-management

# 4. Verify deployment
kubectl rollout status deployment/fleet-app -n fleet-management

# 5. Run smoke tests
npm run test:smoke
```

### 7.3 Post-Deployment Verification
```bash
# Health check
curl http://68.220.148.2/api/health
# Should return: {"status":"healthy","database":"connected","redis":"connected"}

# Test critical paths
# 1. Login
# 2. View dashboard
# 3. Add vehicle
# 4. Create work order
# 5. View GPS tracking map
```

---

## Success Criteria

### ✅ Zero Mock Data
- All data stored in PostgreSQL database
- No hardcoded test data in code
- No localStorage usage (except auth tokens)
- All API endpoints return real database data

### ✅ FedRAMP Compliance
- All required controls implemented (AC, AU, SC, SI)
- Security audit logs captured
- Encryption at rest and in transit
- Access controls enforced
- Audit trail complete

### ✅ AI Integration
- OpenAI connected and working
- Claude connected and working
- Azure OpenAI connected and working
- All AI features functional
- Error handling in place

### ✅ 100% Functionality
- All 31 modules working
- All buttons functional
- All links working
- All calculations accurate
- All forms validating
- All CRUD operations working
- All real-time updates working
- All maps rendering
- All reports generating

### ✅ Production Ready
- Application deployed to http://68.220.148.2
- SSL/TLS configured
- Database connected
- Monitoring enabled
- Backups configured
- Documentation complete

---

## Timeline Estimate

| Phase | Duration | Effort |
|-------|----------|--------|
| Phase 1: Data Layer | 2-3 days | High |
| Phase 2: FedRAMP Compliance | 3-5 days | Very High |
| Phase 3: AI Integration | 1-2 days | Medium |
| Phase 4: Feature Testing | 5-7 days | Very High |
| Phase 5: Automated Testing | 2-3 days | High |
| Phase 6: Production Verification | 1-2 days | Medium |
| Phase 7: Final Deployment | 1 day | Low |
| **Total** | **15-23 days** | **Very High** |

---

## Next Steps

1. **Immediate**: Create database schemas and API backend
2. **Short-term**: Replace mock data with real API calls
3. **Medium-term**: Implement FedRAMP controls and AI integrations
4. **Long-term**: Comprehensive testing and production deployment

This plan ensures a systematic approach to achieving 100% production readiness with no mock data, full FedRAMP compliance, and complete AI integration.
