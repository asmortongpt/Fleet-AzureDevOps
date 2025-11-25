//
//  CostViewModel.swift
//  Fleet Manager
//
//  ViewModel for Cost Analysis Center with TCO, analytics, and budget tracking
//

import Foundation
import Combine
import SwiftUI

@MainActor
class CostViewModel: RefreshableViewModel {
    // MARK: - Published Properties
    @Published var costRecords: [CostRecord] = []
    @Published var analyticsSummary: CostAnalyticsSummary?
    @Published var tcoRecords: [TotalCostOfOwnership] = []
    @Published var budgets: [Budget] = []
    @Published var departmentSummaries: [DepartmentCostSummary] = []
    @Published var costTrends: [CostTrend] = []
    @Published var vehicleComparisons: [VehicleCostComparison] = []

    // Filters
    @Published var selectedCategory: CostCategory?
    @Published var selectedDepartment: String?
    @Published var selectedDateRange: DateRangeFilter = .thisMonth
    @Published var selectedVehicleId: String?

    // MARK: - Private Properties
    private let networkManager = AzureNetworkManager.shared

    // MARK: - Computed Properties
    var totalFleetCosts: Double {
        analyticsSummary?.totalFleetCosts ?? 0
    }

    var averageCostPerVehicle: Double {
        analyticsSummary?.averageCostPerVehicle ?? 0
    }

    var totalCostPerMile: Double {
        analyticsSummary?.totalCostPerMile ?? 0
    }

    var yearToDateCosts: Double {
        analyticsSummary?.yearToDateCosts ?? 0
    }

    var filteredCostRecords: [CostRecord] {
        var filtered = costRecords

        if let category = selectedCategory {
            filtered = filtered.filter { $0.category == category }
        }

        if let department = selectedDepartment {
            filtered = filtered.filter { $0.department == department }
        }

        if let vehicleId = selectedVehicleId {
            filtered = filtered.filter { $0.vehicleId == vehicleId }
        }

        let dateRange = selectedDateRange.dateInterval
        filtered = filtered.filter { dateRange.contains($0.date) }

        return filtered
    }

    var filteredBudgets: [Budget] {
        var filtered = budgets

        if let category = selectedCategory {
            filtered = filtered.filter { $0.category == category }
        }

        if let department = selectedDepartment {
            filtered = filtered.filter { $0.department == department }
        }

        return filtered
    }

    var budgetsOnTrack: Int {
        budgets.filter { $0.status == .onTrack }.count
    }

    var budgetsAtRisk: Int {
        budgets.filter { $0.status == .warning || $0.status == .critical }.count
    }

    var budgetsOverBudget: Int {
        budgets.filter { $0.status == .overBudget }.count
    }

    // MARK: - Data Loading Methods

    override func refresh() async {
        await loadAllData()
    }

    func loadAllData() async {
        startRefreshing()

        await withTaskGroup(of: Void.self) { group in
            group.addTask { await self.fetchCostAnalytics() }
            group.addTask { await self.fetchCostRecords() }
            group.addTask { await self.fetchBudgets() }
            group.addTask { await self.fetchDepartmentSummaries() }
            group.addTask { await self.fetchCostTrends() }
        }

        finishRefreshing()
    }

    func fetchCostAnalytics() async {
        do {
            let endpoint = "/api/v1/costs/analytics?range=\(selectedDateRange.apiParameter)"
            let response: CostAnalyticsResponse = try await networkManager.request(
                endpoint: endpoint,
                method: "GET"
            )
            analyticsSummary = response.analytics
        } catch {
            handleError(error)
        }
    }

    func fetchCostRecords(page: Int = 1) async {
        do {
            var endpoint = "/api/v1/costs?page=\(page)&limit=\(itemsPerPage)"

            if let category = selectedCategory {
                endpoint += "&category=\(category.rawValue)"
            }

            if let department = selectedDepartment {
                endpoint += "&department=\(department)"
            }

            if let vehicleId = selectedVehicleId {
                endpoint += "&vehicle_id=\(vehicleId)"
            }

            endpoint += "&range=\(selectedDateRange.apiParameter)"

            let response: CostRecordsResponse = try await networkManager.request(
                endpoint: endpoint,
                method: "GET"
            )

            if page == 1 {
                costRecords = response.costs
            } else {
                costRecords.append(contentsOf: response.costs)
            }
        } catch {
            handleError(error)
        }
    }

