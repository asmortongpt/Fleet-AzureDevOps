//
//  UserRole.swift
//  Fleet Manager
//
//  Role-based access control for Driver and Fleet Manager roles
//  Defines permissions, capabilities, and UI restrictions per role
//

import Foundation

// MARK: - User Role Enum

enum UserRole: String, Codable, CaseIterable {
    case driver = "driver"
    case fleetManager = "fleet_manager"
    case admin = "admin"

    var displayName: String {
        switch self {
        case .driver:
            return "Driver"
        case .fleetManager:
            return "Fleet Manager"
        case .admin:
            return "Administrator"
        }
    }

    var description: String {
        switch self {
        case .driver:
            return "Access to assigned vehicles, trip tracking, and maintenance reporting"
        case .fleetManager:
            return "Full fleet management access including analytics and administration"
        case .admin:
            return "Complete system administration access"
        }
    }

    var iconName: String {
        switch self {
        case .driver:
            return "person.fill"
        case .fleetManager:
            return "person.badge.key.fill"
        case .admin:
            return "person.badge.shield.checkmark.fill"
        }
    }

    var color: String {
        switch self {
        case .driver:
            return "blue"
        case .fleetManager:
            return "purple"
        case .admin:
            return "red"
        }
    }
}

// MARK: - Role Permissions

struct RolePermissions {
    let role: UserRole

    // Vehicle Permissions
    var canViewAllVehicles: Bool {
        role == .fleetManager || role == .admin
    }

    var canViewAssignedVehiclesOnly: Bool {
        role == .driver
    }

    var canAddVehicle: Bool {
        role == .fleetManager || role == .admin
    }

    var canEditVehicle: Bool {
        role == .fleetManager || role == .admin
    }

    var canDeleteVehicle: Bool {
        role == .fleetManager || role == .admin
    }

    var canAssignVehicle: Bool {
        role == .fleetManager || role == .admin
    }

    // Trip Permissions
    var canViewAllTrips: Bool {
        role == .fleetManager || role == .admin
    }

    var canViewOwnTrips: Bool {
        true // All roles can view their own trips
    }

    var canStartTrip: Bool {
        true // All roles can start trips
    }

    var canEndTrip: Bool {
        true // All roles can end trips
    }

    var canEditTrip: Bool {
        role == .fleetManager || role == .admin
    }

    var canDeleteTrip: Bool {
        role == .fleetManager || role == .admin
    }

    // Maintenance Permissions
    var canViewAllMaintenance: Bool {
        role == .fleetManager || role == .admin
    }

    var canScheduleMaintenance: Bool {
        role == .fleetManager || role == .admin
    }

    var canReportMaintenance: Bool {
        true // All roles can report maintenance issues
    }

    var canEditMaintenance: Bool {
        role == .fleetManager || role == .admin
    }

    var canApproveMaintenance: Bool {
        role == .fleetManager || role == .admin
    }

    // Report Permissions
    var canViewReports: Bool {
        role == .fleetManager || role == .admin
    }

    var canGenerateReports: Bool {
        role == .fleetManager || role == .admin
    }

    var canExportReports: Bool {
        role == .fleetManager || role == .admin
    }

    // Analytics Permissions
    var canViewAnalytics: Bool {
        role == .fleetManager || role == .admin
    }

    var canViewDashboard: Bool {
        true // All roles have access to dashboard
    }

    var canViewDetailedAnalytics: Bool {
        role == .fleetManager || role == .admin
    }

    // Driver Permissions
    var canViewAllDrivers: Bool {
        role == .fleetManager || role == .admin
    }

    var canManageDrivers: Bool {
        role == .fleetManager || role == .admin
    }

    var canViewDriverPerformance: Bool {
        role == .fleetManager || role == .admin
    }

    // Settings Permissions
    var canManageUsers: Bool {
        role == .admin
    }

    var canManageSettings: Bool {
        role == .fleetManager || role == .admin
    }

    var canViewSettings: Bool {
        true // All roles can view basic settings
    }

    // Hardware Feature Permissions
    var canUseVINScanner: Bool {
        role == .fleetManager || role == .admin
    }

    var canUseOBD2Scanner: Bool {
        true // All roles can use OBD2 for diagnostics
    }

    var canAccessPhotoCapture: Bool {
        true // All roles can capture photos
    }

    var canUseTripTracking: Bool {
        true // All roles can track trips
    }
}

// MARK: - Role-Based Navigation

struct RoleNavigation {
    let role: UserRole

    var availableTabs: [TabItem] {
        switch role {
        case .driver:
            return [.dashboard, .trips, .more]
        case .fleetManager, .admin:
            return [.dashboard, .vehicles, .trips, .maintenance, .more]
        }
    }

    var dashboardWidgets: [DashboardWidget] {
        switch role {
        case .driver:
            return [
                .myVehicles,
                .recentTrips,
                .upcomingMaintenance,
                .myPerformance
            ]
        case .fleetManager, .admin:
            return [
                .fleetOverview,
                .activeVehicles,
                .recentTrips,
                .maintenanceAlerts,
                .fuelAnalytics,
                .driverPerformance
            ]
        }
    }

    var quickActions: [QuickAction] {
        switch role {
        case .driver:
            return [
                .startTrip,
                .reportIssue,
                .viewSchedule,
                .checkInspection
            ]
        case .fleetManager, .admin:
            return [
                .addVehicle,
                .startTrip,
                .scheduleMaintenance,
                .generateReport,
                .viewAnalytics
            ]
        }
    }
}

// MARK: - Dashboard Widget Types

enum DashboardWidget: String, CaseIterable {
    case fleetOverview = "Fleet Overview"
    case activeVehicles = "Active Vehicles"
    case myVehicles = "My Vehicles"
    case recentTrips = "Recent Trips"
    case upcomingMaintenance = "Upcoming Maintenance"
    case maintenanceAlerts = "Maintenance Alerts"
    case fuelAnalytics = "Fuel Analytics"
    case driverPerformance = "Driver Performance"
    case myPerformance = "My Performance"
    case alerts = "Alerts"
}

// MARK: - Quick Action Types

enum QuickAction: String, CaseIterable {
    case addVehicle = "Add Vehicle"
    case startTrip = "Start Trip"
    case scheduleMaintenance = "Schedule Maintenance"
    case generateReport = "Generate Report"
    case viewAnalytics = "View Analytics"
    case reportIssue = "Report Issue"
    case viewSchedule = "View Schedule"
    case checkInspection = "Pre-Trip Inspection"

    var iconName: String {
        switch self {
        case .addVehicle:
            return "car.fill"
        case .startTrip:
            return "location.circle.fill"
        case .scheduleMaintenance:
            return "wrench.and.screwdriver.fill"
        case .generateReport:
            return "doc.text.fill"
        case .viewAnalytics:
            return "chart.bar.fill"
        case .reportIssue:
            return "exclamationmark.triangle.fill"
        case .viewSchedule:
            return "calendar.fill"
        case .checkInspection:
            return "checkmark.circle.fill"
        }
    }
}

// MARK: - Role Extensions

extension AuthenticationService.User {
    var userRole: UserRole {
        UserRole(rawValue: role.lowercased()) ?? .driver
    }

    var permissions: RolePermissions {
        RolePermissions(role: userRole)
    }

    var navigation: RoleNavigation {
        RoleNavigation(role: userRole)
    }
}
