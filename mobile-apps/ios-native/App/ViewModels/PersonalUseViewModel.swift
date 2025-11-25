//
//  PersonalUseViewModel.swift
//  Fleet Manager
//
//  ViewModel for personal use tracking, mileage reimbursement, and approval workflow
//

import Foundation
import Combine
import SwiftUI

@MainActor
class PersonalUseViewModel: RefreshableViewModel {
    // MARK: - Published Properties
    @Published var personalTrips: [PersonalTrip] = []
    @Published var reimbursementRequests: [ReimbursementRequest] = []
    @Published var currentPolicy: ReimbursementPolicy?
    @Published var monthlySummary: PersonalUseSummary?
    @Published var selectedMonth: Date = Date()
    @Published var selectedTrip: PersonalTrip?
    @Published var selectedRequest: ReimbursementRequest?

    // UI State
    @Published var showingAddTrip = false
    @Published var showingSubmitRequest = false
    @Published var showingPolicyDetails = false
    @Published var showingApprovalQueue = false

    // Filter properties
    @Published var filterByStatus: ReimbursementStatus?
    @Published var filterByDriver: String?
    @Published var sortOption: SortOption = .dateDescending
    @Published var dateRange: DateRange = .currentMonth

    // Approval Queue (for managers)
    @Published var pendingRequests: [ReimbursementRequest] = []
    @Published var selectedRequestIds: Set<String> = []

    // MARK: - Computed Properties
    var filteredTrips: [PersonalTrip] {
        var filtered = personalTrips

        // Filter by date range
        let (startDate, endDate) = dateRange.dateInterval(relativeTo: selectedMonth)
        filtered = filtered.filter { trip in
            trip.startDate >= startDate && trip.startDate <= endDate
        }

        // Filter by search text
        if !searchText.isEmpty {
            filtered = filtered.filter {
                $0.vehicleNumber.localizedCaseInsensitiveContains(searchText) ||
                $0.driverName.localizedCaseInsensitiveContains(searchText) ||
                $0.purpose.localizedCaseInsensitiveContains(searchText)
            }
        }

        return filtered.sorted { $0.startDate > $1.startDate }
    }

    var filteredRequests: [ReimbursementRequest] {
        var filtered = reimbursementRequests

        if let statusFilter = filterByStatus {
            filtered = filtered.filter { $0.status == statusFilter }
        }

        if let driverFilter = filterByDriver {
            filtered = filtered.filter { $0.driverName == driverFilter }
        }

        if !searchText.isEmpty {
            filtered = filtered.filter {
                $0.driverName.localizedCaseInsensitiveContains(searchText) ||
                $0.id.localizedCaseInsensitiveContains(searchText)
            }
        }

        return sortRequests(filtered, by: sortOption)
    }

    var completedTripsThisMonth: [PersonalTrip] {
        filteredTrips.filter { $0.isCompleted }
    }

    var totalPersonalMilesThisMonth: Double {
        completedTripsThisMonth.reduce(0) { $0 + $1.totalMiles }
    }

    var estimatedReimbursementThisMonth: Double {
        guard let rate = currentPolicy?.ratePerMile else { return 0 }
        return totalPersonalMilesThisMonth * rate
    }

    var canSubmitRequest: Bool {
        !completedTripsThisMonth.isEmpty && currentPolicy != nil
    }

    var complianceStatus: ComplianceStatus {
        guard let policy = currentPolicy else { return .compliant }

        if let maxMiles = policy.maxMonthlyMiles {
            let percentage = (totalPersonalMilesThisMonth / maxMiles) * 100
            if percentage >= 100 {
                return .violation
            } else if percentage >= 80 {
                return .warning
            }
        }

        if let maxAmount = policy.maxMonthlyAmount {
            let percentage = (estimatedReimbursementThisMonth / maxAmount) * 100
            if percentage >= 100 {
                return .violation
            } else if percentage >= 80 {
                return .warning
            }
        }

        return .compliant
    }

    var mileageChartData: [MileageChartData] {
        // Generate last 6 months of data
        var data: [MileageChartData] = []
        let calendar = Calendar.current

        for i in (0..<6).reversed() {
            guard let monthDate = calendar.date(byAdding: .month, value: -i, to: Date()) else { continue }

            let startOfMonth = calendar.date(from: calendar.dateComponents([.year, .month], from: monthDate))!
            let endOfMonth = calendar.date(byAdding: DateComponents(month: 1, day: -1), to: startOfMonth)!

            let monthTrips = personalTrips.filter { trip in
                trip.startDate >= startOfMonth && trip.startDate <= endOfMonth && trip.isCompleted
            }

            let personalMiles = monthTrips.reduce(0) { $0 + $1.totalMiles }
            let businessMiles = Double.random(in: 500...2000) // Mock business miles

            let formatter = DateFormatter()
            formatter.dateFormat = "MMM"

            data.append(MileageChartData(
                month: formatter.string(from: monthDate),
                personalMiles: personalMiles,
                businessMiles: businessMiles
            ))
        }

        return data
    }

