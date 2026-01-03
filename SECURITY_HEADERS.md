# Security Headers Implementation

This document describes the comprehensive security headers implemented across all nginx configurations in the Fleet Management System.

## Overview

Security headers have been added to protect against common web vulnerabilities including:
- Cross-Site Scripting (XSS)
- Clickjacking attacks
- MIME type confusion attacks
- Information disclosure
- Injection attacks
- Man-in-the-middle attacks (when using HTTPS)

## Implemented Security Headers

### 1. X-Frame-Options: DENY

**Purpose:** Prevents clickjacking attacks by disallowing the application from being embedded in iframes.

**Configuration:**
```nginx
add_header X-Frame-Options "DENY" always;
```

**Security Benefit:** Prevents attackers from embedding the application in malicious iframes to trick users into clicking hidden elements.

**Note:** Changed from `SAMEORIGIN` to `DENY` for maximum protection. If iframe embedding is needed in the future, use `SAMEORIGIN` instead.

---

### 2. X-Content-Type-Options: nosniff

**Purpose:** Prevents MIME type sniffing attacks.

**Configuration:**
```nginx
add_header X-Content-Type-Options "nosniff" always;
```

**Security Benefit:** Forces browsers to respect the Content-Type header, preventing execution of malicious content disguised as innocent file types.

---

### 3. X-XSS-Protection: 1; mode=block

**Purpose:** Enables browser's built-in XSS protection (legacy browsers).

**Configuration:**
```nginx
add_header X-XSS-Protection "1; mode=block" always;
```

**Security Benefit:** While modern browsers rely on CSP, this provides protection for older browsers that don't support CSP.

---

### 4. Referrer-Policy: strict-origin-when-cross-origin

**Purpose:** Controls how much referrer information is sent with requests.

**Configuration:**
```nginx
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

**Security Benefit:**
- Sends full URL for same-origin requests
- Only sends origin (domain) for cross-origin HTTPS requests
- Sends nothing when downgrading from HTTPS to HTTP
- Prevents information leakage through referrer headers

---

### 5. Permissions-Policy

**Purpose:** Controls which browser features and APIs can be used.

**Configuration:**
```nginx
add_header Permissions-Policy "geolocation=(self), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), speaker=(self)" always;
```

**Security Benefit:** Prevents unauthorized access to sensitive browser APIs:
- `geolocation=(self)` - Only allows geolocation from same origin (needed for fleet tracking)
- `microphone=()` - Disables microphone access
- `camera=()` - Disables camera access
- `payment=()` - Disables payment API
- `usb=()` - Disables USB API
- `magnetometer=()` - Disables magnetometer
- `gyroscope=()` - Disables gyroscope
- `speaker=(self)` - Only allows speaker/audio from same origin

---

### 6. Content-Security-Policy (CSP)

**Purpose:** Comprehensive protection against XSS, injection attacks, and unauthorized resource loading.

**Configuration:**
```nginx
add_header Content-Security-Policy "
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com https://cdn.jsdelivr.net https://unpkg.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com data:;
  img-src 'self' data: https: blob: https://api.dicebear.com https://maps.googleapis.com https://maps.gstatic.com;
  connect-src 'self' wss: ws: https://maps.googleapis.com https://api.dicebear.com https://*.azure.com https://*.windows.net;
  frame-src 'self' https://login.microsoftonline.com;
  worker-src 'self' blob:;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
" always;
```

**Directive Breakdown:**

#### `default-src 'self'`
Default policy for all resource types - only allow resources from same origin.

#### `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com https://cdn.jsdelivr.net https://unpkg.com`
**Allowed:**
- `'self'` - Scripts from same origin
- `'unsafe-inline'` - Inline scripts (required for Vite/React development)
- `'unsafe-eval'` - eval() and similar (required for Vite HMR and some libraries)
- `https://maps.googleapis.com` - Google Maps API scripts
- `https://cdn.jsdelivr.net` - CDN libraries
- `https://unpkg.com` - NPM package CDN

