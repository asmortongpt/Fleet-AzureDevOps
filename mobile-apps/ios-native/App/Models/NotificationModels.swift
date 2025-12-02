//
//  NotificationModels.swift
//  Fleet Manager - iOS Native App
//
//  Notification models for in-app notification center
//  Supports various notification types, priorities, and actions
//

import Foundation
import SwiftUI

// MARK: - App Notification Model
public struct AppNotification: Codable, Identifiable, Equatable {
    public let id: String
    public let tenantId: String
    public var type: NotificationType
    public var priority: NotificationPriority
    public var title: String
    public var message: String
    public var timestamp: Date
    public var isRead: Bool
    public var isFlagged: Bool
    public var category: NotificationCategory
    public var metadata: NotificationMetadata?
    public var actions: [NotificationAction]?
    public var imageURL: String?
    public var deepLink: String?
    public var expiresAt: Date?

    enum CodingKeys: String, CodingKey {
        case id
        case tenantId = "tenant_id"
        case type
        case priority
        case title
        case message
        case timestamp
        case isRead = "is_read"
        case isFlagged = "is_flagged"
        case category
        case metadata
        case actions
        case imageURL = "image_url"
        case deepLink = "deep_link"
        case expiresAt = "expires_at"
    }

    // Computed properties
    public var isExpired: Bool {
        guard let expiresAt = expiresAt else { return false }
        return expiresAt < Date()
    }

    public var timeAgo: String {
        let interval = Date().timeIntervalSince(timestamp)
        let minutes = Int(interval / 60)
        let hours = Int(interval / 3600)
        let days = Int(interval / 86400)

        if minutes < 1 {
            return "Just now"
        } else if minutes < 60 {
            return "\(minutes)m ago"
        } else if hours < 24 {
            return "\(hours)h ago"
        } else if days < 7 {
            return "\(days)d ago"
        } else {
            return timestamp.formatted(date: .abbreviated, time: .omitted)
        }
    }

    public var formattedTimestamp: String {
        timestamp.formatted(date: .abbreviated, time: .shortened)
    }
}

// MARK: - Notification Type
public enum NotificationType: String, Codable, CaseIterable {
    case maintenance
    case alert
    case warning
    case message
    case system
    case trip
    case inspection
    case driver
    case vehicle
    case fuel
    case compliance
    case reminder

    public var displayName: String {
        rawValue.capitalized
    }

    public var icon: String {
        switch self {
        case .maintenance:
            return "wrench.and.screwdriver.fill"
        case .alert:
            return "exclamationmark.triangle.fill"
        case .warning:
            return "exclamationmark.circle.fill"
        case .message:
            return "message.fill"
        case .system:
            return "gear.badge"
        case .trip:
            return "location.fill"
        case .inspection:
            return "checkmark.shield.fill"
        case .driver:
            return "person.fill"
        case .vehicle:
            return "car.fill"
        case .fuel:
            return "fuelpump.fill"
        case .compliance:
            return "checkmark.seal.fill"
        case .reminder:
            return "bell.badge.fill"
        }
    }

    public var color: Color {
        switch self {
        case .maintenance:
            return .orange
        case .alert:
            return .red
        case .warning:
            return .yellow
        case .message:
            return .blue
        case .system:
            return .gray
        case .trip:
            return .green
        case .inspection:
            return .purple
        case .driver:
            return .teal
        case .vehicle:
            return .blue
        case .fuel:
            return .orange
        case .compliance:
            return .green
        case .reminder:
            return .blue
        }
    }
}

// MARK: - Notification Priority
public enum NotificationPriority: String, Codable, CaseIterable {
    case low
    case normal
    case high
    case urgent

    public var displayName: String {
        rawValue.capitalized
    }

    public var color: Color {
        switch self {
        case .low:
            return .gray
        case .normal:
            return .blue
        case .high:
            return .orange
        case .urgent:
            return .red
        }
    }

    public var icon: String {
        switch self {
        case .low:
            return "arrow.down.circle"
        case .normal:
            return "minus.circle"
        case .high:
            return "arrow.up.circle"
        case .urgent:
            return "exclamationmark.circle.fill"
        }
    }

    public var badge: String? {
        switch self {
        case .urgent, .high:
            return "!"
        default:
            return nil
        }
    }
}

// MARK: - Notification Category
public enum NotificationCategory: String, Codable, CaseIterable {
    case general
    case safety
    case operations
    case compliance
    case finance
    case maintenance

