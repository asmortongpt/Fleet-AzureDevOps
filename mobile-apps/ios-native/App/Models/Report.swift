//
//  Report.swift
//  Fleet Manager - iOS Native App
//
//  Custom Report Builder Models
//  Comprehensive report configuration, templates, and scheduling models
//

import Foundation

// MARK: - Report Template

/// Represents a saved or predefined report template
struct ReportTemplate: Identifiable, Codable, Equatable {
    let id: String
    var name: String
    var description: String
    let type: ReportTemplateType
    var dataSource: ReportDataSource
    var selectedFields: [ReportField]
    var filters: [ReportFilter]
    var groupBy: ReportGrouping?
    var sortBy: ReportSorting?
    var chartType: ReportChartType
    var schedule: ReportSchedule?
    var recipients: [String]
    let createdDate: Date
    var modifiedDate: Date
    var isCustom: Bool

    init(
        id: String = UUID().uuidString,
        name: String,
        description: String,
        type: ReportTemplateType,
        dataSource: ReportDataSource,
        selectedFields: [ReportField] = [],
        filters: [ReportFilter] = [],
        groupBy: ReportGrouping? = nil,
        sortBy: ReportSorting? = nil,
        chartType: ReportChartType = .table,
        schedule: ReportSchedule? = nil,
        recipients: [String] = [],
        createdDate: Date = Date(),
        modifiedDate: Date = Date(),
        isCustom: Bool = false
    ) {
        self.id = id
        self.name = name
        self.description = description
        self.type = type
        self.dataSource = dataSource
        self.selectedFields = selectedFields
        self.filters = filters
        self.groupBy = groupBy
        self.sortBy = sortBy
        self.chartType = chartType
        self.schedule = schedule
        self.recipients = recipients
        self.createdDate = createdDate
        self.modifiedDate = modifiedDate
        self.isCustom = isCustom
    }
}

// MARK: - Report Template Type

enum ReportTemplateType: String, CaseIterable, Codable {
    case fleetSummary = "Fleet Summary"
    case costAnalysis = "Cost Analysis"
    case maintenance = "Maintenance Report"
    case fuel = "Fuel Report"
    case trips = "Trip Report"
    case driverPerformance = "Driver Performance"
    case utilization = "Utilization Report"
    case compliance = "Compliance Report"
    case custom = "Custom Report"

    var icon: String {
        switch self {
        case .fleetSummary: return "car.2.fill"
        case .costAnalysis: return "dollarsign.circle.fill"
        case .maintenance: return "wrench.and.screwdriver.fill"
        case .fuel: return "fuelpump.fill"
        case .trips: return "map.fill"
        case .driverPerformance: return "person.crop.circle.badge.checkmark"
        case .utilization: return "gauge"
        case .compliance: return "checkmark.shield.fill"
        case .custom: return "doc.text.fill"
        }
    }

    var color: String {
        switch self {
        case .fleetSummary: return "blue"
        case .costAnalysis: return "orange"
        case .maintenance: return "red"
        case .fuel: return "green"
        case .trips: return "purple"
        case .driverPerformance: return "cyan"
        case .utilization: return "indigo"
        case .compliance: return "teal"
        case .custom: return "gray"
        }
    }

    var defaultDescription: String {
        switch self {
        case .fleetSummary: return "Overview of entire fleet status and metrics"
        case .costAnalysis: return "Detailed breakdown of all fleet costs"
        case .maintenance: return "Maintenance history and upcoming services"
        case .fuel: return "Fuel consumption and efficiency analysis"
        case .trips: return "Trip details and route analysis"
        case .driverPerformance: return "Driver safety and efficiency metrics"
        case .utilization: return "Vehicle utilization and productivity"
        case .compliance: return "Regulatory compliance and certifications"
        case .custom: return "Customizable report with selected metrics"
        }
    }
}

// MARK: - Report Data Source

enum ReportDataSource: String, CaseIterable, Codable {
    case vehicles = "Vehicles"
    case trips = "Trips"
    case drivers = "Drivers"
    case maintenance = "Maintenance"
    case costs = "Costs"
    case fuel = "Fuel"
    case incidents = "Incidents"
    case compliance = "Compliance"

    var icon: String {
        switch self {
        case .vehicles: return "car.2.fill"
        case .trips: return "map.fill"
        case .drivers: return "person.3.fill"
        case .maintenance: return "wrench.fill"
        case .costs: return "dollarsign.circle.fill"
        case .fuel: return "fuelpump.fill"
        case .incidents: return "exclamationmark.triangle.fill"
        case .compliance: return "checkmark.shield.fill"
        }
    }

