# CORS Configuration Guide

## Overview

The Fleet API implements a comprehensive, production-grade CORS (Cross-Origin Resource Sharing) configuration with environment-specific security controls and detailed logging.

## Architecture

### Files

1. **`src/middleware/corsConfig.ts`** - Core CORS configuration logic
   - Environment-specific origin validation
   - HTTPS enforcement in production
   - Comprehensive rejection logging
   - Startup validation

2. **`src/middleware/cors.ts`** - CORS middleware wrappers
   - Express middleware integration
   - Preflight request handling
   - Debug logging (development only)
   - Error handling

3. **`src/main.ts`** - Server initialization
   - CORS middleware application
   - Preflight route handling
   - Health check endpoint

## Configuration

### Environment Variables

Set the `CORS_ORIGIN` environment variable with comma-separated origins:

**Development (.env):**
```bash
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173,http://localhost:5174,http://localhost:5175
```

**Production (.env.production):**
```bash
NODE_ENV=production
CORS_ORIGIN=https://proud-bay-0fdc8040f.3.azurestaticapps.net,https://fleet.capitaltechalliance.com
```

### Security Rules

#### Development Mode (`NODE_ENV=development`)
- HTTP origins allowed (localhost)
- Automatic localhost detection (127.0.0.1, ::1)
- Relaxed validation for rapid development
- Debug logging enabled

#### Production Mode (`NODE_ENV=production`)
- **HTTPS ONLY** - HTTP origins rejected at startup
- **No wildcards** - Exact origin matching only
- **CORS_ORIGIN required** - Server fails to start without it
- Comprehensive security logging

## Features

### 1. Startup Validation

The server validates CORS configuration before starting:

```typescript
try {
  validateCorsConfiguration();
} catch (error) {
  console.error('[STARTUP] CORS configuration validation failed:', error);
  process.exit(1);
}
```

**Validation Checks:**
- Production: CORS_ORIGIN must be set
- Production: All origins must use HTTPS
- Production: No wildcard patterns allowed
- Development: Warns if CORS_ORIGIN not set

### 2. Dynamic Origin Validation

Each request's origin is validated dynamically:

```typescript
validateOrigin(origin, allowedOrigins, (err, allow) => {
  if (err || !allow) {
    logCorsRejection(origin, method, path, err?.message);
    callback(err || new Error('CORS not allowed'));
    return;
  }
  callback(null, corsOptions);
});
```

### 3. Preflight Request Handling

The server explicitly handles OPTIONS requests:

```typescript
// Global preflight handler
app.options('*', cors(getCorsConfig()));
```

**Preflight Headers:**
- `Access-Control-Allow-Origin`: Reflected origin (if allowed)
- `Access-Control-Allow-Credentials`: `true`
- `Access-Control-Allow-Methods`: `GET,POST,PUT,DELETE,PATCH,OPTIONS`
- `Access-Control-Allow-Headers`: `Content-Type,Authorization,X-CSRF-Token`
- `Access-Control-Max-Age`: `86400` (24 hours)

### 4. CORS Rejection Logging

All CORS rejections are logged for security monitoring:

```json
{
  "timestamp": "2025-12-30T20:00:00.000Z",
  "origin": "https://malicious-site.com",
  "method": "POST",
  "path": "/api/vehicles",
  "reason": "Origin not allowed by CORS policy",
  "userAgent": "Mozilla/5.0...",
  "ip": "192.168.1.100"
}
```

### 5. Health Check Endpoint

Check CORS configuration status:

```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-12-30T20:00:00.000Z",
  "environment": "development",
  "corsConfigured": true
}
```

## Usage Examples

### Adding a New Origin

1. **Development:**
   ```bash
   # Add to .env
   CORS_ORIGIN=http://localhost:5173,http://localhost:8080
   ```

2. **Production:**
   ```bash
   # Update production environment variable
   CORS_ORIGIN=https://prod-domain.com,https://backup-domain.com

   # Restart server (validation runs automatically)
   npm start
   ```

### Testing CORS

**Test Preflight Request:**
```bash
curl -X OPTIONS http://localhost:3000/api/vehicles \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization" \
  -v
```

