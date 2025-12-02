//
//  Inventory.swift
//  Fleet Manager
//
//  Complete inventory management models for stock tracking, movements, and alerts
//

import Foundation

// MARK: - Inventory Category
enum InventoryCategory: String, Codable, CaseIterable {
    case parts = "Parts"
    case fluids = "Fluids"
    case tires = "Tires"
    case tools = "Tools"
    case safety = "Safety Equipment"
    case cleaning = "Cleaning Supplies"
    case electronics = "Electronics"
    case filters = "Filters"
    case batteries = "Batteries"
    case other = "Other"

    var icon: String {
        switch self {
        case .parts: return "gearshape.fill"
        case .fluids: return "drop.fill"
        case .tires: return "circle.grid.cross.fill"
        case .tools: return "wrench.and.screwdriver.fill"
        case .safety: return "shield.checkered"
        case .cleaning: return "bubbles.and.sparkles.fill"
        case .electronics: return "bolt.fill"
        case .filters: return "air.purifier.fill"
        case .batteries: return "battery.100.bolt"
        case .other: return "cube.box.fill"
        }
    }

    var color: String {
        switch self {
        case .parts: return "blue"
        case .fluids: return "cyan"
        case .tires: return "brown"
        case .tools: return "orange"
        case .safety: return "red"
        case .cleaning: return "green"
        case .electronics: return "yellow"
        case .filters: return "gray"
        case .batteries: return "purple"
        case .other: return "indigo"
        }
    }
}

// MARK: - Stock Location
enum StockLocation: String, Codable, CaseIterable {
    case warehouse = "Warehouse"
    case vehicle = "Vehicle"
    case shop = "Shop"
    case mobileUnit = "Mobile Unit"
    case supplier = "Supplier"
    case inTransit = "In Transit"

    var icon: String {
        switch self {
        case .warehouse: return "building.2.fill"
        case .vehicle: return "car.fill"
        case .shop: return "wrench.and.screwdriver.fill"
        case .mobileUnit: return "truck.box.fill"
        case .supplier: return "shippingbox.fill"
        case .inTransit: return "arrow.left.arrow.right"
        }
    }
}

// MARK: - Inventory Item
struct InventoryItem: Codable, Identifiable, Equatable {
    let id: String
    let sku: String
    let name: String
    let description: String?
    let category: InventoryCategory
    var quantity: Int
    let location: StockLocation
    let locationDetail: String? // Specific bin, shelf, or vehicle ID
    let minLevel: Int
    let maxLevel: Int
    let reorderPoint: Int
    let reorderQuantity: Int
    let unitCost: Double
    let unitOfMeasure: String // Each, Box, Gallon, Liter, etc.
    let supplier: SupplierInfo?
    let expirationDate: Date?
    let barcodeData: String?
    let imageUrl: String?
    let createdBy: String
    let createdAt: Date
    var updatedAt: Date

    // Computed properties
    var totalValue: Double {
        Double(quantity) * unitCost
    }

    var isLowStock: Bool {
        quantity <= minLevel
    }

    var isOverStock: Bool {
        quantity >= maxLevel
    }

    var needsReorder: Bool {
        quantity <= reorderPoint
    }

    var isExpiringSoon: Bool {
        guard let expirationDate = expirationDate else { return false }
        let daysUntilExpiration = Calendar.current.dateComponents([.day], from: Date(), to: expirationDate).day ?? 0
        return daysUntilExpiration <= 30 && daysUntilExpiration > 0
    }

    var isExpired: Bool {
        guard let expirationDate = expirationDate else { return false }
        return expirationDate < Date()
    }

    var stockStatus: StockStatus {
        if isExpired { return .expired }
        if quantity == 0 { return .outOfStock }
        if isLowStock { return .lowStock }
        if isOverStock { return .overStock }
        if needsReorder { return .reorderNeeded }
        return .normal
    }

    var formattedUnitCost: String {
        String(format: "$%.2f", unitCost)
    }

    var formattedTotalValue: String {
        String(format: "$%.2f", totalValue)
    }

