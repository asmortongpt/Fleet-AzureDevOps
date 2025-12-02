//
//  TrainingManagementViewModel.swift
//  Fleet Manager
//
//  ViewModel for training and certification management with compliance tracking
//

import Foundation
import Combine
import SwiftUI

@MainActor
class TrainingManagementViewModel: RefreshableViewModel {
    // MARK: - Published Properties
    @Published var courses: [TrainingCourse] = []
    @Published var completions: [CourseCompletion] = []
    @Published var schedules: [TrainingSchedule] = []
    @Published var trainingReport: TrainingReport?
    @Published var selectedCategory: TrainingCategory?
    @Published var selectedCourse: TrainingCourse?
    @Published var showEnrollmentSheet = false
    @Published var showScheduleSheet = false
    @Published var selectedDriver: String?

    // Filters
    @Published var showRequiredOnly = false
    @Published var showUpcomingOnly = false
    @Published var filterByStatus: CompletionStatus?

    // MARK: - Computed Properties
    var filteredCourses: [TrainingCourse] {
        var filtered = courses

        if let category = selectedCategory {
            filtered = filtered.filter { $0.category == category }
        }

        if showRequiredOnly {
            filtered = filtered.filter { $0.isRequired }
        }

        if !searchText.isEmpty {
            filtered = filtered.filter { course in
                course.title.localizedCaseInsensitiveContains(searchText) ||
                course.description.localizedCaseInsensitiveContains(searchText) ||
                course.code.localizedCaseInsensitiveContains(searchText)
            }
        }

        return filtered.sorted { $0.title < $1.title }
    }

    var filteredSchedules: [TrainingSchedule] {
        var filtered = schedules

        if showUpcomingOnly {
            filtered = filtered.filter { $0.isUpcoming }
        }

        if let category = selectedCategory,
           let course = courses.first(where: { $0.id == filtered.first?.courseId }) {
            filtered = filtered.filter { schedule in
                guard let course = courses.first(where: { $0.id == schedule.courseId }) else { return false }
                return course.category == category
            }
        }

        return filtered.sorted { $0.startDateTime < $1.startDateTime }
    }

    var filteredCompletions: [CourseCompletion] {
        var filtered = completions

        if let status = filterByStatus {
            filtered = filtered.filter { $0.status == status }
        }

        if let driverId = selectedDriver {
            filtered = filtered.filter { $0.driverId == driverId }
        }

        return filtered.sorted { ($0.completionDate ?? Date.distantPast) > ($1.completionDate ?? Date.distantPast) }
    }

    var expiringCertifications: [CourseCompletion] {
        completions.filter { $0.isExpiringSoon && $0.status == .completed }
            .sorted { completion1, completion2 in
                guard let days1 = completion1.daysUntilExpiration,
                      let days2 = completion2.daysUntilExpiration else {
                    return false
                }
                return days1 < days2
            }
    }

    var expiredCertifications: [CourseCompletion] {
        completions.filter { $0.isExpired }
    }

    // MARK: - Certification Status Tracking
    func getCertificationStatus(completion: CourseCompletion) -> CertificationStatus {
        guard let expirationDate = completion.expirationDate else {
            return .active // No expiration
        }

        let daysUntilExpiration = Calendar.current.dateComponents(
            [.day],
            from: Date(),
            to: expirationDate
        ).day ?? 0

        if daysUntilExpiration < 0 {
            return .expired
        } else if daysUntilExpiration <= 30 {
            return .expiringSoon
        } else if daysUntilExpiration <= 90 {
            return .expiringIn90Days
        } else {
            return .active
        }
    }

    func calculateCompliancePercentage(driverId: String, role: String) -> Double {
        let requiredCourses = courses.filter { course in
            course.isRequired && course.requiredForRoles.contains(role)
        }

        guard !requiredCourses.isEmpty else { return 100.0 }

        let validCompletions = completions.filter { completion in
            completion.driverId == driverId &&
            completion.isValid &&
            requiredCourses.contains(where: { $0.id == completion.courseId })
        }

        return Double(validCompletions.count) / Double(requiredCourses.count) * 100.0
    }

    func getDriverCompletionRate(driverId: String) -> Double {
        let driverCompletions = completions.filter { $0.driverId == driverId }
        guard !driverCompletions.isEmpty else { return 0.0 }

        let completed = driverCompletions.filter { $0.status == .completed && $0.isPassed }
        return Double(completed.count) / Double(driverCompletions.count) * 100.0
    }

