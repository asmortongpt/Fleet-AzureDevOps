//
//  VehicleAssignmentView.swift
//  Fleet Manager - iOS Native App
//
//  Main view for displaying and managing vehicle assignments
//  Includes filtering, search, and conflict detection
//

import SwiftUI

struct VehicleAssignmentView: View {
    @StateObject private var viewModel = VehicleAssignmentViewModel()
    @State private var showCreateAssignment = false
    @State private var showFilters = false
    @State private var showRequests = false
    @State private var showHistory = false
    @State private var selectedSegment = 0

    var body: some View {
        NavigationView {
            ZStack {
                VStack(spacing: 0) {
                    // Statistics Cards
                    StatisticsBar(viewModel: viewModel)
                        .padding()

                    // Segment Control
                    Picker("View", selection: $selectedSegment) {
                        Text("Assignments").tag(0)
                        Text("Requests (\(viewModel.pendingRequests))").tag(1)
                        Text("Conflicts (\(viewModel.totalConflicts))").tag(2)
                    }
                    .pickerStyle(SegmentedPickerStyle())
                    .padding(.horizontal)

                    // Quick Filters
                    QuickFiltersBar(viewModel: viewModel)
                        .padding(.horizontal)
                        .padding(.top, 8)

                    // Main Content
                    TabView(selection: $selectedSegment) {
                        AssignmentsListView(viewModel: viewModel)
                            .tag(0)

                        RequestsListView(viewModel: viewModel)
                            .tag(1)

                        ConflictsListView(viewModel: viewModel)
                            .tag(2)
                    }
                    .tabViewStyle(PageTabViewStyle(indexDisplayMode: .never))
                }

                // Loading Overlay
                if viewModel.loadingState.isLoading {
                    LoadingOverlay()
                }
            }
            .navigationTitle("Vehicle Assignments")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button(action: { showFilters.toggle() }) {
                        Image(systemName: "line.3.horizontal.decrease.circle")
                    }
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { showCreateAssignment.toggle() }) {
                        Image(systemName: "plus.circle.fill")
                    }
                }
            }
            .refreshable {
                await viewModel.refresh()
            }
            .task {
                if viewModel.assignments.isEmpty {
                    await viewModel.refresh()
                }
            }
            .sheet(isPresented: $showCreateAssignment) {
                CreateAssignmentView(viewModel: viewModel)
            }
            .sheet(isPresented: $showFilters) {
                AssignmentFiltersView(viewModel: viewModel)
            }
            .alert("Error", isPresented: .constant(viewModel.loadingState.hasError)) {
                Button("OK") {
                    viewModel.resetError()
                }
            } message: {
                Text(viewModel.errorMessage ?? "An error occurred")
            }
        }
    }
}

// MARK: - Statistics Bar
struct StatisticsBar: View {
    @ObservedObject var viewModel: VehicleAssignmentViewModel

    var body: some View {
        HStack(spacing: 12) {
            StatCard(
                title: "Total",
                value: "\(viewModel.totalAssignments)",
                icon: "car.fill",
                color: .blue
            )

            StatCard(
                title: "Active",
                value: "\(viewModel.activeAssignments)",
                icon: "checkmark.circle.fill",
                color: .green
            )

            StatCard(
                title: "Pending",
                value: "\(viewModel.pendingRequests)",
                icon: "clock.fill",
                color: .orange
            )

            StatCard(
                title: "Conflicts",
                value: "\(viewModel.totalConflicts)",
                icon: "exclamationmark.triangle.fill",
                color: .red
            )
        }
    }
}

struct StatCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color

    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.system(size: 20))
                .foregroundColor(color)

            Text(value)
                .font(.system(size: 20, weight: .bold))
                .foregroundColor(.primary)

            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color(.systemBackground))
                .shadow(color: Color.black.opacity(0.05), radius: 5, x: 0, y: 2)
        )
    }
}

// MARK: - Quick Filters Bar
struct QuickFiltersBar: View {
    @ObservedObject var viewModel: VehicleAssignmentViewModel

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(QuickFilter.allCases, id: \.self) { filter in
                    QuickFilterButton(filter: filter, viewModel: viewModel)
                }

                Button(action: { viewModel.resetFilters() }) {
                    HStack {
                        Image(systemName: "xmark.circle.fill")
                        Text("Clear")
                    }
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(
                        Capsule()
                            .stroke(Color.secondary.opacity(0.3), lineWidth: 1)
                    )
                }
            }
        }
    }
}

struct QuickFilterButton: View {
    let filter: QuickFilter
    @ObservedObject var viewModel: VehicleAssignmentViewModel

    private var isActive: Bool {
        switch filter {
        case .active:
            return viewModel.showOnlyActive
        case .pending:
            return viewModel.filterStatus == .pending
        case .conflicts:
            return viewModel.showOnlyConflicts
        case .permanent:
            return viewModel.filterType == .permanent
        case .temporary:
            return viewModel.filterType == .temporary
        }
    }

