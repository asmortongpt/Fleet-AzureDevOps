//
//  Task.swift
//  Fleet Manager - iOS Native App
//
//  Task Management models for fleet operations
//  Supports task assignments, tracking, and workflow management
//

import Foundation
import SwiftUI

// MARK: - Task Model
public struct Task: Codable, Identifiable, Equatable {
    public let id: String
    public let tenantId: String
    public var title: String
    public var description: String?
    public var category: TaskCategory
    public var status: TaskStatus
    public var priority: TaskPriority
    public var assigneeId: String?
    public var assigneeName: String?
    public var vehicleId: String?
    public var vehicleNumber: String?
    public var dueDate: Date?
    public var startDate: Date?
    public var completedDate: Date?
    public var estimatedHours: Double?
    public var actualHours: Double?
    public var checklistItems: [ChecklistItem]
    public var comments: [TaskComment]
    public var attachments: [TaskAttachment]
    public var tags: [String]
    public var templateId: String?
    public var parentTaskId: String?
    public var dependsOnTaskIds: [String]
    public var recurrence: TaskRecurrence?
    public var location: String?
    public var createdBy: String
    public var createdAt: Date
    public var updatedAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case tenantId = "tenant_id"
        case title
        case description
        case category
        case status
        case priority
        case assigneeId = "assignee_id"
        case assigneeName = "assignee_name"
        case vehicleId = "vehicle_id"
        case vehicleNumber = "vehicle_number"
        case dueDate = "due_date"
        case startDate = "start_date"
        case completedDate = "completed_date"
        case estimatedHours = "estimated_hours"
        case actualHours = "actual_hours"
        case checklistItems = "checklist_items"
        case comments
        case attachments
        case tags
        case templateId = "template_id"
        case parentTaskId = "parent_task_id"
        case dependsOnTaskIds = "depends_on_task_ids"
        case recurrence
        case location
        case createdBy = "created_by"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }

    public init(
        id: String = UUID().uuidString,
        tenantId: String,
        title: String,
        description: String? = nil,
        category: TaskCategory,
        status: TaskStatus = .toDo,
        priority: TaskPriority = .normal,
        assigneeId: String? = nil,
        assigneeName: String? = nil,
        vehicleId: String? = nil,
        vehicleNumber: String? = nil,
        dueDate: Date? = nil,
        startDate: Date? = nil,
        completedDate: Date? = nil,
        estimatedHours: Double? = nil,
        actualHours: Double? = nil,
        checklistItems: [ChecklistItem] = [],
        comments: [TaskComment] = [],
        attachments: [TaskAttachment] = [],
        tags: [String] = [],
        templateId: String? = nil,
        parentTaskId: String? = nil,
        dependsOnTaskIds: [String] = [],
        recurrence: TaskRecurrence? = nil,
        location: String? = nil,
        createdBy: String,
        createdAt: Date = Date(),
        updatedAt: Date = Date()
    ) {
        self.id = id
        self.tenantId = tenantId
        self.title = title
        self.description = description
        self.category = category
        self.status = status
        self.priority = priority
        self.assigneeId = assigneeId
        self.assigneeName = assigneeName
        self.vehicleId = vehicleId
        self.vehicleNumber = vehicleNumber
        self.dueDate = dueDate
        self.startDate = startDate
        self.completedDate = completedDate
        self.estimatedHours = estimatedHours
        self.actualHours = actualHours
        self.checklistItems = checklistItems
        self.comments = comments
        self.attachments = attachments
        self.tags = tags
        self.templateId = templateId
        self.parentTaskId = parentTaskId
        self.dependsOnTaskIds = dependsOnTaskIds
        self.recurrence = recurrence
        self.location = location
        self.createdBy = createdBy
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }

    // MARK: - Computed Properties

    public var isOverdue: Bool {
        guard status != .completed && status != .cancelled,
              let due = dueDate else { return false }
        return Date() > due
    }

    public var daysUntilDue: Int? {
        guard let due = dueDate else { return nil }
        return Calendar.current.dateComponents([.day], from: Date(), to: due).day
    }

    public var progressPercentage: Int {
        guard !checklistItems.isEmpty else { return status == .completed ? 100 : 0 }
        let completedCount = checklistItems.filter { $0.isCompleted }.count
        return Int((Double(completedCount) / Double(checklistItems.count)) * 100)
    }

    public var hasChecklistItems: Bool {
        !checklistItems.isEmpty
    }

    public var hasComments: Bool {
        !comments.isEmpty
    }

    public var hasAttachments: Bool {
        !attachments.isEmpty
    }

    public var isAssigned: Bool {
        assigneeId != nil
    }

    public var canStart: Bool {
        status == .toDo && dependsOnTaskIds.isEmpty
    }

    public var duration: TimeInterval? {
        guard let start = startDate, let end = completedDate else { return nil }
        return end.timeIntervalSince(start)
    }
}

