# OWASP Top 10 2021

## Overview

The **OWASP Top 10** is a standard awareness document for developers and web application security. It represents a broad consensus about the most critical security risks to web applications.

**Last Updated**: 2021
**Applicable To**: All web applications including Fleet Management Application

---

## A01:2021 - Broken Access Control

### Description

Access control enforces policy such that users cannot act outside of their intended permissions. Failures typically lead to unauthorized information disclosure, modification, or destruction of data, or performing business functions outside the user's limits.

**Moved up from #5 in 2017**

### Common Weaknesses (CWE)
- CWE-200: Exposure of Sensitive Information
- CWE-201: Insertion of Sensitive Information Into Sent Data
- CWE-352: Cross-Site Request Forgery (CSRF)

### Examples

**Insecure Direct Object Reference (IDOR)**:
```javascript
// Vulnerable code
app.get('/api/vehicles/:id', async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id);
  res.json(vehicle); // Any user can access any vehicle!
});

// Secure code
app.get('/api/vehicles/:id', async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id);

  // Check ownership or role
  if (vehicle.ownerId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }

  res.json(vehicle);
});
```

**Elevation of Privilege**:
```javascript
// Vulnerable: User can modify their own role
app.put('/api/users/:id', async (req, res) => {
  await User.update(req.params.id, req.body); // Can set role: 'admin'!
});

// Secure: Whitelist allowed fields
app.put('/api/users/:id', async (req, res) => {
  const { name, email } = req.body;
  // Role changes require admin privileges
  await User.update(req.params.id, { name, email });
});
```

### Prevention

1. **Deny by default**: Except for public resources, deny access by default
2. **Implement access control mechanisms**: Centralized, reusable across application
3. **Enforce record ownership**: Users can only access their own records
4. **Disable directory listing**: Do not expose file listings
5. **Log access control failures**: Alert admins on repeated failures
6. **Rate limit API calls**: Prevent automated enumeration attacks
7. **Invalidate sessions on logout**: JWT tokens in blocklist, server sessions destroyed

### Testing

```javascript
// Test: User cannot access another user's data
test('IDOR prevention', async () => {
  const user1 = await createUser();
  const user2 = await createUser();
  const vehicle1 = await createVehicle({ ownerId: user1.id });

  const response = await request(app)
    .get(`/api/vehicles/${vehicle1.id}`)
    .set('Authorization', `Bearer ${user2.token}`); // User 2 tries to access User 1's vehicle

  expect(response.status).toBe(403);
});
```

---

## A02:2021 - Cryptographic Failures

### Description

Previously known as "Sensitive Data Exposure," this focuses on failures related to cryptography (or lack thereof), which often lead to exposure of sensitive data.

**Moved up from #3 in 2017**

### Common Weaknesses (CWE)
- CWE-259: Use of Hard-coded Password
- CWE-327: Use of a Broken or Risky Cryptographic Algorithm
- CWE-331: Insufficient Entropy

### Examples

**Sensitive Data in Transit (No HTTPS)**:
```javascript
// Vulnerable: HTTP only
const server = http.createServer(app);
server.listen(3000);

// Secure: HTTPS with strong ciphers
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('private-key.pem'),
  cert: fs.readFileSync('certificate.pem'),
  ciphers: 'ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-GCM-SHA256',
  honorCipherOrder: true,
  minVersion: 'TLSv1.2'
};

const server = https.createServer(options, app);
server.listen(443);
```

**Sensitive Data at Rest (Plaintext Storage)**:
```javascript
// Vulnerable: Storing passwords in plaintext
user.password = req.body.password; // NEVER!

// Secure: Hash passwords with bcrypt
const bcrypt = require('bcrypt');
user.passwordHash = await bcrypt.hash(req.body.password, 12);
```

**Weak Cryptography**:
```javascript
// Vulnerable: MD5 hashing
const crypto = require('crypto');
const hash = crypto.createHash('md5').update(data).digest('hex'); // Broken!

// Secure: SHA-256 or better
const hash = crypto.createHash('sha256').update(data).digest('hex');

// Even better: bcrypt for passwords
const passwordHash = await bcrypt.hash(password, 12);
```

