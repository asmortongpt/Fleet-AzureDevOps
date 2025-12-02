//
//  TaskDetailView.swift
//  Fleet Manager - iOS Native App
//
//  Detailed task view with comments, checklist, attachments, and time tracking
//

import SwiftUI

struct TaskDetailView: View {
    let task: Task
    @ObservedObject var viewModel: TaskViewModel
    @Environment(\.dismiss) private var dismiss

    @State private var showingEditTask = false
    @State private var showingAssignUser = false
    @State private var showingStatusPicker = false
    @State private var newComment = ""
    @State private var newChecklistItem = ""
    @State private var showingDeleteAlert = false

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    // Header Section
                    taskHeader

                    // Status and Priority
                    statusPrioritySection

                    // Details Section
                    detailsSection

                    // Progress Section
                    if task.hasChecklistItems {
                        progressSection
                    }

                    // Checklist Section
                    checklistSection

                    // Time Tracking Section
                    timeTrackingSection

                    // Comments Section
                    commentsSection

                    // Attachments Section
                    if task.hasAttachments {
                        attachmentsSection
                    }

                    // Metadata Section
                    metadataSection
                }
                .padding()
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle("Task Details")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Close") {
                        dismiss()
                    }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Menu {
                        Button(action: { showingEditTask = true }) {
                            Label("Edit Task", systemImage: "pencil")
                        }

                        if task.status != .completed {
                            Button(action: {
                                viewModel.updateStatus(task, to: .completed)
                                dismiss()
                            }) {
                                Label("Mark Complete", systemImage: "checkmark.circle.fill")
                            }
                        }

                        Divider()

                        Button(role: .destructive, action: { showingDeleteAlert = true }) {
                            Label("Delete Task", systemImage: "trash")
                        }
                    } label: {
                        Image(systemName: "ellipsis.circle")
                    }
                }
            }
            .alert("Delete Task", isPresented: $showingDeleteAlert) {
                Button("Cancel", role: .cancel) { }
                Button("Delete", role: .destructive) {
                    viewModel.deleteTask(task)
                    dismiss()
                }
            } message: {
                Text("Are you sure you want to delete this task? This action cannot be undone.")
            }
        }
    }

    // MARK: - Task Header
    private var taskHeader: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: task.category.icon)
                    .font(.title2)
                    .foregroundColor(task.category.color)
                    .frame(width: 40, height: 40)
                    .background(task.category.color.opacity(0.2))
                    .cornerRadius(8)

                VStack(alignment: .leading, spacing: 4) {
                    Text(task.category.rawValue)
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text(task.title)
                        .font(.title3.bold())
                }

                Spacer()
            }

            if let description = task.description {
                Text(description)
                    .font(.body)
                    .foregroundColor(.secondary)
            }

            // Tags
            if !task.tags.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(task.tags, id: \.self) { tag in
                            Text(tag)
                                .font(.caption)
                                .padding(.horizontal, 10)
                                .padding(.vertical, 4)
                                .background(Color.gray.opacity(0.2))
                                .foregroundColor(.secondary)
                                .cornerRadius(12)
                        }
                    }
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(12)
    }

    // MARK: - Status and Priority Section
    private var statusPrioritySection: some View {
        VStack(spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Status")
                        .font(.caption)
                        .foregroundColor(.secondary)

                    Button(action: { showingStatusPicker = true }) {
                        HStack {
                            Image(systemName: task.status.icon)
                            Text(task.status.rawValue)
                            Spacer()
                            Image(systemName: "chevron.right")
                                .font(.caption)
                        }
                        .padding()
                        .background(task.status.color.opacity(0.2))
                        .foregroundColor(task.status.color)
                        .cornerRadius(8)
                    }
                }

                VStack(alignment: .leading, spacing: 8) {
                    Text("Priority")
                        .font(.caption)
                        .foregroundColor(.secondary)

                    HStack {
                        Image(systemName: task.priority.icon)
                        Text(task.priority.rawValue)
                    }
                    .padding()
                    .frame(maxWidth: .infinity)
                    .background(task.priority.color.opacity(0.2))
                    .foregroundColor(task.priority.color)
                    .cornerRadius(8)
                }
            }

            if task.isOverdue {
                HStack {
                    Image(systemName: "exclamationmark.triangle.fill")
                    if let days = task.daysUntilDue {
                        Text("Overdue by \(abs(days)) day\(abs(days) == 1 ? "" : "s")")
                            .font(.subheadline.bold())
                    }
                }
                .foregroundColor(.red)
                .padding()
                .frame(maxWidth: .infinity)
                .background(Color.red.opacity(0.1))
                .cornerRadius(8)
            }
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(12)
        .sheet(isPresented: $showingStatusPicker) {
            StatusPickerView(currentStatus: task.status) { newStatus in
                viewModel.updateStatus(task, to: newStatus)
            }
        }
    }

    // MARK: - Details Section
    private var detailsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Details")
                .font(.headline)

            VStack(spacing: 12) {
                // Assignee
                DetailRow(
                    icon: "person.fill",
                    title: "Assignee",
                    value: task.assigneeName ?? "Unassigned",
                    color: .blue
                ) {
                    showingAssignUser = true
                }

                Divider()

                // Vehicle
                if let vehicleNumber = task.vehicleNumber {
                    DetailRow(
                        icon: "car.fill",
                        title: "Vehicle",
                        value: vehicleNumber,
                        color: .orange
                    )
                    Divider()
                }

                // Due Date
                if let dueDate = task.dueDate {
                    DetailRow(
                        icon: "calendar",
                        title: "Due Date",
                        value: dueDate.formatted(date: .abbreviated, time: .omitted),
                        color: task.isOverdue ? .red : .purple
                    )
                    Divider()
                }

                // Estimated Hours
                if let estimatedHours = task.estimatedHours {
                    DetailRow(
                        icon: "clock.fill",
                        title: "Estimated",
                        value: String(format: "%.1f hours", estimatedHours),
                        color: .green
                    )
                    Divider()
                }

                // Actual Hours
                if let actualHours = task.actualHours {
                    DetailRow(
                        icon: "clock.badge.checkmark.fill",
                        title: "Actual",
                        value: String(format: "%.1f hours", actualHours),
                        color: .teal
                    )
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(12)
        .sheet(isPresented: $showingAssignUser) {
            AssignUserView(users: viewModel.users) { userId in
                viewModel.assignTask(task, to: userId)
            }
        }
    }

    // MARK: - Progress Section
    private var progressSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Progress")
                .font(.headline)

            VStack(spacing: 8) {
                HStack {
                    Text("\(task.progressPercentage)%")
                        .font(.title.bold())
                        .foregroundColor(task.category.color)

                    Spacer()

                    Text("\(task.checklistItems.filter { $0.isCompleted }.count) / \(task.checklistItems.count)")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }

                GeometryReader { geometry in
                    ZStack(alignment: .leading) {
                        Rectangle()
                            .fill(Color.gray.opacity(0.2))
                            .frame(height: 8)

                        Rectangle()
                            .fill(task.category.color)
                            .frame(width: geometry.size.width * CGFloat(task.progressPercentage) / 100, height: 8)
                    }
                    .cornerRadius(4)
                }
                .frame(height: 8)
            }
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(12)
    }

    // MARK: - Checklist Section
    private var checklistSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Checklist")
                    .font(.headline)
                Spacer()
                Text("\(task.checklistItems.filter { $0.isCompleted }.count)/\(task.checklistItems.count)")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            ForEach(task.checklistItems.sorted(by: { $0.sequence < $1.sequence })) { item in
                ChecklistItemRow(item: item) {
                    viewModel.toggleChecklistItem(task, itemId: item.id)
                }
            }

            // Add new item
            HStack {
                TextField("Add checklist item", text: $newChecklistItem)
                    .textFieldStyle(.roundedBorder)

                Button(action: {
                    guard !newChecklistItem.isEmpty else { return }
                    viewModel.addChecklistItem(to: task, title: newChecklistItem)
                    newChecklistItem = ""
                }) {
                    Image(systemName: "plus.circle.fill")
                        .font(.title2)
                        .foregroundColor(.blue)
                }
                .disabled(newChecklistItem.isEmpty)
            }
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(12)
    }

    // MARK: - Time Tracking Section
    private var timeTrackingSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Time Tracking")
                .font(.headline)

            if let activeEntry = viewModel.activeTimeEntry, activeEntry.taskId == task.id {
                VStack(spacing: 12) {
                    HStack {
                        Image(systemName: "timer")
                            .foregroundColor(.blue)
                        Text("Timer Running")
                            .font(.subheadline)
                        Spacer()
                        Text(Date(), style: .timer)
                            .font(.title3.monospacedDigit())
                            .foregroundColor(.blue)
                    }

                    Button(action: {
                        viewModel.stopTimeTracking(for: task)
                    }) {
                        Label("Stop Timer", systemImage: "stop.circle.fill")
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.red)
                            .foregroundColor(.white)
                            .cornerRadius(10)
                    }
                }
            } else if task.status == .inProgress {
                Button(action: {
                    viewModel.startTimeTracking(for: task)
                }) {
                    Label("Start Timer", systemImage: "play.circle.fill")
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.blue)
                        .foregroundColor(.white)
                        .cornerRadius(10)
                }
            }

            if let actualHours = task.actualHours {
                HStack {
                    Image(systemName: "clock.badge.checkmark.fill")
                        .foregroundColor(.green)
                    Text("Total Time: \(String(format: "%.2f", actualHours)) hours")
                        .font(.subheadline)
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(12)
    }

    // MARK: - Comments Section
    private var commentsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Comments")
                .font(.headline)

            // Existing comments
            ForEach(task.comments.sorted(by: { $0.createdAt > $1.createdAt })) { comment in
                CommentRow(comment: comment)
            }

            // Add new comment
            HStack(alignment: .top, spacing: 8) {
                TextField("Add a comment", text: $newComment, axis: .vertical)
                    .textFieldStyle(.roundedBorder)
                    .lineLimit(3...6)

                Button(action: {
                    guard !newComment.isEmpty else { return }
                    viewModel.addComment(to: task, text: newComment)
                    newComment = ""
                }) {
                    Image(systemName: "arrow.up.circle.fill")
                        .font(.title2)
                        .foregroundColor(.blue)
                }
                .disabled(newComment.isEmpty)
            }
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(12)
    }

    // MARK: - Attachments Section
    private var attachmentsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Attachments")
                .font(.headline)

            ForEach(task.attachments) { attachment in
                AttachmentRow(attachment: attachment)
            }
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(12)
    }

    // MARK: - Metadata Section
    private var metadataSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Information")
                .font(.headline)

            VStack(spacing: 8) {
                HStack {
                    Text("Created")
                        .foregroundColor(.secondary)
                    Spacer()
                    Text(task.createdAt.formatted(date: .abbreviated, time: .shortened))
                }
                .font(.caption)

                HStack {
                    Text("Updated")
                        .foregroundColor(.secondary)
                    Spacer()
                    Text(task.updatedAt.formatted(date: .abbreviated, time: .shortened))
                }
                .font(.caption)

                if let startDate = task.startDate {
                    HStack {
                        Text("Started")
                            .foregroundColor(.secondary)
                        Spacer()
                        Text(startDate.formatted(date: .abbreviated, time: .shortened))
                    }
                    .font(.caption)
                }

                if let completedDate = task.completedDate {
                    HStack {
                        Text("Completed")
                            .foregroundColor(.secondary)
                        Spacer()
                        Text(completedDate.formatted(date: .abbreviated, time: .shortened))
                    }
                    .font(.caption)
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(12)
    }
}

