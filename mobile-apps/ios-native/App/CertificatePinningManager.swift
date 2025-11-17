import Foundation
import CommonCrypto

// MARK: - Certificate Pinning Manager
/// Implements SSL certificate pinning to prevent Man-in-the-Middle (MITM) attacks
/// OWASP Mobile Top 10 - M3: Insecure Communication
class CertificatePinningManager: NSObject {

    // MARK: - Properties
    static let shared = CertificatePinningManager()

    /// Pinned certificate hashes (SHA-256) for fleet.capitaltechalliance.com
    /// To generate: openssl s_client -connect fleet.capitaltechalliance.com:443 | openssl x509 -pubkey -noout | openssl pkey -pubin -outform der | openssl dgst -sha256 -binary | openssl enc -base64
    private let pinnedCertificateHashes: Set<String> = [
        // Primary certificate hash (backup pin)
        "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
        // Backup certificate hash (for certificate rotation)
        "BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB="
    ]

    /// Domains that require certificate pinning
    private let pinnedDomains: Set<String> = [
        "fleet.capitaltechalliance.com",
        "capitaltechalliance.com"
    ]

    /// Enable strict mode (reject connection on pinning failure)
    var strictMode: Bool = true

    /// Enable pinning bypass for development/testing
    var bypassPinning: Bool = {
        #if DEBUG
        return true  // Disable pinning in debug builds for development
        #else
        return false
        #endif
    }()

    private override init() {
        super.init()
    }

    // MARK: - Public Methods

    /// Validate server trust for a given challenge
    /// - Parameters:
    ///   - challenge: The authentication challenge
    ///   - completionHandler: Completion handler with disposition and credential
    func validateServerTrust(
        challenge: URLAuthenticationChallenge,
        completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void
    ) {
        guard challenge.protectionSpace.authenticationMethod == NSURLAuthenticationMethodServerTrust,
              let serverTrust = challenge.protectionSpace.serverTrust else {
            SecurityLogger.shared.logSecurityEvent(.certificateValidationFailed, details: [
                "reason": "Invalid authentication method or missing server trust"
            ])
            completionHandler(.cancelAuthenticationChallenge, nil)
            return
        }

        let host = challenge.protectionSpace.host

        // Check if domain requires pinning
        guard shouldPinDomain(host) else {
            // Domain doesn't require pinning, use default validation
            completionHandler(.performDefaultHandling, nil)
            return
        }

        // Bypass pinning in development if enabled
        if bypassPinning {
            SecurityLogger.shared.logSecurityEvent(.certificateValidationBypass, details: [
                "host": host,
                "reason": "Development mode bypass enabled"
            ])
            completionHandler(.useCredential, URLCredential(trust: serverTrust))
            return
        }

        // Perform certificate pinning validation
        if validateCertificatePinning(serverTrust: serverTrust, host: host) {
            SecurityLogger.shared.logSecurityEvent(.certificateValidationSuccess, details: [
                "host": host
            ])
            completionHandler(.useCredential, URLCredential(trust: serverTrust))
        } else {
            SecurityLogger.shared.logSecurityEvent(.certificateValidationFailed, details: [
                "host": host,
                "reason": "Certificate pinning validation failed"
            ])

            if strictMode {
                completionHandler(.cancelAuthenticationChallenge, nil)
            } else {
                // In non-strict mode, log warning but allow connection
                completionHandler(.performDefaultHandling, nil)
            }
        }
    }

    /// Create a URLSession with certificate pinning enabled
    /// - Parameter delegate: Optional delegate to handle other session events
    /// - Returns: Configured URLSession with pinning enabled
    func createPinnedURLSession(delegate: URLSessionDelegate? = nil) -> URLSession {
        let sessionDelegate = delegate ?? PinningSessionDelegate()
        let configuration = URLSessionConfiguration.default

        // Enhanced security configuration
        configuration.urlCache = nil  // Disable caching for sensitive data
        configuration.requestCachePolicy = .reloadIgnoringLocalAndRemoteCacheData
        configuration.timeoutIntervalForRequest = 30.0
        configuration.timeoutIntervalForResource = 60.0
        configuration.httpShouldSetCookies = false  // Disable cookies for API requests
        configuration.httpCookieAcceptPolicy = .never

        // TLS configuration
        configuration.tlsMinimumSupportedProtocolVersion = .TLSv12

        return URLSession(configuration: configuration, delegate: sessionDelegate, delegateQueue: nil)
    }

    // MARK: - Private Methods

