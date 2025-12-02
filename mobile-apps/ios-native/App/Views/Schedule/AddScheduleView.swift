import SwiftUI

struct AddScheduleView: View {
    @ObservedObject var viewModel: ScheduleViewModel
    @Environment(\.dismiss) var dismiss

    @State private var title: String = ""
    @State private var scheduleType: ScheduleType = .shift
    @State private var startDate: Date = Date()
    @State private var endDate: Date = Date().addingTimeInterval(3600)
    @State private var description: String = ""
    @State private var priority: Priority = .normal
    @State private var status: ScheduleStatus = .scheduled
    @State private var location: ScheduleLocation?
    @State private var participants: [Participant] = []
    @State private var hasRecurrence: Bool = false
    @State private var recurrence: RecurrenceRule?
    @State private var reminders: [Reminder] = []

    // UI state
    @State private var showingLocationPicker = false
    @State private var showingParticipantPicker = false
    @State private var showingRecurrencePicker = false
    @State private var showingReminderPicker = false
    @State private var showingConflicts = false
    @State private var conflicts: [ScheduleConflict] = []

    var body: some View {
        NavigationView {
            Form {
                basicInfoSection
                schedulingSection
                detailsSection
                participantsSection
                locationSection
                recurrenceSection
                remindersSection

                if !conflicts.isEmpty {
                    conflictsSection
                }
            }
            .navigationTitle("New Schedule")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        Task {
                            await saveSchedule()
                        }
                    }
                    .disabled(title.isEmpty || !isValidDateRange)
                }
            }
            .onChange(of: startDate) { _ in
                validateDates()
            }
            .onChange(of: endDate) { _ in
                validateDates()
            }
        }
    }

    // MARK: - Form Sections

    private var basicInfoSection: some View {
        Section("Basic Information") {
            TextField("Title", text: $title)
                .textInputAutocapitalization(.words)

            Picker("Type", selection: $scheduleType) {
                ForEach(ScheduleType.allCases, id: \.self) { type in
                    Label(type.rawValue, systemImage: type.icon)
                        .tag(type)
                }
            }

            Picker("Priority", selection: $priority) {
                ForEach(Priority.allCases, id: \.self) { priority in
                    Text(priority.rawValue)
                        .tag(priority)
                }
            }

            Picker("Status", selection: $status) {
                ForEach([ScheduleStatus.scheduled, .confirmed, .inProgress], id: \.self) { status in
                    Text(status.rawValue)
                        .tag(status)
                }
            }
        }
    }

    private var schedulingSection: some View {
        Section("Schedule") {
            DatePicker("Start", selection: $startDate)

            DatePicker("End", selection: $endDate)

            if !isValidDateRange {
                Label("End time must be after start time", systemImage: "exclamationmark.triangle.fill")
                    .foregroundColor(.red)
                    .font(.caption)
            }

            HStack {
                Text("Duration")
                    .foregroundColor(.secondary)
                Spacer()
                Text(formatDuration(endDate.timeIntervalSince(startDate)))
                    .foregroundColor(.primary)
            }
        }
    }

    private var detailsSection: some View {
        Section("Details") {
            ZStack(alignment: .topLeading) {
                if description.isEmpty {
                    Text("Add description...")
                        .foregroundColor(.secondary)
                        .padding(.top, 8)
                        .padding(.leading, 4)
                }

                TextEditor(text: $description)
                    .frame(height: 100)
                    .opacity(description.isEmpty ? 0.5 : 1)
            }
        }
    }

    private var participantsSection: some View {
        Section {
            ForEach(participants) { participant in
                HStack {
                    Image(systemName: "person.circle.fill")
                        .foregroundColor(.blue)

                    VStack(alignment: .leading, spacing: 2) {
                        Text(participant.name)
                            .font(.body)
                        Text(participant.role.rawValue)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }

                    Spacer()

                    Text(participant.status.rawValue)
                        .font(.caption)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color.blue.opacity(0.1))
                        .cornerRadius(8)
                }
            }
            .onDelete { indexSet in
                participants.remove(atOffsets: indexSet)
            }

            Button {
                showingParticipantPicker = true
            } label: {
                Label("Add Participant", systemImage: "person.badge.plus")
            }
        } header: {
            Text("Participants")
        }
    }

    private var locationSection: some View {
        Section("Location") {
            if let location = location {
                VStack(alignment: .leading, spacing: 4) {
                    Text(location.name)
                        .font(.body)
                    Text(location.address)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Button(role: .destructive) {
                    self.location = nil
                } label: {
                    Label("Remove Location", systemImage: "trash")
                }
            } else {
                Button {
                    showingLocationPicker = true
                } label: {
                    Label("Add Location", systemImage: "mappin.circle")
                }
            }
        }
    }

    private var recurrenceSection: some View {
        Section("Recurrence") {
            Toggle("Repeat", isOn: $hasRecurrence)

            if hasRecurrence {
                if let recurrence = recurrence {
                    HStack {
                        Text("Pattern")
                            .foregroundColor(.secondary)
                        Spacer()
                        Text(recurrence.description)
                    }

                    Button {
                        showingRecurrencePicker = true
                    } label: {
                        Text("Edit Recurrence")
                    }
                } else {
                    Button {
                        showingRecurrencePicker = true
                    } label: {
                        Label("Set Recurrence Pattern", systemImage: "repeat")
                    }
                }
            }
        }
        .onChange(of: hasRecurrence) { enabled in
            if !enabled {
                recurrence = nil
            } else if recurrence == nil {
                recurrence = RecurrenceRule(
                    frequency: .daily,
                    interval: 1,
                    endDate: nil,
                    count: nil,
                    daysOfWeek: nil,
                    daysOfMonth: nil
                )
            }
        }
    }

    private var remindersSection: some View {
        Section("Reminders") {
            ForEach(reminders) { reminder in
                HStack {
                    Image(systemName: "bell.fill")
                        .foregroundColor(.orange)
                    Text(reminder.description)
                    Spacer()
                    Text(reminder.type.rawValue)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            .onDelete { indexSet in
                reminders.remove(atOffsets: indexSet)
            }

            Button {
                showingReminderPicker = true
            } label: {
                Label("Add Reminder", systemImage: "bell.badge.plus")
            }
        }
    }

    private var conflictsSection: some View {
        Section {
            ForEach(conflicts) { conflict in
                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .foregroundColor(.orange)
                        Text(conflict.description)
                            .font(.subheadline)
                            .fontWeight(.medium)
                    }

                    Text("\(conflict.conflictingEntries.count) conflicting entries")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                .padding(.vertical, 4)
            }
        } header: {
            Label("Scheduling Conflicts", systemImage: "exclamationmark.triangle")
                .foregroundColor(.orange)
        }
    }

    // MARK: - Validation

    private var isValidDateRange: Bool {
        endDate > startDate
    }

    private func validateDates() {
        if endDate <= startDate {
            endDate = startDate.addingTimeInterval(3600) // Add 1 hour
        }
    }

    // MARK: - Actions

    private func saveSchedule() async {
        let schedule = ScheduleEntry(
            id: UUID().uuidString,
            type: scheduleType,
            title: title,
            description: description.isEmpty ? nil : description,
            startDate: startDate,
            endDate: endDate,
            status: status,
            priority: priority,
            participants: participants,
            location: location,
            recurrence: hasRecurrence ? recurrence : nil,
            reminders: reminders,
            attachments: [],
            metadata: [:],
            createdBy: "current_user", // Would come from auth service
            createdAt: Date(),
            updatedAt: Date()
        )

        // Check for conflicts
        let foundConflicts = await viewModel.checkConflicts(for: schedule)
        if !foundConflicts.isEmpty {
            conflicts = foundConflicts
            showingConflicts = true
            // In production, might want to show alert and let user decide
        }

        await viewModel.createSchedule(schedule)
        dismiss()
    }

    private func formatDuration(_ duration: TimeInterval) -> String {
        let hours = Int(duration / 3600)
        let minutes = Int((duration.truncatingRemainder(dividingBy: 3600)) / 60)

        if hours > 0 && minutes > 0 {
            return "\(hours)h \(minutes)m"
        } else if hours > 0 {
            return "\(hours) hour\(hours > 1 ? "s" : "")"
        } else {
            return "\(minutes) minute\(minutes > 1 ? "s" : "")"
        }
    }
}
