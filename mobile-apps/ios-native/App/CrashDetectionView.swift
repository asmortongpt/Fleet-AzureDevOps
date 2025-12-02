/**
 * Crash Detection View
 *
 * UI for configuring and monitoring crash detection feature
 */

import SwiftUI
import MapKit

struct CrashDetectionView: View {
    @ObservedObject var crashDetectionManager = CrashDetectionManager.shared
    @State private var showingEmergencyContacts = false
    @State private var showingCrashHistory = false

    var body: some View {
        NavigationView {
            List {
                // Status Section
                Section(header: Text("Status")) {
                    HStack {
                        Image(systemName: crashDetectionManager.isMonitoring ? "checkmark.circle.fill" : "xmark.circle.fill")
                            .foregroundColor(crashDetectionManager.isMonitoring ? .green : .gray)
                            .font(.title2)

                        VStack(alignment: .leading, spacing: 4) {
                            Text(crashDetectionManager.isMonitoring ? "Monitoring Active" : "Monitoring Inactive")
                                .font(.headline)

                            Text(crashDetectionManager.isMonitoring ? "Crash detection is protecting you" : "Start a trip to activate")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                    .padding(.vertical, 4)
                }

                // Settings Section
                Section(header: Text("Settings"), footer: Text("When enabled, the app will automatically detect crashes using your phone's sensors and can contact emergency services.")) {
                    Toggle("Enable Crash Detection", isOn: $crashDetectionManager.isEnabled)
                        .onChange(of: crashDetectionManager.isEnabled) { _ in
                            crashDetectionManager.saveSettings()
                        }

                    Toggle("Auto-Call 911", isOn: $crashDetectionManager.autoCall911)
                        .onChange(of: crashDetectionManager.autoCall911) { _ in
                            crashDetectionManager.saveSettings()
                        }
                        .disabled(!crashDetectionManager.isEnabled)
                }

                // Emergency Contacts Section
                Section(header: Text("Emergency Contacts")) {
                    Button(action: { showingEmergencyContacts = true }) {
                        HStack {
                            Image(systemName: "person.2.fill")
                                .foregroundColor(.red)

                            Text("Manage Emergency Contacts")

                            Spacer()

                            Text("\(crashDetectionManager.emergencyContacts.count)")
                                .foregroundColor(.secondary)

                            Image(systemName: "chevron.right")
                                .foregroundColor(.gray)
                                .font(.caption)
                        }
                    }
                }

                // How It Works Section
                Section(header: Text("How It Works")) {
                    VStack(alignment: .leading, spacing: 12) {
                        FeatureRow(
                            icon: "sensor.fill",
                            title: "Sensor Detection",
                            description: "Uses accelerometer and gyroscope to detect impacts"
                        )

                        FeatureRow(
                            icon: "timer",
                            title: "10-Second Countdown",
                            description: "You have 10 seconds to cancel false alarms"
                        )

                        FeatureRow(
                            icon: "phone.fill",
                            title: "Emergency Response",
                            description: "Calls 911 and notifies your emergency contacts"
                        )

                        FeatureRow(
                            icon: "location.fill",
                            title: "Location Sharing",
                            description: "Sends your exact GPS coordinates to responders"
                        )
                    }
                    .padding(.vertical, 8)
                }

                // Crash History
                Section {
                    Button(action: { showingCrashHistory = true }) {
                        HStack {
                            Image(systemName: "clock.arrow.circlepath")
                                .foregroundColor(.blue)

                            Text("View Crash History")

                            Spacer()

                            Image(systemName: "chevron.right")
                                .foregroundColor(.gray)
                                .font(.caption)
                        }
                    }
                }
            }
            .navigationTitle("Crash Detection")
            .listStyle(InsetGroupedListStyle())
            .sheet(isPresented: $showingEmergencyContacts) {
                EmergencyContactsView()
            }
            .sheet(isPresented: $showingCrashHistory) {
                CrashHistoryView()
            }
        }
        // Emergency Alert Overlay
        .overlay {
            if crashDetectionManager.emergencyCountdownActive {
                CrashDetectedOverlay()
            }
        }
    }
}

// MARK: - Feature Row
struct FeatureRow: View {
    let icon: String
    let title: String
    let description: String

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: icon)
                .foregroundColor(.blue)
                .frame(width: 24)

            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.subheadline)
                    .fontWeight(.medium)

