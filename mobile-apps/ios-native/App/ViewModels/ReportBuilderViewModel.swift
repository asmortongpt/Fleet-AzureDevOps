//
//  ReportBuilderViewModel.swift
//  Fleet Manager - iOS Native App
//
//  Report Builder ViewModel
//  Handles report generation, preview, export, and scheduling
//

import Foundation
import SwiftUI
import Combine

@MainActor
final class ReportBuilderViewModel: RefreshableViewModel {

    // MARK: - Published Properties

    // Templates
    @Published var availableTemplates: [ReportTemplate] = []
    @Published var savedTemplates: [ReportTemplate] = []
    @Published var selectedTemplate: ReportTemplate?

    // Builder state
    @Published var currentTemplate: ReportTemplate
    @Published var selectedDataSource: ReportDataSource = .vehicles
    @Published var selectedFields: [ReportField] = []
    @Published var filters: [ReportFilter] = []
    @Published var grouping: ReportGrouping?
    @Published var sorting: ReportSorting?
    @Published var chartType: ReportChartType = .table
    @Published var dateRange: DateRange = .last30Days

    // Generated report
    @Published var generatedReport: GeneratedReport?
    @Published var isGenerating = false
    @Published var generateError: String?

    // Export
    @Published var isExporting = false
    @Published var exportFormat: ReportFormat = .pdf
    @Published var exportSuccess = false

    // Schedule
    @Published var schedule: ReportSchedule?
    @Published var recipients: [String] = []

    // Mock data source
    private let mockData = MockDataGenerator.shared
    private var vehicles: [Vehicle] = []
    private var trips: [Trip] = []
    private var maintenanceRecords: [MaintenanceRecord] = []
    private var fuelRecords: [FuelRecord] = []

    // MARK: - Initialization

    override init() {
        // Initialize with default custom template
        self.currentTemplate = ReportTemplate(
            name: "New Custom Report",
            description: "Custom report configuration",
            type: .custom,
            dataSource: .vehicles,
            isCustom: true
        )

        super.init()
        loadTemplates()
        loadMockData()
    }

    // MARK: - Template Management

    func loadTemplates() {
        // Load predefined templates
        availableTemplates = ReportTemplate.predefinedTemplates

        // Load saved custom templates from cache
        if let data = getCachedObject(forKey: "custom_report_templates", type: Data.self),
           let templates = try? JSONDecoder().decode([ReportTemplate].self, from: data) {
            savedTemplates = templates
        }
    }

    func selectTemplate(_ template: ReportTemplate) {
        selectedTemplate = template
        currentTemplate = template
        selectedDataSource = template.dataSource
        selectedFields = template.selectedFields
        filters = template.filters
        grouping = template.groupBy
        sorting = template.sortBy
        chartType = template.chartType
        schedule = template.schedule
        recipients = template.recipients
    }

    func saveTemplate() {
        // Update current template
        currentTemplate.name = currentTemplate.name.isEmpty ? "Custom Report" : currentTemplate.name
        currentTemplate.modifiedDate = Date()
        currentTemplate.selectedFields = selectedFields
        currentTemplate.filters = filters
        currentTemplate.groupBy = grouping
        currentTemplate.sortBy = sorting
        currentTemplate.chartType = chartType
        currentTemplate.schedule = schedule
        currentTemplate.recipients = recipients
        currentTemplate.isCustom = true

        // Add to saved templates if new
        if !savedTemplates.contains(where: { $0.id == currentTemplate.id }) {
            savedTemplates.append(currentTemplate)
        } else {
            // Update existing
            if let index = savedTemplates.firstIndex(where: { $0.id == currentTemplate.id }) {
                savedTemplates[index] = currentTemplate
            }
        }

        // Cache templates
        if let data = try? JSONEncoder().encode(savedTemplates) {
            cacheObject(data as AnyObject, forKey: "custom_report_templates")
        }
    }

    func deleteTemplate(_ template: ReportTemplate) {
        savedTemplates.removeAll { $0.id == template.id }

        // Update cache
        if let data = try? JSONEncoder().encode(savedTemplates) {
            cacheObject(data as AnyObject, forKey: "custom_report_templates")
        }
    }

    func createNewTemplate() {
        currentTemplate = ReportTemplate(
            name: "New Custom Report",
            description: "Custom report configuration",
            type: .custom,
            dataSource: selectedDataSource,
            isCustom: true
        )
        selectedFields = []
        filters = []
        grouping = nil
        sorting = nil
        chartType = .table
        schedule = nil
        recipients = []
        generatedReport = nil
    }

