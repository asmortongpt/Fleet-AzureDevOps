/**
 * Role Manager
 * Centralized role-based access control (RBAC) system
 *
 * Manages three primary roles:
 * - User: Standard driver/operator (default)
 * - FleetAdmin: Fleet manager with administrative privileges
 * - Maintenance: Maintenance personnel with specialized access
 *
 * Features:
 * - Role assignment and persistence
 * - Granular permission checking
 * - Feature visibility control
 * - Role hierarchy (admin inherits user permissions)
 */

import Foundation
import Combine

@MainActor
class RoleManager: ObservableObject {

    // MARK: - Singleton

    static let shared = RoleManager()

    // MARK: - Published Properties

    @Published var currentRole: UserRole = .user
    @Published var availableRoles: [UserRole] = []

    // MARK: - Types

    enum UserRole: String, Codable, CaseIterable {
        case driver = "Driver"
        case fleetManager = "FleetManager"
        case maintenanceManager = "MaintenanceManager"
        case inspector = "Inspector"
        case admin = "Admin"
        case finance = "Finance"
        case safety = "Safety"
        case auditor = "Auditor"
        case vendor = "Vendor"

        var displayName: String {
            switch self {
            case .driver: return "Driver"
            case .fleetManager: return "Fleet Manager"
            case .maintenanceManager: return "Maintenance Manager"
            case .inspector: return "Inspector"
            case .admin: return "Administrator"
            case .finance: return "Finance Officer"
            case .safety: return "Safety Officer"
            case .auditor: return "Auditor"
            case .vendor: return "Vendor"
            }
        }

        var description: String {
            switch self {
            case .driver:
                return "Vehicle operator with self-service access to own records, inspections, and fuel logging"
            case .fleetManager:
                return "Fleet manager with operational oversight and approval authority"
            case .maintenanceManager:
                return "Maintenance operations manager with work order and inventory management"
            case .inspector:
                return "Vehicle inspector conducting field inspections"
            case .admin:
                return "Full system administrator with unrestricted access"
            case .finance:
                return "Financial officer with access to cost and valuation data"
            case .safety:
                return "Safety officer managing incidents and compliance"
            case .auditor:
                return "Read-only auditor for compliance review"
            case .vendor:
                return "External vendor with limited work order access"
            }
        }

        var icon: String {
            switch self {
            case .driver: return "person.fill"
            case .fleetManager: return "person.badge.key.fill"
            case .maintenanceManager: return "wrench.and.screwdriver.fill"
            case .inspector: return "checkmark.seal.fill"
            case .admin: return "crown.fill"
            case .finance: return "dollarsign.circle.fill"
            case .safety: return "shield.fill"
            case .auditor: return "doc.text.magnifyingglass"
            case .vendor: return "building.2.fill"
            }
        }

        var priority: Int {
            switch self {
            case .driver: return 1
            case .vendor: return 2
            case .inspector: return 3
            case .maintenanceManager: return 4
            case .finance: return 5
            case .safety: return 6
            case .fleetManager: return 7
            case .auditor: return 8
            case .admin: return 9
            }
        }

        /// Check if this role is mobile-appropriate (shown in mobile app)
        var isMobileRole: Bool {
            switch self {
            case .driver, .fleetManager, .maintenanceManager, .inspector:
                return true
            case .admin, .finance, .safety, .auditor, .vendor:
                return false // Desktop-only or limited mobile use
            }
        }
    }

    enum Permission: String, CaseIterable {
        // Vehicle Permissions (matches backend: vehicle:verb:scope)
        case vehicleViewOwn = "vehicle:view:own"
        case vehicleViewTeam = "vehicle:view:team"
        case vehicleViewFleet = "vehicle:view:fleet"
        case vehicleViewGlobal = "vehicle:view:global"
        case vehicleCreate = "vehicle:create:global"
        case vehicleUpdateTeam = "vehicle:update:team"
        case vehicleUpdateGlobal = "vehicle:update:global"
        case vehicleDelete = "vehicle:delete:global"
        case vehicleAssignTeam = "vehicle:assign:team"
        case vehicleAssignFleet = "vehicle:assign:fleet"

