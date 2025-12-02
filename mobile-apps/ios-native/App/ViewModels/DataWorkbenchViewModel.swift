//
//  DataWorkbenchViewModel.swift
//  Fleet Manager
//
//  ViewModel for Data Workbench with query execution and data management
//

import Foundation
import Combine
import SwiftUI

@MainActor
class DataWorkbenchViewModel: RefreshableViewModel {
    // MARK: - Published Properties
    @Published var availableDatasets: [Dataset] = []
    @Published var selectedDataset: Dataset?
    @Published var currentQuery: Query?
    @Published var queryResult: QueryResult?
    @Published var savedQueries: [Query] = []
    @Published var favoriteQueries: [Query] = []

    // Query Builder State
    @Published var selectedColumns: Set<String> = []
    @Published var filterConditions: [FilterCondition] = []
    @Published var groupByColumns: [String] = []
    @Published var aggregations: [Aggregation] = []
    @Published var sortColumns: [SortColumn] = []
    @Published var queryLimit: Int = 100

    // UI State
    @Published var isExecutingQuery = false
    @Published var showSaveQuerySheet = false
    @Published var showExportSheet = false
    @Published var showQueryHistory = false
    @Published var exportFormat: ExportFormat = .csv
    @Published var queryName = ""

    // Pagination
    @Published var currentPage = 1
    @Published var pageSize = 100
    @Published var totalPages = 1

    // Cache
    private var queryResultsCache: [String: QueryResult] = [:]

    // MARK: - API Configuration
    private let baseURL = APIConfiguration.apiBaseURL
    private let queryEndpoint = "/v1/data/query"
    private let datasetsEndpoint = "/v1/data/datasets"

    // MARK: - Initialization
    override init() {
        super.init()
        loadSavedQueries()
        loadFavoriteQueries()
    }

    // MARK: - Data Loading
    func loadAvailableDatasets() async {
        startLoading()

        do {
            // In a real app, this would fetch from API
            // For now, we'll create mock datasets based on available data sources
            let datasets = DataSource.allCases.map { source in
                Dataset(
                    name: source.displayName,
                    source: source,
                    rowCount: getEstimatedRowCount(for: source),
                    columns: getColumnsForDataSource(source),
                    description: "All \(source.displayName.lowercased()) data"
                )
            }

            availableDatasets = datasets
            finishLoading()
        } catch {
            handleError(error)
        }
    }

    // MARK: - Query Execution
    func executeQuery() async {
        guard let dataset = selectedDataset else {
            handleErrorMessage("Please select a dataset first")
            return
        }

        isExecutingQuery = true
        startLoading()

        do {
            // Build query from current state
            let query = buildQuery(dataset: dataset.source)
            currentQuery = query

            // Check cache first
            let cacheKey = queryCacheKey(for: query)
            if let cachedResult = queryResultsCache[cacheKey] {
                queryResult = cachedResult
                isExecutingQuery = false
                finishLoading()
                return
            }

            // Execute query via API
            let result = try await performQueryRequest(query)

            // Cache the result
            queryResultsCache[cacheKey] = result
            queryResult = result

            // Update pagination
            totalPages = Int(ceil(Double(result.metadata.totalCount) / Double(pageSize)))

            isExecutingQuery = false
            finishLoading()
        } catch {
            isExecutingQuery = false
            handleError(error)
        }
    }

    private func performQueryRequest(_ query: Query) async throws -> QueryResult {
        // Build request
        var request = URLRequest(url: URL(string: baseURL + queryEndpoint)!)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        // Add auth token if available
        if let token = await getAuthToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        // Encode query
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        request.httpBody = try encoder.encode(query)

        // Execute request
        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw NSError(domain: "DataWorkbench", code: -1, userInfo: [NSLocalizedDescriptionKey: "Invalid response"])
        }

        guard httpResponse.statusCode == 200 else {
            throw NSError(domain: "DataWorkbench", code: httpResponse.statusCode, userInfo: [NSLocalizedDescriptionKey: "Query failed with status \(httpResponse.statusCode)"])
        }

