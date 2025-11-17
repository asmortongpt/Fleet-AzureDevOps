//
//  ChecklistAnalytics.swift
//  Fleet Manager
//
//  Comprehensive analytics models for checklist system
//

import Foundation

// MARK: - Checklist Metrics

struct ChecklistMetrics: Codable {
    var totalChecklists: Int
    var completedChecklists: Int
    var pendingChecklists: Int
    var expiredChecklists: Int
    var skippedChecklists: Int
    var completionRate: Double
    var averageCompletionTime: TimeInterval
    var complianceScore: Double

    // By Category
    var metricsByCategory: [ChecklistCategory: CategoryMetrics]

    // By Driver
    var metricsByDriver: [String: DriverChecklistMetrics]

    // By Vehicle
    var metricsByVehicle: [String: VehicleChecklistMetrics]

    // Time-based
    var dailyCompletions: [Date: Int]
    var weeklyCompletions: [Date: Int]
    var monthlyCompletions: [Date: Int]
}

struct CategoryMetrics: Codable {
    var category: ChecklistCategory
    var totalCount: Int
    var completedCount: Int
    var averageCompletionTime: TimeInterval
    var complianceRate: Double
    var failureRate: Double
}

struct DriverChecklistMetrics: Codable, Identifiable {
    var id: String { driverId }
    var driverId: String
    var driverName: String
    var totalAssigned: Int
    var completed: Int
    var pending: Int
    var skipped: Int
    var expired: Int
    var completionRate: Double
    var averageCompletionTime: TimeInterval
    var complianceScore: Double
    var recentChecklists: [ChecklistInstance]
}

struct VehicleChecklistMetrics: Codable, Identifiable {
    var id: String { vehicleId }
    var vehicleId: String
    var vehicleNumber: String
    var totalChecklists: Int
    var safetyChecklists: Int
    var maintenanceChecklists: Int
    var complianceRate: Double
    var lastChecklistDate: Date?
}

// MARK: - Checklist Report

struct ChecklistReport: Codable, Identifiable {
    let id: String
    var title: String
    var reportType: ChecklistReportType
    var dateRange: DateRange
    var generatedAt: Date
    var metrics: ChecklistMetrics
    var trends: ChecklistTrends
    var violations: [ComplianceViolation]
    var recommendations: [String]
}

enum ChecklistReportType: String, Codable, CaseIterable {
    case complianceOverview = "Compliance Overview"
    case driverPerformance = "Driver Performance"
    case safetyAudit = "Safety Audit"
    case categoryBreakdown = "Category Breakdown"
    case trendAnalysis = "Trend Analysis"
    case violationReport = "Violation Report"
}

struct ChecklistTrends: Codable {
    var completionRateTrend: TrendDirection
    var complianceScoreTrend: TrendDirection
    var averageTimeTrend: TrendDirection
    var issuesTrend: TrendDirection
}

enum TrendDirection: String, Codable {
    case improving, declining, stable

    var icon: String {
        switch self {
        case .improving: return "arrow.up.right"
        case .declining: return "arrow.down.right"
        case .stable: return "minus"
        }
    }

    var color: String {
        switch self {
        case .improving: return "green"
        case .declining: return "red"
        case .stable: return "gray"
        }
    }
}

struct ComplianceViolation: Codable, Identifiable {
    let id: String
    var checklistId: String
    var checklistName: String
    var category: ChecklistCategory
    var violationType: ViolationType
    var driverId: String
    var driverName: String
    var vehicleId: String?
    var vehicleNumber: String?
    var timestamp: Date
    var severity: Severity
    var description: String
    var resolved: Bool
    var resolvedAt: Date?
}

enum ViolationType: String, Codable, CaseIterable {
    case expired = "Expired Without Completion"
    case skippedRequired = "Skipped Required Checklist"
    case incompleteItems = "Incomplete Required Items"
    case failedValidation = "Failed Validation"
    case lateCompletion = "Late Completion"
    case missingSignature = "Missing Signature"

    var icon: String {
        switch self {
        case .expired: return "clock.badge.xmark"
        case .skippedRequired: return "xmark.circle.fill"
        case .incompleteItems: return "checklist.unchecked"
        case .failedValidation: return "exclamationmark.triangle.fill"
        case .lateCompletion: return "clock.arrow.circlepath"
        case .missingSignature: return "signature"
        }
    }
}

enum Severity: String, Codable, CaseIterable {
    case low, medium, high, critical

    var color: String {
        switch self {
        case .low: return "green"
        case .medium: return "yellow"
        case .high: return "orange"
        case .critical: return "red"
        }
    }

    var displayName: String {
        rawValue.capitalized
    }
}

// MARK: - Dashboard Widgets

struct ChecklistDashboardData: Codable {
    var pendingCount: Int
    var overdueCount: Int
    var completionRateToday: Double
    var complianceScore: Double
    var recentViolations: [ComplianceViolation]
    var topPerformers: [DriverChecklistMetrics]
    var categoryBreakdown: [CategoryMetrics]
}

// MARK: - Date Range

struct DateRange: Codable {
    var start: Date
    var end: Date

    var displayText: String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        return "\(formatter.string(from: start)) - \(formatter.string(from: end))"
    }
}

// MARK: - Date Range Options

enum DateRangeOption: String, CaseIterable {
    case today = "Today"
    case thisWeek = "This Week"
    case thisMonth = "This Month"
    case last7Days = "Last 7 Days"
    case last30Days = "Last 30 Days"
    case last90Days = "Last 90 Days"
    case custom = "Custom"

    func dateRange() -> DateRange {
        let calendar = Calendar.current
        let now = Date()
        let today = calendar.startOfDay(for: now)

        switch self {
        case .today:
            return DateRange(
                start: today,
                end: calendar.date(byAdding: .day, value: 1, to: today)!
            )
        case .thisWeek:
            let weekday = calendar.component(.weekday, from: now)
            let daysFromSunday = weekday - 1
            let startOfWeek = calendar.date(byAdding: .day, value: -daysFromSunday, to: today)!
            return DateRange(
                start: startOfWeek,
                end: calendar.date(byAdding: .day, value: 7, to: startOfWeek)!
            )
        case .thisMonth:
            let components = calendar.dateComponents([.year, .month], from: now)
            let startOfMonth = calendar.date(from: components)!
            let endOfMonth = calendar.date(byAdding: DateComponents(month: 1, day: -1), to: startOfMonth)!
            return DateRange(
                start: startOfMonth,
                end: calendar.date(byAdding: .day, value: 1, to: endOfMonth)!
            )
        case .last7Days:
            return DateRange(
                start: calendar.date(byAdding: .day, value: -7, to: today)!,
                end: now
            )
        case .last30Days:
            return DateRange(
                start: calendar.date(byAdding: .day, value: -30, to: today)!,
                end: now
            )
        case .last90Days:
            return DateRange(
                start: calendar.date(byAdding: .day, value: -90, to: today)!,
                end: now
            )
        case .custom:
            return DateRange(start: today, end: now)
        }
    }
}

// MARK: - Chart Data Models

struct ChecklistChartDataPoint: Identifiable {
    let id = UUID()
    var date: Date
    var count: Int
    var category: String
}

struct ComplianceScoreDataPoint: Identifiable {
    let id = UUID()
    var date: Date
    var score: Double
}

struct CategoryDistributionData: Identifiable {
    let id = UUID()
    var category: ChecklistCategory
    var count: Int
    var percentage: Double
}
