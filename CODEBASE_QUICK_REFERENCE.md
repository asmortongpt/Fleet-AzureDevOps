# FLEET CODEBASE QUICK REFERENCE
**Last Updated:** January 8, 2026

## Quick Navigation

### Critical Paths
- **Frontend Entry:** `/src/routes.tsx` - Route configuration
- **Backend Entry:** `/api/src/app.ts` - Main application
- **Database Schema:** `/api/src/db/schema.ts` - Drizzle ORM schema
- **Environment Setup:** `.env` - Configuration variables
- **Build Config:** `vite.config.ts`, `package.json`

### Key File Locations

#### Frontend (React/TypeScript)
```
src/
├── pages/               # 50+ Hub pages
├── components/          # 200+ React components
│   ├── hubs/           # 17 feature hubs
│   ├── drilldown/      # Detail panels
│   ├── ui/             # Reusable UI components
│   └── Maps/           # Map components
├── services/           # 30+ API services
├── repositories/       # 6 data repositories
├── hooks/              # Custom React hooks
├── stores/             # Zustand state management
├── types/              # TypeScript definitions
└── utils/              # Utility functions
```

#### Backend (Express/TypeScript)
```
api/src/
├── routes/             # 170+ API route files
├── repositories/       # 100+ data access repositories
├── services/           # 50+ business logic services
├── middleware/         # 50+ middleware files
├── db/                 # Database schema & connections
├── migrations/         # 76+ database migrations
├── types/              # TypeScript type definitions
├── emulators/          # Hardware device simulators
└── scripts/            # Utility scripts
```

### Database
- **Type:** PostgreSQL
- **ORM:** Drizzle ORM
- **Schema:** `/api/src/db/schema.ts`
- **Migrations:** `/api/src/migrations/`

---

## Running the Application

### Development

**Frontend:**
```bash
cd /Users/andrewmorton/Documents/GitHub/Fleet
npm install
npm run dev
# Runs on http://localhost:5173
```

**Backend:**
```bash
cd /Users/andrewmorton/Documents/GitHub/Fleet/api
npm install
npm run dev
# Runs on http://localhost:3000
```

**Both (Recommended):**
```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend
cd api && npm run dev
```

### Testing

```bash
# Frontend unit tests
npm run test

# Backend unit tests
cd api && npm run test

# E2E tests
npm run test:e2e

# Integration tests
cd api && npm run test:integration
```

### Build

```bash
# Frontend
npm run build              # Output: dist/

# Backend
cd api && npm run build    # Output: api/dist/

# Docker
docker build -t fleet-frontend .
docker build -t fleet-api api/
```

---

## API Route Categories

### Core Fleet Management
- `/api/vehicles` - Vehicle CRUD
- `/api/drivers` - Driver management
- `/api/maintenance` - Maintenance tracking
- `/api/fuel-transactions` - Fuel management
- `/api/incidents` - Incident reporting
- `/api/damage-reports` - Damage tracking

### Advanced Features
- `/api/analytics` - Analytics data
- `/api/telematics` - GPS/telemetry
- `/api/geofences` - Geofence management
- `/api/alerts` - Alert management
- `/api/policies` - Policy management
- `/api/work-orders` - Work order management

### Mobile Integration
- `/api/mobile/sync` - Mobile app sync
- `/api/mobile/assignments` - Mobile assignments
- `/api/mobile/trips` - Trip tracking
- `/api/mobile/notifications` - Push notifications

### System & Admin
- `/api/health` - Health check
- `/api/admin/configuration` - Configuration
- `/api/permissions` - Permission management

---

## Frontend Hub Pages (17 Total)

