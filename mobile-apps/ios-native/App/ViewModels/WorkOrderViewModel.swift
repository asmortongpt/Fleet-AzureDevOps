//
//  WorkOrderViewModel.swift
//  Fleet Manager - iOS Native App
//
//  ViewModel for Work Order Management with CRUD operations
//

import Foundation
import SwiftUI
import Combine

@MainActor
final class WorkOrderViewModel: ObservableObject {

    // MARK: - Published Properties
    @Published var workOrders: [WorkOrder] = []
    @Published var filteredWorkOrders: [WorkOrder] = []
    @Published var selectedWorkOrder: WorkOrder?
    @Published var technicians: [Technician] = []
    @Published var vehicles: [Vehicle] = []

    // Loading and error states
    @Published var loadingState: LoadingState = .idle
    @Published var errorMessage: String?
    @Published var isRefreshing = false

    // Search and filter
    @Published var searchText = ""
    @Published var selectedStatus: WorkOrderStatus?
    @Published var selectedPriority: WorkOrderPriority?
    @Published var selectedType: WorkOrderType?
    @Published var selectedTechId: String?

    // Statistics
    @Published var openCount: Int = 0
    @Published var inProgressCount: Int = 0
    @Published var completedThisWeek: Int = 0
    @Published var totalCostThisMonth: Double = 0
    @Published var averageCompletionTime: Double = 0