    public var displayName: String {
        rawValue.capitalized
    }

    public var icon: String {
        switch self {
        case .general:
            return "app.badge"
        case .safety:
            return "shield.fill"
        case .operations:
            return "gearshape.2.fill"
        case .compliance:
            return "checkmark.seal.fill"
        case .finance:
            return "dollarsign.circle.fill"
        case .maintenance:
            return "wrench.and.screwdriver.fill"
        }
    }

    public var color: Color {
        switch self {
        case .general:
            return .blue
        case .safety:
            return .red
        case .operations:
            return .green
        case .compliance:
            return .purple
        case .finance:
            return .yellow
        case .maintenance:
            return .orange
        }
    }
}

// MARK: - Notification Metadata
public struct NotificationMetadata: Codable, Equatable {
    public var vehicleId: String?
    public var driverId: String?
    public var tripId: String?
    public var maintenanceId: String?
    public var inspectionId: String?
    public var additionalData: [String: String]?

    enum CodingKeys: String, CodingKey {
        case vehicleId = "vehicle_id"
        case driverId = "driver_id"
        case tripId = "trip_id"
        case maintenanceId = "maintenance_id"
        case inspectionId = "inspection_id"
        case additionalData = "additional_data"
    }
}

// MARK: - Notification Action
public struct NotificationAction: Codable, Identifiable, Equatable {
    public let id: String
    public var label: String
    public var actionType: ActionType
    public var destructive: Bool
    public var deepLink: String?

    enum CodingKeys: String, CodingKey {
        case id
        case label
        case actionType = "action_type"
        case destructive
        case deepLink = "deep_link"
    }
}

// MARK: - Action Type
public enum ActionType: String, Codable {
    case view
    case dismiss
    case acknowledge
    case schedule
    case contact
    case navigate
    case share

    public var icon: String {
        switch self {
        case .view:
            return "eye.fill"
        case .dismiss:
            return "xmark"
        case .acknowledge:
            return "checkmark"
        case .schedule:
            return "calendar.badge.plus"
        case .contact:
            return "phone.fill"
        case .navigate:
            return "arrow.right"
        case .share:
            return "square.and.arrow.up"
        }
    }
}

// MARK: - Notification Preferences
public struct NotificationPreferences: Codable, Equatable {
    public var enabledCategories: [NotificationCategory]
    public var mutedTypes: [NotificationType]
    public var minimumPriority: NotificationPriority
    public var showBadges: Bool
    public var playSound: Bool
    public var showPreviews: Bool
    public var groupByCategory: Bool

    enum CodingKeys: String, CodingKey {
        case enabledCategories = "enabled_categories"
        case mutedTypes = "muted_types"
        case minimumPriority = "minimum_priority"
        case showBadges = "show_badges"
        case playSound = "play_sound"
        case showPreviews = "show_previews"
        case groupByCategory = "group_by_category"
    }

    public static var `default`: NotificationPreferences {
        NotificationPreferences(
            enabledCategories: NotificationCategory.allCases,
            mutedTypes: [],
            minimumPriority: .low,
            showBadges: true,
            playSound: true,
            showPreviews: true,
            groupByCategory: true
        )
    }
}

// MARK: - Notification Filter
public enum NotificationFilter: String, CaseIterable {
    case all = "All"
    case unread = "Unread"
    case flagged = "Flagged"
    case urgent = "Urgent"
    case today = "Today"
    case thisWeek = "This Week"

    public var icon: String {
        switch self {
        case .all:
            return "tray.full.fill"
        case .unread:
            return "envelope.badge.fill"
        case .flagged:
            return "flag.fill"
        case .urgent:
            return "exclamationmark.triangle.fill"
        case .today:
            return "calendar"
        case .thisWeek:
            return "calendar.badge.clock"
        }
    }

    public func applies(to notification: AppNotification) -> Bool {
        switch self {
        case .all:
            return true
        case .unread:
            return !notification.isRead
        case .flagged:
            return notification.isFlagged
        case .urgent:
            return notification.priority == .urgent
        case .today:
            return Calendar.current.isDateInToday(notification.timestamp)
        case .thisWeek:
            return Calendar.current.isDate(notification.timestamp, equalTo: Date(), toGranularity: .weekOfYear)
        }
    }
}

// MARK: - Notification Group
public struct NotificationGroup: Identifiable {
    public let id: String
    public let title: String
    public let notifications: [AppNotification]
    public var isExpanded: Bool = true

