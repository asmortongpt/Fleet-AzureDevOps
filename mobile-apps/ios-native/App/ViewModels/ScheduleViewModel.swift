import Foundation
import Combine

@MainActor
class ScheduleViewModel: ObservableObject {
    // MARK: - Published Properties

    @Published var schedules: [ScheduleEntry] = []
    @Published var selectedDate: Date = Date()
    @Published var viewMode: ViewMode = .day
    @Published var filterType: ScheduleType?
    @Published var filter: ScheduleFilter = ScheduleFilter()
    @Published var isLoading: Bool = false
    @Published var errorMessage: String?
    @Published var conflicts: [ScheduleConflict] = []
    @Published var statistics: ScheduleStatistics?

    // Driver schedule
    @Published var driverSchedule: DriverSchedule?
    @Published var driverScheduleWeek: [DriverSchedule] = []

    // Vehicle schedule
    @Published var vehicleSchedule: VehicleSchedule?

    // MARK: - Private Properties

    private let scheduleService = ScheduleService.shared
    private var cancellables = Set<AnyCancellable>()

    // MARK: - View Modes

    enum ViewMode: String, CaseIterable {
        case day = "Day"
        case week = "Week"
        case month = "Month"
        case agenda = "Agenda"

        var icon: String {
            switch self {
            case .day: return "calendar.day.timeline.left"
            case .week: return "calendar"
            case .month: return "calendar.circle"
            case .agenda: return "list.bullet"
            }
        }
    }

    // MARK: - Initialization

    init() {
        setupBindings()
    }

    private func setupBindings() {
        // Observe schedule service
        scheduleService.$schedules
            .receive(on: DispatchQueue.main)
            .assign(to: &$schedules)

        scheduleService.$conflicts
            .receive(on: DispatchQueue.main)
            .assign(to: &$conflicts)
    }

    // MARK: - Schedule Loading

