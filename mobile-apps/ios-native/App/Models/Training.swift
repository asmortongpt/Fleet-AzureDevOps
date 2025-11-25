//
//  Training.swift
//  Fleet Manager - iOS Native App
//
//  Training and Certification models for workforce development and compliance
//  Supports course management, certification tracking, and compliance monitoring
//

import Foundation
import SwiftUI

// MARK: - Training Category
public enum TrainingCategory: String, Codable, CaseIterable {
    case safety
    case compliance
    case vehicleOperation = "vehicle_operation"
    case maintenance
    case defensiveDriving = "defensive_driving"
    case hazmat
    case customerService = "customer_service"
    case emergencyResponse = "emergency_response"
    case leadership
    case technical

    public var displayName: String {
        switch self {
        case .safety: return "Safety"
        case .compliance: return "Compliance"
        case .vehicleOperation: return "Vehicle Operation"
        case .maintenance: return "Maintenance"
        case .defensiveDriving: return "Defensive Driving"
        case .hazmat: return "Hazmat"
        case .customerService: return "Customer Service"
        case .emergencyResponse: return "Emergency Response"
        case .leadership: return "Leadership"
        case .technical: return "Technical"
        }
    }

    public var icon: String {
        switch self {
        case .safety: return "shield.fill"
        case .compliance: return "checkmark.shield.fill"
        case .vehicleOperation: return "car.fill"
        case .maintenance: return "wrench.and.screwdriver.fill"
        case .defensiveDriving: return "steeringwheel"
        case .hazmat: return "exclamationmark.triangle.fill"
        case .customerService: return "person.2.fill"
        case .emergencyResponse: return "light.beacon.max.fill"
        case .leadership: return "star.fill"
        case .technical: return "gearshape.fill"
        }
    }

    public var color: Color {
        switch self {
        case .safety: return .red
        case .compliance: return .green
        case .vehicleOperation: return .blue
        case .maintenance: return .orange
        case .defensiveDriving: return .purple
        case .hazmat: return .yellow
        case .customerService: return .teal
        case .emergencyResponse: return .pink
        case .leadership: return .indigo
        case .technical: return .cyan
        }
    }
}

// MARK: - Training Course
public struct TrainingCourse: Codable, Identifiable, Equatable {
    public let id: String
    public let tenantId: String
    public var code: String
    public var title: String
    public var description: String
    public var category: TrainingCategory
    public var durationMinutes: Int
    public var isRequired: Bool
    public var requiredForRoles: [String] // Driver roles/positions
    public var prerequisites: [String] // Course IDs
    public var instructor: String?
    public var instructorEmail: String?
    public var maxCapacity: Int?
    public var costPerPerson: Double?
    public var provider: String? // External training provider
    public var deliveryMethod: DeliveryMethod
    public var certificationType: String?
    public var certificateValidityMonths: Int?
    public var materials: [CourseMaterial]
    public var topics: [String]
    public var isActive: Bool
    public var createdAt: Date
    public var updatedAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case tenantId = "tenant_id"
        case code
        case title
        case description
        case category
        case durationMinutes = "duration_minutes"
        case isRequired = "is_required"
        case requiredForRoles = "required_for_roles"
        case prerequisites
        case instructor
        case instructorEmail = "instructor_email"
        case maxCapacity = "max_capacity"
        case costPerPerson = "cost_per_person"
        case provider
        case deliveryMethod = "delivery_method"
        case certificationType = "certification_type"
        case certificateValidityMonths = "certificate_validity_months"
        case materials
        case topics
        case isActive = "is_active"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }

    // Computed properties
    public var durationHours: Double {
        Double(durationMinutes) / 60.0
    }

    public var formattedDuration: String {
        let hours = durationMinutes / 60
        let minutes = durationMinutes % 60

        if hours > 0 && minutes > 0 {
            return "\(hours)h \(minutes)m"
        } else if hours > 0 {
            return "\(hours)h"
        } else {
            return "\(minutes)m"
        }
    }

    public var requirementBadge: String {
        isRequired ? "Required" : "Optional"
    }

    public var requirementColor: Color {
        isRequired ? .red : .blue
    }

    public var formattedCost: String {
        guard let cost = costPerPerson else { return "Free" }
        return String(format: "$%.2f", cost)
    }
}