    enum CodingKeys: String, CodingKey {
        case id, sku, name, description, category, quantity, location
        case locationDetail = "location_detail"
        case minLevel = "min_level"
        case maxLevel = "max_level"
        case reorderPoint = "reorder_point"
        case reorderQuantity = "reorder_quantity"
        case unitCost = "unit_cost"
        case unitOfMeasure = "unit_of_measure"
        case supplier
        case expirationDate = "expiration_date"
        case barcodeData = "barcode_data"
        case imageUrl = "image_url"
        case createdBy = "created_by"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }

    static var sample: InventoryItem {
        InventoryItem(
            id: UUID().uuidString,
            sku: "OIL-5W30-001",
            name: "5W-30 Motor Oil",
            description: "Synthetic motor oil - 5 quart bottle",
            category: .fluids,
            quantity: 48,
            location: .warehouse,
            locationDetail: "Aisle 3, Shelf B",
            minLevel: 20,
            maxLevel: 100,
            reorderPoint: 25,
            reorderQuantity: 50,
            unitCost: 24.99,
            unitOfMeasure: "Bottle (5qt)",
            supplier: SupplierInfo.sample,
            expirationDate: nil,
            barcodeData: "123456789012",
            imageUrl: nil,
            createdBy: "System",
            createdAt: Date(),
            updatedAt: Date()
        )
    }
}

// MARK: - Stock Status
enum StockStatus: String, Codable {
    case normal = "Normal"
    case lowStock = "Low Stock"
    case outOfStock = "Out of Stock"
    case overStock = "Overstock"
    case reorderNeeded = "Reorder Needed"
    case expired = "Expired"

    var color: String {
        switch self {
        case .normal: return "green"
        case .lowStock: return "yellow"
        case .outOfStock: return "red"
        case .overStock: return "orange"
        case .reorderNeeded: return "blue"
        case .expired: return "red"
        }
    }

    var icon: String {
        switch self {
        case .normal: return "checkmark.circle.fill"
        case .lowStock: return "exclamationmark.triangle.fill"
        case .outOfStock: return "xmark.circle.fill"
        case .overStock: return "arrow.up.circle.fill"
        case .reorderNeeded: return "cart.fill.badge.plus"
        case .expired: return "clock.badge.exclamationmark.fill"
        }
    }
}

// MARK: - Supplier Info
struct SupplierInfo: Codable, Identifiable, Equatable {
    let id: String
    let name: String
    let contactName: String?
    let email: String?
    let phone: String?
    let address: String?
    let leadTimeDays: Int
    let minimumOrderQuantity: Int?
    let accountNumber: String?

    enum CodingKeys: String, CodingKey {
        case id, name
        case contactName = "contact_name"
        case email, phone, address
        case leadTimeDays = "lead_time_days"
        case minimumOrderQuantity = "minimum_order_quantity"
        case accountNumber = "account_number"
    }

    static var sample: SupplierInfo {
        SupplierInfo(
            id: UUID().uuidString,
            name: "Auto Parts Supply Co.",
            contactName: "John Smith",
            email: "john@autopartssupply.com",
            phone: "(555) 123-4567",
            address: "123 Industrial Pkwy, City, ST 12345",
            leadTimeDays: 3,
            minimumOrderQuantity: 10,
            accountNumber: "ACC-12345"
        )
    }
}

// MARK: - Stock Movement Type
enum MovementType: String, Codable, CaseIterable {
    case stockIn = "Stock In"
    case stockOut = "Stock Out"
    case transfer = "Transfer"
    case adjustment = "Adjustment"
    case returnToSupplier = "Return to Supplier"
    case damaged = "Damaged/Write-off"

    var icon: String {
        switch self {
        case .stockIn: return "arrow.down.circle.fill"
        case .stockOut: return "arrow.up.circle.fill"
        case .transfer: return "arrow.left.arrow.right.circle.fill"
        case .adjustment: return "pencil.circle.fill"
        case .returnToSupplier: return "return.left"
        case .damaged: return "exclamationmark.triangle.fill"
        }
    }

    var color: String {
        switch self {
        case .stockIn: return "green"
        case .stockOut: return "blue"
        case .transfer: return "purple"
        case .adjustment: return "orange"
        case .returnToSupplier: return "yellow"
        case .damaged: return "red"
        }
    }
}

