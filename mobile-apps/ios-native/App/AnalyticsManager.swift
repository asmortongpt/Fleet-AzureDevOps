import Foundation
import UIKit

// MARK: - Analytics Manager
/// Centralized Firebase Analytics manager for tracking user events and screen views
/// Privacy-compliant with no PII tracking
class AnalyticsManager {

    // MARK: - Singleton
    static let shared = AnalyticsManager()

    // MARK: - Properties
    private var isEnabled: Bool {
        return FirebaseManager.shared.isAnalyticsEnabled
    }

    private var sessionStartTime: Date?
    private var currentScreen: String?

    // MARK: - Initialization
    private init() {
        sessionStartTime = Date()
    }

    // MARK: - Screen Tracking

    /// Log screen view
    /// - Parameters:
    ///   - screenName: Name of the screen (e.g., "vehicle_list", "trip_detail")
    ///   - screenClass: Class name of the view controller
    func logScreenView(screenName: String, screenClass: String? = nil) {
        guard isEnabled else { return }

        currentScreen = screenName

        let parameters: [String: Any] = [
            "screen_name": screenName,
            "screen_class": screenClass ?? screenName
        ]

        // Uncomment when Firebase SDK is added:
        /*
        Analytics.logEvent(AnalyticsEventScreenView, parameters: parameters)
        */

        print("📊 Screen View: \(screenName)")
    }

    // MARK: - User Events

    /// Log authentication events
    func logLogin(method: String) {
        logEvent("login", parameters: [
            "method": method
        ])
    }

    func logSignup(method: String) {
        logEvent("sign_up", parameters: [
            "method": method
        ])
    }

    func logLogout() {
        logEvent("logout", parameters: [:])
    }

    // MARK: - Trip Events

    /// Log trip started event
    func logTripStarted(vehicleId: String, tripType: String? = nil) {
        var parameters: [String: Any] = [
            "vehicle_id": vehicleId
        ]

        if let type = tripType {
            parameters["trip_type"] = type
        }

        logEvent("trip_started", parameters: parameters)
    }

    /// Log trip completed event
    func logTripCompleted(vehicleId: String, duration: TimeInterval, distance: Double?) {
        var parameters: [String: Any] = [
            "vehicle_id": vehicleId,
            "duration_seconds": Int(duration)
        ]

        if let distance = distance {
            parameters["distance_km"] = distance
        }

        logEvent("trip_completed", parameters: parameters)
    }

    /// Log trip paused event
    func logTripPaused(vehicleId: String) {
        logEvent("trip_paused", parameters: [
            "vehicle_id": vehicleId
        ])
    }

    /// Log trip resumed event
    func logTripResumed(vehicleId: String) {
        logEvent("trip_resumed", parameters: [
            "vehicle_id": vehicleId
        ])
    }

    // MARK: - Vehicle Events

    /// Log vehicle viewed event
    func logVehicleViewed(vehicleId: String, source: String? = nil) {
        var parameters: [String: Any] = [
            "vehicle_id": vehicleId
        ]

        if let source = source {
            parameters["source"] = source
        }

        logEvent("vehicle_viewed", parameters: parameters)
    }

    /// Log vehicle inspection started
    func logInspectionStarted(vehicleId: String, inspectionType: String) {
        logEvent("inspection_started", parameters: [
            "vehicle_id": vehicleId,
            "inspection_type": inspectionType
        ])
    }

    /// Log vehicle inspection completed
    func logInspectionCompleted(vehicleId: String, inspectionType: String, issuesFound: Int) {
        logEvent("inspection_completed", parameters: [
            "vehicle_id": vehicleId,
            "inspection_type": inspectionType,
            "issues_found": issuesFound
        ])
    }

    // MARK: - Maintenance Events

    /// Log maintenance scheduled
    func logMaintenanceScheduled(vehicleId: String, maintenanceType: String) {
        logEvent("maintenance_scheduled", parameters: [
            "vehicle_id": vehicleId,
            "maintenance_type": maintenanceType
        ])
    }