    func fetchBudgets() async {
        do {
            let endpoint = "/api/v1/budgets"
            let response: BudgetsResponse = try await networkManager.request(
                endpoint: endpoint,
                method: "GET"
            )
            budgets = response.budgets
        } catch {
            handleError(error)
        }
    }

    func fetchDepartmentSummaries() async {
        do {
            let endpoint = "/api/v1/costs/departments?range=\(selectedDateRange.apiParameter)"
            let response: DepartmentCostsResponse = try await networkManager.request(
                endpoint: endpoint,
                method: "GET"
            )
            departmentSummaries = response.departments
        } catch {
            handleError(error)
        }
    }

    func fetchCostTrends() async {
        do {
            let endpoint = "/api/v1/costs/trends?range=\(selectedDateRange.apiParameter)"
            let response: [CostTrend] = try await networkManager.request(
                endpoint: endpoint,
                method: "GET"
            )
            costTrends = response
        } catch {
            handleError(error)
        }
    }

    func fetchTCO(vehicleId: String) async -> TotalCostOfOwnership? {
        do {
            let endpoint = "/api/v1/costs/tco/\(vehicleId)"
            let response: TCOResponse = try await networkManager.request(
                endpoint: endpoint,
                method: "GET"
            )
            return response.tco
        } catch {
            handleError(error)
            return nil
        }
    }

    func fetchVehicleComparisons() async {
        do {
            let endpoint = "/api/v1/costs/vehicles/compare?range=\(selectedDateRange.apiParameter)"
            let response: [VehicleCostComparison] = try await networkManager.request(
                endpoint: endpoint,
                method: "GET"
            )
            vehicleComparisons = response
        } catch {
            handleError(error)
        }
    }

    // MARK: - Cost Calculations

    func calculateCostPerMile(totalCost: Double, mileage: Double) -> Double {
        guard mileage > 0 else { return 0 }
        return totalCost / mileage
    }

    func calculateCostPerHour(totalCost: Double, hours: Double) -> Double {
        guard hours > 0 else { return 0 }
        return totalCost / hours
    }

    func calculateTCO(for vehicleId: String) -> TotalCostOfOwnership? {
        tcoRecords.first { $0.vehicleId == vehicleId }
    }

    func calculateCategoryTotal(category: CostCategory) -> Double {
        costRecords.filter { $0.category == category }.reduce(0) { $0 + $1.amount }
    }

    func calculateDepartmentTotal(department: String) -> Double {
        costRecords.filter { $0.department == department }.reduce(0) { $0 + $1.amount }
    }

    func calculateBudgetVariance(budget: Budget) -> Double {
        budget.allocatedAmount - budget.spentAmount
    }

    func calculateBudgetProjection(budget: Budget) -> Double {
        let totalDays = Calendar.current.dateComponents([.day], from: budget.startDate, to: budget.endDate).day ?? 1
        let daysElapsed = Calendar.current.dateComponents([.day], from: budget.startDate, to: Date()).day ?? 1
        let daysRemaining = totalDays - daysElapsed

        guard daysElapsed > 0 else { return budget.spentAmount }

        let dailyBurnRate = budget.spentAmount / Double(daysElapsed)
        return budget.spentAmount + (dailyBurnRate * Double(daysRemaining))
    }

    // MARK: - Budget Management

    func createBudget(
        name: String,
        department: String?,
        vehicleId: String?,
        category: CostCategory?,
        period: BudgetPeriod,
        startDate: Date,
        endDate: Date,
        allocatedAmount: Double
    ) async -> Bool {
        do {
            let budget = Budget(
                id: UUID().uuidString,
                name: name,
                department: department,
                vehicleId: vehicleId,
                category: category,
                period: period,
                startDate: startDate,
                endDate: endDate,
                allocatedAmount: allocatedAmount,
                spentAmount: 0,
                projectedAmount: 0,
                createdBy: "Current User", // TODO: Get from auth
                createdAt: Date(),
                updatedAt: Date()
            )

            let _: Budget = try await networkManager.request(
                endpoint: "/api/v1/budgets",
                method: "POST",
                body: budget
            )

            await fetchBudgets()
            return true
        } catch {
            handleError(error)
            return false
        }
    }

