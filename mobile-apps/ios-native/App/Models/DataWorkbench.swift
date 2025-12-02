//
//  DataWorkbench.swift
//  Fleet Manager
//
//  Data Workbench models for custom queries and data analysis
//

import Foundation

// MARK: - Data Source Types
enum DataSource: String, Codable, CaseIterable {
    case vehicles = "vehicles"
    case trips = "trips"
    case drivers = "drivers"
    case maintenance = "maintenance"
    case costs = "costs"
    case fuel = "fuel"
    case assets = "assets"
    case incidents = "incidents"

    var displayName: String {
        switch self {
        case .vehicles: return "Vehicles"
        case .trips: return "Trips"
        case .drivers: return "Drivers"
        case .maintenance: return "Maintenance"
        case .costs: return "Costs"
        case .fuel: return "Fuel"
        case .assets: return "Assets"
        case .incidents: return "Incidents"
        }
    }

    var icon: String {
        switch self {
        case .vehicles: return "car.2.fill"
        case .trips: return "location.fill"
        case .drivers: return "person.3.fill"
        case .maintenance: return "wrench.and.screwdriver.fill"
        case .costs: return "dollarsign.circle.fill"
        case .fuel: return "fuelpump.fill"
        case .assets: return "cube.box.fill"
        case .incidents: return "exclamationmark.triangle.fill"
        }
    }
}

// MARK: - Dataset
struct Dataset: Identifiable, Codable {
    let id: String
    let name: String
    let source: DataSource
    let rowCount: Int
    let columns: [DataColumn]
    let lastUpdated: Date
    let description: String?

    init(id: String = UUID().uuidString,
         name: String,
         source: DataSource,
         rowCount: Int,
         columns: [DataColumn],
         lastUpdated: Date = Date(),
         description: String? = nil) {
        self.id = id
        self.name = name
        self.source = source
        self.rowCount = rowCount
        self.columns = columns
        self.lastUpdated = lastUpdated
        self.description = description
    }
}

// MARK: - Data Column
struct DataColumn: Identifiable, Codable, Hashable {
    let id: String
    let name: String
    let displayName: String
    let type: ColumnType
    let nullable: Bool
    let description: String?

    init(id: String = UUID().uuidString,
         name: String,
         displayName: String? = nil,
         type: ColumnType,
         nullable: Bool = true,
         description: String? = nil) {
        self.id = id
        self.name = name
        self.displayName = displayName ?? name.replacingOccurrences(of: "_", with: " ").capitalized
        self.type = type
        self.nullable = nullable
        self.description = description
    }
}

// MARK: - Column Type
enum ColumnType: String, Codable, CaseIterable {
    case string = "string"
    case number = "number"
    case decimal = "decimal"
    case date = "date"
    case datetime = "datetime"
    case boolean = "boolean"
    case currency = "currency"

    var icon: String {
        switch self {
        case .string: return "textformat"
        case .number, .decimal: return "number"
        case .date, .datetime: return "calendar"
        case .boolean: return "checkmark.circle"
        case .currency: return "dollarsign.circle"
        }
    }

    var displayName: String {
        switch self {
        case .string: return "Text"
        case .number: return "Number"
        case .decimal: return "Decimal"
        case .date: return "Date"
        case .datetime: return "Date & Time"
        case .boolean: return "Yes/No"
        case .currency: return "Currency"
        }
    }
}

// MARK: - Data Transformation
struct DataTransformation: Identifiable, Codable {
    let id: String
    let type: TransformationType
    let config: TransformationConfig

    init(id: String = UUID().uuidString,
         type: TransformationType,
         config: TransformationConfig) {
        self.id = id
        self.type = type
        self.config = config
    }
}

// MARK: - Transformation Type
enum TransformationType: String, Codable {
    case filter = "filter"
    case aggregate = "aggregate"
    case join = "join"
    case pivot = "pivot"
    case sort = "sort"
    case groupBy = "group_by"

    var displayName: String {
        switch self {
        case .filter: return "Filter"
        case .aggregate: return "Aggregate"
        case .join: return "Join"
        case .pivot: return "Pivot"
        case .sort: return "Sort"
        case .groupBy: return "Group By"
        }
    }

    var icon: String {
        switch self {
        case .filter: return "line.3.horizontal.decrease.circle"
        case .aggregate: return "function"
        case .join: return "arrow.triangle.merge"
        case .pivot: return "table.badge.more"
        case .sort: return "arrow.up.arrow.down"
        case .groupBy: return "square.3.layers.3d"
        }
    }
}

// MARK: - Transformation Config
struct TransformationConfig: Codable {
    var filterConditions: [FilterCondition]?
    var aggregations: [Aggregation]?
    var joinConfig: JoinConfig?
    var pivotConfig: PivotConfig?
    var sortColumns: [SortColumn]?
    var groupByColumns: [String]?