| Hub Name | Path | Purpose |
|----------|------|---------|
| Fleet Hub | `/fleet` | Main fleet management |
| Analytics Hub | `/analytics` | Data analysis & reporting |
| Maintenance Hub | `/maintenance` | Maintenance scheduling |
| Reservations Hub | `/reservations` | Vehicle reservations |
| Safety Hub | `/safety` | Safety monitoring |
| Compliance Hub | `/compliance` | Regulatory compliance |
| Financial Hub | `/financial` | Cost analysis |
| Operations Hub | `/operations` | Operations management |
| Drivers Hub | `/drivers` | Driver management |
| Admin Dashboard | `/admin` | System administration |
| Procurement Hub | `/procurement` | Purchase management |
| Policy Hub | `/policy-hub` | Policy management |
| Reports Hub | `/reports` | Custom reporting |
| Documents Hub | `/documents` | Document management |
| Command Center | `/command-center` | Operations center |
| Assets Hub | `/assets` | Asset tracking |
| Communication Hub | `/communication` | Communications |

---

## Database Key Tables

### Core Entities
- `vehicles` - Fleet vehicles
- `drivers` - Driver records
- `maintenance_records` - Service history
- `fuel_transactions` - Fuel usage
- `incidents` - Safety incidents
- `damage_reports` - Damage tracking
- `inspections` - Vehicle inspections
- `work_orders` - Work assignments

### Supporting Data
- `geofences` - Geographic zones
- `alerts` - System alerts
- `policies` - Business policies
- `permissions` - Access control
- `audit_logs` - Activity tracking
- `documents` - File storage metadata
- `attachments` - File attachments

---

## Authentication & Authorization

### Login Flow
1. User navigates to `/auth/callback`
2. Azure AD SSO authentication
3. JWT token generation
4. Token stored in secure storage
5. Role-based access control applied

### Environment Variables (Auth)
```
VITE_AZURE_AD_CLIENT_ID=<client-id>
VITE_AZURE_AD_TENANT_ID=<tenant-id>
VITE_AZURE_AD_REDIRECT_URI=<callback-url>
```

### API Authentication
- All API requests require JWT token
- Token passed in `Authorization: Bearer <token>` header
- CORS enabled for frontend domain

---

## Key Services & Integrations

### Telematics Providers
- **Samsara** - GPS/fleet tracking
- **Geotab** - Vehicle diagnostics
- **OBD2** - On-board diagnostics

### Cloud Services
- **Azure SQL Database** - Primary database
- **Azure Blob Storage** - File storage
- **Azure Key Vault** - Secrets management
- **Azure App Insights** - Monitoring

### AI/LLM Services
- **Anthropic Claude** - AI damage detection
- **OpenAI GPT** - General AI
- **Azure OpenAI** - Azure-hosted models

### Communication
- **Microsoft 365** - Outlook/Teams integration
- **Twilio** - SMS/voice
- **SendGrid** - Email delivery

---

## Common Development Tasks

### Adding a New API Endpoint

1. Create route file in `/api/src/routes/`
   ```typescript
   import { Router } from 'express';
   
   const router = Router();
   
   router.get('/', async (req, res) => {
     // Implementation
   });
   
   export default router;
   ```

2. Create repository in `/api/src/repositories/`
   ```typescript
   export class NewRepository {
     async getAll() { }
     async getById(id) { }
     async create(data) { }
     async update(id, data) { }
     async delete(id) { }
   }
   ```

3. Register route in `/api/src/app.ts`

### Adding a New Frontend Component

1. Create component in `/src/components/`
   ```typescript
   export const NewComponent: React.FC = () => {
     return <div>Component</div>;
   };
   ```

2. Create TypeScript types in `/src/types/`

3. Use component in pages or other components

4. Add Storybook story in `/src/stories/`

### Adding a Database Table

1. Update schema in `/api/src/db/schema.ts`
2. Create migration file
3. Run migrations: `npm run migrate`
4. Create repository class
5. Create API routes

---

## Configuration Files Overview

