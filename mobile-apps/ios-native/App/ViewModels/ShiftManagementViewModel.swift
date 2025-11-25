import Foundation
import Combine
import CoreLocation
import SwiftUI

// MARK: - ShiftManagementViewModel
@MainActor
class ShiftManagementViewModel: RefreshableViewModel {
    // MARK: - Published Properties
    @Published var shifts: [Shift] = []
    @Published var currentShift: Shift?
    @Published var shiftTemplates: [ShiftTemplate] = []
    @Published var shiftSwapRequests: [ShiftSwapRequest] = []
    @Published var shiftReport: ShiftReport?
    @Published var selectedDate: Date = Date()
    @Published var calendarViewMode: CalendarViewMode = .week
    @Published var filterDriverId: String?
    @Published var filterVehicleId: String?
    @Published var filterStatus: ShiftStatus?

    // API Configuration
    private let baseURL = "https://api.fleet.example.com/api/v1"
    private var networkManager: NetworkManager

    // MARK: - Initialization
    init(networkManager: NetworkManager = .shared) {
        self.networkManager = networkManager
        super.init()
    }

    // MARK: - Refresh Override
    override func refresh() async {
        await loadShifts()
        await loadCurrentShift()
        await loadShiftTemplates()
        await loadPendingSwapRequests()
    }

    // MARK: - Load Shifts
    func loadShifts(startDate: Date? = nil, endDate: Date? = nil) async {
        startLoading()

        do {
            var urlComponents = URLComponents(string: "\(baseURL)/shifts")!
            var queryItems: [URLQueryItem] = []

            // Date range filtering
            if let startDate = startDate {
                let formatter = ISO8601DateFormatter()
                queryItems.append(URLQueryItem(name: "start_date", value: formatter.string(from: startDate)))
            }
            if let endDate = endDate {
                let formatter = ISO8601DateFormatter()
                queryItems.append(URLQueryItem(name: "end_date", value: formatter.string(from: endDate)))
            }

            // Additional filters
            if let driverId = filterDriverId {
                queryItems.append(URLQueryItem(name: "driver_id", value: driverId))
            }
            if let vehicleId = filterVehicleId {
                queryItems.append(URLQueryItem(name: "vehicle_id", value: vehicleId))
            }
            if let status = filterStatus {
                queryItems.append(URLQueryItem(name: "status", value: status.rawValue))
            }

            // Pagination
            queryItems.append(URLQueryItem(name: "page", value: "\(currentPage)"))
            queryItems.append(URLQueryItem(name: "per_page", value: "\(itemsPerPage)"))

            urlComponents.queryItems = queryItems

            let response: ShiftsResponse = try await networkManager.get(urlComponents.url!.absoluteString)
            shifts = response.shifts
            hasMorePages = response.hasMore

            finishLoading()
        } catch {
            handleError(error)
        }
    }

    // MARK: - Load Current Shift
    func loadCurrentShift() async {
        do {
            let response: CurrentShiftResponse = try await networkManager.get("\(baseURL)/shifts/current")
            currentShift = response.shift
        } catch {
            // No current shift is not an error
            currentShift = nil
        }
    }

    // MARK: - Clock In
    func clockIn(driverId: String, vehicleId: String, location: CLLocationCoordinate2D?) async throws {
        startLoading()

        do {
            let coordinate = location.map { Coordinate(from: $0) }
            let request = ClockInRequest(
                driverId: driverId,
                vehicleId: vehicleId,
                location: coordinate
            )

            let response: ClockInResponse = try await networkManager.post("\(baseURL)/shifts/clock-in", body: request)
            currentShift = response.shift

            // Reload shifts to update the list
            await loadShifts()

            finishLoading()
        } catch {
            handleError(error)
            throw error
        }
    }

    // MARK: - Clock Out
    func clockOut(location: CLLocationCoordinate2D?, notes: String? = nil) async throws {
        guard let shift = currentShift else {
            throw ShiftError.noActiveShift
        }

        startLoading()

        do {
            let coordinate = location.map { Coordinate(from: $0) }
            let request = ClockOutRequest(
                shiftId: shift.id,
                location: coordinate,
                notes: notes
            )

            let response: ClockOutResponse = try await networkManager.post("\(baseURL)/shifts/clock-out", body: request)
            currentShift = nil

            // Update the shift in the list
            if let index = shifts.firstIndex(where: { $0.id == shift.id }) {
                shifts[index] = response.shift
            }

            finishLoading()
        } catch {
            handleError(error)
            throw error
        }
    }

