//
//  MaintenanceViewModel.swift
//  Fleet Manager
//
//  ViewModel for Maintenance view with scheduling and service history
//

import Foundation
import SwiftUI
import Combine

// MARK: - Base View Model Classes
// NOTE: These are included here because BaseViewModel.swift is not in the Xcode project

// MARK: - LoadingState
enum LoadingState: Equatable {
    case idle
    case loading
    case loaded
    case error(String)

    var isLoading: Bool {
        if case .loading = self { return true }
        return false
    }

    var hasError: Bool {
        if case .error = self { return true }
        return false
    }
}

// MARK: - BaseViewModel
@MainActor
class BaseViewModel: ObservableObject {
    @Published var loadingState: LoadingState = .idle
    @Published var errorMessage: String?

    private var cache = NSCache<NSString, AnyObject>()
    private let cacheQueue = DispatchQueue(label: "com.fleet.cache", attributes: .concurrent)
    private var loadStartTime: Date?
    var cancellables = Set<AnyCancellable>()

    init() {
        setupCache()
    }

    private func setupCache() {
        cache.countLimit = 100
        cache.totalCostLimit = 50 * 1024 * 1024
    }

    func cacheObject<T: AnyObject>(_ object: T, forKey key: String) {
        cacheQueue.async(flags: .barrier) {
            self.cache.setObject(object, forKey: NSString(string: key))
        }
    }

    func getCachedObject<T: AnyObject>(forKey key: String, type: T.Type) -> T? {
        var result: T?
        cacheQueue.sync {
            result = cache.object(forKey: NSString(string: key)) as? T
        }
        return result
    }

    func clearCache() {
        cacheQueue.async(flags: .barrier) {
            self.cache.removeAllObjects()
        }
    }

    func startLoading() {
        loadingState = .loading
        loadStartTime = Date()
    }

    func finishLoading() {
        loadingState = .loaded
        logPerformance()
    }

    func handleError(_ error: Error) {
        loadingState = .error(error.localizedDescription)
        errorMessage = error.localizedDescription
        logPerformance()
    }

    func handleErrorMessage(_ message: String) {
        loadingState = .error(message)
        errorMessage = message
        logPerformance()
    }

    func resetError() {
        loadingState = .idle
        errorMessage = nil
    }

    private func logPerformance() {
        #if DEBUG
        if let startTime = loadStartTime {
            let loadTime = Date().timeIntervalSince(startTime)
            print("⏱ Load time: \(String(format: "%.2f", loadTime))s - \(String(describing: type(of: self)))")
        }
        #endif
    }

    func performAsync<T>(_ operation: @escaping () async throws -> T,
                        onSuccess: @escaping (T) -> Void,
                        onError: ((Error) -> Void)? = nil) {
        Task {
            do {
                startLoading()
                let result = try await operation()
                await MainActor.run {
                    onSuccess(result)
                    finishLoading()
                }
            } catch {
                await MainActor.run {
                    onError?(error)
                    handleError(error)
                }
            }
        }
    }

    func loadMoreIfNeeded<T: Identifiable>(currentItem item: T, in items: [T], threshold: Int = 5) -> Bool {
        guard let index = items.firstIndex(where: { $0.id == item.id }) else { return false }
        return index >= items.count - threshold
    }
}

// MARK: - Paginatable Protocol
protocol Paginatable {
    var currentPage: Int { get set }
    var hasMorePages: Bool { get set }
    var itemsPerPage: Int { get }
    var isLoadingMore: Bool { get set }

    func loadNextPage() async
    func resetPagination()
}

// MARK: - PaginatableViewModel
@MainActor
class PaginatableViewModel: BaseViewModel, Paginatable {
    @Published var currentPage = 1
    @Published var hasMorePages = true
    @Published var isLoadingMore = false

    let itemsPerPage = 20

    func loadNextPage() async {
        // Override in subclasses
    }

    func resetPagination() {
        currentPage = 1
        hasMorePages = true
        isLoadingMore = false
    }

