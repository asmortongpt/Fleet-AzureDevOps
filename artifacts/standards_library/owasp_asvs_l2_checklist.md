# OWASP ASVS Level 2 Checklist

## Overview

The **OWASP Application Security Verification Standard (ASVS)** provides a framework of security requirements for designing, developing, and testing modern web applications and web services. **Level 2** is suitable for applications that contain sensitive data requiring protection.

**Target Audience**: Applications handling sensitive data (PII, financial data, authentication credentials)
**Verification Method**: Manual review + automated tools
**Applicable To**: Fleet Management Application (FedRAMP Moderate)

---

## V1: Architecture, Design and Threat Modeling

### V1.1: Secure Software Development Lifecycle

**1.1.1** ✅ Verify the use of a secure software development lifecycle that addresses security in all stages of development.

**Implementation**:
- [ ] Security requirements defined in planning phase
- [ ] Threat modeling conducted for new features
- [ ] Security testing integrated in CI/CD
- [ ] Security review before production deployment

---

**1.1.2** ✅ Verify the use of threat modeling for every design change or sprint planning to identify threats, plan for countermeasures, facilitate appropriate risk responses, and guide security testing.

**Implementation**:
- [ ] Threat modeling methodology documented (STRIDE, PASTA)
- [ ] Threat models updated on architectural changes
- [ ] Threat model artifacts stored in wiki or repository
- [ ] Identified threats tracked to mitigations

---

**1.1.3** ✅ Verify that all user stories and features contain functional security constraints, such as "As a user, I should be able to view and edit my profile. I should not be able to view or edit anyone else's profile."

**Implementation**:
- [ ] Security acceptance criteria in user stories
- [ ] Examples: "Only authenticated users can access...", "Users can only modify their own..."
- [ ] Security requirements reviewed in sprint planning

---

### V1.2: Authentication Architecture

**1.2.1** ✅ Verify the use of unique or special low-privilege operating system accounts for all application components, services, and servers.

**Implementation**:
- [ ] Dedicated service accounts for each service
- [ ] No shared accounts across services
- [ ] No use of root/admin for application processes
- [ ] Principle of least privilege applied

---

**1.2.2** ✅ Verify that communications between application components, including APIs, middleware and data layers, are authenticated.

**Implementation**:
- [ ] API keys or OAuth for service-to-service communication
- [ ] Mutual TLS (mTLS) for sensitive internal communications
- [ ] Database connections authenticated (no anonymous access)

---

### V1.4: Access Control Architecture

**1.4.1** ✅ Verify that trusted enforcement points such as access control gateways, servers, and serverless functions enforce access controls. Never enforce access controls on the client.

**Implementation**:
- [ ] Authorization checks at API layer (server-side)
- [ ] UI restrictions are cosmetic only, not security controls
- [ ] Every API endpoint validates authorization

---

**1.4.2** ✅ Verify that the chosen access control solution is flexible enough to meet the application's needs.

**Implementation**:
- [ ] RBAC implemented (role-based access control)
- [ ] Support for resource-level permissions
- [ ] Can express complex policies (user can edit own records only)

---

### V1.5: Input and Output Architecture

**1.5.1** ✅ Verify that input and output requirements clearly define how to handle and process data based on type, content, and applicable laws, regulations, and other policy compliance.

**Implementation**:
- [ ] Data classification defined (public, internal, confidential, restricted)
- [ ] Handling requirements per classification
- [ ] Input validation requirements documented

---

**1.5.2** ✅ Verify that serialization is not used when communicating with untrusted clients. If this is not possible, ensure that adequate integrity controls are in place to detect serialization tampering or attacks.

**Implementation**:
- [ ] Use JSON, not serialized objects (Java serialization, Python pickle)
- [ ] If serialization required, use HMAC to verify integrity
- [ ] Do not deserialize untrusted data

---

### V1.6: Cryptographic Architecture

**1.6.1** ✅ Verify that there is an explicit policy for management of cryptographic keys and that a cryptographic key lifecycle follows a key management standard such as NIST SP 800-57.

**Implementation**:
- [ ] Key management policy documented
- [ ] Keys stored in Azure Key Vault or HSM
- [ ] Automated key rotation (annual minimum)
- [ ] Key destruction procedures defined

---

**1.6.2** ✅ Verify that consumers of cryptographic services protect key material and other secrets by using key vaults or API based alternatives.

**Implementation**:
- [ ] No hardcoded secrets in code
- [ ] Secrets retrieved from Azure Key Vault at runtime
- [ ] Secrets not logged or exposed in errors

---

## V2: Authentication

### V2.1: Password Security

**2.1.1** ✅ Verify that user set passwords are at least 12 characters in length.

**Implementation**:
```javascript
if (password.length < 12) {
  throw new Error('Password must be at least 12 characters');
}
```

---

**2.1.2** ✅ Verify that passwords 64 characters or longer are permitted.

**Implementation**:
```javascript
const MAX_PASSWORD_LENGTH = 128; // Support up to 128 characters
if (password.length > MAX_PASSWORD_LENGTH) {
  throw new Error('Password too long');
}
```

---

**2.1.3** ✅ Verify that password truncation is not performed. However, consecutive multiple spaces may be replaced by a single space.

**Implementation**:
```javascript
// Do NOT truncate passwords
// Only normalize multiple spaces
const normalizedPassword = password.replace(/\s+/g, ' ');
```

---

**2.1.4** ✅ Verify that any printable Unicode character, including language neutral characters such as spaces and Emojis are permitted in passwords.

**Implementation**:
```javascript
// Allow all printable Unicode characters
// No restrictions on character sets
```

---

**2.1.5** ✅ Verify users can change their password.

**Implementation**:
- [ ] Password change endpoint implemented
- [ ] Requires current password for verification
- [ ] Enforces password policy on new password

---

**2.1.6** ✅ Verify that password change functionality requires the user's current and new password.

**Implementation**:
```javascript
async function changePassword(userId, currentPassword, newPassword) {
  const user = await User.findById(userId);
  const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isValid) {
    throw new Error('Current password incorrect');
  }
  user.passwordHash = await bcrypt.hash(newPassword, 12);
  await user.save();
}
```

---

**2.1.7** ✅ Verify that passwords submitted during account registration, login, and password change are checked against a set of breached passwords either locally or via an API.

**Implementation**:
```javascript
const pwnedpasswords = require('pwnedpasswords');

async function checkPasswordBreached(password) {
  const count = await pwnedpasswords(password);
  if (count > 0) {
    throw new Error('This password has been exposed in a data breach. Please choose a different password.');
  }
}
```

---

**2.1.8** ✅ Verify that a password strength meter is provided to help users set a stronger password.

**Implementation**:
```javascript
// Use zxcvbn library for password strength estimation
import zxcvbn from 'zxcvbn';

const strength = zxcvbn(password);
// strength.score: 0-4 (0=weak, 4=strong)
// Display feedback to user
```

---

**2.1.9** ✅ Verify that there are no password composition rules limiting the type of characters permitted. There should be no requirement for upper or lower case or numbers or special characters.

**Implementation**:
- [ ] No forced character type requirements (uppercase, numbers, symbols)
- [ ] Length is primary requirement (12+ characters)
- [ ] Strength meter guides users to strong passwords

