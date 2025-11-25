//
//  ExecutiveDashboardViewModel.swift
//  Fleet Manager
//
//  ViewModel for Executive Dashboard with KPIs and trends
//

import Foundation
import Combine

@MainActor
class ExecutiveDashboardViewModel: RefreshableViewModel {
    // MARK: - Published Properties
    @Published var metrics: ExecutiveMetrics?
    @Published var kpis: [KPI] = []
    @Published var trendData: [TrendData] = []
    @Published var alerts: [ExecutiveAlert] = []
    @Published var departments: [Department] = []
    @Published var summary: DashboardSummary?

    // Filter options
    @Published var selectedPeriod: DashboardFilterPeriod = .month
    @Published var selectedDepartment: DashboardFilterDepartment = .all
    @Published var selectedRegion: DashboardFilterRegion = .all
    @Published var customStartDate: Date?
    @Published var customEndDate: Date?

    // Display options
    @Published var showTrends = true
    @Published var showAlerts = true
    @Published var showDepartments = true

    // Auto-refresh
    private var autoRefreshTimer: Timer?
    private let autoRefreshInterval: TimeInterval = 300 // 5 minutes

    // MARK: - Initialization
    override init() {
        super.init()
        startAutoRefresh()
    }

    deinit {
        stopAutoRefresh()
    }

    // MARK: - Data Loading
    func loadDashboard() async {
        startLoading()

        do {
            // Load all dashboard data in parallel
            async let metricsTask = loadMetrics()
            async let kpisTask = loadKPIs()
            async let trendsTask = loadTrendData()
            async let alertsTask = loadAlerts()
            async let departmentsTask = loadDepartments()
            async let summaryTask = loadSummary()

            let results = try await (
                metricsTask,
                kpisTask,
                trendsTask,
                alertsTask,
                departmentsTask,
                summaryTask
            )

            metrics = results.0
            kpis = results.1
            trendData = results.2
            alerts = results.3
            departments = results.4
            summary = results.5

            // Cache the data
            cacheData()

            finishLoading()
        } catch {
            handleError(error)
        }
    }

