//
//  BudgetPlanningViewModel.swift
//  Fleet Manager
//
//  ViewModel for Budget Planning with variance analysis and forecasting
//

import Foundation
import Combine
import SwiftUI

@MainActor
class BudgetPlanningViewModel: RefreshableViewModel {
    // MARK: - Published Properties
    @Published var budgetPlans: [BudgetPlan] = []
    @Published var activeBudget: BudgetPlan?
    @Published var variances: [BudgetVariance] = []
    @Published var forecasts: [ForecastData] = []
    @Published var metrics: BudgetMetrics?
    @Published var templates: [BudgetTemplate] = []

    // Filters
    @Published var selectedFiscalYear: Int = Calendar.current.component(.year, from: Date())
    @Published var selectedCategory: BudgetCategory?
    @Published var selectedDepartment: String?
    @Published var showOnlyActive: Bool = true

    // MARK: - Private Properties
    private let networkManager = AzureNetworkManager.shared

    // MARK: - Computed Properties
    var filteredBudgets: [BudgetPlan] {
        var filtered = budgetPlans

        if showOnlyActive {
            filtered = filtered.filter { $0.isActive }
        }

        if selectedFiscalYear > 0 {
            filtered = filtered.filter { $0.fiscalYear == selectedFiscalYear }
        }

        if let department = selectedDepartment {
            filtered = filtered.filter { $0.department == department }
        }

        return filtered.sorted { $0.startDate > $1.startDate }
    }

    var totalBudgeted: Double {
        filteredBudgets.reduce(0) { $0 + $1.totalAllocated }
    }

    var totalSpent: Double {
        filteredBudgets.reduce(0) { $0 + $1.totalSpent }
    }

    var totalRemaining: Double {
        totalBudgeted - totalSpent
    }

    var overallPercentageUsed: Double {
        guard totalBudgeted > 0 else { return 0 }
        return (totalSpent / totalBudgeted) * 100
    }

    var budgetsOnTrack: Int {
        filteredBudgets.filter { $0.status == .onTrack }.count
    }

    var budgetsAtRisk: Int {
        filteredBudgets.filter { $0.status == .warning || $0.status == .critical }.count
    }

    var budgetsOverBudget: Int {
        filteredBudgets.filter { $0.status == .overBudget }.count
    }

    var availableFiscalYears: [Int] {
        let currentYear = Calendar.current.component(.year, from: Date())
        return Array((currentYear - 2)...(currentYear + 2))
    }

    // MARK: - Data Loading Methods

    override func refresh() async {
        await loadAllData()
    }

    func loadAllData() async {
        startRefreshing()

        await withTaskGroup(of: Void.self) { group in
            group.addTask { await self.fetchBudgetPlans() }
            group.addTask { await self.fetchTemplates() }
        }

        if let activeBudget = activeBudget {
            await fetchVariances(budgetId: activeBudget.id)
            await fetchForecasts(budgetId: activeBudget.id)
            await fetchMetrics(budgetId: activeBudget.id)
        }

        finishRefreshing()
    }

    func fetchBudgetPlans() async {
        do {
            var endpoint = "/api/v1/budget?fiscal_year=\(selectedFiscalYear)"

            if showOnlyActive {
                endpoint += "&active=true"
            }

            if let department = selectedDepartment {
                endpoint += "&department=\(department)"
            }

            let response: BudgetPlansResponse = try await networkManager.request(
                endpoint: endpoint,
                method: "GET"
            )
            budgetPlans = response.budgets

            // Set active budget to the most recent one if not set
            if activeBudget == nil, let firstBudget = budgetPlans.first {
                activeBudget = firstBudget
            }
        } catch {
            handleError(error)
        }
    }

    func fetchBudgetPlan(id: String) async {
        do {
            let endpoint = "/api/v1/budget/\(id)"
            let response: BudgetPlanResponse = try await networkManager.request(
                endpoint: endpoint,
                method: "GET"
            )
            activeBudget = response.budget

            // Update in list
            if let index = budgetPlans.firstIndex(where: { $0.id == id }) {
                budgetPlans[index] = response.budget
            }

            // Load related data
            await fetchVariances(budgetId: id)
            await fetchForecasts(budgetId: id)
            await fetchMetrics(budgetId: id)
        } catch {
            handleError(error)
        }
    }