    // MARK: - Data Source Management

    func updateDataSource(_ source: ReportDataSource) {
        selectedDataSource = source
        currentTemplate.dataSource = source

        // Clear fields if they're not compatible with new data source
        selectedFields = selectedFields.filter { source.availableFields.contains($0) }

        // Clear filters that reference incompatible fields
        filters = filters.filter { source.availableFields.contains($0.field) }
    }

    // MARK: - Field Management

    func toggleField(_ field: ReportField) {
        if let index = selectedFields.firstIndex(of: field) {
            selectedFields.remove(at: index)
        } else {
            selectedFields.append(field)
        }
    }

    func moveField(from source: IndexSet, to destination: Int) {
        selectedFields.move(fromOffsets: source, toOffset: destination)
    }

    func removeField(_ field: ReportField) {
        selectedFields.removeAll { $0 == field }
    }

    // MARK: - Filter Management

    func addFilter(_ filter: ReportFilter) {
        filters.append(filter)
    }

    func removeFilter(at index: Int) {
        guard index < filters.count else { return }
        filters.remove(at: index)
    }

    func updateFilter(at index: Int, with filter: ReportFilter) {
        guard index < filters.count else { return }
        filters[index] = filter
    }

    // MARK: - Report Generation

    func generateReport() async {
        isGenerating = true
        generateError = nil

        do {
            // Simulate report generation
            try await Task.sleep(nanoseconds: 1_500_000_000) // 1.5 seconds

            // Generate report data based on data source
            let reportData = try generateReportData()

            // Apply filters
            let filteredData = applyFilters(to: reportData)

            // Apply grouping
            let groupedData = applyGrouping(to: filteredData)

            // Apply sorting
            let sortedData = applySorting(to: groupedData)

            // Generate summary
            let summary = generateSummary(from: sortedData)

            // Generate chart data
            let chartData = generateChartData(from: sortedData)

            // Create generated report
            generatedReport = GeneratedReport(
                templateId: currentTemplate.id,
                templateName: currentTemplate.name,
                dateRange: dateRange,
                data: sortedData,
                summary: summary,
                chartData: chartData
            )

            isGenerating = false

        } catch {
            isGenerating = false
            generateError = error.localizedDescription
            handleError(error)
        }
    }

    private func generateReportData() throws -> [[String: ReportCellValue]] {
        var data: [[String: ReportCellValue]] = []

        switch selectedDataSource {
        case .vehicles:
            data = generateVehicleData()
        case .trips:
            data = generateTripData()
        case .drivers:
            data = generateDriverData()
        case .maintenance:
            data = generateMaintenanceData()
        case .costs:
            data = generateCostData()
        case .fuel:
            data = generateFuelData()
        case .incidents:
            data = generateIncidentData()
        case .compliance:
            data = generateComplianceData()
        }

        return data
    }

    private func generateVehicleData() -> [[String: ReportCellValue]] {
        vehicles.map { vehicle in
            var row: [String: ReportCellValue] = [:]

            if selectedFields.contains(.vehicleNumber) {
                row["Vehicle Number"] = .string(vehicle.number)
            }
            if selectedFields.contains(.vehicleType) {
                row["Vehicle Type"] = .string(vehicle.type.displayName)
            }
            if selectedFields.contains(.make) {
                row["Make"] = .string(vehicle.make)
            }
            if selectedFields.contains(.model) {
                row["Model"] = .string(vehicle.model)
            }
            if selectedFields.contains(.year) {
                row["Year"] = .integer(vehicle.year)
            }
            if selectedFields.contains(.status) {
                row["Status"] = .string(vehicle.status.displayName)
            }
            if selectedFields.contains(.department) {
                row["Department"] = .string(vehicle.department)
            }
            if selectedFields.contains(.region) {
                row["Region"] = .string(vehicle.region)
            }
            if selectedFields.contains(.mileage) {
                row["Mileage"] = .decimal(vehicle.mileage)
            }
            if selectedFields.contains(.fuelLevel) {
                row["Fuel Level"] = .decimal(vehicle.fuelLevel * 100)
            }
            if selectedFields.contains(.assignedDriver), let driver = vehicle.assignedDriver {
                row["Assigned Driver"] = .string(driver)
            }

            return row
        }
    }

