# CTAFleet - Seven Feature Implementation Package

This package contains production-ready implementations for all seven features:

1. **Real-Time Telematics Base Layer** - GPS tracking and position history
2. **Driver Behavior & Safety Scoring** - Event detection and scoring system
3. **CPM & TCO Analytics** - Cost per mile and total cost of ownership
4. **Compliance Hub** - Document management and expiration alerts
5. **Fuel Card Integration & Fraud Detection** - Transaction import and rule engine
6. **Public REST API v1** - Versioned API endpoints
7. **Webhooks & Events** - Event bus and webhook delivery system

## Tech Stack
- Node.js + Express + TypeScript
- PostgreSQL with Drizzle ORM
- Redis for job queues (Bull)
- node-cron for scheduled jobs

## Installation

1. Copy files to your project:
```bash
cp -r api/src/* your-project/api/src/
cp -r api/migrations/* your-project/api/migrations/
```

2. Install dependencies:
```bash
cd api
npm install node-cron bullmq ioredis axios crypto-js
npm install -D @types/node-cron @types/crypto-js
```

3. Add environment variables to `.env`:
```bash
# Telematics
SAMSARA_API_KEY=your_samsara_api_key
SAMSARA_BASE_URL=https://api.samsara.com
TELEMATICS_REFRESH_INTERVAL=60

# Jobs & Workers
REDIS_HOST=localhost
REDIS_PORT=6379

# Webhooks
WEBHOOK_SECRET_KEY=your_webhook_secret
```

4. Run migrations:
```bash
npm run migrate
```

5. Update your DI container (see `api/src/config/container-setup.example.ts`)

## File Structure
```
api/src/
├── domain/              # Business entities and rules
├── application/         # Use cases and DTOs
├── infrastructure/      # External integrations
├── api/routes/v1/      # REST API endpoints
└── db/schema/          # Database schemas
```

## Testing
Each feature includes test files in `__tests__` directories.

Run tests:
```bash
npm run test
```

## Documentation
See individual feature READMEs in each domain folder.