        // Driver Permissions (matches backend: driver:verb:scope)
        case driverViewOwn = "driver:view:own"
        case driverViewTeam = "driver:view:team"
        case driverViewFleet = "driver:view:fleet"
        case driverViewGlobal = "driver:view:global"
        case driverCreate = "driver:create:global"
        case driverUpdate = "driver:update:global"
        case driverCertify = "driver:certify:global"

        // Work Order Permissions (matches backend: work_order:verb:scope)
        case workOrderViewOwn = "work_order:view:own"
        case workOrderViewTeam = "work_order:view:team"
        case workOrderViewFleet = "work_order:view:fleet"
        case workOrderCreateTeam = "work_order:create:team"
        case workOrderCreateFleet = "work_order:create:fleet"
        case workOrderUpdateOwn = "work_order:update:own"
        case workOrderCompleteOwn = "work_order:complete:own"
        case workOrderApprove = "work_order:approve:fleet"
        case workOrderDelete = "work_order:delete:fleet"

        // Route Permissions (matches backend: route:verb:scope)
        case routeViewOwn = "route:view:own"
        case routeViewFleet = "route:view:fleet"
        case routeCreate = "route:create:fleet"
        case routeUpdate = "route:update:fleet"

        // Purchase Order Permissions (matches backend: purchase_order:verb:scope)
        case purchaseOrderView = "purchase_order:view:global"
        case purchaseOrderCreate = "purchase_order:create:global"
        case purchaseOrderApprove = "purchase_order:approve:fleet"

        // Safety Permissions (matches backend: safety_incident:verb:scope)
        case safetyIncidentView = "safety_incident:view:global"
        case safetyIncidentCreate = "safety_incident:create:global"
        case safetyIncidentApprove = "safety_incident:approve:global"

        // Video Event Permissions (matches backend: video_event:verb:scope)
        case videoEventView = "video_event:view:global"

        // Telemetry Permissions (matches backend: telemetry:verb:scope)
        case telemetryView = "telemetry:view:fleet"

        // Inspection Permissions (matches backend: inspection:verb:scope)
        case inspectionCreateOwn = "inspection:create:own"
        case inspectionViewFleet = "inspection:view:fleet"

        // Fuel Transaction Permissions (matches backend: fuel_transaction:verb:scope)
        case fuelTransactionCreateOwn = "fuel_transaction:create:own"
        case fuelTransactionViewFleet = "fuel_transaction:view:fleet"

        // User/Role Management (matches backend: user:verb:scope, role:verb:scope)
        case userManage = "user:manage:global"
        case roleManage = "role:manage:global"

        // Audit Log Permissions (matches backend: audit_log:verb:scope)
        case auditLogView = "audit_log:view:global"
        case auditLogExport = "audit_log:export:global"

        // Report Permissions (matches backend: report:verb:scope)
        case reportView = "report:view:global"
        case reportGenerate = "report:generate:global"
        case reportExport = "report:export:global"

        var displayName: String {
            let parts = rawValue.split(separator: ":")
            guard parts.count >= 2 else { return rawValue }
            let resource = String(parts[0]).replacingOccurrences(of: "_", with: " ").capitalized
            let verb = String(parts[1]).capitalized
            let scope = parts.count > 2 ? String(parts[2]).capitalized : ""
            return "\(verb) \(resource) (\(scope))"
        }
    }

    // MARK: - Private Properties

    private let userDefaultsKey = "user_role"
    private let availableRolesKey = "available_user_roles"

