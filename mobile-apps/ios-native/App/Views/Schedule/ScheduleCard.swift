import SwiftUI

struct ScheduleCard: View {
    let schedule: ScheduleEntry
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 12) {
                // Type indicator bar
                RoundedRectangle(cornerRadius: 4)
                    .fill(Color(schedule.type.colorName))
                    .frame(width: 4)

                VStack(alignment: .leading, spacing: 8) {
                    // Header with time and type
                    HStack {
                        Image(systemName: schedule.type.icon)
                            .font(.body)
                            .foregroundColor(Color(schedule.type.colorName))

                        Text(schedule.startDate.formattedTime())
                            .font(.subheadline)
                            .fontWeight(.semibold)
                            .foregroundColor(.secondary)

                        Spacer()

                        // Priority badge
                        if schedule.priority != .normal {
                            priorityBadge
                        }

                        // Status badge
                        statusBadge
                    }

                    // Title
                    Text(schedule.title)
                        .font(.body)
                        .fontWeight(.semibold)
                        .foregroundColor(.primary)
                        .lineLimit(2)

                    // Description preview
                    if let description = schedule.description, !description.isEmpty {
                        Text(description)
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .lineLimit(2)
                    }

                    // Footer with participants and duration
                    HStack(spacing: 12) {
                        if !schedule.participants.isEmpty {
                            Label("\(schedule.participants.count)", systemImage: "person.fill")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }

                        if let location = schedule.location {
                            Label(location.name, systemImage: "mappin.circle.fill")
                                .font(.caption)
                                .foregroundColor(.secondary)
                                .lineLimit(1)
                        }

                        Spacer()

                        Text(formatDuration(schedule.duration))
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }

                    // Overdue warning
                    if schedule.isOverdue {
                        HStack {
                            Image(systemName: "exclamationmark.triangle.fill")
                                .foregroundColor(.red)
                            Text("Overdue")
                                .font(.caption)
                                .fontWeight(.semibold)
                                .foregroundColor(.red)
                        }
                    }
                }
                .padding(.vertical, 4)
            }
            .padding()
            .background(Color(.systemBackground))
            .cornerRadius(12)
            .shadow(color: Color.black.opacity(0.05), radius: 5, x: 0, y: 2)
        }
        .buttonStyle(.plain)
    }

    private var priorityBadge: some View {
        Text(schedule.priority.rawValue)
            .font(.caption2)
            .fontWeight(.bold)
            .padding(.horizontal, 6)
            .padding(.vertical, 3)
            .background(Color(schedule.priority.colorName).opacity(0.2))
            .foregroundColor(Color(schedule.priority.colorName))
            .cornerRadius(4)
    }

    private var statusBadge: some View {
        HStack(spacing: 4) {
            Circle()
                .fill(statusColor)
                .frame(width: 6, height: 6)

            Text(schedule.status.rawValue)
                .font(.caption2)
                .fontWeight(.medium)
                .foregroundColor(statusColor)
        }
    }

    private var statusColor: Color {
        switch schedule.status {
        case .scheduled: return .blue
        case .confirmed: return .green
        case .inProgress: return .orange
        case .completed: return .gray
        case .cancelled: return .red
        case .delayed: return .purple
        }
    }

    private func formatDuration(_ duration: TimeInterval) -> String {
        let hours = Int(duration / 3600)
        let minutes = Int((duration.truncatingRemainder(dividingBy: 3600)) / 60)

        if hours > 0 {
            return "\(hours)h \(minutes)m"
        } else {
            return "\(minutes)m"
        }
    }
}

// MARK: - Preview

struct ScheduleCard_Previews: PreviewProvider {
    static var previews: some View {
        VStack(spacing: 12) {
            ScheduleCard(
                schedule: ScheduleEntry(
                    id: "1",
                    type: .shift,
                    title: "Morning Delivery Route",
                    description: "Downtown delivery run with 15 stops",
                    startDate: Date(),
                    endDate: Date().addingTimeInterval(3600 * 8),
                    status: .scheduled,
                    priority: .high,
                    participants: [
                        Participant(
                            id: "1",
                            name: "John Driver",
                            role: .driver,
                            status: .accepted,
                            userId: "driver-001"
                        )
                    ],
                    location: ScheduleLocation(
                        name: "Main Depot",
                        address: "123 Fleet St",
                        coordinates: CLLocationCoordinate2D(latitude: 40.7128, longitude: -74.0060)
                    ),
                    recurrence: nil,
                    reminders: [],
                    attachments: [],
                    metadata: [:],
                    createdBy: "system",
                    createdAt: Date(),
                    updatedAt: Date()
                ),
                onTap: {}
            )

            ScheduleCard(
                schedule: ScheduleEntry(
                    id: "2",
                    type: .maintenance,
                    title: "Vehicle FL-101 Oil Change",
                    description: nil,
                    startDate: Date().addingTimeInterval(7200),
                    endDate: Date().addingTimeInterval(9000),
                    status: .confirmed,
                    priority: .normal,
                    participants: [],
                    location: nil,
                    recurrence: nil,
                    reminders: [],
                    attachments: [],
                    metadata: [:],
                    createdBy: "system",
                    createdAt: Date(),
                    updatedAt: Date()
                ),
                onTap: {}
            )
        }
        .padding()
        .background(Color(.systemGroupedBackground))
    }
}
