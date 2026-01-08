# Secure HTTP Headers Reference

**Version**: 1.0
**Last Updated**: 2026-01-08
**Authority**: OWASP Secure Headers Project, Mozilla Web Security Guidelines
**Application**: CTAFleet Vehicle Management System

---

## Overview

HTTP security headers are a critical defense-in-depth layer that instructs browsers on how to handle your application's content. Proper configuration prevents many common attacks including XSS, clickjacking, MIME sniffing attacks, and information leakage.

**Security Headers Checklist**:
- [x] Content-Security-Policy (CSP)
- [x] Strict-Transport-Security (HSTS)
- [x] X-Frame-Options
- [x] X-Content-Type-Options
- [x] Referrer-Policy
- [x] Permissions-Policy
- [x] X-XSS-Protection (legacy support)
- [x] Secure Cookie Attributes

---

## 1. Content-Security-Policy (CSP)

### 1.1 Purpose
CSP prevents XSS attacks by controlling which resources (scripts, styles, images, etc.) can be loaded and executed.

### 1.2 Recommended Configuration

**Strict CSP (Best Practice)**:
```
Content-Security-Policy:
  default-src 'none';
  script-src 'self' 'nonce-{random}' 'strict-dynamic' https:;
  style-src 'self' 'nonce-{random}';
  img-src 'self' data: https:;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' https://api.ctafleet.com;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
  upgrade-insecure-requests;
```

**Production CSP for CTAFleet**:
```
Content-Security-Policy:
  default-src 'none';
  script-src 'self' 'nonce-{random}';
  style-src 'self' 'nonce-{random}' https://fonts.googleapis.com;
  img-src 'self' data: https:;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' https://api.ctafleet.com https://proud-bay-0fdc8040f.3.azurestaticapps.net;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
  object-src 'none';
  upgrade-insecure-requests;
  block-all-mixed-content;
```

### 1.3 Directive Breakdown