    // MARK: - Data Loading
    override func refresh() async {
        startRefreshing()
        await loadCourses()
        await loadCompletions()
        await loadSchedules()
        await loadTrainingReport()
        finishRefreshing()
    }

    func loadCourses() async {
        do {
            let endpoint = "/api/v1/training/courses"
            let response: TrainingCoursesResponse = try await APIManager.shared.request(
                endpoint: endpoint,
                method: "GET"
            )
            self.courses = response.courses
        } catch {
            handleError(error)
        }
    }

    func loadCompletions(driverId: String? = nil) async {
        do {
            var endpoint = "/api/v1/training/completions"
            if let driverId = driverId {
                endpoint += "?driver_id=\(driverId)"
            }

            let response: CourseCompletionsResponse = try await APIManager.shared.request(
                endpoint: endpoint,
                method: "GET"
            )
            self.completions = response.completions
        } catch {
            handleError(error)
        }
    }

    func loadSchedules() async {
        do {
            let endpoint = "/api/v1/training/schedules"
            let response: TrainingSchedulesResponse = try await APIManager.shared.request(
                endpoint: endpoint,
                method: "GET"
            )
            self.schedules = response.schedules
        } catch {
            handleError(error)
        }
    }

    func loadTrainingReport() async {
        do {
            let endpoint = "/api/v1/training/report"
            let response: TrainingReportResponse = try await APIManager.shared.request(
                endpoint: endpoint,
                method: "GET"
            )
            self.trainingReport = response.report
        } catch {
            handleError(error)
        }
    }

    // MARK: - Course Enrollment
    func enrollDriver(driverId: String, courseId: String, scheduleId: String? = nil) async throws {
        startLoading()
        defer { finishLoading() }

        let endpoint = "/api/v1/training/enroll"
        let body: [String: Any] = [
            "driver_id": driverId,
            "course_id": courseId,
            "schedule_id": scheduleId as Any
        ]

        let _: [String: Any] = try await APIManager.shared.request(
            endpoint: endpoint,
            method: "POST",
            body: body
        )

        // Reload completions and schedules
        await loadCompletions()
        await loadSchedules()
    }

    func unenrollDriver(completionId: String) async throws {
        startLoading()
        defer { finishLoading() }

        let endpoint = "/api/v1/training/completions/\(completionId)"
        let _: [String: Any] = try await APIManager.shared.request(
            endpoint: endpoint,
            method: "DELETE"
        )

        await loadCompletions()
        await loadSchedules()
    }

    // MARK: - Course Completion
    func markCourseComplete(
        completionId: String,
        score: Double,
        completionDate: Date? = nil,
        certificateUrl: String? = nil
    ) async throws {
        startLoading()
        defer { finishLoading() }

        let endpoint = "/api/v1/training/completions/\(completionId)/complete"
        let body: [String: Any] = [
            "score": score,
            "completion_date": (completionDate ?? Date()).ISO8601Format(),
            "certificate_url": certificateUrl as Any
        ]

        let _: [String: Any] = try await APIManager.shared.request(
            endpoint: endpoint,
            method: "PATCH",
            body: body
        )

        await loadCompletions()
        await loadTrainingReport()
    }

    // MARK: - Schedule Management
    func createSchedule(
        courseId: String,
        startDateTime: Date,
        endDateTime: Date,
        location: String,
        instructor: String,
        maxCapacity: Int,
        virtualMeetingUrl: String? = nil
    ) async throws {
        startLoading()
        defer { finishLoading() }

        let endpoint = "/api/v1/training/schedules"
        let body: [String: Any] = [
            "course_id": courseId,
            "start_date_time": startDateTime.ISO8601Format(),
            "end_date_time": endDateTime.ISO8601Format(),
            "location": location,
            "instructor": instructor,
            "max_capacity": maxCapacity,
            "virtual_meeting_url": virtualMeetingUrl as Any
        ]

        let _: [String: Any] = try await APIManager.shared.request(
            endpoint: endpoint,
            method: "POST",
            body: body
        )

        await loadSchedules()
    }

    func updateSchedule(
        scheduleId: String,
        status: ScheduleStatus? = nil,
        notes: String? = nil
    ) async throws {
        startLoading()
        defer { finishLoading() }

        let endpoint = "/api/v1/training/schedules/\(scheduleId)"
        var body: [String: Any] = [:]

        if let status = status {
            body["status"] = status.rawValue
        }
        if let notes = notes {
            body["notes"] = notes
        }

        let _: [String: Any] = try await APIManager.shared.request(
            endpoint: endpoint,
            method: "PATCH",
            body: body
        )

        await loadSchedules()
    }

