import SwiftUI

struct SettingsView: View {
    @State private var showingMapSettings = false

    var body: some View {
        NavigationView {
            List {
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
            .sheet(isPresented: $showingMapSettings) {
                MapProviderSettingsView()
            }
        }
    }
}

#if DEBUG
struct SettingsView_Previews: PreviewProvider {
    static var previews: some View {
        SettingsView()
    }
}
#endif