    private func generateTripData() -> [[String: ReportCellValue]] {
        let filteredTrips = trips.filter { trip in
            trip.startTime >= dateRange.start && trip.startTime <= dateRange.end
        }

        return filteredTrips.map { trip in
            var row: [String: ReportCellValue] = [:]

            if selectedFields.contains(.vehicleNumber) {
                row["Vehicle Number"] = .string(trip.vehicleNumber)
            }
            if selectedFields.contains(.driverName) {
                row["Driver Name"] = .string(trip.driverName)
            }
            if selectedFields.contains(.startTime) {
                row["Start Time"] = .date(trip.startTime)
            }
            if selectedFields.contains(.endTime), let endTime = trip.endTime {
                row["End Time"] = .date(endTime)
            }
            if selectedFields.contains(.distance) {
                row["Distance"] = .decimal(trip.distance)
            }
            if selectedFields.contains(.duration) {
                row["Duration"] = .decimal(trip.duration / 3600) // Convert to hours
            }
            if selectedFields.contains(.averageSpeed) {
                row["Average Speed"] = .decimal(trip.averageSpeed)
            }
            if selectedFields.contains(.maxSpeed) {
                row["Max Speed"] = .decimal(trip.maxSpeed)
            }
            if selectedFields.contains(.fuelUsed) {
                row["Fuel Used"] = .decimal(trip.fuelUsed)
            }

            return row
        }
    }

    private func generateDriverData() -> [[String: ReportCellValue]] {
        // Group trips by driver
        var driverData: [String: [String: ReportCellValue]] = [:]

        for trip in trips {
            if driverData[trip.driverName] == nil {
                var row: [String: ReportCellValue] = [:]

                if selectedFields.contains(.driverName) {
                    row["Driver Name"] = .string(trip.driverName)
                }

                driverData[trip.driverName] = row
            }
        }

        // Calculate aggregates
        for (driverName, _) in driverData {
            let driverTrips = trips.filter { $0.driverName == driverName }

            if selectedFields.contains(.totalTrips) {
                driverData[driverName]?["Total Trips"] = .integer(driverTrips.count)
            }
            if selectedFields.contains(.totalMiles) {
                let totalMiles = driverTrips.map { $0.distance }.reduce(0, +)
                driverData[driverName]?["Total Miles"] = .decimal(totalMiles)
            }
            if selectedFields.contains(.violations) {
                let violations = driverTrips.flatMap { $0.events }.filter {
                    $0.type == .speeding || $0.type == .hardBraking
                }.count
                driverData[driverName]?["Violations"] = .integer(violations)
            }
        }

        return Array(driverData.values)
    }

    private func generateMaintenanceData() -> [[String: ReportCellValue]] {
        let filteredRecords = maintenanceRecords.filter { record in
            record.scheduledDate >= dateRange.start && record.scheduledDate <= dateRange.end
        }

        return filteredRecords.map { record in
            var row: [String: ReportCellValue] = [:]

            if selectedFields.contains(.vehicleNumber) {
                row["Vehicle Number"] = .string(record.vehicleNumber)
            }
            if selectedFields.contains(.maintenanceType) {
                row["Maintenance Type"] = .string(record.type)
            }
            if selectedFields.contains(.scheduledDate) {
                row["Scheduled Date"] = .date(record.scheduledDate)
            }
            if selectedFields.contains(.completedDate), let completed = record.completedDate {
                row["Completed Date"] = .date(completed)
            }
            if selectedFields.contains(.cost) {
                row["Cost"] = .decimal(record.cost)
            }
            if selectedFields.contains(.provider) {
                row["Provider"] = .string(record.provider)
            }
            if selectedFields.contains(.mileageAtService) {
                row["Mileage at Service"] = .decimal(record.mileageAtService)
            }
            if selectedFields.contains(.laborHours) {
                row["Labor Hours"] = .decimal(record.laborHours)
            }
            if selectedFields.contains(.warranty) {
                row["Warranty"] = .boolean(record.warranty)
            }

            return row
        }
    }