---

**2.1.10** ✅ Verify that there are no periodic credential rotation or password history requirements.

**Implementation**:
- [ ] No forced password changes (e.g., every 90 days)
- [ ] Password history optional (if implemented, prevent reuse of last 24)
- [ ] Focus on breach detection, not forced rotation

---

**2.1.11** ✅ Verify that "paste" functionality, browser password helpers, and external password managers are permitted.

**Implementation**:
```html
<!-- Do NOT use autocomplete="off" on password fields -->
<input type="password" name="password" autocomplete="current-password">
```

---

**2.1.12** ✅ Verify that the user can choose to either temporarily view the entire masked password, or temporarily view the last typed character of the password on platforms that do not have this as native functionality.

**Implementation**:
```javascript
// Show/hide password toggle
<input type="password" id="password" />
<button onclick="togglePasswordVisibility()">Show</button>

function togglePasswordVisibility() {
  const input = document.getElementById('password');
  input.type = input.type === 'password' ? 'text' : 'password';
}
```

---

### V2.2: General Authenticator Security

**2.2.1** ✅ Verify that anti-automation controls are effective at mitigating breached credential testing, brute force, and account lockout attacks.

**Implementation**:
- [ ] Account lockout after 3 failed attempts
- [ ] CAPTCHA on repeated failures
- [ ] Rate limiting on login endpoint

```javascript
// Track failed attempts
if (user.failedLoginAttempts >= 3) {
  if (Date.now() - user.lockedUntil < 15 * 60 * 1000) {
    throw new Error('Account locked. Try again in 15 minutes.');
  }
}
```

---

**2.2.2** ✅ Verify that the use of weak authenticators (such as SMS and email) is limited to secondary verification and transaction approval and not as a replacement for more secure authentication methods.

**Implementation**:
- [ ] SMS/email OTP only for secondary factor, not primary
- [ ] Prefer TOTP (authenticator app) or WebAuthn (hardware keys)
- [ ] Email/SMS acceptable for account recovery, not regular login

---

**2.2.3** ✅ Verify that secure notifications are sent to users after updates to authentication details, such as credential resets, email or address changes, logging in from unknown or risky locations.

**Implementation**:
```javascript
async function sendSecurityNotification(user, event) {
  await emailService.send({
    to: user.email,
    subject: `Security alert: ${event}`,
    body: `Your account experienced: ${event} from IP ${req.ip}. If this wasn't you, please reset your password immediately.`
  });
}

// Trigger notifications on:
// - Password change
// - Email change
// - MFA settings change
// - Login from new device/location
```

---

**2.2.4** ✅ Verify impersonation resistance against phishing, such as the use of multi-factor authentication, cryptographic devices with intent, or at higher AAL levels, client-side certificates.

**Implementation**:
- [ ] MFA required for all users
- [ ] Support WebAuthn/FIDO2 (phishing-resistant)
- [ ] Display binding information (e.g., "Authenticating to fleet.example.com")

---

**2.2.5** ✅ Verify that where a Credential Service Provider (CSP) and the application verifying authentication are separated, mutually authenticated TLS is in place between the two endpoints.

**Implementation**:
- [ ] Mutual TLS (mTLS) for communication with identity provider
- [ ] Verify certificate of identity provider
- [ ] Identity provider verifies certificate of application

---

**2.2.6** ✅ Verify replay resistance through the use of One-Time Passwords (OTP), cryptographic authenticators, or lookup codes.

**Implementation**:
```javascript
// TOTP (time-based one-time password)
const speakeasy = require('speakeasy');

const verified = speakeasy.totp.verify({
  secret: user.totpSecret,
  encoding: 'base32',
  token: userProvidedToken,
  window: 1  // Allow 1 time step tolerance
});

if (!verified) {
  throw new Error('Invalid MFA code');
}
```

---

**2.2.7** ✅ Verify intent to authenticate by requiring the entry of an OTP token or user-initiated action such as a button press on a FIDO hardware key.

**Implementation**:
- [ ] Require user action (enter OTP, press hardware key button)
- [ ] WebAuthn requires user verification (biometric or PIN)

---

### V2.3: Authenticator Lifecycle

**2.3.1** ✅ Verify system generated initial passwords or activation codes SHOULD be securely randomly generated, SHOULD be at least 6 characters long, and MAY contain letters and numbers, and expire after a short period of time.

**Implementation**:
```javascript
const crypto = require('crypto');

function generateActivationCode() {
  // Generate 8-character alphanumeric code
  return crypto.randomBytes(6).toString('base64').slice(0, 8).toUpperCase();
}

// Set expiration
user.activationCode = generateActivationCode();
user.activationExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
```

---

**2.3.2** ✅ Verify that enrollment and use of subscriber-provided authentication devices are supported, such as a U2F or FIDO tokens.

**Implementation**:
- [ ] Support WebAuthn/FIDO2 registration
- [ ] Allow users to register multiple authenticators
- [ ] Support hardware keys (YubiKey, Titan, etc.)

---

**2.3.3** ✅ Verify that renewal instructions are sent with sufficient time to renew time bound authenticators.

**Implementation**:
```javascript
// Send renewal reminders
if (certificate.expiresAt - Date.now() < 30 * 24 * 60 * 60 * 1000) {
  await sendRenewalReminder(user, certificate);
}
```

---

### V2.5: Credential Recovery

**2.5.1** ✅ Verify that a system generated initial activation or recovery secret is not sent in clear text to the user.

**Implementation**:
- [ ] Send recovery link, not recovery secret
- [ ] If secret sent, use secure channel (encrypted email, SMS)
- [ ] Link expires after use or timeout

```javascript
// Generate recovery token
const recoveryToken = crypto.randomBytes(32).toString('hex');
const recoveryLink = `https://fleet.example.com/reset-password?token=${recoveryToken}`;

// Store hashed token
user.recoveryTokenHash = await bcrypt.hash(recoveryToken, 10);
user.recoveryTokenExpiry = Date.now() + 1 * 60 * 60 * 1000; // 1 hour

await emailService.send({
  to: user.email,
  subject: 'Password Reset',
  body: `Click here to reset your password: ${recoveryLink}`
});
```

---

**2.5.2** ✅ Verify password hints or knowledge-based authentication (so-called "secret questions") are not present.

**Implementation**:
- [ ] No security questions ("What's your mother's maiden name?")
- [ ] No password hints
- [ ] Use email/SMS-based recovery only

---

**2.5.3** ✅ Verify password credential recovery does not reveal the current password in any way.

**Implementation**:
- [ ] Recovery process creates new password
- [ ] Never email current password (impossible if properly hashed)
- [ ] Never display current password

---

**2.5.4** ✅ Verify shared or default accounts are not present (e.g. "root", "admin", or "sa").

**Implementation**:
- [ ] No default accounts
- [ ] Force initial password change on first login
- [ ] All accounts have unique identifiers

---

**2.5.5** ✅ Verify that if an authentication factor is changed or replaced, the user is notified of this event.

**Implementation**:
```javascript
async function changeMFASettings(user, newSettings) {
  // Update settings
  user.mfaSettings = newSettings;
  await user.save();

  // Notify user
  await sendSecurityNotification(user, 'MFA settings changed');
}
```

---

**2.5.6** ✅ Verify forgotten password, and other recovery paths use a secure recovery mechanism, such as time-based OTP or other soft token, mobile push, or another offline recovery mechanism.

**Implementation**:
- [ ] Time-limited recovery tokens (1 hour expiry)
- [ ] Single-use tokens
- [ ] Require email/SMS verification
- [ ] Optional: Support recovery codes generated at enrollment

---

### V2.7: Out of Band Verifier

**2.7.1** ✅ Verify that clear text out of band (NIST "restricted") authenticators, such as SMS or PSTN, are not offered by default, and stronger alternatives such as push notifications are offered first.

**Implementation**:
- [ ] Offer authenticator app (TOTP) as primary MFA method
- [ ] Offer WebAuthn/FIDO2 as strongest option
- [ ] SMS/email as fallback only

---

**2.7.2** ✅ Verify that the out of band verifier expires out of band authentication requests, codes, or tokens after 10 minutes.

**Implementation**:
```javascript
// OTP expiry
const OTP_EXPIRY = 10 * 60 * 1000; // 10 minutes