    // Permission matrix (matches backend role_permissions assignments from migrations)
    private let rolePermissions: [UserRole: Set<Permission>] = [
        // Driver - Basic self-service permissions (matches backend Driver role)
        .driver: [
            .vehicleViewOwn,
            .driverViewOwn,
            .routeViewOwn,
            .inspectionCreateOwn,
            .fuelTransactionCreateOwn
        ],

        // FleetManager - Operational oversight (matches backend FleetManager role)
        .fleetManager: [
            // Vehicle management
            .vehicleViewFleet,
            .vehicleViewGlobal,
            .vehicleCreate,
            .vehicleUpdateGlobal,
            .vehicleDelete,
            .vehicleAssignFleet,

            // Driver management
            .driverViewFleet,
            .driverViewGlobal,
            .driverCreate,
            .driverUpdate,

            // Work orders
            .workOrderViewFleet,
            .workOrderCreateFleet,
            .workOrderApprove,

            // Routes
            .routeViewFleet,
            .routeCreate,
            .routeUpdate,

            // Telemetry & monitoring
            .telemetryView,
            .videoEventView,

            // Inspections & fuel
            .inspectionViewFleet,
            .fuelTransactionViewFleet,

            // Reports
            .reportView,
            .reportGenerate,
            .reportExport
        ],

        // MaintenanceManager - Work order & inventory management
        .maintenanceManager: [
            .vehicleViewFleet,
            .workOrderViewOwn,
            .workOrderViewFleet,
            .workOrderCompleteOwn,
            .workOrderCreateFleet,
            .inspectionCreateOwn,
            .inspectionViewFleet
        ],

        // Inspector - Field inspections
        .inspector: [
            .vehicleViewFleet,
            .inspectionCreateOwn,
            .inspectionViewFleet,
            .workOrderViewFleet
        ],

        // Admin - Full system access (matches backend Admin role)
        .admin: [
            // All vehicle permissions
            .vehicleViewOwn,
            .vehicleViewTeam,
            .vehicleViewFleet,
            .vehicleViewGlobal,
            .vehicleCreate,
            .vehicleUpdateTeam,
            .vehicleUpdateGlobal,
            .vehicleDelete,
            .vehicleAssignTeam,
            .vehicleAssignFleet,

            // All driver permissions
            .driverViewOwn,
            .driverViewTeam,
            .driverViewFleet,
            .driverViewGlobal,
            .driverCreate,
            .driverUpdate,
            .driverCertify,

            // All work order permissions
            .workOrderViewOwn,
            .workOrderViewTeam,
            .workOrderViewFleet,
            .workOrderCreateTeam,
            .workOrderCreateFleet,
            .workOrderUpdateOwn,
            .workOrderCompleteOwn,
            .workOrderApprove,
            .workOrderDelete,

            // All route permissions
            .routeViewOwn,
            .routeViewFleet,
            .routeCreate,
            .routeUpdate,

            // User & role management
            .userManage,
            .roleManage,

            // Telemetry & monitoring
            .telemetryView,
            .videoEventView,

            // Inspections & fuel
            .inspectionCreateOwn,
            .inspectionViewFleet,
            .fuelTransactionCreateOwn,
            .fuelTransactionViewFleet,

            // Reports & audit
            .reportView,
            .reportGenerate,
            .reportExport,
            .auditLogView,
            .auditLogExport
        ],

        // Finance - Purchase orders and cost data (limited mobile use)
        .finance: [
            .purchaseOrderView,
            .purchaseOrderCreate,
            .fuelTransactionViewFleet,
            .reportView
        ],

        // Safety - Safety incidents and compliance (limited mobile use)
        .safety: [
            .vehicleViewGlobal,
            .driverViewGlobal,
            .driverCertify,
            .safetyIncidentView,
            .safetyIncidentCreate,
            .safetyIncidentApprove,
            .videoEventView,
            .inspectionViewFleet,
            .reportView,
            .reportGenerate
        ],

        // Auditor - Read-only access (limited mobile use)
        .auditor: [
            .vehicleViewGlobal,
            .driverViewGlobal,
            .workOrderViewFleet,
            .routeViewFleet,
            .telemetryView,
            .inspectionViewFleet,
            .fuelTransactionViewFleet,
            .reportView,
            .auditLogView,
            .auditLogExport
        ],

        // Vendor - Limited work order access
        .vendor: [
            .workOrderViewOwn,
            .workOrderCompleteOwn
        ]
    ]

