//
//  ComplianceDashboardViewModel.swift
//  Fleet Manager
//
//  Compliance Dashboard ViewModel with automated tracking and scoring
//

import Foundation
import Combine
import SwiftUI

@MainActor
class ComplianceDashboardViewModel: RefreshableViewModel {
    // MARK: - Published Properties
    @Published var dashboard: ComplianceDashboardSummary?
    @Published var complianceItems: [ComplianceItem] = []
    @Published var violations: [Violation] = []
    @Published var regulations: [Regulation] = []
    @Published var selectedCategory: ComplianceCategory?
    @Published var selectedStatus: ComplianceStatus?
    @Published var selectedSeverity: ViolationSeverity?
    @Published var showResolvedViolations = false

    // MARK: - Computed Properties
    var overallScore: Double {
        dashboard?.score.overallScore ?? 0
    }

    var scoreColor: Color {
        let score = overallScore
        if score >= 90 {
            return .green
        } else if score >= 70 {
            return .yellow
        } else {
            return .red
        }
    }

    var scoreGrade: String {
        dashboard?.score.scoreGrade ?? "N/A"
    }

    var filteredItems: [ComplianceItem] {
        var items = complianceItems

        if let category = selectedCategory {
            items = items.filter { $0.type.category == category }
        }

        if let status = selectedStatus {
            items = items.filter { $0.status == status }
        }

        if !searchText.isEmpty {
            items = items.filter {
                $0.entityName.localizedCaseInsensitiveContains(searchText) ||
                $0.type.displayName.localizedCaseInsensitiveContains(searchText)
            }
        }

        return items
    }

    var filteredViolations: [Violation] {
        var filtered = violations

        if !showResolvedViolations {
            filtered = filtered.filter { !$0.isResolved }
        }

        if let category = selectedCategory {
            filtered = filtered.filter { $0.category == category }
        }

        if let severity = selectedSeverity {
            filtered = filtered.filter { $0.severity == severity }
        }

        if !searchText.isEmpty {
            filtered = filtered.filter {
                $0.entityName.localizedCaseInsensitiveContains(searchText) ||
                $0.description.localizedCaseInsensitiveContains(searchText)
            }
        }

        return filtered
    }

    var expiringIn30Days: [ComplianceItem] {
        complianceItems.filter { $0.daysUntilExpiration <= 30 && $0.daysUntilExpiration > 0 }
            .sorted { $0.daysUntilExpiration < $1.daysUntilExpiration }
    }

    var expiringIn60Days: [ComplianceItem] {
        complianceItems.filter { $0.daysUntilExpiration <= 60 && $0.daysUntilExpiration > 30 }
            .sorted { $0.daysUntilExpiration < $1.daysUntilExpiration }
    }

    var expiringIn90Days: [ComplianceItem] {
        complianceItems.filter { $0.daysUntilExpiration <= 90 && $0.daysUntilExpiration > 60 }
            .sorted { $0.daysUntilExpiration < $1.daysUntilExpiration }
    }

    var expiredItems: [ComplianceItem] {
        complianceItems.filter { $0.isExpired }
            .sorted { $0.daysUntilExpiration < $1.daysUntilExpiration }
    }

    var categoryScores: [(ComplianceCategory, Double)] {
        guard let dashboard = dashboard else { return [] }

        return ComplianceCategory.allCases.map { category in
            let score = dashboard.score.categoryScores[category] ?? 0
            return (category, score)
        }.sorted { $0.1 > $1.1 }
    }

    var totalOutstandingFines: Double {
        violations
            .filter { !$0.isResolved }
            .compactMap { $0.fineAmount }
            .reduce(0, +)
    }

    var unresolvedViolationsCount: Int {
        violations.filter { !$0.isResolved }.count
    }

    // MARK: - Initialization
    override init() {
        super.init()
        Task {
            await loadDashboard()
        }
    }

    // MARK: - Data Loading
    override func refresh() async {
        await loadDashboard()
    }

    func loadDashboard() async {
        guard !isRefreshing else { return }

        startRefreshing()
        startLoading()

        do {
            async let dashboardTask = fetchDashboard()
            async let itemsTask = fetchComplianceItems()
            async let violationsTask = fetchViolations()
            async let regulationsTask = fetchRegulations()

            let (dashboardData, itemsData, violationsData, regulationsData) = try await (
                dashboardTask,
                itemsTask,
                violationsTask,
                regulationsTask
            )

            self.dashboard = dashboardData
            self.complianceItems = itemsData
            self.violations = violationsData
            self.regulations = regulationsData

            finishLoading()
            finishRefreshing()
        } catch {
            handleError(error)
            finishRefreshing()
        }
    }

    // MARK: - API Calls
    private func fetchDashboard() async throws -> ComplianceDashboardSummary {
        let endpoint = "/api/v1/compliance/dashboard"
        let url = try APIClient.shared.buildURL(endpoint: endpoint)

        let response: ComplianceDashboardResponse = try await APIClient.shared.request(
            url: url,
            method: "GET"
        )

        return response.dashboard
    }