    /// Log maintenance completed
    func logMaintenanceCompleted(vehicleId: String, maintenanceType: String, cost: Double?) {
        var parameters: [String: Any] = [
            "vehicle_id": vehicleId,
            "maintenance_type": maintenanceType
        ]

        if let cost = cost {
            parameters["cost"] = cost
        }

        logEvent("maintenance_completed", parameters: parameters)
    }

    // MARK: - Media Events

    /// Log photo captured
    func logPhotoCaptured(context: String, vehicleId: String? = nil) {
        var parameters: [String: Any] = [
            "context": context
        ]

        if let vehicleId = vehicleId {
            parameters["vehicle_id"] = vehicleId
        }

        logEvent("photo_captured", parameters: parameters)
    }

    /// Log document scanned
    func logDocumentScanned(documentType: String, vehicleId: String? = nil) {
        var parameters: [String: Any] = [
            "document_type": documentType
        ]

        if let vehicleId = vehicleId {
            parameters["vehicle_id"] = vehicleId
        }

        logEvent("document_scanned", parameters: parameters)
    }

    /// Log barcode scanned
    func logBarcodeScanned(barcodeType: String, source: String) {
        logEvent("barcode_scanned", parameters: [
            "barcode_type": barcodeType,
            "source": source
        ])
    }

    // MARK: - Sync Events

    /// Log sync started
    func logSyncStarted(syncType: String) {
        logEvent("sync_started", parameters: [
            "sync_type": syncType
        ])
    }

    /// Log sync completed
    func logSyncCompleted(syncType: String, itemsSynced: Int, duration: TimeInterval) {
        logEvent("sync_completed", parameters: [
            "sync_type": syncType,
            "items_synced": itemsSynced,
            "duration_seconds": Int(duration)
        ])
    }

    /// Log sync failed
    func logSyncFailed(syncType: String, errorCode: String?) {
        var parameters: [String: Any] = [
            "sync_type": syncType
        ]

        if let errorCode = errorCode {
            parameters["error_code"] = errorCode
        }

        logEvent("sync_failed", parameters: parameters)
    }

    // MARK: - Search Events

    /// Log search performed
    func logSearch(searchTerm: String, resultCount: Int) {
        // Hash search term to avoid PII
        let hashedTerm = searchTerm.sha256Hash()

        logEvent("search", parameters: [
            "search_term_hash": hashedTerm,
            "result_count": resultCount
        ])
    }

    // MARK: - Feature Usage Events

    /// Log feature used
    func logFeatureUsed(featureName: String, context: String? = nil) {
        var parameters: [String: Any] = [
            "feature_name": featureName
        ]

        if let context = context {
            parameters["context"] = context
        }

        logEvent("feature_used", parameters: parameters)
    }

    /// Log button tapped
    func logButtonTapped(buttonName: String, screen: String) {
        logEvent("button_tapped", parameters: [
            "button_name": buttonName,
            "screen": screen
        ])
    }

    // MARK: - Error Events

    /// Log error occurred
    func logError(errorType: String, errorCode: String? = nil, context: String? = nil) {
        var parameters: [String: Any] = [
            "error_type": errorType
        ]

        if let errorCode = errorCode {
            parameters["error_code"] = errorCode
        }

        if let context = context {
            parameters["context"] = context
        }

        logEvent("error_occurred", parameters: parameters)
    }

    // MARK: - Conversion Events

    /// Log conversion event (e.g., completed onboarding, first trip)
    func logConversion(conversionType: String, value: Double? = nil) {
        var parameters: [String: Any] = [
            "conversion_type": conversionType
        ]

        if let value = value {
            parameters["value"] = value
        }

        logEvent("conversion", parameters: parameters)
    }

    // MARK: - Session Events

    /// Log app session started
    func logSessionStart() {
        sessionStartTime = Date()
        logEvent("session_start", parameters: [:])
    }

    /// Log app session ended
    func logSessionEnd() {
        guard let startTime = sessionStartTime else { return }

        let duration = Date().timeIntervalSince(startTime)

        logEvent("session_end", parameters: [
            "duration_seconds": Int(duration)
        ])
    }

    // MARK: - Custom Events

