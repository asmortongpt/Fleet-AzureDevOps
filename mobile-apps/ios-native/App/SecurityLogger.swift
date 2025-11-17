import Foundation
import UIKit

// MARK: - Security Logger
/// Centralized security event logging for monitoring and incident response
/// OWASP Mobile Top 10 - M10: Insufficient Logging & Monitoring
class SecurityLogger {

    // MARK: - Properties
    static let shared = SecurityLogger()

    /// Maximum log entries to keep in memory
    private let maxLogEntries = 1000

    /// Security log entries stored in memory
    private var logEntries: [SecurityLogEntry] = []

    /// Queue for thread-safe logging
    private let logQueue = DispatchQueue(label: "com.fleet.securitylogger", qos: .utility)

    /// Enable/disable logging
    var isEnabled: Bool = true

    /// Enable console output for debugging
    var consoleOutputEnabled: Bool = {
        #if DEBUG
        return true
        #else
        return false
        #endif
    }()

    /// Enable remote logging to backend
    var remoteLoggingEnabled: Bool = true

    /// Remote logging endpoint
    private let remoteLogEndpoint = "/api/security/logs"

    private init() {
        // Register for application lifecycle events
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(applicationWillTerminate),
            name: UIApplication.willTerminateNotification,
            object: nil
        )
    }

    // MARK: - Public Methods

    /// Log a security event
    /// - Parameters:
    ///   - eventType: Type of security event
    ///   - details: Additional details about the event
    ///   - severity: Event severity level (default: .medium)
    func logSecurityEvent(
        _ eventType: SecurityEventType,
        details: [String: Any] = [:],
        severity: SecurityEventSeverity = .medium
    ) {
        guard isEnabled else { return }

        let entry = SecurityLogEntry(
            eventType: eventType,
            severity: severity,
            details: details,
            timestamp: Date(),
            deviceInfo: collectDeviceInfo()
        )

        logQueue.async { [weak self] in
            guard let self = self else { return }

            // Add to in-memory log
            self.logEntries.append(entry)

            // Maintain max log size
            if self.logEntries.count > self.maxLogEntries {
                self.logEntries.removeFirst(self.logEntries.count - self.maxLogEntries)
            }

            // Console output for debugging
            if self.consoleOutputEnabled {
                self.printToConsole(entry)
            }

            // Send to remote backend for critical events
            if self.remoteLoggingEnabled && severity >= .high {
                self.sendToRemoteBackend(entry)
            }

            // Persist to local storage
            self.persistToLocalStorage(entry)

            // Alert for critical security events
            if severity == .critical {
                self.handleCriticalEvent(entry)
            }
        }
    }

    /// Get recent security events
    /// - Parameters:
    ///   - limit: Maximum number of events to return
    ///   - eventType: Filter by event type (optional)
    /// - Returns: Array of security log entries
    func getRecentEvents(limit: Int = 100, eventType: SecurityEventType? = nil) -> [SecurityLogEntry] {
        var filteredEntries = logEntries

        if let eventType = eventType {
            filteredEntries = filteredEntries.filter { $0.eventType == eventType }
        }

        return Array(filteredEntries.suffix(limit))
    }

    /// Get security summary statistics
    /// - Returns: Dictionary with event counts by type
    func getSecuritySummary() -> [String: Int] {
        var summary: [String: Int] = [:]

        for entry in logEntries {
            let key = entry.eventType.rawValue
            summary[key, default: 0] += 1
        }

        return summary
    }

    /// Clear all log entries
    func clearLogs() {
        logQueue.async { [weak self] in
            self?.logEntries.removeAll()
            self?.logSecurityEvent(.logsCleared, severity: .low)
        }
    }

    /// Export logs for analysis
    /// - Returns: JSON string of all log entries
    func exportLogs() -> String? {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        encoder.outputFormatting = .prettyPrinted

        guard let data = try? encoder.encode(logEntries),
              let json = String(data: data, encoding: .utf8) else {
            return nil
        }

        return json
    }

    // MARK: - Private Methods

    /// Print log entry to console
    private func printToConsole(_ entry: SecurityLogEntry) {
        let emoji = entry.severity.emoji
        let timestamp = DateFormatter.iso8601Full.string(from: entry.timestamp)
        print("[\(emoji) SECURITY] \(timestamp) - \(entry.eventType.description)")

        if !entry.details.isEmpty {
            print("  Details: \(entry.details)")
        }
    }

    /// Send log entry to remote backend
    private func sendToRemoteBackend(_ entry: SecurityLogEntry) {
        Task {
            do {
                let encoder = JSONEncoder()
                encoder.dateEncodingStrategy = .iso8601

                let jsonData = try encoder.encode(entry)

                guard let url = URL(string: APIConfiguration.apiBaseURL + remoteLogEndpoint) else {
                    return
                }

                var request = URLRequest(url: url)
                request.httpMethod = "POST"
                request.setValue("application/json", forHTTPHeaderField: "Content-Type")
                request.httpBody = jsonData

                let (_, response) = try await URLSession.shared.data(for: request)

                if let httpResponse = response as? HTTPURLResponse,
                   httpResponse.statusCode != 200 {
                    print("⚠️ Failed to send security log to backend: \(httpResponse.statusCode)")
                }
            } catch {
                print("⚠️ Error sending security log: \(error.localizedDescription)")
            }
        }
    }

    /// Persist log entry to local storage
    private func persistToLocalStorage(_ entry: SecurityLogEntry) {
        // Store in UserDefaults for basic persistence
        // In production, consider using Core Data or file-based storage
        let key = "security_logs"
        var logs = UserDefaults.standard.array(forKey: key) as? [[String: Any]] ?? []

        var logDict: [String: Any] = [
            "eventType": entry.eventType.rawValue,
            "severity": entry.severity.rawValue,
            "timestamp": entry.timestamp.timeIntervalSince1970,
            "details": entry.details
        ]

        logs.append(logDict)

        // Keep only last 500 entries in UserDefaults
        if logs.count > 500 {
            logs = Array(logs.suffix(500))
        }

        UserDefaults.standard.set(logs, forKey: key)
    }

    /// Handle critical security events
    private func handleCriticalEvent(_ entry: SecurityLogEntry) {
        // Trigger immediate actions for critical events
        DispatchQueue.main.async {
            // Show alert to user (optional)
            // Lock application (optional)
            // Force logout (optional)

            // Notify security team
            self.notifySecurityTeam(entry)
        }
    }

    /// Notify security team of critical events
    private func notifySecurityTeam(_ entry: SecurityLogEntry) {
        // Send immediate notification to security team
        // Could integrate with push notifications, email, or SMS
        print("🚨 CRITICAL SECURITY EVENT: \(entry.eventType.description)")
    }

    /// Collect device information for logging context
    private func collectDeviceInfo() -> [String: String] {
        let device = UIDevice.current

        return [
            "deviceModel": device.model,
            "deviceName": device.name,
            "systemVersion": device.systemVersion,
            "appVersion": Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "unknown",
            "buildNumber": Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "unknown"
        ]
    }

    // MARK: - Lifecycle Methods

    @objc private func applicationWillTerminate() {
        // Flush logs before termination
        logSecurityEvent(.applicationTerminated, severity: .low)
    }
}