    private func fetchComplianceItems(page: Int = 1, limit: Int = 100) async throws -> [ComplianceItem] {
        let endpoint = "/api/v1/compliance/items"
        var components = URLComponents(string: APIClient.shared.baseURL + endpoint)
        components?.queryItems = [
            URLQueryItem(name: "page", value: "\(page)"),
            URLQueryItem(name: "limit", value: "\(limit)")
        ]

        guard let url = components?.url else {
            throw URLError(.badURL)
        }

        let response: ComplianceItemsResponse = try await APIClient.shared.request(
            url: url,
            method: "GET"
        )

        return response.items
    }

    private func fetchViolations(page: Int = 1, limit: Int = 100) async throws -> [Violation] {
        let endpoint = "/api/v1/compliance/violations"
        var components = URLComponents(string: APIClient.shared.baseURL + endpoint)
        components?.queryItems = [
            URLQueryItem(name: "page", value: "\(page)"),
            URLQueryItem(name: "limit", value: "\(limit)")
        ]

        guard let url = components?.url else {
            throw URLError(.badURL)
        }

        let response: ViolationsResponse = try await APIClient.shared.request(
            url: url,
            method: "GET"
        )

        return response.violations
    }

    private func fetchRegulations() async throws -> [Regulation] {
        let endpoint = "/api/v1/compliance/regulations"
        let url = try APIClient.shared.buildURL(endpoint: endpoint)

        let response: RegulationsResponse = try await APIClient.shared.request(
            url: url,
            method: "GET"
        )

        return response.regulations
    }

    // MARK: - Compliance Score Calculation
    func calculateComplianceScore() -> Double {
        guard !complianceItems.isEmpty else { return 100 }

        var totalScore = 0.0
        let categories = ComplianceCategory.allCases

        for category in categories {
            let categoryScore = calculateCategoryScore(category)
            totalScore += categoryScore * category.weight
        }

        return totalScore
    }

    func calculateCategoryScore(_ category: ComplianceCategory) -> Double {
        let categoryItems = complianceItems.filter { $0.type.category == category }
        guard !categoryItems.isEmpty else { return 100 }

        var score = 100.0

        for item in categoryItems {
            switch item.status {
            case .compliant:
                break // No deduction
            case .warning:
                score -= 2.0
            case .violation:
                score -= 10.0
            case .expired:
                score -= 15.0
            }
        }

        // Deduct for violations in this category
        let categoryViolations = violations.filter { $0.category == category && !$0.isResolved }
        for violation in categoryViolations {
            score -= violation.severity.scoreImpact
        }

        return max(0, score)
    }

    // MARK: - Actions
    func resolveViolation(_ violation: Violation, resolvedBy: String, notes: String) async {
        startLoading()

        do {
            let endpoint = "/api/v1/compliance/violations/\(violation.id)/resolve"
            let url = try APIClient.shared.buildURL(endpoint: endpoint)

            let request = ViolationResolveRequest(
                resolvedBy: resolvedBy,
                resolutionNotes: notes
            )

            let _: Violation = try await APIClient.shared.request(
                url: url,
                method: "POST",
                body: request
            )

            // Reload data
            await loadDashboard()
        } catch {
            handleError(error)
        }
    }

    func renewComplianceItem(_ item: ComplianceItem, newExpirationDate: String) async {
        startLoading()

        do {
            let endpoint = "/api/v1/compliance/items/\(item.id)"
            let url = try APIClient.shared.buildURL(endpoint: endpoint)

            let request = ComplianceItemUpdateRequest(
                status: .compliant,
                expirationDate: newExpirationDate,
                renewalDate: ISO8601DateFormatter().string(from: Date()),
                notes: nil
            )

            let _: ComplianceItem = try await APIClient.shared.request(
                url: url,
                method: "PATCH",
                body: request
            )

            // Reload data
            await loadDashboard()
        } catch {
            handleError(error)
        }
    }

    func addComplianceItem(_ request: ComplianceItemCreateRequest) async {
        startLoading()

        do {
            let endpoint = "/api/v1/compliance/items"
            let url = try APIClient.shared.buildURL(endpoint: endpoint)

            let _: ComplianceItem = try await APIClient.shared.request(
                url: url,
                method: "POST",
                body: request
            )

            // Reload data
            await loadDashboard()
        } catch {
            handleError(error)
        }
    }

    func addViolation(_ request: ViolationCreateRequest) async {
        startLoading()

        do {
            let endpoint = "/api/v1/compliance/violations"
            let url = try APIClient.shared.buildURL(endpoint: endpoint)

            let _: Violation = try await APIClient.shared.request(
                url: url,
                method: "POST",
                body: request
            )

            // Reload data
            await loadDashboard()
        } catch {
            handleError(error)
        }
    }

