//
//  TaskListView.swift
//  Fleet Manager - iOS Native App
//
//  Task list with search, filters, Kanban board, and quick actions
//

import SwiftUI

struct TaskListView: View {
    @StateObject private var viewModel = TaskViewModel()
    @State private var showingCreateTask = false
    @State private var showingFilters = false
    @State private var selectedTask: Task?

    var body: some View {
        NavigationView {
            ZStack {
                if viewModel.loadingState == .loading && viewModel.filteredTasks.isEmpty {
                    ProgressView("Loading tasks...")
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if viewModel.filteredTasks.isEmpty && !viewModel.searchText.isEmpty {
                    emptySearchState
                } else if viewModel.filteredTasks.isEmpty {
                    emptyState
                } else {
                    contentView
                }
            }
            .navigationTitle("Tasks")
            .navigationBarTitleDisplayMode(.large)
            .searchable(text: $viewModel.searchText, prompt: "Search tasks...")
            .toolbar {
                ToolbarItemGroup(placement: .navigationBarLeading) {
                    viewModePicker
                }
                ToolbarItemGroup(placement: .navigationBarTrailing) {
                    filterButton
                    createButton
                }
            }
            .refreshable {
                await viewModel.refresh()
            }
            .sheet(isPresented: $showingCreateTask) {
                CreateTaskView(viewModel: viewModel)
            }
            .sheet(isPresented: $showingFilters) {
                TaskFilterView(viewModel: viewModel)
            }
            .sheet(item: $selectedTask) { task in
                TaskDetailView(task: task, viewModel: viewModel)
            }
        }
        .navigationViewStyle(.stack)
    }

    // MARK: - Content View
    @ViewBuilder
    private var contentView: some View {
        switch viewModel.viewMode {
        case .list:
            listView
        case .kanban:
            kanbanView
        case .calendar:
            Text("Calendar view coming soon")
        }
    }

    // MARK: - List View
    private var listView: some View {
        ScrollView {
            // Statistics Bar
            statisticsBar

            // Quick Filters
            quickFiltersBar

            // Active Filters
            if hasActiveFilters {
                activeFiltersBar
            }

            // Task Cards
            LazyVStack(spacing: 12) {
                ForEach(viewModel.filteredTasks) { task in
                    TaskCard(task: task) {
                        selectedTask = task
                    }
                    .contextMenu {
                        taskContextMenu(for: task)
                    }
                    .transition(.asymmetric(
                        insertion: .slide.combined(with: .opacity),
                        removal: .opacity
                    ))
                }
            }
            .padding(.horizontal)
            .padding(.bottom, 20)
        }
        .background(Color(.systemGroupedBackground))
    }

    // MARK: - Kanban View
    private var kanbanView: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(alignment: .top, spacing: 16) {
                ForEach(TaskStatus.allCases.filter { $0 != .cancelled }, id: \.self) { status in
                    KanbanColumn(
                        status: status,
                        tasks: viewModel.getTasksByStatus(status),
                        onTaskTap: { task in
                            selectedTask = task
                        },
                        onStatusChange: { task, newStatus in
                            viewModel.updateStatus(task, to: newStatus)
                        }
                    )
                }
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
    }

    // MARK: - Statistics Bar
    private var statisticsBar: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 16) {
                TaskStatCard(
                    title: "To Do",
                    value: "\(viewModel.toDoCount)",
                    icon: "circle",
                    color: .gray
                )

                TaskStatCard(
                    title: "In Progress",
                    value: "\(viewModel.inProgressCount)",
                    icon: "arrow.triangle.2.circlepath",
                    color: .blue
                )

                TaskStatCard(
                    title: "My Tasks",
                    value: "\(viewModel.myTasksCount)",
                    icon: "person.fill",
                    color: .purple
                )

                TaskStatCard(
                    title: "Overdue",
                    value: "\(viewModel.overdueCount)",
                    icon: "exclamationmark.triangle.fill",
                    color: .red
                )

                TaskStatCard(
                    title: "Completed",
                    value: "\(viewModel.completedThisWeek)",
                    icon: "checkmark.circle.fill",
                    color: .green
                )
            }
            .padding(.horizontal)
        }
        .padding(.vertical, 8)
    }

    // MARK: - Quick Filters Bar
    private var quickFiltersBar: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                QuickFilterButton(
                    title: "My Tasks",
                    icon: "person.fill",
                    isActive: viewModel.showOnlyMyTasks
                ) {
                    viewModel.toggleMyTasks()
                }

                QuickFilterButton(
                    title: "Overdue",
                    icon: "exclamationmark.triangle.fill",
                    isActive: viewModel.showOnlyOverdue
                ) {
                    viewModel.toggleOverdue()
                }

                ForEach(TaskPriority.allCases, id: \.self) { priority in
                    QuickFilterButton(
                        title: priority.rawValue,
                        icon: priority.icon,
                        isActive: viewModel.selectedPriority == priority
                    ) {
                        viewModel.applyPriorityFilter(
                            viewModel.selectedPriority == priority ? nil : priority
                        )
                    }
                }
            }
            .padding(.horizontal)
            .padding(.vertical, 8)
        }
    }

    // MARK: - Active Filters Bar
    private var activeFiltersBar: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                if let status = viewModel.selectedStatus {
                    FilterChip(title: status.rawValue, color: status.color) {
                        viewModel.applyStatusFilter(nil)
                    }
                }

                if let priority = viewModel.selectedPriority {
                    FilterChip(title: priority.rawValue, color: priority.color) {
                        viewModel.applyPriorityFilter(nil)
                    }
                }

                if let category = viewModel.selectedCategory {
                    FilterChip(title: category.rawValue, color: category.color) {
                        viewModel.applyCategoryFilter(nil)
                    }
                }

                if viewModel.selectedAssignee != nil {
                    FilterChip(title: "By Assignee", color: .purple) {
                        viewModel.applyAssigneeFilter(nil)
                    }
                }

                Button(action: viewModel.clearFilters) {
                    Label("Clear All", systemImage: "xmark.circle.fill")
                        .font(.caption)
                        .foregroundColor(.red)
                }
            }
            .padding(.horizontal)
            .padding(.vertical, 8)
        }
    }

    private var hasActiveFilters: Bool {
        viewModel.selectedStatus != nil ||
        viewModel.selectedPriority != nil ||
        viewModel.selectedCategory != nil ||
        viewModel.selectedAssignee != nil
    }

    // MARK: - Context Menu
    @ViewBuilder
    private func taskContextMenu(for task: Task) -> some View {
        if let nextStatus = task.status.nextStatus {
            Button(action: {
                viewModel.updateStatus(task, to: nextStatus)
            }) {
                Label("Move to \(nextStatus.rawValue)", systemImage: nextStatus.icon)
            }
        }

        if task.status != .completed {
            Button(action: {
                viewModel.updateStatus(task, to: .completed)
            }) {
                Label("Mark Complete", systemImage: "checkmark.circle.fill")
            }
        }

        Button(action: {
            selectedTask = task
        }) {
            Label("View Details", systemImage: "doc.text.fill")
        }

        Divider()

        Button(role: .destructive, action: {
            viewModel.deleteTask(task)
        }) {
            Label("Delete", systemImage: "trash")
        }
    }

    // MARK: - Toolbar Items
    private var viewModePicker: some View {
        Picker("View Mode", selection: $viewModel.viewMode) {
            ForEach(TaskViewMode.allCases, id: \.self) { mode in
                Image(systemName: mode.icon)
                    .tag(mode)
            }
        }
        .pickerStyle(.segmented)
        .frame(width: 150)
    }

    private var filterButton: some View {
        Button(action: { showingFilters = true }) {
            Image(systemName: hasActiveFilters ? "line.3.horizontal.decrease.circle.fill" : "line.3.horizontal.decrease.circle")
                .foregroundColor(hasActiveFilters ? .blue : .primary)
        }
    }

    private var createButton: some View {
        Button(action: { showingCreateTask = true }) {
            Image(systemName: "plus.circle.fill")
                .foregroundColor(.blue)
        }
    }

    // MARK: - Empty States
    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "checklist")
                .font(.system(size: 60))
                .foregroundColor(.gray)

            Text("No Tasks")
                .font(.title2.bold())

            Text("Create your first task to get started")
                .font(.subheadline)
                .foregroundColor(.secondary)

            Button(action: { showingCreateTask = true }) {
                Label("Create Task", systemImage: "plus")
                    .padding(.horizontal, 20)
                    .padding(.vertical, 10)
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(10)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private var emptySearchState: some View {
        VStack(spacing: 16) {
            Image(systemName: "magnifyingglass")
                .font(.system(size: 50))
                .foregroundColor(.gray)

            Text("No Results")
                .font(.title2.bold())

            Text("No tasks match '\(viewModel.searchText)'")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)

            Button("Clear Search") {
                viewModel.searchText = ""
            }
            .foregroundColor(.blue)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

// MARK: - Task Card
struct TaskCard: View {
    let task: Task
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            VStack(alignment: .leading, spacing: 12) {
                // Header
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(task.title)
                            .font(.headline.bold())
                            .foregroundColor(.primary)
                            .lineLimit(2)

                        if let vehicleNumber = task.vehicleNumber {
                            HStack(spacing: 4) {
                                Image(systemName: "car.fill")
                                    .font(.caption2)
                                Text(vehicleNumber)
                                    .font(.caption)
                            }
                            .foregroundColor(.secondary)
                        }
                    }

                    Spacer()

                    VStack(alignment: .trailing, spacing: 4) {
                        TaskStatusBadge(status: task.status)
                        TaskPriorityBadge(priority: task.priority)
                    }
                }

                // Category
                HStack(spacing: 4) {
                    Image(systemName: task.category.icon)
                        .font(.caption)
                        .foregroundColor(task.category.color)
                    Text(task.category.rawValue)
                        .font(.caption)
                        .foregroundColor(task.category.color)
                }

                // Progress bar
                if task.hasChecklistItems {
                    VStack(alignment: .leading, spacing: 4) {
                        HStack {
                            Image(systemName: "checklist")
                                .font(.caption2)
                            Text("\(task.progressPercentage)% Complete")
                                .font(.caption)
                            Spacer()
                            Text("\(task.checklistItems.filter { $0.isCompleted }.count)/\(task.checklistItems.count)")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }

                        GeometryReader { geometry in
                            ZStack(alignment: .leading) {
                                Rectangle()
                                    .fill(Color.gray.opacity(0.2))
                                    .frame(height: 4)

                                Rectangle()
                                    .fill(task.category.color)
                                    .frame(width: geometry.size.width * CGFloat(task.progressPercentage) / 100, height: 4)
                            }
                            .cornerRadius(2)
                        }
                        .frame(height: 4)
                    }
                }

                // Assignee and due date
                HStack(spacing: 16) {
                    if let assigneeName = task.assigneeName {
                        HStack(spacing: 4) {
                            Image(systemName: "person.fill")
                                .font(.caption)
                                .foregroundColor(.blue)
                            Text(assigneeName)
                                .font(.caption)
                                .lineLimit(1)
                        }
                    }

                    if let dueDate = task.dueDate {
                        HStack(spacing: 4) {
                            Image(systemName: task.isOverdue ? "exclamationmark.triangle.fill" : "calendar")
                                .font(.caption)
                                .foregroundColor(task.isOverdue ? .red : .gray)
                            Text(dueDate, style: .date)
                                .font(.caption)
                                .foregroundColor(task.isOverdue ? .red : .secondary)
                        }
                    }
                }

                // Tags and indicators
                HStack(spacing: 8) {
                    if task.hasComments {
                        HStack(spacing: 2) {
                            Image(systemName: "bubble.left.fill")
                                .font(.caption2)
                            Text("\(task.comments.count)")
                                .font(.caption2)
                        }
                        .foregroundColor(.blue)
                    }

                    if task.hasAttachments {
                        HStack(spacing: 2) {
                            Image(systemName: "paperclip")
                                .font(.caption2)
                            Text("\(task.attachments.count)")
                                .font(.caption2)
                        }
                        .foregroundColor(.purple)
                    }

                    ForEach(task.tags.prefix(3), id: \.self) { tag in
                        Text(tag)
                            .font(.caption2)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Color.gray.opacity(0.2))
                            .foregroundColor(.secondary)
                            .cornerRadius(4)
                    }
                }

                // Overdue warning
                if task.isOverdue {
                    HStack {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .font(.caption)
                            .foregroundColor(.red)
                        if let days = task.daysUntilDue {
                            Text("Overdue by \(abs(days)) day\(abs(days) == 1 ? "" : "s")")
                                .font(.caption.bold())
                                .foregroundColor(.red)
                        }
                    }
                    .padding(8)
                    .background(Color.red.opacity(0.1))
                    .cornerRadius(8)
                }
            }
            .padding()
            .background(Color(.secondarySystemGroupedBackground))
            .cornerRadius(12)
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// MARK: - Kanban Column
struct KanbanColumn: View {
    let status: TaskStatus
    let tasks: [Task]
    let onTaskTap: (Task) -> Void
    let onStatusChange: (Task, TaskStatus) -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Column Header
            HStack {
                Image(systemName: status.icon)
                    .foregroundColor(status.color)
                Text(status.rawValue)
                    .font(.headline)
                Spacer()
                Text("\(tasks.count)")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            .padding(.horizontal)

            Divider()

            // Tasks
            ScrollView {
                LazyVStack(spacing: 8) {
                    ForEach(tasks) { task in
                        KanbanTaskCard(task: task) {
                            onTaskTap(task)
                        }
                    }
                }
                .padding(.horizontal, 8)
            }
        }
        .frame(width: 300)
        .padding(.vertical)
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(12)
    }
}