    var reimbursementChartData: [ReimbursementChartData] {
        // Generate last 6 months of reimbursement data
        var data: [ReimbursementChartData] = []
        let calendar = Calendar.current

        for i in (0..<6).reversed() {
            guard let monthDate = calendar.date(byAdding: .month, value: -i, to: Date()) else { continue }

            let startOfMonth = calendar.date(from: calendar.dateComponents([.year, .month], from: monthDate))!
            let endOfMonth = calendar.date(byAdding: DateComponents(month: 1, day: -1), to: startOfMonth)!

            let monthRequests = reimbursementRequests.filter { request in
                request.requestDate >= startOfMonth && request.requestDate <= endOfMonth &&
                (request.status == .approved || request.status == .paid)
            }

            let totalAmount = monthRequests.reduce(0) { $0 + $1.totalAmount }

            let formatter = DateFormatter()
            formatter.dateFormat = "MMM"

            data.append(ReimbursementChartData(
                month: formatter.string(from: monthDate),
                amount: totalAmount
            ))
        }

        return data
    }

    // MARK: - Initialization
    override init() {
        super.init()
        Task {
            await loadInitialData()
        }
    }

    // MARK: - Data Loading
    func loadInitialData() async {
        await refresh()
    }

    override func refresh() async {
        startRefreshing()

        await withTaskGroup(of: Void.self) { group in
            group.addTask { await self.loadPersonalTrips() }
            group.addTask { await self.loadReimbursementRequests() }
            group.addTask { await self.loadCurrentPolicy() }
            group.addTask { await self.loadMonthlySummary() }
            group.addTask { await self.loadPendingRequests() }
        }

        finishRefreshing()
    }

    func loadPersonalTrips() async {
        do {
            startLoading()

            // Simulate API call - replace with actual API service
            try await Task.sleep(nanoseconds: 500_000_000)

            // Mock data - replace with actual API response
            let mockTrips = generateMockPersonalTrips()

            await MainActor.run {
                self.personalTrips = mockTrips
                self.finishLoading()
            }
        } catch {
            handleError(error)
        }
    }

    func loadReimbursementRequests() async {
        do {
            // Simulate API call
            try await Task.sleep(nanoseconds: 400_000_000)

            let mockRequests = generateMockReimbursementRequests()

            await MainActor.run {
                self.reimbursementRequests = mockRequests
            }
        } catch {
            print("Error loading reimbursement requests: \(error)")
        }
    }

    func loadCurrentPolicy() async {
        do {
            // Simulate API call
            try await Task.sleep(nanoseconds: 300_000_000)

            await MainActor.run {
                self.currentPolicy = ReimbursementPolicy.sample
            }
        } catch {
            print("Error loading policy: \(error)")
        }
    }

    func loadMonthlySummary() async {
        do {
            // Simulate API call
            try await Task.sleep(nanoseconds: 400_000_000)

            let summary = generateMonthlySummary()

            await MainActor.run {
                self.monthlySummary = summary
            }
        } catch {
            print("Error loading monthly summary: \(error)")
        }
    }

    func loadPendingRequests() async {
        do {
            // Simulate API call
            try await Task.sleep(nanoseconds: 300_000_000)

            await MainActor.run {
                self.pendingRequests = self.reimbursementRequests.filter { $0.status == .pending }
            }
        } catch {
            print("Error loading pending requests: \(error)")
        }
    }

    // MARK: - Trip Management
    func addTrip(_ trip: PersonalTrip) async {
        do {
            startLoading()

            // Simulate API call
            try await Task.sleep(nanoseconds: 500_000_000)

            await MainActor.run {
                self.personalTrips.insert(trip, at: 0)
                self.finishLoading()
                self.showingAddTrip = false
                ModernTheme.Haptics.success()
            }

            // Reload summary after adding trip
            await loadMonthlySummary()
        } catch {
            handleError(error)
        }
    }

    func updateTrip(_ trip: PersonalTrip) async {
        do {
            startLoading()

            // Simulate API call
            try await Task.sleep(nanoseconds: 300_000_000)

            await MainActor.run {
                if let index = self.personalTrips.firstIndex(where: { $0.id == trip.id }) {
                    self.personalTrips[index] = trip
                }
                self.finishLoading()
                ModernTheme.Haptics.success()
            }

            await loadMonthlySummary()
        } catch {
            handleError(error)
        }
    }

