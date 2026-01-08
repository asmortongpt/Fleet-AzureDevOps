# CTAFleet Features - Installation Guide

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Redis 6+ (for background jobs)
- Git

## Step 1: Extract Files

```bash
# Extract the zip file
unzip ctafleet-features-complete.zip -d /your/project/path

# Navigate to your project
cd /your/project/path
```

## Step 2: Install Dependencies

```bash
cd api
npm install node-cron bullmq ioredis axios crypto-js
npm install -D @types/node-cron @types/crypto-js
```

## Step 3: Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit with your credentials
nano .env
```

Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_HOST` and `REDIS_PORT` - Redis connection
- `SAMSARA_API_KEY` - Telematics provider API key
- `WEBHOOK_SECRET_KEY` - Secret for webhook signatures

## Step 4: Run Database Migrations

```bash
# Run all migrations in order
npm run migrate
```

This will create:
- Telematics tables (providers, devices, locations, events)
- Safety scoring tables (behavior events, scores, configs)
- Analytics tables (cost snapshots)
- Compliance tables (documents, alerts)
- Fuel tables (transactions, fraud rules, alerts)
- Webhook tables (events, subscriptions, deliveries)

## Step 5: Update Dependency Injection Container

Add the container setup to your main server file:

```typescript
import { setupContainer, startBackgroundJobs } from './config/container-setup.example';

const container = setupContainer();
startBackgroundJobs(container);
```

## Step 6: Register API Routes

```typescript
import telematicsRoutes from './api/routes/v1/telematics.routes';
import safetyRoutes from './api/routes/v1/safety.routes';
import analyticsRoutes from './api/routes/v1/analytics.routes';

app.use('/api/v1', telematicsRoutes);
app.use('/api/v1', safetyRoutes);
app.use('/api/v1', analyticsRoutes);
```

## Step 7: Start the Application

```bash
npm run dev
```

## Verification

Test each feature:

```bash
# Test telematics
curl http://localhost:3000/api/v1/assets/{assetId}/location

# Test safety scoring
curl http://localhost:3000/api/v1/drivers/{driverId}/safety-score

# Test analytics
curl http://localhost:3000/api/v1/analytics/costs/cpm?assetId={id}
```

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Ensure PostgreSQL is running
- Check firewall settings

### Redis Connection Issues
- Verify Redis is running: `redis-cli ping`
- Check `REDIS_HOST` and `REDIS_PORT`

### API Key Issues
- Verify Samsara API key is valid
- Test connection: Check logs for "Samsara connection test"

## Next Steps

- Configure safety scoring thresholds
- Set up fuel fraud rules
- Create webhook subscriptions
- Schedule cost snapshot generation
