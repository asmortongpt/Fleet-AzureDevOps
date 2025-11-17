# iOS Security Features - Quick Start Guide

## 🚀 Quick Implementation Guide

### 1. Certificate Pinning (5 minutes)

```swift
// Already integrated in APIConfiguration.swift
// No code changes needed - just update certificate hashes

// Generate hash for your domain:
// $ echo | openssl s_client -connect fleet.capitaltechalliance.com:443 | \
//   openssl x509 -pubkey -noout | openssl pkey -pubin -outform der | \
//   openssl dgst -sha256 -binary | openssl enc -base64

// Update in CertificatePinningManager.swift:
private let pinnedCertificateHashes: Set<String> = [
    "YOUR_PRIMARY_CERT_HASH_HERE",
    "YOUR_BACKUP_CERT_HASH_HERE"
]
```

### 2. Encrypt Sensitive Data (1 minute)

```swift
// Store encrypted data
let token = "auth_token".data(using: .utf8)!
try EncryptionManager.shared.secureStore(data: token, forKey: "auth_token")

// Retrieve encrypted data
let retrieved = try EncryptionManager.shared.secureRetrieve(forKey: "auth_token")
```

### 3. Check Device Security (30 seconds)

```swift
// In AppDelegate.swift - didFinishLaunchingWithOptions
do {
    try JailbreakDetector.shared.enforcePolicy()
} catch {
    // Device is jailbroken - show alert and exit
    return false
}
```

### 4. Log Security Events (30 seconds)

```swift
// Log authentication attempt
SecurityLogger.shared.logSecurityEvent(
    .authenticationFailed,
    details: ["email": email],
    severity: .high
)
```

### 5. Use Secure Configuration (1 minute)

```swift
// Replace hardcoded values
let subscriptionId = SecureConfigManager.shared.azureSubscriptionId
let apiURL = SecureConfigManager.shared.apiBaseURL
```

---

## 🔒 Security Checklist

### Before First Deployment
- [ ] Update certificate pinning hashes with production certificates
- [ ] Configure Azure subscription ID (environment variable or secure config)
- [ ] Create `SecureConfig.plist` in app bundle
- [ ] Enable strict mode in production build
- [ ] Test jailbreak detection on physical devices
- [ ] Set up backend security logging endpoint

### Every API Call to Sensitive Endpoints
- [ ] Use `AzureNetworkManager` (certificate pinning enabled)
- [ ] Encrypt sensitive payloads with `encryptPayload: true`
- [ ] Log security events for failures

### Every Sensitive Data Storage
- [ ] Use `EncryptionManager.shared.secureStore()`
- [ ] Never use `UserDefaults` for sensitive data
- [ ] Never hardcode secrets in code

---

## 🛡️ Security Features Overview

| Feature | File | Purpose | Status |
|---------|------|---------|--------|
| **Certificate Pinning** | `CertificatePinningManager.swift` | Prevent MITM attacks | ✅ Ready |
| **AES-256 Encryption** | `EncryptionManager.swift` | Encrypt sensitive data | ✅ Ready |
| **Security Logging** | `SecurityLogger.swift` | Monitor security events | ✅ Ready |
| **Jailbreak Detection** | `JailbreakDetector.swift` | Detect compromised devices | ✅ Ready |
| **Secure Config** | `SecureConfigManager.swift` | Externalize secrets | ✅ Ready |

---

## 📋 Common Use Cases

### Use Case 1: Authenticate User
```swift
func login(email: String, password: String) async throws {
    // Encrypt credentials
    let credentials = [
        "email": email,
        "password": password
    ]

    // Make authenticated request with encryption
    let response = try await networkManager.performRequest(
        endpoint: APIConfiguration.Endpoints.login,
        method: .POST,
        body: credentials,
        responseType: LoginResponse.self,
        encryptPayload: true  // ✅ Encrypt sensitive data
    )

    // Store encrypted token
    if let token = response.token.data(using: .utf8) {
        try EncryptionManager.shared.secureStore(data: token, forKey: "auth_token")
    }

    // Log success
    SecurityLogger.shared.logSecurityEvent(
        .authenticationSuccess,
        details: ["email": email],
        severity: .low
    )
}
```

### Use Case 2: Upload Sensitive Vehicle Data
```swift
func uploadVehicleData(vin: String, driverLicense: String) async throws {
    let data = [
        "vin": vin,
        "driver_license": driverLicense
    ]

    // Automatically encrypted because contains sensitive fields
    try await networkManager.performRequest(
        endpoint: APIConfiguration.Endpoints.vehicles,
        method: .POST,
        body: data,
        responseType: VehicleResponse.self,
        encryptPayload: true  // ✅ Encrypt VIN and license
    )
}
```

