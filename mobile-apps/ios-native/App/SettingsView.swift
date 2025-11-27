import SwiftUI

struct SettingsView: View {
    @EnvironmentObject private var authManager: AuthenticationManager
    @State private var showingMapSettings = false
    @State private var showingRoleSwitcher = false

    var body: some View {
        NavigationView {
            List {
                #if DEBUG
                // DEBUG Role Switcher Section
                Section(header: Text("DEBUG - Role Switcher")) {
                    Button {
                        showingRoleSwitcher = true
                    } label: {
                        HStack {
                            Image(systemName: authManager.userRole.iconName)
                                .foregroundColor(Color(authManager.userRole.color))
                            VStack(alignment: .leading, spacing: 2) {
                                Text("Current Role")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                                Text(authManager.userRole.displayName)
                                    .font(.subheadline)
                            }
                            Spacer()
                            Image(systemName: "chevron.right")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                    .foregroundColor(.primary)
                }
                #endif

                Section(header: Text("Account")) {
                    NavigationLink(destination: Text("Profile Settings")) {
                        HStack {
                            Image(systemName: "person.circle.fill")
                                .foregroundColor(.blue)
                            Text("Profile")
                        }
                    }

                    NavigationLink(destination: Text("Notification Settings")) {
                        HStack {
                            Image(systemName: "bell.fill")
                                .foregroundColor(.orange)
                            Text("Notifications")
                        }
                    }
                }

                Section(header: Text("Map")) {
                    Button {
                        showingMapSettings = true
                    } label: {
                        HStack {
                            Image(systemName: "map.fill")
                                .foregroundColor(.blue)
                            Text("Map Provider")
                            Spacer()
                            Image(systemName: "chevron.right")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                    .foregroundColor(.primary)
                }

                Section(header: Text("App")) {
                    NavigationLink(destination: Text("Appearance Settings")) {
                        HStack {
                            Image(systemName: "paintbrush.fill")
                                .foregroundColor(.purple)
                            Text("Appearance")
                        }
                    }

                    NavigationLink(destination: Text("Language Settings")) {
                        HStack {
                            Image(systemName: "globe")
                                .foregroundColor(.green)
                            Text("Language")
                        }
                    }
                }

                Section(header: Text("About")) {
                    HStack {
                        Image(systemName: "info.circle.fill")
                            .foregroundColor(.blue)
                        Text("App Info")
                    }

                    HStack {
                        Image(systemName: "doc.text.fill")
                            .foregroundColor(.gray)
                        Text("Terms & Privacy")
                    }
                }

                Section {
                    Button(action: {}) {
                        HStack {
                            Image(systemName: "arrow.right.square.fill")
                                .foregroundColor(.red)
                            Text("Sign Out")
                                .foregroundColor(.red)
                        }
                    }
                }
            }
            .navigationTitle("Settings")
            .listStyle(InsetGroupedListStyle())
            #if DEBUG
            .sheet(isPresented: $showingRoleSwitcher) {
                roleSwitcherSheet
            }
            #endif
            .sheet(isPresented: $showingMapSettings) {
                NavigationView {
                    Form {
                        Section(header: Text("Map Provider")) {
                            Text("Map provider settings")
                                .foregroundColor(.secondary)
                        }
                    }
                    .navigationTitle("Map Settings")
                    .navigationBarTitleDisplayMode(.inline)
                    .toolbar {
                        ToolbarItem(placement: .navigationBarTrailing) {
                            Button("Done") {
                                showingMapSettings = false
                            }
                        }
                    }
                }
            }
        }
    }

    #if DEBUG
    // MARK: - Role Switcher Sheet
    private var roleSwitcherSheet: some View {
        NavigationView {
            List {
                Section(header: Text("Select Role for Testing")) {
                    ForEach(UserRole.allCases, id: \.self) { role in
                        Button {
                            authManager.updateRole(role)
                            showingRoleSwitcher = false
                        } label: {
                            HStack {
                                Image(systemName: role.iconName)
                                    .font(.title3)
                                    .foregroundColor(Color(role.color))
                                    .frame(width: 32)

                                VStack(alignment: .leading, spacing: 4) {
                                    Text(role.displayName)
                                        .font(.headline)
                                        .foregroundColor(.primary)

                                    Text(role.description)
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                        .lineLimit(2)
                                }

                                Spacer()

                                if authManager.userRole == role {
                                    Image(systemName: "checkmark.circle.fill")
                                        .foregroundColor(.green)
                                }
                            }
                            .padding(.vertical, 4)
                        }
                    }
                }

                Section(footer: Text("Role switching is only available in DEBUG builds for testing purposes. The app will update the UI immediately to reflect the selected role.")) {
                    EmptyView()
                }
            }
            .navigationTitle("Switch Role")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        showingRoleSwitcher = false
                    }
                }
            }
        }
    }
    #endif
}

#if DEBUG
struct SettingsView_Previews: PreviewProvider {
    static var previews: some View {
        SettingsView()
            .environmentObject(AuthenticationManager.shared)
    }
}
#endif