    var availableFields: [ReportField] {
        switch self {
        case .vehicles:
            return [
                .vehicleNumber, .vehicleType, .make, .model, .year,
                .status, .department, .region, .mileage, .fuelLevel,
                .assignedDriver, .lastService, .nextService
            ]
        case .trips:
            return [
                .vehicleNumber, .driverName, .startTime, .endTime,
                .distance, .duration, .averageSpeed, .maxSpeed,
                .fuelUsed, .tripStatus, .purpose, .events
            ]
        case .drivers:
            return [
                .driverName, .employeeId, .department, .licenseNumber,
                .licenseExpiry, .certifications, .performanceScore,
                .totalMiles, .totalTrips, .violations
            ]
        case .maintenance:
            return [
                .vehicleNumber, .maintenanceType, .scheduledDate,
                .completedDate, .cost, .provider, .mileageAtService,
                .laborHours, .parts, .warranty
            ]
        case .costs:
            return [
                .vehicleNumber, .costType, .amount, .date,
                .category, .vendor, .paymentMethod, .notes
            ]
        case .fuel:
            return [
                .vehicleNumber, .date, .gallons, .pricePerGallon,
                .totalCost, .station, .odometer, .mpg
            ]
        case .incidents:
            return [
                .vehicleNumber, .driverName, .date, .incidentType,
                .severity, .description, .estimatedCost, .status
            ]
        case .compliance:
            return [
                .vehicleNumber, .driverName, .certificationType,
                .issueDate, .expiryDate, .status, .authority
            ]
        }
    }
}

// MARK: - Report Field

enum ReportField: String, CaseIterable, Codable {
    // Vehicle fields
    case vehicleNumber = "Vehicle Number"
    case vehicleType = "Vehicle Type"
    case make = "Make"
    case model = "Model"
    case year = "Year"
    case status = "Status"
    case department = "Department"
    case region = "Region"
    case mileage = "Mileage"
    case fuelLevel = "Fuel Level"
    case assignedDriver = "Assigned Driver"
    case lastService = "Last Service"
    case nextService = "Next Service"

    // Trip fields
    case startTime = "Start Time"
    case endTime = "End Time"
    case distance = "Distance"
    case duration = "Duration"
    case averageSpeed = "Average Speed"
    case maxSpeed = "Max Speed"
    case fuelUsed = "Fuel Used"
    case tripStatus = "Trip Status"
    case purpose = "Purpose"
    case events = "Events"

    // Driver fields
    case driverName = "Driver Name"
    case employeeId = "Employee ID"
    case licenseNumber = "License Number"
    case licenseExpiry = "License Expiry"
    case certifications = "Certifications"
    case performanceScore = "Performance Score"
    case totalMiles = "Total Miles"
    case totalTrips = "Total Trips"
    case violations = "Violations"

    // Maintenance fields
    case maintenanceType = "Maintenance Type"
    case scheduledDate = "Scheduled Date"
    case completedDate = "Completed Date"
    case cost = "Cost"
    case provider = "Provider"
    case mileageAtService = "Mileage at Service"
    case laborHours = "Labor Hours"
    case parts = "Parts"
    case warranty = "Warranty"

    // Cost fields
    case costType = "Cost Type"
    case amount = "Amount"
    case date = "Date"
    case category = "Category"
    case vendor = "Vendor"
    case paymentMethod = "Payment Method"
    case notes = "Notes"

    // Fuel fields
    case gallons = "Gallons"
    case pricePerGallon = "Price per Gallon"
    case totalCost = "Total Cost"
    case station = "Station"
    case odometer = "Odometer"
    case mpg = "MPG"

    // Incident fields
    case incidentType = "Incident Type"
    case severity = "Severity"
    case description = "Description"
    case estimatedCost = "Estimated Cost"

    // Compliance fields
    case certificationType = "Certification Type"
    case issueDate = "Issue Date"
    case expiryDate = "Expiry Date"
    case authority = "Authority"

    var dataType: ReportFieldDataType {
        switch self {
        case .vehicleNumber, .make, .model, .status, .department, .region,
             .assignedDriver, .driverName, .employeeId, .licenseNumber,
             .maintenanceType, .provider, .costType, .category, .vendor,
             .paymentMethod, .notes, .station, .incidentType, .severity,
             .description, .certificationType, .authority, .purpose, .tripStatus:
            return .string

        case .year, .mileage, .totalMiles, .totalTrips, .violations, .laborHours:
            return .integer

        case .fuelLevel, .distance, .duration, .averageSpeed, .maxSpeed,
             .fuelUsed, .performanceScore, .cost, .mileageAtService,
             .amount, .gallons, .pricePerGallon, .totalCost, .odometer,
             .mpg, .estimatedCost:
            return .decimal

        case .lastService, .nextService, .startTime, .endTime, .licenseExpiry,
             .scheduledDate, .completedDate, .date, .issueDate, .expiryDate:
            return .date

        case .warranty:
            return .boolean

        case .certifications, .parts, .events:
            return .array
        }
    }
}