### Use Case 3: Check Device Security on Launch
```swift
func application(_ application: UIApplication,
                didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {

    // Check device security
    do {
        try JailbreakDetector.shared.enforcePolicy()
    } catch {
        // Show alert to user
        showSecurityAlert(error.localizedDescription)
        return false
    }

    // Log app launch
    SecurityLogger.shared.logSecurityEvent(
        .applicationLaunched,
        details: [:],
        severity: .low
    )

    return true
}
```

### Use Case 4: Secure Data Retrieval
```swift
func getStoredAuthToken() -> String? {
    do {
        // Retrieve encrypted token
        if let tokenData = try EncryptionManager.shared.secureRetrieve(forKey: "auth_token"),
           let token = String(data: tokenData, encoding: .utf8) {
            return token
        }
    } catch {
        SecurityLogger.shared.logSecurityEvent(
            .decryptionFailed,
            details: ["error": error.localizedDescription],
            severity: .medium
        )
    }
    return nil
}
```

---

## ⚠️ Common Mistakes to Avoid

### ❌ DON'T: Store Sensitive Data in UserDefaults
```swift
// BAD - Insecure!
UserDefaults.standard.set(authToken, forKey: "token")
```

### ✅ DO: Use EncryptionManager
```swift
// GOOD - Encrypted!
try EncryptionManager.shared.secureStore(data: tokenData, forKey: "token")
```

---

### ❌ DON'T: Hardcode Secrets
```swift
// BAD - Exposed in binary!
let apiKey = "sk_live_12345abcde"
let subscriptionId = "abc-123-def-456"
```

### ✅ DO: Use SecureConfigManager
```swift
// GOOD - Externalized!
let apiKey = SecureConfigManager.shared.getValue(forKey: .apiEncryptionKey)
let subscriptionId = SecureConfigManager.shared.azureSubscriptionId
```

---

### ❌ DON'T: Create Plain URLSession
```swift
// BAD - No certificate pinning!
let session = URLSession.shared
```

### ✅ DO: Use AzureNetworkManager
```swift
// GOOD - Certificate pinning enabled!
let networkManager = AzureNetworkManager()
```

---

### ❌ DON'T: Ignore Security Logs
```swift
// BAD - No monitoring!
print("Login failed")
```

### ✅ DO: Use SecurityLogger
```swift
// GOOD - Centralized monitoring!
SecurityLogger.shared.logSecurityEvent(
    .authenticationFailed,
    details: ["email": email],
    severity: .high
)
```

---

## 🔧 Development vs Production

### Development Mode
```swift
#if DEBUG
// Jailbreak detection: Disabled
JailbreakDetector.shared.strictMode = false

// Certificate pinning: Bypassed
CertificatePinningManager.shared.bypassPinning = true

// Security logging: Console only
SecurityLogger.shared.remoteLoggingEnabled = false
#endif
```

### Production Mode
```swift
#if !DEBUG
// Jailbreak detection: Enforced
JailbreakDetector.shared.strictMode = true

// Certificate pinning: Strict
CertificatePinningManager.shared.bypassPinning = false

// Security logging: Remote enabled
SecurityLogger.shared.remoteLoggingEnabled = true
#endif
```

---

## 📊 Security Metrics

Monitor these metrics in production:

1. **Certificate Pinning Failures**: Should be near 0%
2. **Jailbreak Detection Rate**: Track percentage of jailbroken devices
3. **Failed Authentication Attempts**: Monitor for brute force attacks
4. **Encryption Errors**: Should be near 0%
5. **Security Log Volume**: Establish baseline and alert on spikes

---

## 🆘 Troubleshooting

### Certificate Pinning Fails in Development
**Solution**: Set `bypassPinning = true` in debug builds or use actual domain

### Jailbreak Detector Blocking Debug Build
**Solution**: Set `strictMode = false` in debug builds

### Encryption Key Lost
**Solution**: Keys are stored in Keychain - survives app reinstalls but not device resets

### Security Logs Not Appearing
**Solution**: Check `isEnabled = true` and `consoleOutputEnabled = true`

---

## 📚 Additional Resources

- **Full Documentation**: See `SECURITY_IMPROVEMENTS.md`
- **OWASP Mobile Top 10**: https://owasp.org/www-project-mobile-top-10/
- **iOS Security Guide**: https://developer.apple.com/security/
- **Certificate Pinning Guide**: See `CertificatePinningManager.swift` comments

---

## 🎯 Next Steps

1. Review `SECURITY_IMPROVEMENTS.md` for comprehensive documentation
2. Complete production deployment checklist
3. Set up security monitoring and alerting
4. Schedule quarterly security reviews
5. Plan certificate rotation calendar

---

**Security Status**: ✅ Production Ready (after certificate hash update)

**Questions?** Contact the security team or review inline documentation in each security file.