### Prevention

1. **Classify data**: Identify which data is sensitive (PII, credentials, financial)
2. **Encrypt data at rest**: Use AES-256 for sensitive data in databases
3. **Encrypt data in transit**: Use TLS 1.2+ with strong ciphers
4. **Disable caching**: For responses containing sensitive data
5. **Store passwords securely**: bcrypt, argon2id (cost ≥ 12)
6. **Use strong algorithms**: FIPS 140-2 approved (AES-256, SHA-256, RSA-2048+)
7. **Manage keys properly**: Use Azure Key Vault, rotate regularly
8. **Enforce HTTPS**: HSTS header, redirect HTTP to HTTPS
9. **Avoid deprecated crypto**: No MD5, SHA1, DES, 3DES, RC4

### Testing

```javascript
// Test: HTTPS enforcement
test('Redirects HTTP to HTTPS', async () => {
  const response = await request('http://example.com').get('/');
  expect(response.status).toBe(301);
  expect(response.headers.location).toMatch(/^https:/);
});

// Test: Passwords are hashed
test('Password stored as hash', async () => {
  const user = await User.create({ email: 'test@example.com', password: 'SecurePass123' });
  const dbUser = await User.findById(user.id);

  expect(dbUser.password).toBeUndefined(); // No plaintext password
  expect(dbUser.passwordHash).toBeDefined();
  expect(dbUser.passwordHash).not.toBe('SecurePass123');
  expect(await bcrypt.compare('SecurePass123', dbUser.passwordHash)).toBe(true);
});
```

---

## A03:2021 - Injection

### Description

An application is vulnerable to attack when user-supplied data is not validated, filtered, or sanitized. Most common: SQL injection, NoSQL injection, OS command injection, LDAP injection.

**Moved down from #1 in 2017**

### Common Weaknesses (CWE)
- CWE-79: Cross-site Scripting (XSS)
- CWE-89: SQL Injection
- CWE-73: External Control of File Name or Path

### Examples

**SQL Injection**:
```javascript
// Vulnerable: String concatenation
const query = `SELECT * FROM users WHERE email = '${email}'`;
const users = await db.query(query); // Can inject: ' OR '1'='1

// Secure: Parameterized query
const query = 'SELECT * FROM users WHERE email = $1';
const users = await db.query(query, [email]);
```

**NoSQL Injection**:
```javascript
// Vulnerable: Direct object in query
const user = await User.findOne({ email: req.body.email }); // Can inject: {"$ne": null}

// Secure: Validate and sanitize
const email = String(req.body.email);
if (!validator.isEmail(email)) {
  throw new Error('Invalid email');
}
const user = await User.findOne({ email });
```

**OS Command Injection**:
```javascript
// Vulnerable: exec with user input
const { exec } = require('child_process');
exec(`ping -c 4 ${host}`, (error, stdout) => {}); // Can inject: 8.8.8.8; rm -rf /

// Secure: execFile with array
const { execFile } = require('child_process');
execFile('ping', ['-c', '4', host], (error, stdout) => {});

// Better: Avoid shelling out
const ping = require('ping');
const result = await ping.promise.probe(host);
```

**XSS (Cross-Site Scripting)**:
```javascript
// Vulnerable: Unescaped user input
res.send(`<h1>Welcome ${username}</h1>`); // Can inject: <script>alert(1)</script>

// Secure: Use template engine with auto-escaping
res.render('welcome', { username }); // Auto-escaped by EJS/Pug

// Or explicit escaping
const escape = require('escape-html');
res.send(`<h1>Welcome ${escape(username)}</h1>`);
```

### Prevention

1. **Use parameterized queries**: Prepared statements, ORMs
2. **Validate input**: Whitelist approach, reject unexpected input
3. **Escape output**: Context-aware encoding (HTML, JavaScript, SQL, OS)
4. **Use safe APIs**: Avoid shell execution, use parameterized APIs
5. **Positive validation**: Define allowed characters, lengths, patterns
6. **Limit privileges**: Database user has minimum required permissions
7. **Use SAST tools**: Automated detection of injection vulnerabilities

