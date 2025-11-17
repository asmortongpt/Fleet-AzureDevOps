import Foundation
import UIKit

// MARK: - Alert Type
public enum AlertType: String, Codable {
    case performanceDegradation = "performance_degradation"
    case memoryWarning = "memory_warning"
    case thermalStateWarning = "thermal_state_warning"
    case networkError = "network_error"
    case dataCorruption = "data_corruption"
    case securityThreat = "security_threat"
}

// MARK: - Alert Priority
public enum AlertPriority: String, Codable {
    case low = "low"
    case medium = "medium"
    case high = "high"
    case critical = "critical"
}

// MARK: - Alert Model
public struct Alert: Codable, Identifiable {
    public let id: String
    public let type: AlertType
    public let priority: AlertPriority
    public let title: String
    public let message: String
    public let timestamp: Date
    public var acknowledged: Bool

    public init(type: AlertType, priority: AlertPriority, title: String, message: String) {
        self.id = UUID().uuidString
        self.type = type
        self.priority = priority
        self.title = title
        self.message = message
        self.timestamp = Date()
        self.acknowledged = false
    }
}

// MARK: - Alert Manager
@MainActor
public class AlertManager {

    // MARK: - Singleton
    public static let shared = AlertManager()

    private init() {}

    // MARK: - Properties
    private var activeAlerts: [Alert] = []
    private let maxAlerts: Int = 100

    // MARK: - Public Methods

    /// Trigger an alert
    public func triggerAlert(type: AlertType, priority: AlertPriority, title: String, message: String) {
        let alert = Alert(type: type, priority: priority, title: title, message: message)

        activeAlerts.insert(alert, at: 0)

        // Trim old alerts
        if activeAlerts.count > maxAlerts {
            activeAlerts = Array(activeAlerts.prefix(maxAlerts))
        }

        // Log based on priority
        switch priority {
        case .critical, .high:
            print("🚨 [\(type.rawValue)] \(title): \(message)")
        case .medium:
            print("⚠️ [\(type.rawValue)] \(title): \(message)")
        case .low:
            print("ℹ️ [\(type.rawValue)] \(title): \(message)")
        }

        // Send notification for critical alerts
        if priority == .critical {
            sendCriticalAlertNotification(alert)
        }
    }

    /// Get all active alerts
    public func getActiveAlerts() -> [Alert] {
        return activeAlerts
    }

    /// Get unacknowledged alerts
    public func getUnacknowledgedAlerts() -> [Alert] {
        return activeAlerts.filter { !$0.acknowledged }
    }

    /// Acknowledge an alert
    public func acknowledgeAlert(id: String) {
        if let index = activeAlerts.firstIndex(where: { $0.id == id }) {
            activeAlerts[index].acknowledged = true
        }
    }

    /// Clear all acknowledged alerts
    public func clearAcknowledgedAlerts() {
        activeAlerts.removeAll { $0.acknowledged }
    }

    /// Clear all alerts
    public func clearAllAlerts() {
        activeAlerts.removeAll()
    }

    // MARK: - Private Methods

    private func sendCriticalAlertNotification(_ alert: Alert) {
        // In a real app, this would send a local notification
        // For now, we'll just log it
        print("📱 CRITICAL ALERT NOTIFICATION: \(alert.title)")
    }
}
