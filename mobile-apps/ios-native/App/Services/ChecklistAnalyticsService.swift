//
//  ChecklistAnalyticsService.swift
//  Fleet Manager
//
//  Analytics service for checklist system with comprehensive reporting
//

import Foundation
import Combine

@MainActor
class ChecklistAnalyticsService: ObservableObject {
    static let shared = ChecklistAnalyticsService()

    @Published var dashboardData: ChecklistDashboardData?
    @Published var currentMetrics: ChecklistMetrics?

    private let checklistService = ChecklistService.shared
    private var cancellables = Set<AnyCancellable>()

    init() {
        setupSubscriptions()
    }

    private func setupSubscriptions() {
        // Listen to checklist completions
        checklistService.$completedChecklists
            .sink { [weak self] _ in
                Task { await self?.updateMetrics() }
            }
            .store(in: &cancellables)
    }

    // MARK: - Metrics Calculation

    func calculateMetrics(dateRange: DateRange? = nil) async -> ChecklistMetrics {
        let allChecklists = getAllChecklists()

        let filteredChecklists: [ChecklistInstance]
        if let range = dateRange {
            filteredChecklists = allChecklists.filter { checklist in
                checklist.triggeredAt >= range.start && checklist.triggeredAt <= range.end
            }
        } else {
            filteredChecklists = allChecklists
        }

        let total = filteredChecklists.count
        let completed = filteredChecklists.filter { $0.status == .completed }.count
        let pending = filteredChecklists.filter { $0.status == .pending }.count
        let expired = filteredChecklists.filter { $0.status == .expired }.count
        let skipped = filteredChecklists.filter { $0.status == .skipped }.count

        let completionRate = total > 0 ? Double(completed) / Double(total) * 100 : 0

        let completionTimes = filteredChecklists.compactMap { checklist -> TimeInterval? in
            guard let started = checklist.startedAt,
                  let completed = checklist.completedAt else { return nil }
            return completed.timeIntervalSince(started)
        }
        let avgCompletionTime = completionTimes.isEmpty ? 0 : completionTimes.reduce(0, +) / Double(completionTimes.count)

        // Calculate compliance score (0-100)
        let complianceScore = calculateComplianceScore(checklists: filteredChecklists)

        // Metrics by category
        let metricsByCategory = calculateCategoryMetrics(checklists: filteredChecklists)

        // Metrics by driver
        let metricsByDriver = calculateDriverMetrics(checklists: filteredChecklists)

        // Metrics by vehicle
        let metricsByVehicle = calculateVehicleMetrics(checklists: filteredChecklists)

        // Time-based completions
        let dailyCompletions = calculateDailyCompletions(checklists: filteredChecklists)
        let weeklyCompletions = calculateWeeklyCompletions(checklists: filteredChecklists)
        let monthlyCompletions = calculateMonthlyCompletions(checklists: filteredChecklists)

        return ChecklistMetrics(
            totalChecklists: total,
            completedChecklists: completed,
            pendingChecklists: pending,
            expiredChecklists: expired,
            skippedChecklists: skipped,
            completionRate: completionRate,
            averageCompletionTime: avgCompletionTime,
            complianceScore: complianceScore,
            metricsByCategory: metricsByCategory,
            metricsByDriver: metricsByDriver,
            metricsByVehicle: metricsByVehicle,
            dailyCompletions: dailyCompletions,
            weeklyCompletions: weeklyCompletions,
            monthlyCompletions: monthlyCompletions
        )
    }

    private func calculateComplianceScore(checklists: [ChecklistInstance]) -> Double {
        var score: Double = 100.0

        // Deduct points for violations
        let expired = checklists.filter { $0.status == .expired }.count
        let skipped = checklists.filter { $0.status == .skipped && !$0.isRequired }.count
        let skippedRequired = checklists.filter { $0.status == .skipped && $0.isRequired }.count

        score -= Double(expired) * 5.0 // -5 points per expired
        score -= Double(skipped) * 2.0 // -2 points per skipped
        score -= Double(skippedRequired) * 10.0 // -10 points per required skip

        return max(0, min(100, score))
    }