### Testing

```javascript
// Test: SQL injection prevention
test('Prevents SQL injection', async () => {
  const maliciousEmail = "' OR '1'='1";
  const response = await request(app)
    .post('/api/login')
    .send({ email: maliciousEmail, password: 'test' });

  expect(response.status).toBe(401); // Not 200 (authentication should fail)
});

// Test: XSS prevention
test('Escapes HTML in output', async () => {
  const maliciousName = '<script>alert(1)</script>';
  await User.create({ name: maliciousName, email: 'test@example.com' });

  const response = await request(app).get('/users');

  expect(response.text).not.toContain('<script>');
  expect(response.text).toContain('&lt;script&gt;'); // Escaped
});
```

---

## A04:2021 - Insecure Design

### Description

A new category focused on risks related to design and architectural flaws. Calls for more use of threat modeling, secure design patterns, and reference architectures.

**New category in 2021**

### Common Weaknesses (CWE)
- CWE-209: Generation of Error Message Containing Sensitive Information
- CWE-256: Plaintext Storage of a Password
- CWE-501: Trust Boundary Violation
- CWE-522: Insufficiently Protected Credentials

### Examples

**Missing Rate Limiting**:
```javascript
// Vulnerable: No rate limiting on password reset
app.post('/api/reset-password', async (req, res) => {
  await sendPasswordResetEmail(req.body.email);
  res.json({ message: 'Reset email sent' }); // Can be abused for enumeration
});

// Secure: Rate limiting
const rateLimit = require('express-rate-limit');

const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 requests per window
  message: 'Too many password reset attempts, please try again later'
});

app.post('/api/reset-password', resetLimiter, async (req, res) => {
  await sendPasswordResetEmail(req.body.email);
  res.json({ message: 'If that email exists, a reset link has been sent' }); // Generic message
});
```

**Insufficient Logging**:
```javascript
// Vulnerable: No audit logging
app.post('/api/vehicles/:id', async (req, res) => {
  await Vehicle.update(req.params.id, req.body);
  res.json({ success: true });
});

// Secure: Comprehensive audit logging
app.post('/api/vehicles/:id', async (req, res) => {
  const before = await Vehicle.findById(req.params.id);
  await Vehicle.update(req.params.id, req.body);
  const after = await Vehicle.findById(req.params.id);

  auditLog.write({
    eventType: 'VEHICLE_UPDATE',
    userId: req.user.id,
    resourceId: req.params.id,
    changesBefore: before,
    changesAfter: after,
    ipAddress: req.ip,
    timestamp: new Date()
  });

  res.json({ success: true });
});
```

### Prevention

1. **Threat modeling**: Use STRIDE, PASTA, or attack trees in design phase
2. **Secure design patterns**: Use established patterns (OAuth, RBAC)
3. **Defense in depth**: Multiple layers of security controls
4. **Separation of tiers**: Separate network layers, containerization
5. **Limit resource consumption**: Rate limiting, quotas, timeouts
6. **Security requirements**: Define security acceptance criteria in user stories
7. **Secure SDLC**: Integrate security into all phases

---

## A05:2021 - Security Misconfiguration

### Description

Missing appropriate security hardening, unnecessary features enabled, default accounts, overly informative error messages, or outdated software.

**Moved up from #6 in 2017**

### Common Weaknesses (CWE)
- CWE-16: Configuration
- CWE-209: Generation of Error Message Containing Sensitive Information

### Examples

**Verbose Error Messages**:
```javascript
// Vulnerable: Expose stack trace
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.stack }); // Exposes internal paths!
});

// Secure: Generic error message
app.use((err, req, res, next) => {
  const errorId = crypto.randomUUID();

  logger.error('Unhandled error', { errorId, error: err.stack, userId: req.user?.id });

  res.status(500).json({
    error: 'An unexpected error occurred',
    errorId
  });
});
```

