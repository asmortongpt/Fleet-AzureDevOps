# Performance Optimizations - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies

```bash
cd /home/user/Fleet/api
npm install compression redis
npm install --save-dev @types/compression
```

### Step 2: Start Redis

```bash
# Using Docker
docker run -d -p 6379:6379 --name redis redis:7-alpine

# Or using Docker Compose (recommended)
docker-compose up -d redis
```

### Step 3: Configure Environment

```bash
# Add to .env file
echo "REDIS_URL=redis://localhost:6379" >> .env
```

### Step 4: Start the Application

```bash
npm run dev
```

You should see:
```
✅ Redis connected
💾 Cache initialized: Connected
🚀 Fleet API running on port 3000
```

---

## 📝 Quick Reference

### Cache Middleware Usage

```typescript
// routes/vehicles.ts
import { cache, cacheMiddleware } from '../utils/cache'

// Cache GET routes
router.get('/', cacheMiddleware(300), handler)      // 5 minutes
router.get('/:id', cacheMiddleware(600), handler)   // 10 minutes

// Invalidate on writes
router.post('/', async (req, res) => {
  // ... create logic
  await cache.delPattern(`route:/api/vehicles*`)
  res.json(result)
})

router.put('/:id', async (req, res) => {
  // ... update logic
  await cache.delPattern(`route:/api/vehicles*`)
  await cache.del(cache.getCacheKey(tenantId, 'vehicle', id))
  res.json(result)
})
```

### Cache TTL Guidelines

```typescript
60    // 1 minute  - Real-time data
180   // 3 minutes - Moderate change rate
300   // 5 minutes - Frequent reads
600   // 10 minutes - Stable data
1800  // 30 minutes - Reference data
```

### Cache Key Patterns

```typescript
// Route caching (automatic)
`route:/api/vehicles`
`route:/api/vehicles?page=1&limit=50`

// Manual caching
cache.getCacheKey(tenantId, 'vehicle', id)
// Result: "tenant-123:vehicle:vehicle-456"
```

---

## 🔍 Monitor Performance

### Check Cache Status

```bash
# Is Redis connected?
redis-cli ping
# Should return: PONG

# How many keys cached?
redis-cli DBSIZE

# Monitor in real-time
redis-cli MONITOR
```

### Watch Application Logs

```bash
# Cache hits/misses
grep "Cache HIT" logs/*.log
grep "Cache MISS" logs/*.log

# Slow requests
grep "SLOW REQUEST" logs/*.log
grep "SLOW QUERY" logs/*.log
```

---

## 📊 Verify It's Working

### Test Cache Behavior

```bash
# First request (cache miss - slower)
curl http://localhost:3000/api/vehicles

# Second request (cache hit - faster)
curl http://localhost:3000/api/vehicles

# Clear cache and test again
redis-cli FLUSHDB
curl http://localhost:3000/api/vehicles
```

### Expected Log Output

```
❌ Cache MISS: route:/api/vehicles    # First request
✅ Cache HIT: route:/api/vehicles     # Second request
```

---

## 🎯 Next Steps

1. **Apply to High-Traffic Routes**
   - See `/home/user/Fleet/api/src/routes/vehicles.optimized.example.ts`

2. **Add Dashboard Caching**
   - See `/home/user/Fleet/api/src/routes/dashboard-stats.example.ts`

3. **Load Test**
   ```bash
   ab -n 1000 -c 50 http://localhost:3000/api/vehicles
   ```

4. **Read Full Documentation**
   - `/home/user/Fleet/PERFORMANCE_OPTIMIZATIONS.md`

---

## 🐛 Common Issues

### Redis Not Connecting

```bash
# Check if Redis is running
docker ps | grep redis

# Start Redis if not running
docker-compose up -d redis

# Check Redis logs
docker logs redis
```

### Cache Not Working

```typescript
// Check if cache is connected
const stats = await cache.getStats()
console.log(stats.connected) // Should be true
```

### No Performance Improvement

1. Verify cache middleware is added to routes
2. Check cache hit rate (should be >50%)
3. Test under load (caching helps with concurrent requests)

---

## 📚 Documentation

- **Full Guide**: `/home/user/Fleet/PERFORMANCE_OPTIMIZATIONS.md`
- **Implementation Summary**: `/home/user/Fleet/PERFORMANCE_IMPLEMENTATION_SUMMARY.md`
- **Route Example**: `/home/user/Fleet/api/src/routes/vehicles.optimized.example.ts`
- **Dashboard Example**: `/home/user/Fleet/api/src/routes/dashboard-stats.example.ts`

---

## ✅ Success Metrics

After implementing caching, you should see:

- ✅ 10x more requests per second
- ✅ 50-70% faster response times
- ✅ 40-60% less database load
- ✅ 80%+ cache hit rate
- ✅ <100ms response for cached data

**Last Updated**: 2025-11-19
