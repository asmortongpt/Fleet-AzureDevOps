import SwiftUI
import EventKit

struct ScheduleSettingsView: View {
    @ObservedObject var viewModel: ScheduleViewModel
    @Environment(\.dismiss) var dismiss

    @State private var calendarSyncEnabled = false
    @State private var notificationsEnabled = false
    @State private var defaultReminderMinutes = 30
    @State private var showingError = false
    @State private var errorMessage = ""
    @State private var isProcessing = false

    private let reminderOptions = [15, 30, 60, 120, 1440] // 15min, 30min, 1hr, 2hr, 1day

    var body: some View {
        NavigationView {
            Form {
                calendarSyncSection
                notificationsSection
                defaultsSection
                actionsSection
            }
            .navigationTitle("Schedule Settings")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
            .onAppear {
                loadSettings()
            }
            .alert("Error", isPresented: $showingError) {
                Button("OK") { }
            } message: {
                Text(errorMessage)
            }
        }
    }

    // MARK: - Sections

    private var calendarSyncSection: some View {
        Section {
            Toggle("Sync with Device Calendar", isOn: $calendarSyncEnabled)
                .onChange(of: calendarSyncEnabled) { enabled in
                    Task {
                        await toggleCalendarSync(enabled)
                    }
                }

            if calendarSyncEnabled {
                HStack {
                    Image(systemName: "calendar")
                        .foregroundColor(.blue)

                    VStack(alignment: .leading, spacing: 4) {
                        Text("Fleet Management Calendar")
                            .font(.body)

                        if let lastSync = CalendarSyncService.shared.lastSyncDate {
                            Text("Last synced: \(lastSync.relativeDescription())")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        } else {
                            Text("Never synced")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }

                    Spacer()

                    if isProcessing {
                        ProgressView()
                    }
                }

                Button {
                    Task {
                        await syncNow()
                    }
                } label: {
                    HStack {
                        Image(systemName: "arrow.clockwise")
                        Text("Sync Now")
                    }
                }
                .disabled(isProcessing)
            }
        } header: {
            Text("Calendar Integration")
        } footer: {
            Text("Sync your schedules with your device's calendar app. Events will be created in a dedicated 'Fleet Management' calendar.")
        }
    }

    private var notificationsSection: some View {
        Section {
            Toggle("Enable Notifications", isOn: $notificationsEnabled)
                .onChange(of: notificationsEnabled) { enabled in
                    Task {
                        await toggleNotifications(enabled)
                    }
                }

            if notificationsEnabled {
                HStack {
                    Text("Notification Status")
                        .foregroundColor(.secondary)

                    Spacer()

                    if NotificationService.shared.isAuthorized {
                        Label("Authorized", systemImage: "checkmark.circle.fill")
                            .foregroundColor(.green)
                            .font(.caption)
                    } else {
                        Label("Not Authorized", systemImage: "exclamationmark.triangle.fill")
                            .foregroundColor(.orange)
                            .font(.caption)
                    }
                }

                if !NotificationService.shared.isAuthorized {
                    Button {
                        openSettings()
                    } label: {
                        Label("Open Settings", systemImage: "gear")
                    }
                }
            }
        } header: {
            Text("Notifications")
        } footer: {
            Text("Receive push notifications for upcoming scheduled events. You can customize reminders when creating schedules.")
        }
    }

    private var defaultsSection: some View {
        Section {
            Picker("Default Reminder", selection: $defaultReminderMinutes) {
                ForEach(reminderOptions, id: \.self) { minutes in
                    Text(formatReminderTime(minutes))
                        .tag(minutes)
                }
            }
        } header: {
            Text("Defaults")
        } footer: {
            Text("Set the default reminder time for new schedules. You can always customize this for individual events.")
        }
    }

    private var actionsSection: some View {
        Section {
            Button {
                Task {
                    await exportAllToCalendar()
                }
            } label: {
                HStack {
                    Image(systemName: "square.and.arrow.up")
                        .foregroundColor(.blue)
                    Text("Export All Schedules to Calendar")
                }
            }
            .disabled(!calendarSyncEnabled || isProcessing)

            Button(role: .destructive) {
                Task {
                    await clearAllNotifications()
                }
            } label: {
                HStack {
                    Image(systemName: "bell.slash")
                    Text("Clear All Pending Notifications")
                }
            }
            .disabled(isProcessing)
        }
    }

    // MARK: - Actions

    private func loadSettings() {
        calendarSyncEnabled = viewModel.calendarSyncEnabled

        Task {
            await NotificationService.shared.checkAuthorizationStatus()
            notificationsEnabled = NotificationService.shared.isAuthorized
        }

        // Load default reminder from UserDefaults
        defaultReminderMinutes = UserDefaults.standard.integer(forKey: "defaultReminderMinutes")
        if defaultReminderMinutes == 0 {
            defaultReminderMinutes = 30 // Default value
        }
    }

    private func toggleCalendarSync(_ enabled: Bool) async {
        isProcessing = true
        defer { isProcessing = false }

        do {
            if enabled {
                try await viewModel.enableCalendarSync()
            } else {
                viewModel.disableCalendarSync()
            }
        } catch {
            calendarSyncEnabled = false
            errorMessage = error.localizedDescription
            showingError = true
        }
    }

    private func toggleNotifications(_ enabled: Bool) async {
        if enabled {
            let granted = await NotificationService.shared.requestAuthorization()
            if !granted {
                notificationsEnabled = false
                errorMessage = "Notification permission denied. Please enable notifications in Settings."
                showingError = true
            }
        }
    }

    private func syncNow() async {
        isProcessing = true
        defer { isProcessing = false }

        do {
            try await viewModel.syncWithDeviceCalendar()
        } catch {
            errorMessage = error.localizedDescription
            showingError = true
        }
    }

    private func exportAllToCalendar() async {
        isProcessing = true
        defer { isProcessing = false }

        do {
            try await viewModel.exportAllSchedulesToCalendar()
        } catch {
            errorMessage = error.localizedDescription
            showingError = true
        }
    }

    private func clearAllNotifications() async {
        await NotificationService.shared.cancelAllNotifications()
    }

    private func openSettings() {
        if let url = URL(string: UIApplication.openSettingsURLString) {
            UIApplication.shared.open(url)
        }
    }

    // MARK: - Helpers

    private func formatReminderTime(_ minutes: Int) -> String {
        if minutes < 60 {
            return "\(minutes) minutes before"
        } else if minutes == 60 {
            return "1 hour before"
        } else if minutes < 1440 {
            return "\(minutes / 60) hours before"
        } else {
            return "1 day before"
        }
    }
}

// MARK: - Preview

struct ScheduleSettingsView_Previews: PreviewProvider {
    static var previews: some View {
        ScheduleSettingsView(viewModel: ScheduleViewModel())
    }
}
