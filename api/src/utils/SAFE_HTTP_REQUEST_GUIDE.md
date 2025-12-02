# Safe HTTP Request Utility - Developer Guide

## Quick Start

Import the safe HTTP request utility instead of using axios directly:

```typescript
import { safeGet, safePost, validateURL, SSRFError } from '../utils/safe-http-request'

// DON'T DO THIS (Vulnerable to SSRF):
const response = await axios.get(userProvidedUrl)

// DO THIS INSTEAD (Protected against SSRF):
const response = await safeGet(userProvidedUrl)
```

---

## Basic Usage

### Safe GET Request

```typescript
import { safeGet } from '../utils/safe-http-request'

try {
  const response = await safeGet('https://api.example.com/data', {
    params: { id: 123 },
    timeout: 30000
  })
  console.log(response.data)
} catch (error) {
  if (error instanceof SSRFError) {
    console.error('SSRF attempt blocked:', error.reason)
  }
}
```

### Safe POST Request

```typescript
import { safePost } from '../utils/safe-http-request'

const response = await safePost('https://api.example.com/users', {
  name: 'John Doe',
  email: 'john@example.com'
}, {
  headers: { 'Content-Type': 'application/json' }
})
```

### Validate URL Before Use

```typescript
import { validateURL, SSRFError } from '../utils/safe-http-request'

try {
  validateURL(userUrl, {
    allowedDomains: ['api.example.com', 'cdn.example.com']
  })
  // URL is safe to use
} catch (error) {
  if (error instanceof SSRFError) {
    console.error('Invalid URL:', error.reason)
  }
}
```

---

## Custom Domain Whitelist

You can specify custom allowed domains for specific use cases:

```typescript
const response = await safeGet(videoUrl, {
  allowedDomains: [
    'videos.example.com',
    's3.amazonaws.com',
    'storage.googleapis.com'
  ],
  timeout: 60000 // 1 minute for large files
})
```

### Wildcard Subdomains

Use `*.domain.com` to allow all subdomains:

```typescript
validateURL(blobUrl, {
  allowedDomains: [
    '*.blob.core.windows.net',  // Allows any.blob.core.windows.net
    'storage.example.com'        // Only exact match
  ]
})
```

---

## Creating Safe Axios Instances

For services that make multiple requests to the same base URL:

```typescript
import { createSafeAxiosInstance } from '../utils/safe-http-request'

const api = createSafeAxiosInstance('https://api.example.com', {
  allowedDomains: ['api.example.com'],
  timeout: 30000
})

// All requests through this instance are automatically validated
const users = await api.get('/users')
const user = await api.post('/users', { name: 'John' })
```

---

## What Gets Blocked

The utility automatically blocks:

### 1. Private IP Addresses
- `10.0.0.0/8` (10.0.0.0 - 10.255.255.255)
- `172.16.0.0/12` (172.16.0.0 - 172.31.255.255)
- `192.168.0.0/16` (192.168.0.0 - 192.168.255.255)
- `127.0.0.0/8` (127.0.0.1 - localhost)

### 2. Cloud Metadata Endpoints
- `169.254.169.254` (AWS/Azure metadata)
- `metadata.google.internal` (GCP metadata)

### 3. Invalid Schemes
- `file://` (local files)
- `ftp://` (FTP)
- `gopher://` (Gopher)
- Only `http://` and `https://` are allowed

### 4. Blocked Hostnames
- `localhost`
- `::1` (IPv6 localhost)

### 5. Non-Whitelisted Domains
- Any domain not in the allowed list

---

## Error Handling

```typescript
import { safeGet, SSRFError } from '../utils/safe-http-request'

try {
  const response = await safeGet(url)
} catch (error) {
  if (error instanceof SSRFError) {
    // SSRF protection blocked the request
    console.error(`SSRF blocked: ${error.message}`)
    console.error(`URL: ${error.url}`)
    console.error(`Reason: ${error.reason}`)

    // Log for security monitoring
    logger.warn('SSRF attempt detected', {
      url: error.url,
      reason: error.reason,
      userId: currentUser.id
    })
  } else {
    // Other error (network, timeout, etc.)
    console.error('Request failed:', error)
  }
}
```

---

## Real-World Examples

### Example 1: Camera Data Source Sync

```typescript
// ❌ VULNERABLE
async function syncCameraData(source: CameraDataSource) {
  const url = `${source.service_url}/query`
  const response = await axios.get(url)  // SSRF risk!
  return response.data
}

// ✅ SECURE
import { safeGet, validateURL } from '../utils/safe-http-request'

async function syncCameraData(source: CameraDataSource) {
  const url = `${source.service_url}/query`

  // Validate URL first
  validateURL(url, {
    allowedDomains: ['services.arcgis.com', 'arcgis.com']
  })

  const response = await safeGet(url, {
    allowedDomains: ['services.arcgis.com', 'arcgis.com'],
    timeout: 30000
  })

  return response.data
}
```

### Example 2: Video Download