// MARK: - Task Category
public enum TaskCategory: String, Codable, CaseIterable {
    case inspection = "Inspection"
    case maintenance = "Maintenance"
    case repair = "Repair"
    case delivery = "Delivery"
    case pickup = "Pickup"
    case fueling = "Fueling"
    case cleaning = "Cleaning"
    case documentation = "Documentation"
    case training = "Training"
    case admin = "Admin"
    case compliance = "Compliance"
    case safety = "Safety"
    case other = "Other"

    public var icon: String {
        switch self {
        case .inspection: return "checkmark.shield.fill"
        case .maintenance: return "wrench.and.screwdriver.fill"
        case .repair: return "hammer.fill"
        case .delivery: return "shippingbox.fill"
        case .pickup: return "arrow.down.circle.fill"
        case .fueling: return "fuelpump.fill"
        case .cleaning: return "sparkles"
        case .documentation: return "doc.text.fill"
        case .training: return "book.fill"
        case .admin: return "briefcase.fill"
        case .compliance: return "checkmark.seal.fill"
        case .safety: return "shield.fill"
        case .other: return "ellipsis.circle.fill"
        }
    }

    public var color: Color {
        switch self {
        case .inspection: return .blue
        case .maintenance: return .orange
        case .repair: return .red
        case .delivery: return .green
        case .pickup: return .purple
        case .fueling: return .yellow
        case .cleaning: return .cyan
        case .documentation: return .indigo
        case .training: return .teal
        case .admin: return .gray
        case .compliance: return .mint
        case .safety: return .pink
        case .other: return .brown
        }
    }
}

// MARK: - Task Status
public enum TaskStatus: String, Codable, CaseIterable {
    case toDo = "To Do"
    case inProgress = "In Progress"
    case blocked = "Blocked"
    case review = "Review"
    case completed = "Completed"
    case cancelled = "Cancelled"

    public var displayName: String {
        rawValue
    }

    public var color: Color {
        switch self {
        case .toDo: return .gray
        case .inProgress: return .blue
        case .blocked: return .red
        case .review: return .orange
        case .completed: return .green
        case .cancelled: return .secondary
        }
    }

    public var icon: String {
        switch self {
        case .toDo: return "circle"
        case .inProgress: return "arrow.triangle.2.circlepath"
        case .blocked: return "exclamationmark.octagon.fill"
        case .review: return "eye.fill"
        case .completed: return "checkmark.circle.fill"
        case .cancelled: return "xmark.circle.fill"
        }
    }

    public var nextStatus: TaskStatus? {
        switch self {
        case .toDo: return .inProgress
        case .inProgress: return .review
        case .blocked: return .inProgress
        case .review: return .completed
        case .completed, .cancelled: return nil
        }
    }
}

// MARK: - Task Priority
public enum TaskPriority: String, Codable, CaseIterable {
    case low = "Low"
    case normal = "Normal"
    case high = "High"
    case urgent = "Urgent"

    public var displayName: String {
        rawValue
    }

    public var color: Color {
        switch self {
        case .low: return .green
        case .normal: return .blue
        case .high: return .orange
        case .urgent: return .red
        }
    }

    public var icon: String {
        switch self {
        case .low: return "arrow.down.circle.fill"
        case .normal: return "equal.circle.fill"
        case .high: return "arrow.up.circle.fill"
        case .urgent: return "exclamationmark.triangle.fill"
        }
    }

    public var sortOrder: Int {
        switch self {
        case .urgent: return 0
        case .high: return 1
        case .normal: return 2
        case .low: return 3
        }
    }
}