    func fetchVariances(budgetId: String) async {
        do {
            let endpoint = "/api/v1/budget/\(budgetId)/variances"
            let response: BudgetVariancesResponse = try await networkManager.request(
                endpoint: endpoint,
                method: "GET"
            )
            variances = response.variances
        } catch {
            handleError(error)
        }
    }

    func fetchForecasts(budgetId: String) async {
        do {
            let endpoint = "/api/v1/budget/\(budgetId)/forecast"
            let response: BudgetForecastResponse = try await networkManager.request(
                endpoint: endpoint,
                method: "GET"
            )
            forecasts = response.forecasts
        } catch {
            handleError(error)
        }
    }

    func fetchMetrics(budgetId: String) async {
        do {
            let endpoint = "/api/v1/budget/\(budgetId)/metrics"
            let response: BudgetMetricsResponse = try await networkManager.request(
                endpoint: endpoint,
                method: "GET"
            )
            metrics = response.metrics
        } catch {
            handleError(error)
        }
    }

    func fetchTemplates() async {
        do {
            let endpoint = "/api/v1/budget/templates"
            let response: BudgetTemplatesResponse = try await networkManager.request(
                endpoint: endpoint,
                method: "GET"
            )
            templates = response.templates
        } catch {
            handleError(error)
        }
    }

    // MARK: - Budget Management

    func createBudget(
        name: String,
        fiscalYear: Int,
        period: BudgetPeriod,
        startDate: Date,
        endDate: Date,
        categories: [BudgetAllocation],
        department: String?,
        vehicleId: String?
    ) async -> Bool {
        do {
            let totalAllocated = categories.reduce(0) { $0 + $1.allocatedAmount }

            let budget = BudgetPlan(
                id: UUID().uuidString,
                name: name,
                fiscalYear: fiscalYear,
                startDate: startDate,
                endDate: endDate,
                period: period,
                totalAllocated: totalAllocated,
                totalSpent: 0,
                totalProjected: 0,
                categories: categories,
                department: department,
                vehicleId: vehicleId,
                createdBy: "Current User", // TODO: Get from auth
                createdAt: Date(),
                updatedAt: Date(),
                isActive: true
            )

            let response: BudgetPlanResponse = try await networkManager.request(
                endpoint: "/api/v1/budget",
                method: "POST",
                body: budget
            )

            budgetPlans.insert(response.budget, at: 0)
            activeBudget = response.budget
            return true
        } catch {
            handleError(error)
            return false
        }
    }

    func updateBudget(_ budget: BudgetPlan) async -> Bool {
        do {
            let response: BudgetPlanResponse = try await networkManager.request(
                endpoint: "/api/v1/budget/\(budget.id)",
                method: "PUT",
                body: budget
            )

            if let index = budgetPlans.firstIndex(where: { $0.id == budget.id }) {
                budgetPlans[index] = response.budget
            }

            if activeBudget?.id == budget.id {
                activeBudget = response.budget
            }

            return true
        } catch {
            handleError(error)
            return false
        }
    }

    func deleteBudget(id: String) async -> Bool {
        do {
            try await networkManager.request(
                endpoint: "/api/v1/budget/\(id)",
                method: "DELETE"
            )

            budgetPlans.removeAll { $0.id == id }

            if activeBudget?.id == id {
                activeBudget = budgetPlans.first
            }

            return true
        } catch {
            handleError(error)
            return false
        }
    }

    func createFromTemplate(template: BudgetTemplate, fiscalYear: Int, startDate: Date) async -> Bool {
        let period = template.period
        var endDate = startDate

        switch period {
        case .monthly:
            endDate = Calendar.current.date(byAdding: .month, value: 1, to: startDate) ?? startDate
        case .quarterly:
            endDate = Calendar.current.date(byAdding: .month, value: 3, to: startDate) ?? startDate
        case .annual:
            endDate = Calendar.current.date(byAdding: .year, value: 1, to: startDate) ?? startDate
        case .custom:
            endDate = Calendar.current.date(byAdding: .month, value: 1, to: startDate) ?? startDate
        }

        return await createBudget(
            name: "\(template.name) - FY\(fiscalYear)",
            fiscalYear: fiscalYear,
            period: period,
            startDate: startDate,
            endDate: endDate,
            categories: template.categories,
            department: nil,
            vehicleId: nil
        )
    }