if (Date.now() - otp.createdAt > OTP_EXPIRY) {
  throw new Error('OTP expired. Please request a new one.');
}
```

---

**2.7.3** ✅ Verify that the out of band verifier authentication requests, codes, or tokens are only usable once, and only for the original authentication request.

**Implementation**:
```javascript
// Mark OTP as used
if (otp.used) {
  throw new Error('OTP already used');
}

otp.used = true;
await otp.save();
```

---

**2.7.4** ✅ Verify that the out of band authenticator and verifier communicates over a secure independent channel.

**Implementation**:
- [ ] SMS sent via secure SMS gateway
- [ ] Email sent via authenticated SMTP (TLS)
- [ ] Push notifications via trusted service (Firebase, APNS)

---

### V2.8: One-Time Verifier

**2.8.1** ✅ Verify that time-based OTPs have a defined lifetime before expiring.

**Implementation**:
```javascript
// TOTP with 30-second time step
const speakeasy = require('speakeasy');

const verified = speakeasy.totp.verify({
  secret: user.totpSecret,
  encoding: 'base32',
  token: userProvidedToken,
  window: 1  // Allow ±30 seconds (1 time step)
});
```

---

**2.8.2** ✅ Verify that symmetric keys used to verify submitted OTPs are highly protected, such as by using a hardware security module or secure operating system based key storage.

**Implementation**:
- [ ] TOTP secrets stored encrypted in database
- [ ] Encryption keys stored in Azure Key Vault
- [ ] Secrets never logged or exposed

---

**2.8.3** ✅ Verify that approved cryptographic algorithms are used in the generation, seeding, and verification of OTPs.

**Implementation**:
- [ ] Use HOTP (HMAC-based) or TOTP (time-based) per RFC 4226/6238
- [ ] HMAC-SHA1 or HMAC-SHA256
- [ ] Secure random number generation for secret keys

---

### V2.10: Service Authentication

**2.10.1** ✅ Verify that integration secrets do not rely on unchanging credentials such as passwords, API keys or shared accounts with privileged access.

**Implementation**:
- [ ] Use OAuth 2.0 client credentials flow (tokens expire)
- [ ] Rotate API keys quarterly
- [ ] Support key rotation without downtime (multiple valid keys)

---

**2.10.2** ✅ Verify that if passwords are required for service authentication, the service account is not a default credential.

**Implementation**:
- [ ] No default service account passwords
- [ ] Unique credentials per service
- [ ] Rotate service account passwords annually

---

**2.10.3** ✅ Verify that passwords are stored with sufficient protection to prevent offline recovery attacks, including local system access.

**Implementation**:
```javascript
// Use bcrypt with high cost factor
const bcrypt = require('bcrypt');
const BCRYPT_ROUNDS = 12; // Adjust based on server capacity

const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
```

---

**2.10.4** ✅ Verify passwords, integrations with databases and third-party systems, seeds and internal secrets, and API keys are managed securely and not included in the source code or stored within source code repositories.

**Implementation**:
- [ ] Secrets stored in Azure Key Vault
- [ ] Environment variables for configuration
- [ ] `.env` files in `.gitignore`
- [ ] Pre-commit hook to detect secrets (TruffleHog, git-secrets)

---

## V3: Session Management

### V3.1: Fundamental Session Management Security

**3.1.1** ✅ Verify the application never reveals session tokens in URL parameters.

**Implementation**:
- [ ] Session tokens in cookies only (not query strings)
- [ ] Use POST for login (not GET with password in URL)

```javascript
// Bad: ?sessionId=abc123
// Good: Cookie: sessionId=abc123
```

---

### V3.2: Session Binding

**3.2.1** ✅ Verify the application generates a new session token on user authentication.

**Implementation**:
```javascript
async function login(req, res) {
  const user = await authenticateUser(username, password);

  // Destroy old session
  req.session.destroy();

  // Create new session
  req.session.regenerate((err) => {
    req.session.userId = user.id;
    req.session.save();
  });
}
```

---

**3.2.2** ✅ Verify that session tokens possess at least 64 bits of entropy.

**Implementation**:
```javascript
const crypto = require('crypto');

// Generate 128-bit (16-byte) session ID
const sessionId = crypto.randomBytes(16).toString('hex'); // 32 hex characters
```

---

**3.2.3** ✅ Verify the application only stores session tokens in the browser using secure methods such as appropriately secured cookies or HTML 5 session storage.

**Implementation**:
```javascript
// Express session configuration
app.use(session({
  secret: process.env.SESSION_SECRET,
  name: 'sessionId', // Don't use default 'connect.sid'
  cookie: {
    httpOnly: true,   // Prevent JavaScript access
    secure: true,     // HTTPS only
    sameSite: 'strict', // CSRF protection
    maxAge: 15 * 60 * 1000  // 15 minutes
  },
  resave: false,
  saveUninitialized: false
}));
```

---

**3.2.4** ✅ Verify that session token are generated using approved cryptographic algorithms.

**Implementation**:
- [ ] Use `crypto.randomBytes()` (Node.js)
- [ ] Use `secrets` module (Python)
- [ ] Use framework session management (Express, Django)

---

### V3.3: Session Timeout

**3.3.1** ✅ Verify that logout and expiration invalidate the session token, such that the back button or a downstream relying party does not resume an authenticated session.

**Implementation**:
```javascript
async function logout(req, res) {
  // Invalidate server-side session
  req.session.destroy((err) => {
    // Clear cookie
    res.clearCookie('sessionId');

    // Redirect to login
    res.redirect('/login');
  });
}
```

---

**3.3.2** ✅ Verify that the application gives the option to terminate all other active sessions after a successful password change, and that this is effective across the application, federated login, and any relying parties.

**Implementation**:
```javascript
async function changePassword(userId, newPassword) {
  // Hash and store new password
  user.passwordHash = await bcrypt.hash(newPassword, 12);

  // Invalidate all sessions
  await Session.deleteMany({ userId });

  // Regenerate current session
  req.session.regenerate();

  await user.save();
}
```

---

**3.3.3** ✅ Verify that authenticated users have a session inactivity timeout and an absolute maximum timeout of 8 hours.

**Implementation**:
```javascript
app.use(session({
  cookie: {
    maxAge: 15 * 60 * 1000  // 15 minutes idle timeout
  },
  rolling: true  // Reset maxAge on every request
}));

