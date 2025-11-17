//
//  ChecklistAnalyticsAPI.swift
//  Fleet Manager
//
//  API endpoints for checklist analytics and reporting
//

import Foundation

class ChecklistAnalyticsAPI {
    static let shared = ChecklistAnalyticsAPI()
    private let baseURL = APIConfig.baseURL

    // MARK: - Analytics Endpoints

    /// Get checklist metrics for a date range
    /// POST /api/checklists/analytics
    func getMetrics(dateRange: DateRange) async throws -> ChecklistMetrics {
        let endpoint = "\(baseURL)/api/checklists/analytics"

        var request = URLRequest(url: URL(string: endpoint)!)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let body: [String: Any] = [
            "startDate": ISO8601DateFormatter().string(from: dateRange.start),
            "endDate": ISO8601DateFormatter().string(from: dateRange.end)
        ]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw APIError.invalidResponse
        }

        return try JSONDecoder().decode(ChecklistMetrics.self, from: data)
    }

    /// Generate a specific report type
    /// GET /api/checklists/reports/{type}
    func generateReport(type: ChecklistReportType, dateRange: DateRange) async throws -> ChecklistReport {
        var components = URLComponents(string: "\(baseURL)/api/checklists/reports/\(type.rawValue)")!
        components.queryItems = [
            URLQueryItem(name: "startDate", value: ISO8601DateFormatter().string(from: dateRange.start)),
            URLQueryItem(name: "endDate", value: ISO8601DateFormatter().string(from: dateRange.end))
        ]

        let request = URLRequest(url: components.url!)
        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw APIError.invalidResponse
        }

        return try JSONDecoder().decode(ChecklistReport.self, from: data)
    }

    /// Get compliance violations
    /// GET /api/checklists/violations
    func getViolations(severity: Severity? = nil, resolved: Bool? = nil) async throws -> [ComplianceViolation] {
        var components = URLComponents(string: "\(baseURL)/api/checklists/violations")!
        var queryItems: [URLQueryItem] = []

        if let severity = severity {
            queryItems.append(URLQueryItem(name: "severity", value: severity.rawValue))
        }
        if let resolved = resolved {
            queryItems.append(URLQueryItem(name: "resolved", value: String(resolved)))
        }

        components.queryItems = queryItems.isEmpty ? nil : queryItems

        let request = URLRequest(url: components.url!)
        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw APIError.invalidResponse
        }

        return try JSONDecoder().decode([ComplianceViolation].self, from: data)
    }

    /// Get driver checklist metrics
    /// GET /api/drivers/{id}/checklists/metrics
    func getDriverMetrics(driverId: String, dateRange: DateRange) async throws -> DriverChecklistMetrics {
        var components = URLComponents(string: "\(baseURL)/api/drivers/\(driverId)/checklists/metrics")!
        components.queryItems = [
            URLQueryItem(name: "startDate", value: ISO8601DateFormatter().string(from: dateRange.start)),
            URLQueryItem(name: "endDate", value: ISO8601DateFormatter().string(from: dateRange.end))
        ]

        let request = URLRequest(url: components.url!)
        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw APIError.invalidResponse
        }

        return try JSONDecoder().decode(DriverChecklistMetrics.self, from: data)
    }

    /// Get vehicle checklist metrics
    /// GET /api/vehicles/{id}/checklists/metrics
    func getVehicleMetrics(vehicleId: String, dateRange: DateRange) async throws -> VehicleChecklistMetrics {
        var components = URLComponents(string: "\(baseURL)/api/vehicles/\(vehicleId)/checklists/metrics")!
        components.queryItems = [
            URLQueryItem(name: "startDate", value: ISO8601DateFormatter().string(from: dateRange.start)),
            URLQueryItem(name: "endDate", value: ISO8601DateFormatter().string(from: dateRange.end))
        ]

        let request = URLRequest(url: components.url!)
        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw APIError.invalidResponse
        }

        return try JSONDecoder().decode(VehicleChecklistMetrics.self, from: data)
    }

    /// Get dashboard data
    /// GET /api/checklists/dashboard
    func getDashboardData() async throws -> ChecklistDashboardData {
        let endpoint = "\(baseURL)/api/checklists/dashboard"
        let request = URLRequest(url: URL(string: endpoint)!)

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw APIError.invalidResponse
        }

        return try JSONDecoder().decode(ChecklistDashboardData.self, from: data)
    }

    /// Export report in specified format
    /// GET /api/checklists/reports/{id}/export
    func exportReport(reportId: String, format: ReportFormat) async throws -> Data {
        var components = URLComponents(string: "\(baseURL)/api/checklists/reports/\(reportId)/export")!
        components.queryItems = [
            URLQueryItem(name: "format", value: format.rawValue)
        ]

        let request = URLRequest(url: components.url!)
        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw APIError.invalidResponse
        }

        return data
    }
}

// MARK: - API Configuration

struct APIConfig {
    static let baseURL = ProcessInfo.processInfo.environment["API_BASE_URL"] ?? "https://api.fleetmanager.com"
}

// MARK: - API Error

enum APIError: Error {
    case invalidResponse
    case networkError(Error)
    case decodingError(Error)
    case unauthorized
    case notFound
}

// MARK: - Report Format

enum ReportFormat: String, CaseIterable {
    case pdf = "pdf"
    case csv = "csv"
    case excel = "xlsx"
    case json = "json"

    var icon: String {
        switch self {
        case .pdf: return "doc.fill"
        case .csv: return "doc.text.fill"
        case .excel: return "tablecells.fill"
        case .json: return "curlybraces"
        }
    }
}
