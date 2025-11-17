//
//  RoleSwitcherView.swift
//  Fleet Manager
//
//  Role switcher for testing and demonstration
//  Allows switching between Driver and Fleet Manager roles in development
//

import SwiftUI

// MARK: - Role Switcher View

struct RoleSwitcherView: View {
    @EnvironmentObject private var authManager: AuthenticationManager
    @EnvironmentObject private var navigationCoordinator: NavigationCoordinator
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            List {
                Section {
                    // Current Role Display
                    if let currentUser = authManager.currentUser {
                        HStack {
                            Image(systemName: currentUser.userRole.iconName)
                                .foregroundColor(roleColor(currentUser.userRole))
                                .font(.title2)

                            VStack(alignment: .leading, spacing: 4) {
                                Text(currentUser.name)
                                    .font(.headline)
                                Text(currentUser.userRole.displayName)
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)
                            }

                            Spacer()

                            Image(systemName: "checkmark.circle.fill")
                                .foregroundColor(.green)
                        }
                        .padding(.vertical, 8)
                    }
                } header: {
                    Text("Current Role")
                } footer: {
                    Text("Switch between roles to test different access levels and UI experiences.")
                }

                #if DEBUG
                Section {
                    // Driver Role
                    Button {
                        switchToRole(.driver)
                    } label: {
                        RoleOptionRow(
                            role: .driver,
                            isSelected: authManager.currentRole == .driver
                        )
                    }

                    // Fleet Manager Role
                    Button {
                        switchToRole(.fleetManager)
                    } label: {
                        RoleOptionRow(
                            role: .fleetManager,
                            isSelected: authManager.currentRole == .fleetManager
                        )
                    }

                    // Admin Role
                    Button {
                        switchToRole(.admin)
                    } label: {
                        RoleOptionRow(
                            role: .admin,
                            isSelected: authManager.currentRole == .admin
                        )
                    }
                } header: {
                    Text("Switch Role (Development)")
                } footer: {
                    Text("Role switching is only available in development builds.")
                }

                Section {
                    if let permissions = authManager.permissions {
                        PermissionsView(permissions: permissions)
                    }
                } header: {
                    Text("Current Permissions")
                }

                Section {
                    if let navigation = authManager.navigation {
                        NavigationOptionsView(navigation: navigation)
                    }
                } header: {
                    Text("Available Features")
                }
                #endif
            }
            .navigationTitle("Role & Permissions")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }

    private func switchToRole(_ role: UserRole) {
        switch role {
        case .driver:
            authManager.mockAuthenticationAsDriver()
        case .fleetManager:
            authManager.mockAuthenticationAsFleetManager()
        case .admin:
            authManager.mockAuthentication()
        }

        // Reset navigation
        navigationCoordinator.resetToHome()

        // Dismiss after a short delay
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
            dismiss()
        }
    }

    private func roleColor(_ role: UserRole) -> Color {
        switch role {
        case .driver:
            return .blue
        case .fleetManager:
            return .purple
        case .admin:
            return .red
        }
    }
}

// MARK: - Role Option Row

struct RoleOptionRow: View {
    let role: UserRole
    let isSelected: Bool

    var body: some View {
        HStack(spacing: 16) {
            Image(systemName: role.iconName)
                .font(.title2)
                .foregroundColor(roleColor)
                .frame(width: 32)

            VStack(alignment: .leading, spacing: 4) {
                Text(role.displayName)
                    .font(.headline)
                    .foregroundColor(.primary)

                Text(role.description)
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
            }

            Spacer()

            if isSelected {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundColor(.green)
            } else {
                Image(systemName: "chevron.right")
                    .foregroundColor(.secondary)
                    .font(.caption)
            }
        }
        .padding(.vertical, 4)
    }

    private var roleColor: Color {
        switch role {
        case .driver:
            return .blue
        case .fleetManager:
            return .purple
        case .admin:
            return .red
        }
    }
}

// MARK: - Permissions View

struct PermissionsView: View {
    let permissions: RolePermissions

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            PermissionRow(
                icon: "car.fill",
                title: "Vehicles",
                granted: permissions.canViewAllVehicles || permissions.canViewAssignedVehiclesOnly,
                details: permissions.canViewAllVehicles ? "View all vehicles" : "View assigned vehicles only"
            )

            PermissionRow(
                icon: "location.fill",
                title: "Trips",
                granted: permissions.canViewAllTrips || permissions.canViewOwnTrips,
                details: permissions.canViewAllTrips ? "View all trips" : "View own trips only"
            )