// Absolute timeout (track session creation time)
if (req.session.createdAt && Date.now() - req.session.createdAt > 8 * 60 * 60 * 1000) {
  req.session.destroy();
  return res.status(401).json({ error: 'Session expired' });
}
```

---

### V3.4: Cookie-based Session Management

**3.4.1** ✅ Verify that cookie-based session tokens have the 'Secure' attribute set.

**Implementation**:
```javascript
cookie: {
  secure: true  // HTTPS only
}
```

---

**3.4.2** ✅ Verify that cookie-based session tokens have the 'HttpOnly' attribute set.

**Implementation**:
```javascript
cookie: {
  httpOnly: true  // Prevent JavaScript access
}
```

---

**3.4.3** ✅ Verify that cookie-based session tokens utilize the 'SameSite' attribute to limit exposure to cross-site request forgery attacks.

**Implementation**:
```javascript
cookie: {
  sameSite: 'strict'  // or 'lax' for better UX
}
```

---

**3.4.4** ✅ Verify that cookie-based session tokens use the "__Host-" prefix so cookies are only sent to the host that initially set the cookie.

**Implementation**:
```javascript
app.use(session({
  name: '__Host-sessionId',  // __Host- prefix
  cookie: {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/',
    domain: undefined  // No domain attribute (same-origin only)
  }
}));
```

---

**3.4.5** ✅ Verify that if the application is published under a domain name with other applications that set or use session cookies that might disclose the session cookies, set the path attribute in cookie-based session tokens using the most precise path possible.

**Implementation**:
```javascript
cookie: {
  path: '/fleet'  // Restrict to /fleet/* paths only
}
```

---

### V3.5: Token-based Session Management

**3.5.1** ✅ Verify the application allows users to revoke OAuth tokens that form trust relationships with linked applications.

**Implementation**:
- [ ] Provide UI to view authorized applications
- [ ] Allow revoking access per application
- [ ] Revoke all sessions on password change

---

**3.5.2** ✅ Verify the application uses session tokens rather than static API secrets and keys, except with legacy implementations.

**Implementation**:
- [ ] Use short-lived JWT tokens (15 min access token, 7 day refresh token)
- [ ] Avoid long-lived API keys where possible
- [ ] Rotate API keys quarterly if required

---

**3.5.3** ✅ Verify that stateless session tokens use digital signatures, encryption, and other countermeasures to protect against tampering, enveloping, replay, null cipher, and key substitution attacks.

**Implementation**:
```javascript
const jwt = require('jsonwebtoken');

// Sign JWT
const token = jwt.sign(
  { userId: user.id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: '15m', algorithm: 'HS256' }
);

// Verify JWT
try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
} catch (err) {
  throw new Error('Invalid token');
}
```

---

## V4: Access Control

### V4.1: General Access Control Design

**4.1.1** ✅ Verify that the application enforces access control rules on a trusted service layer, especially if client-side access control is present and could be bypassed.

**Implementation**:
- [ ] Authorization checks at API layer
- [ ] Never rely on client-side checks (UI hiding is cosmetic)
- [ ] Validate on every request

```javascript
// Server-side authorization (required)
app.get('/api/admin/users', requireRole('admin'), async (req, res) => {
  // Only admins can access
});

// Client-side hiding (optional, UX only)
{user.role === 'admin' && <AdminPanel />}
```

---

**4.1.2** ✅ Verify that all user and data attributes and policy information used by access controls cannot be manipulated by end users unless specifically authorized.

**Implementation**:
- [ ] Store user roles server-side (not in JWT or cookie)
- [ ] Fetch user permissions from database on each request
- [ ] Do not trust client-provided role information

```javascript
// Bad: Trust client-provided role
const role = req.body.role; // User can manipulate this!

// Good: Fetch from database
const user = await User.findById(req.session.userId);
const role = user.role;
```

---

**4.1.3** ✅ Verify that the principle of least privilege exists - users should only be able to access functions, data files, URLs, controllers, services, and other resources, for which they possess specific authorization.

**Implementation**:
- [ ] Default-deny policy (explicit grants required)
- [ ] Granular permissions (not just admin vs. user)
- [ ] Resource-level authorization (user can edit own records only)

```javascript
async function updateVehicle(req, res) {
  const vehicle = await Vehicle.findById(req.params.id);

  // Check ownership
  if (vehicle.fleetManagerId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // Proceed with update
}
```

---

**4.1.4** ✅ Verify that the principle of deny by default exists whereby new users/roles start with minimal or no permissions and users/roles do not receive access to new features until access is explicitly assigned.

**Implementation**:
- [ ] New users assigned 'user' role by default
- [ ] No permissions granted unless explicitly assigned
- [ ] New features require explicit permission grants

---

**4.1.5** ✅ Verify that access controls fail securely including when an exception occurs.

**Implementation**:
```javascript
async function checkAccess(userId, resourceId) {
  try {
    const user = await User.findById(userId);
    const resource = await Resource.findById(resourceId);

    if (!user || !resource) {
      return false; // Fail securely (deny access)
    }

    return user.id === resource.ownerId;
  } catch (error) {
    logger.error('Access check failed', error);
    return false; // Fail securely (deny access on error)
  }
}
```

---

### V4.2: Operation Level Access Control

**4.2.1** ✅ Verify that sensitive data and APIs are protected against Insecure Direct Object Reference (IDOR) attacks targeting creation, reading, updating and deletion of records.

**Implementation**:
```javascript
// Vulnerable to IDOR
app.get('/api/vehicles/:id', async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id);
  res.json(vehicle); // Any authenticated user can access any vehicle!
});

// Protected against IDOR
app.get('/api/vehicles/:id', async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id);

  // Check authorization
  if (vehicle.fleetManagerId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  res.json(vehicle);
});
```

---

**4.2.2** ✅ Verify that the application or framework enforces a strong anti-CSRF mechanism to protect authenticated functionality.

**Implementation**:
```javascript
const csrf = require('csurf');

// Enable CSRF protection
app.use(csrf({ cookie: true }));

// Include CSRF token in forms
<form method="POST">
  <input type="hidden" name="_csrf" value="{{csrfToken}}">
</form>

// Or use SameSite cookies as CSRF defense
cookie: {
  sameSite: 'strict'
}
```

---

### V4.3: Other Access Control Considerations

**4.3.1** ✅ Verify administrative interfaces use appropriate multi-factor authentication to prevent unauthorized use.

**Implementation**:
- [ ] MFA required for admin accounts
- [ ] Re-authentication for sensitive admin actions
- [ ] Separate admin login portal

---

**4.3.2** ✅ Verify that directory browsing is disabled unless deliberately desired.

**Implementation**:
```javascript
// Express: Do not use express.static() without options
app.use('/uploads', express.static('uploads', {
  index: false,  // Disable directory listing
  dotfiles: 'deny'
}));