    // MARK: - Private Properties
    private let mockData = MockDataGenerator.shared
    private var cancellables = Set<AnyCancellable>()
    private var allWorkOrders: [WorkOrder] = []
    private var nextWONumber = 1000

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
                self?.filterWorkOrders()
            }
            .store(in: &cancellables)
    }

    // MARK: - Data Loading
    func loadData() {
        Task {
            loadingState = .loading

            // Simulate network delay
            try? await Task.sleep(nanoseconds: 300_000_000) // 0.3 seconds

            // Load mock data
            vehicles = mockData.generateVehicles(count: 25)
            technicians = mockData.generateTechnicians(count: 8)
            allWorkOrders = mockData.generateWorkOrders(count: 35, vehicles: vehicles, technicians: technicians)
            workOrders = allWorkOrders

            // Update statistics
            updateStatistics()

            // Apply initial filter
            filterWorkOrders()

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

    // MARK: - Statistics
    private func updateStatistics() {
        let now = Date()
        let calendar = Calendar.current
        let startOfMonth = calendar.dateInterval(of: .month, for: now)?.start ?? now
        let startOfWeek = calendar.dateInterval(of: .weekOfYear, for: now)?.start ?? now

        openCount = allWorkOrders.filter { $0.status == .open }.count
        inProgressCount = allWorkOrders.filter { $0.status == .inProgress }.count

        let completedThisWeekOrders = allWorkOrders.filter { wo in
            guard let completed = wo.completedDate else { return false }
            return completed >= startOfWeek
        }
        completedThisWeek = completedThisWeekOrders.count

        let thisMonthOrders = allWorkOrders.filter { wo in
            guard let completed = wo.completedDate else { return false }
            return completed >= startOfMonth
        }
        totalCostThisMonth = thisMonthOrders.reduce(0) { $0 + $1.totalCost }

        // Calculate average completion time
        let completedOrders = allWorkOrders.filter { $0.status == .completed }
        if !completedOrders.isEmpty {
            let totalDays = completedOrders.reduce(0.0) { total, wo in
                guard let completed = wo.completedDate else { return total }
                let start = wo.startedDate ?? wo.createdDate
                let days = calendar.dateComponents([.day], from: start, to: completed).day ?? 0
                return total + Double(days)
            }
            averageCompletionTime = totalDays / Double(completedOrders.count)
        }
    }

    // MARK: - Filtering
    func filterWorkOrders() {
        var result = allWorkOrders

        // Apply search filter
        if !searchText.isEmpty {
            result = result.filter { wo in
                wo.woNumber.localizedCaseInsensitiveContains(searchText) ||
                (wo.vehicleNumber?.localizedCaseInsensitiveContains(searchText) ?? false) ||
                wo.description.localizedCaseInsensitiveContains(searchText) ||
                (wo.assignedTechName?.localizedCaseInsensitiveContains(searchText) ?? false)
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

        // Apply type filter
        if let type = selectedType {
            result = result.filter { $0.type == type }
        }

        // Apply technician filter
        if let techId = selectedTechId {
            result = result.filter { $0.assignedTechId == techId }
        }

        // Sort by priority and date
        result.sort { first, second in
            if first.priority.sortOrder != second.priority.sortOrder {
                return first.priority.sortOrder < second.priority.sortOrder
            }
            return first.createdDate > second.createdDate
        }

        withAnimation(.easeInOut(duration: 0.2)) {
            filteredWorkOrders = result
        }
    }

    // MARK: - Filter Actions
    func clearFilters() {
        selectedStatus = nil
        selectedPriority = nil
        selectedType = nil
        selectedTechId = nil
        searchText = ""
        filterWorkOrders()
    }

    func applyStatusFilter(_ status: WorkOrderStatus?) {
        selectedStatus = status
        filterWorkOrders()
    }

    func applyPriorityFilter(_ priority: WorkOrderPriority?) {
        selectedPriority = priority
        filterWorkOrders()
    }

    func applyTypeFilter(_ type: WorkOrderType?) {
        selectedType = type
        filterWorkOrders()
    }

    func applyTechFilter(_ techId: String?) {
        selectedTechId = techId
        filterWorkOrders()
    }

    // MARK: - CRUD Operations

    func createWorkOrder(
        vehicleId: String,
        type: WorkOrderType,
        priority: WorkOrderPriority,
        description: String,
        assignedTechId: String?,
        scheduledDate: Date?,
        dueDate: Date?
    ) {
        guard let vehicle = vehicles.first(where: { $0.id == vehicleId }) else { return }

        let woNumber = String(format: "WO-%06d", nextWONumber)
        nextWONumber += 1

        let techName = technicians.first(where: { $0.id == assignedTechId })?.name

        let newWorkOrder = WorkOrder(
            woNumber: woNumber,
            vehicleId: vehicleId,
            vehicleNumber: vehicle.number,
            vehicleMake: vehicle.make,
            vehicleModel: vehicle.model,
            type: type,
            status: assignedTechId != nil ? .assigned : .open,
            priority: priority,
            description: description,
            assignedTechId: assignedTechId,
            assignedTechName: techName,
            scheduledDate: scheduledDate,
            dueDate: dueDate,
            mileageAtStart: vehicle.mileage,
            createdBy: "Current User"
        )

        allWorkOrders.insert(newWorkOrder, at: 0)
        updateStatistics()
        filterWorkOrders()
    }

    func updateWorkOrder(_ workOrder: WorkOrder) {
        guard let index = allWorkOrders.firstIndex(where: { $0.id == workOrder.id }) else { return }

        var updated = workOrder
        updated.lastModified = Date()

        allWorkOrders[index] = updated
        updateStatistics()
        filterWorkOrders()
    }

    func deleteWorkOrder(_ workOrder: WorkOrder) {
        allWorkOrders.removeAll { $0.id == workOrder.id }
        updateStatistics()
        filterWorkOrders()
    }

    // MARK: - Status Management

    func assignToTechnician(_ workOrder: WorkOrder, techId: String) {
        guard let index = allWorkOrders.firstIndex(where: { $0.id == workOrder.id }) else { return }
        guard let tech = technicians.first(where: { $0.id == techId }) else { return }

        var updated = workOrder
        updated.assignedTechId = techId
        updated.assignedTechName = tech.name
        updated.status = .assigned
        updated.lastModified = Date()

        allWorkOrders[index] = updated
        addSystemNote(to: updated, text: "Assigned to \(tech.name)")
        updateStatistics()
        filterWorkOrders()
    }

    func startWork(_ workOrder: WorkOrder) {
        guard let index = allWorkOrders.firstIndex(where: { $0.id == workOrder.id }) else { return }

        var updated = workOrder
        updated.status = .inProgress
        updated.startedDate = Date()
        updated.lastModified = Date()

        allWorkOrders[index] = updated
        addSystemNote(to: updated, text: "Work started")
        updateStatistics()
        filterWorkOrders()
    }

    func putOnHold(_ workOrder: WorkOrder, reason: String) {
        guard let index = allWorkOrders.firstIndex(where: { $0.id == workOrder.id }) else { return }

        var updated = workOrder
        updated.status = .onHold
        updated.lastModified = Date()

        allWorkOrders[index] = updated
        addSystemNote(to: updated, text: "Put on hold: \(reason)")
        updateStatistics()
        filterWorkOrders()
    }

    func markAwaitingParts(_ workOrder: WorkOrder) {
        guard let index = allWorkOrders.firstIndex(where: { $0.id == workOrder.id }) else { return }

        var updated = workOrder
        updated.status = .awaitingParts
        updated.lastModified = Date()

        allWorkOrders[index] = updated
        addSystemNote(to: updated, text: "Awaiting parts")
        updateStatistics()
        filterWorkOrders()
    }

    func completeWorkOrder(_ workOrder: WorkOrder, mileageAtComplete: Double?) {
        guard let index = allWorkOrders.firstIndex(where: { $0.id == workOrder.id }) else { return }

        var updated = workOrder
        updated.status = .completed
        updated.completedDate = Date()
        updated.mileageAtComplete = mileageAtComplete
        updated.lastModified = Date()

        allWorkOrders[index] = updated
        addSystemNote(to: updated, text: "Work order completed")
        updateStatistics()
        filterWorkOrders()
    }

    func cancelWorkOrder(_ workOrder: WorkOrder, reason: String) {
        guard let index = allWorkOrders.firstIndex(where: { $0.id == workOrder.id }) else { return }

        var updated = workOrder
        updated.status = .cancelled
        updated.lastModified = Date()

        allWorkOrders[index] = updated
        addSystemNote(to: updated, text: "Cancelled: \(reason)")
        updateStatistics()
        filterWorkOrders()
    }

    // MARK: - Parts Management

    func addPart(to workOrder: WorkOrder, part: WorkOrderPart) {
        guard let index = allWorkOrders.firstIndex(where: { $0.id == workOrder.id }) else { return }

        var updated = workOrder
        updated.parts.append(part)
        updated.lastModified = Date()

        allWorkOrders[index] = updated
        addSystemNote(to: updated, text: "Added part: \(part.name) (Qty: \(part.quantity))")
        filterWorkOrders()
    }

    func removePart(from workOrder: WorkOrder, partId: String) {
        guard let index = allWorkOrders.firstIndex(where: { $0.id == workOrder.id }) else { return }

        var updated = workOrder
        if let partIndex = updated.parts.firstIndex(where: { $0.id == partId }) {
            let part = updated.parts[partIndex]
            updated.parts.remove(at: partIndex)
            updated.lastModified = Date()

            allWorkOrders[index] = updated
            addSystemNote(to: updated, text: "Removed part: \(part.name)")
            filterWorkOrders()
        }
    }

    func updatePart(in workOrder: WorkOrder, part: WorkOrderPart) {
        guard let index = allWorkOrders.firstIndex(where: { $0.id == workOrder.id }) else { return }

        var updated = workOrder
        if let partIndex = updated.parts.firstIndex(where: { $0.id == part.id }) {
            updated.parts[partIndex] = part
            updated.lastModified = Date()

            allWorkOrders[index] = updated
            filterWorkOrders()
        }
    }

    // MARK: - Notes Management

    func addNote(to workOrder: WorkOrder, text: String, author: String = "Current User") {
        guard let index = allWorkOrders.firstIndex(where: { $0.id == workOrder.id }) else { return }

        let note = WorkOrderNote(text: text, author: author)
        var updated = workOrder
        updated.notes.append(note)
        updated.lastModified = Date()

        allWorkOrders[index] = updated
        filterWorkOrders()
    }

    private func addSystemNote(to workOrder: WorkOrder, text: String) {
        guard let index = allWorkOrders.firstIndex(where: { $0.id == workOrder.id }) else { return }

        let note = WorkOrderNote(text: text, author: "System", isSystemNote: true)
        var updated = workOrder
        updated.notes.append(note)

        allWorkOrders[index] = updated
    }

    // MARK: - Labor Tracking

    func updateHoursWorked(for workOrder: WorkOrder, hours: Double) {
        guard let index = allWorkOrders.firstIndex(where: { $0.id == workOrder.id }) else { return }

        var updated = workOrder
        updated.hoursWorked = hours
        updated.lastModified = Date()

        allWorkOrders[index] = updated
        filterWorkOrders()
    }

    func updateLaborRate(for workOrder: WorkOrder, rate: Double) {
        guard let index = allWorkOrders.firstIndex(where: { $0.id == workOrder.id }) else { return }

        var updated = workOrder
        updated.laborRate = rate
        updated.lastModified = Date()

        allWorkOrders[index] = updated
        filterWorkOrders()
    }

    // MARK: - Helper Methods

    func getWorkOrdersForVehicle(_ vehicleId: String) -> [WorkOrder] {
        allWorkOrders.filter { $0.vehicleId == vehicleId }
    }

    func getWorkOrdersForTechnician(_ techId: String) -> [WorkOrder] {
        allWorkOrders.filter { $0.assignedTechId == techId }
    }

    func getOverdueWorkOrders() -> [WorkOrder] {
        allWorkOrders.filter { $0.isOverdue }
    }
}