    private func generateCostData() -> [[String: ReportCellValue]] {
        // Generate cost data from fuel and maintenance
        var costData: [[String: ReportCellValue]] = []

        let filteredFuel = fuelRecords.filter { $0.date >= dateRange.start && $0.date <= dateRange.end }
        let filteredMaintenance = maintenanceRecords.filter {
            $0.scheduledDate >= dateRange.start && $0.scheduledDate <= dateRange.end
        }

        for fuel in filteredFuel {
            var row: [String: ReportCellValue] = [:]

            if selectedFields.contains(.vehicleNumber) {
                row["Vehicle Number"] = .string(fuel.vehicleNumber)
            }
            if selectedFields.contains(.costType) {
                row["Cost Type"] = .string("Fuel")
            }
            if selectedFields.contains(.amount) {
                row["Amount"] = .decimal(fuel.totalCost)
            }
            if selectedFields.contains(.date) {
                row["Date"] = .date(fuel.date)
            }
            if selectedFields.contains(.vendor) {
                row["Vendor"] = .string(fuel.station)
            }

            costData.append(row)
        }

        for maintenance in filteredMaintenance {
            var row: [String: ReportCellValue] = [:]

            if selectedFields.contains(.vehicleNumber) {
                row["Vehicle Number"] = .string(maintenance.vehicleNumber)
            }
            if selectedFields.contains(.costType) {
                row["Cost Type"] = .string("Maintenance")
            }
            if selectedFields.contains(.amount) {
                row["Amount"] = .decimal(maintenance.cost)
            }
            if selectedFields.contains(.date) {
                row["Date"] = .date(maintenance.scheduledDate)
            }
            if selectedFields.contains(.vendor) {
                row["Vendor"] = .string(maintenance.provider)
            }

            costData.append(row)
        }

        return costData
    }

    private func generateFuelData() -> [[String: ReportCellValue]] {
        let filteredRecords = fuelRecords.filter { record in
            record.date >= dateRange.start && record.date <= dateRange.end
        }

        return filteredRecords.map { record in
            var row: [String: ReportCellValue] = [:]

            if selectedFields.contains(.vehicleNumber) {
                row["Vehicle Number"] = .string(record.vehicleNumber)
            }
            if selectedFields.contains(.date) {
                row["Date"] = .date(record.date)
            }
            if selectedFields.contains(.gallons) {
                row["Gallons"] = .decimal(record.gallons)
            }
            if selectedFields.contains(.pricePerGallon) {
                row["Price per Gallon"] = .decimal(record.pricePerGallon)
            }
            if selectedFields.contains(.totalCost) {
                row["Total Cost"] = .decimal(record.totalCost)
            }
            if selectedFields.contains(.station) {
                row["Station"] = .string(record.station)
            }
            if selectedFields.contains(.odometer) {
                row["Odometer"] = .decimal(record.odometer)
            }

            return row
        }
    }

    private func generateIncidentData() -> [[String: ReportCellValue]] {
        // Mock incident data
        return []
    }

    private func generateComplianceData() -> [[String: ReportCellValue]] {
        // Mock compliance data
        return []
    }

    // MARK: - Data Processing

    private func applyFilters(to data: [[String: ReportCellValue]]) -> [[String: ReportCellValue]] {
        guard !filters.isEmpty else { return data }

        return data.filter { row in
            filters.allSatisfy { filter in
                evaluateFilter(filter, for: row)
            }
        }
    }

    private func evaluateFilter(_ filter: ReportFilter, for row: [String: ReportCellValue]) -> Bool {
        guard let cellValue = row[filter.field.rawValue] else { return false }

        switch filter.operatorType {
        case .equals:
            return cellValue.displayValue == filter.value
        case .notEquals:
            return cellValue.displayValue != filter.value
        case .contains:
            return cellValue.displayValue.lowercased().contains(filter.value.lowercased())
        case .notContains:
            return !cellValue.displayValue.lowercased().contains(filter.value.lowercased())
        case .greaterThan:
            if case .decimal(let value) = cellValue, let filterValue = Double(filter.value) {
                return value > filterValue
            }
            return false
        case .lessThan:
            if case .decimal(let value) = cellValue, let filterValue = Double(filter.value) {
                return value < filterValue
            }
            return false
        case .isEmpty:
            return cellValue.displayValue.isEmpty
        case .isNotEmpty:
            return !cellValue.displayValue.isEmpty
        default:
            return true
        }
    }

    private func applyGrouping(to data: [[String: ReportCellValue]]) -> [[String: ReportCellValue]] {
        guard let grouping = grouping else { return data }

        // Group data by field
        let grouped = Dictionary(grouping: data) { row in
            row[grouping.field.rawValue]?.displayValue ?? ""
        }

        // Flatten back to array with subtotals if needed
        var result: [[String: ReportCellValue]] = []

        for (_, rows) in grouped.sorted(by: { $0.key < $1.key }) {
            result.append(contentsOf: rows)

            if grouping.showSubtotals {
                // Add subtotal row
                var subtotalRow: [String: ReportCellValue] = [:]
                subtotalRow[grouping.field.rawValue] = .string("Subtotal")
                result.append(subtotalRow)
            }
        }

        return result
    }