// MARK: - Supporting Views

struct DetailRow: View {
    let icon: String
    let title: String
    let value: String
    let color: Color
    var action: (() -> Void)? = nil

    var body: some View {
        Button(action: { action?() }) {
            HStack {
                Image(systemName: icon)
                    .foregroundColor(color)
                    .frame(width: 30)

                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text(value)
                        .font(.subheadline)
                        .foregroundColor(.primary)
                }

                Spacer()

                if action != nil {
                    Image(systemName: "chevron.right")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
        }
        .disabled(action == nil)
        .buttonStyle(PlainButtonStyle())
    }
}

struct ChecklistItemRow: View {
    let item: ChecklistItem
    let onToggle: () -> Void

    var body: some View {
        HStack(spacing: 12) {
            Button(action: onToggle) {
                Image(systemName: item.isCompleted ? "checkmark.circle.fill" : "circle")
                    .font(.title3)
                    .foregroundColor(item.isCompleted ? .green : .gray)
            }

            VStack(alignment: .leading, spacing: 4) {
                Text(item.title)
                    .font(.body)
                    .foregroundColor(.primary)
                    .strikethrough(item.isCompleted)

                if let completedBy = item.completedBy, let completedAt = item.completedAt {
                    Text("Completed by \(completedBy) at \(completedAt.formatted(date: .omitted, time: .shortened))")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }

            Spacer()
        }
        .padding(.vertical, 4)
    }
}

struct CommentRow: View {
    let comment: TaskComment

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: comment.isSystemComment ? "gear.circle.fill" : "person.circle.fill")
                .font(.title2)
                .foregroundColor(comment.isSystemComment ? .gray : .blue)

            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(comment.authorName)
                        .font(.subheadline.bold())
                    Text(comment.createdAt.formatted(date: .omitted, time: .shortened))
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Text(comment.text)
                    .font(.body)
                    .foregroundColor(comment.isSystemComment ? .secondary : .primary)
            }