**Security Note:** `unsafe-inline` and `unsafe-eval` reduce security. In production, consider:
- Using nonces or hashes for inline scripts
- Refactoring code to eliminate eval() usage
- Building with strict CSP-compatible settings

#### `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`
**Allowed:**
- `'self'` - Stylesheets from same origin
- `'unsafe-inline'` - Inline styles (required for dynamic styling)
- `https://fonts.googleapis.com` - Google Fonts CSS

#### `font-src 'self' https://fonts.gstatic.com data:`
**Allowed:**
- `'self'` - Fonts from same origin
- `https://fonts.gstatic.com` - Google Fonts files
- `data:` - Data URIs for embedded fonts

#### `img-src 'self' data: https: blob: https://api.dicebear.com https://maps.googleapis.com https://maps.gstatic.com`
**Allowed:**
- `'self'` - Images from same origin
- `data:` - Data URIs for inline images
- `https:` - Any HTTPS image source (for user uploads, external images)
- `blob:` - Blob URLs for dynamically generated images
- `https://api.dicebear.com` - DiceBear avatar API
- `https://maps.googleapis.com` - Google Maps images
- `https://maps.gstatic.com` - Google Maps static content

#### `connect-src 'self' wss: ws: https://maps.googleapis.com https://api.dicebear.com https://*.azure.com https://*.windows.net`
**Allowed:**
- `'self'` - API calls to same origin
- `wss:` / `ws:` - WebSocket connections (for real-time features)
- `https://maps.googleapis.com` - Google Maps API calls
- `https://api.dicebear.com` - DiceBear avatar API calls
- `https://*.azure.com` - Azure services
- `https://*.windows.net` - Azure storage and CDN

#### `frame-src 'self' https://login.microsoftonline.com`
**Allowed:**
- `'self'` - Iframes from same origin
- `https://login.microsoftonline.com` - Microsoft/Azure AD authentication

#### `worker-src 'self' blob:`
**Allowed:**
- `'self'` - Web Workers from same origin
- `blob:` - Workers created from blob URLs

#### `object-src 'none'`
**Disallowed:** No plugins (Flash, Java applets, etc.)

#### `base-uri 'self'`
**Allowed:** Only allows `<base>` tag to reference same origin

#### `form-action 'self'`
**Allowed:** Forms can only submit to same origin

#### `frame-ancestors 'none'`
**Disallowed:** Application cannot be embedded in iframes (redundant with X-Frame-Options DENY)

---

### 7. Strict-Transport-Security (HSTS)

**Purpose:** Forces browsers to use HTTPS for all future requests.

**Configuration (Production with HTTPS):**
```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
```

**Security Benefit:**
- `max-age=31536000` - Browser will use HTTPS for 1 year
- `includeSubDomains` - Applies to all subdomains
- `preload` - Allows inclusion in browser HSTS preload lists

**Status:** Currently commented out in non-HTTPS configs. Enabled in `nginx/fleet.conf` for production HTTPS deployments.

---

## Implementation Locations

### 1. Dockerfile (Container Production Build)
**File:** `/Users/andrewmorton/Documents/GitHub/Fleet/Dockerfile`

All security headers embedded in the nginx configuration for Kubernetes deployments.

### 2. Standalone Nginx Configuration
**File:** `/Users/andrewmorton/Documents/GitHub/Fleet/nginx.conf`

Security headers for local/VM deployments without HTTPS.

### 3. Production HTTPS Configuration
**File:** `/Users/andrewmorton/Documents/GitHub/Fleet/nginx/fleet.conf`

Full security headers including HSTS for production HTTPS deployments.

---

## Additional Security Measures

### Cache Control Headers
```nginx
# HTML files - never cache
add_header Cache-Control "no-cache, no-store, must-revalidate" always;

# Static assets - aggressive caching
expires 1y;
add_header Cache-Control "public, immutable" always;
```