enum ReportFieldDataType: String, Codable {
    case string
    case integer
    case decimal
    case date
    case boolean
    case array
}

// MARK: - Report Filter

struct ReportFilter: Identifiable, Codable, Equatable {
    let id: String
    var field: ReportField
    var operatorType: FilterOperator
    var value: String
    var comparisonValue: String? // For 'between' operator

    init(
        id: String = UUID().uuidString,
        field: ReportField,
        operatorType: FilterOperator,
        value: String,
        comparisonValue: String? = nil
    ) {
        self.id = id
        self.field = field
        self.operatorType = operatorType
        self.value = value
        self.comparisonValue = comparisonValue
    }

    var displayText: String {
        if let comparison = comparisonValue {
            return "\(field.rawValue) \(operatorType.rawValue) \(value) and \(comparison)"
        }
        return "\(field.rawValue) \(operatorType.rawValue) \(value)"
    }
}

enum FilterOperator: String, CaseIterable, Codable {
    case equals = "equals"
    case notEquals = "not equals"
    case contains = "contains"
    case notContains = "does not contain"
    case greaterThan = "greater than"
    case lessThan = "less than"
    case greaterThanOrEqual = "greater than or equal to"
    case lessThanOrEqual = "less than or equal to"
    case between = "between"
    case isEmpty = "is empty"
    case isNotEmpty = "is not empty"

    var symbol: String {
        switch self {
        case .equals: return "="
        case .notEquals: return "≠"
        case .contains: return "⊃"
        case .notContains: return "⊅"
        case .greaterThan: return ">"
        case .lessThan: return "<"
        case .greaterThanOrEqual: return "≥"
        case .lessThanOrEqual: return "≤"
        case .between: return "⟷"
        case .isEmpty: return "∅"
        case .isNotEmpty: return "≠∅"
        }
    }
}

// MARK: - Report Grouping

struct ReportGrouping: Codable, Equatable {
    var field: ReportField
    var showSubtotals: Bool
    var showGrandTotal: Bool

    init(field: ReportField, showSubtotals: Bool = true, showGrandTotal: Bool = true) {
        self.field = field
        self.showSubtotals = showSubtotals
        self.showGrandTotal = showGrandTotal
    }
}

// MARK: - Report Sorting

struct ReportSorting: Codable, Equatable {
    var field: ReportField
    var direction: SortDirection

    enum SortDirection: String, Codable {
        case ascending = "Ascending"
        case descending = "Descending"

        var icon: String {
            switch self {
            case .ascending: return "arrow.up"
            case .descending: return "arrow.down"
            }
        }
    }
}

// MARK: - Report Chart Type

enum ReportChartType: String, CaseIterable, Codable {
    case table = "Table"
    case bar = "Bar Chart"
    case line = "Line Chart"
    case pie = "Pie Chart"
    case area = "Area Chart"
    case scatter = "Scatter Plot"

    var icon: String {
        switch self {
        case .table: return "tablecells"
        case .bar: return "chart.bar.fill"
        case .line: return "chart.line.uptrend.xyaxis"
        case .pie: return "chart.pie.fill"
        case .area: return "chart.xyaxis.line"
        case .scatter: return "circle.grid.cross.fill"
        }
    }
}

// MARK: - Report Schedule

struct ReportSchedule: Codable, Equatable {
    var frequency: ScheduleFrequency
    var time: Date // Time of day for daily/weekly/monthly
    var dayOfWeek: Int? // 1 = Sunday, 7 = Saturday (for weekly)
    var dayOfMonth: Int? // 1-31 (for monthly)
    var isEnabled: Bool
    var lastRun: Date?
    var nextRun: Date?

    init(
        frequency: ScheduleFrequency,
        time: Date = Date(),
        dayOfWeek: Int? = nil,
        dayOfMonth: Int? = nil,
        isEnabled: Bool = true,
        lastRun: Date? = nil,
        nextRun: Date? = nil
    ) {
        self.frequency = frequency
        self.time = time
        self.dayOfWeek = dayOfWeek
        self.dayOfMonth = dayOfMonth
        self.isEnabled = isEnabled
        self.lastRun = lastRun
        self.nextRun = nextRun
    }

    enum ScheduleFrequency: String, CaseIterable, Codable {
        case daily = "Daily"
        case weekly = "Weekly"
        case monthly = "Monthly"
        case quarterly = "Quarterly"

        var icon: String {
            switch self {
            case .daily: return "calendar"
            case .weekly: return "calendar.badge.clock"
            case .monthly: return "calendar.circle"
            case .quarterly: return "calendar.badge.exclamationmark"
            }
        }
    }