    // MARK: - Start Break
    func startBreak(type: BreakType, isPaid: Bool) async throws {
        guard let shift = currentShift else {
            throw ShiftError.noActiveShift
        }

        startLoading()

        do {
            let request = StartBreakRequest(
                shiftId: shift.id,
                breakType: type,
                isPaid: isPaid
            )

            let response: ShiftResponse = try await networkManager.post("\(baseURL)/shifts/break-start", body: request)
            currentShift = response.shift

            finishLoading()
        } catch {
            handleError(error)
            throw error
        }
    }

    // MARK: - End Break
    func endBreak() async throws {
        guard let shift = currentShift else {
            throw ShiftError.noActiveShift
        }

        startLoading()

        do {
            let request = EndBreakRequest(shiftId: shift.id)
            let response: ShiftResponse = try await networkManager.post("\(baseURL)/shifts/break-end", body: request)
            currentShift = response.shift

            finishLoading()
        } catch {
            handleError(error)
            throw error
        }
    }

    // MARK: - Create Shift
    func createShift(driverId: String, vehicleId: String, startTime: Date, endTime: Date, notes: String? = nil) async throws {
        startLoading()

        do {
            let request = CreateShiftRequest(
                driverId: driverId,
                vehicleId: vehicleId,
                startTime: startTime,
                endTime: endTime,
                notes: notes
            )

            let response: ShiftResponse = try await networkManager.post("\(baseURL)/shifts", body: request)
            shifts.insert(response.shift, at: 0)

            finishLoading()
        } catch {
            handleError(error)
            throw error
        }
    }

    // MARK: - Update Shift
    func updateShift(_ shift: Shift) async throws {
        startLoading()

        do {
            let response: ShiftResponse = try await networkManager.put("\(baseURL)/shifts/\(shift.id)", body: shift)

            if let index = shifts.firstIndex(where: { $0.id == shift.id }) {
                shifts[index] = response.shift
            }

            finishLoading()
        } catch {
            handleError(error)
            throw error
        }
    }

    // MARK: - Delete Shift
    func deleteShift(_ shift: Shift) async throws {
        startLoading()

        do {
            try await networkManager.delete("\(baseURL)/shifts/\(shift.id)")
            shifts.removeAll { $0.id == shift.id }

            finishLoading()
        } catch {
            handleError(error)
            throw error
        }
    }

    // MARK: - Load Shift Templates
    func loadShiftTemplates() async {
        do {
            let response: ShiftTemplatesResponse = try await networkManager.get("\(baseURL)/shift-templates")
            shiftTemplates = response.templates
        } catch {
            handleError(error)
        }
    }

    // MARK: - Create Shift Template
    func createShiftTemplate(_ template: ShiftTemplate) async throws {
        startLoading()

        do {
            let response: ShiftTemplateResponse = try await networkManager.post("\(baseURL)/shift-templates", body: template)
            shiftTemplates.insert(response.template, at: 0)

            finishLoading()
        } catch {
            handleError(error)
            throw error
        }
    }

    // MARK: - Update Shift Template
    func updateShiftTemplate(_ template: ShiftTemplate) async throws {
        startLoading()

        do {
            let response: ShiftTemplateResponse = try await networkManager.put("\(baseURL)/shift-templates/\(template.id)", body: template)

            if let index = shiftTemplates.firstIndex(where: { $0.id == template.id }) {
                shiftTemplates[index] = response.template
            }

            finishLoading()
        } catch {
            handleError(error)
            throw error
        }
    }

    // MARK: - Delete Shift Template
    func deleteShiftTemplate(_ template: ShiftTemplate) async throws {
        startLoading()

        do {
            try await networkManager.delete("\(baseURL)/shift-templates/\(template.id)")
            shiftTemplates.removeAll { $0.id == template.id }

            finishLoading()
        } catch {
            handleError(error)
            throw error
        }
    }

    // MARK: - Request Shift Swap
    func requestShiftSwap(originalShiftId: String, targetDriverId: String?, targetShiftId: String?, reason: String) async throws {
        startLoading()

        do {
            let request = ShiftSwapRequestCreate(
                originalShiftId: originalShiftId,
                targetDriverId: targetDriverId,
                targetShiftId: targetShiftId,
                reason: reason
            )

            let response: ShiftSwapResponse = try await networkManager.post("\(baseURL)/shift-swaps", body: request)
            shiftSwapRequests.insert(response.swapRequest, at: 0)

            finishLoading()
        } catch {
            handleError(error)
            throw error
        }
    }