    func cancelSchedule(scheduleId: String) async throws {
        try await updateSchedule(scheduleId: scheduleId, status: .cancelled)
    }

    // MARK: - Notifications
    func sendExpirationReminders() async throws {
        let expiringCerts = expiringCertifications

        for completion in expiringCerts {
            guard let daysUntilExpiration = completion.daysUntilExpiration else { continue }

            // Send reminder at 30, 15, and 7 days before expiration
            if [30, 15, 7].contains(daysUntilExpiration) {
                try await sendReminder(
                    to: completion.driverId,
                    courseName: completion.courseName ?? "Course",
                    daysRemaining: daysUntilExpiration
                )
            }
        }
    }

    private func sendReminder(to driverId: String, courseName: String, daysRemaining: Int) async throws {
        let endpoint = "/api/v1/notifications/send"
        let body: [String: Any] = [
            "recipient_id": driverId,
            "type": "training_expiration",
            "title": "Certification Expiring Soon",
            "message": "Your \(courseName) certification expires in \(daysRemaining) days. Please renew.",
            "priority": "high"
        ]

        let _: [String: Any] = try await APIManager.shared.request(
            endpoint: endpoint,
            method: "POST",
            body: body
        )
    }

    // MARK: - Reports
    func generateComplianceReport(for department: String? = nil) async -> TrainingReport? {
        await loadTrainingReport()
        return trainingReport
    }

    func exportTrainingHistory(driverId: String) async -> Data? {
        let driverCompletions = completions.filter { $0.driverId == driverId }

        // Generate CSV
        var csv = "Course,Status,Enrollment Date,Completion Date,Score,Expiration Date\n"

        for completion in driverCompletions {
            let dateFormatter = DateFormatter()
            dateFormatter.dateStyle = .short

            let enrollDate = dateFormatter.string(from: completion.enrollmentDate)
            let completeDate = completion.completionDate.map { dateFormatter.string(from: $0) } ?? "N/A"
            let expDate = completion.expirationDate.map { dateFormatter.string(from: $0) } ?? "N/A"

            csv += "\"\(completion.courseName ?? "Unknown")\","
            csv += "\(completion.status.displayName),"
            csv += "\(enrollDate),"
            csv += "\(completeDate),"
            csv += "\(completion.formattedScore),"
            csv += "\(expDate)\n"
        }

        return csv.data(using: .utf8)
    }

    // MARK: - Search
    override func performSearch() {
        isSearching = !searchText.isEmpty
    }

    override func clearSearch() {
        super.clearSearch()
        selectedCategory = nil
        showRequiredOnly = false
        filterByStatus = nil
    }

    // MARK: - Filters
    func applyFilter(category: TrainingCategory?) {
        selectedCategory = category
    }

    func toggleRequiredFilter() {
        showRequiredOnly.toggle()
    }

    func applyStatusFilter(_ status: CompletionStatus?) {
        filterByStatus = status
    }
}

// MARK: - Certification Status
enum CertificationStatus {
    case active
    case expiringSoon
    case expiringIn90Days
    case expired

    var displayName: String {
        switch self {
        case .active: return "Active"
        case .expiringSoon: return "Expiring Soon (30 days)"
        case .expiringIn90Days: return "Expiring in 90 days"
        case .expired: return "Expired"
        }
    }

    var color: Color {
        switch self {
        case .active: return .green
        case .expiringSoon: return .red
        case .expiringIn90Days: return .yellow
        case .expired: return .gray
        }
    }

    var icon: String {
        switch self {
        case .active: return "checkmark.shield.fill"
        case .expiringSoon: return "exclamationmark.shield.fill"
        case .expiringIn90Days: return "clock.badge.exclamationmark"
        case .expired: return "xmark.shield.fill"
        }
    }
}

// MARK: - Mock API Manager (if not already defined)
#if DEBUG
extension APIManager {
    static let shared = APIManager()

    func request<T: Decodable>(
        endpoint: String,
        method: String,
        body: [String: Any]? = nil
    ) async throws -> T {
        // Mock implementation for development
        // In production, this would make actual API calls
        throw NSError(domain: "APIManager", code: -1, userInfo: [NSLocalizedDescriptionKey: "API not implemented"])
    }
}

class APIManager {
    static let shared = APIManager()
}
#endif