            PermissionRow(
                icon: "wrench.and.screwdriver.fill",
                title: "Maintenance",
                granted: permissions.canScheduleMaintenance,
                details: permissions.canScheduleMaintenance ? "Schedule & manage" : "Report issues only"
            )

            PermissionRow(
                icon: "chart.bar.fill",
                title: "Reports",
                granted: permissions.canGenerateReports,
                details: permissions.canGenerateReports ? "Generate & export" : "View only"
            )

            PermissionRow(
                icon: "person.2.fill",
                title: "Driver Management",
                granted: permissions.canManageDrivers,
                details: permissions.canManageDrivers ? "Full access" : "No access"
            )
        }
    }
}

// MARK: - Permission Row

struct PermissionRow: View {
    let icon: String
    let title: String
    let granted: Bool
    let details: String

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.body)
                .foregroundColor(granted ? .green : .secondary)
                .frame(width: 24)

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.subheadline)
                    .fontWeight(.medium)

                Text(details)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()

            Image(systemName: granted ? "checkmark.circle.fill" : "xmark.circle.fill")
                .foregroundColor(granted ? .green : .secondary)
                .font(.caption)
        }
    }
}

// MARK: - Navigation Options View

struct NavigationOptionsView: View {
    let navigation: RoleNavigation

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Available Tabs
            VStack(alignment: .leading, spacing: 8) {
                Text("Navigation Tabs")
                    .font(.subheadline)
                    .fontWeight(.semibold)

                FlowLayout(spacing: 8) {
                    ForEach(navigation.availableTabs, id: \.self) { tab in
                        TabBadge(tab: tab)
                    }
                }
            }

            Divider()

            // Quick Actions
            VStack(alignment: .leading, spacing: 8) {
                Text("Quick Actions")
                    .font(.subheadline)
                    .fontWeight(.semibold)

                FlowLayout(spacing: 8) {
                    ForEach(navigation.quickActions, id: \.self) { action in
                        ActionBadge(action: action)
                    }
                }
            }
        }
    }
}

// MARK: - Tab Badge

struct TabBadge: View {
    let tab: TabItem

    var body: some View {
        HStack(spacing: 6) {
            Image(systemName: tab.systemImage)
                .font(.caption2)
            Text(tab.title)
                .font(.caption)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 6)
        .background(Color.blue.opacity(0.1))
        .foregroundColor(.blue)
        .cornerRadius(8)
    }
}

// MARK: - Action Badge

struct ActionBadge: View {
    let action: QuickAction

    var body: some View {
        HStack(spacing: 6) {
            Image(systemName: action.iconName)
                .font(.caption2)
            Text(action.rawValue)
                .font(.caption)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 6)
        .background(Color.green.opacity(0.1))
        .foregroundColor(.green)
        .cornerRadius(8)
    }
}

// MARK: - Flow Layout

struct FlowLayout: Layout {
    var spacing: CGFloat = 8

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let result = FlowResult(
            in: proposal.replacingUnspecifiedDimensions().width,
            subviews: subviews,
            spacing: spacing
        )
        return result.size
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let result = FlowResult(
            in: bounds.width,
            subviews: subviews,
            spacing: spacing
        )
        for (index, subview) in subviews.enumerated() {
            subview.place(at: CGPoint(x: bounds.minX + result.frames[index].minX, y: bounds.minY + result.frames[index].minY), proposal: .unspecified)
        }
    }

    struct FlowResult {
        var size: CGSize = .zero
        var frames: [CGRect] = []

        init(in maxWidth: CGFloat, subviews: Subviews, spacing: CGFloat) {
            var currentX: CGFloat = 0
            var currentY: CGFloat = 0
            var lineHeight: CGFloat = 0

            for subview in subviews {
                let size = subview.sizeThatFits(.unspecified)

                if currentX + size.width > maxWidth && currentX > 0 {
                    currentX = 0
                    currentY += lineHeight + spacing
                    lineHeight = 0
                }

                frames.append(CGRect(x: currentX, y: currentY, width: size.width, height: size.height))
                lineHeight = max(lineHeight, size.height)
                currentX += size.width + spacing
            }

            self.size = CGSize(width: maxWidth, height: currentY + lineHeight)
        }
    }
}

// MARK: - Preview

struct RoleSwitcherView_Previews: PreviewProvider {
    static var previews: some View {
        RoleSwitcherView()
            .environmentObject(AuthenticationManager.shared)
            .environmentObject(NavigationCoordinator())
    }
}