    func updateBudget(_ budget: Budget) async -> Bool {
        do {
            let _: Budget = try await networkManager.request(
                endpoint: "/api/v1/budgets/\(budget.id)",
                method: "PUT",
                body: budget
            )

            await fetchBudgets()
            return true
        } catch {
            handleError(error)
            return false
        }
    }

    func deleteBudget(id: String) async -> Bool {
        do {
            try await networkManager.request(
                endpoint: "/api/v1/budgets/\(id)",
                method: "DELETE"
            )

            await fetchBudgets()
            return true
        } catch {
            handleError(error)
            return false
        }
    }

    // MARK: - Cost Record Management

    func addCostRecord(
        vehicleId: String,
        vehicleNumber: String,
        department: String,
        category: CostCategory,
        amount: Double,
        date: Date,
        odometer: Double?,
        vendor: String?,
        invoiceNumber: String?,
        description: String?
    ) async -> Bool {
        do {
            let record = CostRecord(
                id: UUID().uuidString,
                vehicleId: vehicleId,
                vehicleNumber: vehicleNumber,
                department: department,
                category: category,
                amount: amount,
                date: date,
                odometer: odometer,
                vendor: vendor,
                invoiceNumber: invoiceNumber,
                description: description,
                receiptImageUrl: nil,
                createdBy: "Current User", // TODO: Get from auth
                createdAt: Date()
            )

            let _: CostRecord = try await networkManager.request(
                endpoint: "/api/v1/costs",
                method: "POST",
                body: record
            )

            await fetchCostRecords()
            await fetchCostAnalytics()
            return true
        } catch {
            handleError(error)
            return false
        }
    }

    func deleteCostRecord(id: String) async -> Bool {
        do {
            try await networkManager.request(
                endpoint: "/api/v1/costs/\(id)",
                method: "DELETE"
            )

            await fetchCostRecords()
            await fetchCostAnalytics()
            return true
        } catch {
            handleError(error)
            return false
        }
    }

    // MARK: - Export

    func exportCostReport(format: ReportFormat) async -> Data? {
        do {
            let endpoint = "/api/v1/costs/export?format=\(format.rawValue)&range=\(selectedDateRange.apiParameter)"
            let data: Data = try await networkManager.request(
                endpoint: endpoint,
                method: "GET"
            )
            return data
        } catch {
            handleError(error)
            return nil
        }
    }

    func exportBudgetReport(format: ReportFormat) async -> Data? {
        do {
            let endpoint = "/api/v1/budgets/export?format=\(format.rawValue)"
            let data: Data = try await networkManager.request(
                endpoint: endpoint,
                method: "GET"
            )
            return data
        } catch {
            handleError(error)
            return nil
        }
    }

    // MARK: - Forecasting

    func forecastCosts(months: Int) -> [CostForecast] {
        guard !costTrends.isEmpty else { return [] }

        // Simple linear regression for forecasting
        let recentTrends = Array(costTrends.suffix(6)) // Last 6 periods
        let averageCost = recentTrends.reduce(0.0) { $0 + $1.totalCost } / Double(recentTrends.count)
        let averageGrowth = calculateAverageGrowthRate(trends: recentTrends)

        var forecasts: [CostForecast] = []
        var lastDate = recentTrends.last?.date ?? Date()
        var projectedCost = averageCost

        for month in 1...months {
            lastDate = Calendar.current.date(byAdding: .month, value: 1, to: lastDate) ?? lastDate
            projectedCost *= (1 + averageGrowth)

            forecasts.append(CostForecast(
                period: month,
                date: lastDate,
                projectedCost: projectedCost,
                confidenceLevel: max(0.5, 1.0 - (Double(month) * 0.1)) // Confidence decreases over time
            ))
        }

        return forecasts
    }

    private func calculateAverageGrowthRate(trends: [CostTrend]) -> Double {
        guard trends.count > 1 else { return 0 }

        var growthRates: [Double] = []
        for i in 1..<trends.count {
            let previousCost = trends[i - 1].totalCost
            let currentCost = trends[i].totalCost
            if previousCost > 0 {
                growthRates.append((currentCost - previousCost) / previousCost)
            }
        }

        guard !growthRates.isEmpty else { return 0 }
        return growthRates.reduce(0, +) / Double(growthRates.count)
    }

    // MARK: - Filter Management

    func clearFilters() {
        selectedCategory = nil
        selectedDepartment = nil
        selectedVehicleId = nil
        selectedDateRange = .thisMonth
    }