// MARK: - Kanban Task Card
struct KanbanTaskCard: View {
    let task: Task
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            VStack(alignment: .leading, spacing: 8) {
                // Priority and Category
                HStack {
                    Image(systemName: task.category.icon)
                        .font(.caption)
                        .foregroundColor(task.category.color)
                    Spacer()
                    Image(systemName: task.priority.icon)
                        .font(.caption)
                        .foregroundColor(task.priority.color)
                }

                Text(task.title)
                    .font(.subheadline.bold())
                    .foregroundColor(.primary)
                    .lineLimit(2)

                if let assigneeName = task.assigneeName {
                    HStack(spacing: 4) {
                        Image(systemName: "person.fill")
                            .font(.caption2)
                        Text(assigneeName)
                            .font(.caption)
                    }
                    .foregroundColor(.secondary)
                }

                if let dueDate = task.dueDate {
                    HStack(spacing: 4) {
                        Image(systemName: task.isOverdue ? "exclamationmark.triangle.fill" : "calendar")
                            .font(.caption2)
                        Text(dueDate, style: .date)
                            .font(.caption)
                    }
                    .foregroundColor(task.isOverdue ? .red : .secondary)
                }

                if task.hasChecklistItems {
                    HStack(spacing: 4) {
                        Image(systemName: "checklist")
                            .font(.caption2)
                        Text("\(task.progressPercentage)%")
                            .font(.caption)
                    }
                    .foregroundColor(.blue)
                }
            }
            .padding(10)
            .background(Color(.systemBackground))
            .cornerRadius(8)
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// MARK: - Supporting Views

struct TaskStatusBadge: View {
    let status: TaskStatus

    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: status.icon)
            Text(status.rawValue)
        }
        .font(.caption2.bold())
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(status.color.opacity(0.2))
        .foregroundColor(status.color)
        .cornerRadius(6)
    }
}

