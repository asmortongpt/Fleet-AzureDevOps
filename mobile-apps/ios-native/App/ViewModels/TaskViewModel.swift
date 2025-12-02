//
//  TaskViewModel.swift
//  Fleet Manager - iOS Native App
//
//  ViewModel for Task Management with CRUD operations, time tracking, and templates
//

import Foundation
import SwiftUI
import Combine

@MainActor
final class TaskViewModel: ObservableObject {

    // MARK: - Published Properties
    @Published var tasks: [Task] = []
    @Published var filteredTasks: [Task] = []
    @Published var selectedTask: Task?
    @Published var templates: [TaskTemplate] = []
    @Published var timeEntries: [TaskTimeEntry] = []
    @Published var activeTimeEntry: TaskTimeEntry?

    // User list for assignments
    @Published var users: [(id: String, name: String)] = []
    @Published var vehicles: [(id: String, number: String)] = []

    // Loading and error states
    @Published var loadingState: LoadingState = .idle
    @Published var errorMessage: String?
    @Published var isRefreshing = false

    // Search and filter
    @Published var searchText = ""
    @Published var selectedStatus: TaskStatus?
    @Published var selectedPriority: TaskPriority?
    @Published var selectedCategory: TaskCategory?
    @Published var selectedAssignee: String?
    @Published var showOnlyMyTasks = false
    @Published var showOnlyOverdue = false

    // View mode
    @Published var viewMode: TaskViewMode = .list

    // Statistics
    @Published var toDoCount: Int = 0
    @Published var inProgressCount: Int = 0
    @Published var completedThisWeek: Int = 0
    @Published var overdueCount: Int = 0
    @Published var myTasksCount: Int = 0

    // MARK: - Private Properties
    private var allTasks: [Task] = []
    private var cancellables = Set<AnyCancellable>()
    private let currentUserId = "current-user-001" // In real app, get from auth
    private let currentUserName = "Current User"
    private let tenantId = "tenant-001"

    // MARK: - Initialization
    init() {
        setupSearchDebouncer()
        loadData()
    }

    // MARK: - Search Debouncing
    private func setupSearchDebouncer() {
        $searchText
            .debounce(for: .milliseconds(300), scheduler: RunLoop.main)
            .removeDuplicates()
            .sink { [weak self] _ in
                self?.filterTasks()
            }
            .store(in: &cancellables)
    }

    // MARK: - Data Loading
    func loadData() {
        Task {
            loadingState = .loading

            // Simulate network delay
            try? await Task.sleep(nanoseconds: 300_000_000)

            // Generate mock data
            generateMockUsers()
            generateMockVehicles()
            generateMockTemplates()
            generateMockTasks()

            // Update statistics
            updateStatistics()

            // Apply initial filter
            filterTasks()

            loadingState = .loaded
        }
    }

    // MARK: - Refresh
    func refresh() async {
        isRefreshing = true
        loadData()
        try? await Task.sleep(nanoseconds: 500_000_000)
        isRefreshing = false
    }

    // MARK: - Mock Data Generation
    private func generateMockUsers() {
        users = [
            ("user-001", "John Smith"),
            ("user-002", "Sarah Johnson"),
            ("user-003", "Mike Davis"),
            ("user-004", "Emily Brown"),
            ("user-005", "Robert Wilson"),
            ("user-006", "Lisa Anderson")
        ]
    }

    private func generateMockVehicles() {
        vehicles = [
            ("vehicle-001", "Fleet-101"),
            ("vehicle-002", "Fleet-102"),
            ("vehicle-003", "Fleet-103"),
            ("vehicle-004", "Fleet-104"),
            ("vehicle-005", "Fleet-105")
        ]
    }