**Missing Security Headers**:
```javascript
// Vulnerable: No security headers
app.get('/', (req, res) => {
  res.send('<h1>Welcome</h1>');
});

// Secure: Use Helmet middleware
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

**Default Credentials**:
```javascript
// Vulnerable: Default admin account
const DEFAULT_ADMIN = {
  username: 'admin',
  password: 'admin123' // NEVER!
};

// Secure: Force password change on first login
const admin = await User.create({
  username: 'admin',
  temporaryPassword: generateRandomPassword(),
  mustChangePassword: true
});

// Send temporary password via secure channel
await sendEmail(admin.email, 'Your temporary password', temporaryPassword);
```

### Prevention

1. **Minimal platform**: Remove unused features, frameworks, documentation
2. **Security headers**: CSP, HSTS, X-Content-Type-Options, X-Frame-Options
3. **Error handling**: Generic error messages, detailed logs server-side
4. **Disable defaults**: Default accounts, sample applications, unnecessary services
5. **Patch management**: Keep all dependencies up-to-date
6. **Configuration review**: Regularly review security settings
7. **Automated scanning**: Use tools to detect misconfigurations

### Testing

```javascript
// Test: Security headers present
test('Security headers configured', async () => {
  const response = await request(app).get('/');

  expect(response.headers['strict-transport-security']).toBeDefined();
  expect(response.headers['x-content-type-options']).toBe('nosniff');
  expect(response.headers['x-frame-options']).toBe('DENY');
  expect(response.headers['content-security-policy']).toBeDefined();
});

// Test: No stack traces in errors
test('Error messages do not expose stack traces', async () => {
  const response = await request(app).get('/api/trigger-error');

  expect(response.status).toBe(500);
  expect(response.body.error).not.toContain('at '); // No stack trace
  expect(response.body.error).not.toContain('.js:'); // No file paths
});
```

---

## A06:2021 - Vulnerable and Outdated Components

### Description

Using components with known vulnerabilities, unsupported or outdated software, or not patching in a timely fashion.

**Previously "Using Components with Known Vulnerabilities" (#9 in 2017)**

### Common Weaknesses (CWE)
- CWE-1035: 2017 Top 10 A9: Using Components with Known Vulnerabilities
- CWE-1104: Use of Unmaintained Third Party Components

### Examples

**Outdated Dependencies**:
```json
// Vulnerable: Old versions with known CVEs
{
  "dependencies": {
    "express": "3.0.0",  // Ancient version!
    "lodash": "4.17.11"  // Prototype pollution vulnerability
  }
}

// Secure: Up-to-date versions
{
  "dependencies": {
    "express": "^4.18.2",
    "lodash": "^4.17.21"
  }
}
```

### Prevention

1. **Inventory components**: Maintain SBOM (Software Bill of Materials)
2. **Monitor vulnerabilities**: Use Dependabot, Snyk, npm audit
3. **Update regularly**: Apply security patches within 30 days
4. **Remove unused**: Delete unused dependencies
5. **Source from trusted repos**: Use official registries (npm, PyPI)
6. **Verify checksums**: Validate package integrity
7. **Automate scanning**: CI/CD integration for vulnerability detection

### Tooling

```bash
# npm audit
npm audit
npm audit fix

# Snyk
npx snyk test
npx snyk monitor

# OWASP Dependency-Check
dependency-check --project Fleet --scan ./

# GitHub Dependabot
# Enable in repository settings

# Generate SBOM
npx @cyclonedx/cyclonedx-npm --output-file sbom.json
```

### Testing

```javascript
// CI/CD pipeline check
{
  "scripts": {
    "security-check": "npm audit --audit-level=high"
  }
}

// GitHub Actions
name: Security Scan
on: [push, pull_request]
jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm audit --audit-level=high
      - uses: snyk/actions/node@master
        with:
          command: test