        // Decode result
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        let result = try decoder.decode(QueryResult.self, from: data)

        return result
    }

    private func buildQuery(dataset: DataSource) -> Query {
        return Query(
            name: queryName.isEmpty ? "Untitled Query" : queryName,
            dataset: dataset,
            selectedColumns: Array(selectedColumns),
            filters: filterConditions,
            groupBy: groupByColumns,
            aggregations: aggregations,
            orderBy: sortColumns,
            limit: queryLimit
        )
    }

    // MARK: - Query Builder Actions
    func selectDataset(_ dataset: Dataset) {
        selectedDataset = dataset
        resetQueryBuilder()
    }

    func toggleColumnSelection(_ column: String) {
        if selectedColumns.contains(column) {
            selectedColumns.remove(column)
        } else {
            selectedColumns.insert(column)
        }
    }

    func addFilter(column: String, operator: FilterOperator, value: FilterValue) {
        let filter = FilterCondition(
            column: column,
            operator: `operator`,
            value: value
        )
        filterConditions.append(filter)
    }

    func removeFilter(_ filter: FilterCondition) {
        filterConditions.removeAll { $0.id == filter.id }
    }

    func updateFilter(_ filter: FilterCondition) {
        if let index = filterConditions.firstIndex(where: { $0.id == filter.id }) {
            filterConditions[index] = filter
        }
    }

    func addAggregation(column: String, function: AggregationFunction) {
        let aggregation = Aggregation(column: column, function: function)
        aggregations.append(aggregation)
    }

    func removeAggregation(_ aggregation: Aggregation) {
        aggregations.removeAll { $0.id == aggregation.id }
    }

    func addGroupBy(_ column: String) {
        if !groupByColumns.contains(column) {
            groupByColumns.append(column)
        }
    }

    func removeGroupBy(_ column: String) {
        groupByColumns.removeAll { $0 == column }
    }

    func addSort(column: String, direction: SortDirection) {
        let sort = SortColumn(column: column, direction: direction)
        sortColumns.append(sort)
    }

    func removeSort(_ sort: SortColumn) {
        sortColumns.removeAll { $0.id == sort.id }
    }

    func updateSortDirection(_ sort: SortColumn, direction: SortDirection) {
        if let index = sortColumns.firstIndex(where: { $0.id == sort.id }) {
            sortColumns[index] = SortColumn(id: sort.id, column: sort.column, direction: direction)
        }
    }

    func resetQueryBuilder() {
        selectedColumns.removeAll()
        filterConditions.removeAll()
        groupByColumns.removeAll()
        aggregations.removeAll()
        sortColumns.removeAll()
        queryLimit = 100
        queryResult = nil
        currentQuery = nil
    }

    // MARK: - Query Management
    func saveCurrentQuery() async {
        guard let dataset = selectedDataset else { return }

        var query = buildQuery(dataset: dataset.source)
        query.savedAt = Date()

        savedQueries.append(query)
        persistSavedQueries()

        queryName = ""
        showSaveQuerySheet = false
    }

    func loadQuery(_ query: Query) {
        currentQuery = query
        queryName = query.name
        selectedColumns = Set(query.selectedColumns)
        filterConditions = query.filters
        groupByColumns = query.groupBy
        aggregations = query.aggregations
        sortColumns = query.orderBy
        queryLimit = query.limit

        // Find and select the dataset
        if let dataset = availableDatasets.first(where: { $0.source == query.dataset }) {
            selectedDataset = dataset
        }
    }

    func deleteQuery(_ query: Query) {
        savedQueries.removeAll { $0.id == query.id }
        favoriteQueries.removeAll { $0.id == query.id }
        persistSavedQueries()
    }

    func toggleFavorite(_ query: Query) {
        if let index = savedQueries.firstIndex(where: { $0.id == query.id }) {
            savedQueries[index].isFavorite.toggle()

            if savedQueries[index].isFavorite {
                favoriteQueries.append(savedQueries[index])
            } else {
                favoriteQueries.removeAll { $0.id == query.id }
            }

            persistSavedQueries()
        }
    }

    // MARK: - Export
    func exportResults(format: ExportFormat) async {
        guard let result = queryResult else {
            handleErrorMessage("No query results to export")
            return
        }

        startLoading()

        do {
            let fileURL = try await generateExportFile(result: result, format: format)
            await shareFile(fileURL)
            finishLoading()
        } catch {
            handleError(error)
        }
    }

    private func generateExportFile(result: QueryResult, format: ExportFormat) async throws -> URL {
        let fileName = "query_export_\(Date().timeIntervalSince1970).\(format.fileExtension)"
        let tempDir = FileManager.default.temporaryDirectory
        let fileURL = tempDir.appendingPathComponent(fileName)

        switch format {
        case .csv:
            let csv = generateCSV(from: result)
            try csv.write(to: fileURL, atomically: true, encoding: .utf8)
        case .json:
            let json = try generateJSON(from: result)
            try json.write(to: fileURL, atomically: true, encoding: .utf8)
        case .excel:
            // Would require external library for Excel export
            throw NSError(domain: "DataWorkbench", code: -1, userInfo: [NSLocalizedDescriptionKey: "Excel export not yet implemented"])
        case .pdf:
            // Would require PDF generation
            throw NSError(domain: "DataWorkbench", code: -1, userInfo: [NSLocalizedDescriptionKey: "PDF export not yet implemented"])
        }

        return fileURL
    }

    private func generateCSV(from result: QueryResult) -> String {
        var csv = ""

        // Header row
        let headers = result.columns.map { $0.displayName }
        csv += headers.joined(separator: ",") + "\n"

        // Data rows
        for row in result.rows {
            let values = result.columns.map { column in
                let value = row[column.name]
                return formatValueForCSV(value)
            }
            csv += values.joined(separator: ",") + "\n"
        }

        return csv
    }

    private func generateJSON(from result: QueryResult) throws -> String {
        let encoder = JSONEncoder()
        encoder.outputFormatting = .prettyPrinted
        encoder.dateEncodingStrategy = .iso8601

        let data = try encoder.encode(result)
        return String(data: data, encoding: .utf8) ?? ""
    }

    private func formatValueForCSV(_ value: Any?) -> String {
        guard let value = value else { return "" }

        if let stringValue = value as? String {
            // Escape quotes and wrap in quotes if contains comma
            if stringValue.contains(",") || stringValue.contains("\"") {
                return "\"\(stringValue.replacingOccurrences(of: "\"", with: "\"\""))\""
            }
            return stringValue
        }

        return "\(value)"
    }

    private func shareFile(_ fileURL: URL) async {
        // This would present a share sheet in the UI
        // Implementation depends on the view layer
    }

    // MARK: - Persistence
    private func loadSavedQueries() {
        if let data = UserDefaults.standard.data(forKey: "savedQueries"),
           let queries = try? JSONDecoder().decode([Query].self, from: data) {
            savedQueries = queries
            favoriteQueries = queries.filter { $0.isFavorite }
        }
    }

    private func persistSavedQueries() {
        if let data = try? JSONEncoder().encode(savedQueries) {
            UserDefaults.standard.set(data, forKey: "savedQueries")
        }
    }

    private func loadFavoriteQueries() {
        favoriteQueries = savedQueries.filter { $0.isFavorite }
    }

    // MARK: - Helper Methods
    private func queryCacheKey(for query: Query) -> String {
        // Create a unique key based on query parameters
        let encoder = JSONEncoder()
        if let data = try? encoder.encode(query) {
            return data.base64EncodedString()
        }
        return UUID().uuidString
    }

    private func getAuthToken() async -> String? {
        // Get auth token from AuthenticationManager
        return await AuthenticationManager.shared.getAccessToken()
    }

    private func getEstimatedRowCount(for source: DataSource) -> Int {
        // Mock row counts - in real app would come from API
        switch source {
        case .vehicles: return 150
        case .trips: return 2500
        case .drivers: return 75
        case .maintenance: return 800
        case .costs: return 1200
        case .fuel: return 3000
        case .assets: return 200
        case .incidents: return 45
        }
    }

    private func getColumnsForDataSource(_ source: DataSource) -> [DataColumn] {
        // Mock columns - in real app would come from API
        switch source {
        case .vehicles:
            return [
                DataColumn(name: "id", type: .string, nullable: false),
                DataColumn(name: "name", type: .string),
                DataColumn(name: "make", type: .string),
                DataColumn(name: "model", type: .string),
                DataColumn(name: "year", type: .number),
                DataColumn(name: "vin", type: .string),
                DataColumn(name: "license_plate", type: .string),
                DataColumn(name: "status", type: .string),
                DataColumn(name: "odometer", type: .number),
                DataColumn(name: "acquisition_date", type: .date),
                DataColumn(name: "cost", type: .currency)
            ]
        case .trips:
            return [
                DataColumn(name: "id", type: .string, nullable: false),
                DataColumn(name: "vehicle_id", type: .string),
                DataColumn(name: "driver_id", type: .string),
                DataColumn(name: "start_time", type: .datetime),
                DataColumn(name: "end_time", type: .datetime),
                DataColumn(name: "distance", type: .decimal),
                DataColumn(name: "duration", type: .number),
                DataColumn(name: "purpose", type: .string),
                DataColumn(name: "is_personal", type: .boolean)
            ]
        case .drivers:
            return [
                DataColumn(name: "id", type: .string, nullable: false),
                DataColumn(name: "name", type: .string),
                DataColumn(name: "email", type: .string),
                DataColumn(name: "phone", type: .string),
                DataColumn(name: "license_number", type: .string),
                DataColumn(name: "license_expiry", type: .date),
                DataColumn(name: "status", type: .string),
                DataColumn(name: "total_trips", type: .number)
            ]
        case .maintenance:
            return [
                DataColumn(name: "id", type: .string, nullable: false),
                DataColumn(name: "vehicle_id", type: .string),
                DataColumn(name: "type", type: .string),
                DataColumn(name: "description", type: .string),
                DataColumn(name: "date", type: .date),
                DataColumn(name: "cost", type: .currency),
                DataColumn(name: "odometer", type: .number),
                DataColumn(name: "status", type: .string)
            ]
        case .costs:
            return [
                DataColumn(name: "id", type: .string, nullable: false),
                DataColumn(name: "vehicle_id", type: .string),
                DataColumn(name: "category", type: .string),
                DataColumn(name: "amount", type: .currency),
                DataColumn(name: "date", type: .date),
                DataColumn(name: "description", type: .string)
            ]
        case .fuel:
            return [
                DataColumn(name: "id", type: .string, nullable: false),
                DataColumn(name: "vehicle_id", type: .string),
                DataColumn(name: "date", type: .datetime),
                DataColumn(name: "gallons", type: .decimal),
                DataColumn(name: "cost", type: .currency),
                DataColumn(name: "odometer", type: .number),
                DataColumn(name: "price_per_gallon", type: .currency)
            ]
        case .assets:
            return [
                DataColumn(name: "id", type: .string, nullable: false),
                DataColumn(name: "name", type: .string),
                DataColumn(name: "type", type: .string),
                DataColumn(name: "status", type: .string),
                DataColumn(name: "assigned_to", type: .string),
                DataColumn(name: "purchase_date", type: .date),
                DataColumn(name: "cost", type: .currency)
            ]
        case .incidents:
            return [
                DataColumn(name: "id", type: .string, nullable: false),
                DataColumn(name: "vehicle_id", type: .string),
                DataColumn(name: "driver_id", type: .string),
                DataColumn(name: "date", type: .datetime),
                DataColumn(name: "type", type: .string),
                DataColumn(name: "severity", type: .string),
                DataColumn(name: "description", type: .string),
                DataColumn(name: "cost", type: .currency)
            ]
        }
    }

    // MARK: - RefreshableViewModel Override
    override func refresh() async {
        await loadAvailableDatasets()
    }
}