// Nginx: autoindex off;
```

---

**4.3.3** ✅ Verify the application has additional authorization (such as step up or adaptive authentication) for lower value systems, and / or segregation of duties for high value applications to enforce anti-fraud controls as per the risk of application and past fraud.

**Implementation**:
- [ ] Re-authenticate for high-risk actions (financial transactions, account deletion)
- [ ] Adaptive authentication (increase requirements based on risk)
- [ ] Segregation of duties (approver ≠ requester)

```javascript
// Require re-authentication for sensitive action
app.post('/api/account/delete', requireAuth, async (req, res) => {
  // Verify password again
  const isValid = await bcrypt.compare(req.body.password, req.user.passwordHash);
  if (!isValid) {
    return res.status(401).json({ error: 'Password required to delete account' });
  }

  // Proceed with deletion
});
```

---

## V5: Validation, Sanitization and Encoding

### V5.1: Input Validation

**5.1.1** ✅ Verify that the application has defenses against HTTP parameter pollution attacks.

**Implementation**:
```javascript
// Express: Handle duplicate parameters
app.set('query parser', 'simple'); // Do not parse duplicate query params into arrays

// Or explicitly handle arrays
if (Array.isArray(req.query.id)) {
  throw new Error('Duplicate parameters not allowed');
}
```

---

**5.1.2** ✅ Verify that frameworks protect against mass assignment attacks.

**Implementation**:
```javascript
// Bad: Accept all fields from request body
const user = await User.create(req.body); // User could set isAdmin=true!

// Good: Whitelist allowed fields
const { name, email, age } = req.body;
const user = await User.create({ name, email, age });

// Or use schema validation
const schema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  age: Joi.number().min(18).max(120)
});

const { error, value } = schema.validate(req.body);
if (error) {
  return res.status(400).json({ error: error.details });
}
```

---

**5.1.3** ✅ Verify that all input (HTML form fields, REST requests, URL parameters, HTTP headers, cookies, batch files, RSS feeds, etc) is validated using positive validation (allow lists).

**Implementation**:
```javascript
const { body } = require('express-validator');

app.post('/api/vehicles',
  body('vin').matches(/^[A-HJ-NPR-Z0-9]{17}$/), // VIN format
  body('licensePlate').matches(/^[A-Z0-9-]{2,10}$/),
  body('year').isInt({ min: 1900, max: 2030 }),
  body('status').isIn(['active', 'maintenance', 'retired']),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // Proceed with validated input
  }
);
```

---

**5.1.4** ✅ Verify that structured data is strongly typed and validated against a defined schema including allowed characters, length and pattern.

**Implementation**:
```javascript
const Joi = require('joi');

const vehicleSchema = Joi.object({
  vin: Joi.string().length(17).pattern(/^[A-HJ-NPR-Z0-9]{17}$/).required(),
  licensePlate: Joi.string().min(2).max(10).pattern(/^[A-Z0-9-]+$/).required(),
  year: Joi.number().integer().min(1900).max(2030).required(),
  make: Joi.string().min(1).max(50).required(),
  model: Joi.string().min(1).max(50).required(),
  status: Joi.string().valid('active', 'maintenance', 'retired').required(),
  mileage: Joi.number().integer().min(0).max(1000000).required()
});

const { error, value } = vehicleSchema.validate(req.body);
if (error) {
  return res.status(400).json({ error: error.details[0].message });
}
```

---

**5.1.5** ✅ Verify that URL redirects and forwards only allow destinations which appear on an allow list, or shows a warning when redirecting to potentially untrusted content.

**Implementation**:
```javascript
const ALLOWED_REDIRECT_HOSTS = ['fleet.example.com', 'auth.example.com'];

function redirectTo(url) {
  const parsedUrl = new URL(url);

  if (!ALLOWED_REDIRECT_HOSTS.includes(parsedUrl.hostname)) {
    throw new Error('Invalid redirect destination');
  }

  res.redirect(url);
}

// Or for open redirects with warning
function openRedirect(url) {
  res.render('redirect-warning', {
    destination: url,
    message: 'You are being redirected to an external site'
  });
}
```

---

### V5.2: Sanitization and Sandboxing

**5.2.1** ✅ Verify that all untrusted HTML input from WYSIWYG editors or similar is properly sanitized with an HTML sanitizer library or framework feature.

**Implementation**:
```javascript
const DOMPurify = require('isomorphic-dompurify');

// Sanitize HTML input
const cleanHTML = DOMPurify.sanitize(userProvidedHTML, {
  ALLOWED_TAGS: ['p', 'strong', 'em', 'ul', 'ol', 'li'],
  ALLOWED_ATTR: []
});
```

---

**5.2.2** ✅ Verify that unstructured data is sanitized to enforce safety measures such as allowed characters and length.

**Implementation**:
```javascript
function sanitizeTextInput(input, maxLength = 1000) {
  // Trim whitespace
  let sanitized = input.trim();

  // Limit length
  if (sanitized.length > maxLength) {
    throw new Error(`Input too long (max ${maxLength} characters)`);
  }

  // Remove control characters (except newline/tab)
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  return sanitized;
}
```

---

**5.2.3** ✅ Verify that the application sanitizes user input before passing to mail systems to protect against SMTP or IMAP injection.

**Implementation**:
```javascript
// Validate email addresses
const validator = require('validator');

if (!validator.isEmail(email)) {
  throw new Error('Invalid email address');
}

// Sanitize email content (prevent header injection)
const sanitizeEmailHeader = (input) => {
  return input.replace(/[\r\n]/g, ''); // Remove newlines
};

const subject = sanitizeEmailHeader(req.body.subject);
const from = sanitizeEmailHeader(req.body.from);
```

---

**5.2.4** ✅ Verify that the application avoids the use of eval() or other dynamic code execution features.

**Implementation**:
```javascript
// Bad: eval is dangerous!
eval(userInput); // NEVER DO THIS

// Bad: Function constructor
new Function(userInput)(); // NEVER DO THIS

// Good: Use safe alternatives
const allowedOperations = {
  add: (a, b) => a + b,
  subtract: (a, b) => a - b
};

const operation = allowedOperations[userInput];
if (operation) {
  result = operation(a, b);
}
```

---

**5.2.5** ✅ Verify that the application protects against template injection attacks by ensuring that any user input being included is sanitized or sandboxed.

**Implementation**:
```javascript
// Bad: User input in template
const template = `Hello ${userInput}`; // Vulnerable to template injection

// Good: Use template engine with auto-escaping
res.render('greeting', { name: userInput }); // Auto-escaped by EJS/Pug

// Or explicitly escape
const escape = require('escape-html');
const safeInput = escape(userInput);
```

---

**5.2.6** ✅ Verify that the application protects against SSRF attacks, by validating or sanitizing untrusted data or HTTP file metadata.

**Implementation**:
```javascript
// Validate URLs to prevent SSRF
const ALLOWED_HOSTS = ['api.example.com', 'cdn.example.com'];
const BLOCKED_IPS = ['127.0.0.1', '0.0.0.0', '169.254.169.254']; // Prevent localhost, metadata endpoints