```

---

## A07:2021 - Identification and Authentication Failures

### Description

Authentication and session management not implemented correctly, allowing attackers to compromise passwords, keys, or session tokens.

**Previously "Broken Authentication" (#2 in 2017)**

### Common Weaknesses (CWE)
- CWE-297: Improper Validation of Certificate with Host Mismatch
- CWE-287: Improper Authentication
- CWE-384: Session Fixation

### Examples

**Weak Password Policy**:
```javascript
// Vulnerable: Weak password requirements
if (password.length < 6) {
  throw new Error('Password too short');
}

// Secure: Strong password requirements
const passwordStrength = require('zxcvbn');

if (password.length < 12) {
  throw new Error('Password must be at least 12 characters');
}

const strength = passwordStrength(password);
if (strength.score < 3) {
  throw new Error('Password too weak: ' + strength.feedback.suggestions.join(', '));
}
```

**No Account Lockout**:
```javascript
// Vulnerable: Unlimited login attempts
app.post('/api/login', async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  const isValid = await bcrypt.compare(req.body.password, user.passwordHash);

  if (!isValid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Login success
});

// Secure: Account lockout
app.post('/api/login', async (req, res) => {
  const user = await User.findOne({ email: req.body.email });

  if (user.failedLoginAttempts >= 3) {
    const lockoutEnd = user.lockedUntil || 0;
    if (Date.now() < lockoutEnd) {
      return res.status(429).json({ error: 'Account locked. Try again in 15 minutes.' });
    } else {
      user.failedLoginAttempts = 0; // Reset after lockout period
    }
  }

  const isValid = await bcrypt.compare(req.body.password, user.passwordHash);

  if (!isValid) {
    user.failedLoginAttempts++;
    if (user.failedLoginAttempts >= 3) {
      user.lockedUntil = Date.now() + 15 * 60 * 1000; // 15 minutes
    }
    await user.save();
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Reset on successful login
  user.failedLoginAttempts = 0;
  user.lockedUntil = null;
  await user.save();

  // Login success
});
```

**Session Fixation**:
```javascript
// Vulnerable: Reuse session ID
app.post('/api/login', async (req, res) => {
  const user = await authenticateUser(req.body.email, req.body.password);
  req.session.userId = user.id; // Session ID not regenerated!
});

// Secure: Regenerate session ID
app.post('/api/login', async (req, res) => {
  const user = await authenticateUser(req.body.email, req.body.password);

  // Regenerate session ID
  req.session.regenerate((err) => {
    if (err) return next(err);
    req.session.userId = user.id;
    req.session.save();
  });
});
```

### Prevention

1. **Multi-factor authentication**: Implement MFA for all users
2. **Strong passwords**: Minimum 12 characters, check against breach databases
3. **Account lockout**: Lock after 3 failed attempts for 15 minutes
4. **Secure session management**: HttpOnly, Secure, SameSite cookies
5. **Session regeneration**: New session ID on login and privilege change
6. **Password hashing**: bcrypt or argon2id with cost ≥ 12
7. **No default credentials**: Force password change on first login

---

## A08:2021 - Software and Data Integrity Failures

### Description

Code and infrastructure that does not protect against integrity violations, such as unsigned CI/CD pipelines, auto-update without verification, or insecure deserialization.

**New category in 2021**

### Common Weaknesses (CWE)
- CWE-829: Inclusion of Functionality from Untrusted Control Sphere
- CWE-494: Download of Code Without Integrity Check
- CWE-502: Deserialization of Untrusted Data

### Examples

**Unsigned Updates**:
```javascript
// Vulnerable: Download and execute without verification
const axios = require('axios');
const exec = require('child_process').exec;

const update = await axios.get('https://updates.example.com/latest.sh');
exec(update.data); // No signature verification!

// Secure: Verify signature before execution
const crypto = require('crypto');
const fs = require('fs');

const update = await axios.get('https://updates.example.com/latest.sh');
const signature = await axios.get('https://updates.example.com/latest.sh.sig');

const verify = crypto.createVerify('SHA256');
verify.update(update.data);
const isValid = verify.verify(publicKey, signature.data, 'hex');

if (!isValid) {
  throw new Error('Invalid signature');
}

// Proceed with update
```

**Insecure Deserialization**:
```javascript
// Vulnerable: Deserialize untrusted data
const user = JSON.parse(req.cookies.user); // Can inject code in JSON

// Even worse: Node.js serialize
const serialize = require('node-serialize');
const user = serialize.unserialize(req.cookies.user); // RCE vulnerability!

// Secure: Use signed, encrypted tokens
const jwt = require('jsonwebtoken');

// Create token
const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, {
  expiresIn: '15m'
});

