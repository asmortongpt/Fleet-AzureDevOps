import SwiftUI
import MapKit

struct ScheduleDetailView: View {
    let schedule: ScheduleEntry
    @ObservedObject var viewModel: ScheduleViewModel
    @Environment(\.dismiss) var dismiss

    @State private var showingEditView = false
    @State private var showingDeleteAlert = false
    @State private var updatedSchedule: ScheduleEntry?

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    headerSection
                    timeSection
                    participantsSection

                    if let location = schedule.location {
                        locationSection(location)
                    }

                    if schedule.recurrence != nil {
                        recurrenceSection
                    }

                    if !schedule.reminders.isEmpty {
                        remindersSection
                    }

                    if let description = schedule.description {
                        descriptionSection(description)
                    }

                    metadataSection
                    actionsSection
                }
                .padding()
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle("Schedule Details")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Close") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    Menu {
                        Button {
                            showingEditView = true
                        } label: {
                            Label("Edit", systemImage: "pencil")
                        }

                        Button {
                            Task {
                                await updateStatus(.completed)
                            }
                        } label: {
                            Label("Mark Complete", systemImage: "checkmark.circle")
                        }
                        .disabled(schedule.status == .completed)

                        Divider()

                        Button(role: .destructive) {
                            showingDeleteAlert = true
                        } label: {
                            Label("Delete", systemImage: "trash")
                        }
                    } label: {
                        Image(systemName: "ellipsis.circle")
                    }
                }
            }
            .alert("Delete Schedule", isPresented: $showingDeleteAlert) {
                Button("Cancel", role: .cancel) { }
                Button("Delete", role: .destructive) {
                    Task {
                        await deleteSchedule()
                    }
                }
            } message: {
                Text("Are you sure you want to delete this schedule? This action cannot be undone.")
            }
        }
    }

    // MARK: - Sections

    private var headerSection: some View {
        VStack(spacing: 12) {
            // Type icon
            Image(systemName: schedule.type.icon)
                .font(.system(size: 50))
                .foregroundColor(Color(schedule.type.colorName))
                .padding()
                .background(Color(schedule.type.colorName).opacity(0.1))
                .clipShape(Circle())

            // Title
            Text(schedule.title)
                .font(.title2)
                .fontWeight(.bold)
                .multilineTextAlignment(.center)

            // Type and priority badges
            HStack(spacing: 12) {
                Badge(text: schedule.type.rawValue, color: Color(schedule.type.colorName))
                Badge(text: schedule.priority.rawValue, color: Color(schedule.priority.colorName))
                Badge(text: schedule.status.rawValue, color: statusColor(schedule.status))
            }
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(16)
    }

    private var timeSection: some View {
        VStack(spacing: 16) {
            TimeRow(
                icon: "calendar",
                label: "Start",
                value: schedule.startDate.formattedDateTime()
            )

            Divider()

            TimeRow(
                icon: "calendar.badge.clock",
                label: "End",
                value: schedule.endDate.formattedDateTime()
            )

            Divider()

            TimeRow(
                icon: "clock",
                label: "Duration",
                value: formatDuration(schedule.duration)
            )
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(16)
    }

    private var participantsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            if !schedule.participants.isEmpty {
                Text("Participants")
                    .font(.headline)
                    .padding(.horizontal)

                ForEach(schedule.participants) { participant in
                    HStack(spacing: 12) {
                        Image(systemName: "person.circle.fill")
                            .font(.title2)
                            .foregroundColor(.blue)

                        VStack(alignment: .leading, spacing: 2) {
                            Text(participant.name)
                                .font(.body)
                                .fontWeight(.medium)

                            Text(participant.role.rawValue)
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }

                        Spacer()

                        Badge(text: participant.status.rawValue, color: participantStatusColor(participant.status))
                    }
                    .padding()
                    .background(Color(.systemBackground))
                    .cornerRadius(12)
                }
            }
        }
    }

    private func locationSection(_ location: ScheduleLocation) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Location")
                .font(.headline)
                .padding(.horizontal)

            VStack(alignment: .leading, spacing: 8) {
                HStack(spacing: 12) {
                    Image(systemName: "mappin.circle.fill")
                        .font(.title2)
                        .foregroundColor(.red)

                    VStack(alignment: .leading, spacing: 2) {
                        Text(location.name)
                            .font(.body)
                            .fontWeight(.medium)

                        Text(location.address)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }

                    Spacer()

                    Button {
                        openInMaps(location)
                    } label: {
                        Image(systemName: "arrow.up.right.circle.fill")
                            .foregroundColor(.blue)
                    }
                }

                if let notes = location.notes {
                    Text(notes)
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .padding(.top, 4)
                }

                // Mini map
                Map(coordinateRegion: .constant(MKCoordinateRegion(
                    center: location.coordinates,
                    span: MKCoordinateSpan(latitudeDelta: 0.01, longitudeDelta: 0.01)
                )), annotationItems: [location]) { loc in
                    MapMarker(coordinate: loc.coordinates, tint: .red)
                }
                .frame(height: 150)
                .cornerRadius(12)
                .allowsHitTesting(false)
            }
            .padding()
            .background(Color(.systemBackground))
            .cornerRadius(12)
        }
    }

    private var recurrenceSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Recurrence")
                .font(.headline)
                .padding(.horizontal)

            if let recurrence = schedule.recurrence {
                HStack {
                    Image(systemName: "repeat")
                        .foregroundColor(.purple)

                    Text(recurrence.description)
                        .font(.body)

                    Spacer()
                }
                .padding()
                .background(Color(.systemBackground))
                .cornerRadius(12)
            }
        }
    }

    private var remindersSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Reminders")
                .font(.headline)
                .padding(.horizontal)

            ForEach(schedule.reminders) { reminder in
                HStack {
                    Image(systemName: reminder.sent ? "bell.fill" : "bell")
                        .foregroundColor(reminder.sent ? .green : .orange)

                    Text(reminder.description)
                        .font(.body)

                    Spacer()

                    if reminder.sent {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundColor(.green)
                    }
                }
                .padding()
                .background(Color(.systemBackground))
                .cornerRadius(12)
            }
        }
    }

    private func descriptionSection(_ description: String) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Description")
                .font(.headline)
                .padding(.horizontal)

            Text(description)
                .font(.body)
                .padding()
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color(.systemBackground))
                .cornerRadius(12)
        }
    }

    private var metadataSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Information")
                .font(.headline)
                .padding(.horizontal)

            VStack(spacing: 0) {
                MetadataRow(label: "Created By", value: schedule.createdBy)
                Divider().padding(.leading, 16)
                MetadataRow(label: "Created", value: schedule.createdAt.formattedDateTime())
                Divider().padding(.leading, 16)
                MetadataRow(label: "Last Updated", value: schedule.updatedAt.formattedDateTime())
            }
            .background(Color(.systemBackground))
            .cornerRadius(12)
        }
    }

    private var actionsSection: some View {
        VStack(spacing: 12) {
            if schedule.status != .completed {
                Button {
                    Task {
                        await updateStatus(.completed)
                    }
                } label: {
                    Label("Mark as Completed", systemImage: "checkmark.circle.fill")
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.green)
                        .foregroundColor(.white)
                        .cornerRadius(12)
                }
            }

            if schedule.status == .scheduled {
                Button {
                    Task {
                        await updateStatus(.inProgress)
                    }
                } label: {
                    Label("Start", systemImage: "play.circle.fill")
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.blue)
                        .foregroundColor(.white)
                        .cornerRadius(12)
                }
            }
        }
    }

    // MARK: - Helper Views

    struct TimeRow: View {
        let icon: String
        let label: String
        let value: String

        var body: some View {
            HStack {
                Image(systemName: icon)
                    .foregroundColor(.blue)
                    .frame(width: 24)

                Text(label)
                    .foregroundColor(.secondary)

                Spacer()

                Text(value)
                    .fontWeight(.medium)
            }
        }
    }

    struct MetadataRow: View {
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
            .padding()
        }
    }

    struct Badge: View {
        let text: String
        let color: Color

        var body: some View {
            Text(text)
                .font(.caption)
                .fontWeight(.semibold)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(color.opacity(0.2))
                .foregroundColor(color)
                .cornerRadius(8)
        }
    }

    // MARK: - Actions

    private func updateStatus(_ newStatus: ScheduleStatus) async {
        var updated = schedule
        updated.status = newStatus
        updated.updatedAt = Date()

        await viewModel.updateSchedule(updated)
        dismiss()
    }

    private func deleteSchedule() async {
        await viewModel.deleteSchedule(schedule.id)
        dismiss()
    }

    private func openInMaps(_ location: ScheduleLocation) {
        let coordinate = location.coordinates
        let mapItem = MKMapItem(placemark: MKPlacemark(coordinate: coordinate))
        mapItem.name = location.name
        mapItem.openInMaps(launchOptions: nil)
    }

    // MARK: - Helpers

    private func statusColor(_ status: ScheduleStatus) -> Color {
        switch status {
        case .scheduled: return .blue
        case .confirmed: return .green
        case .inProgress: return .orange
        case .completed: return .gray
        case .cancelled: return .red
        case .delayed: return .purple
        }
    }

    private func participantStatusColor(_ status: ParticipantStatus) -> Color {
        switch status {
        case .invited: return .gray
        case .accepted: return .green
        case .declined: return .red
        case .tentative: return .orange
        }
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

// MARK: - ScheduleLocation Identifiable Extension

extension ScheduleLocation: Identifiable {
    var id: String {
        "\(latitude),\(longitude)"
    }
}