async function fetchURL(url) {
  const parsed = new URL(url);

  // Check protocol
  if (parsed.protocol !== 'https:') {
    throw new Error('Only HTTPS allowed');
  }

  // Check host
  if (!ALLOWED_HOSTS.includes(parsed.hostname)) {
    throw new Error('Host not allowed');
  }

  // Resolve DNS and check IP
  const dns = require('dns').promises;
  const addresses = await dns.resolve4(parsed.hostname);
  for (const ip of addresses) {
    if (BLOCKED_IPS.includes(ip) || ip.startsWith('10.') || ip.startsWith('192.168.')) {
      throw new Error('IP not allowed');
    }
  }

  // Proceed with fetch
  return fetch(url);
}
```

---

**5.2.7** ✅ Verify that the application sanitizes, disables, or sandboxes user-supplied Scalable Vector Graphics (SVG) scriptable content.

**Implementation**:
```javascript
const DOMPurify = require('isomorphic-dompurify');

// Sanitize SVG
const cleanSVG = DOMPurify.sanitize(userProvidedSVG, {
  USE_PROFILES: { svg: true, svgFilters: true },
  FORBID_TAGS: ['script', 'foreignObject'],
  FORBID_ATTR: ['onload', 'onerror', 'onclick']
});
```

---

**5.2.8** ✅ Verify that the application sanitizes, disables, or sandboxes user-supplied scriptable or expression template language content.

**Implementation**:
- [ ] Do not allow user input in template expressions
- [ ] Use sandboxed template engines (Liquid, Handlebars with sandbox)
- [ ] Disable eval, Function constructor in template context

---

### V5.3: Output Encoding and Injection Prevention

**5.3.1** ✅ Verify that output encoding is relevant for the interpreter and context required.

**Implementation**:
```javascript
// HTML context
const escape = require('escape-html');
const safeHTML = escape(userInput);

// JavaScript context
const safeJS = JSON.stringify(userInput);

// URL context
const safeURL = encodeURIComponent(userInput);

// SQL context (use parameterized queries)
const result = await db.query('SELECT * FROM users WHERE email = $1', [userInput]);
```

---

**5.3.2** ✅ Verify that output encoding preserves the user's chosen character set and locale.

**Implementation**:
```javascript
// Use UTF-8 everywhere
res.set('Content-Type', 'text/html; charset=UTF-8');

// Support Unicode in database
// PostgreSQL: CREATE DATABASE fleet ENCODING 'UTF8';
// MySQL: CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
```

---

**5.3.3** ✅ Verify that context-aware, preferably automated output escaping protects against reflected, stored, and DOM based XSS.

**Implementation**:
```javascript
// Use template engine with auto-escaping (EJS, Pug, Handlebars)
res.render('profile', { name: userInput }); // Auto-escaped

// React (auto-escapes by default)
<div>{userInput}</div>

// Explicit escaping if needed
const escape = require('escape-html');
res.send(`<p>${escape(userInput)}</p>`);
```

---

**5.3.4** ✅ Verify that data selection or database queries use parameterized queries, ORMs, entity frameworks, or are otherwise protected from database injection attacks.

**Implementation**:
```javascript
// PostgreSQL with parameterized query
const result = await db.query(
  'SELECT * FROM vehicles WHERE vin = $1',
  [vin]  // Never: 'SELECT * FROM vehicles WHERE vin = "' + vin + '"'
);

// Sequelize ORM
const vehicle = await Vehicle.findOne({ where: { vin } });

// TypeORM
const vehicle = await vehicleRepository.findOneBy({ vin });
```

---

**5.3.5** ✅ Verify that where parameterized or safer mechanisms are not present, context-specific output encoding is used to protect against injection attacks.

**Implementation**:
```javascript
// If dynamic SQL required (avoid if possible), escape identifiers
const pg = require('pg');

const tableName = pg.escapeIdentifier(userProvidedTableName);
const query = `SELECT * FROM ${tableName} WHERE id = $1`;
// Still use parameterization for values!
```

---

**5.3.6** ✅ Verify that the application protects against JavaScript or JSON injection attacks.

**Implementation**:
```javascript
// Bad: Injecting into <script> tag
<script>
  const data = "{{userInput}}"; // Vulnerable!
</script>

// Good: Use JSON encoding
<script>
  const data = {{json userInput}}; // Template helper for JSON encoding
</script>

// Better: Pass data via data attributes
<div id="app" data-config="{{jsonEncode config}}"></div>
<script>
  const config = JSON.parse(document.getElementById('app').dataset.config);
</script>
```

---

**5.3.7** ✅ Verify that the application protects against LDAP injection vulnerabilities, or that specific security controls to prevent LDAP injection have been implemented.

**Implementation**:
```javascript
// Escape LDAP special characters
function escapeLDAP(input) {
  return input
    .replace(/\\/g, '\\5c')
    .replace(/\*/g, '\\2a')
    .replace(/\(/g, '\\28')
    .replace(/\)/g, '\\29')
    .replace(/\x00/g, '\\00');
}

const safeUsername = escapeLDAP(userInput);
const filter = `(uid=${safeUsername})`;
```

---

**5.3.8** ✅ Verify that the application protects against OS command injection and that operating system calls use parameterized OS queries or use contextual command line output encoding.

**Implementation**:
```javascript
const { execFile } = require('child_process');

// Bad: exec with user input (shell injection!)
exec(`ls ${userInput}`, (error, stdout) => {}); // NEVER DO THIS

// Good: execFile with array arguments
execFile('ls', [userInput], (error, stdout) => {
  // User input cannot break out of argument context
});

// Better: Avoid shelling out entirely
const fs = require('fs');
const files = await fs.promises.readdir(userInput);
```

---

**5.3.9** ✅ Verify that the application protects against Local File Inclusion (LFI) or Remote File Inclusion (RFI) attacks.

**Implementation**:
```javascript
// Bad: User input in file path
const filePath = `/uploads/${userInput}`; // Vulnerable to ../../../etc/passwd

// Good: Whitelist approach
const ALLOWED_FILES = ['report1.pdf', 'report2.pdf'];
if (!ALLOWED_FILES.includes(userInput)) {
  throw new Error('File not found');
}

// Or sanitize path
const path = require('path');
const safeFilePath = path.join('/uploads', path.basename(userInput)); // Removes ../
```

---

**5.3.10** ✅ Verify that the application protects against XPath injection or XML injection attacks.

**Implementation**:
```javascript
// Use XPath parameterization or avoid XPath entirely
// Prefer JSON over XML for modern applications

// If XPath required:
const xpath = require('xpath');
const dom = require('xmldom').DOMParser;

// Use parameterized queries (library-specific)
// Or switch to JSON/document database
```

---

## V6: Stored Cryptography

### V6.1: Data Classification

**6.1.1** ✅ Verify that regulated private data is stored encrypted while at rest.

**Implementation**:
- [ ] PII encrypted at rest (names, addresses, SSN)
- [ ] Financial data encrypted (credit cards, account numbers)
- [ ] Use AES-256 encryption
- [ ] Keys stored in Azure Key Vault

---

**6.1.2** ✅ Verify that regulated health data is stored encrypted while at rest.

**Implementation**:
- [ ] HIPAA-protected data encrypted (if applicable)
- [ ] PHI (Protected Health Information) encrypted at rest
- [ ] Access logs for all PHI access

---

**6.1.3** ✅ Verify that regulated financial data is stored encrypted while at rest.

**Implementation**:
- [ ] PCI DSS compliance for payment card data
- [ ] Cardholder data encrypted (if stored, prefer not storing)
- [ ] Use payment processor tokenization (Stripe, Square)

---

### V6.2: Algorithms

**6.2.1** ✅ Verify that all cryptographic modules fail securely, and errors are handled in a way that does not enable Padding Oracle attacks.

**Implementation**:
```javascript
// Use authenticated encryption (AES-GCM) to prevent padding oracle
const crypto = require('crypto');