// Verify token
try {
  const decoded = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
} catch (err) {
  throw new Error('Invalid token');
}
```

**Untrusted CDN**:
```html
<!-- Vulnerable: Load script without SRI -->
<script src="https://cdn.example.com/jquery.min.js"></script>

<!-- Secure: Use Subresource Integrity (SRI) -->
<script
  src="https://cdn.example.com/jquery.min.js"
  integrity="sha384-KJ3o2DKtIkvYIK3UENzmM7KCkRr/rE9/Qpg6aAZGJwFDMVNA/GpGFF93hXpG5KkN"
  crossorigin="anonymous"></script>
```

### Prevention

1. **Digital signatures**: Sign all software releases and updates
2. **Integrity verification**: Verify checksums and signatures
3. **Secure deserialization**: Use signed JWTs, avoid serialization libraries
4. **Subresource Integrity**: SRI for CDN resources
5. **CI/CD security**: Secure build pipeline, audit all changes
6. **SBOM**: Generate Software Bill of Materials for all releases
7. **Dependency verification**: Verify package signatures (npm, apt, etc.)

---

## A09:2021 - Security Logging and Monitoring Failures

### Description

Insufficient logging, detection, monitoring, and active response, allowing attacks to go undetected.

**Previously "Insufficient Logging & Monitoring" (#10 in 2017)**

### Common Weaknesses (CWE)
- CWE-778: Insufficient Logging
- CWE-223: Omission of Security-relevant Information
- CWE-532: Insertion of Sensitive Information into Log File
- CWE-778: Insufficient Logging

### Examples

**Insufficient Logging**:
```javascript
// Vulnerable: No logging
app.post('/api/login', async (req, res) => {
  const user = await authenticateUser(req.body.email, req.body.password);
  res.json({ token: generateToken(user) });
});

// Secure: Comprehensive logging
app.post('/api/login', async (req, res) => {
  try {
    const user = await authenticateUser(req.body.email, req.body.password);

    logger.info('Login success', {
      userId: user.id,
      email: user.email,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      timestamp: new Date()
    });

    res.json({ token: generateToken(user) });
  } catch (error) {
    logger.warn('Login failed', {
      email: req.body.email,
      ipAddress: req.ip,
      reason: error.message,
      timestamp: new Date()
    });

    res.status(401).json({ error: 'Invalid credentials' });
  }
});
```

**Logging Sensitive Data**:
```javascript
// Vulnerable: Log passwords
logger.info('User login attempt', { email, password }); // NEVER!

// Secure: Log only non-sensitive data
logger.info('User login attempt', { email, ipAddress });
```

**No Alerting**:
```javascript
// Vulnerable: Logs but no alerts
logger.error('SQL injection attempt detected', { query, userId, ipAddress });

// Secure: Alert security team
logger.error('SQL injection attempt detected', { query, userId, ipAddress });

await securityTeam.alert({
  severity: 'HIGH',
  type: 'SQL_INJECTION_ATTEMPT',
  userId,
  ipAddress,
  query
});