    func startLoadingMore() {
        isLoadingMore = true
    }

    func finishLoadingMore(itemsReceived: Int) {
        isLoadingMore = false
        currentPage += 1
        hasMorePages = itemsReceived >= itemsPerPage
    }
}

// MARK: - Searchable Protocol
protocol Searchable {
    var searchText: String { get set }
    var isSearching: Bool { get set }

    func performSearch()
    func clearSearch()
}

// MARK: - SearchableViewModel
@MainActor
class SearchableViewModel: PaginatableViewModel, Searchable {
    @Published var searchText = ""
    @Published var isSearching = false

    private var searchDebouncer: AnyCancellable?

    override init() {
        super.init()
        setupSearchDebouncer()
    }

    private func setupSearchDebouncer() {
        searchDebouncer = $searchText
            .debounce(for: .milliseconds(300), scheduler: RunLoop.main)
            .removeDuplicates()
            .sink { [weak self] _ in
                self?.performSearch()
            }
    }

    func performSearch() {
        // Override in subclasses
    }

    func clearSearch() {
        searchText = ""
        isSearching = false
    }
}

// MARK: - RefreshableViewModel
@MainActor
class RefreshableViewModel: SearchableViewModel {
    @Published var isRefreshing = false
    @Published var lastRefreshTime: Date?

    func refresh() async {
        // Override in subclasses
    }

    func startRefreshing() {
        isRefreshing = true
    }

    func finishRefreshing() {
        isRefreshing = false
        lastRefreshTime = Date()
    }

    var needsRefresh: Bool {
        guard let lastRefresh = lastRefreshTime else { return true }
        return Date().timeIntervalSince(lastRefresh) > 300
    }
}

// MARK: - MaintenanceViewModel

@MainActor
final class MaintenanceViewModel: RefreshableViewModel {

    // MARK: - Published Properties
    @Published var maintenanceRecords: [MaintenanceRecord] = []
    @Published var filteredRecords: [MaintenanceRecord] = []
    @Published var selectedRecord: MaintenanceRecord?
    @Published var selectedFilter: MaintenanceFilter = .all

    // Statistics
    @Published var overdueCount: Int = 0
    @Published var scheduledCount: Int = 0
    @Published var completedThisMonth: Int = 0
    @Published var totalCostThisMonth: Double = 0

    // Vehicles for scheduling
    @Published var vehicles: [Vehicle] = []

    // MARK: - Private Properties
    private let mockData = MockDataGenerator.shared
    private var allRecords: [MaintenanceRecord] = []

    // MARK: - Filter Options
    enum MaintenanceFilter: String, CaseIterable {
        case all = "All"
        case overdue = "Overdue"
        case scheduled = "Scheduled"
        case completed = "Completed"
        case thisMonth = "This Month"
        case thisWeek = "This Week"

        var icon: String {
            switch self {
            case .all: return "list.bullet"
            case .overdue: return "exclamationmark.triangle"
            case .scheduled: return "calendar"
            case .completed: return "checkmark.circle"
            case .thisMonth: return "calendar.badge.clock"
            case .thisWeek: return "calendar.day.timeline.left"
            }
        }

        var color: Color {
            switch self {
            case .all: return .gray
            case .overdue: return .red
            case .scheduled: return .blue
            case .completed: return .green
            case .thisMonth: return .purple
            case .thisWeek: return .orange
            }
        }
    }

    // MARK: - Initialization
    override init() {
        super.init()
        loadMaintenanceData()
    }

    // MARK: - Data Loading
    private func loadMaintenanceData() {
        Task {
            await loadData()
        }
    }

    @MainActor
    private func loadData() async {
        startLoading()

        // Simulate network delay
        await Task.sleep(200_000_000) // 0.2 seconds

        // Generate mock data
        vehicles = mockData.generateVehicles(count: 25)
        allRecords = mockData.generateMaintenanceRecords(count: 30, vehicles: vehicles)
        maintenanceRecords = allRecords

        // Update statistics
        updateStatistics()

        // Apply current filter
        applyFilter(selectedFilter)

        // Cache the data
        cacheMaintenanceData()

        finishLoading()
    }