    var body: some View {
        Button(action: { viewModel.applyQuickFilter(filter) }) {
            HStack {
                Image(systemName: filter.icon)
                Text(filter.rawValue)
            }
            .font(.subheadline)
            .fontWeight(isActive ? .semibold : .regular)
            .foregroundColor(isActive ? .white : filter.color)
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(
                Capsule()
                    .fill(isActive ? filter.color : Color.clear)
            )
            .overlay(
                Capsule()
                    .stroke(filter.color, lineWidth: 1.5)
            )
        }
    }
}

// MARK: - Assignments List View
struct AssignmentsListView: View {
    @ObservedObject var viewModel: VehicleAssignmentViewModel

    var body: some View {
        Group {
            if viewModel.filteredAssignments.isEmpty {
                EmptyStateView(
                    icon: "car.fill",
                    title: "No Assignments",
                    message: "No vehicle assignments found. Create one to get started."
                )
            } else {
                List {
                    ForEach(viewModel.filteredAssignments) { assignment in
                        NavigationLink(destination: AssignmentDetailView(assignment: assignment, viewModel: viewModel)) {
                            AssignmentRow(assignment: assignment, viewModel: viewModel)
                        }
                        .swipeActions(edge: .trailing, allowsFullSwipe: false) {
                            Button(role: .destructive) {
                                Task {
                                    _ = await viewModel.deleteAssignment(assignment)
                                }
                            } label: {
                                Label("Delete", systemImage: "trash")
                            }
                        }
                    }
                }
                .listStyle(PlainListStyle())
            }
        }
    }
}

// MARK: - Assignment Row
struct AssignmentRow: View {
    let assignment: VehicleAssignment
    @ObservedObject var viewModel: VehicleAssignmentViewModel

    var hasConflict: Bool {
        viewModel.conflicts.contains { conflict in
            conflict.assignment1.id == assignment.id || conflict.assignment2.id == assignment.id
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                // Type Icon
                Image(systemName: assignment.assignmentType.icon)
                    .font(.system(size: 24))
                    .foregroundColor(assignment.assignmentType.color)
                    .frame(width: 40, height: 40)
                    .background(
                        Circle()
                            .fill(assignment.assignmentType.color.opacity(0.1))
                    )

                VStack(alignment: .leading, spacing: 4) {
                    Text("Vehicle: \(assignment.vehicleId)")
                        .font(.headline)

                    Text("Assigned to: \(assignment.assignedTo)")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 4) {
                    StatusBadge(status: assignment.status)

                    if hasConflict {
                        HStack(spacing: 4) {
                            Image(systemName: "exclamationmark.triangle.fill")
                                .font(.caption)
                            Text("Conflict")
                                .font(.caption)
                        }
                        .foregroundColor(.red)
                    }
                }
            }

            HStack {
                Label(assignment.assignmentType.displayName, systemImage: assignment.assignmentType.icon)
                    .font(.caption)
                    .foregroundColor(assignment.assignmentType.color)

                Spacer()

                Text(formatDateRange(assignment.startDate, assignment.endDate))
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            if let purpose = assignment.purpose {
                Text(purpose)
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .lineLimit(1)
            }
        }
        .padding(.vertical, 4)
    }

    private func formatDateRange(_ start: Date, _ end: Date?) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .short

        if let end = end {
            return "\(formatter.string(from: start)) - \(formatter.string(from: end))"
        } else {
            return "From \(formatter.string(from: start))"
        }
    }
}

// MARK: - Requests List View
struct RequestsListView: View {
    @ObservedObject var viewModel: VehicleAssignmentViewModel

    var body: some View {
        Group {
            if viewModel.pendingRequestsList.isEmpty {
                EmptyStateView(
                    icon: "tray.fill",
                    title: "No Pending Requests",
                    message: "All assignment requests have been processed."
                )
            } else {
                List {
                    ForEach(viewModel.pendingRequestsList) { request in
                        NavigationLink(destination: AssignmentApprovalView(request: request, viewModel: viewModel)) {
                            RequestRow(request: request)
                        }
                    }
                }
                .listStyle(PlainListStyle())
            }
        }
    }
}

