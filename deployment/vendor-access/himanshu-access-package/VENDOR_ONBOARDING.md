# Fleet Management System - Vendor Onboarding Guide

**Document Version:** 1.0
**Last Updated:** 2025-11-09
**Classification:** Confidential - External Vendor Access

---

## Table of Contents

1. [Welcome & Overview](#welcome--overview)
2. [Project Context](#project-context)
3. [System Architecture](#system-architecture)
4. [Access Setup](#access-setup)
5. [Development Environment](#development-environment)
6. [Deployment Procedures](#deployment-procedures)
7. [Security Guidelines](#security-guidelines)
8. [Communication & Support](#communication--support)
9. [Acceptance Criteria](#acceptance-criteria)

---

## Welcome & Overview

### Purpose of This Document

Welcome to the Fleet Management System development project. This document provides everything you need to:
- Understand the system architecture and current state
- Set up your development environment
- Access development and staging environments
- Deploy code changes safely
- Follow security best practices
- Communicate effectively with the team

### Project Status

**Current State:**
- ✅ **Production:** Fully operational at http://68.220.148.2
- ⚠️ **Staging:** Partially deployed (awaiting cluster scaling)
- ⚠️ **Development:** Partially deployed (awaiting cluster scaling)

**Your Mission:**
Complete the remaining features, fix bugs, and prepare the system for production launch at fleet.capitaltechalliance.com

### Scope of Work

**Environments You Have Access To:**
- ✅ Development (fleet-dev namespace)
- ✅ Staging (fleet-staging namespace)
- ❌ Production (fleet-management namespace) - READ ONLY via documentation

**Permissions:**
- Development: Full access (create, update, delete resources)
- Staging: Limited access (read resources, update deployments, view logs)
- Production: No direct access (changes deployed via CI/CD)

---

## Project Context

### What is Fleet Management System?

A comprehensive SaaS platform for managing vehicle fleets, including:
- Vehicle tracking and telematics
- Maintenance scheduling and work orders
- Driver management and safety
- Fuel transaction monitoring
- Compliance and reporting
- AI-powered insights

### Technology Stack

**Frontend:**
- React 18.3 + TypeScript
- Vite build system
- Material-UI components
- Azure Maps integration
- Microsoft Authentication

**Backend:**
- Node.js 20 + Express
- TypeScript
- PostgreSQL 15 with JSONB
- Redis for caching
- OpenTelemetry for observability

**Infrastructure:**
- Azure Kubernetes Service (AKS)
- Azure Container Registry (ACR)
- NGINX Ingress Controller
- cert-manager for SSL
- Let's Encrypt certificates

**DevOps:**
- GitHub + Azure DevOps for source control
- Docker for containerization
- Kubernetes for orchestration
- Azure Application Insights for monitoring

### Current Feature Status

**Completed Features (✅):**
- User authentication with JWT
- Vehicle CRUD operations
- Driver management
- Maintenance scheduling (including recurring schedules)
- Work order management
- Fuel transaction tracking
- Route management
- Geofencing
- Vehicle inspections
- Safety incident tracking
- Video event management (dashcam integration)
- EV charging station management
- Purchase order tracking
- Policy management
- Facility and vendor management
- Real-time telemetry
- API documentation (Swagger)

**Pending Features (See docs/USER_STORIES.md):**
- Advanced analytics dashboards
- Predictive maintenance AI
- Mobile app development
- Teams integration
- Email notification center

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Azure Cloud Platform                     │
│                                                               │
│  ┌──────────────┐          ┌──────────────┐                │
│  │   Azure AD   │          │  Azure Maps  │                │
│  │ Authentication│          │   Services   │                │
│  └──────────────┘          └──────────────┘                │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Azure Kubernetes Service (AKS)                │  │
│  │                                                        │  │
│  │  ┌─────────────────┐  ┌─────────────────┐           │  │
│  │  │  fleet-dev      │  │ fleet-staging   │           │  │
│  │  │  Namespace      │  │  Namespace      │           │  │
│  │  │                 │  │                 │           │  │
│  │  │  - Frontend Pod │  │  - Frontend Pod │           │  │
│  │  │  - Backend Pod  │  │  - Backend Pod  │           │  │
│  │  │  - PostgreSQL   │  │  - PostgreSQL   │           │  │
│  │  │  - Redis        │  │  - Redis        │           │  │
│  │  └─────────────────┘  └─────────────────┘           │  │
│  │                                                        │  │
│  │  ┌─────────────────┐                                 │  │
│  │  │ fleet-management│  (Production - No Access)      │  │
│  │  │  Namespace      │                                 │  │
│  │  └─────────────────┘                                 │  │
│  │                                                        │  │
│  │  ┌─────────────────────────────────────────────┐    │  │
│  │  │         NGINX Ingress Controller            │    │  │
│  │  │         External IP: 20.15.65.2             │    │  │
│  │  └─────────────────────────────────────────────┘    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │     Azure Container Registry (fleetappregistry)      │  │
│  │     - fleet-app:dev, fleet-app:staging               │  │
│  │     - fleet-api:dev, fleet-api:staging               │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Database Schema

**Multi-tenant Architecture:**
- All tables have `tenant_id` column for data isolation
- Row-level security enforced at application level

**Key Tables:**
- `tenants` - Organization data
- `users` - User accounts with RBAC
- `vehicles` - Vehicle inventory
- `drivers` - Driver records
- `maintenance_schedules` - Recurring maintenance
- `work_orders` - Service requests
- `fuel_transactions` - Fuel usage
- `routes` - Delivery/service routes
- `geofences` - Virtual boundaries
- `inspections` - Vehicle inspections
- `safety_incidents` - Safety events
- `video_events` - Dashcam footage metadata
- `charging_stations` - EV charging infrastructure
- `charging_sessions` - Charging history

**Migrations:**
- Located in `api/src/migrations/`
- Run in order: 001, 002, 003, etc.
- Latest: `003-recurring-maintenance.sql`

### API Endpoints

**Base URL:**
- Dev: https://fleet-dev.capitaltechalliance.com/api
- Staging: https://fleet-staging.capitaltechalliance.com/api
- Production: https://fleet.capitaltechalliance.com/api

**Documentation:**
- Swagger UI: `/api/docs`
- OpenAPI Spec: `/api/openapi.json`

**Key Endpoint Groups:**
- `/api/auth` - Authentication
- `/api/vehicles` - Vehicle management
- `/api/drivers` - Driver management
- `/api/maintenance-schedules` - Maintenance
- `/api/work-orders` - Work orders
- `/api/fuel-transactions` - Fuel tracking
- `/api/telemetry` - Real-time vehicle data

Full endpoint documentation available at: docs/PROJECT_HANDOFF.md section 10

---

## Access Setup

### Prerequisites

**Required Software:**
- `kubectl` (Kubernetes CLI) - [Install Guide](https://kubernetes.io/docs/tasks/tools/)
- `az` (Azure CLI) - [Install Guide](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli)
- `docker` - [Install Guide](https://docs.docker.com/get-docker/)
- `git` - [Install Guide](https://git-scm.com/downloads)
- `node` v20+ - [Install Guide](https://nodejs.org/)
- `npm` v10+ - Comes with Node.js

**Verify Installation:**
```bash
kubectl version --client
az version
docker --version
git --version
node --version
npm --version
```

### Step 1: Receive Access Credentials

You should receive the following files securely encrypted:

1. **vendor-kubeconfig.yaml.gpg** - Kubernetes access configuration (encrypted)
2. **azure-devops-credentials.txt.gpg** - Azure DevOps PAT token (encrypted)
3. **decryption-password** - Provided via separate secure channel

**Decrypt Files:**
```bash
# Decrypt kubeconfig
gpg -d vendor-kubeconfig.yaml.gpg > vendor-kubeconfig.yaml

# Decrypt Azure DevOps credentials
gpg -d azure-devops-credentials.txt.gpg > azure-devops-credentials.txt

# Secure the files
chmod 600 vendor-kubeconfig.yaml
chmod 600 azure-devops-credentials.txt
```

### Step 2: Configure Kubernetes Access

**Set KUBECONFIG Environment Variable:**
```bash
# Add to your ~/.bashrc or ~/.zshrc
export KUBECONFIG=/path/to/vendor-kubeconfig.yaml

# Or set temporarily
export KUBECONFIG=$PWD/vendor-kubeconfig.yaml
```

**Test Access:**
```bash
# List available contexts
kubectl config get-contexts

# Switch to dev context
kubectl config use-context vendor-dev

# Test access
kubectl get pods -n fleet-dev

# Switch to staging context
kubectl config use-context vendor-staging

# Test access
kubectl get pods -n fleet-staging

# Test production access (should fail)
kubectl get pods -n fleet-management
# Expected: Error: Forbidden
```

### Step 3: Clone Repository

**GitHub Repository:**
```bash
git clone https://github.com/CapitalTechAlliance/Fleet.git
cd Fleet
```

**Azure DevOps Repository (Alternative):**
```bash
# Configure Azure DevOps PAT
az devops configure --defaults organization=https://dev.azure.com/CapitalTechAlliance

# Clone
git clone https://dev.azure.com/CapitalTechAlliance/FleetManagement/_git/Fleet
cd Fleet
```

### Step 4: Install Dependencies

**Backend:**
```bash
cd api
npm install
```

**Frontend:**
```bash
cd ..
npm install
```

### Step 5: Verify Access

**Check Kubernetes Resources:**
```bash
# Dev environment
kubectl get all -n fleet-dev

# Staging environment
kubectl get all -n fleet-staging
```

**View Logs:**
```bash
# Dev API logs
kubectl logs -f -l app=fleet-api -n fleet-dev

# Staging API logs
kubectl logs -f -l app=fleet-api -n fleet-staging
```

---

## Development Environment

### Local Development Setup

**Environment Variables:**

Create `.env.local` file in project root:
```env
# Backend
NODE_ENV=development
PORT=3001
LOG_LEVEL=debug

# Database (port-forward to dev database)
DB_HOST=localhost
DB_PORT=15432
DB_NAME=fleetdb_dev
DB_USER=fleetadmin
DB_PASSWORD=<get from secrets>

# Redis (port-forward to dev redis)
REDIS_HOST=localhost
REDIS_PORT=16379

# JWT
JWT_SECRET=dev-secret-change-in-production
JWT_EXPIRATION=24h

# CORS
CORS_ORIGIN=http://localhost:5173

# Frontend
VITE_API_URL=http://localhost:3001/api
VITE_ENVIRONMENT=development
VITE_AZURE_MAPS_SUBSCRIPTION_KEY=<get from secrets>
VITE_AZURE_CLIENT_ID=80fe6628-1dc4-41fe-894f-919b12ecc994
VITE_AZURE_TENANT_ID=0ec14b81-7b82-45ee-8f3d-cbc31ced5347
VITE_AZURE_AD_REDIRECT_URI=http://localhost:5173/auth/callback
```

**Get Secrets from Kubernetes:**
```bash
# Database password
kubectl get secret fleet-secrets -n fleet-dev -o jsonpath='{.data.db-password}' | base64 --decode

# Azure Maps key
kubectl get configmap fleet-config -n fleet-dev -o jsonpath='{.data.VITE_AZURE_MAPS_SUBSCRIPTION_KEY}'
```

**Port Forward to Dev Database:**
```bash
# In separate terminal
kubectl port-forward -n fleet-dev svc/fleet-postgres-dev 15432:5432
```

**Port Forward to Dev Redis:**
```bash
# In separate terminal
kubectl port-forward -n fleet-dev svc/fleet-redis-dev 16379:6379
```

**Run Backend Locally:**
```bash
cd api
npm run dev
# API available at http://localhost:3001
```

**Run Frontend Locally:**
```bash
cd ..
npm run dev
# Frontend available at http://localhost:5173
```

### Development Workflow

**1. Create Feature Branch:**
```bash
git checkout -b feature/your-feature-name
```

**2. Make Changes:**
- Write code following existing patterns
- Update tests if needed
- Follow TypeScript best practices

**3. Test Locally:**
```bash
# Run backend tests
cd api
npm test

# Run frontend tests
cd ..
npm test

# Manual testing at http://localhost:5173
```

**4. Commit Changes:**
```bash
git add .
git commit -m "feat: Add your feature description"
```

**5. Push to Remote:**
```bash
git push origin feature/your-feature-name
```

**6. Deploy to Dev Environment:**
See "Deployment Procedures" section below

### Testing Against Dev Environment

**Without Local Development:**
```bash
# Port forward to dev API
kubectl port-forward -n fleet-dev svc/fleet-api-dev 3000:3000

# Test endpoints
curl http://localhost:3000/api/health
curl http://localhost:3000/api/vehicles

# View API docs
open http://localhost:3000/api/docs
```

---

## Deployment Procedures

### Building Docker Images

**Backend Image:**
```bash
cd api
az acr build \
  --registry fleetappregistry \
  --image fleet-api:dev-$(git rev-parse --short HEAD) \
  --image fleet-api:dev \
  --file Dockerfile .
```

**Frontend Image:**
```bash
cd ..
az acr build \
  --registry fleetappregistry \
  --image fleet-app:dev-$(git rev-parse --short HEAD) \
  --image fleet-app:dev \
  --file Dockerfile .
```

### Deploying to Development

**Update API Deployment:**
```bash
kubectl set image deployment/fleet-api-dev \
  fleet-api=fleetappregistry.azurecr.io/fleet-api:dev \
  -n fleet-dev

# Wait for rollout
kubectl rollout status deployment/fleet-api-dev -n fleet-dev
```

**Update Frontend Deployment:**
```bash
kubectl set image deployment/fleet-app-dev \
  fleet-app=fleetappregistry.azurecr.io/fleet-app:dev \
  -n fleet-dev

# Wait for rollout
kubectl rollout status deployment/fleet-app-dev -n fleet-dev
```

**Verify Deployment:**
```bash
# Check pod status
kubectl get pods -n fleet-dev

# Check logs
kubectl logs -f -l app=fleet-api -n fleet-dev
```

### Deploying to Staging

**IMPORTANT:** Staging deployments should only be done after:
1. Testing in dev environment
2. Code review approval
3. Coordination with project lead

**Update Staging API:**
```bash
# Tag dev image for staging
az acr import \
  --name fleetappregistry \
  --source fleetappregistry.azurecr.io/fleet-api:dev \
  --image fleet-api:staging-$(git rev-parse --short HEAD)

# Update deployment
kubectl set image deployment/fleet-api-staging \
  fleet-api=fleetappregistry.azurecr.io/fleet-api:staging-$(git rev-parse --short HEAD) \
  -n fleet-staging

# Monitor rollout
kubectl rollout status deployment/fleet-api-staging -n fleet-staging
```

**Update Staging Frontend:**
```bash
# Tag dev image for staging
az acr import \
  --name fleetappregistry \
  --source fleetappregistry.azurecr.io/fleet-app:dev \
  --image fleet-app:staging-$(git rev-parse --short HEAD)

# Update deployment
kubectl set image deployment/fleet-app-staging \
  fleet-app=fleetappregistry.azurecr.io/fleet-app:staging-$(git rev-parse --short HEAD) \
  -n fleet-staging

# Monitor rollout
kubectl rollout status deployment/fleet-app-staging -n fleet-staging
```

### Rollback Procedure

**If deployment fails:**
```bash
# Rollback to previous version
kubectl rollout undo deployment/fleet-api-dev -n fleet-dev

# Or rollback to specific revision
kubectl rollout history deployment/fleet-api-dev -n fleet-dev
kubectl rollout undo deployment/fleet-api-dev --to-revision=2 -n fleet-dev
```

### Database Migrations

**Run Migration in Dev:**
```bash
# Copy migration file to PostgreSQL pod
kubectl cp api/src/migrations/004-new-migration.sql \
  fleet-postgres-dev-0:/tmp/migration.sql \
  -n fleet-dev

# Execute migration
kubectl exec -it fleet-postgres-dev-0 -n fleet-dev -- \
  psql -U fleetadmin -d fleetdb_dev -f /tmp/migration.sql
```

**Verify Migration:**
```bash
# Check tables
kubectl exec -it fleet-postgres-dev-0 -n fleet-dev -- \
  psql -U fleetadmin -d fleetdb_dev -c "\dt"

# Check specific table structure
kubectl exec -it fleet-postgres-dev-0 -n fleet-dev -- \
  psql -U fleetadmin -d fleetdb_dev -c "\d+ table_name"
```

---

## Security Guidelines

### Access Control

**DO:**
- ✅ Only access dev and staging environments
- ✅ Use provided kubeconfig file exclusively
- ✅ Keep credentials secure and encrypted
- ✅ Use strong passwords for all accounts
- ✅ Enable MFA where available

**DON'T:**
- ❌ Attempt to access production environment
- ❌ Share credentials with anyone
- ❌ Commit credentials to git
- ❌ Store credentials in plaintext
- ❌ Use personal accounts for project work

### Code Security

**Secure Coding Practices:**
- Never log sensitive data (passwords, tokens, PII)
- Use parameterized queries (prevent SQL injection)
- Validate all input data
- Sanitize user-generated content
- Use HTTPS for all external API calls
- Follow OWASP Top 10 guidelines

**Secrets Management:**
- Never hardcode secrets in code
- Use Kubernetes secrets for sensitive data
- Use environment variables for configuration
- Rotate credentials regularly

**Example - BAD:**
```typescript
// ❌ DON'T DO THIS
const password = 'hardcoded-password'
const query = `SELECT * FROM users WHERE email = '${userInput}'`
```

**Example - GOOD:**
```typescript
// ✅ DO THIS
const password = process.env.DB_PASSWORD
const query = 'SELECT * FROM users WHERE email = $1'
const result = await pool.query(query, [userInput])
```

### Data Protection

**Personal Identifiable Information (PII):**
- Driver names, contact information, SSN
- User email addresses and phone numbers
- Vehicle location data

**Handling PII:**
- Minimize data collection
- Encrypt data at rest and in transit
- Implement data retention policies
- Comply with GDPR/CCPA requirements

### Incident Response

**If you discover a security issue:**

1. **DO NOT** create a public GitHub issue
2. **IMMEDIATELY** contact the project lead via secure channel
3. Document the issue with:
   - Description of vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested remediation

**Contact Information:**
- Email: security@capitaltechalliance.com
- Phone: [Provided separately]

---

## Communication & Support

### Communication Channels

**Primary Channel: Microsoft Teams**
- Team: Capital Tech Alliance - Fleet Management
- Channel: #vendor-development
- Daily standups: 9:00 AM EST
- Weekly sprint review: Fridays 2:00 PM EST

**Secondary Channel: Email**
- Project Lead: [Provided separately]
- Technical Questions: dev@capitaltechalliance.com
- Security Issues: security@capitaltechalliance.com

**Code Reviews: Azure DevOps**
- Pull requests required for all changes
- Minimum 1 approval required
- Automated tests must pass

### Response Times

**Expected Response Times:**
- Urgent issues: 2 hours during business hours
- Technical questions: 24 hours
- Code review: 48 hours
- Non-urgent: 3 business days

**Your Commitment:**
- Daily standup attendance
- Weekly progress reports
- Immediate escalation of blockers
- Code review participation

### Issue Tracking

**Azure DevOps Boards:**
- Organization: https://dev.azure.com/CapitalTechAlliance
- Project: FleetManagement
- Your work items assigned with [VENDOR] tag

**Creating Issues:**
```bash
# Install Azure DevOps CLI extension
az extension add --name azure-devops

# Login
az devops login

# Create work item
az boards work-item create \
  --title "Issue title" \
  --type "Bug" \
  --description "Detailed description" \
  --assigned-to "your-email@vendor.com"
```

### Documentation

**Key Documents (in /docs directory):**
- `PROJECT_HANDOFF.md` - Comprehensive technical guide
- `USER_STORIES.md` - Feature requirements and acceptance criteria
- `MULTI_ENVIRONMENT_GUIDE.md` - Environment management
- API documentation: https://fleet-dev.capitaltechalliance.com/api/docs

**Update Documentation:**
- Update docs when adding new features
- Document all API changes
- Include code examples
- Update architecture diagrams if needed

---

## Acceptance Criteria

### Definition of Done

A feature/bug fix is considered complete when:

✅ **Code Quality:**
- Code follows TypeScript best practices
- No linting errors (`npm run lint`)
- No type errors (`npm run type-check`)
- Proper error handling implemented
- Logging added for debugging

✅ **Testing:**
- Unit tests written and passing
- Integration tests passing
- Manual testing completed in dev environment
- No regressions in existing features

✅ **Documentation:**
- API endpoints documented in Swagger
- README updated if needed
- Code comments for complex logic
- User-facing features documented

✅ **Security:**
- No hardcoded secrets
- Input validation implemented
- SQL injection prevention
- XSS prevention

✅ **Deployment:**
- Successfully deployed to dev environment
- Tested in dev environment
- Staging deployment approved by project lead
- Database migrations tested

✅ **Code Review:**
- Pull request created in Azure DevOps
- Code review completed and approved
- All comments addressed
- CI/CD pipeline passing

### Quality Standards

**Code Coverage:**
- Minimum 70% code coverage for new code
- Critical paths must have 90%+ coverage

**Performance:**
- API endpoints respond within 500ms
- Page load time under 2 seconds
- Database queries optimized with indexes

**Accessibility:**
- WCAG 2.1 Level AA compliance
- Keyboard navigation supported
- Screen reader compatible

---

## Quick Reference

### Essential Commands

**Kubernetes:**
```bash
# Switch context
kubectl config use-context vendor-dev

# Get pods
kubectl get pods -n fleet-dev

# View logs
kubectl logs -f -l app=fleet-api -n fleet-dev

# Port forward
kubectl port-forward -n fleet-dev svc/fleet-api-dev 3000:3000

# Execute command in pod
kubectl exec -it <pod-name> -n fleet-dev -- /bin/sh

# Restart deployment
kubectl rollout restart deployment/fleet-api-dev -n fleet-dev
```

**Docker:**
```bash
# Build image
docker build -t fleet-api:dev .

# Build for Azure
az acr build --registry fleetappregistry --image fleet-api:dev .
```

**Git:**
```bash
# Create branch
git checkout -b feature/feature-name

# Commit
git add .
git commit -m "feat: description"

# Push
git push origin feature/feature-name
```

### Useful Aliases

Add to `~/.bashrc` or `~/.zshrc`:
```bash
# Kubernetes aliases
alias k='kubectl'
alias kdev='kubectl config use-context vendor-dev'
alias kstage='kubectl config use-context vendor-staging'
alias kgp='kubectl get pods'
alias klf='kubectl logs -f'

# Fleet-specific
alias fleet-dev-api='kubectl logs -f -l app=fleet-api -n fleet-dev'
alias fleet-dev-app='kubectl logs -f -l app=fleet-app -n fleet-dev'
alias fleet-dev-pods='kubectl get pods -n fleet-dev'
```

### Environment URLs

| Environment | Frontend | API | Swagger Docs |
|-------------|----------|-----|--------------|
| Development | https://fleet-dev.capitaltechalliance.com | https://fleet-dev.capitaltechalliance.com/api | https://fleet-dev.capitaltechalliance.com/api/docs |
| Staging | https://fleet-staging.capitaltechalliance.com | https://fleet-staging.capitaltechalliance.com/api | https://fleet-staging.capitaltechalliance.com/api/docs |
| Production | https://fleet.capitaltechalliance.com | https://fleet.capitaltechalliance.com/api | (Read-only) |

### Test Credentials

**Development Environment:**
```
URL: https://fleet-dev.capitaltechalliance.com
Tenant: ACME Fleet Corp
Email: admin@acme.com
Password: password123
```

**Staging Environment:**
```
URL: https://fleet-staging.capitaltechalliance.com
Tenant: ACME Fleet Corp
Email: admin@acme.com
Password: password123
```

---

## Getting Help

### Troubleshooting

**Issue: Cannot connect to Kubernetes cluster**
```bash
# Verify kubeconfig
export KUBECONFIG=/path/to/vendor-kubeconfig.yaml
kubectl config view

# Test connection
kubectl get nodes
```

**Issue: Docker image build fails**
```bash
# Login to Azure Container Registry
az acr login --name fleetappregistry

# Verify credentials
az account show
```

**Issue: Pod not starting**
```bash
# Check pod status
kubectl get pods -n fleet-dev

# View pod events
kubectl describe pod <pod-name> -n fleet-dev

# View logs
kubectl logs <pod-name> -n fleet-dev
```

### Support Contacts

**Project Lead:**
- Name: [Provided separately]
- Email: [Provided separately]
- Phone: [Provided separately]
- Availability: Mon-Fri 9 AM - 6 PM EST

**Technical Support:**
- Email: dev@capitaltechalliance.com
- Response Time: 24 hours

**Emergency Contact (Security Issues):**
- Email: security@capitaltechalliance.com
- Phone: [Provided separately]
- Response Time: 2 hours

---

## Next Steps

### Immediate Actions (First Day)

1. ✅ Review this entire onboarding document
2. ✅ Install required software (kubectl, az, docker, git, node)
3. ✅ Decrypt and configure access credentials
4. ✅ Test Kubernetes access (dev and staging)
5. ✅ Clone repository from GitHub or Azure DevOps
6. ✅ Install project dependencies (npm install)
7. ✅ Review existing documentation (docs/ directory)
8. ✅ Schedule kickoff meeting with project lead

### First Week Goals

1. ✅ Complete local development environment setup
2. ✅ Successfully deploy a test change to dev environment
3. ✅ Review all user stories in docs/USER_STORIES.md
4. ✅ Attend daily standup meetings
5. ✅ Complete assigned work items
6. ✅ Submit first pull request for code review

### Ongoing Responsibilities

- Daily standup attendance and updates
- Weekly progress reports
- Code quality and testing
- Documentation updates
- Security best practices
- Communication and collaboration

---

**Welcome to the team! We look forward to working with you.**

For questions or concerns, please reach out via the communication channels above.

---

**Document Control:**
- Version: 1.0
- Last Updated: 2025-11-09
- Classification: Confidential - External Vendor Access
- Distribution: External Vendor Development Team Only