    private func cacheMaintenanceData() {
        if let data = try? JSONEncoder().encode(allRecords) {
            cacheObject(data as AnyObject, forKey: "maintenance_cache")
        }
    }

    private func updateStatistics() {
        let now = Date()
        let calendar = Calendar.current
        let startOfMonth = calendar.dateInterval(of: .month, for: now)?.start ?? now

        overdueCount = allRecords.filter { $0.status == .overdue }.count
        scheduledCount = allRecords.filter { $0.status == .scheduled }.count

        let thisMonthRecords = allRecords.filter { record in
            guard let completedDate = record.completedDate else { return false }
            return completedDate >= startOfMonth
        }

        completedThisMonth = thisMonthRecords.count
        totalCostThisMonth = thisMonthRecords.map { $0.cost ?? 0 }.reduce(0, +)
    }

    // MARK: - Search
    override func performSearch() {
        filterRecords()
    }


    // MARK: - Filtering
    func applyFilter(_ filter: MaintenanceFilter) {
        selectedFilter = filter
        filterRecords()
    }

    private func filterRecords() {
        var result = allRecords

        // Apply search filter
        if !searchText.isEmpty {
            result = result.filter { record in
                (record.vehicleNumber?.localizedCaseInsensitiveContains(searchText) ?? false) ||
                record.type.rawValue.localizedCaseInsensitiveContains(searchText) ||
                (record.serviceProvider?.localizedCaseInsensitiveContains(searchText) ?? false) ||
                (record.notes?.localizedCaseInsensitiveContains(searchText) ?? false)
            }
        }

        // Apply status/date filter
        let calendar = Calendar.current
        let now = Date()

        switch selectedFilter {
        case .all:
            break
        case .overdue:
            result = result.filter { $0.status == .overdue }
        case .scheduled:
            result = result.filter { $0.status == .scheduled }
        case .completed:
            result = result.filter { $0.status == .completed }
        case .thisMonth:
            let startOfMonth = calendar.dateInterval(of: .month, for: now)?.start ?? now
            result = result.filter { $0.scheduledDate >= startOfMonth }
        case .thisWeek:
            let startOfWeek = calendar.dateInterval(of: .weekOfYear, for: now)?.start ?? now
            result = result.filter { $0.scheduledDate >= startOfWeek }
        }

        // Sort by date (urgent first, then by scheduled date)
        result.sort { first, second in
            if first.status == .overdue && second.status != .overdue {
                return true
            } else if first.status != .overdue && second.status == .overdue {
                return false
            } else {
                return first.scheduledDate < second.scheduledDate
            }
        }

        // Update filtered records with animation
        withAnimation(.easeInOut(duration: 0.2)) {
            filteredRecords = result
        }
    }

    // MARK: - Refresh
    override func refresh() async {
        startRefreshing()
        await loadData()
        finishRefreshing()
    }

    // MARK: - Maintenance Actions
    func scheduleNewMaintenance(vehicleId: String, type: String, date: Date) {
        guard let vehicle = vehicles.first(where: { $0.id == vehicleId }) else { return }

        // Convert type string to MaintenanceType enum, default to .preventive if not found
        let maintenanceType = MaintenanceType.allCases.first { $0.rawValue == type } ?? .preventive

        let newRecord = MaintenanceRecord(
            id: UUID().uuidString,
            vehicleId: vehicle.id,
            vehicleNumber: vehicle.number,
            type: maintenanceType,
            category: .other,
            scheduledDate: date,
            completedDate: nil,
            status: .scheduled,
            priority: .normal,
            description: "Scheduled maintenance",
            cost: nil,
            mileageAtService: vehicle.mileage,
            hoursAtService: nil,
            servicedBy: nil,
            serviceProvider: "To be determined",
            location: nil,
            notes: "Scheduled maintenance",
            parts: nil,
            attachments: nil,
            nextServiceMileage: nil,
            nextServiceDate: date.addingTimeInterval(90 * 24 * 3600),
            createdAt: Date(),
            lastModified: Date()
        )

        allRecords.insert(newRecord, at: 0)
        filterRecords()
        updateStatistics()
    }