    private func generateMockTemplates() {
        templates = [
            TaskTemplate(
                name: "Pre-Delivery Inspection",
                description: "Standard vehicle inspection before delivery",
                category: .inspection,
                defaultPriority: .normal,
                defaultEstimatedHours: 1.5,
                checklistItems: [
                    "Clean interior and exterior",
                    "Check fuel level",
                    "Verify GPS functioning",
                    "Test communication equipment"
                ],
                tags: ["delivery", "inspection"],
                createdBy: currentUserId
            ),
            TaskTemplate(
                name: "Routine Maintenance",
                description: "Regular vehicle maintenance checklist",
                category: .maintenance,
                defaultPriority: .normal,
                defaultEstimatedHours: 3.0,
                checklistItems: [
                    "Change oil and filter",
                    "Rotate tires",
                    "Check brake fluid",
                    "Inspect belts and hoses"
                ],
                tags: ["maintenance", "routine"],
                createdBy: currentUserId
            ),
            TaskTemplate(
                name: "Safety Compliance Check",
                description: "Monthly safety and compliance verification",
                category: .compliance,
                defaultPriority: .high,
                defaultEstimatedHours: 2.0,
                checklistItems: [
                    "Verify fire extinguisher",
                    "Check first aid kit",
                    "Review safety documentation",
                    "Inspect emergency equipment"
                ],
                tags: ["safety", "compliance"],
                createdBy: currentUserId
            )
        ]
    }

    private func generateMockTasks() {
        let categories: [TaskCategory] = [.inspection, .maintenance, .repair, .delivery, .fueling, .cleaning, .documentation]
        let priorities: [TaskPriority] = [.low, .normal, .high, .urgent]
        let statuses: [TaskStatus] = [.toDo, .inProgress, .review, .completed]

        allTasks = (0..<25).map { index in
            let category = categories[index % categories.count]
            let priority = priorities[index % priorities.count]
            let status = statuses[index % statuses.count]
            let assignee = index % 3 == 0 ? nil : users[index % users.count]
            let vehicle = index % 2 == 0 ? vehicles[index % vehicles.count] : nil

            let dueDate = Calendar.current.date(byAdding: .day, value: Int.random(in: -5...10), to: Date())
            let startDate = status == .inProgress || status == .completed ? Date() : nil
            let completedDate = status == .completed ? Date() : nil

            var checklistItems: [ChecklistItem] = []
            if index % 2 == 0 {
                checklistItems = (1...4).map { itemIndex in
                    ChecklistItem(
                        title: "Checklist item \(itemIndex)",
                        isCompleted: itemIndex <= 2,
                        sequence: itemIndex
                    )
                }
            }

            var comments: [TaskComment] = []
            if index % 3 == 0 {
                comments = [
                    TaskComment(
                        text: "Started working on this task",
                        authorId: currentUserId,
                        authorName: currentUserName,
                        createdAt: Date().addingTimeInterval(-3600)
                    )
                ]
            }

            return Task(
                id: "task-\(String(format: "%03d", index + 1))",
                tenantId: tenantId,
                title: generateTaskTitle(category: category, index: index),
                description: generateTaskDescription(category: category),
                category: category,
                status: status,
                priority: priority,
                assigneeId: assignee?.id,
                assigneeName: assignee?.name,
                vehicleId: vehicle?.id,
                vehicleNumber: vehicle?.number,
                dueDate: dueDate,
                startDate: startDate,
                completedDate: completedDate,
                estimatedHours: Double.random(in: 1...8),
                actualHours: status == .completed ? Double.random(in: 1...8) : nil,
                checklistItems: checklistItems,
                comments: comments,
                tags: generateTags(category: category),
                createdBy: currentUserId,
                createdAt: Date().addingTimeInterval(-Double(index) * 86400)
            )
        }
    }

    private func generateTaskTitle(category: TaskCategory, index: Int) -> String {
        switch category {
        case .inspection: return "Vehicle Safety Inspection - Fleet-\(100 + index)"
        case .maintenance: return "Scheduled Maintenance - Fleet-\(100 + index)"
        case .repair: return "Brake System Repair - Fleet-\(100 + index)"
        case .delivery: return "Delivery to Memorial Hospital"
        case .fueling: return "Refuel and Clean - Fleet-\(100 + index)"
        case .cleaning: return "Deep Clean and Detail"
        case .documentation: return "Update Fleet Documentation"
        default: return "\(category.rawValue) Task #\(index + 1)"
        }
    }