    var displayText: String {
        var text = frequency.rawValue

        switch frequency {
        case .daily:
            let formatter = DateFormatter()
            formatter.timeStyle = .short
            text += " at \(formatter.string(from: time))"
        case .weekly:
            if let day = dayOfWeek {
                let dayName = Calendar.current.weekdaySymbols[day - 1]
                text += " on \(dayName)"
            }
        case .monthly:
            if let day = dayOfMonth {
                text += " on day \(day)"
            }
        case .quarterly:
            text += " (every 3 months)"
        }

        return text
    }
}

// MARK: - Generated Report Result

struct GeneratedReport: Identifiable, Codable {
    let id: String
    let templateId: String
    let templateName: String
    let dateRange: DateRange
    let generatedDate: Date
    var data: [[String: ReportCellValue]]
    var summary: ReportSummary?
    var chartData: ChartData?

    init(
        id: String = UUID().uuidString,
        templateId: String,
        templateName: String,
        dateRange: DateRange,
        generatedDate: Date = Date(),
        data: [[String: ReportCellValue]] = [],
        summary: ReportSummary? = nil,
        chartData: ChartData? = nil
    ) {
        self.id = id
        self.templateId = templateId
        self.templateName = templateName
        self.dateRange = dateRange
        self.generatedDate = generatedDate
        self.data = data
        self.summary = summary
        self.chartData = chartData
    }
}

// MARK: - Report Cell Value

enum ReportCellValue: Codable, Equatable {
    case string(String)
    case integer(Int)
    case decimal(Double)
    case date(Date)
    case boolean(Bool)
    case array([String])

    var displayValue: String {
        switch self {
        case .string(let value): return value
        case .integer(let value): return "\(value)"
        case .decimal(let value): return String(format: "%.2f", value)
        case .date(let value):
            let formatter = DateFormatter()
            formatter.dateStyle = .short
            formatter.timeStyle = .short
            return formatter.string(from: value)
        case .boolean(let value): return value ? "Yes" : "No"
        case .array(let values): return values.joined(separator: ", ")
        }
    }
}

// MARK: - Report Summary

struct ReportSummary: Codable {
    var totalRecords: Int
    var aggregations: [String: Double]
    var insights: [String]

    init(totalRecords: Int = 0, aggregations: [String: Double] = [:], insights: [String] = []) {
        self.totalRecords = totalRecords
        self.aggregations = aggregations
        self.insights = insights
    }
}

// MARK: - Chart Data

struct ChartData: Codable {
    var labels: [String]
    var datasets: [ChartDataset]

    struct ChartDataset: Codable {
        var label: String
        var values: [Double]
        var color: String
    }
}

// MARK: - Predefined Templates

extension ReportTemplate {
    static var predefinedTemplates: [ReportTemplate] {
        [
            // Fleet Summary
            ReportTemplate(
                name: "Fleet Summary",
                description: "Complete overview of fleet status and metrics",
                type: .fleetSummary,
                dataSource: .vehicles,
                selectedFields: [.vehicleNumber, .vehicleType, .status, .department, .mileage, .fuelLevel],
                chartType: .bar
            ),

            // Cost Analysis
            ReportTemplate(
                name: "Cost Analysis",
                description: "Detailed breakdown of all fleet costs",
                type: .costAnalysis,
                dataSource: .costs,
                selectedFields: [.vehicleNumber, .costType, .amount, .date, .category, .vendor],
                chartType: .pie
            ),

            // Maintenance Report
            ReportTemplate(
                name: "Maintenance Report",
                description: "Maintenance history and upcoming services",
                type: .maintenance,
                dataSource: .maintenance,
                selectedFields: [.vehicleNumber, .maintenanceType, .scheduledDate, .cost, .provider, .warranty],
                chartType: .table
            ),

            // Fuel Report
            ReportTemplate(
                name: "Fuel Report",
                description: "Fuel consumption and efficiency analysis",
                type: .fuel,
                dataSource: .fuel,
                selectedFields: [.vehicleNumber, .date, .gallons, .totalCost, .station, .mpg],
                chartType: .line
            ),

            // Trip Report
            ReportTemplate(
                name: "Trip Report",
                description: "Trip details and route analysis",
                type: .trips,
                dataSource: .trips,
                selectedFields: [.vehicleNumber, .driverName, .startTime, .distance, .duration, .fuelUsed],
                chartType: .area
            ),

            // Driver Performance
            ReportTemplate(
                name: "Driver Performance",
                description: "Driver safety and efficiency metrics",
                type: .driverPerformance,
                dataSource: .drivers,
                selectedFields: [.driverName, .department, .performanceScore, .totalMiles, .totalTrips, .violations],
                chartType: .bar
            )
        ]
    }
}