// MARK: - Security Event Types
enum SecurityEventType: String, Codable {
    // Authentication Events
    case authenticationSuccess = "auth_success"
    case authenticationFailed = "auth_failed"
    case authenticationAttemptExceeded = "auth_attempts_exceeded"
    case logout = "logout"
    case sessionExpired = "session_expired"
    case tokenRefreshed = "token_refreshed"

    // Certificate & Network Security
    case certificateValidationSuccess = "cert_validation_success"
    case certificateValidationFailed = "cert_validation_failed"
    case certificateValidationBypass = "cert_validation_bypass"
    case sslPinningFailed = "ssl_pinning_failed"

    // Data Encryption
    case dataEncrypted = "data_encrypted"
    case dataDecrypted = "data_decrypted"
    case dataDeleted = "data_deleted"
    case encryptionFailed = "encryption_failed"
    case decryptionFailed = "decryption_failed"

    // Key Management
    case keyGenerated = "key_generated"
    case keyRotated = "key_rotated"
    case keyGenerationFailed = "key_generation_failed"

    // Device Security
    case jailbreakDetected = "jailbreak_detected"
    case debuggerDetected = "debugger_detected"
    case deviceCompromised = "device_compromised"
    case suspiciousActivity = "suspicious_activity"

    // API Security
    case apiRequestFailed = "api_request_failed"
    case unauthorizedAPIAccess = "unauthorized_api_access"
    case rateLimitExceeded = "rate_limit_exceeded"

    // Configuration
    case configurationLoaded = "config_loaded"
    case configurationFailed = "config_failed"
    case secretsExposed = "secrets_exposed"

    // Application Lifecycle
    case applicationLaunched = "app_launched"
    case applicationTerminated = "app_terminated"
    case applicationBackgrounded = "app_backgrounded"

    // Logging
    case logsCleared = "logs_cleared"
    case logsExported = "logs_exported"

    // NIST Compliance Events
    case complianceVerified = "compliance_verified"
    case complianceViolation = "compliance_violation"
    case complianceCheckPassed = "compliance_check_passed"
    case complianceCheckFailed = "compliance_check_failed"