// MARK: - Checklist Item
public struct ChecklistItem: Codable, Identifiable, Equatable {
    public let id: String
    public var title: String
    public var isCompleted: Bool
    public var completedAt: Date?
    public var completedBy: String?
    public var sequence: Int

    enum CodingKeys: String, CodingKey {
        case id
        case title
        case isCompleted = "is_completed"
        case completedAt = "completed_at"
        case completedBy = "completed_by"
        case sequence
    }

    public init(
        id: String = UUID().uuidString,
        title: String,
        isCompleted: Bool = false,
        completedAt: Date? = nil,
        completedBy: String? = nil,
        sequence: Int = 0
    ) {
        self.id = id
        self.title = title
        self.isCompleted = isCompleted
        self.completedAt = completedAt
        self.completedBy = completedBy
        self.sequence = sequence
    }
}

// MARK: - Task Comment
public struct TaskComment: Codable, Identifiable, Equatable {
    public let id: String
    public var text: String
    public var authorId: String
    public var authorName: String
    public var createdAt: Date
    public var isSystemComment: Bool

    enum CodingKeys: String, CodingKey {
        case id
        case text
        case authorId = "author_id"
        case authorName = "author_name"
        case createdAt = "created_at"
        case isSystemComment = "is_system_comment"
    }

    public init(
        id: String = UUID().uuidString,
        text: String,
        authorId: String,
        authorName: String,
        createdAt: Date = Date(),
        isSystemComment: Bool = false
    ) {
        self.id = id
        self.text = text
        self.authorId = authorId
        self.authorName = authorName
        self.createdAt = createdAt
        self.isSystemComment = isSystemComment
    }
}

// MARK: - Task Attachment
public struct TaskAttachment: Codable, Identifiable, Equatable {
    public let id: String
    public var fileName: String
    public var fileType: String
    public var fileSize: Int64
    public var url: String?
    public var thumbnailUrl: String?
    public var uploadedBy: String
    public var uploadedAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case fileName = "file_name"
        case fileType = "file_type"
        case fileSize = "file_size"
        case url
        case thumbnailUrl = "thumbnail_url"
        case uploadedBy = "uploaded_by"
        case uploadedAt = "uploaded_at"
    }

    public init(
        id: String = UUID().uuidString,
        fileName: String,
        fileType: String,
        fileSize: Int64,
        url: String? = nil,
        thumbnailUrl: String? = nil,
        uploadedBy: String,
        uploadedAt: Date = Date()
    ) {
        self.id = id
        self.fileName = fileName
        self.fileType = fileType
        self.fileSize = fileSize
        self.url = url
        self.thumbnailUrl = thumbnailUrl
        self.uploadedBy = uploadedBy
        self.uploadedAt = uploadedAt
    }

    public var formattedFileSize: String {
        let formatter = ByteCountFormatter()
        formatter.allowedUnits = [.useKB, .useMB, .useGB]
        formatter.countStyle = .file
        return formatter.string(fromByteCount: fileSize)
    }

    public var isImage: Bool {
        ["jpg", "jpeg", "png", "gif", "heic"].contains(fileType.lowercased())
    }

    public var isPDF: Bool {
        fileType.lowercased() == "pdf"
    }
}

// MARK: - Task Recurrence
public struct TaskRecurrence: Codable, Equatable {
    public var frequency: RecurrenceFrequency
    public var interval: Int
    public var endDate: Date?
    public var daysOfWeek: [Int]? // 1-7 for Mon-Sun

    enum CodingKeys: String, CodingKey {
        case frequency
        case interval
        case endDate = "end_date"
        case daysOfWeek = "days_of_week"
    }

    public init(
        frequency: RecurrenceFrequency,
        interval: Int = 1,
        endDate: Date? = nil,
        daysOfWeek: [Int]? = nil
    ) {
        self.frequency = frequency
        self.interval = interval
        self.endDate = endDate
        self.daysOfWeek = daysOfWeek
    }
}

// MARK: - Recurrence Frequency
public enum RecurrenceFrequency: String, Codable, CaseIterable {
    case daily = "Daily"
    case weekly = "Weekly"
    case monthly = "Monthly"
    case yearly = "Yearly"

    public var displayName: String {
        rawValue
    }
}