// MARK: - Stock Movement
struct StockMovement: Codable, Identifiable, Equatable {
    let id: String
    let itemId: String
    let itemSku: String
    let itemName: String
    let movementType: MovementType
    let quantity: Int
    let fromLocation: StockLocation?
    let toLocation: StockLocation?
    let fromLocationDetail: String?
    let toLocationDetail: String?
    let vehicleId: String?
    let workOrderId: String?
    let supplierId: String?
    let costPerUnit: Double?
    let totalCost: Double?
    let reason: String?
    let notes: String?
    let performedBy: String
    let performedAt: Date

    var formattedQuantity: String {
        switch movementType {
        case .stockIn, .transfer:
            return "+\(quantity)"
        case .stockOut, .damaged, .returnToSupplier:
            return "-\(quantity)"
        case .adjustment:
            return quantity >= 0 ? "+\(quantity)" : "\(quantity)"
        }
    }

    var formattedTotalCost: String? {
        guard let totalCost = totalCost else { return nil }
        return String(format: "$%.2f", totalCost)
    }

    enum CodingKeys: String, CodingKey {
        case id
        case itemId = "item_id"
        case itemSku = "item_sku"
        case itemName = "item_name"
        case movementType = "movement_type"
        case quantity
        case fromLocation = "from_location"
        case toLocation = "to_location"
        case fromLocationDetail = "from_location_detail"
        case toLocationDetail = "to_location_detail"
        case vehicleId = "vehicle_id"
        case workOrderId = "work_order_id"
        case supplierId = "supplier_id"
        case costPerUnit = "cost_per_unit"
        case totalCost = "total_cost"
        case reason, notes
        case performedBy = "performed_by"
        case performedAt = "performed_at"
    }

    static var sample: StockMovement {
        StockMovement(
            id: UUID().uuidString,
            itemId: "ITEM-001",
            itemSku: "OIL-5W30-001",
            itemName: "5W-30 Motor Oil",
            movementType: .stockOut,
            quantity: 2,
            fromLocation: .warehouse,
            toLocation: .vehicle,
            fromLocationDetail: "Aisle 3, Shelf B",
            toLocationDetail: "Vehicle V-12345",
            vehicleId: "VEH-001",
            workOrderId: "WO-2025-001",
            supplierId: nil,
            costPerUnit: 24.99,
            totalCost: 49.98,
            reason: "Oil change",
            notes: "Used for routine maintenance",
            performedBy: "John Mechanic",
            performedAt: Date()
        )
    }
}

// MARK: - Inventory Alert
struct InventoryAlert: Codable, Identifiable, Equatable {
    let id: String
    let itemId: String
    let itemSku: String
    let itemName: String
    let alertType: AlertType
    let severity: AlertSeverity
    let currentQuantity: Int
    let threshold: Int?
    let expirationDate: Date?
    let message: String
    let isAcknowledged: Bool
    var acknowledgedBy: String?
    var acknowledgedAt: Date?
    let createdAt: Date

    enum AlertType: String, Codable {
        case lowStock = "Low Stock"
        case outOfStock = "Out of Stock"
        case overStock = "Overstock"
        case expiringSoon = "Expiring Soon"
        case expired = "Expired"
        case reorderNeeded = "Reorder Needed"
    }

    enum AlertSeverity: String, Codable {
        case low = "Low"
        case medium = "Medium"
        case high = "High"
        case critical = "Critical"

        var color: String {
            switch self {
            case .low: return "blue"
            case .medium: return "yellow"
            case .high: return "orange"
            case .critical: return "red"
            }
        }
    }

    enum CodingKeys: String, CodingKey {
        case id
        case itemId = "item_id"
        case itemSku = "item_sku"
        case itemName = "item_name"
        case alertType = "alert_type"
        case severity
        case currentQuantity = "current_quantity"
        case threshold
        case expirationDate = "expiration_date"
        case message
        case isAcknowledged = "is_acknowledged"
        case acknowledgedBy = "acknowledged_by"
        case acknowledgedAt = "acknowledged_at"
        case createdAt = "created_at"
    }

    static var sample: InventoryAlert {
        InventoryAlert(
            id: UUID().uuidString,
            itemId: "ITEM-001",
            itemSku: "OIL-5W30-001",
            itemName: "5W-30 Motor Oil",
            alertType: .lowStock,
            severity: .medium,
            currentQuantity: 18,
            threshold: 20,
            expirationDate: nil,
            message: "Stock level is below minimum threshold. Reorder recommended.",
            isAcknowledged: false,
            acknowledgedBy: nil,
            acknowledgedAt: nil,
            createdAt: Date()
        )
    }
}