    private func loadMetrics() async throws -> ExecutiveMetrics {
        let endpoint = "/api/v1/executive/dashboard/metrics"
        let params = buildQueryParams()

        guard let url = URL(string: "\(APIConfig.baseURL)\(endpoint)?\(params)") else {
            throw URLError(.badURL)
        }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Bearer \(APIConfig.authToken)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw URLError(.badServerResponse)
        }

        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return try decoder.decode(ExecutiveMetrics.self, from: data)
    }

    private func loadKPIs() async throws -> [KPI] {
        let endpoint = "/api/v1/executive/dashboard/kpis"
        let params = buildQueryParams()

        guard let url = URL(string: "\(APIConfig.baseURL)\(endpoint)?\(params)") else {
            throw URLError(.badURL)
        }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Bearer \(APIConfig.authToken)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw URLError(.badServerResponse)
        }

        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return try decoder.decode([KPI].self, from: data)
    }

    private func loadTrendData() async throws -> [TrendData] {
        let endpoint = "/api/v1/executive/dashboard/trends"
        let params = buildQueryParams()

        guard let url = URL(string: "\(APIConfig.baseURL)\(endpoint)?\(params)") else {
            throw URLError(.badURL)
        }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Bearer \(APIConfig.authToken)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw URLError(.badServerResponse)
        }

        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return try decoder.decode([TrendData].self, from: data)
    }

    private func loadAlerts() async throws -> [ExecutiveAlert] {
        let endpoint = "/api/v1/executive/dashboard/alerts"
        let params = buildQueryParams()

        guard let url = URL(string: "\(APIConfig.baseURL)\(endpoint)?\(params)") else {
            throw URLError(.badURL)
        }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Bearer \(APIConfig.authToken)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw URLError(.badServerResponse)
        }

        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return try decoder.decode([ExecutiveAlert].self, from: data)
    }

    private func loadDepartments() async throws -> [Department] {
        let endpoint = "/api/v1/executive/dashboard/departments"
        let params = buildQueryParams()

        guard let url = URL(string: "\(APIConfig.baseURL)\(endpoint)?\(params)") else {
            throw URLError(.badURL)
        }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Bearer \(APIConfig.authToken)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw URLError(.badServerResponse)
        }

        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return try decoder.decode([Department].self, from: data)
    }

    private func loadSummary() async throws -> DashboardSummary {
        let endpoint = "/api/v1/executive/dashboard/summary"
        let params = buildQueryParams()

        guard let url = URL(string: "\(APIConfig.baseURL)\(endpoint)?\(params)") else {
            throw URLError(.badURL)
        }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Bearer \(APIConfig.authToken)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw URLError(.badServerResponse)
        }

        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return try decoder.decode(DashboardSummary.self, from: data)
    }

    // MARK: - Query Parameters
    private func buildQueryParams() -> String {
        var params: [String] = []

        // Period filter
        if selectedPeriod == .custom, let start = customStartDate, let end = customEndDate {
            let formatter = ISO8601DateFormatter()
            params.append("start=\(formatter.string(from: start))")
            params.append("end=\(formatter.string(from: end))")
        } else {
            params.append("period=\(selectedPeriod.rawValue)")
        }

        // Department filter
        if selectedDepartment != .all {
            params.append("department=\(selectedDepartment.rawValue)")
        }

        // Region filter
        if selectedRegion != .all {
            params.append("region=\(selectedRegion.rawValue)")
        }

        return params.joined(separator: "&")
    }

    // MARK: - Refresh
    override func refresh() async {
        await loadDashboard()
    }

    // MARK: - Filtering
    func applyFilters(period: DashboardFilterPeriod? = nil,
                     department: DashboardFilterDepartment? = nil,
                     region: DashboardFilterRegion? = nil) {
        if let period = period {
            selectedPeriod = period
        }
        if let department = department {
            selectedDepartment = department
        }
        if let region = region {
            selectedRegion = region
        }

        Task {
            await loadDashboard()
        }
    }

    func clearFilters() {
        selectedPeriod = .month
        selectedDepartment = .all
        selectedRegion = .all
        customStartDate = nil
        customEndDate = nil

        Task {
            await loadDashboard()
        }
    }

    // MARK: - Alert Management
    func acknowledgeAlert(_ alert: ExecutiveAlert) async {
        do {
            let endpoint = "/api/v1/executive/dashboard/alerts/\(alert.id)/acknowledge"
            guard let url = URL(string: "\(APIConfig.baseURL)\(endpoint)") else {
                throw URLError(.badURL)
            }

            var request = URLRequest(url: url)
            request.httpMethod = "POST"
            request.setValue("Bearer \(APIConfig.authToken)", forHTTPHeaderField: "Authorization")

            _ = try await URLSession.shared.data(for: request)

            // Reload alerts
            alerts = try await loadAlerts()
        } catch {
            handleError(error)
        }
    }

    func dismissAlert(_ alert: ExecutiveAlert) {
        alerts.removeAll { $0.id == alert.id }
    }

    // MARK: - KPI Analysis
    func calculateMonthOverMonthTrend(for kpi: KPI) -> Double {
        return kpi.percentChange
    }

    func getKPIsByCategory(_ category: KPI.KPICategory) -> [KPI] {
        return kpis.filter { $0.category == category }
    }

    func getCriticalKPIs() -> [KPI] {
        return kpis.filter { !$0.isOnTarget && $0.priority <= 3 }
    }

    // MARK: - Department Analysis
    func getTopPerformingDepartments(limit: Int = 5) -> [Department] {
        return departments
            .sorted { $0.utilization > $1.utilization }
            .prefix(limit)
            .map { $0 }
    }

    func getDepartmentsOverBudget() -> [Department] {
        return departments.filter { $0.budgetStatus == .overbudget }
    }

    // MARK: - Alert Filtering
    func getCriticalAlerts() -> [ExecutiveAlert] {
        return alerts.filter { $0.severity == .critical || $0.severity == .high }
    }

    func getAlertsByCategory(_ category: ExecutiveAlert.AlertCategory) -> [ExecutiveAlert] {
        return alerts.filter { $0.category == category }
    }

    // MARK: - Export
    func exportDashboardToPDF() async throws -> URL {
        // Generate PDF from dashboard data
        let endpoint = "/api/v1/executive/dashboard/export/pdf"
        let params = buildQueryParams()

        guard let url = URL(string: "\(APIConfig.baseURL)\(endpoint)?\(params)") else {
            throw URLError(.badURL)
        }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Bearer \(APIConfig.authToken)", forHTTPHeaderField: "Authorization")

        let (data, _) = try await URLSession.shared.data(for: request)

        // Save to temporary file
        let tempURL = FileManager.default.temporaryDirectory
            .appendingPathComponent("executive-dashboard-\(Date().timeIntervalSince1970).pdf")

        try data.write(to: tempURL)
        return tempURL
    }

    func scheduleEmailReport(frequency: EmailReportFrequency, recipients: [String]) async throws {
        let endpoint = "/api/v1/executive/dashboard/schedule-report"

        guard let url = URL(string: "\(APIConfig.baseURL)\(endpoint)") else {
            throw URLError(.badURL)
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(APIConfig.authToken)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let payload: [String: Any] = [
            "frequency": frequency.rawValue,
            "recipients": recipients,
            "filters": [
                "period": selectedPeriod.rawValue,
                "department": selectedDepartment.rawValue,
                "region": selectedRegion.rawValue
            ]
        ]

        request.httpBody = try JSONSerialization.data(withJSONObject: payload)

        _ = try await URLSession.shared.data(for: request)
    }

    enum EmailReportFrequency: String {
        case daily = "daily"
        case weekly = "weekly"
        case monthly = "monthly"
    }

    // MARK: - Caching
    private func cacheData() {
        if let metrics = metrics {
            cacheObject(metrics as AnyObject, forKey: "executive_metrics")
        }
        cacheObject(kpis as AnyObject, forKey: "executive_kpis")
        cacheObject(trendData as AnyObject, forKey: "executive_trends")
        cacheObject(alerts as AnyObject, forKey: "executive_alerts")
        cacheObject(departments as AnyObject, forKey: "executive_departments")
    }

    private func loadCachedData() {
        if let cachedMetrics = getCachedObject(forKey: "executive_metrics", type: ExecutiveMetrics.self) {
            metrics = cachedMetrics
        }
        if let cachedKPIs = getCachedObject(forKey: "executive_kpis", type: [KPI].self) {
            kpis = cachedKPIs
        }
        if let cachedTrends = getCachedObject(forKey: "executive_trends", type: [TrendData].self) {
            trendData = cachedTrends
        }
        if let cachedAlerts = getCachedObject(forKey: "executive_alerts", type: [ExecutiveAlert].self) {
            alerts = cachedAlerts
        }
        if let cachedDepartments = getCachedObject(forKey: "executive_departments", type: [Department].self) {
            departments = cachedDepartments
        }
    }

    // MARK: - Auto-Refresh
    private func startAutoRefresh() {
        autoRefreshTimer = Timer.scheduledTimer(withTimeInterval: autoRefreshInterval, repeats: true) { [weak self] _ in
            Task { @MainActor [weak self] in
                await self?.refresh()
            }
        }
    }

    private func stopAutoRefresh() {
        autoRefreshTimer?.invalidate()
        autoRefreshTimer = nil
    }

    func toggleAutoRefresh() {
        if autoRefreshTimer != nil {
            stopAutoRefresh()
        } else {
            startAutoRefresh()
        }
    }
}

// MARK: - API Configuration
private struct APIConfig {
    static let baseURL = ProcessInfo.processInfo.environment["API_BASE_URL"] ?? "https://api.fleet.example.com"
    static let authToken = AuthenticationManager.shared.getAccessToken() ?? ""
}