### Hidden Server Information
```nginx
# Hide nginx version
server_tokens off;

# Hide backend headers
proxy_hide_header X-Powered-By;
proxy_hide_header Server;
```

### Access Restrictions
```nginx
# Deny access to hidden files
location ~ /\. {
    deny all;
    access_log off;
    log_not_found off;
}

# Deny access to sensitive files
location ~* \.(env|log|git|sql|md|sh|yml|yaml|bak|swp|~)$ {
    deny all;
    access_log off;
    log_not_found off;
}
```

---

## Testing Security Headers

### Using curl
```bash
curl -I https://your-domain.com | grep -i "x-frame-options\|x-content-type\|content-security-policy"
```

### Using SecurityHeaders.com
Visit https://securityheaders.com and enter your domain for a comprehensive security analysis.

### Using Mozilla Observatory
Visit https://observatory.mozilla.org for detailed security recommendations.

### Expected Grade
With all headers properly configured, you should receive:
- **SecurityHeaders.com:** A+ rating
- **Mozilla Observatory:** A or A+ rating

---

## Maintenance Notes

### Adding New External Resources

When adding new external APIs or CDNs, update the CSP:

1. **Scripts:** Add to `script-src`
2. **Stylesheets:** Add to `style-src`
3. **Images:** Add to `img-src`
4. **API Calls:** Add to `connect-src`
5. **Fonts:** Add to `font-src`
6. **Iframes:** Add to `frame-src`

**Example:** Adding a new analytics service:
```nginx
script-src 'self' 'unsafe-inline' ... https://analytics.example.com;
connect-src 'self' ... https://api.analytics.example.com;
```

### Tightening Security

For maximum security in production:

1. **Remove `unsafe-inline` and `unsafe-eval`:**
   - Refactor inline scripts to external files
   - Use CSP nonces or hashes
   - Eliminate eval() usage

2. **Restrict image sources:**
   - Replace `https:` with specific domains
   - Example: `img-src 'self' data: blob: https://trusted-cdn.com;`

3. **Enable HSTS Preload:**
   - Uncomment HSTS header
   - Submit domain to https://hstspreload.org

4. **Add Subresource Integrity (SRI):**
   - Add integrity hashes to CDN scripts
   - Example: `<script src="..." integrity="sha384-..." crossorigin="anonymous"></script>`

---

## Troubleshooting

### Browser Console CSP Errors

If you see CSP violations in the browser console:

1. **Identify the blocked resource:**
   ```
   Refused to load the script 'https://example.com/script.js' because it violates the following Content Security Policy directive: "script-src 'self'"
   ```

2. **Add the domain to the appropriate CSP directive:**
   ```nginx
   script-src 'self' https://example.com;
   ```

3. **Reload nginx:**
   ```bash
   nginx -s reload
   ```

### Testing CSP in Report-Only Mode

Before enforcing CSP, test with `Content-Security-Policy-Report-Only`:

```nginx
add_header Content-Security-Policy-Report-Only "default-src 'self'; report-uri /csp-report;" always;
```

This logs violations without blocking resources.

---

## Security Best Practices

1. **Always use `always` flag** - Ensures headers are sent even for error responses
2. **Test thoroughly** - Verify all functionality works with security headers enabled
3. **Monitor logs** - Watch for CSP violations and blocked resources
4. **Keep updated** - Review and update security headers as application evolves
5. **Use HTTPS in production** - Enable HSTS only after HTTPS is fully configured
6. **Regular audits** - Run security scans monthly
7. **Document changes** - Update this file when modifying CSP

---

## References

- [MDN Web Security Headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers#security)
- [Content Security Policy Reference](https://content-security-policy.com/)
- [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)
- [Mozilla Web Security Guidelines](https://infosec.mozilla.org/guidelines/web_security)

---

**Last Updated:** 2026-01-03
**Version:** 1.0
**Author:** Security Implementation Team