// MARK: - Delivery Method
public enum DeliveryMethod: String, Codable, CaseIterable {
    case inPerson = "in_person"
    case online
    case hybrid
    case selfPaced = "self_paced"
    case virtualClassroom = "virtual_classroom"

    public var displayName: String {
        switch self {
        case .inPerson: return "In-Person"
        case .online: return "Online"
        case .hybrid: return "Hybrid"
        case .selfPaced: return "Self-Paced"
        case .virtualClassroom: return "Virtual Classroom"
        }
    }

    public var icon: String {
        switch self {
        case .inPerson: return "person.3.fill"
        case .online: return "desktopcomputer"
        case .hybrid: return "arrow.triangle.merge"
        case .selfPaced: return "clock.fill"
        case .virtualClassroom: return "video.fill"
        }
    }
}

// MARK: - Course Material
public struct CourseMaterial: Codable, Identifiable, Equatable {
    public let id: String
    public var title: String
    public var type: MaterialType
    public var url: String?
    public var fileSize: Int? // bytes
    public var duration: Int? // minutes for videos
    public var isRequired: Bool

    enum CodingKeys: String, CodingKey {
        case id
        case title
        case type
        case url
        case fileSize = "file_size"
        case duration
        case isRequired = "is_required"
    }

    public var formattedFileSize: String {
        guard let size = fileSize else { return "" }
        let kb = Double(size) / 1024
        let mb = kb / 1024

        if mb >= 1 {
            return String(format: "%.1f MB", mb)
        } else {
            return String(format: "%.0f KB", kb)
        }
    }
}

// MARK: - Material Type
public enum MaterialType: String, Codable {
    case pdf
    case video
    case document
    case presentation
    case quiz
    case link
    case handbook

    public var icon: String {
        switch self {
        case .pdf: return "doc.text.fill"
        case .video: return "play.rectangle.fill"
        case .document: return "doc.fill"
        case .presentation: return "play.rectangle.on.rectangle.fill"
        case .quiz: return "questionmark.circle.fill"
        case .link: return "link.circle.fill"
        case .handbook: return "book.fill"
        }
    }
}

// MARK: - Course Completion
public struct CourseCompletion: Codable, Identifiable, Equatable {
    public let id: String
    public let tenantId: String
    public let courseId: String
    public let driverId: String
    public var driverName: String?
    public var courseName: String?
    public var enrollmentDate: Date
    public var completionDate: Date?
    public var status: CompletionStatus
    public var score: Double? // 0-100
    public var passingScore: Double // 0-100
    public var attemptNumber: Int
    public var timeSpentMinutes: Int?
    public var instructorName: String?
    public var certificateId: String?
    public var certificateUrl: String?
    public var expirationDate: Date?
    public var notes: String?
    public var createdAt: Date
    public var updatedAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case tenantId = "tenant_id"
        case courseId = "course_id"
        case driverId = "driver_id"
        case driverName = "driver_name"
        case courseName = "course_name"
        case enrollmentDate = "enrollment_date"
        case completionDate = "completion_date"
        case status
        case score
        case passingScore = "passing_score"
        case attemptNumber = "attempt_number"
        case timeSpentMinutes = "time_spent_minutes"
        case instructorName = "instructor_name"
        case certificateId = "certificate_id"
        case certificateUrl = "certificate_url"
        case expirationDate = "expiration_date"
        case notes
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }

    // Computed properties
    public var isPassed: Bool {
        guard let score = score else { return false }
        return score >= passingScore
    }

    public var isExpired: Bool {
        guard let expirationDate = expirationDate else { return false }
        return expirationDate < Date()
    }

    public var isExpiringSoon: Bool {
        guard let expirationDate = expirationDate else { return false }
        let daysUntilExpiration = Calendar.current.dateComponents([.day], from: Date(), to: expirationDate).day ?? 0
        return daysUntilExpiration <= 30 && daysUntilExpiration > 0
    }

    public var daysUntilExpiration: Int? {
        guard let expirationDate = expirationDate else { return nil }
        return Calendar.current.dateComponents([.day], from: Date(), to: expirationDate).day
    }

    public var isValid: Bool {
        status == .completed && isPassed && !isExpired
    }

    public var formattedScore: String {
        guard let score = score else { return "N/A" }
        return String(format: "%.1f%%", score)
    }

    public var grade: String {
        guard let score = score else { return "N/A" }
        switch score {
        case 90...100: return "A"
        case 80..<90: return "B"
        case 70..<80: return "C"
        case 60..<70: return "D"
        default: return "F"
        }
    }
}