// Block IP after multiple attempts
const attempts = await redis.incr(`security:${ipAddress}`);
if (attempts > 5) {
  await firewall.blockIP(ipAddress);
}
```

### Prevention

1. **Log security events**: Authentication, authorization, input validation failures
2. **Log context**: User ID, IP address, timestamp, resource accessed
3. **Protect logs**: Encrypt, restrict access, prevent modification
4. **Centralized logging**: Use SIEM (Splunk, ELK, Azure Sentinel)
5. **Real-time alerting**: Alert on suspicious patterns
6. **Log retention**: 90 days online, 1 year archive minimum
7. **No sensitive data**: Do not log passwords, tokens, PII

---

## A10:2021 - Server-Side Request Forgery (SSRF)

### Description

SSRF flaws occur when a web application fetches a remote resource without validating the user-supplied URL, allowing attackers to coerce the application to send requests to unexpected destinations.

**New category in 2021**

### Common Weaknesses (CWE)
- CWE-918: Server-Side Request Forgery (SSRF)

### Examples

**Basic SSRF**:
```javascript
// Vulnerable: Fetch user-provided URL
app.get('/api/fetch', async (req, res) => {
  const url = req.query.url;
  const response = await axios.get(url); // Can access internal services!
  res.json(response.data);
});

// Attack: /api/fetch?url=http://169.254.169.254/latest/meta-data/ (AWS metadata)
// Attack: /api/fetch?url=http://localhost:6379/ (Redis)
// Attack: /api/fetch?url=file:///etc/passwd (Local files)

// Secure: Validate and restrict URLs
const ALLOWED_HOSTS = ['api.example.com', 'cdn.example.com'];
const BLOCKED_IPS = ['127.0.0.1', '0.0.0.0', '169.254.169.254'];

app.get('/api/fetch', async (req, res) => {
  const url = new URL(req.query.url);

  // Check protocol
  if (url.protocol !== 'https:') {
    return res.status(400).json({ error: 'Only HTTPS allowed' });
  }

  // Check host
  if (!ALLOWED_HOSTS.includes(url.hostname)) {
    return res.status(400).json({ error: 'Host not allowed' });
  }

  // Resolve DNS and check IP
  const dns = require('dns').promises;
  const addresses = await dns.resolve4(url.hostname);

  for (const ip of addresses) {
    if (BLOCKED_IPS.includes(ip) || ip.startsWith('10.') || ip.startsWith('192.168.')) {
      return res.status(400).json({ error: 'IP not allowed' });
    }
  }

  // Proceed with fetch
  const response = await axios.get(url.href, { timeout: 5000, maxRedirects: 0 });
  res.json(response.data);
});
```

**Blind SSRF**:
```javascript
// Vulnerable: Webhook registration
app.post('/api/webhooks', async (req, res) => {
  const webhookUrl = req.body.url;
  await Webhook.create({ userId: req.user.id, url: webhookUrl });

  // Later: POST to webhook
  await axios.post(webhookUrl, eventData); // SSRF!
});

// Secure: Validate webhook URLs
const WEBHOOK_ALLOWED_HOSTS = ['hooks.example.com'];

app.post('/api/webhooks', async (req, res) => {
  const url = new URL(req.body.url);

  if (url.protocol !== 'https:') {
    return res.status(400).json({ error: 'Only HTTPS webhooks allowed' });
  }

  if (!WEBHOOK_ALLOWED_HOSTS.includes(url.hostname)) {
    return res.status(400).json({ error: 'Webhook host not allowed' });
  }

  // Test webhook before saving (with timeout)
  try {
    await axios.post(url.href, { test: true }, { timeout: 5000 });
  } catch (error) {
    return res.status(400).json({ error: 'Webhook URL unreachable' });
  }

  await Webhook.create({ userId: req.user.id, url: url.href });
  res.json({ success: true });
});
```

### Prevention

1. **Whitelist URLs**: Only allow known, trusted destinations
2. **Disable redirects**: Prevent redirect-based SSRF
3. **Block private IPs**: 127.0.0.0/8, 10.0.0.0/8, 192.168.0.0/16, 169.254.0.0/16
4. **Network segmentation**: Isolate application from internal services
5. **Response validation**: Do not return raw responses to users
6. **Timeouts**: Limit request duration
7. **Block file:// protocol**: Prevent local file access

### Testing

```javascript
// Test: SSRF prevention
test('Blocks access to localhost', async () => {
  const response = await request(app)
    .get('/api/fetch')
    .query({ url: 'http://localhost:6379' });

  expect(response.status).toBe(400);
  expect(response.body.error).toMatch(/not allowed/i);
});