    private func calculateCategoryMetrics(checklists: [ChecklistInstance]) -> [ChecklistCategory: CategoryMetrics] {
        var metrics: [ChecklistCategory: CategoryMetrics] = [:]

        for category in ChecklistCategory.allCases {
            let categoryChecklists = checklists.filter { $0.category == category }
            guard !categoryChecklists.isEmpty else { continue }

            let total = categoryChecklists.count
            let completed = categoryChecklists.filter { $0.status == .completed }.count

            let completionTimes = categoryChecklists.compactMap { checklist -> TimeInterval? in
                guard let started = checklist.startedAt,
                      let completed = checklist.completedAt else { return nil }
                return completed.timeIntervalSince(started)
            }
            let avgTime = completionTimes.isEmpty ? 0 : completionTimes.reduce(0, +) / Double(completionTimes.count)

            let complianceRate = Double(completed) / Double(total) * 100
            let failureRate = Double(total - completed) / Double(total) * 100

            metrics[category] = CategoryMetrics(
                category: category,
                totalCount: total,
                completedCount: completed,
                averageCompletionTime: avgTime,
                complianceRate: complianceRate,
                failureRate: failureRate
            )
        }

        return metrics
    }

    private func calculateDriverMetrics(checklists: [ChecklistInstance]) -> [String: DriverChecklistMetrics] {
        var metrics: [String: DriverChecklistMetrics] = [:]

        let driverIds = Set(checklists.map { $0.driverId })

        for driverId in driverIds {
            let driverChecklists = checklists.filter { $0.driverId == driverId }
            guard let driverName = driverChecklists.first?.driverName else { continue }

            let total = driverChecklists.count
            let completed = driverChecklists.filter { $0.status == .completed }.count
            let pending = driverChecklists.filter { $0.status == .pending }.count
            let skipped = driverChecklists.filter { $0.status == .skipped }.count
            let expired = driverChecklists.filter { $0.status == .expired }.count

            let completionRate = total > 0 ? Double(completed) / Double(total) * 100 : 0

            let completionTimes = driverChecklists.compactMap { checklist -> TimeInterval? in
                guard let started = checklist.startedAt,
                      let completed = checklist.completedAt else { return nil }
                return completed.timeIntervalSince(started)
            }
            let avgTime = completionTimes.isEmpty ? 0 : completionTimes.reduce(0, +) / Double(completionTimes.count)

            let complianceScore = calculateComplianceScore(checklists: driverChecklists)

            let recentChecklists = driverChecklists
                .sorted { $0.triggeredAt > $1.triggeredAt }
                .prefix(10)
                .map { $0 }

            metrics[driverId] = DriverChecklistMetrics(
                driverId: driverId,
                driverName: driverName,
                totalAssigned: total,
                completed: completed,
                pending: pending,
                skipped: skipped,
                expired: expired,
                completionRate: completionRate,
                averageCompletionTime: avgTime,
                complianceScore: complianceScore,
                recentChecklists: Array(recentChecklists)
            )
        }

        return metrics
    }

    private func calculateVehicleMetrics(checklists: [ChecklistInstance]) -> [String: VehicleChecklistMetrics] {
        var metrics: [String: VehicleChecklistMetrics] = [:]

        let vehicleChecklists = checklists.filter { $0.vehicleId != nil }
        let vehicleIds = Set(vehicleChecklists.compactMap { $0.vehicleId })

        for vehicleId in vehicleIds {
            let vChecklists = vehicleChecklists.filter { $0.vehicleId == vehicleId }
            guard let vehicleNumber = vChecklists.first?.vehicleNumber else { continue }

            let total = vChecklists.count
            let safety = vChecklists.filter { $0.category == .osha || $0.category == .preTripInspection }.count
            let maintenance = vChecklists.filter { $0.category == .maintenance }.count
            let completed = vChecklists.filter { $0.status == .completed }.count

            let complianceRate = total > 0 ? Double(completed) / Double(total) * 100 : 0
            let lastDate = vChecklists.map { $0.triggeredAt }.max()

            metrics[vehicleId] = VehicleChecklistMetrics(
                vehicleId: vehicleId,
                vehicleNumber: vehicleNumber,
                totalChecklists: total,
                safetyChecklists: safety,
                maintenanceChecklists: maintenance,
                complianceRate: complianceRate,
                lastChecklistDate: lastDate
            )
        }

        return metrics
    }