// MARK: - Completion Status
public enum CompletionStatus: String, Codable, CaseIterable {
    case enrolled
    case inProgress = "in_progress"
    case completed
    case failed
    case expired
    case cancelled

    public var displayName: String {
        switch self {
        case .enrolled: return "Enrolled"
        case .inProgress: return "In Progress"
        case .completed: return "Completed"
        case .failed: return "Failed"
        case .expired: return "Expired"
        case .cancelled: return "Cancelled"
        }
    }

    public var color: Color {
        switch self {
        case .enrolled: return .blue
        case .inProgress: return .orange
        case .completed: return .green
        case .failed: return .red
        case .expired: return .gray
        case .cancelled: return .gray
        }
    }

    public var icon: String {
        switch self {
        case .enrolled: return "person.badge.plus"
        case .inProgress: return "clock.arrow.circlepath"
        case .completed: return "checkmark.circle.fill"
        case .failed: return "xmark.circle.fill"
        case .expired: return "clock.badge.exclamationmark"
        case .cancelled: return "xmark.circle"
        }
    }
}

// MARK: - Training Schedule
public struct TrainingSchedule: Codable, Identifiable, Equatable {
    public let id: String
    public let tenantId: String
    public let courseId: String
    public var courseName: String?
    public var startDateTime: Date
    public var endDateTime: Date
    public var location: String
    public var address: String?
    public var instructor: String
    public var maxCapacity: Int
    public var enrolledCount: Int
    public var enrolledDrivers: [String] // Driver IDs
    public var status: ScheduleStatus
    public var notes: String?
    public var virtualMeetingUrl: String?
    public var createdAt: Date
    public var updatedAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case tenantId = "tenant_id"
        case courseId = "course_id"
        case courseName = "course_name"
        case startDateTime = "start_date_time"
        case endDateTime = "end_date_time"
        case location
        case address
        case instructor
        case maxCapacity = "max_capacity"
        case enrolledCount = "enrolled_count"
        case enrolledDrivers = "enrolled_drivers"
        case status
        case notes
        case virtualMeetingUrl = "virtual_meeting_url"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }

    // Computed properties
    public var isFull: Bool {
        enrolledCount >= maxCapacity
    }

    public var availableSeats: Int {
        max(0, maxCapacity - enrolledCount)
    }

    public var duration: TimeInterval {
        endDateTime.timeIntervalSince(startDateTime)
    }

    public var durationHours: Double {
        duration / 3600
    }

    public var isPast: Bool {
        endDateTime < Date()
    }

    public var isUpcoming: Bool {
        startDateTime > Date()
    }

    public var isOngoing: Bool {
        let now = Date()
        return now >= startDateTime && now <= endDateTime
    }

    public var formattedDate: String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        return formatter.string(from: startDateTime)
    }

    public var formattedTime: String {
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        let start = formatter.string(from: startDateTime)
        let end = formatter.string(from: endDateTime)
        return "\(start) - \(end)"
    }
}

// MARK: - Schedule Status
public enum ScheduleStatus: String, Codable {
    case scheduled
    case inProgress = "in_progress"
    case completed
    case cancelled

    public var displayName: String {
        switch self {
        case .scheduled: return "Scheduled"
        case .inProgress: return "In Progress"
        case .completed: return "Completed"
        case .cancelled: return "Cancelled"
        }
    }

    public var color: Color {
        switch self {
        case .scheduled: return .blue
        case .inProgress: return .orange
        case .completed: return .green
        case .cancelled: return .gray
        }
    }
}