                Text(description)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
    }
}

// MARK: - Crash Detected Overlay
struct CrashDetectedOverlay: View {
    @ObservedObject var crashDetectionManager = CrashDetectionManager.shared

    var body: some View {
        ZStack {
            // Full-screen dark overlay
            Color.black.opacity(0.9)
                .ignoresSafeArea()

            VStack(spacing: 30) {
                // Warning Icon
                Image(systemName: "exclamationmark.triangle.fill")
                    .font(.system(size: 80))
                    .foregroundColor(.red)
                    .padding()

                // Title
                Text("Crash Detected")
                    .font(.system(size: 32, weight: .bold))
                    .foregroundColor(.white)

                // Countdown
                ZStack {
                    Circle()
                        .stroke(Color.red.opacity(0.3), lineWidth: 10)
                        .frame(width: 150, height: 150)

                    Circle()
                        .trim(from: 0, to: CGFloat(crashDetectionManager.countdownSeconds) / 10.0)
                        .stroke(Color.red, style: StrokeStyle(lineWidth: 10, lineCap: .round))
                        .frame(width: 150, height: 150)
                        .rotationEffect(.degrees(-90))
                        .animation(.linear(duration: 1), value: crashDetectionManager.countdownSeconds)

                    VStack {
                        Text("\(crashDetectionManager.countdownSeconds)")
                            .font(.system(size: 60, weight: .bold))
                            .foregroundColor(.white)

                        Text("seconds")
                            .font(.caption)
                            .foregroundColor(.white.opacity(0.7))
                    }
                }

                // Description
                Text("Emergency services will be contacted automatically")
                    .font(.headline)
                    .foregroundColor(.white.opacity(0.9))
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)

                // Cancel Button
                Button(action: {
                    crashDetectionManager.cancelEmergencyCountdown()
                }) {
                    Text("I'm OK - Cancel")
                        .font(.headline)
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.green)
                        .cornerRadius(12)
                }
                .padding(.horizontal, 40)
                .padding(.top, 20)
            }
        }
    }
}

// MARK: - Emergency Contacts View
struct EmergencyContactsView: View {
    @ObservedObject var crashDetectionManager = CrashDetectionManager.shared
    @Environment(\.presentationMode) var presentationMode
    @State private var showingAddContact = false

    var body: some View {
        NavigationView {
            List {
                Section(header: Text("Emergency Contacts"), footer: Text("These contacts will be notified if a crash is detected.")) {
                    ForEach(crashDetectionManager.emergencyContacts) { contact in
                        HStack {
                            VStack(alignment: .leading, spacing: 4) {
                                Text(contact.name)
                                    .font(.headline)

                                Text(contact.relationship)
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }

                            Spacer()

                            Text(contact.phoneNumber)
                                .font(.subheadline)
                                .foregroundColor(.blue)
                        }
                    }
                    .onDelete(perform: deleteContact)
                }

                Section {
                    Button(action: { showingAddContact = true }) {
                        HStack {
                            Image(systemName: "plus.circle.fill")
                                .foregroundColor(.green)

                            Text("Add Emergency Contact")
                        }
                    }
                }
            }
            .navigationTitle("Emergency Contacts")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Done") {
                        presentationMode.wrappedValue.dismiss()
                    }
                }
            }
            .sheet(isPresented: $showingAddContact) {
                AddEmergencyContactView()
            }
        }
    }

    private func deleteContact(at offsets: IndexSet) {
        crashDetectionManager.emergencyContacts.remove(atOffsets: offsets)
        crashDetectionManager.saveSettings()
    }
}

// MARK: - Add Emergency Contact View
struct AddEmergencyContactView: View {
    @ObservedObject var crashDetectionManager = CrashDetectionManager.shared
    @Environment(\.presentationMode) var presentationMode