#### default-src
Controls the default policy for fetching resources.
- **Recommendation**: `'none'` (deny by default, explicitly allow what's needed)

#### script-src
Controls JavaScript execution.
- **Recommendation**: `'self' 'nonce-{random}'`
- **Never use**: `'unsafe-inline'` or `'unsafe-eval'` (defeats CSP purpose)

**Nonce-based approach (preferred)**:
```typescript
// Generate unique nonce per request
import crypto from 'crypto';

export const generateNonce = (): string => {
  return crypto.randomBytes(16).toString('base64');
};

// Middleware to add nonce
export const cspNonceMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  res.locals.cspNonce = generateNonce();
  next();
};

// Use in HTML
// <script nonce="{cspNonce}">...</script>
```

#### style-src
Controls CSS loading.
- **Recommendation**: `'self' 'nonce-{random}'`
- **If using external fonts**: Add `https://fonts.googleapis.com`

#### img-src
Controls image sources.
- **Recommendation**: `'self' data: https:`
- `data:` allows inline images (base64)
- `https:` allows any HTTPS image source

#### connect-src
Controls fetch, XMLHttpRequest, WebSocket, EventSource.
- **Recommendation**: `'self'` and specific API domains
- Example: `'self' https://api.ctafleet.com`

#### font-src
Controls font loading.
- **Recommendation**: `'self'`
- **If using Google Fonts**: Add `https://fonts.gstatic.com`

#### frame-ancestors
Controls where the page can be embedded (clickjacking protection).
- **Recommendation**: `'none'` (cannot be framed)
- Alternative: `'self'` (only same origin)

#### base-uri
Controls `<base>` tag usage (prevents base tag hijacking).
- **Recommendation**: `'self'`

#### form-action
Controls form submission targets.
- **Recommendation**: `'self'`

#### object-src
Controls `<object>`, `<embed>`, `<applet>` tags.
- **Recommendation**: `'none'` (block plugins)

#### upgrade-insecure-requests
Automatically upgrades HTTP requests to HTTPS.
- **Recommendation**: Always include

#### block-all-mixed-content
Blocks mixed content (HTTP resources on HTTPS page).
- **Recommendation**: Always include

### 1.4 Implementation

**Express.js with Helmet**:
```typescript
import helmet from 'helmet';
import crypto from 'crypto';

// CSP middleware
app.use((req, res, next) => {
  res.locals.cspNonce = crypto.randomBytes(16).toString('base64');
  next();
});

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'none'"],
      scriptSrc: [
        "'self'",
        (req, res) => `'nonce-${res.locals.cspNonce}'`,
      ],
      styleSrc: [
        "'self'",
        (req, res) => `'nonce-${res.locals.cspNonce}'`,
        'https://fonts.googleapis.com',
      ],
      imgSrc: ["'self'", 'data:', 'https:'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      connectSrc: [
        "'self'",
        'https://api.ctafleet.com',
        'https://proud-bay-0fdc8040f.3.azurestaticapps.net',
      ],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
      blockAllMixedContent: [],
    },
  })
);
```

**React with Nonce**:
```tsx
// Server-side rendering
const nonce = generateNonce();

const html = `
<!DOCTYPE html>
<html>
<head>
  <script nonce="${nonce}">
    window.__INITIAL_DATA__ = ${JSON.stringify(data)};
  </script>
  <style nonce="${nonce}">
    /* inline styles */
  </style>
</head>
<body>
  <div id="root">${appHtml}</div>
  <script nonce="${nonce}" src="/bundle.js"></script>
</body>
</html>
`;
```

### 1.5 CSP Reporting

**Report-Only Mode (for testing)**:
```
Content-Security-Policy-Report-Only:
  default-src 'self';
  report-uri /api/csp-violations;
```

**Violation Handler**:
```typescript
app.post('/api/csp-violations', express.json(), (req, res) => {
  const violation = req.body;

  logger.warn('CSP violation detected', {
    documentUri: violation['document-uri'],
    violatedDirective: violation['violated-directive'],
    blockedUri: violation['blocked-uri'],
    sourceFile: violation['source-file'],
    lineNumber: violation['line-number'],
  });

  res.status(204).end();
});
```

### 1.6 CSP Testing
- Use [CSP Evaluator](https://csp-evaluator.withgoogle.com/) to test policy
- Monitor CSP violations in production
- Start with Report-Only mode before enforcement

---

## 2. Strict-Transport-Security (HSTS)

### 2.1 Purpose
Forces browsers to only connect via HTTPS, preventing SSL stripping attacks.

### 2.2 Recommended Configuration

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

**Parameters**:
- `max-age=31536000`: 1 year (in seconds)
- `includeSubDomains`: Apply to all subdomains
- `preload`: Eligible for browser preload lists

### 2.3 Implementation

```typescript
app.use(
  helmet.hsts({
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  })
);
```

### 2.4 HSTS Preload
Submit your domain to [hstspreload.org](https://hstspreload.org/) for inclusion in browser preload lists.

**Requirements**:
1. Valid HTTPS certificate
2. Redirect HTTP to HTTPS
3. HSTS header with `max-age` ≥ 31536000
4. `includeSubDomains` directive
5. `preload` directive

**Warning**: Preload is **irreversible** (removal takes months). Ensure HTTPS works on all subdomains.

---

## 3. X-Frame-Options

### 3.1 Purpose
Prevents clickjacking attacks by controlling whether the page can be framed.

### 3.2 Recommended Configuration

```
X-Frame-Options: DENY
```

**Options**:
- `DENY`: Cannot be framed by any site
- `SAMEORIGIN`: Can only be framed by same origin
- `ALLOW-FROM uri`: Deprecated (use CSP frame-ancestors instead)

### 3.3 Implementation

```typescript
app.use(
  helmet.frameguard({
    action: 'deny',
  })
);
```

**Note**: CSP `frame-ancestors` directive supersedes X-Frame-Options. Include both for legacy browser support.

---

## 4. X-Content-Type-Options

### 4.1 Purpose
Prevents MIME type sniffing, forcing browsers to respect declared Content-Type.

### 4.2 Recommended Configuration

```
X-Content-Type-Options: nosniff
```

### 4.3 Implementation

```typescript
app.use(helmet.noSniff());
```

### 4.4 Impact
- Prevents browsers from interpreting files as a different MIME type
- Protects against polyglot attacks (file that's valid in multiple formats)
- Requires correct Content-Type headers

**Example**:
```typescript
// Serve files with correct Content-Type
app.get('/api/reports/:id.pdf', (req, res) => {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.sendFile(pdfPath);
});
```

---

## 5. Referrer-Policy

### 5.1 Purpose
Controls how much referrer information is sent with requests.

### 5.2 Recommended Configuration

```
Referrer-Policy: strict-origin-when-cross-origin
```

**Options** (from most to least restrictive):
- `no-referrer`: No referrer sent
- `no-referrer-when-downgrade`: No referrer on HTTPS → HTTP
- `origin`: Send only origin (not full URL)
- `origin-when-cross-origin`: Full URL for same-origin, origin for cross-origin
- `same-origin`: Referrer only on same-origin requests
- `strict-origin`: Origin only, no referrer on downgrade
- `strict-origin-when-cross-origin`: **Recommended** - Full URL same-origin, origin cross-origin, none on downgrade
- `unsafe-url`: Always send full URL (avoid)

### 5.3 Implementation

```typescript
app.use(
  helmet.referrerPolicy({
    policy: 'strict-origin-when-cross-origin',
  })
);
```

### 5.4 Privacy Considerations
- Prevents leaking sensitive information in URLs
- Protects user privacy
- Balances analytics needs with security

---

## 6. Permissions-Policy (formerly Feature-Policy)

### 6.1 Purpose
Controls which browser features and APIs can be used.

### 6.2 Recommended Configuration

```
Permissions-Policy:
  geolocation=(),
  microphone=(),
  camera=(),
  payment=(),
  usb=(),
  magnetometer=(),
  gyroscope=(),
  accelerometer=()
```

**For CTAFleet (needs geolocation for vehicle tracking)**:
```
Permissions-Policy:
  geolocation=(self),
  microphone=(),
  camera=(),
  payment=(),
  usb=(),
  magnetometer=(),
  gyroscope=(),
  accelerometer=()
```

### 6.3 Common Directives

- `geolocation`: GPS location
- `microphone`: Audio input
- `camera`: Video input
- `payment`: Payment Request API
- `usb`: WebUSB API
- `magnetometer`: Magnetometer sensor
- `gyroscope`: Gyroscope sensor
- `accelerometer`: Accelerometer sensor
- `autoplay`: Media autoplay
- `fullscreen`: Fullscreen API
- `picture-in-picture`: PiP mode

### 6.4 Implementation

```typescript
app.use((req, res, next) => {
  res.setHeader(
    'Permissions-Policy',
    'geolocation=(self), microphone=(), camera=(), payment=(), usb=()'
  );
  next();
});
```

---

## 7. X-XSS-Protection (Legacy)

### 7.1 Purpose
Enables browser XSS filters (legacy feature, superseded by CSP).

### 7.2 Recommended Configuration

```
X-XSS-Protection: 0
```

**Recommendation**: **Disable** this header (set to 0) as it can introduce vulnerabilities. Rely on CSP instead.

**Why disable?**
- XSS Auditor (Chrome) and XSS Filter (IE) have been deprecated
- Known to introduce XSS vulnerabilities in some cases
- CSP provides better protection

### 7.3 Implementation

```typescript
app.use(
  helmet.xssFilter({
    setOnOldIE: false, // Don't set for old IE
  })
);

// Or explicitly disable:
app.use((req, res, next) => {
  res.setHeader('X-XSS-Protection', '0');
  next();
});
```

---

## 8. Cookie Security Attributes

### 8.1 Secure Attribute
Ensures cookie only sent over HTTPS.

```
Set-Cookie: sessionId=abc123; Secure
```

### 8.2 HttpOnly Attribute
Prevents JavaScript access to cookie (XSS protection).

```
Set-Cookie: sessionId=abc123; HttpOnly
```

### 8.3 SameSite Attribute
Controls cross-site cookie sending (CSRF protection).

```
Set-Cookie: sessionId=abc123; SameSite=Strict
```

**Options**:
- `Strict`: Cookie only sent on same-site requests (best security)
- `Lax`: Cookie sent on top-level navigation (default in modern browsers)
- `None`: Cookie sent on all requests (requires Secure attribute)

### 8.4 Domain and Path Attributes
Limit cookie scope.

```
Set-Cookie: sessionId=abc123; Domain=.ctafleet.com; Path=/
```

### 8.5 Max-Age and Expires Attributes
Control cookie lifetime.

```
Set-Cookie: sessionId=abc123; Max-Age=900
```

### 8.6 __Host- and __Secure- Prefixes
Special cookie prefixes with security requirements.

**__Host- prefix**:
- Must have `Secure` attribute
- Must NOT have `Domain` attribute
- Must have `Path=/`

```
Set-Cookie: __Host-sessionId=abc123; Secure; Path=/; HttpOnly; SameSite=Strict
```

**__Secure- prefix**:
- Must have `Secure` attribute

```
Set-Cookie: __Secure-userId=123; Secure; HttpOnly; SameSite=Strict
```

### 8.7 Complete Secure Cookie Configuration

```typescript
app.use(
  session({
    name: '__Host-sid',
    secret: process.env.SESSION_SECRET!,
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: '/',
      // No domain attribute (required for __Host- prefix)
    },
    resave: false,
    saveUninitialized: false,
  })
);
```

---

## 9. Additional Security Headers

### 9.1 X-Permitted-Cross-Domain-Policies

Prevents Adobe Flash and PDF from loading content.

```
X-Permitted-Cross-Domain-Policies: none
```

```typescript
app.use((req, res, next) => {
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  next();
});
```

### 9.2 X-DNS-Prefetch-Control

Controls DNS prefetching (privacy consideration).

```
X-DNS-Prefetch-Control: off
```

```typescript
app.use(helmet.dnsPrefetchControl({ allow: false }));
```

### 9.3 X-Download-Options

Prevents IE from executing downloads in site's context.

```
X-Download-Options: noopen
```

```typescript
app.use(helmet.ieNoOpen());
```

### 9.4 Cross-Origin-Embedder-Policy (COEP)

Controls embedding of cross-origin resources.

```
Cross-Origin-Embedder-Policy: require-corp
```

### 9.5 Cross-Origin-Opener-Policy (COOP)

Controls cross-origin window interactions.

```
Cross-Origin-Opener-Policy: same-origin
```

### 9.6 Cross-Origin-Resource-Policy (CORP)

Controls who can load resources.

```
Cross-Origin-Resource-Policy: same-origin
```

**Implementation**:
```typescript
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  next();
});
```

---

## 10. Complete Implementation

### 10.1 Express.js with Helmet

```typescript
import express from 'express';
import helmet from 'helmet';
import crypto from 'crypto';

const app = express();

// Generate CSP nonce
app.use((req, res, next) => {
  res.locals.cspNonce = crypto.randomBytes(16).toString('base64');
  next();
});

// Apply all security headers
app.use(
  helmet({
    // Content Security Policy
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        scriptSrc: [
          "'self'",
          (req, res) => `'nonce-${res.locals.cspNonce}'`,
        ],
        styleSrc: [
          "'self'",
          (req, res) => `'nonce-${res.locals.cspNonce}'`,
          'https://fonts.googleapis.com',
        ],
        imgSrc: ["'self'", 'data:', 'https:'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        connectSrc: [
          "'self'",
          'https://api.ctafleet.com',
        ],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
        blockAllMixedContent: [],
      },
    },

    // HTTP Strict Transport Security
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },

    // X-Frame-Options
    frameguard: {
      action: 'deny',
    },

    // X-Content-Type-Options
    noSniff: true,

    // Referrer-Policy
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin',
    },

    // X-DNS-Prefetch-Control
    dnsPrefetchControl: {
      allow: false,
    },

    // X-Download-Options
    ieNoOpen: true,

    // X-Permitted-Cross-Domain-Policies
    crossdomain: { permittedPolicies: 'none' },
  })
);

// Additional headers not in Helmet
app.use((req, res, next) => {
  res.setHeader(
    'Permissions-Policy',
    'geolocation=(self), microphone=(), camera=(), payment=(), usb=()'
  );
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  res.setHeader('X-XSS-Protection', '0');
  next();
});

// Session configuration
app.use(
  session({
    name: '__Host-sid',
    secret: process.env.SESSION_SECRET!,
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
      path: '/',
    },
    resave: false,
    saveUninitialized: false,
    store: new RedisStore({ client: redisClient }),
  })
);

export default app;
```

### 10.2 Azure Static Web Apps Configuration

**staticwebapp.config.json**:
```json
{
  "globalHeaders": {
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "geolocation=(self), microphone=(), camera=(), payment=()",
    "X-XSS-Protection": "0",
    "Cross-Origin-Embedder-Policy": "require-corp",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin"
  },
  "routes": [
    {
      "route": "/*",
      "headers": {
        "Content-Security-Policy": "default-src 'none'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://api.ctafleet.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'; upgrade-insecure-requests; block-all-mixed-content;"
      }
    }
  ]
}
```

---

## 11. CORS Configuration

### 11.1 Purpose
Control cross-origin resource sharing.

### 11.2 Secure CORS Configuration

```typescript
import cors from 'cors';

const corsOptions = {
  origin: (origin: string | undefined, callback: Function) => {
    const allowedOrigins = [
      'https://fleet.ctafleet.com',
      'https://proud-bay-0fdc8040f.3.azurestaticapps.net',
    ];

    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-CSRF-Token',
    'X-Requested-With',
  ],
  exposedHeaders: ['X-Total-Count'],
  maxAge: 86400, // 24 hours (preflight cache)
};

app.use(cors(corsOptions));
```

### 11.3 CORS Preflight Handling

```typescript
// Handle preflight requests
app.options('*', cors(corsOptions));

// Apply CORS to all routes
app.use(cors(corsOptions));
```

---

## 12. Security Headers Testing

### 12.1 Online Tools
- [Security Headers](https://securityheaders.com/) - Analyze your headers
- [Mozilla Observatory](https://observatory.mozilla.org/) - Comprehensive security scan
- [CSP Evaluator](https://csp-evaluator.withgoogle.com/) - Test CSP policy

### 12.2 Manual Testing

```bash
# Check headers with curl
curl -I https://fleet.ctafleet.com

# Check specific header
curl -I https://fleet.ctafleet.com | grep -i "Content-Security-Policy"
```

### 12.3 Automated Testing

```typescript
// Jest test for security headers
describe('Security Headers', () => {
  it('should set Content-Security-Policy', async () => {
    const response = await request(app).get('/');
    expect(response.headers['content-security-policy']).toBeDefined();
    expect(response.headers['content-security-policy']).toContain("default-src 'none'");
  });

  it('should set Strict-Transport-Security', async () => {
    const response = await request(app).get('/');
    expect(response.headers['strict-transport-security']).toBe(
      'max-age=31536000; includeSubDomains; preload'
    );
  });

  it('should set X-Frame-Options', async () => {
    const response = await request(app).get('/');
    expect(response.headers['x-frame-options']).toBe('DENY');
  });

  it('should set secure cookie attributes', async () => {
    const response = await request(app).post('/api/login').send({
      email: 'test@example.com',
      password: 'password123',
    });

    const cookie = response.headers['set-cookie'][0];
    expect(cookie).toContain('Secure');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Strict');
  });
});
```

---

## 13. Common Pitfalls

### 13.1 CSP Pitfalls
- Using `'unsafe-inline'` or `'unsafe-eval'` (defeats purpose)
- Not using nonces or hashes for inline scripts
- Allowing `data:` for `script-src` (XSS risk)
- Not monitoring CSP violations

### 13.2 HSTS Pitfalls
- Not covering all subdomains
- Setting `max-age` too short
- Preloading before testing thoroughly (irreversible)

### 13.3 Cookie Pitfalls
- Not using `HttpOnly` (XSS vulnerability)
- Not using `Secure` (session hijacking)
- Using `SameSite=None` without `Secure`
- Not using `__Host-` prefix for sensitive cookies

### 13.4 CORS Pitfalls
- Using wildcard `*` with credentials
- Allowing any origin without validation
- Not handling preflight requests
- Exposing sensitive headers

---

## 14. Monitoring and Maintenance

### 14.1 CSP Violation Monitoring

```typescript
// CSP violation endpoint
app.post('/api/csp-violations', express.json(), (req, res) => {
  const violation = req.body;

  logger.warn('CSP violation', {
    documentUri: violation['document-uri'],
    violatedDirective: violation['violated-directive'],
    blockedUri: violation['blocked-uri'],
    sourceFile: violation['source-file'],
    lineNumber: violation['line-number'],
    columnNumber: violation['column-number'],
  });

  // Alert on repeated violations
  if (isRepeatedViolation(violation)) {
    alertSecurityTeam(violation);
  }

  res.status(204).end();
});
```

### 14.2 Regular Reviews
- Review headers quarterly
- Update CSP as application evolves
- Monitor security advisories
- Test with browser updates

### 14.3 Metrics to Track
- CSP violation rate
- HSTS compliance
- Cookie security score
- Cross-origin requests

---

## 15. References

1. **OWASP Secure Headers Project**: https://owasp.org/www-project-secure-headers/
2. **Mozilla Web Security**: https://infosec.mozilla.org/guidelines/web_security
3. **CSP Reference**: https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
4. **HSTS Preload**: https://hstspreload.org/
5. **Helmet.js**: https://helmetjs.github.io/
6. **Security Headers**: https://securityheaders.com/
7. **Content Security Policy Level 3**: https://www.w3.org/TR/CSP3/

---

## 16. Quick Reference

### 16.1 Security Headers Checklist

| Header | Value | Priority |
|--------|-------|----------|
| Content-Security-Policy | Strict policy with nonces | Critical |
| Strict-Transport-Security | max-age=31536000; includeSubDomains; preload | Critical |
| X-Frame-Options | DENY | High |
| X-Content-Type-Options | nosniff | High |
| Referrer-Policy | strict-origin-when-cross-origin | Medium |
| Permissions-Policy | Restrictive policy | Medium |
| X-XSS-Protection | 0 (disabled) | Low |

### 16.2 Cookie Security Checklist

- [ ] HttpOnly attribute
- [ ] Secure attribute
- [ ] SameSite=Strict
- [ ] __Host- prefix for session cookies
- [ ] Appropriate Max-Age/Expires
- [ ] Minimal scope (Domain, Path)

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-08 | STANDARDS-001 | Initial secure headers reference |

---

**Document Classification**: Internal Use
**Next Review Date**: 2027-01-08
