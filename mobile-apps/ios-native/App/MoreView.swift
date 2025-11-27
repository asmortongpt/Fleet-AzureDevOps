import SwiftUI

struct MoreView: View {
    @EnvironmentObject private var navigationCoordinator: NavigationCoordinator

    var body: some View {
        NavigationView {
            List {
                // MARK: - Account & Settings
                Section(header: Text("Account & Settings")) {
                    NavigationLink(destination: ProfileView()) {
                        FeatureRow(
                            icon: "person.circle.fill",
                            iconColor: .blue,
                            title: "Profile",
                            subtitle: "View and edit your profile"
                        )
                    }

                    NavigationLink(destination: NotificationsView()) {
                        FeatureRow(
                            icon: "bell.fill",
                            iconColor: .orange,
                            title: "Notifications",
                            subtitle: "Manage notification settings"
                        )
                    }

                    NavigationLink(destination: SettingsView()) {
                        FeatureRow(
                            icon: "gear",
                            iconColor: .gray,
                            title: "Settings",
                            subtitle: "App settings and preferences"
                        )
                    }
                }

                // MARK: - Help & Support
                Section(header: Text("Help & Support")) {
                    NavigationLink(destination: AboutView()) {
                        FeatureRow(
                            icon: "info.circle.fill",
                            iconColor: .blue,
                            title: "About",
                            subtitle: "App version and information"
                        )
                    }
                }

                // MARK: - Sign Out
                Section {
                    Button(action: {
                        Task {
                            await AuthenticationManager.shared.logout()
                        }
                    }) {
                        HStack {
                            Image(systemName: "arrow.right.square.fill")
                                .foregroundColor(.red)
                                .frame(width: 30)
                            Text("Sign Out")
                                .foregroundColor(.red)
                        }
                    }
                }
            }
            .navigationTitle("More")
            .listStyle(InsetGroupedListStyle())
        }
    }
}

// MARK: - Feature Row Component
struct FeatureRow: View {
    let icon: String
    let iconColor: Color
    let title: String
    let subtitle: String

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .foregroundColor(iconColor)
                .frame(width: 30)
                .font(.title3)

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.body)
                    .fontWeight(.medium)
                Text(subtitle)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding(.vertical, 2)
    }
}

#Preview {
    MoreView()
        .environmentObject(NavigationCoordinator())
}