function encrypt(plaintext, key) {
  const iv = crypto.randomBytes(12); // GCM uses 96-bit IV
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
  ciphertext += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return {
    ciphertext,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
}

function decrypt(ciphertext, iv, authTag, key) {
  try {
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'hex'));
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));

    let plaintext = decipher.update(ciphertext, 'hex', 'utf8');
    plaintext += decipher.final('utf8');

    return plaintext;
  } catch (error) {
    // Generic error (do not reveal if MAC verification failed vs other error)
    throw new Error('Decryption failed');
  }
}
```

---

**6.2.2** ✅ Verify that industry proven or government approved cryptographic algorithms, modes, and libraries are used, instead of custom coded cryptography.

**Implementation**:
- [ ] Use `crypto` module (Node.js)
- [ ] Use `cryptography` library (Python)
- [ ] Use Web Crypto API (browser)
- [ ] NEVER implement custom crypto algorithms

**Approved Algorithms**:
- Symmetric: AES-256-GCM
- Asymmetric: RSA-2048+, ECDSA P-256+
- Hashing: SHA-256, SHA-384, SHA-512
- Password Hashing: bcrypt, argon2id

---

**6.2.3** ✅ Verify that encryption initialization vector, cipher configuration, and block modes are configured securely using the latest advice.

**Implementation**:
```javascript
// Secure configuration
- Algorithm: AES-256-GCM (authenticated encryption)
- IV: Random, unique per encryption (never reuse)
- IV Length: 96 bits (12 bytes) for GCM
- Key Length: 256 bits (32 bytes)
- No ECB mode (insecure)
```

---

**6.2.4** ✅ Verify that random number, encryption or hashing algorithms, key lengths, rounds, ciphers or modes, can be reconfigured, upgraded, or swapped at any time, to protect against cryptographic breaks.

**Implementation**:
- [ ] Crypto algorithm configurable via environment variable
- [ ] Support multiple algorithm versions (for migration)
- [ ] Include algorithm version in encrypted data format

```javascript
// Encrypted data format with version
{
  version: 1,  // Algorithm version
  algorithm: 'aes-256-gcm',
  ciphertext: '...',
  iv: '...',
  authTag: '...'
}

// Decryption supports multiple versions
function decrypt(data, key) {
  if (data.version === 1) {
    return decryptV1(data, key);
  } else if (data.version === 2) {
    return decryptV2(data, key);
  }
  throw new Error('Unsupported version');
}
```

---

**6.2.5** ✅ Verify that known insecure block modes (e.g. ECB), padding modes (e.g. PKCS#1 v1.5), ciphers with small block sizes (e.g. Triple-DES, Blowfish), and weak hashing algorithms (e.g. MD5, SHA1) are not used unless required for backwards compatibility.

**Implementation**:
- [ ] No DES, 3DES, RC4, Blowfish
- [ ] No ECB mode
- [ ] No MD5, SHA1 for security purposes
- [ ] Use AES-256-GCM, SHA-256+

---

**6.2.6** ✅ Verify that nonces, initialization vectors, and other single use numbers must not be used more than once with a given encryption key.

**Implementation**:
```javascript
// Generate new IV for every encryption
const iv = crypto.randomBytes(12); // New random IV each time

// NEVER reuse IVs with same key!
```

---

### V6.3: Random Values

**6.3.1** ✅ Verify that all random numbers, random file names, random GUIDs, and random strings are generated using the cryptographic module's approved cryptographically secure random number generator.

**Implementation**:
```javascript
const crypto = require('crypto');

// Cryptographically secure random
const randomBytes = crypto.randomBytes(32);
const randomToken = crypto.randomBytes(32).toString('hex');
const randomUUID = crypto.randomUUID();

// Bad: Math.random() is NOT cryptographically secure
const insecure = Math.random(); // NEVER use for security
```

---

**6.3.2** ✅ Verify that random GUIDs are created using the GUID v4 algorithm, and a cryptographically-secure pseudo-random number generator (CSPRNG).

**Implementation**:
```javascript
const crypto = require('crypto');

// UUIDv4 (cryptographically secure)
const uuid = crypto.randomUUID();
```

---

**6.3.3** ✅ Verify that random numbers are created with proper entropy even when the application is under heavy load, or that the application degrades gracefully in such circumstances.

**Implementation**:
- [ ] Use OS-provided CSPRNG (crypto.randomBytes)
- [ ] Monitor entropy pool health (Linux: /proc/sys/kernel/random/entropy_avail)
- [ ] If entropy low, degrade gracefully (rate limit, queue requests)

---

### V6.4: Secret Management

**6.4.1** ✅ Verify that a secrets management solution such as a key vault is used to securely create, store, control access to and destroy secrets.

**Implementation**:
- [ ] Use Azure Key Vault for secrets
- [ ] No secrets in code or config files
- [ ] Inject secrets at runtime via environment variables
- [ ] Rotate secrets quarterly

```javascript
// Retrieve secret from Azure Key Vault
const { SecretClient } = require('@azure/keyvault-secrets');
const { DefaultAzureCredential } = require('@azure/identity');

const credential = new DefaultAzureCredential();
const client = new SecretClient('https://your-vault.vault.azure.net/', credential);

const secret = await client.getSecret('database-password');
const dbPassword = secret.value;
```

---

**6.4.2** ✅ Verify that key material is not exposed to the application but instead uses an isolated security module like a vault for cryptographic operations.

**Implementation**:
- [ ] Use Azure Key Vault for encryption operations (encrypt/decrypt APIs)
- [ ] Keys never leave the vault (HSM-backed)
- [ ] Application only has permission to use keys, not read them

---

## V7: Error Handling and Logging

### V7.1: Log Content

**7.1.1** ✅ Verify that the application does not log credentials or payment details. Session tokens should only be stored in logs in an irreversible, hashed form.

**Implementation**:
```javascript
// Bad: Logging sensitive data
logger.info('User login', { username, password }); // NEVER log passwords!

// Good: Log only non-sensitive data
logger.info('User login', { username, ipAddress });

// If session token must be logged, hash it
const crypto = require('crypto');
const tokenHash = crypto.createHash('sha256').update(sessionToken).digest('hex').slice(0, 8);
logger.info('Session created', { userId, tokenHash });
```

---

**7.1.2** ✅ Verify that the application does not log other sensitive data as defined under local privacy laws or relevant security policy.

**Implementation**:
- [ ] Do not log PII (SSN, address, phone)
- [ ] Do not log financial data (credit cards, account numbers)
- [ ] Do not log health information (HIPAA-protected data)
- [ ] Redact sensitive fields in logs

```javascript
function sanitizeForLog(data) {
  const sanitized = { ...data };
  delete sanitized.password;
  delete sanitized.creditCard;
  if (sanitized.ssn) {
    sanitized.ssn = '***-**-' + sanitized.ssn.slice(-4);
  }
  return sanitized;
}