    func markAsCompleted(_ record: MaintenanceRecord) {
        guard let index = allRecords.firstIndex(where: { $0.id == record.id }) else { return }

        var updatedRecord = MaintenanceRecord(
            id: record.id,
            vehicleId: record.vehicleId,
            vehicleNumber: record.vehicleNumber,
            type: record.type,
            category: record.category,
            scheduledDate: record.scheduledDate,
            completedDate: Date(),
            status: .completed,
            priority: record.priority,
            description: record.description,
            cost: record.cost,
            mileageAtService: record.mileageAtService,
            hoursAtService: record.hoursAtService,
            servicedBy: record.servicedBy,
            serviceProvider: record.serviceProvider,
            location: record.location,
            notes: "Service completed",
            parts: record.parts,
            attachments: record.attachments,
            nextServiceMileage: record.nextServiceMileage,
            nextServiceDate: record.nextServiceDate,
            createdAt: record.createdAt,
            lastModified: Date()
        )

        allRecords[index] = updatedRecord
        filterRecords()
        updateStatistics()
    }

    func cancelMaintenance(_ record: MaintenanceRecord) {
        guard let index = allRecords.firstIndex(where: { $0.id == record.id }) else { return }

        var updatedRecord = MaintenanceRecord(
            id: record.id,
            vehicleId: record.vehicleId,
            vehicleNumber: record.vehicleNumber,
            type: record.type,
            category: record.category,
            scheduledDate: record.scheduledDate,
            completedDate: nil,
            status: .cancelled,
            priority: record.priority,
            description: record.description,
            cost: 0,
            mileageAtService: record.mileageAtService,
            hoursAtService: record.hoursAtService,
            servicedBy: record.servicedBy,
            serviceProvider: record.serviceProvider,
            location: record.location,
            notes: "Service cancelled",
            parts: [],
            attachments: record.attachments,
            nextServiceMileage: record.nextServiceMileage,
            nextServiceDate: nil,
            createdAt: record.createdAt,
            lastModified: Date()
        )

        allRecords[index] = updatedRecord
        filterRecords()
        updateStatistics()
    }

    func rescheduleMaintenance(_ record: MaintenanceRecord, newDate: Date) {
        guard let index = allRecords.firstIndex(where: { $0.id == record.id }) else { return }

        var updatedRecord = MaintenanceRecord(
            id: record.id,
            vehicleId: record.vehicleId,
            vehicleNumber: record.vehicleNumber,
            type: record.type,
            category: record.category,
            scheduledDate: newDate,
            completedDate: nil,
            status: newDate < Date() ? .overdue : .scheduled,
            priority: record.priority,
            description: record.description,
            cost: record.cost,
            mileageAtService: record.mileageAtService,
            hoursAtService: record.hoursAtService,
            servicedBy: record.servicedBy,
            serviceProvider: record.serviceProvider,
            location: record.location,
            notes: "Rescheduled to \(newDate.formatted(date: .abbreviated, time: .omitted))",
            parts: record.parts,
            attachments: record.attachments,
            nextServiceMileage: record.nextServiceMileage,
            nextServiceDate: record.nextServiceDate,
            createdAt: record.createdAt,
            lastModified: Date()
        )

        allRecords[index] = updatedRecord
        filterRecords()
        updateStatistics()
    }

    func getMaintenanceForVehicle(_ vehicleId: String) -> [MaintenanceRecord] {
        allRecords.filter { $0.vehicleId == vehicleId }
    }

    func exportMaintenanceReport() {
        print("Exporting maintenance report...")
        // Would export to CSV/PDF
    }
}