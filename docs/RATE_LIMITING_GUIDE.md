# Fleet Local - Rate Limiting Guide

## Production-Ready Redis-Backed Rate Limiting System

**FedRAMP SC-5 (Denial of Service Protection) Compliance**

This guide provides comprehensive documentation for the 6-tier rate limiting system implemented for Fortune 50 deployment.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Rate Limit Tiers](#rate-limit-tiers)
4. [Configuration](#configuration)
5. [Deployment](#deployment)
6. [Monitoring](#monitoring)
7. [Troubleshooting](#troubleshooting)
8. [Security Features](#security-features)
9. [FedRAMP Compliance](#fedramp-compliance)
10. [API Reference](#api-reference)

---

## Overview

### What is Rate Limiting?

Rate limiting restricts the number of requests a client can make to an API within a specific time window. This prevents:

- **Brute force attacks** (credential stuffing, password guessing)
- **Denial of Service (DoS) attacks** (overwhelming the server)
- **API abuse** (excessive polling, data scraping)
- **Resource exhaustion** (CPU, memory, database connections)

### Why Redis-Backed?

- **Distributed**: Rate limits shared across multiple server instances
- **Persistent**: Limits survive server restarts
- **Fast**: Sub-millisecond lookups
- **Scalable**: Handles millions of requests
- **Production-ready**: Battle-tested in enterprise environments

### System Features

✅ **6-tier protection system** (auth, write, read, public, websocket, upload)
✅ **Redis-backed distributed rate limiting**
✅ **Automatic IP banning** for repeated violations
✅ **IP whitelisting** for admin/monitoring access
✅ **Security team alerting** for potential attacks
✅ **Sliding window algorithm** (more accurate than fixed window)
✅ **Graceful fallback** to in-memory if Redis unavailable
✅ **Comprehensive audit logging**
✅ **FedRAMP SC-5 compliant**

---

## Architecture

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│         Banned IP Middleware                │
│  (Blocks banned IPs immediately)            │
└──────┬──────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│         Rate Limiting Middleware            │
│  ┌────────────────────────────────────────┐ │
│  │ Tier 1: Auth (5 req/15min)             │ │
│  │ Tier 2: Write (100 req/15min)          │ │
│  │ Tier 3: Read (1000 req/15min)          │ │
│  │ Tier 4: Public (5000 req/15min)        │ │
│  │ Tier 6: Upload (10 req/hour)           │ │
│  └────────────────────────────────────────┘ │
└──────┬──────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│           Redis Store                       │
│  ┌────────────────────────────────────────┐ │
│  │ rl:auth:192.168.1.1 → 3/5              │ │
│  │ rl:write:192.168.1.1 → 45/100          │ │
│  │ rl:read:192.168.1.1 → 234/1000         │ │
│  │ banned_ips → Set(1.2.3.4, ...)         │ │
│  └────────────────────────────────────────┘ │
└──────┬──────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│         API Endpoint                        │
└─────────────────────────────────────────────┘
```

---

## Rate Limit Tiers

### TIER 1: STRICT - Authentication Endpoints

**Limits:** 5 requests per 15 minutes

**Applies to:**
- `/api/auth/login`
- `/api/auth/register`
- `/api/auth/reset-password`
- `/api/v1/auth/*`

**Purpose:** Prevent brute force attacks, credential stuffing

**Response on limit:**
```json
{
  "error": "Too many authentication attempts. Please try again in 15 minutes.",
  "code": "AUTH_RATE_LIMIT_EXCEEDED",
  "retryAfter": "15 minutes"
}
```

---

### TIER 2: AGGRESSIVE - Write Operations

**Limits:** 100 requests per 15 minutes

**Applies to:**
- All POST requests
- All PUT requests
- All DELETE requests
- All PATCH requests

**Purpose:** Prevent data manipulation abuse, spam creation

**Response on limit:**
```json
{
  "error": "Too many write operations. Please try again in 15 minutes.",
  "code": "WRITE_RATE_LIMIT_EXCEEDED",
  "retryAfter": "15 minutes"
}
```

---

### TIER 3: STANDARD - Read Operations

**Limits:** 1000 requests per 15 minutes

**Applies to:**
- All GET requests to `/api/*`

**Purpose:** Prevent API abuse, excessive polling

**Response on limit:**
```json
{
  "error": "Too many requests. Please try again in 15 minutes.",
  "code": "READ_RATE_LIMIT_EXCEEDED",
  "retryAfter": "15 minutes"
}
```

---

### TIER 4: GENEROUS - Public Endpoints

**Limits:** 5000 requests per 15 minutes

**Applies to:**
- `/health`
- `/api/health`
- `/api/status`
- `/api/docs`

**Purpose:** Allow high-frequency health checks from monitoring systems

**Response on limit:**
```json
{
  "error": "Too many requests. Please try again later.",
  "code": "PUBLIC_RATE_LIMIT_EXCEEDED",
  "retryAfter": "15 minutes"
}
```

---

### TIER 5: WEBSOCKET - Real-time Connections

**Limits:** 100 concurrent connections per IP

**Applies to:**
- WebSocket connections (future implementation)
- Real-time vehicle tracking
- Live notifications

**Purpose:** Prevent connection flooding, resource exhaustion

---

### TIER 6: FILE UPLOADS

**Limits:** 10 uploads per hour

**Applies to:**
- File upload endpoints
- Document uploads
- Image uploads

**Purpose:** Prevent storage abuse, malicious file flooding

**Response on limit:**
```json
{
  "error": "Upload limit exceeded. Please try again in 1 hour.",
  "code": "UPLOAD_RATE_LIMIT_EXCEEDED",
  "retryAfter": "1 hour"
}
```

---

## Configuration

### Environment Variables

Add to `.env` file:

```bash
# Redis Configuration (required)
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your_secure_password
REDIS_REQUIRED=false  # true = crash if Redis unavailable

# Rate Limiting Configuration
RATE_LIMIT_ENABLED=true
RATE_LIMIT_AUTO_BAN=true       # Auto-ban IPs after 10 violations
RATE_LIMIT_ALERTS=true         # Alert security team

# IP Whitelist (comma-separated)
RATE_LIMIT_WHITELIST_IPS=127.0.0.1,::1,10.0.0.100
```

### Production Configuration

For Azure deployment:

```bash
# Azure Redis Cache
REDIS_URL=redis://fleet-redis.redis.cache.windows.net:6380
REDIS_PASSWORD=<from-azure-key-vault>
REDIS_REQUIRED=true

# Enable all security features
RATE_LIMIT_AUTO_BAN=true
RATE_LIMIT_ALERTS=true

# Whitelist admin IPs
RATE_LIMIT_WHITELIST_IPS=10.0.0.1,10.0.0.2
```

---

## Deployment

### Development Setup

1. **Install Redis locally:**

```bash
# macOS
brew install redis
brew services start redis

# Ubuntu
sudo apt-get install redis-server
sudo systemctl start redis

# Docker
docker run -d -p 6379:6379 redis:latest
```

2. **Configure environment:**

```bash
cd server
cp .env.example .env
# Edit REDIS_URL if needed
```

3. **Start server:**

```bash
npm run dev
```

4. **Verify rate limiting:**

```bash
# Check health endpoint
curl http://localhost:3000/health

# Response should show:
{
  "status": "healthy",
  "redis": "connected",
  "rateLimiting": "redis-backed"
}
```

### Production Deployment

1. **Provision Azure Redis Cache:**

```bash
az redis create \
  --resource-group fleet-rg \
  --name fleet-redis \
  --location eastus \
  --sku Standard \
  --vm-size C1 \
  --enable-non-ssl-port false
```

2. **Get Redis connection string:**

```bash
az redis list-keys \
  --resource-group fleet-rg \
  --name fleet-redis
```

3. **Store in Azure Key Vault:**

```bash
az keyvault secret set \
  --vault-name fleet-secrets \
  --name REDIS-PASSWORD \
  --value "<primary-key>"
```

4. **Deploy application:**

```bash
# Update environment variables in Azure App Service
az webapp config appsettings set \
  --resource-group fleet-rg \
  --name fleet-api \
  --settings \
    REDIS_URL="redis://fleet-redis.redis.cache.windows.net:6380" \
    REDIS_PASSWORD="@Microsoft.KeyVault(SecretUri=https://fleet-secrets.vault.azure.net/secrets/REDIS-PASSWORD/)" \
    RATE_LIMIT_REQUIRED=true
```

---

## Monitoring

### Rate Limit Headers

All responses include rate limit headers:

```http
RateLimit-Limit: 1000
RateLimit-Remaining: 234
RateLimit-Reset: 1638360000
```

### Redis Monitoring

**Check Redis stats:**

```bash
# Connect to Redis
redis-cli

# Get stats
INFO stats

# List all rate limit keys
KEYS rl:*

# Check specific IP
GET rl:auth:192.168.1.1
```

### Application Logs

**Rate limit events are logged:**

```
[RateLimit] ⚠️  Rate limit exceeded {
  "ip": "192.168.1.100",
  "path": "/api/vehicles",
  "method": "GET"
}

[RateLimit] 🚨 SECURITY ALERT: IP BANNED {
  "ip": "1.2.3.4",
  "violations": 15,
  "endpoint": "/api/auth/login"
}
```

### Metrics to Monitor

1. **Rate limit hit rate** - % of requests that hit limits
2. **Banned IP count** - Number of IPs currently banned
3. **Violation trends** - IPs with increasing violations
4. **Redis connection health** - Uptime, latency, errors
5. **Fallback activations** - Times Redis was unavailable

---

## Troubleshooting

### Issue: Rate Limiting Not Working

**Symptoms:** Requests not being rate limited

**Diagnosis:**

```bash
# Check Redis connection
curl http://localhost:3000/health
# Look for "redis": "connected"

# Check Redis directly
redis-cli PING
# Should return: PONG

# Check rate limit keys
redis-cli KEYS rl:*
# Should show keys after requests
```

**Solutions:**

1. Verify `RATE_LIMIT_ENABLED=true` in `.env`
2. Check Redis is running: `redis-cli PING`
3. Verify Redis URL is correct
4. Check firewall allows port 6379

---

### Issue: All Requests Returning 429

**Symptoms:** Legitimate users being blocked

**Diagnosis:**

```bash
# Check if IP is banned
redis-cli GET banned_ips
```

**Solutions:**

1. **Clear rate limit data (development only):**

```bash
redis-cli KEYS rl:* | xargs redis-cli DEL
```

2. **Whitelist admin IPs:**

```bash
# Add to .env
RATE_LIMIT_WHITELIST_IPS=127.0.0.1,10.0.0.100
```

3. **Unban specific IP (via API):**

```typescript
import { rateLimitUtils } from './middleware/rate-limit';
rateLimitUtils.clearBans();
```

---

### Issue: Redis Connection Failed

**Symptoms:** Logs show "Redis connection failed"

**Diagnosis:**

```bash
# Test Redis connection
redis-cli -h fleet-redis.redis.cache.windows.net -p 6380 -a <password> PING
```

**Solutions:**

1. **Check Redis is running:**

```bash
# Local
brew services list | grep redis

# Azure
az redis show --resource-group fleet-rg --name fleet-redis
```

2. **Verify firewall rules:**
   - Azure Redis: Allow your app's subnet
   - Local: Check no firewall blocking port 6379

3. **Fallback to in-memory:**

```bash
# Set in .env (temporary)
REDIS_REQUIRED=false
```

---

### Issue: IP Banning Too Aggressive

**Symptoms:** Legitimate users getting banned

**Solutions:**

1. **Increase violation threshold:**

Edit `/server/src/config/rate-limit.config.ts`:

```typescript
export const violationThresholds = {
  maxViolations: 20, // Increased from 10
  banDuration: 60 * 60 * 1000, // 1 hour
};
```

2. **Disable auto-ban (not recommended for production):**

```bash
RATE_LIMIT_AUTO_BAN=false
```

3. **Whitelist known IPs:**

```bash
RATE_LIMIT_WHITELIST_IPS=10.0.0.1,10.0.0.2,10.0.0.3
```

---

## Security Features

### 1. IP Spoofing Protection

The system correctly extracts client IPs from proxy headers:

```typescript
// Takes FIRST IP in X-Forwarded-For (real client)
X-Forwarded-For: 1.2.3.4, 10.0.0.1
// IP used: 1.2.3.4 (not 10.0.0.1 which could be spoofed)
```

### 2. Automatic IP Banning

After 10 violations, IPs are automatically banned for 1 hour:

```typescript
// Violation threshold
maxViolations: 10,
banDuration: 60 * 60 * 1000, // 1 hour
```

### 3. Security Team Alerting

Potential attacks trigger security alerts:

```typescript
// After 5 violations
alertSecurityTeam(ip, endpoint, violations);
```

**Integration points:**
- Azure Monitor
- PagerDuty
- Slack webhooks
- Email alerts

### 4. Audit Logging

All rate limit events are logged with:
- IP address
- Endpoint
- Timestamp
- User agent
- Violation count

### 5. Sliding Window Algorithm

More accurate than fixed window:

```
Fixed Window:
│ 5 req │ 5 req │ = 10 req in 1 second (burst allowed)
└───────┴───────┘

Sliding Window:
│ 3 │ 2 │ 3 │ 2 │ = Never exceeds 5 req/window
└───┴───┴───┴───┘
```

---

## FedRAMP Compliance

### SC-5: Denial of Service Protection

**Control Requirement:**
> The information system protects against or limits the effects of denial of service attacks.

**How This System Complies:**

| Control | Implementation | Evidence |
|---------|---------------|----------|
| SC-5 (a) | **Rate limiting on all endpoints** | 6-tier system documented in code |
| SC-5 (b) | **Resource allocation limits** | Max requests per window enforced |
| SC-5 (c) | **Monitoring and logging** | All violations logged with IP/timestamp |
| SC-5 (d) | **Incident response** | Automatic IP banning + security alerts |

**Audit Evidence:**

1. **Configuration file:** `/server/src/config/rate-limit.config.ts`
2. **Implementation:** `/server/src/middleware/rate-limit.ts`
3. **Test coverage:** `/server/src/middleware/__tests__/rate-limit.test.ts`
4. **Logs:** Application logs show rate limit violations
5. **Monitoring:** Redis stores all rate limit data

**Documentation for Auditors:**

> "The Fleet Local API implements a 6-tier Redis-backed rate limiting system that protects against denial of service attacks. All API endpoints have request limits enforced. Violations are logged, and repeated violations result in automatic IP banning. Security teams are alerted of potential attacks."

---

## API Reference

### Rate Limiter Middleware

```typescript
import {
  authRateLimiter,      // TIER 1: 5 req/15min
  writeRateLimiter,     // TIER 2: 100 req/15min
  readRateLimiter,      // TIER 3: 1000 req/15min
  publicRateLimiter,    // TIER 4: 5000 req/15min
  uploadRateLimiter,    // TIER 6: 10 req/hour
  bannedIPMiddleware,   // Block banned IPs
} from './middleware/rate-limit';
```

### Utilities

```typescript
import { rateLimitUtils } from './middleware/rate-limit';

// Get client IP
const ip = rateLimitUtils.getClientIP(req);

// Check if whitelisted
const isWhitelisted = rateLimitUtils.isWhitelisted(ip);

// Check if banned
const isBanned = rateLimitUtils.isBanned(ip);

// Record violation
rateLimitUtils.recordViolation(ip, '/api/endpoint');

// Ban IP manually
rateLimitUtils.banIP(ip, '/api/endpoint');

// Clear violations (development only)
rateLimitUtils.clearViolations();
rateLimitUtils.clearBans();

// Get violation count
const count = rateLimitUtils.getViolationCount(ip);
```

### Redis Client

```typescript
import {
  getRedisClient,
  pingRedis,
  getRedisStats,
  closeRedisConnection,
  clearRateLimitData,
} from './lib/redis-client';

// Get Redis client
const redis = getRedisClient();

// Check connection
const healthy = await pingRedis();

// Get stats
const stats = await getRedisStats();

// Close connection (shutdown)
await closeRedisConnection();

// Clear rate limit data (development only)
await clearRateLimitData();
```

---

## Next Steps

1. **Set up monitoring dashboards** (Azure Monitor, Datadog)
2. **Configure security alerts** (PagerDuty, Slack)
3. **Load test rate limiting** (Artillery, k6)
4. **Document IP whitelist process** for admins
5. **Create runbook for security incidents**

---

## Support

For issues or questions:

- **Documentation:** This guide + inline code comments
- **Tests:** `/server/src/middleware/__tests__/rate-limit.test.ts`
- **Configuration:** `/server/src/config/rate-limit.config.ts`
- **Implementation:** `/server/src/middleware/rate-limit.ts`

**Security Issues:** Report immediately to security team with details:
- IP address
- Endpoint
- Timestamp
- Number of violations