    @State private var name = ""
    @State private var phoneNumber = ""
    @State private var relationship = "Family"

    let relationships = ["Family", "Friend", "Spouse", "Parent", "Sibling", "Coworker", "Other"]

    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Contact Information")) {
                    TextField("Name", text: $name)
                    TextField("Phone Number", text: $phoneNumber)
                        .keyboardType(.phonePad)

                    Picker("Relationship", selection: $relationship) {
                        ForEach(relationships, id: \.self) { rel in
                            Text(rel)
                        }
                    }
                }

                Section {
                    Button(action: addContact) {
                        Text("Add Contact")
                            .frame(maxWidth: .infinity)
                    }
                    .disabled(name.isEmpty || phoneNumber.isEmpty)
                }
            }
            .navigationTitle("Add Emergency Contact")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        presentationMode.wrappedValue.dismiss()
                    }
                }
            }
        }
    }

    private func addContact() {
        let contact = EmergencyContact(
            id: UUID(),
            name: name,
            phoneNumber: phoneNumber,
            relationship: relationship
        )

        crashDetectionManager.emergencyContacts.append(contact)
        crashDetectionManager.saveSettings()

        presentationMode.wrappedValue.dismiss()
    }
}

// MARK: - Crash History View
struct CrashHistoryView: View {
    @Environment(\.presentationMode) var presentationMode
    @State private var incidents: [CrashHistoryItem] = []

    var body: some View {
        NavigationView {
            if incidents.isEmpty {
                VStack(spacing: 20) {
                    Image(systemName: "checkmark.shield.fill")
                        .font(.system(size: 60))
                        .foregroundColor(.green)

                    Text("No Crashes Detected")
                        .font(.headline)

                    Text("We're glad you're safe!")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
            } else {
                List(incidents) { incident in
                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            Text(formatDate(incident.timestamp))
                                .font(.headline)

                            Spacer()

                            if incident.userCanceled {
                                Text("Canceled")
                                    .font(.caption)
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 4)
                                    .background(Color.orange.opacity(0.2))
                                    .foregroundColor(.orange)
                                    .cornerRadius(8)
                            } else {
                                Text("Confirmed")
                                    .font(.caption)
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 4)
                                    .background(Color.red.opacity(0.2))
                                    .foregroundColor(.red)
                                    .cornerRadius(8)
                            }
                        }

                        Text("Impact: \(String(format: "%.1f", incident.maxAcceleration))G")
                            .font(.subheadline)
                            .foregroundColor(.secondary)

                        if incident.emergencyServicesCalled {
                            Label("911 Called", systemImage: "phone.fill")
                                .font(.caption)
                                .foregroundColor(.red)
                        }
                    }
                    .padding(.vertical, 4)
                }
            }
        }
        .navigationTitle("Crash History")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button("Done") {
                    presentationMode.wrappedValue.dismiss()
                }
            }
        }
        .onAppear {
            loadCrashHistory()
        }
    }

    private func loadCrashHistory() {
        let defaults = UserDefaults.standard
        if let incidentsData = defaults.array(forKey: "crash_incidents") as? [[String: Any]] {
            incidents = incidentsData.compactMap { dict in
                guard let timestamp = dict["timestamp"] as? TimeInterval,
                      let maxAccel = dict["max_acceleration"] as? Double,
                      let userCanceled = dict["user_canceled"] as? Bool,
                      let emergencyCalled = dict["emergency_services_called"] as? Bool else {
                    return nil
                }

                return CrashHistoryItem(
                    id: UUID(),
                    timestamp: Date(timeIntervalSince1970: timestamp),
                    maxAcceleration: maxAccel,
                    userCanceled: userCanceled,
                    emergencyServicesCalled: emergencyCalled
                )
            }
        }
    }

    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }
}

struct CrashHistoryItem: Identifiable {
    let id: UUID
    let timestamp: Date
    let maxAcceleration: Double
    let userCanceled: Bool
    let emergencyServicesCalled: Bool
}

// MARK: - Preview
struct CrashDetectionView_Previews: PreviewProvider {
    static var previews: some View {
        CrashDetectionView()
    }
}