    /// Check if domain requires certificate pinning
    private func shouldPinDomain(_ host: String) -> Bool {
        return pinnedDomains.contains { host.hasSuffix($0) }
    }

    /// Validate certificate pinning by comparing public key hashes
    private func validateCertificatePinning(serverTrust: SecTrust, host: String) -> Bool {
        // Get certificate chain
        guard let certificates = SecTrustCopyCertificateChain(serverTrust) as? [SecCertificate],
              !certificates.isEmpty else {
            return false
        }

        // Validate each certificate in the chain
        for certificate in certificates {
            if let publicKeyHash = extractPublicKeyHash(from: certificate) {
                if pinnedCertificateHashes.contains(publicKeyHash) {
                    return true
                }
            }
        }

        // No matching pinned certificate found
        return false
    }

    /// Extract public key hash (SHA-256) from certificate
    private func extractPublicKeyHash(from certificate: SecCertificate) -> String? {
        guard let publicKey = SecCertificateCopyKey(certificate),
              let publicKeyData = SecKeyCopyExternalRepresentation(publicKey, nil) as Data? else {
            return nil
        }

        // Calculate SHA-256 hash of public key
        var hash = [UInt8](repeating: 0, count: Int(CC_SHA256_DIGEST_LENGTH))
        publicKeyData.withUnsafeBytes {
            _ = CC_SHA256($0.baseAddress, CC_LONG(publicKeyData.count), &hash)
        }

        // Convert to base64 string
        let hashData = Data(hash)
        return hashData.base64EncodedString()
    }

    /// Validate certificate expiration and revocation status
    private func validateCertificateValidity(serverTrust: SecTrust) -> Bool {
        var error: CFError?
        let isValid = SecTrustEvaluateWithError(serverTrust, &error)

        if !isValid, let error = error {
            SecurityLogger.shared.logSecurityEvent(.certificateValidationFailed, details: [
                "reason": "Certificate validation error",
                "error": error.localizedDescription
            ])
        }

        return isValid
    }
}

// MARK: - Pinning Session Delegate
class PinningSessionDelegate: NSObject, URLSessionDelegate {

    func urlSession(
        _ session: URLSession,
        didReceive challenge: URLAuthenticationChallenge,
        completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void
    ) {
        // Delegate to certificate pinning manager
        CertificatePinningManager.shared.validateServerTrust(
            challenge: challenge,
            completionHandler: completionHandler
        )
    }

    func urlSession(
        _ session: URLSession,
        task: URLSessionTask,
        didReceive challenge: URLAuthenticationChallenge,
        completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void
    ) {
        // Delegate to certificate pinning manager
        CertificatePinningManager.shared.validateServerTrust(
            challenge: challenge,
            completionHandler: completionHandler
        )
    }
}

// MARK: - Certificate Pinning Error
enum CertificatePinningError: Error, LocalizedError {
    case noCertificatesFound
    case publicKeyExtractionFailed
    case pinningValidationFailed
    case untrustedCertificate

    var errorDescription: String? {
        switch self {
        case .noCertificatesFound:
            return "No certificates found in server trust"
        case .publicKeyExtractionFailed:
            return "Failed to extract public key from certificate"
        case .pinningValidationFailed:
            return "Certificate pinning validation failed"
        case .untrustedCertificate:
            return "Server certificate is not trusted"
        }
    }
}

// MARK: - Instructions for Deployment
/*
 IMPORTANT: Certificate Pinning Setup Instructions

 1. Generate Certificate Hashes:
    Run these commands to get the certificate hash for fleet.capitaltechalliance.com:

    ```bash
    echo | openssl s_client -connect fleet.capitaltechalliance.com:443 -servername fleet.capitaltechalliance.com 2>/dev/null | openssl x509 -pubkey -noout | openssl pkey -pubin -outform der | openssl dgst -sha256 -binary | openssl enc -base64
    ```

 2. Update pinnedCertificateHashes:
    Replace the placeholder hashes (AAAA... and BBBB...) with actual certificate hashes

 3. Pin Multiple Certificates:
    Always pin at least 2 certificates:
    - Current production certificate
    - Backup certificate (for rotation)

 4. Certificate Rotation:
    When rotating certificates:
    - Add new certificate hash to the array
    - Keep old certificate hash for grace period
    - Remove old hash after all users have updated

 5. Testing:
    - Test in development with bypassPinning = true
    - Test in staging with actual certificates
    - Monitor SecurityLogger for pinning failures

 6. Monitoring:
    - Set up alerts for certificate validation failures
    - Monitor certificate expiration dates
    - Plan certificate rotation 30 days before expiration
*/