    func copyBudget(from budget: BudgetPlan, toFiscalYear fiscalYear: Int) async -> Bool {
        let calendar = Calendar.current
        let yearDifference = fiscalYear - budget.fiscalYear

        guard let newStartDate = calendar.date(byAdding: .year, value: yearDifference, to: budget.startDate),
              let newEndDate = calendar.date(byAdding: .year, value: yearDifference, to: budget.endDate) else {
            return false
        }

        // Reset spent and projected amounts
        let newCategories = budget.categories.map { allocation in
            BudgetAllocation(
                id: UUID().uuidString,
                category: allocation.category,
                allocatedAmount: allocation.allocatedAmount,
                spentAmount: 0,
                projectedAmount: 0,
                percentage: allocation.percentage
            )
        }

        return await createBudget(
            name: "\(budget.name) (Copy FY\(fiscalYear))",
            fiscalYear: fiscalYear,
            period: budget.period,
            startDate: newStartDate,
            endDate: newEndDate,
            categories: newCategories,
            department: budget.department,
            vehicleId: budget.vehicleId
        )
    }

    // MARK: - Variance Analysis

    func calculateVariance(actual: Double, budgeted: Double) -> BudgetVariance {
        let variance = budgeted - actual
        let percentage = budgeted > 0 ? (variance / budgeted) * 100 : 0
        let status: VarianceStatus

        if abs(variance) < 100 {
            status = .neutral
        } else {
            status = variance >= 0 ? .favorable : .unfavorable
        }

        return BudgetVariance(
            id: UUID().uuidString,
            budgetId: activeBudget?.id ?? "",
            category: .other,
            period: "Current",
            actual: actual,
            budgeted: budgeted,
            variance: variance,
            variancePercentage: percentage,
            status: status,
            date: Date()
        )
    }

    func analyzeVariances(for budget: BudgetPlan) -> [BudgetVariance] {
        budget.categories.map { allocation in
            let variance = allocation.allocatedAmount - allocation.spentAmount
            let percentage = allocation.allocatedAmount > 0 ? (variance / allocation.allocatedAmount) * 100 : 0
            let status: VarianceStatus

            if abs(variance) < 100 {
                status = .neutral
            } else {
                status = variance >= 0 ? .favorable : .unfavorable
            }

            return BudgetVariance(
                id: UUID().uuidString,
                budgetId: budget.id,
                category: allocation.category,
                period: budget.period.rawValue,
                actual: allocation.spentAmount,
                budgeted: allocation.allocatedAmount,
                variance: variance,
                variancePercentage: percentage,
                status: status,
                date: Date()
            )
        }
    }

    // MARK: - Forecasting (Linear Regression)

    func forecastSpending(for budget: BudgetPlan, months: Int) -> [ForecastData] {
        var forecasts: [ForecastData] = []
        let calendar = Calendar.current
        var currentDate = Date()

        // Calculate trend based on current spending
        let daysElapsed = max(1, budget.daysElapsed)
        let dailyBurnRate = budget.totalSpent / Double(daysElapsed)

        // Calculate seasonal factor (simple average for now)
        let seasonalFactor = 1.0

        for month in 1...months {
            guard let futureDate = calendar.date(byAdding: .month, value: month, to: currentDate) else {
                continue
            }

            let daysInFuture = calendar.dateComponents([.day], from: currentDate, to: futureDate).day ?? 30
            let projectedAmount = budget.totalSpent + (dailyBurnRate * Double(daysInFuture))

            // Confidence decreases over time
            let confidence = max(0.3, 1.0 - (Double(month) * 0.08))

            // Apply trend and seasonal factors
            let trendFactor = 1.0 + (Double(month) * 0.02) // 2% monthly growth assumption
            let adjustedProjection = projectedAmount * trendFactor * seasonalFactor

            forecasts.append(ForecastData(
                id: UUID().uuidString,
                budgetId: budget.id,
                category: nil,
                period: "Month \(month)",
                date: futureDate,
                projectedAmount: adjustedProjection,
                confidenceLevel: confidence,
                baselineAmount: projectedAmount,
                trendFactor: trendFactor,
                seasonalFactor: seasonalFactor
            ))
        }

        return forecasts
    }