    func loadSchedules() async {
        isLoading = true
        errorMessage = nil

        defer { isLoading = false }

        do {
            let loadedSchedules = try await scheduleService.fetchSchedules(for: selectedDate, filter: filter)
            schedules = loadedSchedules
            updateStatistics()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func loadSchedulesForDateRange(start: Date, end: Date) async {
        isLoading = true
        errorMessage = nil

        defer { isLoading = false }

        do {
            schedules = try await scheduleService.fetchSchedulesInRange(start: start, end: end)
            updateStatistics()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func refreshSchedules() async {
        await loadSchedules()
    }

    // MARK: - Schedule CRUD

    func createSchedule(_ entry: ScheduleEntry) async {
        do {
            try await scheduleService.createSchedule(entry)
            await loadSchedules()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func updateSchedule(_ entry: ScheduleEntry) async {
        do {
            try await scheduleService.updateSchedule(entry)
            await loadSchedules()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func deleteSchedule(_ id: String) async {
        do {
            try await scheduleService.deleteSchedule(id)
            await loadSchedules()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func getSchedule(by id: String) -> ScheduleEntry? {
        return scheduleService.getSchedule(by: id)
    }

    // MARK: - Driver Scheduling

    func loadDriverSchedule(driverId: String) async {
        isLoading = true
        errorMessage = nil

        defer { isLoading = false }

        do {
            driverSchedule = try await scheduleService.getDriverSchedule(driverId: driverId, date: selectedDate)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func loadDriverScheduleForWeek(driverId: String) async {
        isLoading = true
        errorMessage = nil

        defer { isLoading = false }

        do {
            let weekStart = selectedDate.startOfWeek()
            driverScheduleWeek = try await scheduleService.getDriverScheduleForWeek(driverId: driverId, weekStart: weekStart)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func assignDriver(driverId: String, driverName: String, to vehicleId: String, shift: ShiftSchedule) async {
        do {
            try await scheduleService.assignDriver(driverId: driverId, driverName: driverName, to: vehicleId, shift: shift)
            await loadSchedules()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func requestTimeOff(driverId: String, driverName: String, startDate: Date, endDate: Date, reason: String) async {
        do {
            try await scheduleService.requestTimeOff(
                driverId: driverId,
                driverName: driverName,
                startDate: startDate,
                endDate: endDate,
                reason: reason
            )
            await loadSchedules()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    // MARK: - Vehicle Scheduling

    func loadVehicleSchedule(vehicleId: String) async {
        isLoading = true
        errorMessage = nil

        defer { isLoading = false }

        do {
            vehicleSchedule = try await scheduleService.getVehicleSchedule(vehicleId: vehicleId, date: selectedDate)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func scheduleMaintenance(vehicleId: String, vehicleNumber: String, window: MaintenanceWindow) async {
        do {
            try await scheduleService.scheduleMaintenance(vehicleId: vehicleId, vehicleNumber: vehicleNumber, window: window)
            await loadSchedules()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    // MARK: - Filtering and Sorting

    var filteredSchedules: [ScheduleEntry] {
        var result = schedules

        if let filterType = filterType {
            result = result.filter { $0.type == filterType }
        }

        result = result.filter { filter.matches($0) }

        return result.sorted { lhs, rhs in
            // Sort by priority first, then by start date
            if lhs.priority.sortOrder != rhs.priority.sortOrder {
                return lhs.priority.sortOrder < rhs.priority.sortOrder
            }
            return lhs.startDate < rhs.startDate
        }
    }

    func schedulesForDate(_ date: Date) -> [ScheduleEntry] {
        let calendar = Calendar.current
        return filteredSchedules.filter { schedule in
            calendar.isDate(schedule.startDate, inSameDayAs: date)
        }
    }

    func schedulesForWeek(startingFrom date: Date) -> [Date: [ScheduleEntry]] {
        var result: [Date: [ScheduleEntry]] = [:]
        let calendar = Calendar.current

        for dayOffset in 0..<7 {
            if let date = calendar.date(byAdding: .day, value: dayOffset, to: date) {
                let daySchedules = schedulesForDate(date)
                if !daySchedules.isEmpty {
                    result[date] = daySchedules
                }
            }
        }

        return result
    }

    func schedulesForMonth(_ date: Date) -> [Date: [ScheduleEntry]] {
        var result: [Date: [ScheduleEntry]] = [:]
        let calendar = Calendar.current

        guard let range = calendar.range(of: .day, in: .month, for: date) else {
            return result
        }

        for day in range {
            if let dayDate = calendar.date(bySetting: .day, value: day, of: date) {
                let daySchedules = schedulesForDate(dayDate)
                if !daySchedules.isEmpty {
                    result[dayDate] = daySchedules
                }
            }
        }

        return result
    }

    // MARK: - Date Navigation

    func navigateToToday() {
        selectedDate = Date()
    }

    func navigateToPreviousPeriod() {
        let calendar = Calendar.current

        switch viewMode {
        case .day:
            selectedDate = calendar.date(byAdding: .day, value: -1, to: selectedDate) ?? selectedDate
        case .week:
            selectedDate = calendar.date(byAdding: .weekOfYear, value: -1, to: selectedDate) ?? selectedDate
        case .month:
            selectedDate = calendar.date(byAdding: .month, value: -1, to: selectedDate) ?? selectedDate
        case .agenda:
            selectedDate = calendar.date(byAdding: .day, value: -7, to: selectedDate) ?? selectedDate
        }
    }

    func navigateToNextPeriod() {
        let calendar = Calendar.current

        switch viewMode {
        case .day:
            selectedDate = calendar.date(byAdding: .day, value: 1, to: selectedDate) ?? selectedDate
        case .week:
            selectedDate = calendar.date(byAdding: .weekOfYear, value: 1, to: selectedDate) ?? selectedDate
        case .month:
            selectedDate = calendar.date(byAdding: .month, value: 1, to: selectedDate) ?? selectedDate
        case .agenda:
            selectedDate = calendar.date(byAdding: .day, value: 7, to: selectedDate) ?? selectedDate
        }
    }

    // MARK: - Conflict Management

    func checkConflicts(for entry: ScheduleEntry) async -> [ScheduleConflict] {
        return await scheduleService.detectConflicts(entry: entry)
    }

    func resolveConflict(_ conflict: ScheduleConflict, resolution: Resolution) async {
        do {
            try await scheduleService.resolveConflict(conflict, resolution: resolution)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    // MARK: - Statistics

    private func updateStatistics() {
        let dateRange = currentDateRange()
        statistics = scheduleService.getStatistics(for: dateRange)
    }

    private func currentDateRange() -> DateRange {
        let calendar = Calendar.current

        switch viewMode {
        case .day:
            let start = calendar.startOfDay(for: selectedDate)
            let end = calendar.date(byAdding: .day, value: 1, to: start)!
            return DateRange(start: start, end: end)

        case .week:
            let start = selectedDate.startOfWeek()
            let end = calendar.date(byAdding: .day, value: 7, to: start)!
            return DateRange(start: start, end: end)

        case .month:
            let start = calendar.date(from: calendar.dateComponents([.year, .month], from: selectedDate))!
            let end = calendar.date(byAdding: .month, value: 1, to: start)!
            return DateRange(start: start, end: end)

        case .agenda:
            let start = Date()
            let end = calendar.date(byAdding: .month, value: 1, to: start)!
            return DateRange(start: start, end: end)
        }
    }

    // MARK: - Formatting

    func formattedDateRange() -> String {
        let formatter = DateFormatter()
        let calendar = Calendar.current

        switch viewMode {
        case .day:
            formatter.dateStyle = .long
            return formatter.string(from: selectedDate)

        case .week:
            let weekStart = selectedDate.startOfWeek()
            let weekEnd = calendar.date(byAdding: .day, value: 6, to: weekStart)!
            formatter.dateStyle = .medium

            if calendar.isDate(weekStart, equalTo: weekEnd, toGranularity: .month) {
                return "Week of \(formatter.string(from: weekStart))"
            } else {
                return "\(formatter.string(from: weekStart)) - \(formatter.string(from: weekEnd))"
            }

        case .month:
            formatter.dateFormat = "MMMM yyyy"
            return formatter.string(from: selectedDate)

        case .agenda:
            return "Upcoming Events"
        }
    }

    // MARK: - Export

    func exportSchedulesToCalendar() async {
        // Implementation would use CalendarSyncService
        // await CalendarSyncService.shared.exportSchedules(schedules)
    }

    func exportScheduleToPDF() async -> Data? {
        // Implementation would generate PDF report
        return nil
    }
}

// MARK: - Date Extensions

extension Date {
    func startOfWeek() -> Date {
        let calendar = Calendar.current
        let components = calendar.dateComponents([.yearForWeekOfYear, .weekOfYear], from: self)
        return calendar.date(from: components) ?? self
    }

    func endOfWeek() -> Date {
        let calendar = Calendar.current
        return calendar.date(byAdding: .day, value: 6, to: startOfWeek()) ?? self
    }

    func startOfMonth() -> Date {
        let calendar = Calendar.current
        let components = calendar.dateComponents([.year, .month], from: self)
        return calendar.date(from: components) ?? self
    }

    func endOfMonth() -> Date {
        let calendar = Calendar.current
        return calendar.date(byAdding: DateComponents(month: 1, day: -1), to: startOfMonth()) ?? self
    }

    func formattedTime() -> String {
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        return formatter.string(from: self)
    }

    func formattedDate() -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        return formatter.string(from: self)
    }

    func formattedDateTime() -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter.string(from: self)
    }

    func isToday() -> Bool {
        Calendar.current.isDateInToday(self)
    }

    func isTomorrow() -> Bool {
        Calendar.current.isDateInTomorrow(self)
    }

    func isYesterday() -> Bool {
        Calendar.current.isDateInYesterday(self)
    }

    func relativeDescription() -> String {
        if isToday() {
            return "Today"
        } else if isTomorrow() {
            return "Tomorrow"
        } else if isYesterday() {
            return "Yesterday"
        } else {
            return formattedDate()
        }
    }
}