    // MARK: - Initialization

    private init() {
        loadRole()
        loadAvailableRoles()
    }

    // MARK: - Public API

    /// Check if current user has a specific permission
    func hasPermission(_ permission: Permission) -> Bool {
        return rolePermissions[currentRole]?.contains(permission) ?? false
    }

    /// Check if current user has ANY of the specified permissions
    func hasAnyPermission(_ permissions: [Permission]) -> Bool {
        guard let userPermissions = rolePermissions[currentRole] else { return false }
        return permissions.contains(where: { userPermissions.contains($0) })
    }

    /// Check if current user has ALL of the specified permissions
    func hasAllPermissions(_ permissions: [Permission]) -> Bool {
        guard let userPermissions = rolePermissions[currentRole] else { return false }
        return permissions.allSatisfy { userPermissions.contains($0) }
    }

    /// Get all permissions for current role
    func getCurrentPermissions() -> Set<Permission> {
        return rolePermissions[currentRole] ?? []
    }

    /// Check if user has a specific role
    func hasRole(_ role: UserRole) -> Bool {
        return currentRole == role
    }

    /// Check if user has role with equal or higher priority
    func hasRoleOrHigher(_ role: UserRole) -> Bool {
        return currentRole.priority >= role.priority
    }

    /// Set current user role
    func setRole(_ role: UserRole) {
        currentRole = role
        saveRole()
        print("✅ Role set to: \(role.displayName)")
        print("   Permissions: \(getCurrentPermissions().count) active")
    }

    /// Add role to available roles (multi-role support)
    func addAvailableRole(_ role: UserRole) {
        if !availableRoles.contains(role) {
            availableRoles.append(role)
            availableRoles.sort { $0.priority > $1.priority }
            saveAvailableRoles()
        }
    }

    /// Remove role from available roles
    func removeAvailableRole(_ role: UserRole) {
        availableRoles.removeAll { $0 == role }
        saveAvailableRoles()

        // If removing current role, switch to highest available
        if currentRole == role {
            if let highestRole = availableRoles.first {
                setRole(highestRole)
            } else {
                setRole(.user) // Default to user
            }
        }
    }

    /// Switch to different role (if available)
    func switchRole(to role: UserRole) -> Bool {
        guard availableRoles.contains(role) || role == .driver else {
            print("⚠️ Role \(role.rawValue) not available for this user")
            return false
        }
        setRole(role)
        return true
    }

    /// Reset to default driver role
    func resetToDefaultRole() {
        currentRole = .driver
        availableRoles = [.driver]
        saveRole()
        saveAvailableRoles()
    }

    /// Get role badge (for UI display)
    func getRoleBadge() -> RoleBadge {
        return RoleBadge(
            role: currentRole,
            displayName: currentRole.displayName,
            icon: currentRole.icon,
            color: getRoleColor()
        )
    }

    private func getRoleColor() -> String {
        switch currentRole {
        case .driver: return "blue"
        case .fleetManager: return "purple"
        case .maintenanceManager: return "orange"
        case .inspector: return "green"
        case .admin: return "red"
        case .finance: return "yellow"
        case .safety: return "indigo"
        case .auditor: return "gray"
        case .vendor: return "brown"
        }
    }

    // MARK: - Feature Visibility