    var description: String {
        switch self {
        case .authenticationSuccess: return "Authentication successful"
        case .authenticationFailed: return "Authentication failed"
        case .authenticationAttemptExceeded: return "Authentication attempts exceeded"
        case .logout: return "User logged out"
        case .sessionExpired: return "Session expired"
        case .tokenRefreshed: return "Token refreshed"
        case .certificateValidationSuccess: return "Certificate validation successful"
        case .certificateValidationFailed: return "Certificate validation failed"
        case .certificateValidationBypass: return "Certificate validation bypassed"
        case .sslPinningFailed: return "SSL pinning failed"
        case .dataEncrypted: return "Data encrypted"
        case .dataDecrypted: return "Data decrypted"
        case .dataDeleted: return "Data deleted"
        case .encryptionFailed: return "Encryption failed"
        case .decryptionFailed: return "Decryption failed"
        case .keyGenerated: return "Encryption key generated"
        case .keyRotated: return "Encryption key rotated"
        case .keyGenerationFailed: return "Key generation failed"
        case .jailbreakDetected: return "Jailbreak detected"
        case .debuggerDetected: return "Debugger detected"
        case .deviceCompromised: return "Device compromised"
        case .suspiciousActivity: return "Suspicious activity detected"
        case .apiRequestFailed: return "API request failed"
        case .unauthorizedAPIAccess: return "Unauthorized API access"
        case .rateLimitExceeded: return "Rate limit exceeded"
        case .configurationLoaded: return "Configuration loaded"
        case .configurationFailed: return "Configuration failed"
        case .secretsExposed: return "Secrets exposed"
        case .applicationLaunched: return "Application launched"
        case .applicationTerminated: return "Application terminated"
        case .applicationBackgrounded: return "Application backgrounded"
        case .logsCleared: return "Security logs cleared"
        case .logsExported: return "Security logs exported"
        case .complianceVerified: return "NIST compliance verified"
        case .complianceViolation: return "NIST compliance violation detected"
        case .complianceCheckPassed: return "NIST compliance check passed"
        case .complianceCheckFailed: return "NIST compliance check failed"
        }
    }
}

// MARK: - Security Event Severity
enum SecurityEventSeverity: String, Codable, Comparable {
    case low = "low"
    case medium = "medium"
    case high = "high"
    case critical = "critical"

    var emoji: String {
        switch self {
        case .low: return "ℹ️"
        case .medium: return "⚠️"
        case .high: return "🔴"
        case .critical: return "🚨"
        }
    }

    static func < (lhs: SecurityEventSeverity, rhs: SecurityEventSeverity) -> Bool {
        let order: [SecurityEventSeverity] = [.low, .medium, .high, .critical]
        guard let lhsIndex = order.firstIndex(of: lhs),
              let rhsIndex = order.firstIndex(of: rhs) else {
            return false
        }
        return lhsIndex < rhsIndex
    }
}

// MARK: - Security Log Entry
struct SecurityLogEntry: Codable {
    let id: UUID
    let eventType: SecurityEventType
    let severity: SecurityEventSeverity
    let details: [String: Any]
    let timestamp: Date
    let deviceInfo: [String: String]

    init(
        eventType: SecurityEventType,
        severity: SecurityEventSeverity,
        details: [String: Any],
        timestamp: Date,
        deviceInfo: [String: String]
    ) {
        self.id = UUID()
        self.eventType = eventType
        self.severity = severity
        self.details = details
        self.timestamp = timestamp
        self.deviceInfo = deviceInfo
    }

    // Custom Codable implementation for [String: Any]
    enum CodingKeys: String, CodingKey {
        case id, eventType, severity, details, timestamp, deviceInfo
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(id, forKey: .id)
        try container.encode(eventType, forKey: .eventType)
        try container.encode(severity, forKey: .severity)
        try container.encode(timestamp, forKey: .timestamp)
        try container.encode(deviceInfo, forKey: .deviceInfo)

        // Encode details as JSON string
        let detailsData = try JSONSerialization.data(withJSONObject: details)
        let detailsString = String(data: detailsData, encoding: .utf8) ?? "{}"
        try container.encode(detailsString, forKey: .details)
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(UUID.self, forKey: .id)
        eventType = try container.decode(SecurityEventType.self, forKey: .eventType)
        severity = try container.decode(SecurityEventSeverity.self, forKey: .severity)
        timestamp = try container.decode(Date.self, forKey: .timestamp)
        deviceInfo = try container.decode([String: String].self, forKey: .deviceInfo)

        // Decode details from JSON string
        let detailsString = try container.decode(String.self, forKey: .details)
        if let detailsData = detailsString.data(using: .utf8),
           let decodedDetails = try? JSONSerialization.jsonObject(with: detailsData) as? [String: Any] {
            details = decodedDetails
        } else {
            details = [:]
        }
    }
}

// MARK: - Date Formatter Extension
extension DateFormatter {
    static let iso8601Full: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSSZZZZZ"
        formatter.calendar = Calendar(identifier: .iso8601)
        formatter.timeZone = TimeZone(secondsFromGMT: 0)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        return formatter
    }()
}

// MARK: - Usage Examples
/*
 Example Usage:

 1. Log authentication failure:
    ```swift
    SecurityLogger.shared.logSecurityEvent(
        .authenticationFailed,
        details: ["email": email, "reason": "Invalid credentials"],
        severity: .high
    )
    ```

 2. Log jailbreak detection:
    ```swift
    SecurityLogger.shared.logSecurityEvent(
        .jailbreakDetected,
        details: ["method": "Cydia detected"],
        severity: .critical
    )
    ```

 3. Get recent events:
    ```swift
    let recentEvents = SecurityLogger.shared.getRecentEvents(limit: 50)
    ```

 4. Export logs:
    ```swift
    if let json = SecurityLogger.shared.exportLogs() {
        // Send to backend or save to file
    }
    ```
*/