    private func calculateDailyCompletions(checklists: [ChecklistInstance]) -> [Date: Int] {
        let completed = checklists.filter { $0.status == .completed }
        var dailyMap: [Date: Int] = [:]

        for checklist in completed {
            guard let completedAt = checklist.completedAt else { continue }
            let day = Calendar.current.startOfDay(for: completedAt)
            dailyMap[day, default: 0] += 1
        }

        return dailyMap
    }

    private func calculateWeeklyCompletions(checklists: [ChecklistInstance]) -> [Date: Int] {
        let completed = checklists.filter { $0.status == .completed }
        var weeklyMap: [Date: Int] = [:]

        for checklist in completed {
            guard let completedAt = checklist.completedAt else { continue }
            let week = Calendar.current.dateInterval(of: .weekOfYear, for: completedAt)?.start ?? completedAt
            weeklyMap[week, default: 0] += 1
        }

        return weeklyMap
    }

    private func calculateMonthlyCompletions(checklists: [ChecklistInstance]) -> [Date: Int] {
        let completed = checklists.filter { $0.status == .completed }
        var monthlyMap: [Date: Int] = [:]

        for checklist in completed {
            guard let completedAt = checklist.completedAt else { continue }
            let components = Calendar.current.dateComponents([.year, .month], from: completedAt)
            let month = Calendar.current.date(from: components) ?? completedAt
            monthlyMap[month, default: 0] += 1
        }

        return monthlyMap
    }

    // MARK: - Reports Generation

    func generateComplianceReport(dateRange: DateRange) async -> ChecklistReport {
        let metrics = await calculateMetrics(dateRange: dateRange)
        let violations = detectViolations()
        let trends = calculateTrends()
        let recommendations = generateRecommendations(metrics: metrics, violations: violations)

        return ChecklistReport(
            id: UUID().uuidString,
            title: "Compliance Overview Report",
            reportType: .complianceOverview,
            dateRange: dateRange,
            generatedAt: Date(),
            metrics: metrics,
            trends: trends,
            violations: violations,
            recommendations: recommendations
        )
    }

    func generateDriverPerformanceReport(driverId: String, dateRange: DateRange) async -> ChecklistReport {
        let metrics = await calculateMetrics(dateRange: dateRange)
        let driverMetrics = metrics.metricsByDriver[driverId]

        return ChecklistReport(
            id: UUID().uuidString,
            title: "Driver Performance: \(driverMetrics?.driverName ?? "Unknown")",
            reportType: .driverPerformance,
            dateRange: dateRange,
            generatedAt: Date(),
            metrics: metrics,
            trends: calculateTrends(),
            violations: detectViolations().filter { $0.driverId == driverId },
            recommendations: []
        )
    }

    private func detectViolations() -> [ComplianceViolation] {
        var violations: [ComplianceViolation] = []

        let allChecklists = getAllChecklists()

        // Expired checklists
        for checklist in allChecklists where checklist.status == .expired {
            violations.append(ComplianceViolation(
                id: UUID().uuidString,
                checklistId: checklist.id,
                checklistName: checklist.templateName,
                category: checklist.category,
                violationType: .expired,
                driverId: checklist.driverId,
                driverName: checklist.driverName,
                vehicleId: checklist.vehicleId,
                vehicleNumber: checklist.vehicleNumber,
                timestamp: checklist.expiresAt ?? checklist.triggeredAt,
                severity: .high,
                description: "Checklist expired without completion",
                resolved: false,
                resolvedAt: nil
            ))
        }

        // Skipped required checklists
        for checklist in allChecklists where checklist.status == .skipped && checklist.isRequired {
            violations.append(ComplianceViolation(
                id: UUID().uuidString,
                checklistId: checklist.id,
                checklistName: checklist.templateName,
                category: checklist.category,
                violationType: .skippedRequired,
                driverId: checklist.driverId,
                driverName: checklist.driverName,
                vehicleId: checklist.vehicleId,
                vehicleNumber: checklist.vehicleNumber,
                timestamp: checklist.triggeredAt,
                severity: .critical,
                description: "Required checklist was skipped",
                resolved: false,
                resolvedAt: nil
            ))
        }

        return violations
    }