    func forecastCategorySpending(category: BudgetAllocation, months: Int) -> [ForecastData] {
        var forecasts: [ForecastData] = []
        let calendar = Calendar.current
        var currentDate = Date()

        guard let budget = activeBudget else { return [] }

        let daysElapsed = max(1, budget.daysElapsed)
        let dailyBurnRate = category.spentAmount / Double(daysElapsed)

        for month in 1...months {
            guard let futureDate = calendar.date(byAdding: .month, value: month, to: currentDate) else {
                continue
            }

            let daysInFuture = calendar.dateComponents([.day], from: currentDate, to: futureDate).day ?? 30
            let projectedAmount = category.spentAmount + (dailyBurnRate * Double(daysInFuture))

            let confidence = max(0.3, 1.0 - (Double(month) * 0.08))
            let trendFactor = 1.0 + (Double(month) * 0.02)
            let seasonalFactor = 1.0

            forecasts.append(ForecastData(
                id: UUID().uuidString,
                budgetId: budget.id,
                category: category.category,
                period: "Month \(month)",
                date: futureDate,
                projectedAmount: projectedAmount * trendFactor * seasonalFactor,
                confidenceLevel: confidence,
                baselineAmount: projectedAmount,
                trendFactor: trendFactor,
                seasonalFactor: seasonalFactor
            ))
        }

        return forecasts
    }

    // MARK: - Alerts

    func checkBudgetAlerts(for budget: BudgetPlan) -> [BudgetAlert] {
        var alerts: [BudgetAlert] = []

        // Overall budget alert
        if budget.percentageUsed >= 100 {
            alerts.append(BudgetAlert(
                type: .overBudget,
                message: "Budget '\(budget.name)' has exceeded the allocated amount by \(String(format: "%.1f%%", budget.percentageUsed - 100)).",
                severity: .critical
            ))
        } else if budget.percentageUsed >= 90 {
            alerts.append(BudgetAlert(
                type: .approaching,
                message: "Budget '\(budget.name)' is at \(String(format: "%.1f%%", budget.percentageUsed)) of allocated amount.",
                severity: .high
            ))
        } else if budget.percentageUsed >= 75 {
            alerts.append(BudgetAlert(
                type: .warning,
                message: "Budget '\(budget.name)' is at \(String(format: "%.1f%%", budget.percentageUsed)) of allocated amount.",
                severity: .medium
            ))
        }

        // Category alerts
        for category in budget.categories where category.percentageUsed >= 90 {
            alerts.append(BudgetAlert(
                type: .categoryOverBudget,
                message: "\(category.category.rawValue) category is at \(String(format: "%.1f%%", category.percentageUsed)) of budget.",
                severity: category.percentageUsed >= 100 ? .critical : .high
            ))
        }

        // Projection alerts
        if budget.projectedOverage > 0 {
            alerts.append(BudgetAlert(
                type: .projectedOverage,
                message: "Budget is projected to exceed by \(String(format: "$%.2f", budget.projectedOverage)) by period end.",
                severity: .medium
            ))
        }

        return alerts
    }

    // MARK: - Filter Management

    func clearFilters() {
        selectedCategory = nil
        selectedDepartment = nil
        showOnlyActive = true
    }

    func applyFilters() async {
        await fetchBudgetPlans()
    }

    // MARK: - Export

    func exportBudgetReport(budgetId: String, format: ReportFormat) async -> Data? {
        do {
            let endpoint = "/api/v1/budget/\(budgetId)/export?format=\(format.rawValue)"
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
}

// MARK: - Budget Alert
struct BudgetAlert: Identifiable {
    let id = UUID()
    let type: AlertType
    let message: String
    let severity: AlertSeverity

    enum AlertType {
        case overBudget
        case approaching
        case warning
        case categoryOverBudget
        case projectedOverage
    }

    enum AlertSeverity {
        case low
        case medium
        case high
        case critical

        var color: String {
            switch self {
            case .low: return "blue"
            case .medium: return "yellow"
            case .high: return "orange"
            case .critical: return "red"
            }
        }

        var icon: String {
            switch self {
            case .low: return "info.circle.fill"
            case .medium: return "exclamationmark.circle.fill"
            case .high: return "exclamationmark.triangle.fill"
            case .critical: return "xmark.octagon.fill"
            }
        }
    }
}

// MARK: - Report Format
enum ReportFormat: String {
    case pdf = "pdf"
    case excel = "xlsx"
    case csv = "csv"
}