    // MARK: - Approve Shift Swap
    func approveShiftSwap(_ swapRequest: ShiftSwapRequest) async throws {
        startLoading()

        do {
            let response: ShiftSwapResponse = try await networkManager.post("\(baseURL)/shift-swaps/\(swapRequest.id)/approve", body: EmptyRequest())

            if let index = shiftSwapRequests.firstIndex(where: { $0.id == swapRequest.id }) {
                shiftSwapRequests[index] = response.swapRequest
            }

            // Reload shifts to reflect the swap
            await loadShifts()

            finishLoading()
        } catch {
            handleError(error)
            throw error
        }
    }

    // MARK: - Reject Shift Swap
    func rejectShiftSwap(_ swapRequest: ShiftSwapRequest, reason: String) async throws {
        startLoading()

        do {
            let request = RejectSwapRequest(reason: reason)
            let response: ShiftSwapResponse = try await networkManager.post("\(baseURL)/shift-swaps/\(swapRequest.id)/reject", body: request)

            if let index = shiftSwapRequests.firstIndex(where: { $0.id == swapRequest.id }) {
                shiftSwapRequests[index] = response.swapRequest
            }

            finishLoading()
        } catch {
            handleError(error)
            throw error
        }
    }

    // MARK: - Load Pending Swap Requests
    func loadPendingSwapRequests() async {
        do {
            let response: ShiftSwapsResponse = try await networkManager.get("\(baseURL)/shift-swaps?status=pending")
            shiftSwapRequests = response.swapRequests
        } catch {
            handleError(error)
        }
    }

    // MARK: - Generate Shift Report
    func generateShiftReport(startDate: Date, endDate: Date, driverId: String? = nil, vehicleId: String? = nil) async throws {
        startLoading()

        do {
            var urlComponents = URLComponents(string: "\(baseURL)/shifts/report")!
            var queryItems: [URLQueryItem] = []

            let formatter = ISO8601DateFormatter()
            queryItems.append(URLQueryItem(name: "start_date", value: formatter.string(from: startDate)))
            queryItems.append(URLQueryItem(name: "end_date", value: formatter.string(from: endDate)))

            if let driverId = driverId {
                queryItems.append(URLQueryItem(name: "driver_id", value: driverId))
            }
            if let vehicleId = vehicleId {
                queryItems.append(URLQueryItem(name: "vehicle_id", value: vehicleId))
            }

            urlComponents.queryItems = queryItems

            let response: ShiftReportResponse = try await networkManager.get(urlComponents.url!.absoluteString)
            shiftReport = response.report

            finishLoading()
        } catch {
            handleError(error)
            throw error
        }
    }

    // MARK: - Calculate Overtime
    func calculateOvertime(hours: Double) -> Double {
        let regularHours = 8.0
        return max(0, hours - regularHours)
    }

    func calculateWeeklyOvertime(weeklyHours: Double) -> Double {
        let regularWeeklyHours = 40.0
        return max(0, weeklyHours - regularWeeklyHours)
    }

    // MARK: - Calendar Helpers
    func shiftsForDate(_ date: Date) -> [Shift] {
        let calendar = Calendar.current
        return shifts.filter { shift in
            calendar.isDate(shift.startTime, inSameDayAs: date)
        }
    }

    func shiftsForWeek(containing date: Date) -> [Shift] {
        let calendar = Calendar.current
        guard let weekInterval = calendar.dateInterval(of: .weekOfYear, for: date) else { return [] }

        return shifts.filter { shift in
            weekInterval.contains(shift.startTime)
        }
    }

    func shiftsForMonth(containing date: Date) -> [Shift] {
        let calendar = Calendar.current
        guard let monthInterval = calendar.dateInterval(of: .month, for: date) else { return [] }

        return shifts.filter { shift in
            monthInterval.contains(shift.startTime)
        }
    }

    // MARK: - Filtering
    func applyFilters(driverId: String? = nil, vehicleId: String? = nil, status: ShiftStatus? = nil) async {
        filterDriverId = driverId
        filterVehicleId = vehicleId
        filterStatus = status
        await loadShifts()
    }

    func clearFilters() async {
        filterDriverId = nil
        filterVehicleId = nil
        filterStatus = nil
        await loadShifts()
    }
}