    private func generateTaskDescription(category: TaskCategory) -> String {
        switch category {
        case .inspection: return "Complete comprehensive safety inspection before next dispatch"
        case .maintenance: return "Perform routine maintenance according to schedule"
        case .repair: return "Address reported issue and test thoroughly"
        case .delivery: return "Pick up supplies and deliver to destination"
        default: return "Complete assigned task according to standards"
        }
    }

    private func generateTags(category: TaskCategory) -> [String] {
        switch category {
        case .inspection: return ["safety", "routine"]
        case .maintenance: return ["scheduled", "preventive"]
        case .repair: return ["urgent", "safety"]
        case .delivery: return ["time-sensitive", "priority"]
        default: return ["general"]
        }
    }

    // MARK: - Statistics
    private func updateStatistics() {
        let now = Date()
        let calendar = Calendar.current
        let startOfWeek = calendar.dateInterval(of: .weekOfYear, for: now)?.start ?? now

        toDoCount = allTasks.filter { $0.status == .toDo }.count
        inProgressCount = allTasks.filter { $0.status == .inProgress }.count
        overdueCount = allTasks.filter { $0.isOverdue }.count
        myTasksCount = allTasks.filter { $0.assigneeId == currentUserId && $0.status != .completed && $0.status != .cancelled }.count

        let completedThisWeekTasks = allTasks.filter { task in
            guard let completed = task.completedDate else { return false }
            return completed >= startOfWeek
        }
        completedThisWeek = completedThisWeekTasks.count
    }

    // MARK: - Filtering
    func filterTasks() {
        var result = allTasks

        // Apply search filter
        if !searchText.isEmpty {
            result = result.filter { task in
                task.title.localizedCaseInsensitiveContains(searchText) ||
                (task.description?.localizedCaseInsensitiveContains(searchText) ?? false) ||
                (task.assigneeName?.localizedCaseInsensitiveContains(searchText) ?? false) ||
                (task.vehicleNumber?.localizedCaseInsensitiveContains(searchText) ?? false)
            }
        }

        // Apply status filter
        if let status = selectedStatus {
            result = result.filter { $0.status == status }
        }

        // Apply priority filter
        if let priority = selectedPriority {
            result = result.filter { $0.priority == priority }
        }

        // Apply category filter
        if let category = selectedCategory {
            result = result.filter { $0.category == category }
        }

        // Apply assignee filter
        if let assigneeId = selectedAssignee {
            result = result.filter { $0.assigneeId == assigneeId }
        }

        // Show only my tasks
        if showOnlyMyTasks {
            result = result.filter { $0.assigneeId == currentUserId }
        }

        // Show only overdue
        if showOnlyOverdue {
            result = result.filter { $0.isOverdue }
        }

        // Sort by priority and due date
        result.sort { first, second in
            if first.priority.sortOrder != second.priority.sortOrder {
                return first.priority.sortOrder < second.priority.sortOrder
            }
            if let firstDue = first.dueDate, let secondDue = second.dueDate {
                return firstDue < secondDue
            }
            return first.createdAt > second.createdAt
        }

        withAnimation(.easeInOut(duration: 0.2)) {
            filteredTasks = result
        }
    }

    // MARK: - Filter Actions
    func clearFilters() {
        selectedStatus = nil
        selectedPriority = nil
        selectedCategory = nil
        selectedAssignee = nil
        showOnlyMyTasks = false
        showOnlyOverdue = false
        searchText = ""
        filterTasks()
    }

    func applyStatusFilter(_ status: TaskStatus?) {
        selectedStatus = status
        filterTasks()
    }

    func applyPriorityFilter(_ priority: TaskPriority?) {
        selectedPriority = priority
        filterTasks()
    }

    func applyCategoryFilter(_ category: TaskCategory?) {
        selectedCategory = category
        filterTasks()
    }

    func applyAssigneeFilter(_ assigneeId: String?) {
        selectedAssignee = assigneeId
        filterTasks()
    }

    func toggleMyTasks() {
        showOnlyMyTasks.toggle()
        filterTasks()
    }

    func toggleOverdue() {
        showOnlyOverdue.toggle()
        filterTasks()
    }