// MARK: - Training Requirement
public struct TrainingRequirement: Codable, Identifiable, Equatable {
    public let id: String
    public let tenantId: String
    public var role: String // Driver role/position
    public var requiredCourses: [String] // Course IDs
    public var renewalPeriodMonths: Int?
    public var description: String?
    public var isActive: Bool
    public var createdAt: Date
    public var updatedAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case tenantId = "tenant_id"
        case role
        case requiredCourses = "required_courses"
        case renewalPeriodMonths = "renewal_period_months"
        case description
        case isActive = "is_active"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

// MARK: - Training Report
public struct TrainingReport: Codable, Identifiable, Equatable {
    public let id: String
    public let tenantId: String
    public var overallCompliancePercentage: Double
    public var totalDrivers: Int
    public var compliantDrivers: Int
    public var totalCourses: Int
    public var completedCourses: Int
    public var expiringCertifications30Days: Int
    public var expiringCertifications60Days: Int
    public var expiringCertifications90Days: Int
    public var expiredCertifications: Int
    public var overdueCourses: Int
    public var categoryBreakdown: [CategoryReport]
    public var departmentBreakdown: [DepartmentReport]
    public var upcomingTrainingSessions: Int
    public var generatedAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case tenantId = "tenant_id"
        case overallCompliancePercentage = "overall_compliance_percentage"
        case totalDrivers = "total_drivers"
        case compliantDrivers = "compliant_drivers"
        case totalCourses = "total_courses"
        case completedCourses = "completed_courses"
        case expiringCertifications30Days = "expiring_certifications_30_days"
        case expiringCertifications60Days = "expiring_certifications_60_days"
        case expiringCertifications90Days = "expiring_certifications_90_days"
        case expiredCertifications = "expired_certifications"
        case overdueCourses = "overdue_courses"
        case categoryBreakdown = "category_breakdown"
        case departmentBreakdown = "department_breakdown"
        case upcomingTrainingSessions = "upcoming_training_sessions"
        case generatedAt = "generated_at"
    }

    public var complianceColor: Color {
        if overallCompliancePercentage >= 90 {
            return .green
        } else if overallCompliancePercentage >= 70 {
            return .yellow
        } else {
            return .red
        }
    }

    public var complianceGrade: String {
        if overallCompliancePercentage >= 90 {
            return "A"
        } else if overallCompliancePercentage >= 80 {
            return "B"
        } else if overallCompliancePercentage >= 70 {
            return "C"
        } else if overallCompliancePercentage >= 60 {
            return "D"
        } else {
            return "F"
        }
    }
}

// MARK: - Category Report
public struct CategoryReport: Codable, Identifiable, Equatable {
    public let id: String
    public var category: TrainingCategory
    public var completionPercentage: Double
    public var totalCourses: Int
    public var completedCourses: Int

    enum CodingKeys: String, CodingKey {
        case id
        case category
        case completionPercentage = "completion_percentage"
        case totalCourses = "total_courses"
        case completedCourses = "completed_courses"
    }
}

// MARK: - Department Report
public struct DepartmentReport: Codable, Identifiable, Equatable {
    public let id: String
    public var department: String
    public var compliancePercentage: Double
    public var totalDrivers: Int
    public var compliantDrivers: Int

    enum CodingKeys: String, CodingKey {
        case id
        case department
        case compliancePercentage = "compliance_percentage"
        case totalDrivers = "total_drivers"
        case compliantDrivers = "compliant_drivers"
    }
}

// MARK: - API Response Models
public struct TrainingCoursesResponse: Codable {
    public let courses: [TrainingCourse]
    public let total: Int
    public let page: Int?
    public let limit: Int?
}

public struct CourseCompletionsResponse: Codable {
    public let completions: [CourseCompletion]
    public let total: Int
    public let page: Int?
    public let limit: Int?
}

public struct TrainingSchedulesResponse: Codable {
    public let schedules: [TrainingSchedule]
    public let total: Int
}

public struct TrainingReportResponse: Codable {
    public let report: TrainingReport
    public let success: Bool
}