    func deleteTrip(_ trip: PersonalTrip) async {
        do {
            startLoading()

            // Simulate API call
            try await Task.sleep(nanoseconds: 300_000_000)

            await MainActor.run {
                self.personalTrips.removeAll { $0.id == trip.id }
                self.finishLoading()
                ModernTheme.Haptics.success()
            }

            await loadMonthlySummary()
        } catch {
            handleError(error)
        }
    }

    func completeTrip(_ tripId: String, endOdometer: Double, endLocation: TripLocation) async {
        guard let tripIndex = personalTrips.firstIndex(where: { $0.id == tripId }) else { return }

        var updatedTrip = personalTrips[tripIndex]
        // Note: Can't mutate struct directly, would need to create new instance
        // This is simplified for demonstration

        await updateTrip(updatedTrip)
    }

    // MARK: - Reimbursement Request Management
    func submitReimbursementRequest(for tripIds: [String], notes: String?) async {
        guard let policy = currentPolicy else {
            handleErrorMessage("No active reimbursement policy found")
            return
        }

        let trips = personalTrips.filter { tripIds.contains($0.id) }
        guard !trips.isEmpty else {
            handleErrorMessage("No trips selected for reimbursement")
            return
        }

        let totalMiles = trips.reduce(0) { $0 + $1.totalMiles }
        let totalAmount = totalMiles * policy.ratePerMile

        let request = ReimbursementRequest(
            id: UUID().uuidString,
            driverId: trips.first?.driverId ?? "",
            driverName: trips.first?.driverName ?? "",
            driverEmail: nil,
            requestDate: Date(),
            periodStart: trips.map { $0.startDate }.min() ?? Date(),
            periodEnd: trips.map { $0.endDate ?? $0.startDate }.max() ?? Date(),
            tripIds: tripIds,
            totalMiles: totalMiles,
            reimbursementRate: policy.ratePerMile,
            totalAmount: totalAmount,
            status: .pending,
            submittedBy: trips.first?.driverName ?? "",
            approvedBy: nil,
            approvedDate: nil,
            rejectedReason: nil,
            paidDate: nil,
            paymentMethod: nil,
            notes: notes,
            attachments: nil
        )

        do {
            startLoading()

            // Simulate API call
            try await Task.sleep(nanoseconds: 500_000_000)

            await MainActor.run {
                self.reimbursementRequests.insert(request, at: 0)
                self.finishLoading()
                self.showingSubmitRequest = false
                ModernTheme.Haptics.success()
            }

            await loadPendingRequests()
        } catch {
            handleError(error)
        }
    }

    func approveRequest(_ request: ReimbursementRequest, approvedBy: String) async {
        do {
            startLoading()

            // Simulate API call
            try await Task.sleep(nanoseconds: 300_000_000)

            await MainActor.run {
                if let index = self.reimbursementRequests.firstIndex(where: { $0.id == request.id }) {
                    // Would update request status here
                    self.reimbursementRequests[index] = request
                }
                self.finishLoading()
                ModernTheme.Haptics.success()
            }

            await loadPendingRequests()
        } catch {
            handleError(error)
        }
    }

    func rejectRequest(_ request: ReimbursementRequest, reason: String) async {
        do {
            startLoading()

            // Simulate API call
            try await Task.sleep(nanoseconds: 300_000_000)

            await MainActor.run {
                if let index = self.reimbursementRequests.firstIndex(where: { $0.id == request.id }) {
                    // Would update request status here
                    self.reimbursementRequests[index] = request
                }
                self.finishLoading()
                ModernTheme.Haptics.success()
            }

            await loadPendingRequests()
        } catch {
            handleError(error)
        }
    }

    func batchApproveRequests(_ requestIds: [String], approvedBy: String) async {
        do {
            startLoading()

            // Simulate API call
            try await Task.sleep(nanoseconds: 500_000_000)

            await MainActor.run {
                for requestId in requestIds {
                    if let index = self.reimbursementRequests.firstIndex(where: { $0.id == requestId }) {
                        // Would update request status here
                    }
                }
                self.selectedRequestIds.removeAll()
                self.finishLoading()
                ModernTheme.Haptics.success()
            }

            await loadPendingRequests()
        } catch {
            handleError(error)
        }
    }