    // MARK: - Filters
    func setCategory(_ category: ComplianceCategory?) {
        selectedCategory = category
    }

    func setStatus(_ status: ComplianceStatus?) {
        selectedStatus = status
    }

    func setSeverity(_ severity: ViolationSeverity?) {
        selectedSeverity = severity
    }

    func toggleResolvedViolations() {
        showResolvedViolations.toggle()
    }

    func clearFilters() {
        selectedCategory = nil
        selectedStatus = nil
        selectedSeverity = nil
        showResolvedViolations = false
        clearSearch()
    }

    // MARK: - Reports
    func generateComplianceReport() async -> String {
        var report = "FLEET COMPLIANCE REPORT\n"
        report += "Generated: \(Date().formatted())\n"
        report += "=" + String(repeating: "=", count: 50) + "\n\n"

        // Overall Score
        report += "OVERALL COMPLIANCE SCORE\n"
        report += "-" + String(repeating: "-", count: 50) + "\n"
        report += "Score: \(String(format: "%.1f", overallScore))% (Grade: \(scoreGrade))\n"
        report += "Total Items: \(complianceItems.count)\n"
        report += "Compliant: \(complianceItems.filter { $0.status == .compliant }.count)\n"
        report += "Warning: \(complianceItems.filter { $0.status == .warning }.count)\n"
        report += "Violation: \(complianceItems.filter { $0.status == .violation }.count)\n"
        report += "Expired: \(complianceItems.filter { $0.status == .expired }.count)\n\n"

        // Category Breakdown
        report += "CATEGORY BREAKDOWN\n"
        report += "-" + String(repeating: "-", count: 50) + "\n"
        for category in ComplianceCategory.allCases {
            let score = calculateCategoryScore(category)
            report += "\(category.displayName): \(String(format: "%.1f", score))%\n"
        }
        report += "\n"

        // Expiring Items
        report += "EXPIRING ITEMS\n"
        report += "-" + String(repeating: "-", count: 50) + "\n"
        report += "Expiring in 30 days: \(expiringIn30Days.count)\n"
        report += "Expiring in 60 days: \(expiringIn60Days.count)\n"
        report += "Expiring in 90 days: \(expiringIn90Days.count)\n"
        report += "Already Expired: \(expiredItems.count)\n\n"

        // Violations
        report += "VIOLATIONS\n"
        report += "-" + String(repeating: "-", count: 50) + "\n"
        report += "Total Violations: \(violations.count)\n"
        report += "Unresolved: \(unresolvedViolationsCount)\n"
        report += "Outstanding Fines: $\(String(format: "%.2f", totalOutstandingFines))\n\n"

        return report
    }

    func exportToPDF() async -> Data? {
        // TODO: Implement PDF export using PDFKit
        // This would generate a professional PDF report with charts and tables
        return nil
    }

    // MARK: - Alerts
    func checkForAlerts() -> [ComplianceAlert] {
        var alerts: [ComplianceAlert] = []

        // Check for items expiring in 30 days
        if !expiringIn30Days.isEmpty {
            alerts.append(ComplianceAlert(
                type: .expirationWarning,
                severity: .high,
                title: "Items Expiring Soon",
                message: "\(expiringIn30Days.count) compliance items expiring within 30 days",
                items: expiringIn30Days.map { $0.id }
            ))
        }

        // Check for expired items
        if !expiredItems.isEmpty {
            alerts.append(ComplianceAlert(
                type: .expired,
                severity: .critical,
                title: "Expired Items",
                message: "\(expiredItems.count) compliance items have expired",
                items: expiredItems.map { $0.id }
            ))
        }

        // Check for unresolved violations
        if unresolvedViolationsCount > 0 {
            alerts.append(ComplianceAlert(
                type: .violation,
                severity: .high,
                title: "Unresolved Violations",
                message: "\(unresolvedViolationsCount) violations need attention",
                items: violations.filter { !$0.isResolved }.map { $0.id }
            ))
        }

        // Check for low compliance score
        if overallScore < 70 {
            alerts.append(ComplianceAlert(
                type: .lowScore,
                severity: .critical,
                title: "Low Compliance Score",
                message: "Overall compliance score is \(String(format: "%.1f", overallScore))%",
                items: []
            ))
        }

        return alerts
    }
}

// MARK: - Compliance Alert
struct ComplianceAlert: Identifiable {
    let id = UUID()
    let type: AlertType
    let severity: AlertSeverity
    let title: String
    let message: String
    let items: [String]

    enum AlertType {
        case expirationWarning
        case expired
        case violation
        case lowScore
    }

    enum AlertSeverity {
        case low
        case medium
        case high
        case critical

        var color: Color {
            switch self {
            case .low: return .blue
            case .medium: return .yellow
            case .high: return .orange
            case .critical: return .red
            }
        }
    }
}