// MARK: - Calendar View Mode
enum CalendarViewMode: String, CaseIterable {
    case day = "Day"
    case week = "Week"
    case month = "Month"

    var icon: String {
        switch self {
        case .day: return "calendar.badge.clock"
        case .week: return "calendar"
        case .month: return "calendar.badge.plus"
        }
    }
}

// MARK: - Shift Error
enum ShiftError: LocalizedError {
    case noActiveShift
    case alreadyOnShift
    case invalidTimeRange
    case conflictingShift

    var errorDescription: String? {
        switch self {
        case .noActiveShift:
            return "No active shift found. Please clock in first."
        case .alreadyOnShift:
            return "You are already clocked in to a shift."
        case .invalidTimeRange:
            return "Invalid time range. End time must be after start time."
        case .conflictingShift:
            return "This shift conflicts with an existing shift."
        }
    }
}

// MARK: - API Request/Response Models
private struct ClockInRequest: Codable {
    let driverId: String
    let vehicleId: String
    let location: Coordinate?

    enum CodingKeys: String, CodingKey {
        case driverId = "driver_id"
        case vehicleId = "vehicle_id"
        case location
    }
}

private struct ClockInResponse: Codable {
    let shift: Shift
}

private struct ClockOutRequest: Codable {
    let shiftId: String
    let location: Coordinate?
    let notes: String?

    enum CodingKeys: String, CodingKey {
        case shiftId = "shift_id"
        case location
        case notes
    }
}

private struct ClockOutResponse: Codable {
    let shift: Shift
}

private struct StartBreakRequest: Codable {
    let shiftId: String
    let breakType: BreakType
    let isPaid: Bool

    enum CodingKeys: String, CodingKey {
        case shiftId = "shift_id"
        case breakType = "break_type"
        case isPaid = "is_paid"
    }
}

private struct EndBreakRequest: Codable {
    let shiftId: String

    enum CodingKeys: String, CodingKey {
        case shiftId = "shift_id"
    }
}

private struct CreateShiftRequest: Codable {
    let driverId: String
    let vehicleId: String
    let startTime: Date
    let endTime: Date
    let notes: String?

    enum CodingKeys: String, CodingKey {
        case driverId = "driver_id"
        case vehicleId = "vehicle_id"
        case startTime = "start_time"
        case endTime = "end_time"
        case notes
    }
}

private struct ShiftResponse: Codable {
    let shift: Shift
}

private struct ShiftsResponse: Codable {
    let shifts: [Shift]
    let hasMore: Bool

    enum CodingKeys: String, CodingKey {
        case shifts
        case hasMore = "has_more"
    }
}

private struct CurrentShiftResponse: Codable {
    let shift: Shift?
}

private struct ShiftTemplateResponse: Codable {
    let template: ShiftTemplate
}

private struct ShiftTemplatesResponse: Codable {
    let templates: [ShiftTemplate]
}

private struct ShiftSwapRequestCreate: Codable {
    let originalShiftId: String
    let targetDriverId: String?
    let targetShiftId: String?
    let reason: String

    enum CodingKeys: String, CodingKey {
        case originalShiftId = "original_shift_id"
        case targetDriverId = "target_driver_id"
        case targetShiftId = "target_shift_id"
        case reason
    }
}

private struct ShiftSwapResponse: Codable {
    let swapRequest: ShiftSwapRequest

    enum CodingKeys: String, CodingKey {
        case swapRequest = "swap_request"
    }
}

private struct ShiftSwapsResponse: Codable {
    let swapRequests: [ShiftSwapRequest]

    enum CodingKeys: String, CodingKey {
        case swapRequests = "swap_requests"
    }
}

private struct RejectSwapRequest: Codable {
    let reason: String
}

private struct ShiftReportResponse: Codable {
    let report: ShiftReport
}

private struct EmptyRequest: Codable {}

// MARK: - NetworkManager Stub
// This should already exist in your project
class NetworkManager {
    static let shared = NetworkManager()

    func get<T: Decodable>(_ url: String) async throws -> T {
        // Implementation
        throw URLError(.badURL)
    }

    func post<T: Decodable, U: Encodable>(_ url: String, body: U) async throws -> T {
        // Implementation
        throw URLError(.badURL)
    }

    func put<T: Decodable, U: Encodable>(_ url: String, body: U) async throws -> T {
        // Implementation
        throw URLError(.badURL)
    }

    func delete(_ url: String) async throws {
        // Implementation
        throw URLError(.badURL)
    }
}