    func markRequestAsPaid(_ request: ReimbursementRequest, paymentMethod: PaymentMethod) async {
        do {
            startLoading()

            // Simulate API call
            try await Task.sleep(nanoseconds: 300_000_000)

            await MainActor.run {
                if let index = self.reimbursementRequests.firstIndex(where: { $0.id == request.id }) {
                    // Would update request status here
                    self.reimbursementRequests[index] = request
                }
                self.finishLoading()
                ModernTheme.Haptics.success()
            }
        } catch {
            handleError(error)
        }
    }

    // MARK: - Calculations
    func calculateReimbursement(for trips: [PersonalTrip]) -> Double {
        guard let rate = currentPolicy?.ratePerMile else { return 0 }
        let totalMiles = trips.reduce(0) { $0 + $1.totalMiles }
        return totalMiles * rate
    }

    func validatePolicyCompliance() -> (isCompliant: Bool, violations: [String]) {
        guard let policy = currentPolicy else {
            return (false, ["No active policy found"])
        }

        var violations: [String] = []

        if let maxMiles = policy.maxMonthlyMiles, totalPersonalMilesThisMonth > maxMiles {
            violations.append("Exceeds maximum monthly miles (\(String(format: "%.0f", maxMiles)) mi)")
        }

        if let maxAmount = policy.maxMonthlyAmount, estimatedReimbursementThisMonth > maxAmount {
            violations.append("Exceeds maximum monthly amount (\(String(format: "$%.2f", maxAmount)))")
        }

        return (violations.isEmpty, violations)
    }

    // MARK: - Export
    func exportReimbursementReceipt(for request: ReimbursementRequest) async -> URL? {
        do {
            // Simulate generating PDF receipt
            try await Task.sleep(nanoseconds: 500_000_000)

            // Would generate actual PDF here
            return nil
        } catch {
            print("Error exporting receipt: \(error)")
            return nil
        }
    }

    func exportMonthlyReport() async -> URL? {
        do {
            // Simulate generating report
            try await Task.sleep(nanoseconds: 500_000_000)

            // Would generate actual report here
            return nil
        } catch {
            print("Error exporting report: \(error)")
            return nil
        }
    }

    // MARK: - Sorting
    private func sortRequests(_ requests: [ReimbursementRequest], by option: SortOption) -> [ReimbursementRequest] {
        switch option {
        case .dateDescending:
            return requests.sorted { $0.requestDate > $1.requestDate }
        case .dateAscending:
            return requests.sorted { $0.requestDate < $1.requestDate }
        case .amountDescending:
            return requests.sorted { $0.totalAmount > $1.totalAmount }
        case .amountAscending:
            return requests.sorted { $0.totalAmount < $1.totalAmount }
        case .status:
            return requests.sorted { $0.status.rawValue < $1.status.rawValue }
        }
    }

    // MARK: - Search Override
    override func performSearch() {
        // Search is handled by filteredTrips and filteredRequests computed properties
        isSearching = !searchText.isEmpty
    }

    override func clearSearch() {
        super.clearSearch()
        filterByStatus = nil
        filterByDriver = nil
    }

    // MARK: - Mock Data Generation
    private func generateMockPersonalTrips() -> [PersonalTrip] {
        let vehicleIds = ["VEH-001", "VEH-002", "VEH-003"]
        let drivers = ["John Doe", "Jane Smith", "Bob Johnson"]
        let purposes = [
            "Medical appointment",
            "Personal errands",
            "Family emergency",
            "Religious service",
            "Educational course"
        ]

        return (0..<15).map { index in
            let startDate = Date().addingTimeInterval(Double(-index * 86400 * 2))
            let duration = TimeInterval.random(in: 1800...7200) // 30 min to 2 hours
            let miles = Double.random(in: 5...50)

            return PersonalTrip(
                id: "TRIP-\(String(format: "%03d", index + 1))",
                vehicleId: vehicleIds.randomElement()!,
                vehicleNumber: "V-\(Int.random(in: 10000...99999))",
                driverId: "DRV-\(Int.random(in: 1...3))",
                driverName: drivers.randomElement()!,
                startDate: startDate,
                endDate: startDate.addingTimeInterval(duration),
                startLocation: TripLocation.sample,
                endLocation: TripLocation(
                    address: "\(Int.random(in: 100...999)) Oak St",
                    city: "Washington",
                    state: "DC",
                    zipCode: "20002",
                    latitude: 38.91 + Double.random(in: -0.05...0.05),
                    longitude: -77.04 + Double.random(in: -0.05...0.05)
                ),
                startOdometer: Double.random(in: 40000...60000),
                endOdometer: Double.random(in: 40000...60000) + miles,
                purpose: purposes.randomElement()!,
                notes: index % 3 == 0 ? "Routine trip" : nil,
                isCompleted: true,
                createdAt: startDate.addingTimeInterval(-3600),
                updatedAt: startDate.addingTimeInterval(duration)
            )
        }
    }