logger.info('User created', sanitizeForLog(userData));
```

---

**7.1.3** ✅ Verify that the application logs security relevant events including successful and failed authentication events, access control failures, deserialization failures and input validation failures.

**Implementation**:
```javascript
// Log authentication events
logger.info('Login success', { userId, ipAddress, userAgent });
logger.warn('Login failed', { username, ipAddress, reason: 'Invalid password' });

// Log authorization failures
logger.warn('Access denied', { userId, resource, action, reason: 'Insufficient permissions' });

// Log input validation failures
logger.warn('Validation failed', { endpoint, errors });

// Log security events
logger.error('SQL injection attempt detected', { userId, query, ipAddress });
```

---

**7.1.4** ✅ Verify that each log event includes necessary information that would allow for a detailed investigation of the timeline when an event happens.

**Required Fields**:
- Timestamp (ISO 8601 with timezone)
- Event type
- User ID (if authenticated)
- IP address
- Session ID
- Resource accessed
- Action performed
- Outcome (success/failure)
- Request ID (for correlation)

```javascript
logger.info('Vehicle updated', {
  timestamp: new Date().toISOString(),
  eventType: 'VEHICLE_UPDATE',
  userId: req.user.id,
  userRole: req.user.role,
  ipAddress: req.ip,
  sessionId: req.session.id,
  requestId: req.id,
  resourceType: 'vehicle',
  resourceId: vehicleId,
  action: 'UPDATE',
  outcome: 'SUCCESS',
  changes: { mileage: 5000 }
});
```

---

### V7.2: Log Processing

**7.2.1** ✅ Verify that all authentication decisions are logged, without storing sensitive session tokens or passwords. This should include requests with relevant metadata needed for security investigations.

**Implementation**:
```javascript
// Log authentication decisions
logger.info('Authentication attempt', {
  username,
  ipAddress,
  userAgent,
  outcome: 'SUCCESS',
  mfaUsed: true
});

// Do NOT log passwords or session tokens (except hashed/truncated)
```

---

**7.2.2** ✅ Verify that all access control decisions can be logged and all failed decisions are logged.

**Implementation**:
```javascript
function checkAuthorization(user, resource, action) {
  const allowed = user.can(action, resource);

  if (allowed) {
    logger.info('Authorization granted', { userId: user.id, resource, action });
  } else {
    logger.warn('Authorization denied', { userId: user.id, resource, action });
  }

  return allowed;
}
```

---

### V7.3: Log Protection

**7.3.1** ✅ Verify that all logging components appropriately encode data to prevent log injection.

**Implementation**:
```javascript
// Sanitize user input before logging (remove newlines)
function sanitizeForLog(input) {
  if (typeof input === 'string') {
    return input.replace(/[\r\n]/g, ' '); // Prevent log injection
  }
  return input;
}

logger.info('User search', { query: sanitizeForLog(userInput) });
```

---

**7.3.2** ✅ Verify that logs are protected from unauthorized access and modification.

**Implementation**:
- [ ] Restrict log file permissions (read-only for most users)
- [ ] Store logs on separate system from application
- [ ] Use append-only storage for critical logs
- [ ] Encrypt logs in transit (TLS to SIEM)
- [ ] Encrypt logs at rest

---

**7.3.3** ✅ Verify that security logs are protected from unauthorized access and modification.

**Implementation**:
- [ ] Separate security logs from application logs
- [ ] Tamper-evident logs (cryptographic hashing, blockchain)
- [ ] Audit all access to security logs

---

**7.3.4** ✅ Verify that time sources are synchronized to the correct time and time zone.

**Implementation**:
- [ ] Configure NTP (Network Time Protocol)
- [ ] Use UTC timezone for all logs
- [ ] Verify time synchronization (ntpstat, chronyc tracking)

---

### V7.4: Error Handling

**7.4.1** ✅ Verify that a generic message is shown when an unexpected or security sensitive error occurs, potentially with a unique ID which support personnel can use to investigate.

**Implementation**:
```javascript
app.use((err, req, res, next) => {
  // Generate error ID
  const errorId = crypto.randomUUID();

  // Log detailed error server-side
  logger.error('Unhandled error', {
    errorId,
    error: err.stack,
    userId: req.user?.id,
    endpoint: req.path
  });

  // Return generic error to user
  res.status(500).json({
    error: 'An unexpected error occurred. Please contact support with error ID: ' + errorId
  });
});
```

---

**7.4.2** ✅ Verify that exception handling (or a functional equivalent) is used across the codebase to account for expected and unexpected error conditions.

**Implementation**:
```javascript
// Use try-catch for expected errors
async function getVehicle(id) {
  try {
    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      throw new NotFoundError('Vehicle not found');
    }
    return vehicle;
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error; // Re-throw known errors
    }
    // Log and wrap unexpected errors
    logger.error('Database error', { error, vehicleId: id });
    throw new InternalServerError('Failed to retrieve vehicle');
  }
}
```

---

**7.4.3** ✅ Verify that a "last resort" error handler is defined which will catch all unhandled exceptions.

**Implementation**:
```javascript
// Last resort error handler
process.on('uncaughtException', (err) => {
  logger.fatal('Uncaught exception', { error: err.stack });
  // Gracefully shutdown
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.fatal('Unhandled promise rejection', { reason, promise });
  // Gracefully shutdown
  process.exit(1);
});
```

---

## Summary Checklist

### Authentication (V2)
- [ ] Password minimum 12 characters
- [ ] bcrypt/argon2 with cost ≥ 12
- [ ] MFA for all users
- [ ] Account lockout after 3 failed attempts
- [ ] Password breach detection (Have I Been Pwned)

### Session Management (V3)
- [ ] Cryptographically strong session IDs (128+ bits)
- [ ] HttpOnly, Secure, SameSite flags on cookies
- [ ] Session timeout: 15 min idle, 8 hr absolute
- [ ] Regenerate session ID on login/privilege change

### Access Control (V4)
- [ ] Authorization enforced server-side
- [ ] Least privilege principle
- [ ] Protected against IDOR
- [ ] CSRF protection enabled

### Input Validation (V5)
- [ ] Whitelist input validation
- [ ] Parameterized queries (no SQL concatenation)
- [ ] Output encoding (context-aware)
- [ ] No eval() or dynamic code execution
- [ ] SSRF prevention

### Cryptography (V6)
- [ ] AES-256-GCM for data at rest
- [ ] TLS 1.2+ for data in transit
- [ ] Secrets stored in Azure Key Vault
- [ ] FIPS 140-2 approved algorithms

### Logging (V7)
- [ ] Log authentication, authorization, security events
- [ ] Do not log passwords, tokens, PII
- [ ] Protect logs from modification
- [ ] Generic error messages to users

---

## References

- **OWASP ASVS 4.0**: https://owasp.org/www-project-application-security-verification-standard/
- **OWASP Cheat Sheets**: https://cheatsheetseries.owasp.org/
- **OWASP Testing Guide**: https://owasp.org/www-project-web-security-testing-guide/

---

**Last Updated**: 2026-01-08
**Applicable To**: Fleet Management Application (FedRAMP Moderate)