    /// Log custom event with parameters
    /// - Parameters:
    ///   - name: Event name (use snake_case)
    ///   - parameters: Event parameters (must be JSON-serializable)
    func logEvent(_ name: String, parameters: [String: Any]) {
        guard isEnabled else { return }

        // Validate event name
        guard isValidEventName(name) else {
            print("⚠️ Invalid event name: \(name)")
            return
        }

        // Sanitize parameters to ensure no PII
        let sanitizedParameters = sanitizeParameters(parameters)

        // Uncomment when Firebase SDK is added:
        /*
        Analytics.logEvent(name, parameters: sanitizedParameters)
        */

        print("📊 Event: \(name)")
        if !sanitizedParameters.isEmpty {
            print("   Parameters: \(sanitizedParameters)")
        }
    }

    // MARK: - User Properties

    /// Set user property (must not contain PII)
    func setUserProperty(_ value: String?, forName name: String) {
        guard isEnabled else { return }

        // Validate property name
        guard isValidPropertyName(name) else {
            print("⚠️ Invalid user property name: \(name)")
            return
        }

        FirebaseManager.shared.setUserProperty(value, forName: name)
    }

    /// Set user role
    func setUserRole(_ role: String) {
        setUserProperty(role, forName: "user_role")
    }

    /// Set user tier/plan
    func setUserTier(_ tier: String) {
        setUserProperty(tier, forName: "user_tier")
    }

    /// Set user preferences
    func setUserPreference(_ preference: String, value: String) {
        setUserProperty(value, forName: "pref_\(preference)")
    }

    // MARK: - Validation

    /// Validate event name format
    private func isValidEventName(_ name: String) -> Bool {
        // Event names should be snake_case, alphanumeric plus underscore
        let validPattern = "^[a-z0-9_]+$"
        let regex = try? NSRegularExpression(pattern: validPattern)
        let range = NSRange(location: 0, length: name.utf16.count)
        return regex?.firstMatch(in: name, range: range) != nil
    }

    /// Validate property name format
    private func isValidPropertyName(_ name: String) -> Bool {
        // Property names should be snake_case, alphanumeric plus underscore
        let validPattern = "^[a-z0-9_]+$"
        let regex = try? NSRegularExpression(pattern: validPattern)
        let range = NSRange(location: 0, length: name.utf16.count)
        return regex?.firstMatch(in: name, range: range) != nil
    }

    // MARK: - Privacy

    /// Sanitize parameters to ensure no PII is logged
    private func sanitizeParameters(_ parameters: [String: Any]) -> [String: Any] {
        var sanitized = [String: Any]()

        // List of parameter keys that might contain PII
        let piiKeys = ["email", "phone", "name", "address", "ssn", "credit_card", "password"]

        for (key, value) in parameters {
            // Check if key suggests PII
            let keyLower = key.lowercased()
            let isPII = piiKeys.contains { keyLower.contains($0) }

            if isPII {
                // Hash PII values instead of sending raw
                if let stringValue = value as? String {
                    sanitized[key] = stringValue.sha256Hash()
                }
            } else {
                // Include non-PII values as-is
                sanitized[key] = value
            }
        }

        return sanitized
    }

    // MARK: - Configuration

    /// Enable/disable analytics
    func setAnalyticsEnabled(_ enabled: Bool) {
        // Uncomment when Firebase SDK is added:
        /*
        Analytics.setAnalyticsCollectionEnabled(enabled)
        */

        print("📊 Analytics \(enabled ? "enabled" : "disabled")")
    }

    /// Reset analytics data (e.g., on logout)
    func resetAnalyticsData() {
        guard isEnabled else { return }

        // Uncomment when Firebase SDK is added:
        /*
        Analytics.resetAnalyticsData()
        */

        sessionStartTime = nil
        currentScreen = nil

        print("📊 Analytics data reset")
    }
}

// MARK: - String Extension (reuse from FirebaseManager)
// Disabled - already defined elsewhere
/*
extension String {
    func sha256Hash() -> String {
        guard let data = self.data(using: .utf8) else { return self }

        // Simple hash for anonymization
        // In production, use CryptoKit for proper SHA-256
        var hash = 0
        for byte in data {
            hash = ((hash << 5) &- hash) &+ Int(byte)
        }

        return String(format: "%016x", abs(hash))
    }
}
*/