// MARK: - Inventory Summary
struct InventorySummary: Codable {
    let totalItems: Int
    let totalValue: Double
    let lowStockCount: Int
    let outOfStockCount: Int
    let expiringSoonCount: Int
    let expiredCount: Int
    let categoryBreakdown: [CategorySummary]
    let locationBreakdown: [LocationSummary]

    var formattedTotalValue: String {
        String(format: "$%.2f", totalValue)
    }

    enum CodingKeys: String, CodingKey {
        case totalItems = "total_items"
        case totalValue = "total_value"
        case lowStockCount = "low_stock_count"
        case outOfStockCount = "out_of_stock_count"
        case expiringSoonCount = "expiring_soon_count"
        case expiredCount = "expired_count"
        case categoryBreakdown = "category_breakdown"
        case locationBreakdown = "location_breakdown"
    }
}

// MARK: - Category Summary
struct CategorySummary: Codable, Identifiable {
    let id = UUID()
    let category: InventoryCategory
    let itemCount: Int
    let totalValue: Double
    let quantity: Int

    var formattedValue: String {
        String(format: "$%.2f", totalValue)
    }

    enum CodingKeys: String, CodingKey {
        case category
        case itemCount = "item_count"
        case totalValue = "total_value"
        case quantity
    }
}

// MARK: - Location Summary
struct LocationSummary: Codable, Identifiable {
    let id = UUID()
    let location: StockLocation
    let itemCount: Int
    let totalValue: Double

    var formattedValue: String {
        String(format: "$%.2f", totalValue)
    }

    enum CodingKeys: String, CodingKey {
        case location
        case itemCount = "item_count"
        case totalValue = "total_value"
    }
}

// MARK: - Inventory Turnover
struct InventoryTurnover: Codable, Identifiable {
    let id: String
    let itemId: String
    let itemSku: String
    let itemName: String
    let period: String
    let beginningInventory: Int
    let endingInventory: Int
    let quantitySold: Int
    let turnoverRate: Double
    let averageDaysToSell: Double

    enum CodingKeys: String, CodingKey {
        case id
        case itemId = "item_id"
        case itemSku = "item_sku"
        case itemName = "item_name"
        case period
        case beginningInventory = "beginning_inventory"
        case endingInventory = "ending_inventory"
        case quantitySold = "quantity_sold"
        case turnoverRate = "turnover_rate"
        case averageDaysToSell = "average_days_to_sell"
    }
}

// MARK: - Physical Count
struct PhysicalCount: Codable, Identifiable, Equatable {
    let id: String
    let itemId: String
    let itemSku: String
    let itemName: String
    let location: StockLocation
    let systemQuantity: Int
    let countedQuantity: Int
    let variance: Int
    let countedBy: String
    let countedAt: Date
    let notes: String?
    var isReconciled: Bool
    var reconciledBy: String?
    var reconciledAt: Date?

    var variancePercentage: Double {
        guard systemQuantity > 0 else { return 0 }
        return (Double(variance) / Double(systemQuantity)) * 100
    }

    enum CodingKeys: String, CodingKey {
        case id
        case itemId = "item_id"
        case itemSku = "item_sku"
        case itemName = "item_name"
        case location
        case systemQuantity = "system_quantity"
        case countedQuantity = "counted_quantity"
        case variance, notes
        case countedBy = "counted_by"
        case countedAt = "counted_at"
        case isReconciled = "is_reconciled"
        case reconciledBy = "reconciled_by"
        case reconciledAt = "reconciled_at"
    }
}

// MARK: - API Response Models
struct InventoryResponse: Codable {
    let items: [InventoryItem]
    let total: Int
    let page: Int?
    let limit: Int?
}

struct InventorySummaryResponse: Codable {
    let summary: InventorySummary
}

struct StockMovementsResponse: Codable {
    let movements: [StockMovement]
    let total: Int
    let page: Int?
    let limit: Int?
}

struct InventoryAlertsResponse: Codable {
    let alerts: [InventoryAlert]
    let total: Int
}

struct InventoryTurnoverResponse: Codable {
    let turnover: [InventoryTurnover]
    let period: String
}

struct PhysicalCountsResponse: Codable {
    let counts: [PhysicalCount]
    let total: Int
}