    private func calculateTrends() -> ChecklistTrends {
        // Compare last 30 days to previous 30 days
        let calendar = Calendar.current
        let now = Date()
        let thirtyDaysAgo = calendar.date(byAdding: .day, value: -30, to: now)!
        let sixtyDaysAgo = calendar.date(byAdding: .day, value: -60, to: now)!

        let allChecklists = getAllChecklists()

        let recentChecklists = allChecklists.filter { $0.triggeredAt >= thirtyDaysAgo }
        let previousChecklists = allChecklists.filter { $0.triggeredAt >= sixtyDaysAgo && $0.triggeredAt < thirtyDaysAgo }

        let recentCompletionRate = Double(recentChecklists.filter { $0.status == .completed }.count) / Double(max(1, recentChecklists.count)) * 100
        let previousCompletionRate = Double(previousChecklists.filter { $0.status == .completed }.count) / Double(max(1, previousChecklists.count)) * 100

        let completionRateTrend: TrendDirection = recentCompletionRate > previousCompletionRate + 5 ? .improving :
                                                   recentCompletionRate < previousCompletionRate - 5 ? .declining : .stable

        return ChecklistTrends(
            completionRateTrend: completionRateTrend,
            complianceScoreTrend: .stable,
            averageTimeTrend: .improving,
            issuesTrend: .declining
        )
    }

    private func generateRecommendations(metrics: ChecklistMetrics, violations: [ComplianceViolation]) -> [String] {
        var recommendations: [String] = []

        if metrics.completionRate < 80 {
            recommendations.append("Completion rate is below 80%. Consider additional driver training.")
        }

        if metrics.complianceScore < 90 {
            recommendations.append("Compliance score needs improvement. Review violation patterns.")
        }

        if violations.count > 10 {
            recommendations.append("High number of violations detected. Immediate action required.")
        }

        if metrics.expiredChecklists > 5 {
            recommendations.append("Multiple checklists are expiring without completion. Review assignment timing.")
        }

        return recommendations
    }

    // MARK: - Dashboard Data

    func updateDashboardData() async {
        let today = Calendar.current.startOfDay(for: Date())
        let todayEnd = Calendar.current.date(byAdding: .day, value: 1, to: today)!

        let allChecklists = getAllChecklists()
        let todayChecklists = allChecklists.filter { $0.triggeredAt >= today && $0.triggeredAt < todayEnd }

        let pending = checklistService.pendingChecklists.count
        let overdue = checklistService.pendingChecklists.filter { checklist in
            if let expires = checklist.expiresAt {
                return expires < Date()
            }
            return false
        }.count

        let todayCompleted = todayChecklists.filter { $0.status == .completed }.count
        let todayTotal = todayChecklists.count
        let completionRateToday = todayTotal > 0 ? Double(todayCompleted) / Double(todayTotal) * 100 : 0

        let metrics = await calculateMetrics()
        let violations = detectViolations()
        let recentViolations = violations.sorted { $0.timestamp > $1.timestamp }.prefix(5)

        let topPerformers = metrics.metricsByDriver.values
            .sorted { $0.complianceScore > $1.complianceScore }
            .prefix(5)

        let categoryBreakdown = Array(metrics.metricsByCategory.values)

        dashboardData = ChecklistDashboardData(
            pendingCount: pending,
            overdueCount: overdue,
            completionRateToday: completionRateToday,
            complianceScore: metrics.complianceScore,
            recentViolations: Array(recentViolations),
            topPerformers: Array(topPerformers),
            categoryBreakdown: categoryBreakdown
        )
    }

    func updateMetrics() async {
        currentMetrics = await calculateMetrics()
    }

    private func getAllChecklists() -> [ChecklistInstance] {
        return checklistService.pendingChecklists +
               checklistService.activeChecklists +
               checklistService.completedChecklists
    }
}