    func shouldShowFeature(_ feature: AppFeature) -> Bool {
        switch feature {
        // Mobile Features (Driver-level)
        case .captureReceipts: return hasPermission(.fuelTransactionCreateOwn)
        case .reportDamage: return hasPermission(.vehicleViewOwn)
        case .reserveVehicles: return hasPermission(.vehicleViewOwn)
        case .navigation: return hasPermission(.routeViewOwn)
        case .vehicleIdentification: return hasPermission(.vehicleViewOwn)
        case .vehicleAssignment: return hasPermission(.vehicleViewOwn)
        case .viewOwnTrips: return hasPermission(.routeViewOwn)

        // Fleet Manager Features
        case .fleetManagement: return hasPermission(.vehicleViewFleet)
        case .analytics: return hasPermission(.reportView)
        case .userManagement: return hasPermission(.userManage)
        case .scheduling: return hasPermission(.routeCreate)
        case .reports: return hasPermission(.reportView)
        case .settings: return hasPermission(.userManage)

        // Maintenance Features
        case .maintenanceSchedule: return hasPermission(.workOrderViewFleet)
        case .workOrders: return hasPermission(.workOrderViewOwn)
        case .vehicleDiagnostics: return hasPermission(.vehicleViewFleet)
        case .inspections: return hasPermission(.inspectionCreateOwn)
        }
    }

    enum AppFeature {
        // Mobile Features (Driver-level)
        case captureReceipts
        case reportDamage
        case reserveVehicles
        case navigation
        case vehicleIdentification
        case vehicleAssignment
        case viewOwnTrips

        // Fleet Manager Features
        case fleetManagement
        case analytics
        case userManagement
        case scheduling
        case reports
        case settings

        // Maintenance Features
        case maintenanceSchedule
        case workOrders
        case vehicleDiagnostics
        case inspections
    }

    // MARK: - Persistence

    private func loadRole() {
        if let data = UserDefaults.standard.data(forKey: userDefaultsKey),
           let role = try? JSONDecoder().decode(UserRole.self, from: data) {
            currentRole = role
        } else {
            currentRole = .driver // Default to driver role
        }
    }

    private func saveRole() {
        if let data = try? JSONEncoder().encode(currentRole) {
            UserDefaults.standard.set(data, forKey: userDefaultsKey)
        }
    }

    private func loadAvailableRoles() {
        if let data = UserDefaults.standard.data(forKey: availableRolesKey),
           let roles = try? JSONDecoder().decode([UserRole].self, from: data) {
            availableRoles = roles
        } else {
            availableRoles = [.driver] // Default to driver role
        }
    }

    private func saveAvailableRoles() {
        if let data = try? JSONEncoder().encode(availableRoles) {
            UserDefaults.standard.set(data, forKey: availableRolesKey)
        }
    }

    // MARK: - Backend Sync

    /// Sync role from backend API
    func syncRoleFromBackend() async throws {
        // TODO: Call backend API to get user's assigned roles
        // For now, using mock data

        // Example API call:
        // let response = try await APIClient.shared.get("/api/users/me/roles")
        // let roles = response.roles.map { UserRole(rawValue: $0) }

        // Mock: Assign role based on user email or ID
        print("🔄 Syncing role from backend...")

        // Simulate API delay
        try? await Task.sleep(nanoseconds: 500_000_000)

        // This would come from backend
        // For now, keep current role
        print("✅ Role synced: \(currentRole.displayName)")
    }

    // MARK: - Helper Types

    struct RoleBadge {
        let role: UserRole
        let displayName: String
        let icon: String
        let color: String
    }
}

// MARK: - View Extension for Easy Access

extension RoleManager {
    /// Quick permission check for SwiftUI views
    static func can(_ permission: Permission) -> Bool {
        return shared.hasPermission(permission)
    }

    /// Quick role check for SwiftUI views
    static func isRole(_ role: UserRole) -> Bool {
        return shared.hasRole(role)
    }

    /// Quick feature visibility check for SwiftUI views
    static func show(_ feature: AppFeature) -> Bool {
        return shared.shouldShowFeature(feature)
    }
}