    private func applySorting(to data: [[String: ReportCellValue]]) -> [[String: ReportCellValue]] {
        guard let sorting = sorting else { return data }

        return data.sorted { row1, row2 in
            guard let value1 = row1[sorting.field.rawValue],
                  let value2 = row2[sorting.field.rawValue] else {
                return false
            }

            let comparison = value1.displayValue.compare(value2.displayValue)

            switch sorting.direction {
            case .ascending:
                return comparison == .orderedAscending
            case .descending:
                return comparison == .orderedDescending
            }
        }
    }

    private func generateSummary(from data: [[String: ReportCellValue]]) -> ReportSummary {
        var aggregations: [String: Double] = [:]
        var insights: [String] = []

        // Calculate aggregations for numeric fields
        for field in selectedFields where field.dataType == .decimal || field.dataType == .integer {
            let values = data.compactMap { row -> Double? in
                switch row[field.rawValue] {
                case .decimal(let value): return value
                case .integer(let value): return Double(value)
                default: return nil
                }
            }

            if !values.isEmpty {
                let sum = values.reduce(0, +)
                let avg = sum / Double(values.count)
                let max = values.max() ?? 0
                let min = values.min() ?? 0

                aggregations["\(field.rawValue) - Sum"] = sum
                aggregations["\(field.rawValue) - Average"] = avg
                aggregations["\(field.rawValue) - Max"] = max
                aggregations["\(field.rawValue) - Min"] = min
            }
        }

        // Generate insights
        insights.append("Total records: \(data.count)")

        if let costSum = aggregations["Cost - Sum"] {
            insights.append("Total cost: $\(String(format: "%.2f", costSum))")
        }

        if let distanceSum = aggregations["Distance - Sum"] {
            insights.append("Total distance: \(String(format: "%.1f", distanceSum)) mi")
        }

        return ReportSummary(
            totalRecords: data.count,
            aggregations: aggregations,
            insights: insights
        )
    }

    private func generateChartData(from data: [[String: ReportCellValue]]) -> ChartData? {
        guard !selectedFields.isEmpty else { return nil }

        var labels: [String] = []
        var values: [Double] = []

        // Use first field as label, second as value (if numeric)
        let labelField = selectedFields[0]
        let valueField = selectedFields.count > 1 ? selectedFields[1] : labelField

        for row in data.prefix(20) { // Limit to first 20 for readability
            if let label = row[labelField.rawValue] {
                labels.append(label.displayValue)
            }

            if let value = row[valueField.rawValue] {
                switch value {
                case .decimal(let val):
                    values.append(val)
                case .integer(let val):
                    values.append(Double(val))
                default:
                    values.append(0)
                }
            }
        }

        return ChartData(
            labels: labels,
            datasets: [
                ChartData.ChartDataset(
                    label: valueField.rawValue,
                    values: values,
                    color: "blue"
                )
            ]
        )
    }

    // MARK: - Export

    func exportReport(format: ReportFormat) async -> Bool {
        isExporting = true
        exportSuccess = false

        do {
            // Simulate export process
            try await Task.sleep(nanoseconds: 2_000_000_000) // 2 seconds

            // In production, would generate actual files
            switch format {
            case .pdf:
                print("Exporting report as PDF")
            case .excel:
                print("Exporting report as Excel")
            case .csv:
                print("Exporting report as CSV")
            case .json:
                if let report = generatedReport,
                   let data = try? JSONEncoder().encode(report) {
                    print("Exported report as JSON: \(data.count) bytes")
                }
            }

            isExporting = false
            exportSuccess = true
            return true

        } catch {
            isExporting = false
            handleError(error)
            return false
        }
    }

    // MARK: - Scheduling

    func scheduleReport(_ schedule: ReportSchedule) {
        self.schedule = schedule
        currentTemplate.schedule = schedule

        // In production, would register with notification/scheduling service
        print("Report scheduled: \(schedule.displayText)")
    }

    func addRecipient(_ email: String) {
        guard !email.isEmpty && !recipients.contains(email) else { return }
        recipients.append(email)
    }

    func removeRecipient(_ email: String) {
        recipients.removeAll { $0 == email }
    }

    // MARK: - Data Loading

    private func loadMockData() {
        vehicles = mockData.generateVehicles(count: 30)
        trips = mockData.generateTrips(count: 100, vehicles: vehicles)
        maintenanceRecords = mockData.generateMaintenanceRecords(count: 50, vehicles: vehicles)
        fuelRecords = mockData.generateFuelRecords(count: 75, vehicles: vehicles)
    }

    override func refresh() async {
        loadMockData()
        if generatedReport != nil {
            await generateReport()
        }
    }
}
