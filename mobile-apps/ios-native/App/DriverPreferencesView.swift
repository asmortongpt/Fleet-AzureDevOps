import SwiftUI

struct EnhancedDriverPreferencesView: View {
    @ObservedObject var obd2Manager: OBD2Manager
    @ObservedObject var connectionManager: OBD2ConnectionManager
    @State private var selectedSection = 0
    
    var body: some View {
        NavigationView {
            List {
                // OBD2 Settings Section
                NavigationLink(destination: OBD2SettingsView(obd2Manager: obd2Manager, connectionManager: connectionManager)) {
                    HStack {
                        Image(systemName: "car.fill")
                            .foregroundColor(.blue)
                            .frame(width: 30)
                        
                        VStack(alignment: .leading) {
                            Text("OBD2 Settings")
                                .font(.headline)
                            Text(obd2Manager.isConnected ? "Connected" : "Not Connected")
                                .font(.caption)
                                .foregroundColor(obd2Manager.isConnected ? .green : .orange)
                        }
                        
                        Spacer()
                        
                        if obd2Manager.isConnected {
                            Circle()
                                .fill(Color.green)
                                .frame(width: 8, height: 8)
                        }
                    }
                }
                
                // Notification Settings
                NavigationLink(destination: EnhancedNotificationSettingsView()) {
                    HStack {
                        Image(systemName: "bell.fill")
                            .foregroundColor(.red)
                            .frame(width: 30)
                        
                        Text("Notifications")
                            .font(.headline)
                    }
                }
                
                // Account Settings
                NavigationLink(destination: AccountSettingsView()) {
                    HStack {
                        Image(systemName: "person.circle.fill")
                            .foregroundColor(.purple)
                            .frame(width: 30)
                        
                        Text("Account")
                            .font(.headline)
                    }
                }
                
                // Privacy Settings
                NavigationLink(destination: PrivacySettingsView()) {
                    HStack {
                        Image(systemName: "lock.fill")
                            .foregroundColor(.gray)
                            .frame(width: 30)
                        
                        Text("Privacy")
                            .font(.headline)
                    }
                }
                
                // About
                NavigationLink(destination: AboutView()) {
                    HStack {
                        Image(systemName: "info.circle.fill")
                            .foregroundColor(.blue)
                            .frame(width: 30)
                        
                        Text("About")
                            .font(.headline)
                    }
                }
            }
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.large)
        }
    }
}

// MARK: - Notification Settings
struct EnhancedNotificationSettingsView: View {
    @AppStorage("notifyMaintenanceDue") private var notifyMaintenanceDue = true
    @AppStorage("notifyLowFuel") private var notifyLowFuel = true
    @AppStorage("notifyTripReminders") private var notifyTripReminders = true
    @AppStorage("notifyOBD2Alerts") private var notifyOBD2Alerts = true
    
    var body: some View {
        Form {
            Section(header: Text("Vehicle Alerts")) {
                Toggle("Maintenance Due", isOn: $notifyMaintenanceDue)
                Toggle("Low Fuel", isOn: $notifyLowFuel)
                Toggle("OBD2 Connection", isOn: $notifyOBD2Alerts)
            }
            
            Section(header: Text("Trip Alerts")) {
                Toggle("Trip Reminders", isOn: $notifyTripReminders)
            }
        }
        .navigationTitle("Notifications")
        .navigationBarTitleDisplayMode(.inline)
    }
}

// MARK: - Account Settings
struct AccountSettingsView: View {
    @State private var driverName = "John Doe"
    @State private var driverID = "FL-DRV-001"
    @State private var department = "Transportation"
    
    var body: some View {
        Form {
            Section(header: Text("Driver Information")) {
                HStack {
                    Text("Name")
                    Spacer()
                    Text(driverName)
                        .foregroundColor(.secondary)
                }
                
                HStack {
                    Text("Driver ID")
                    Spacer()
                    Text(driverID)
                        .foregroundColor(.secondary)
                }
                
                HStack {
                    Text("Department")
                    Spacer()
                    Text(department)
                        .foregroundColor(.secondary)
                }
            }
            
            Section {
                Button("Sign Out") {
                    // Sign out action
                }
                .foregroundColor(.red)
            }
        }
        .navigationTitle("Account")
        .navigationBarTitleDisplayMode(.inline)
    }
}

// MARK: - Privacy Settings
struct PrivacySettingsView: View {
    @AppStorage("shareLocation") private var shareLocation = true
    @AppStorage("shareDrivingData") private var shareDrivingData = true
    @AppStorage("shareMaintenanceData") private var shareMaintenanceData = true
    
    var body: some View {
        Form {
            Section(header: Text("Data Sharing")) {
                Toggle("Share Location", isOn: $shareLocation)
                Toggle("Share Driving Data", isOn: $shareDrivingData)
                Toggle("Share Maintenance Data", isOn: $shareMaintenanceData)
            }
            
            Section(header: Text("Privacy Policy")) {
                Link("View Privacy Policy", destination: URL(string: "https://capitaltechalliance.com/privacy")!)
                Link("View Terms of Service", destination: URL(string: "https://capitaltechalliance.com/terms")!)
            }
        }
        .navigationTitle("Privacy")
        .navigationBarTitleDisplayMode(.inline)
    }
}

// MARK: - About View
struct DriverAboutView: View {
    var body: some View {
        VStack(spacing: 20) {
            Image("CTAFleetLogo")
                .resizable()
                .scaledToFit()
                .frame(width: 120, height: 120)

            Text("Fleet")
                .font(.title2)
                .fontWeight(.bold)
            
            Text("Version 1.0.0")
                .foregroundColor(.secondary)
            
            VStack(alignment: .leading, spacing: 12) {
                InfoRow(label: "Build", value: "2024.1.0")
                InfoRow(label: "Environment", value: "Production")
                InfoRow(label: "OBD2 Support", value: "ELM327 Compatible")
            }
            .padding()
            .background(Color.gray.opacity(0.1))
            .cornerRadius(10)
            
            Spacer()
            
            Text("© 2025 Capital Tech Alliance")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding()
        .navigationTitle("About")
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct DriverInfoRow: View {
    let label: String
    let value: String
    
    var body: some View {
        HStack {
            Text(label)
                .foregroundColor(.secondary)
            Spacer()
            Text(value)
                .fontWeight(.medium)
        }
    }
}