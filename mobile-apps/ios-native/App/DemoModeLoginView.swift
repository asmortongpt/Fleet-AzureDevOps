//
//  DemoModeLoginView.swift
//  Fleet Manager - Demo Mode with Role Switching
//
//  Instant demo access with role selection for testing
//

import SwiftUI

struct DemoModeLoginView: View {
    @StateObject private var authManager = AuthenticationManager.shared
    @State private var selectedRole: DemoRole = .admin
    @State private var isLoggingIn = false

    enum DemoRole: String, CaseIterable, Identifiable {
        case admin = "Admin"
        case manager = "Manager"
        case driver = "Driver"
        case viewer = "Viewer"

        var id: String { rawValue }

        var icon: String {
            switch self {
            case .admin: return "person.badge.key.fill"
            case .manager: return "person.3.fill"
            case .driver: return "car.fill"
            case .viewer: return "eye.fill"
            }
        }

        var color: Color {
            switch self {
            case .admin: return .purple
            case .manager: return .blue
            case .driver: return .green
            case .viewer: return .orange
            }
        }

        var description: String {
            switch self {
            case .admin: return "Full system access"
            case .manager: return "Fleet management"
            case .driver: return "Vehicle operations"
            case .viewer: return "Read-only access"
            }
        }
    }

    var body: some View {
        ZStack {
            // Background gradient
            LinearGradient(
                gradient: Gradient(colors: [
                    Color(red: 0.1, green: 0.2, blue: 0.4),
                    Color(red: 0.2, green: 0.4, blue: 0.6)
                ]),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()

            ScrollView {
                VStack(spacing: 32) {
                    Spacer()
                        .frame(height: 40)

                    // Header
                    VStack(spacing: 16) {
                        Image(systemName: "sparkles")
                            .font(.system(size: 60))
                            .foregroundColor(.yellow)
                            .symbolEffect(.bounce, value: isLoggingIn)

                        Text("Demo Mode")
                            .font(.system(size: 38, weight: .bold, design: .rounded))
                            .foregroundColor(.white)

                        Text("Select a role to explore")
                            .font(.system(size: 17, weight: .medium))
                            .foregroundColor(.white.opacity(0.9))
                    }

                    // Role selection card
                    VStack(spacing: 24) {
                        Text("Choose Your Role")
                            .font(.system(size: 22, weight: .bold))
                            .foregroundColor(.primary)
                            .frame(maxWidth: .infinity, alignment: .leading)

                        // Role cards
                        VStack(spacing: 16) {
                            ForEach(DemoRole.allCases) { role in
                                RoleCard(
                                    role: role,
                                    isSelected: selectedRole == role
                                ) {
                                    withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                                        selectedRole = role
                                    }
                                }
                            }
                        }

                        // Demo login button
                        Button(action: {
                            Task {
                                await performDemoLogin()
                            }
                        }) {
                            HStack(spacing: 12) {
                                if isLoggingIn {
                                    ProgressView()
                                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                } else {
                                    Image(systemName: "play.fill")
                                        .font(.system(size: 18))
                                }

                                Text(isLoggingIn ? "Logging in..." : "Start Demo")
                                    .font(.system(size: 18, weight: .semibold))
                            }
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 18)
                            .background(
                                LinearGradient(
                                    colors: [selectedRole.color, selectedRole.color.opacity(0.7)],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                            .cornerRadius(16)
                            .shadow(color: selectedRole.color.opacity(0.5), radius: 12, x: 0, y: 6)
                        }
                        .disabled(isLoggingIn)

                        // Info banner
                        HStack(spacing: 12) {
                            Image(systemName: "info.circle.fill")
                                .foregroundColor(.blue)

                            VStack(alignment: .leading, spacing: 4) {
                                Text("Demo Mode Features")
                                    .font(.system(size: 14, weight: .semibold))
                                    .foregroundColor(.primary)

                                Text("• All features enabled\n• Sample data pre-loaded\n• No real data affected")
                                    .font(.system(size: 12))
                                    .foregroundColor(.secondary)
                            }

                            Spacer()
                        }
                        .padding(16)
                        .background(Color.blue.opacity(0.1))
                        .cornerRadius(12)
                    }
                    .padding(28)
                    .background(
                        RoundedRectangle(cornerRadius: 24)
                            .fill(Color(.systemBackground))
                            .shadow(color: .black.opacity(0.15), radius: 20, x: 0, y: 10)
                    )

                    Spacer()
                }
                .padding(.horizontal, 24)
            }
        }
    }

    // MARK: - Demo Login

    private func performDemoLogin() async {
        withAnimation {
            isLoggingIn = true
        }

        // Simulate network delay
        try? await Task.sleep(nanoseconds: 1_000_000_000)

        // Create demo user based on selected role
        let demoUser = AuthenticationService.User(
            id: Int.random(in: 1000...9999),
            email: "demo.\(selectedRole.rawValue.lowercased())@fleet.demo",
            name: "\(selectedRole.rawValue) Demo User",
            role: selectedRole.rawValue.lowercased(),
            organizationId: 1
        )

        // Generate demo token
        let demoToken = "demo_token_\(UUID().uuidString)"

        // Save to keychain
        try? await authManager.getKeychainManager().saveTokens(
            accessToken: demoToken,
            refreshToken: demoToken,
            expiresIn: 86400 // 24 hours
        )

        try? authManager.getKeychainManager().save(demoUser.email, for: .userEmail)
        try? authManager.getKeychainManager().save("\(demoUser.id)", for: .userId)
        try? authManager.getKeychainManager().save(demoUser.role, for: .userRole)

        // Update auth state
        await authManager.setSSOUser(demoUser)

        withAnimation {
            isLoggingIn = false
        }
    }
}

// MARK: - Role Card Component

struct RoleCard: View {
    let role: DemoModeLoginView.DemoRole
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 16) {
                // Icon
                Image(systemName: role.icon)
                    .font(.system(size: 28))
                    .foregroundColor(isSelected ? .white : role.color)
                    .frame(width: 50, height: 50)
                    .background(
                        Circle()
                            .fill(isSelected ? role.color : role.color.opacity(0.1))
                    )

                // Text
                VStack(alignment: .leading, spacing: 4) {
                    Text(role.rawValue)
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundColor(isSelected ? role.color : .primary)

                    Text(role.description)
                        .font(.system(size: 13))
                        .foregroundColor(.secondary)
                }

                Spacer()

                // Checkmark
                if isSelected {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 24))
                        .foregroundColor(role.color)
                }
            }
            .padding(18)
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(isSelected ? role.color.opacity(0.1) : Color(.systemGray6))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(isSelected ? role.color : Color.clear, lineWidth: 2)
            )
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// MARK: - Preview

struct DemoModeLoginView_Previews: PreviewProvider {
    static var previews: some View {
        DemoModeLoginView()
    }
}