// MARK: - Request Row
struct RequestRow: View {
    let request: AssignmentRequest

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: request.assignmentType.icon)
                    .font(.system(size: 24))
                    .foregroundColor(request.assignmentType.color)
                    .frame(width: 40, height: 40)
                    .background(
                        Circle()
                            .fill(request.assignmentType.color.opacity(0.1))
                    )

                VStack(alignment: .leading, spacing: 4) {
                    Text("Request by: \(request.requestedBy)")
                        .font(.headline)

                    if let vehicleId = request.vehicleId {
                        Text("Vehicle: \(vehicleId)")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    } else if let type = request.vehicleType {
                        Text("Type: \(type)")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                }

                Spacer()

                StatusBadge(status: request.status)
            }

            Text(request.purpose)
                .font(.subheadline)
                .foregroundColor(.primary)

            HStack {
                Label(request.assignmentType.displayName, systemImage: request.assignmentType.icon)
                    .font(.caption)
                    .foregroundColor(request.assignmentType.color)

                Spacer()

                Text(formatDate(request.requestedAt))
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding(.vertical, 4)
    }

    private func formatDate(_ date: Date) -> String {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .abbreviated
        return formatter.localizedString(for: date, relativeTo: Date())
    }
}

// MARK: - Conflicts List View
struct ConflictsListView: View {
    @ObservedObject var viewModel: VehicleAssignmentViewModel

    var body: some View {
        Group {
            if viewModel.conflicts.isEmpty {
                EmptyStateView(
                    icon: "checkmark.circle.fill",
                    title: "No Conflicts",
                    message: "All assignments are properly scheduled without conflicts.",
                    iconColor: .green
                )
            } else {
                List {
                    ForEach(viewModel.conflicts) { conflict in
                        ConflictRow(conflict: conflict)
                    }
                }
                .listStyle(PlainListStyle())
            }
        }
    }
}

// MARK: - Conflict Row
struct ConflictRow: View {
    let conflict: AssignmentConflict

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "exclamationmark.triangle.fill")
                    .foregroundColor(.red)
                Text(conflict.conflictType.displayName)
                    .font(.headline)
                    .foregroundColor(.red)
                Spacer()
                Text("\(conflict.overlapDays) days")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            ConflictAssignmentInfo(assignment: conflict.assignment1, label: "Assignment 1")

            Divider()

            ConflictAssignmentInfo(assignment: conflict.assignment2, label: "Assignment 2")

            Text("Overlap: \(formatDateRange(conflict.overlapPeriod))")
                .font(.caption)
                .foregroundColor(.orange)
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(
                    RoundedRectangle(cornerRadius: 4)
                        .fill(Color.orange.opacity(0.1))
                )
        }
        .padding(.vertical, 8)
    }

    private func formatDateRange(_ interval: DateInterval) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .short
        return "\(formatter.string(from: interval.start)) - \(formatter.string(from: interval.end))"
    }
}

struct ConflictAssignmentInfo: View {
    let assignment: VehicleAssignment
    let label: String

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label)
                .font(.caption)
                .foregroundColor(.secondary)

            HStack {
                Label(assignment.vehicleId, systemImage: "car.fill")
                    .font(.subheadline)
                Spacer()
                StatusBadge(status: assignment.status)
            }

            Text("Assigned to: \(assignment.assignedTo)")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding(8)
        .background(
            RoundedRectangle(cornerRadius: 8)
                .fill(Color(.systemGray6))
        )
    }
}

// MARK: - Status Badge
struct StatusBadge: View {
    let status: VehicleAssignmentStatus

    init(status: VehicleAssignmentStatus) {
        self.status = status
    }

    init(status: RequestStatus) {
        switch status {
        case .pending:
            self.status = .pending
        case .approved:
            self.status = .active
        case .denied:
            self.status = .cancelled
        case .cancelled:
            self.status = .cancelled
        }
    }

    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: status.icon)
                .font(.caption)
            Text(status.displayName)
                .font(.caption)
                .fontWeight(.medium)
        }
        .foregroundColor(status.color)
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(
            Capsule()
                .fill(status.color.opacity(0.15))
        )
    }
}

// MARK: - Empty State View
struct EmptyStateView: View {
    let icon: String
    let title: String
    let message: String
    var iconColor: Color = .gray

    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: icon)
                .font(.system(size: 60))
                .foregroundColor(iconColor.opacity(0.5))

            Text(title)
                .font(.title2)
                .fontWeight(.semibold)

            Text(message)
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

// MARK: - Loading Overlay
struct LoadingOverlay: View {
    var body: some View {
        ZStack {
            Color.black.opacity(0.3)
                .ignoresSafeArea()

            ProgressView()
                .scaleEffect(1.5)
                .progressViewStyle(CircularProgressViewStyle(tint: .white))
        }
    }
}

// MARK: - Assignment Detail View Placeholder
struct AssignmentDetailView: View {
    let assignment: VehicleAssignment
    @ObservedObject var viewModel: VehicleAssignmentViewModel

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                Text("Assignment Details")
                    .font(.title)
                    .fontWeight(.bold)

                Text("Full details view coming soon...")
                    .foregroundColor(.secondary)
            }
            .padding()
        }
        .navigationTitle("Assignment Detail")
        .navigationBarTitleDisplayMode(.inline)
    }
}

// MARK: - Preview
#Preview {
    VehicleAssignmentView()
}
