//
//  AssignmentHistoryView.swift
//  Fleet Manager - iOS Native App
//
//  Historical assignment records and audit trail
//

import SwiftUI

struct AssignmentHistoryView: View {
    @ObservedObject var viewModel: VehicleAssignmentViewModel
    let assignmentId: String?

    @State private var selectedFilter: HistoryFilter = .all

    var filteredHistory: [AssignmentHistory] {
        var result = viewModel.history

        switch selectedFilter {
        case .all:
            break
        case .created:
            result = result.filter { $0.action == .created }
        case .approved:
            result = result.filter { $0.action == .approved }
        case .modified:
            result = result.filter { [.extended, .reassigned].contains($0.action) }
        case .completed:
            result = result.filter { $0.action == .completed }
        }

        return result.sorted { $0.timestamp > $1.timestamp }
    }

    var body: some View {
        VStack(spacing: 0) {
            // Filter Picker
            Picker("Filter", selection: $selectedFilter) {
                ForEach(HistoryFilter.allCases, id: \.self) { filter in
                    Text(filter.rawValue).tag(filter)
                }
            }
            .pickerStyle(SegmentedPickerStyle())
            .padding()

            // History List
            if filteredHistory.isEmpty {
                EmptyStateView(
                    icon: "clock.fill",
                    title: "No History",
                    message: "No history records found for this assignment."
                )
            } else {
                List {
                    ForEach(filteredHistory) { historyItem in
                        HistoryRow(item: historyItem)
                    }
                }
                .listStyle(PlainListStyle())
            }
        }
        .navigationTitle("Assignment History")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            if let assignmentId = assignmentId {
                await viewModel.fetchHistory(for: assignmentId)
            }
        }
    }
}

// MARK: - History Filter
enum HistoryFilter: String, CaseIterable {
    case all = "All"
    case created = "Created"
    case approved = "Approved"
    case modified = "Modified"
    case completed = "Completed"
}

// MARK: - History Row
struct HistoryRow: View {
    let item: AssignmentHistory

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            // Timeline Dot
            ZStack {
                Circle()
                    .fill(actionColor)
                    .frame(width: 40, height: 40)

                Image(systemName: item.action.icon)
                    .foregroundColor(.white)
                    .font(.system(size: 18))
            }

            VStack(alignment: .leading, spacing: 8) {
                // Header
                HStack {
                    Text(item.action.displayName)
                        .font(.headline)
                        .foregroundColor(actionColor)

                    Spacer()

                    Text(formatTimestamp(item.timestamp))
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                // Details
                VStack(alignment: .leading, spacing: 4) {
                    if !item.performedBy.isEmpty {
                        HStack {
                            Image(systemName: "person.fill")
                                .font(.caption)
                                .foregroundColor(.secondary)
                            Text("By: \(item.performedBy)")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        }
                    }

                    if let notes = item.notes {
                        Text(notes)
                            .font(.subheadline)
                            .foregroundColor(.primary)
                            .padding(.top, 2)
                    }

                    // Metadata
                    if let metadata = item.metadata, !metadata.isEmpty {
                        VStack(alignment: .leading, spacing: 4) {
                            ForEach(Array(metadata.keys.sorted()), id: \.self) { key in
                                HStack {
                                    Text("\(key):")
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                    Text(metadata[key] ?? "")
                                        .font(.caption)
                                        .foregroundColor(.primary)
                                }
                            }
                        }
                        .padding(.top, 4)
                    }
                }
                .padding(.leading, 4)
            }
        }
        .padding(.vertical, 8)
    }

    private var actionColor: Color {
        switch item.action {
        case .created:
            return .blue
        case .approved:
            return .green
        case .denied:
            return .red
        case .started:
            return .purple
        case .completed:
            return .teal
        case .cancelled:
            return .gray
        case .extended:
            return .orange
        case .reassigned:
            return .indigo
        case .checkedOut:
            return .cyan
        case .checkedIn:
            return .mint
        }
    }

    private func formatTimestamp(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }
}

// MARK: - Timeline View (Alternative Presentation)
struct TimelineHistoryView: View {
    let history: [AssignmentHistory]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                ForEach(Array(history.enumerated()), id: \.element.id) { index, item in
                    HStack(alignment: .top, spacing: 0) {
                        // Timeline Line
                        VStack(spacing: 0) {
                            if index > 0 {
                                Rectangle()
                                    .fill(Color.gray.opacity(0.3))
                                    .frame(width: 2, height: 20)
                            }

                            Circle()
                                .fill(actionColor(for: item.action))
                                .frame(width: 12, height: 12)

                            if index < history.count - 1 {
                                Rectangle()
                                    .fill(Color.gray.opacity(0.3))
                                    .frame(width: 2)
                            }
                        }
                        .frame(width: 30)
                        .padding(.leading, 16)

                        // Content
                        VStack(alignment: .leading, spacing: 8) {
                            HStack {
                                Text(item.action.displayName)
                                    .font(.headline)

                                Spacer()

                                Text(formatRelativeTime(item.timestamp))
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }

                            if let notes = item.notes {
                                Text(notes)
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)
                            }

                            Text("by \(item.performedBy)")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                        .padding()
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(
                            RoundedRectangle(cornerRadius: 8)
                                .fill(Color(.systemGray6))
                        )
                        .padding(.trailing, 16)
                        .padding(.bottom, 8)
                    }
                }
            }
            .padding(.vertical)
        }
    }

    private func actionColor(for action: AssignmentAction) -> Color {
        switch action {
        case .created: return .blue
        case .approved: return .green
        case .denied: return .red
        case .started: return .purple
        case .completed: return .teal
        case .cancelled: return .gray
        case .extended: return .orange
        case .reassigned: return .indigo
        case .checkedOut: return .cyan
        case .checkedIn: return .mint
        }
    }

    private func formatRelativeTime(_ date: Date) -> String {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .abbreviated
        return formatter.localizedString(for: date, relativeTo: Date())
    }
}

// MARK: - Preview
#Preview {
    NavigationView {
        AssignmentHistoryView(
            viewModel: VehicleAssignmentViewModel(),
            assignmentId: "assignment-001"
        )
    }
}