    private func generateMockReimbursementRequests() -> [ReimbursementRequest] {
        let drivers = ["John Doe", "Jane Smith", "Bob Johnson"]
        let statuses: [ReimbursementStatus] = [.pending, .approved, .paid, .rejected]

        return (0..<10).map { index in
            let status = statuses.randomElement()!
            let requestDate = Date().addingTimeInterval(Double(-index * 86400 * 7))
            let miles = Double.random(in: 50...200)
            let rate = 0.67

            return ReimbursementRequest(
                id: "REQ-\(String(format: "%03d", index + 1))",
                driverId: "DRV-\(Int.random(in: 1...3))",
                driverName: drivers.randomElement()!,
                driverEmail: "\(drivers.randomElement()!.lowercased().replacingOccurrences(of: " ", with: "."))@example.com",
                requestDate: requestDate,
                periodStart: requestDate.addingTimeInterval(-30 * 86400),
                periodEnd: requestDate,
                tripIds: ["TRIP-001", "TRIP-002"],
                totalMiles: miles,
                reimbursementRate: rate,
                totalAmount: miles * rate,
                status: status,
                submittedBy: drivers.randomElement()!,
                approvedBy: status == .approved || status == .paid ? "Manager Name" : nil,
                approvedDate: status == .approved || status == .paid ? requestDate.addingTimeInterval(86400) : nil,
                rejectedReason: status == .rejected ? "Exceeds monthly limit" : nil,
                paidDate: status == .paid ? requestDate.addingTimeInterval(86400 * 3) : nil,
                paymentMethod: status == .paid ? .directDeposit : nil,
                notes: index % 2 == 0 ? "Monthly reimbursement" : nil,
                attachments: nil
            )
        }
    }

    private func generateMonthlySummary() -> PersonalUseSummary {
        let completedTrips = completedTripsThisMonth
        let personalMiles = totalPersonalMilesThisMonth
        let businessMiles = Double.random(in: 500...2000)
        let reimbursement = estimatedReimbursementThisMonth
        let outstanding = reimbursementRequests.filter { $0.status == .pending }.count

        return PersonalUseSummary(
            month: selectedMonth,
            totalTrips: completedTrips.count,
            totalPersonalMiles: personalMiles,
            totalBusinessMiles: businessMiles,
            reimbursementAmount: reimbursement,
            policyComplianceStatus: complianceStatus,
            outstandingRequests: outstanding
        )
    }
}

// MARK: - Supporting Types
enum DateRange: String, CaseIterable {
    case currentMonth = "Current Month"
    case lastMonth = "Last Month"
    case last3Months = "Last 3 Months"
    case last6Months = "Last 6 Months"
    case yearToDate = "Year to Date"
    case custom = "Custom"

    func dateInterval(relativeTo date: Date) -> (start: Date, end: Date) {
        let calendar = Calendar.current

        switch self {
        case .currentMonth:
            let startOfMonth = calendar.date(from: calendar.dateComponents([.year, .month], from: date))!
            let endOfMonth = calendar.date(byAdding: DateComponents(month: 1, day: -1), to: startOfMonth)!
            return (startOfMonth, endOfMonth)

        case .lastMonth:
            let lastMonth = calendar.date(byAdding: .month, value: -1, to: date)!
            let startOfMonth = calendar.date(from: calendar.dateComponents([.year, .month], from: lastMonth))!
            let endOfMonth = calendar.date(byAdding: DateComponents(month: 1, day: -1), to: startOfMonth)!
            return (startOfMonth, endOfMonth)

        case .last3Months:
            let startDate = calendar.date(byAdding: .month, value: -3, to: date)!
            return (startDate, date)

        case .last6Months:
            let startDate = calendar.date(byAdding: .month, value: -6, to: date)!
            return (startDate, date)

        case .yearToDate:
            let startOfYear = calendar.date(from: calendar.dateComponents([.year], from: date))!
            return (startOfYear, date)

        case .custom:
            return (date, date)
        }
    }
}

enum SortOption: String, CaseIterable {
    case dateDescending = "Date (Newest)"
    case dateAscending = "Date (Oldest)"
    case amountDescending = "Amount (Highest)"
    case amountAscending = "Amount (Lowest)"
    case status = "Status"

    var icon: String {
        switch self {
        case .dateDescending, .dateAscending:
            return "calendar"
        case .amountDescending, .amountAscending:
            return "dollarsign.circle"
        case .status:
            return "flag.fill"
        }
    }
}