**Expected Response:**
```http
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET,POST,PUT,DELETE,PATCH,OPTIONS
Access-Control-Allow-Headers: Content-Type,Authorization,X-CSRF-Token
Access-Control-Max-Age: 86400
```

**Test Actual Request:**
```bash
curl -X GET http://localhost:3000/api/vehicles \
  -H "Origin: http://localhost:5173" \
  -H "Authorization: Bearer <token>" \
  -v
```

### Debug Logging

Enable debug logging in development:

```typescript
// Automatically enabled in development mode
// Logs all CORS headers for each request/response
```

## Common Issues

### Issue: CORS errors in browser console

**Symptoms:**
```
Access to fetch at 'http://localhost:3000/api/...' from origin 'http://localhost:5173'
has been blocked by CORS policy
```

**Solutions:**
1. Check CORS_ORIGIN includes your frontend origin
2. Verify NODE_ENV is set correctly
3. Check server logs for rejection details
4. Ensure preflight requests succeed

### Issue: Production CORS failing

**Symptoms:**
```
[CORS] FATAL: HTTP origins not allowed in production
```

**Solutions:**
1. Update all origins to use HTTPS
2. Remove http:// origins from CORS_ORIGIN
3. Example: `https://your-domain.com` not `http://your-domain.com`

### Issue: Wildcard origins

**Symptoms:**
```
[CORS] FATAL: Wildcard origins not allowed in production
```

**Solutions:**
1. Replace `*` with specific origin(s)
2. List each allowed domain explicitly
3. Example: `https://app1.com,https://app2.com`

## Security Best Practices

### ✅ DO

- Use exact origin matching only
- List all production origins explicitly
- Use HTTPS in production
- Monitor CORS rejection logs
- Validate CORS_ORIGIN at startup
- Keep origins list minimal

### ❌ DON'T

- Use wildcard (`*`) origins in production
- Allow HTTP in production
- Hardcode origins in code
- Disable CORS validation
- Ignore CORS rejection logs
- Add untrusted domains

## Integration with Azure Static Web Apps

For Azure deployment:

```bash
# .env.production
NODE_ENV=production
CORS_ORIGIN=https://proud-bay-0fdc8040f.3.azurestaticapps.net

# Or for multiple Azure origins
CORS_ORIGIN=https://proud-bay-0fdc8040f.3.azurestaticapps.net,https://custom-domain.com
```

## Monitoring

### Production Monitoring

Monitor these log patterns:

```bash
# CORS rejections (security events)
grep "CORS REJECTED" /var/log/fleet-api.log

# Production security alerts
grep "SECURITY.*CORS" /var/log/fleet-api.log

# Configuration validation
grep "CORS.*validated" /var/log/fleet-api.log
```

### Metrics to Track

1. **CORS rejection rate** - Should be near zero
2. **Rejected origins** - Identify attack patterns
3. **Preflight cache hits** - Performance optimization
4. **Configuration errors** - Deployment issues

## Compliance

This CORS implementation satisfies:

- **FedRAMP SC-7** - Boundary Protection
- **FedRAMP AC-4** - Information Flow Enforcement
- **CWE-346** - Origin Validation Error (mitigated)
- **CWE-942** - Overly Permissive CORS Policy (mitigated)

## Troubleshooting Commands

```bash
# Check current CORS configuration
npm run dev
# Look for "[CORS] Configuration initialized" logs

# Test CORS with curl
curl -X OPTIONS http://localhost:3000/api/health \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: GET" \
  -v

# Validate production configuration
NODE_ENV=production CORS_ORIGIN=https://example.com npm start

# Check health endpoint
curl http://localhost:3000/health
```

## References

- [CORS Specification](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Express CORS Package](https://www.npmjs.com/package/cors)
- [OWASP CORS Guide](https://cheatsheetseries.owasp.org/cheatsheets/CORS_Cheat_Sheet.html)
- [FedRAMP Security Controls](https://www.fedramp.gov/assets/resources/documents/FedRAMP_Security_Controls_Baseline.xlsx)