    init(filterConditions: [FilterCondition]? = nil,
         aggregations: [Aggregation]? = nil,
         joinConfig: JoinConfig? = nil,
         pivotConfig: PivotConfig? = nil,
         sortColumns: [SortColumn]? = nil,
         groupByColumns: [String]? = nil) {
        self.filterConditions = filterConditions
        self.aggregations = aggregations
        self.joinConfig = joinConfig
        self.pivotConfig = pivotConfig
        self.sortColumns = sortColumns
        self.groupByColumns = groupByColumns
    }
}

// MARK: - Filter Condition
struct FilterCondition: Identifiable, Codable {
    let id: String
    let column: String
    let operator: FilterOperator
    let value: FilterValue
    let logicalOperator: LogicalOperator

    init(id: String = UUID().uuidString,
         column: String,
         operator: FilterOperator,
         value: FilterValue,
         logicalOperator: LogicalOperator = .and) {
        self.id = id
        self.column = column
        self.operator = `operator`
        self.value = value
        self.logicalOperator = logicalOperator
    }
}

// MARK: - Filter Operator
enum FilterOperator: String, Codable, CaseIterable {
    case equals = "eq"
    case notEquals = "ne"
    case contains = "contains"
    case notContains = "not_contains"
    case startsWith = "starts_with"
    case endsWith = "ends_with"
    case greaterThan = "gt"
    case greaterThanOrEqual = "gte"
    case lessThan = "lt"
    case lessThanOrEqual = "lte"
    case between = "between"
    case isNull = "is_null"
    case isNotNull = "is_not_null"
    case inList = "in"
    case notInList = "not_in"

    var displayName: String {
        switch self {
        case .equals: return "Equals"
        case .notEquals: return "Not Equals"
        case .contains: return "Contains"
        case .notContains: return "Does Not Contain"
        case .startsWith: return "Starts With"
        case .endsWith: return "Ends With"
        case .greaterThan: return "Greater Than"
        case .greaterThanOrEqual: return "Greater Than or Equal"
        case .lessThan: return "Less Than"
        case .lessThanOrEqual: return "Less Than or Equal"
        case .between: return "Between"
        case .isNull: return "Is Null"
        case .isNotNull: return "Is Not Null"
        case .inList: return "In List"
        case .notInList: return "Not In List"
        }
    }

    var requiresValue: Bool {
        switch self {
        case .isNull, .isNotNull:
            return false
        default:
            return true
        }
    }
}

// MARK: - Logical Operator
enum LogicalOperator: String, Codable {
    case and = "AND"
    case or = "OR"

    var displayName: String {
        return rawValue
    }
}

// MARK: - Filter Value
enum FilterValue: Codable {
    case string(String)
    case number(Double)
    case date(Date)
    case boolean(Bool)
    case list([String])
    case range(min: Double, max: Double)
    case none

    var stringValue: String? {
        if case .string(let value) = self { return value }
        return nil
    }

    var numberValue: Double? {
        if case .number(let value) = self { return value }
        return nil
    }

    var dateValue: Date? {
        if case .date(let value) = self { return value }
        return nil
    }

    var booleanValue: Bool? {
        if case .boolean(let value) = self { return value }
        return nil
    }

    var listValue: [String]? {
        if case .list(let value) = self { return value }
        return nil
    }
}

// MARK: - Aggregation
struct Aggregation: Identifiable, Codable {
    let id: String
    let column: String
    let function: AggregationFunction
    let alias: String?

    init(id: String = UUID().uuidString,
         column: String,
         function: AggregationFunction,
         alias: String? = nil) {
        self.id = id
        self.column = column
        self.function = function
        self.alias = alias ?? "\(function.rawValue)_\(column)"
    }
}

// MARK: - Aggregation Function
enum AggregationFunction: String, Codable, CaseIterable {
    case count = "count"
    case sum = "sum"
    case avg = "avg"
    case min = "min"
    case max = "max"
    case countDistinct = "count_distinct"

    var displayName: String {
        switch self {
        case .count: return "Count"
        case .sum: return "Sum"
        case .avg: return "Average"
        case .min: return "Minimum"
        case .max: return "Maximum"
        case .countDistinct: return "Count Distinct"
        }
    }

    var icon: String {
        switch self {
        case .count: return "number"
        case .sum: return "plus.forwardslash.minus"
        case .avg: return "divide"
        case .min: return "arrow.down.to.line"
        case .max: return "arrow.up.to.line"
        case .countDistinct: return "number.circle"
        }
    }
}

// MARK: - Join Config
struct JoinConfig: Codable {
    let joinType: JoinType
    let rightDataset: String
    let leftColumn: String
    let rightColumn: String
}

enum JoinType: String, Codable {
    case inner = "inner"
    case left = "left"
    case right = "right"
    case full = "full"
}

// MARK: - Pivot Config
struct PivotConfig: Codable {
    let rowColumns: [String]
    let columnColumn: String
    let valueColumn: String
    let aggregation: AggregationFunction
}