// MARK: - Task Template
public struct TaskTemplate: Codable, Identifiable, Equatable {
    public let id: String
    public var name: String
    public var description: String?
    public var category: TaskCategory
    public var defaultPriority: TaskPriority
    public var defaultEstimatedHours: Double?
    public var checklistItems: [String]
    public var tags: [String]
    public var isActive: Bool
    public var createdBy: String
    public var createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case name
        case description
        case category
        case defaultPriority = "default_priority"
        case defaultEstimatedHours = "default_estimated_hours"
        case checklistItems = "checklist_items"
        case tags
        case isActive = "is_active"
        case createdBy = "created_by"
        case createdAt = "created_at"
    }

    public init(
        id: String = UUID().uuidString,
        name: String,
        description: String? = nil,
        category: TaskCategory,
        defaultPriority: TaskPriority = .normal,
        defaultEstimatedHours: Double? = nil,
        checklistItems: [String] = [],
        tags: [String] = [],
        isActive: Bool = true,
        createdBy: String,
        createdAt: Date = Date()
    ) {
        self.id = id
        self.name = name
        self.description = description
        self.category = category
        self.defaultPriority = defaultPriority
        self.defaultEstimatedHours = defaultEstimatedHours
        self.checklistItems = checklistItems
        self.tags = tags
        self.isActive = isActive
        self.createdBy = createdBy
        self.createdAt = createdAt
    }
}

// MARK: - Task Time Entry
public struct TaskTimeEntry: Codable, Identifiable, Equatable {
    public let id: String
    public let taskId: String
    public var userId: String
    public var userName: String
    public var startTime: Date
    public var endTime: Date?
    public var notes: String?

    enum CodingKeys: String, CodingKey {
        case id
        case taskId = "task_id"
        case userId = "user_id"
        case userName = "user_name"
        case startTime = "start_time"
        case endTime = "end_time"
        case notes
    }

    public init(
        id: String = UUID().uuidString,
        taskId: String,
        userId: String,
        userName: String,
        startTime: Date = Date(),
        endTime: Date? = nil,
        notes: String? = nil
    ) {
        self.id = id
        self.taskId = taskId
        self.userId = userId
        self.userName = userName
        self.startTime = startTime
        self.endTime = endTime
        self.notes = notes
    }

    public var duration: TimeInterval? {
        guard let end = endTime else { return nil }
        return end.timeIntervalSince(startTime)
    }

    public var formattedDuration: String {
        guard let duration = duration else { return "In Progress" }
        let hours = Int(duration) / 3600
        let minutes = Int(duration) / 60 % 60
        return String(format: "%02d:%02d", hours, minutes)
    }
}

// MARK: - Sample Data for Previews
extension Task {
    public static var sample: Task {
        Task(
            tenantId: "tenant-001",
            title: "Complete vehicle safety inspection",
            description: "Perform comprehensive safety check on Fleet-101 before dispatch",
            category: .inspection,
            status: .inProgress,
            priority: .high,
            assigneeId: "user-001",
            assigneeName: "John Smith",
            vehicleId: "vehicle-001",
            vehicleNumber: "Fleet-101",
            dueDate: Calendar.current.date(byAdding: .day, value: 2, to: Date()),
            startDate: Date(),
            estimatedHours: 2.0,
            checklistItems: [
                ChecklistItem(title: "Check tire pressure", sequence: 1),
                ChecklistItem(title: "Test all lights", isCompleted: true, sequence: 2),
                ChecklistItem(title: "Check fluid levels", sequence: 3),
                ChecklistItem(title: "Inspect brakes", sequence: 4)
            ],
            tags: ["routine", "safety"],
            createdBy: "dispatcher-001"
        )
    }
}

extension TaskTemplate {
    public static var sample: TaskTemplate {
        TaskTemplate(
            name: "Pre-Delivery Inspection",
            description: "Standard checklist for vehicle delivery preparation",
            category: .inspection,
            defaultPriority: .normal,
            defaultEstimatedHours: 1.5,
            checklistItems: [
                "Clean interior and exterior",
                "Check fuel level",
                "Verify GPS is functioning",
                "Test communication equipment",
                "Review delivery manifest"
            ],
            tags: ["delivery", "inspection"],
            createdBy: "admin-001"
        )
    }
}