            Spacer()
        }
        .padding(.vertical, 8)
    }
}

struct AttachmentRow: View {
    let attachment: TaskAttachment

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: attachment.isImage ? "photo.fill" : (attachment.isPDF ? "doc.fill" : "paperclip"))
                .font(.title2)
                .foregroundColor(attachment.isImage ? .blue : .purple)
                .frame(width: 40)

            VStack(alignment: .leading, spacing: 4) {
                Text(attachment.fileName)
                    .font(.subheadline)
                    .lineLimit(1)

                HStack {
                    Text(attachment.formattedFileSize)
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text("•")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text(attachment.uploadedAt.formatted(date: .abbreviated, time: .omitted))
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }

            Spacer()

            Button(action: {}) {
                Image(systemName: "arrow.down.circle")
                    .font(.title3)
                    .foregroundColor(.blue)
            }
        }
        .padding()
        .background(Color(.tertiarySystemGroupedBackground))
        .cornerRadius(8)
    }
}

struct StatusPickerView: View {
    let currentStatus: TaskStatus
    let onSelect: (TaskStatus) -> Void
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            List {
                ForEach(TaskStatus.allCases, id: \.self) { status in
                    Button(action: {
                        onSelect(status)
                        dismiss()
                    }) {
                        HStack {
                            Image(systemName: status.icon)
                                .foregroundColor(status.color)
                            Text(status.rawValue)
                                .foregroundColor(.primary)
                            Spacer()
                            if status == currentStatus {
                                Image(systemName: "checkmark")
                                    .foregroundColor(.blue)
                            }
                        }
                    }
                }
            }
            .navigationTitle("Change Status")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
        }
    }
}

struct AssignUserView: View {
    let users: [(id: String, name: String)]
    let onSelect: (String) -> Void
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            List {
                ForEach(users, id: \.id) { user in
                    Button(action: {
                        onSelect(user.id)
                        dismiss()
                    }) {
                        HStack {
                            Image(systemName: "person.circle.fill")
                                .foregroundColor(.blue)
                            Text(user.name)
                                .foregroundColor(.primary)
                        }
                    }
                }
            }
            .navigationTitle("Assign To")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
        }
    }
}

#Preview {
    TaskDetailView(task: Task.sample, viewModel: TaskViewModel())
}
