//
//  DriverPreferencesView.swift
//  Fleet Manager
//
//  Driver Preferences and Appearance Settings
//

import SwiftUI

struct DriverPreferencesView: View {
    @State private var darkModeEnabled = false
    @State private var notificationsEnabled = true
    @State private var soundEnabled = true
    @State private var selectedMapType = "Standard"

    var body: some View {
        Form {
            Section(header: Text("Appearance")) {
                Toggle("Dark Mode", isOn: $darkModeEnabled)

                Picker("Map Type", selection: $selectedMapType) {
                    Text("Standard").tag("Standard")
                    Text("Satellite").tag("Satellite")
                    Text("Hybrid").tag("Hybrid")
                }
            }

            Section(header: Text("Notifications")) {
                Toggle("Enable Notifications", isOn: $notificationsEnabled)
                Toggle("Sound Effects", isOn: $soundEnabled)
            }

            Section(header: Text("Privacy")) {
                NavigationLink(destination: Text("Privacy Settings")) {
                    Text("Privacy & Data")
                }
                NavigationLink(destination: Text("Location Settings")) {
                    Text("Location Permissions")
                }
            }

            Section(header: Text("About")) {
                HStack {
                    Text("Version")
                    Spacer()
                    Text("1.0.0")
                        .foregroundColor(.secondary)
                }
                HStack {
                    Text("Build")
                    Spacer()
                    Text("2025.01")
                        .foregroundColor(.secondary)
                }
            }
        }
        .navigationTitle("Preferences")
    }
}

#Preview {
    NavigationView {
        DriverPreferencesView()
    }
}