    func applyFilters() async {
        await fetchCostRecords()
        await fetchCostAnalytics()
    }
}

// MARK: - Cost Forecast
struct CostForecast: Identifiable {
    let id = UUID()
    let period: Int
    let date: Date
    let projectedCost: Double
    let confidenceLevel: Double

    var formattedCost: String {
        String(format: "$%.2f", projectedCost)
    }

    var confidencePercentage: String {
        String(format: "%.0f%%", confidenceLevel * 100)
    }
}

// MARK: - Date Range Filter
enum DateRangeFilter: String, CaseIterable {
    case thisWeek = "This Week"
    case thisMonth = "This Month"
    case thisQuarter = "This Quarter"
    case thisYear = "This Year"
    case lastMonth = "Last Month"
    case lastQuarter = "Last Quarter"
    case lastYear = "Last Year"
    case custom = "Custom"

    var dateInterval: DateInterval {
        let calendar = Calendar.current
        let now = Date()

        switch self {
        case .thisWeek:
            let startOfWeek = calendar.date(from: calendar.dateComponents([.yearForWeekOfYear, .weekOfYear], from: now))!
            let endOfWeek = calendar.date(byAdding: .day, value: 7, to: startOfWeek)!
            return DateInterval(start: startOfWeek, end: endOfWeek)

        case .thisMonth:
            let startOfMonth = calendar.date(from: calendar.dateComponents([.year, .month], from: now))!
            let endOfMonth = calendar.date(byAdding: DateComponents(month: 1, day: -1), to: startOfMonth)!
            return DateInterval(start: startOfMonth, end: endOfMonth)

        case .thisQuarter:
            let month = calendar.component(.month, from: now)
            let quarterStartMonth = ((month - 1) / 3) * 3 + 1
            let startOfQuarter = calendar.date(from: DateComponents(year: calendar.component(.year, from: now), month: quarterStartMonth, day: 1))!
            let endOfQuarter = calendar.date(byAdding: DateComponents(month: 3, day: -1), to: startOfQuarter)!
            return DateInterval(start: startOfQuarter, end: endOfQuarter)

        case .thisYear:
            let startOfYear = calendar.date(from: calendar.dateComponents([.year], from: now))!
            let endOfYear = calendar.date(byAdding: DateComponents(year: 1, day: -1), to: startOfYear)!
            return DateInterval(start: startOfYear, end: endOfYear)

        case .lastMonth:
            let startOfThisMonth = calendar.date(from: calendar.dateComponents([.year, .month], from: now))!
            let startOfLastMonth = calendar.date(byAdding: .month, value: -1, to: startOfThisMonth)!
            let endOfLastMonth = calendar.date(byAdding: .day, value: -1, to: startOfThisMonth)!
            return DateInterval(start: startOfLastMonth, end: endOfLastMonth)

        case .lastQuarter:
            let month = calendar.component(.month, from: now)
            let currentQuarterStartMonth = ((month - 1) / 3) * 3 + 1
            let lastQuarterStartMonth = currentQuarterStartMonth - 3
            let startOfLastQuarter = calendar.date(from: DateComponents(year: calendar.component(.year, from: now), month: lastQuarterStartMonth, day: 1))!
            let endOfLastQuarter = calendar.date(byAdding: DateComponents(month: 3, day: -1), to: startOfLastQuarter)!
            return DateInterval(start: startOfLastQuarter, end: endOfLastQuarter)

        case .lastYear:
            let startOfThisYear = calendar.date(from: calendar.dateComponents([.year], from: now))!
            let startOfLastYear = calendar.date(byAdding: .year, value: -1, to: startOfThisYear)!
            let endOfLastYear = calendar.date(byAdding: .day, value: -1, to: startOfThisYear)!
            return DateInterval(start: startOfLastYear, end: endOfLastYear)

        case .custom:
            // Default to this month for custom - will be overridden by user selection
            let startOfMonth = calendar.date(from: calendar.dateComponents([.year, .month], from: now))!
            let endOfMonth = calendar.date(byAdding: DateComponents(month: 1, day: -1), to: startOfMonth)!
            return DateInterval(start: startOfMonth, end: endOfMonth)
        }
    }

    var apiParameter: String {
        rawValue.lowercased().replacingOccurrences(of: " ", with: "_")
    }
}