struct TaskPriorityBadge: View {
    let priority: TaskPriority

    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: priority.icon)
            Text(priority.rawValue)
        }
        .font(.caption2.bold())
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(priority.color.opacity(0.2))
        .foregroundColor(priority.color)
        .cornerRadius(6)
    }
}

struct TaskStatCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: icon)
                    .font(.caption)
                    .foregroundColor(color)
                Text(title)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Text(value)
                .font(.title3.bold())
                .foregroundColor(.primary)
        }
        .padding()
        .frame(minWidth: 100)
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(12)
    }
}

struct QuickFilterButton: View {
    let title: String
    let icon: String
    let isActive: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 4) {
                Image(systemName: icon)
                Text(title)
            }
            .font(.caption)
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(isActive ? Color.blue : Color(.secondarySystemGroupedBackground))
            .foregroundColor(isActive ? .white : .primary)
            .cornerRadius(20)
        }
    }
}

// MARK: - Filter View
struct TaskFilterView: View {
    @ObservedObject var viewModel: TaskViewModel
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            Form {
                Section("Status") {
                    Picker("Filter by Status", selection: Binding(
                        get: { viewModel.selectedStatus },
                        set: { viewModel.applyStatusFilter($0) }
                    )) {
                        Text("All").tag(nil as TaskStatus?)
                        ForEach(TaskStatus.allCases, id: \.self) { status in
                            HStack {
                                Image(systemName: status.icon)
                                Text(status.rawValue)
                            }
                            .tag(status as TaskStatus?)
                        }
                    }
                }

                Section("Priority") {
                    Picker("Filter by Priority", selection: Binding(
                        get: { viewModel.selectedPriority },
                        set: { viewModel.applyPriorityFilter($0) }
                    )) {
                        Text("All").tag(nil as TaskPriority?)
                        ForEach(TaskPriority.allCases, id: \.self) { priority in
                            HStack {
                                Image(systemName: priority.icon)
                                Text(priority.rawValue)
                            }
                            .tag(priority as TaskPriority?)
                        }
                    }
                }

                Section("Category") {
                    Picker("Filter by Category", selection: Binding(
                        get: { viewModel.selectedCategory },
                        set: { viewModel.applyCategoryFilter($0) }
                    )) {
                        Text("All").tag(nil as TaskCategory?)
                        ForEach(TaskCategory.allCases, id: \.self) { category in
                            HStack {
                                Image(systemName: category.icon)
                                Text(category.rawValue)
                            }
                            .tag(category as TaskCategory?)
                        }
                    }
                }

                Section("Assignee") {
                    Picker("Filter by Assignee", selection: Binding(
                        get: { viewModel.selectedAssignee },
                        set: { viewModel.applyAssigneeFilter($0) }
                    )) {
                        Text("All Users").tag(nil as String?)
                        ForEach(viewModel.users, id: \.id) { user in
                            Text(user.name).tag(user.id as String?)
                        }
                    }
                }

                Section {
                    Button(action: {
                        viewModel.clearFilters()
                        dismiss()
                    }) {
                        Label("Clear All Filters", systemImage: "xmark.circle")
                            .frame(maxWidth: .infinity)
                            .foregroundColor(.red)
                    }
                }
            }
            .navigationTitle("Filters")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
}

#Preview {
    TaskListView()
}