```typescript
// ❌ VULNERABLE
async function downloadVideo(videoUrl: string) {
  const response = await axios.get(videoUrl, {
    responseType: 'arraybuffer'
  })
  return response.data
}

// ✅ SECURE
import { safeGet } from '../utils/safe-http-request'

async function downloadVideo(videoUrl: string) {
  const response = await safeGet(videoUrl, {
    responseType: 'arraybuffer',
    allowedDomains: [
      'videos.samsara.com',
      's3.amazonaws.com'
    ],
    timeout: 300000  // 5 minutes for large files
  })
  return response.data
}
```

### Example 3: Webhook URL Validation

```typescript
// ❌ VULNERABLE
async function createWebhook(webhookUrl: string) {
  await api.post('/subscriptions', {
    notificationUrl: webhookUrl  // User-controlled!
  })
}

// ✅ SECURE
import { validateURL } from '../utils/safe-http-request'

async function createWebhook(webhookUrl: string) {
  // Only allow webhooks to our application
  validateURL(webhookUrl, {
    allowedDomains: [
      'fleet.capitaltechalliance.com',
      process.env.WEBHOOK_BASE_URL
    ]
  })

  await api.post('/subscriptions', {
    notificationUrl: webhookUrl
  })
}
```

---

## Best Practices

### 1. Always Validate User-Provided URLs

```typescript
// Any URL that comes from:
// - Database (can be modified by users/admins)
// - API parameters
// - External services (webhooks, callbacks)
// - Configuration files

const userUrl = req.body.url
validateURL(userUrl, { allowedDomains: TRUSTED_DOMAINS })
```

### 2. Use Strict Whitelists

```typescript
// ❌ TOO PERMISSIVE
allowedDomains: ['*']  // Don't do this!

// ✅ SPECIFIC DOMAINS
allowedDomains: [
  'api.example.com',
  'cdn.example.com'
]
```

### 3. Log Blocked Attempts

```typescript
try {
  await safeGet(url)
} catch (error) {
  if (error instanceof SSRFError) {
    logger.warn('SSRF attempt blocked', {
      url: error.url,
      reason: error.reason,
      userId: req.user?.id,
      ip: req.ip,
      timestamp: new Date()
    })
  }
}
```

### 4. Set Appropriate Timeouts

```typescript
// Small data requests
await safeGet(url, { timeout: 30000 })  // 30 seconds

// Large file downloads
await safeGet(videoUrl, { timeout: 300000 })  // 5 minutes

// Quick health checks
await safeGet(healthUrl, { timeout: 5000 })  // 5 seconds
```

---

## Configuration

Update allowed domains in `/api/src/utils/safe-http-request.ts`:

```typescript
const DEFAULT_ALLOWED_DOMAINS = [
  // Add your trusted external services here
  'api.example.com',
  'cdn.example.com',
  // ...
]
```

For environment-specific configuration:

```typescript
const allowedDomains = [
  process.env.API_BASE_URL,
  process.env.CDN_URL,
  'fallback.example.com'
].filter(Boolean)
```

---

## Testing

Add tests for SSRF protection:

```typescript
import { safeGet, SSRFError } from '../utils/safe-http-request'

describe('SSRF Protection', () => {
  it('should block localhost', async () => {
    await expect(
      safeGet('http://localhost:8080')
    ).rejects.toThrow(SSRFError)
  })

  it('should block private IPs', async () => {
    await expect(
      safeGet('http://192.168.1.1')
    ).rejects.toThrow(SSRFError)
  })

  it('should block metadata endpoint', async () => {
    await expect(
      safeGet('http://169.254.169.254/latest/meta-data/')
    ).rejects.toThrow(SSRFError)
  })

  it('should allow whitelisted domains', async () => {
    const response = await safeGet('https://api.example.com/data', {
      allowedDomains: ['api.example.com']
    })
    expect(response).toBeDefined()
  })
})
```

---

## Migration Checklist

When migrating existing code:

- [ ] Find all `axios.get()`, `axios.post()`, etc. with user-controlled URLs
- [ ] Replace with `safeGet()`, `safePost()`, etc.
- [ ] Add domain whitelist for each service
- [ ] Add error handling for `SSRFError`
- [ ] Add logging for blocked attempts
- [ ] Test with valid and invalid URLs
- [ ] Update documentation

---

## FAQ

**Q: Can I disable SSRF protection for testing?**
A: Use the `allowPrivateIPs: true` option (not recommended for production):

```typescript
await safeGet(url, {
  allowPrivateIPs: true  // TESTING ONLY!
})
```

**Q: How do I allow IP addresses instead of domains?**
A: Add IP addresses to the allowed domains list:

```typescript
allowedDomains: ['192.168.1.100', '10.0.0.50']
```

**Q: What if I need to access a new external service?**
A: Add the domain to your allowed domains list:

```typescript
await safeGet(url, {
  allowedDomains: ['new-service.com']
})
```

**Q: Does this work with GraphQL or other HTTP clients?**
A: Yes! The utility works with any axios-compatible client:

```typescript
const client = createSafeAxiosInstance('https://graphql.example.com')
const result = await client.post('/graphql', { query: '...' })
```

---

## Support

For questions or issues:
- Review this guide
- Check the main security report: `/home/user/Fleet/SSRF_SECURITY_FIXES.md`
- Contact the security team: security@capitaltechalliance.com

---

**Remember: When in doubt, validate the URL!** 🔒
