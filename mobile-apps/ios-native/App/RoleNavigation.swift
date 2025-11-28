import SwiftUI

// MARK: - User Role Enum
enum UserRole: String, Codable {
    case admin
    case manager
    case driver
    case viewer

    static var fleetManager: UserRole { return .manager }  // Alias for manager

    var displayName: String {
        switch self {
        case .admin: return "Administrator"
        case .manager: return "Fleet Manager"
        case .driver: return "Driver"
        case .viewer: return "Viewer"
        }
    }

    var iconName: String {
        switch self {
        case .admin: return "person.badge.key.fill"
        case .manager: return "person.3.fill"
        case .driver: return "car.fill"
        case .viewer: return "eye.fill"
        }
    }

    var color: String {
        switch self {
        case .admin: return "purple"
        case .manager: return "blue"
        case .driver: return "green"
        case .viewer: return "orange"
        }
    }

    var canManageVehicles: Bool {
        switch self {
        case .admin, .manager:
            return true
        case .driver, .viewer:
            return false
        }
    }

    var canManageDrivers: Bool {
        switch self {
        case .admin, .manager:
            return true
        case .driver, .viewer:
            return false
        }
    }

    var canViewReports: Bool {
        return true  // All roles can view some reports
    }

    var canManageMaintenance: Bool {
        switch self {
        case .admin, .manager:
            return true
        case .driver, .viewer:
            return false
        }
    }

    var canRecordTrips: Bool {
        switch self {
        case .admin, .manager, .driver:
            return true
        case .viewer:
            return false
        }
    }
}

// Note: TabItem enum is defined in NavigationCoordinator.swift

// MARK: - Quick Action
struct QuickAction: Identifiable, Hashable {
    let id: String
    let title: String
    let icon: String
    let color: Color
    let action: String

    init(id: String, title: String, icon: String, color: Color, action: String) {
        self.id = id
        self.title = title
        self.icon = icon
        self.color = color
        self.action = action
    }
}

// MARK: - Role Navigation
struct RoleNavigation {
    let role: UserRole

    var availableTabs: [TabItem] {
        switch role {
        case .admin:
            return [.dashboard, .vehicles, .trips, .maintenance, .more]
        case .manager:
            return [.dashboard, .vehicles, .trips, .maintenance, .more]
        case .driver:
            return [.vehicles, .trips, .more]
        case .viewer:
            return [.dashboard, .vehicles, .more]
        }
    }

    var quickActions: [QuickAction] {
        switch role {
        case .admin:
            return [
                QuickAction(id: "add-vehicle", title: "Add Vehicle", icon: "plus.circle.fill", color: .blue, action: "addVehicle"),
                QuickAction(id: "new-trip", title: "New Trip", icon: "location.fill", color: .green, action: "newTrip"),
                QuickAction(id: "maintenance", title: "Schedule", icon: "calendar", color: .orange, action: "scheduleMaintenance"),
                QuickAction(id: "reports", title: "Reports", icon: "doc.text.fill", color: .purple, action: "viewReports")
            ]
        case .manager:
            return [
                QuickAction(id: "add-vehicle", title: "Add Vehicle", icon: "plus.circle.fill", color: .blue, action: "addVehicle"),
                QuickAction(id: "new-trip", title: "New Trip", icon: "location.fill", color: .green, action: "newTrip"),
                QuickAction(id: "maintenance", title: "Schedule", icon: "calendar", color: .orange, action: "scheduleMaintenance")
            ]
        case .driver:
            return [
                QuickAction(id: "new-trip", title: "Start Trip", icon: "location.fill", color: .green, action: "newTrip"),
                QuickAction(id: "inspection", title: "Inspection", icon: "checkmark.circle.fill", color: .blue, action: "vehicleInspection")
            ]
        case .viewer:
            return [
                QuickAction(id: "reports", title: "Reports", icon: "doc.text.fill", color: .purple, action: "viewReports")
            ]
        }
    }
}

// MARK: - AuthenticationService.User Extension
extension AuthenticationService.User {
    var navigation: RoleNavigation {
        let userRole = UserRole(rawValue: self.role.lowercased()) ?? .viewer
        return RoleNavigation(role: userRole)
    }
}
