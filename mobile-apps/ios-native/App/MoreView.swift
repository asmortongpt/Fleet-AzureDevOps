import SwiftUI

struct MoreView: View {
    // @StateObject private var checklistViewModel = ChecklistViewModel() // Disabled until ChecklistViewModel is fixed

    var body: some View {
        NavigationView {
            List {
                // New Features Section
                Section(header: Text("Features")) {
                    NavigationLink(destination: DriverListView()) {
                        HStack {
                            Image(systemName: "person.3.fill")
                                .foregroundColor(.blue)
                                .frame(width: 30)
                            VStack(alignment: .leading) {
                                Text("Drivers")
                                    .font(.body)
                                Text("Manage driver roster and performance")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                    }

                    NavigationLink(destination: Text("Checklists coming soon")) {
                        HStack {
                            Image(systemName: "checklist")
                                .foregroundColor(.orange)
                                .frame(width: 30)
                            VStack(alignment: .leading) {
                                Text("Checklists")
                                    .font(.body)
                                Text("Smart location-based checklists")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                            Spacer()
                            // Badge disabled until ChecklistViewModel is fixed
                            // if checklistViewModel.pendingChecklists.count > 0 {
                            //     Text("\(checklistViewModel.pendingChecklists.count)")
                            //         .font(.caption)
                            //         .fontWeight(.semibold)
                            //         .foregroundColor(.white)
                            //         .padding(.horizontal, 8)
                            //         .padding(.vertical, 4)
                            //         .background(Color.red)
                            //         .cornerRadius(10)
                            // }
                        }
                    }

                    NavigationLink(destination: Text("Schedule coming soon")) {
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

                    NavigationLink(destination: Text("Appearance settings coming soon")) {
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

#Preview {
    MoreView()
}