test('Blocks access to metadata endpoint', async () => {
  const response = await request(app)
    .get('/api/fetch')
    .query({ url: 'http://169.254.169.254/latest/meta-data/' });

  expect(response.status).toBe(400);
});

test('Blocks access to private IPs', async () => {
  const response = await request(app)
    .get('/api/fetch')
    .query({ url: 'http://192.168.1.1' });

  expect(response.status).toBe(400);
});
```

---

## Summary Table

| Rank | Category | Key Prevention |
|------|----------|----------------|
| A01 | Broken Access Control | Deny by default, enforce authorization server-side, prevent IDOR |
| A02 | Cryptographic Failures | TLS 1.2+, AES-256 at rest, bcrypt for passwords |
| A03 | Injection | Parameterized queries, input validation, output encoding |
| A04 | Insecure Design | Threat modeling, secure patterns, defense in depth |
| A05 | Security Misconfiguration | Security headers, generic errors, disable defaults |
| A06 | Vulnerable Components | Keep dependencies updated, use Dependabot/Snyk |
| A07 | Authentication Failures | MFA, strong passwords, account lockout, bcrypt |
| A08 | Software Integrity Failures | Sign releases, verify signatures, secure CI/CD |
| A09 | Logging Failures | Log security events, centralized SIEM, real-time alerts |
| A10 | SSRF | Whitelist URLs, block private IPs, network segmentation |

---

## Quick Reference Checklist

### Access Control
- [ ] Authorization checked server-side on every request
- [ ] Protected against IDOR (check resource ownership)
- [ ] CSRF protection enabled
- [ ] Default-deny access policy

### Cryptography
- [ ] HTTPS with TLS 1.2+ (HSTS enabled)
- [ ] AES-256 encryption for sensitive data at rest
- [ ] bcrypt/argon2 (cost ≥ 12) for passwords
- [ ] Secrets in Azure Key Vault

### Injection Prevention
- [ ] Parameterized queries ($1, $2, $3)
- [ ] Input validation (whitelist approach)
- [ ] Output encoding (context-aware)
- [ ] No eval() or dynamic code execution

### Design
- [ ] Threat modeling conducted
- [ ] Rate limiting implemented
- [ ] Comprehensive audit logging
- [ ] Defense in depth

### Configuration
- [ ] Security headers configured (CSP, HSTS, X-Frame-Options)
- [ ] Generic error messages (no stack traces)
- [ ] No default credentials
- [ ] Minimal attack surface

### Dependencies
- [ ] All dependencies up-to-date
- [ ] Automated vulnerability scanning (Dependabot, Snyk)
- [ ] SBOM generated for releases

### Authentication
- [ ] MFA for all users
- [ ] Password strength validation
- [ ] Account lockout (3 attempts, 15 min)
- [ ] Session regeneration on login

### Integrity
- [ ] Releases digitally signed
- [ ] Checksums published
- [ ] Subresource Integrity (SRI) for CDN assets
- [ ] Secure CI/CD pipeline

### Logging
- [ ] Log authentication, authorization, security events
- [ ] Do not log passwords, tokens, PII
- [ ] Centralized logging (SIEM)
- [ ] Real-time alerting on suspicious activity

### SSRF Prevention
- [ ] Whitelist allowed hosts
- [ ] Block private IP ranges
- [ ] Validate and sanitize URLs
- [ ] Disable redirects

---

## References

- **OWASP Top 10 2021**: https://owasp.org/Top10/
- **OWASP Cheat Sheet Series**: https://cheatsheetseries.owasp.org/
- **OWASP Testing Guide**: https://owasp.org/www-project-web-security-testing-guide/
- **OWASP ASVS**: https://owasp.org/www-project-application-security-verification-standard/

---

**Last Updated**: 2026-01-08
**Applicable To**: Fleet Management Application
