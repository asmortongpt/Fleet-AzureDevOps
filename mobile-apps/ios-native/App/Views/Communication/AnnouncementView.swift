import SwiftUI

/// Fleet-wide announcements view
struct AnnouncementView: View {
    @StateObject private var service = CommunicationService.shared
    @State private var showingNewAnnouncement = false
    @State private var selectedFilter: AnnouncementFilter = .all

    enum AnnouncementFilter: String, CaseIterable {
        case all = "All"
        case unread = "Unread"
        case urgent = "Urgent"
    }

    var filteredAnnouncements: [Announcement] {
        let announcements = service.announcements.filter { $0.isActive }

        switch selectedFilter {
        case .all:
            return announcements
        case .unread:
            return announcements.filter { !$0.readBy.contains("current-user-id") }
        case .urgent:
            return announcements.filter { $0.priority == .urgent }
        }
    }

    var body: some View {
        NavigationView {
            VStack {
                Picker("Filter", selection: $selectedFilter) {
                    ForEach(AnnouncementFilter.allCases, id: \.self) { filter in
                        Text(filter.rawValue).tag(filter)
                    }
                }
                .pickerStyle(.segmented)
                .padding()

                if filteredAnnouncements.isEmpty {
                    emptyStateView
                } else {
                    List {
                        ForEach(filteredAnnouncements) { announcement in
                            announcementRow(announcement)
                        }
                    }
                }
            }
            .navigationTitle("Announcements")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        showingNewAnnouncement = true
                    } label: {
                        Image(systemName: "megaphone.fill")
                    }
                }
            }
            .sheet(isPresented: $showingNewAnnouncement) {
                NewAnnouncementView()
            }
        }
    }

    private func announcementRow(_ announcement: Announcement) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: announcement.type.icon)
                    .foregroundColor(colorForType(announcement.type))

                Text(announcement.title)
                    .font(.headline)

                Spacer()

                if announcement.priority == .urgent {
                    Image(systemName: "exclamationmark.circle.fill")
                        .foregroundColor(.red)
                }
            }

            Text(announcement.body)
                .font(.subheadline)
                .foregroundColor(.secondary)
                .lineLimit(2)

            HStack {
                Text(announcement.publishedAt, style: .relative)
                    .font(.caption)
                    .foregroundColor(.secondary)

                if announcement.requiresAcknowledgment {
                    Spacer()

                    if announcement.acknowledgedBy.contains("current-user-id") {
                        Label("Acknowledged", systemImage: "checkmark.circle.fill")
                            .font(.caption)
                            .foregroundColor(.green)
                    } else {
                        Button {
                            acknowledgeAnnouncement(announcement)
                        } label: {
                            Label("Acknowledge", systemImage: "hand.raised")
                                .font(.caption)
                        }
                    }
                }
            }
        }
        .padding(.vertical, 4)
    }

    private var emptyStateView: some View {
        VStack(spacing: 20) {
            Image(systemName: "megaphone")
                .font(.system(size: 60))
                .foregroundColor(.secondary)

            Text("No Announcements")
                .font(.title2)
                .fontWeight(.bold)
        }
    }

    private func acknowledgeAnnouncement(_ announcement: Announcement) {
        Task {
            await service.acknowledgeAnnouncement(announcement.id)
        }
    }

    private func colorForType(_ type: AnnouncementType) -> Color {
        switch type {
        case .general: return .blue
        case .safety: return .orange
        case .policy: return .purple
        case .maintenance: return .yellow
        case .weather: return .cyan
        case .emergency: return .red
        }
    }
}

struct NewAnnouncementView: View {
    @Environment(\.dismiss) var dismiss
    @State private var title = ""
    @State private var body = ""
    @State private var type: AnnouncementType = .general
    @State private var priority: MessagePriority = .normal
    @State private var requiresAck = false

    var body: some View {
        NavigationView {
            Form {
                TextField("Title", text: $title)

                TextEditor(text: $body)
                    .frame(minHeight: 100)

                Picker("Type", selection: $type) {
                    ForEach(AnnouncementType.allCases, id: \.self) { type in
                        Label(type.displayName, systemImage: type.icon).tag(type)
                    }
                }

                Picker("Priority", selection: $priority) {
                    ForEach([MessagePriority.normal, .high, .urgent], id: \.self) { priority in
                        Text(priority.rawValue.capitalized).tag(priority)
                    }
                }

                Toggle("Require Acknowledgment", isOn: $requiresAck)
            }
            .navigationTitle("New Announcement")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Publish") { publishAnnouncement() }
                        .disabled(title.isEmpty || body.isEmpty)
                }
            }
        }
    }

    private func publishAnnouncement() {
        Task {
            try? await CommunicationService.shared.createAnnouncement(
                title: title,
                body: body,
                type: type,
                priority: priority,
                targetAudience: [], // All users
                requiresAcknowledgment: requiresAck
            )
            dismiss()
        }
    }
}

struct AnnouncementView_Previews: PreviewProvider {
    static var previews: some View {
        AnnouncementView()
    }
}