    // MARK: - CRUD Operations

    func createTask(
        title: String,
        description: String?,
        category: TaskCategory,
        priority: TaskPriority,
        assigneeId: String?,
        vehicleId: String?,
        dueDate: Date?,
        estimatedHours: Double?,
        checklistItems: [String],
        tags: [String],
        recurrence: TaskRecurrence?
    ) {
        let assigneeName = users.first(where: { $0.id == assigneeId })?.name
        let vehicleNumber = vehicles.first(where: { $0.id == vehicleId })?.number

        let items = checklistItems.enumerated().map { index, title in
            ChecklistItem(title: title, sequence: index + 1)
        }

        let newTask = Task(
            tenantId: tenantId,
            title: title,
            description: description,
            category: category,
            status: .toDo,
            priority: priority,
            assigneeId: assigneeId,
            assigneeName: assigneeName,
            vehicleId: vehicleId,
            vehicleNumber: vehicleNumber,
            dueDate: dueDate,
            estimatedHours: estimatedHours,
            checklistItems: items,
            tags: tags,
            recurrence: recurrence,
            createdBy: currentUserId
        )

        allTasks.insert(newTask, at: 0)
        updateStatistics()
        filterTasks()

        // Add system comment
        addSystemComment(to: newTask, text: "Task created")
    }

    func createTaskFromTemplate(_ template: TaskTemplate, assigneeId: String?, vehicleId: String?, dueDate: Date?) {
        let items = template.checklistItems.enumerated().map { index, title in
            ChecklistItem(title: title, sequence: index + 1)
        }

        let assigneeName = users.first(where: { $0.id == assigneeId })?.name
        let vehicleNumber = vehicles.first(where: { $0.id == vehicleId })?.number

        let newTask = Task(
            tenantId: tenantId,
            title: template.name,
            description: template.description,
            category: template.category,
            priority: template.defaultPriority,
            assigneeId: assigneeId,
            assigneeName: assigneeName,
            vehicleId: vehicleId,
            vehicleNumber: vehicleNumber,
            dueDate: dueDate,
            estimatedHours: template.defaultEstimatedHours,
            checklistItems: items,
            tags: template.tags,
            templateId: template.id,
            createdBy: currentUserId
        )

        allTasks.insert(newTask, at: 0)
        updateStatistics()
        filterTasks()

        addSystemComment(to: newTask, text: "Task created from template: \(template.name)")
    }

    func updateTask(_ task: Task) {
        guard let index = allTasks.firstIndex(where: { $0.id == task.id }) else { return }

        var updated = task
        updated.updatedAt = Date()

        allTasks[index] = updated
        updateStatistics()
        filterTasks()
    }

    func deleteTask(_ task: Task) {
        allTasks.removeAll { $0.id == task.id }
        updateStatistics()
        filterTasks()
    }

    // MARK: - Status Management

    func updateStatus(_ task: Task, to status: TaskStatus) {
        guard let index = allTasks.firstIndex(where: { $0.id == task.id }) else { return }

        var updated = task
        updated.status = status
        updated.updatedAt = Date()

        if status == .inProgress && task.startDate == nil {
            updated.startDate = Date()
        }

        if status == .completed {
            updated.completedDate = Date()
            // Stop any active time tracking
            if let activeEntry = activeTimeEntry, activeEntry.taskId == task.id {
                stopTimeTracking(for: task)
            }
        }

        allTasks[index] = updated
        addSystemComment(to: updated, text: "Status changed to \(status.rawValue)")
        updateStatistics()
        filterTasks()
    }

    func assignTask(_ task: Task, to userId: String) {
        guard let index = allTasks.firstIndex(where: { $0.id == task.id }) else { return }
        guard let user = users.first(where: { $0.id == userId }) else { return }

        var updated = task
        updated.assigneeId = userId
        updated.assigneeName = user.name
        updated.updatedAt = Date()

        if updated.status == .toDo {
            updated.status = .inProgress
        }

        allTasks[index] = updated
        addSystemComment(to: updated, text: "Assigned to \(user.name)")
        updateStatistics()
        filterTasks()
    }