| File | Purpose |
|------|---------|
| `package.json` | Frontend dependencies & scripts |
| `api/package.json` | Backend dependencies & scripts |
| `vite.config.ts` | Frontend build configuration |
| `tsconfig.json` | TypeScript configuration |
| `tailwind.config.js` | Tailwind CSS configuration |
| `.env` | Environment variables |
| `.env.production` | Production environment |
| `azure-pipelines.yml` | Azure DevOps CI/CD |
| `Dockerfile` | Frontend container image |
| `docker-compose.yml` | Multi-container setup |

---

## Deployment

### Azure Static Web Apps (Frontend)
- Repository linked to GitHub
- Auto-deploys on push to main
- URL: https://proud-bay-0fdc8040f.3.azurestaticapps.net

### Azure App Service (Backend)
- Container-based deployment
- Auto-scaling enabled
- Health checks configured

### Database
- Azure SQL Database (PostgreSQL)
- Automatic backups
- SSL encryption enabled

---

## Monitoring & Debugging

### Error Tracking
- **Sentry** - JS exceptions
- **Application Insights** - Backend errors

### Performance Monitoring
- **Datadog** - Infrastructure metrics
- **Application Insights** - APM

### Logs
- Frontend: Browser console + Sentry
- Backend: Winston logger + Application Insights

### Health Checks
```bash
# Frontend health
curl https://proud-bay-0fdc8040f.3.azurestaticapps.net/ready

# Backend health
curl http://api/api/health
```

---

## Security Best Practices

### Code Security
- Parameterized SQL queries only
- Input validation on all endpoints
- Output escaping for XSS prevention
- CSRF token protection
- Rate limiting enabled

### Data Security
- TLS/HTTPS everywhere
- Database encryption at rest
- Secrets in Azure Key Vault (never in .env)
- Audit logging for all data changes

### Infrastructure
- Non-root containers
- Security headers (CSP, X-Frame-Options)
- RBAC for all resources
- Break-glass access procedures

---

## Troubleshooting

### Common Issues

**Database Connection Error**
- Check `DATABASE_URL` in `.env`
- Verify PostgreSQL is running
- Check connection pool settings

**API Not Responding**
- Check backend is running on port 3000
- Verify API routes are registered
- Check network/firewall settings

**Frontend Build Issues**
- Clear node_modules: `rm -rf node_modules && npm install`
- Clear Vite cache: `rm -rf dist && npm run build`
- Check TypeScript errors: `npx tsc --noEmit`

**CORS Issues**
- Check CORS middleware in `/api/src/app.ts`
- Verify frontend URL is whitelisted
- Check browser console for exact error

---

## Git Workflow

### Branches
- `main` - Production branch
- `feature/*` - Feature development
- `fix/*` - Bug fixes
- `hotfix/*` - Critical production fixes

### Commits
```bash
# Features
git commit -m "feat: Add new feature description"

# Bug fixes
git commit -m "fix: Fix specific issue"

# Documentation
git commit -m "docs: Update documentation"

# Security
git commit -m "security: Fix security vulnerability"
```

### Status Check
```bash
git status
git log --oneline -10
git diff
```

---

## Additional Resources

### Documentation
- `/docs/playbooks/` - Operational guides
- `COMPREHENSIVE_PROJECT_REQUIREMENTS.md` - Full requirements
- `SECURITY_BEST_PRACTICES.md` - Security guidelines
- Component documentation in Storybook

### Tools
- Postman/Insomnia - API testing
- Playwright - E2E testing
- Storybook - Component development
- VS Code - Recommended IDE

### External APIs
- Samsara: https://developer.samsara.com
- Geotab: https://developers.geotab.com
- Google Maps: https://developers.google.com/maps
- Anthropic: https://anthropic.com

---

## Contact & Support

**Repository:** https://github.com/asmortongpt/Fleet  
**Status:** Active Development  
**Last Updated:** January 8, 2026

For detailed codebase exploration, see: `FLEET_CODEBASE_EXPLORATION_REPORT.md`