// MARK: - Sample Data
extension TrainingCourse {
    public static var sample: TrainingCourse {
        TrainingCourse(
            id: "course-001",
            tenantId: "tenant-001",
            code: "SAFETY-101",
            title: "Defensive Driving Fundamentals",
            description: "Comprehensive defensive driving course covering hazard recognition, safe following distances, and emergency maneuvers.",
            category: .defensiveDriving,
            durationMinutes: 480,
            isRequired: true,
            requiredForRoles: ["Driver", "Senior Driver"],
            prerequisites: [],
            instructor: "John Smith",
            instructorEmail: "john.smith@fleet.com",
            maxCapacity: 20,
            costPerPerson: 150.00,
            provider: "National Safety Council",
            deliveryMethod: .inPerson,
            certificationType: "DDC Certificate",
            certificateValidityMonths: 36,
            materials: [CourseMaterial.sample],
            topics: ["Hazard Recognition", "Safe Following", "Emergency Procedures"],
            isActive: true,
            createdAt: Date(),
            updatedAt: Date()
        )
    }
}

extension CourseMaterial {
    public static var sample: CourseMaterial {
        CourseMaterial(
            id: "material-001",
            title: "Defensive Driving Handbook",
            type: .pdf,
            url: "https://example.com/materials/handbook.pdf",
            fileSize: 2048000,
            duration: nil,
            isRequired: true
        )
    }
}

extension CourseCompletion {
    public static var sample: CourseCompletion {
        CourseCompletion(
            id: "completion-001",
            tenantId: "tenant-001",
            courseId: "course-001",
            driverId: "driver-001",
            driverName: "John Doe",
            courseName: "Defensive Driving Fundamentals",
            enrollmentDate: Calendar.current.date(byAdding: .month, value: -2, to: Date())!,
            completionDate: Calendar.current.date(byAdding: .month, value: -1, to: Date())!,
            status: .completed,
            score: 92.5,
            passingScore: 80.0,
            attemptNumber: 1,
            timeSpentMinutes: 450,
            instructorName: "John Smith",
            certificateId: "cert-001",
            certificateUrl: "https://example.com/certificates/cert-001.pdf",
            expirationDate: Calendar.current.date(byAdding: .year, value: 2, to: Date())!,
            notes: nil,
            createdAt: Date(),
            updatedAt: Date()
        )
    }
}

extension TrainingSchedule {
    public static var sample: TrainingSchedule {
        TrainingSchedule(
            id: "schedule-001",
            tenantId: "tenant-001",
            courseId: "course-001",
            courseName: "Defensive Driving Fundamentals",
            startDateTime: Calendar.current.date(byAdding: .day, value: 7, to: Date())!,
            endDateTime: Calendar.current.date(byAdding: .day, value: 7, to: Calendar.current.date(bySettingHour: 17, minute: 0, second: 0, of: Date())!)!,
            location: "Training Center A",
            address: "123 Main St, San Francisco, CA 94105",
            instructor: "John Smith",
            maxCapacity: 20,
            enrolledCount: 15,
            enrolledDrivers: ["driver-001", "driver-002"],
            status: .scheduled,
            notes: nil,
            virtualMeetingUrl: nil,
            createdAt: Date(),
            updatedAt: Date()
        )
    }
}

extension TrainingReport {
    public static var sample: TrainingReport {
        TrainingReport(
            id: "report-001",
            tenantId: "tenant-001",
            overallCompliancePercentage: 87.5,
            totalDrivers: 120,
            compliantDrivers: 105,
            totalCourses: 25,
            completedCourses: 450,
            expiringCertifications30Days: 5,
            expiringCertifications60Days: 12,
            expiringCertifications90Days: 18,
            expiredCertifications: 3,
            overdueCourses: 8,
            categoryBreakdown: [CategoryReport.sample],
            departmentBreakdown: [DepartmentReport.sample],
            upcomingTrainingSessions: 6,
            generatedAt: Date()
        )
    }
}

extension CategoryReport {
    public static var sample: CategoryReport {
        CategoryReport(
            id: "cat-report-001",
            category: .safety,
            completionPercentage: 92.0,
            totalCourses: 50,
            completedCourses: 46
        )
    }
}

extension DepartmentReport {
    public static var sample: DepartmentReport {
        DepartmentReport(
            id: "dept-report-001",
            department: "Operations",
            compliancePercentage: 89.0,
            totalDrivers: 45,
            compliantDrivers: 40
        )
    }
}
