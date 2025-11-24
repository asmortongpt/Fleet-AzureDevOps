import SwiftUI

struct MoreView: View {
    // Note: ChecklistViewModel will be added when checklist features are complete
    @State private var pendingChecklistCount: Int = 0

    var body: some View {
        NavigationView {
            List {
                // New Features Section
                Section(header: Text("Features")) {
                    NavigationLink(destination: ChecklistsPlaceholderView()) {
                        HStack {
                            Image(systemName: "checklist")
                                .foregroundColor(.blue)
                                .frame(width: 30)
                            VStack(alignment: .leading) {
                                Text("Checklists")
                                    .font(.body)
                                Text("Smart location-based checklists")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                            Spacer()
                            if pendingChecklistCount > 0 {
                                Text("\(pendingChecklistCount)")
                                    .font(.caption)
                                    .fontWeight(.semibold)
                                    .foregroundColor(.white)
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 4)
                                    .background(Color.red)
                                    .cornerRadius(10)
                            }
                        }
                    }

                    NavigationLink(destination: ScheduleView()) {
                        HStack {
                            Image(systemName: "calendar")
                                .foregroundColor(.green)
                                .frame(width: 30)
                            VStack(alignment: .leading) {
                                Text("Schedule")
                                    .font(.body)
                                Text("Shifts, maintenance & appointments")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                    }

                    NavigationLink(destination: DriverManagementView()) {
                        HStack {
                            Image(systemName: "person.2.fill")
                                .foregroundColor(.purple)
                                .frame(width: 30)
                            VStack(alignment: .leading) {
                                Text("Drivers")
                                    .font(.body)
                                Text("Manage drivers and assignments")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                    }

                    NavigationLink(destination: DeviceManagementView()) {
                        HStack {
                            Image(systemName: "antenna.radiowaves.left.and.right")
                                .foregroundColor(.orange)
                                .frame(width: 30)
                            VStack(alignment: .leading) {
                                Text("Device Management")
                                    .font(.body)
                                Text("OBD2 devices & emulator")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                    }
                }

                // Settings Section
                Section(header: Text("Settings")) {
                    NavigationLink(destination: ProfileView()) {
                        HStack {
                            Image(systemName: "person.circle.fill")
                                .foregroundColor(.blue)
                                .frame(width: 30)
                            Text("Profile")
                        }
                    }

                    NavigationLink(destination: NotificationsView()) {
                        HStack {
                            Image(systemName: "bell.fill")
                                .foregroundColor(.orange)
                                .frame(width: 30)
                            Text("Notifications")
                        }
                    }

                    NavigationLink(destination: AppearanceSettingsView()) {
                        HStack {
                            Image(systemName: "paintbrush.fill")
                                .foregroundColor(.purple)
                                .frame(width: 30)
                            Text("Appearance")
                        }
                    }
                }

                // About Section
                Section(header: Text("About")) {
                    NavigationLink(destination: AboutView()) {
                        HStack {
                            Image(systemName: "info.circle.fill")
                                .foregroundColor(.blue)
                                .frame(width: 30)
                            Text("App Info")
                        }
                    }

                    NavigationLink(destination: HelpView()) {
                        HStack {
                            Image(systemName: "questionmark.circle.fill")
                                .foregroundColor(.green)
                                .frame(width: 30)
                            Text("Help & Support")
                        }
                    }
                }

                // Sign Out Section
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

// MARK: - Checklists Placeholder View
struct ChecklistsPlaceholderView: View {
    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "checklist")
                .font(.system(size: 60))
                .foregroundColor(.gray)

            Text("Checklists")
                .font(.title2)
                .fontWeight(.semibold)

            Text("Smart location-based checklists coming soon")
                .font(.body)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)

            Text("Features in development:")
                .font(.headline)
                .padding(.top)

            VStack(alignment: .leading, spacing: 10) {
                Label("Pre-trip inspections", systemImage: "car.fill")
                Label("OSHA safety checklists", systemImage: "shield.fill")
                Label("Location-triggered reminders", systemImage: "mappin.circle.fill")
                Label("Digital signatures", systemImage: "signature")
                Label("Photo attachments", systemImage: "camera.fill")
            }
            .font(.subheadline)
            .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Checklists")
    }
}

#Preview {
    MoreView()
}