// MARK: - Sort Column
struct SortColumn: Identifiable, Codable {
    let id: String
    let column: String
    let direction: SortDirection

    init(id: String = UUID().uuidString, column: String, direction: SortDirection) {
        self.id = id
        self.column = column
        self.direction = direction
    }
}

// MARK: - Sort Direction
enum SortDirection: String, Codable {
    case ascending = "asc"
    case descending = "desc"

    var displayName: String {
        switch self {
        case .ascending: return "Ascending"
        case .descending: return "Descending"
        }
    }

    var icon: String {
        switch self {
        case .ascending: return "arrow.up"
        case .descending: return "arrow.down"
        }
    }
}

// MARK: - Query
struct Query: Identifiable, Codable {
    let id: String
    var name: String
    let dataset: DataSource
    var selectedColumns: [String]
    var filters: [FilterCondition]
    var groupBy: [String]
    var aggregations: [Aggregation]
    var orderBy: [SortColumn]
    var limit: Int
    var savedAt: Date?
    var isFavorite: Bool

    init(id: String = UUID().uuidString,
         name: String,
         dataset: DataSource,
         selectedColumns: [String] = [],
         filters: [FilterCondition] = [],
         groupBy: [String] = [],
         aggregations: [Aggregation] = [],
         orderBy: [SortColumn] = [],
         limit: Int = 100,
         savedAt: Date? = nil,
         isFavorite: Bool = false) {
        self.id = id
        self.name = name
        self.dataset = dataset
        self.selectedColumns = selectedColumns
        self.filters = filters
        self.groupBy = groupBy
        self.aggregations = aggregations
        self.orderBy = orderBy
        self.limit = limit
        self.savedAt = savedAt
        self.isFavorite = isFavorite
    }
}

// MARK: - Query Result
struct QueryResult: Codable {
    let rows: [[String: Any]]
    let columns: [DataColumn]
    let metadata: QueryMetadata

    enum CodingKeys: String, CodingKey {
        case rows, columns, metadata
    }

    init(rows: [[String: Any]], columns: [DataColumn], metadata: QueryMetadata) {
        self.rows = rows
        self.columns = columns
        self.metadata = metadata
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        columns = try container.decode([DataColumn].self, forKey: .columns)
        metadata = try container.decode(QueryMetadata.self, forKey: .metadata)

        // Decode rows as an array of dictionaries
        let rowsArray = try container.decode([[String: AnyCodable]].self, forKey: .rows)
        rows = rowsArray.map { row in
            row.mapValues { $0.value }
        }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(columns, forKey: .columns)
        try container.encode(metadata, forKey: .metadata)

        // Encode rows as an array of dictionaries with AnyCodable
        let rowsArray = rows.map { row in
            row.mapValues { AnyCodable($0) }
        }
        try container.encode(rowsArray, forKey: .rows)
    }
}

// MARK: - Query Metadata
struct QueryMetadata: Codable {
    let executionTime: Double // milliseconds
    let rowCount: Int
    let totalCount: Int
    let queryText: String?
}

// MARK: - Export Format
enum ExportFormat: String, CaseIterable {
    case csv = "csv"
    case excel = "xlsx"
    case json = "json"
    case pdf = "pdf"

    var displayName: String {
        switch self {
        case .csv: return "CSV"
        case .excel: return "Excel"
        case .json: return "JSON"
        case .pdf: return "PDF"
        }
    }

    var icon: String {
        switch self {
        case .csv: return "doc.text"
        case .excel: return "tablecells"
        case .json: return "curlybraces"
        case .pdf: return "doc.richtext"
        }
    }

    var fileExtension: String {
        return rawValue
    }
}

// MARK: - AnyCodable Helper
struct AnyCodable: Codable {
    let value: Any

    init(_ value: Any) {
        self.value = value
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()

        if let stringValue = try? container.decode(String.self) {
            value = stringValue
        } else if let intValue = try? container.decode(Int.self) {
            value = intValue
        } else if let doubleValue = try? container.decode(Double.self) {
            value = doubleValue
        } else if let boolValue = try? container.decode(Bool.self) {
            value = boolValue
        } else if container.decodeNil() {
            value = NSNull()
        } else {
            throw DecodingError.dataCorruptedError(in: container, debugDescription: "Unsupported type")
        }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()

        if let stringValue = value as? String {
            try container.encode(stringValue)
        } else if let intValue = value as? Int {
            try container.encode(intValue)
        } else if let doubleValue = value as? Double {
            try container.encode(doubleValue)
        } else if let boolValue = value as? Bool {
            try container.encode(boolValue)
        } else if value is NSNull {
            try container.encodeNil()
        } else {
            throw EncodingError.invalidValue(value, EncodingError.Context(codingPath: encoder.codingPath, debugDescription: "Unsupported type"))
        }
    }
}