    public var unreadCount: Int {
        notifications.filter { !$0.isRead }.count
    }

    public var hasUnread: Bool {
        unreadCount > 0
    }
}

// MARK: - API Response Models
public struct NotificationsResponse: Codable {
    public let notifications: [AppNotification]
    public let total: Int
    public let unreadCount: Int
    public let page: Int?
    public let limit: Int?

    enum CodingKeys: String, CodingKey {
        case notifications
        case total
        case unreadCount = "unread_count"
        case page
        case limit
    }
}

public struct NotificationResponse: Codable {
    public let notification: AppNotification
}

// MARK: - Sample Data for Previews
extension AppNotification {
    public static var sample: AppNotification {
        AppNotification(
            id: "notif-001",
            tenantId: "tenant-001",
            type: .maintenance,
            priority: .high,
            title: "Maintenance Due",
            message: "Vehicle V-123 requires scheduled maintenance within 500 miles",
            timestamp: Date(),
            isRead: false,
            isFlagged: false,
            category: .maintenance,
            metadata: NotificationMetadata(
                vehicleId: "vehicle-001",
                driverId: nil,
                tripId: nil,
                maintenanceId: "maint-001",
                inspectionId: nil,
                additionalData: ["mileage": "45000"]
            ),
            actions: [
                NotificationAction(
                    id: "action-001",
                    label: "Schedule Service",
                    actionType: .schedule,
                    destructive: false,
                    deepLink: "/maintenance/schedule/maint-001"
                ),
                NotificationAction(
                    id: "action-002",
                    label: "View Details",
                    actionType: .view,
                    destructive: false,
                    deepLink: "/vehicles/vehicle-001"
                )
            ],
            imageURL: nil,
            deepLink: "/maintenance/maint-001",
            expiresAt: Calendar.current.date(byAdding: .day, value: 7, to: Date())
        )
    }

    public static var sampleAlert: AppNotification {
        AppNotification(
            id: "notif-002",
            tenantId: "tenant-001",
            type: .alert,
            priority: .urgent,
            title: "Low Fuel Alert",
            message: "Vehicle V-456 fuel level is critically low at 8%",
            timestamp: Calendar.current.date(byAdding: .minute, value: -5, to: Date())!,
            isRead: false,
            isFlagged: true,
            category: .safety,
            metadata: NotificationMetadata(
                vehicleId: "vehicle-002",
                driverId: "driver-001",
                tripId: "trip-123",
                maintenanceId: nil,
                inspectionId: nil,
                additionalData: ["fuelLevel": "8", "location": "Downtown"]
            ),
            actions: [
                NotificationAction(
                    id: "action-003",
                    label: "Locate Vehicle",
                    actionType: .navigate,
                    destructive: false,
                    deepLink: "/map/vehicle-002"
                ),
                NotificationAction(
                    id: "action-004",
                    label: "Contact Driver",
                    actionType: .contact,
                    destructive: false,
                    deepLink: "/drivers/driver-001"
                )
            ],
            imageURL: nil,
            deepLink: "/vehicles/vehicle-002",
            expiresAt: Calendar.current.date(byAdding: .hour, value: 2, to: Date())
        )
    }

    public static var sampleMessage: AppNotification {
        AppNotification(
            id: "notif-003",
            tenantId: "tenant-001",
            type: .message,
            priority: .normal,
            title: "Trip Completed",
            message: "Driver John Smith has completed trip #789 successfully",
            timestamp: Calendar.current.date(byAdding: .hour, value: -2, to: Date())!,
            isRead: true,
            isFlagged: false,
            category: .operations,
            metadata: NotificationMetadata(
                vehicleId: "vehicle-001",
                driverId: "driver-001",
                tripId: "trip-789",
                maintenanceId: nil,
                inspectionId: nil,
                additionalData: ["duration": "3.5 hours", "distance": "127 miles"]
            ),
            actions: [
                NotificationAction(
                    id: "action-005",
                    label: "View Trip",
                    actionType: .view,
                    destructive: false,
                    deepLink: "/trips/trip-789"
                )
            ],
            imageURL: nil,
            deepLink: "/trips/trip-789",
            expiresAt: nil
        )
    }

    public static var samples: [AppNotification] {
        [sample, sampleAlert, sampleMessage]
    }
}

extension NotificationGroup {
    public static var sample: NotificationGroup {
        NotificationGroup(
            id: "group-today",
            title: "Today",
            notifications: [.sample, .sampleAlert],
            isExpanded: true
        )
    }
}