    // MARK: - Checklist Management

    func toggleChecklistItem(_ task: Task, itemId: String) {
        guard let index = allTasks.firstIndex(where: { $0.id == task.id }) else { return }
        guard let itemIndex = task.checklistItems.firstIndex(where: { $0.id == itemId }) else { return }

        var updated = task
        updated.checklistItems[itemIndex].isCompleted.toggle()
        if updated.checklistItems[itemIndex].isCompleted {
            updated.checklistItems[itemIndex].completedAt = Date()
            updated.checklistItems[itemIndex].completedBy = currentUserName
        } else {
            updated.checklistItems[itemIndex].completedAt = nil
            updated.checklistItems[itemIndex].completedBy = nil
        }
        updated.updatedAt = Date()

        allTasks[index] = updated
        filterTasks()
    }

    func addChecklistItem(to task: Task, title: String) {
        guard let index = allTasks.firstIndex(where: { $0.id == task.id }) else { return }

        var updated = task
        let newItem = ChecklistItem(
            title: title,
            sequence: updated.checklistItems.count + 1
        )
        updated.checklistItems.append(newItem)
        updated.updatedAt = Date()

        allTasks[index] = updated
        filterTasks()
    }

    // MARK: - Comments

    func addComment(to task: Task, text: String) {
        guard let index = allTasks.firstIndex(where: { $0.id == task.id }) else { return }

        var updated = task
        let comment = TaskComment(
            text: text,
            authorId: currentUserId,
            authorName: currentUserName
        )
        updated.comments.append(comment)
        updated.updatedAt = Date()

        allTasks[index] = updated
        filterTasks()
    }

    private func addSystemComment(to task: Task, text: String) {
        guard let index = allTasks.firstIndex(where: { $0.id == task.id }) else { return }

        var updated = task
        let comment = TaskComment(
            text: text,
            authorId: "system",
            authorName: "System",
            isSystemComment: true
        )
        updated.comments.append(comment)
        allTasks[index] = updated
    }

    // MARK: - Time Tracking

    func startTimeTracking(for task: Task) {
        let entry = TaskTimeEntry(
            taskId: task.id,
            userId: currentUserId,
            userName: currentUserName
        )
        activeTimeEntry = entry
        timeEntries.append(entry)

        addSystemComment(to: task, text: "Started time tracking")
    }

    func stopTimeTracking(for task: Task) {
        guard let activeEntry = activeTimeEntry,
              activeEntry.taskId == task.id,
              let index = timeEntries.firstIndex(where: { $0.id == activeEntry.id }) else { return }

        var updated = activeEntry
        updated.endTime = Date()
        timeEntries[index] = updated
        self.activeTimeEntry = nil

        // Update actual hours on task
        if let duration = updated.duration {
            updateActualHours(for: task, hours: duration / 3600)
        }

        addSystemComment(to: task, text: "Stopped time tracking - \(updated.formattedDuration)")
    }

    func updateActualHours(for task: Task, hours: Double) {
        guard let index = allTasks.firstIndex(where: { $0.id == task.id }) else { return }

        var updated = task
        updated.actualHours = (updated.actualHours ?? 0) + hours
        updated.updatedAt = Date()

        allTasks[index] = updated
        filterTasks()
    }

    // MARK: - Helper Methods

    func getTasksByStatus(_ status: TaskStatus) -> [Task] {
        allTasks.filter { $0.status == status }
    }

    func getMyTasks() -> [Task] {
        allTasks.filter { $0.assigneeId == currentUserId && $0.status != .completed && $0.status != .cancelled }
    }

    func getOverdueTasks() -> [Task] {
        allTasks.filter { $0.isOverdue }
    }
}

// MARK: - Task View Mode
enum TaskViewMode: String, CaseIterable {
    case list = "List"
    case kanban = "Kanban"
    case calendar = "Calendar"

    var icon: String {
        switch self {
        case .list: return "list.bullet"
        case .kanban: return "square.grid.2x2"
        case .calendar: return "calendar"
        }
    }
}

// MARK: - Loading State
enum LoadingState {
    case idle
    case loading
    case loaded
    case error(String)
}
