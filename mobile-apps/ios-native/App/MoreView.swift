import SwiftUI

// MARK: - Simple More View for initial app launch
struct MoreView: View {
    @EnvironmentObject private var navigationCoordinator: NavigationCoordinator
    @EnvironmentObject private var authManager: AuthenticationManager

    var body: some View {
        List {
            // User Profile Section
            Section {
                HStack(spacing: 16) {
                    Circle()
                        .fill(Color.blue.opacity(0.2))
                        .frame(width: 60, height: 60)
                        .overlay(
                            Text(authManager.currentUser?.name.prefix(2).uppercased() ?? "U")
                                .font(.title2)
                                .fontWeight(.semibold)
                                .foregroundColor(.blue)
                        )

                    VStack(alignment: .leading, spacing: 4) {
                        Text(authManager.currentUser?.name ?? "User")
                            .font(.headline)
                        Text(authManager.userRole.displayName)
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }

                    Spacer()
                }
                .padding(.vertical, 8)
            }

            Section("Account") {
                NavigationLink(destination: ProfileView()) {
                    Label("Profile", systemImage: "person.circle")
                }

                NavigationLink(destination: SettingsView()) {
                    Label("Settings", systemImage: "gearshape")
                }
            }

            Section("Information") {
                NavigationLink(destination: HelpView()) {
                    Label("Help & Support", systemImage: "questionmark.circle")
                }

                NavigationLink(destination: AboutView()) {
                    Label("About", systemImage: "info.circle")
                }
            }

            Section {
                Button(action: {
                    Task {
                        await authManager.logout()
                    }
                }) {
                    Label("Sign Out", systemImage: "arrow.right.square")
                        .foregroundColor(.red)
                }
            }
        }
        .navigationTitle("More")
    }
}

// MARK: - Preview
struct MoreView_Previews: PreviewProvider {
    static var previews: some View {
        NavigationView {
            MoreView()
                .environmentObject(NavigationCoordinator())
                .environmentObject(AuthenticationManager.shared)
        }
    }
}
