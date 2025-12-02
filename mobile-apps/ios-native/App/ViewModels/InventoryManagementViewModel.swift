//
//  InventoryManagementViewModel.swift
//  Fleet Manager
//
//  ViewModel for inventory management with stock tracking, alerts, and reporting
//

import Foundation
import Combine
import SwiftUI

@MainActor
class InventoryManagementViewModel: RefreshableViewModel {
    // MARK: - Published Properties
    @Published var inventoryItems: [InventoryItem] = []
    @Published var filteredItems: [InventoryItem] = []
    @Published var recentMovements: [StockMovement] = []
    @Published var activeAlerts: [InventoryAlert] = []
    @Published var inventorySummary: InventorySummary?

    // Filters
    @Published var selectedCategory: InventoryCategory?
    @Published var selectedLocation: StockLocation?
    @Published var selectedStatus: StockStatus?
    @Published var showLowStockOnly = false
    @Published var showExpiringSoonOnly = false

    // Selected items
    @Published var selectedItem: InventoryItem?
    @Published var selectedMovement: StockMovement?

    // Stats
    @Published var totalInventoryValue: Double = 0
    @Published var lowStockItemsCount: Int = 0
    @Published var outOfStockItemsCount: Int = 0
    @Published var alertsCount: Int = 0

    // MARK: - Private Properties
    private let apiEndpoint = "/api/v1/inventory"
    private let movementsEndpoint = "/api/v1/inventory/movement"
    private let alertsEndpoint = "/api/v1/inventory/alerts"
    private let summaryEndpoint = "/api/v1/inventory/summary"

    // MARK: - Initialization
    override init() {
        super.init()
        setupObservers()
    }

    // MARK: - Setup
    private func setupObservers() {
        // Auto-filter when filters change
        Publishers.CombineLatest4(
            $selectedCategory,
            $selectedLocation,
            $selectedStatus,
            $showLowStockOnly
        )
        .debounce(for: .milliseconds(300), scheduler: RunLoop.main)
        .sink { [weak self] _, _, _, _ in
            self?.applyFilters()
        }
        .store(in: &cancellables)

        // Update stats when items change
        $inventoryItems
            .sink { [weak self] items in
                self?.updateStats(items)
            }
            .store(in: &cancellables)
    }

    // MARK: - Data Loading
    override func refresh() async {
        await loadInventoryData()
    }

    func loadInventoryData() async {
        startRefreshing()

        async let itemsTask = loadInventoryItems()
        async let movementsTask = loadRecentMovements()
        async let alertsTask = loadAlerts()
        async let summaryTask = loadSummary()

        await itemsTask
        await movementsTask
        await alertsTask
        await summaryTask

        finishRefreshing()
    }

    func loadInventoryItems() async {
        do {
            let url = URL(string: APIConfiguration.baseURL + apiEndpoint)!
            var request = URLRequest(url: url)
            request.httpMethod = "GET"

            if let token = await AuthenticationManager.shared.getAccessToken() {
                request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            }

            let (data, _) = try await URLSession.shared.data(for: request)
            let response = try JSONDecoder.fleetDecoder.decode(InventoryResponse.self, from: data)

            self.inventoryItems = response.items
            self.applyFilters()

        } catch {
            handleError(error)
        }
    }

    func loadRecentMovements(limit: Int = 50) async {
        do {
            let url = URL(string: APIConfiguration.baseURL + movementsEndpoint + "?limit=\(limit)")!
            var request = URLRequest(url: url)
            request.httpMethod = "GET"

            if let token = await AuthenticationManager.shared.getAccessToken() {
                request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            }

            let (data, _) = try await URLSession.shared.data(for: request)
            let response = try JSONDecoder.fleetDecoder.decode(StockMovementsResponse.self, from: data)

            self.recentMovements = response.movements

        } catch {
            print("Error loading movements: \(error)")
        }
    }

    func loadAlerts() async {
        do {
            let url = URL(string: APIConfiguration.baseURL + alertsEndpoint)!
            var request = URLRequest(url: url)
            request.httpMethod = "GET"

            if let token = await AuthenticationManager.shared.getAccessToken() {
                request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            }

            let (data, _) = try await URLSession.shared.data(for: request)
            let response = try JSONDecoder.fleetDecoder.decode(InventoryAlertsResponse.self, from: data)

            self.activeAlerts = response.alerts.filter { !$0.isAcknowledged }

        } catch {
            print("Error loading alerts: \(error)")
        }
    }

    func loadSummary() async {
        do {
            let url = URL(string: APIConfiguration.baseURL + summaryEndpoint)!
            var request = URLRequest(url: url)
            request.httpMethod = "GET"

            if let token = await AuthenticationManager.shared.getAccessToken() {
                request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            }

            let (data, _) = try await URLSession.shared.data(for: request)
            let response = try JSONDecoder.fleetDecoder.decode(InventorySummaryResponse.self, from: data)

            self.inventorySummary = response.summary

        } catch {
            print("Error loading summary: \(error)")
        }
    }

    // MARK: - Stock Movement Operations
    func recordStockIn(itemId: String, quantity: Int, location: StockLocation, locationDetail: String?,
                      supplierId: String?, costPerUnit: Double?, notes: String?) async throws {
        let movement = createMovement(
            itemId: itemId,
            type: .stockIn,
            quantity: quantity,
            fromLocation: nil,
            toLocation: location,
            toLocationDetail: locationDetail,
            supplierId: supplierId,
            costPerUnit: costPerUnit,
            notes: notes
        )

        try await submitMovement(movement)
        await loadInventoryData()
    }

    func recordStockOut(itemId: String, quantity: Int, fromLocation: StockLocation, fromLocationDetail: String?,
                       vehicleId: String?, workOrderId: String?, reason: String?, notes: String?) async throws {
        let movement = createMovement(
            itemId: itemId,
            type: .stockOut,
            quantity: quantity,
            fromLocation: fromLocation,
            fromLocationDetail: fromLocationDetail,
            toLocation: nil,
            vehicleId: vehicleId,
            workOrderId: workOrderId,
            reason: reason,
            notes: notes
        )

        try await submitMovement(movement)
        await loadInventoryData()
    }

    func recordTransfer(itemId: String, quantity: Int, fromLocation: StockLocation, fromLocationDetail: String?,
                       toLocation: StockLocation, toLocationDetail: String?, notes: String?) async throws {
        let movement = createMovement(
            itemId: itemId,
            type: .transfer,
            quantity: quantity,
            fromLocation: fromLocation,
            fromLocationDetail: fromLocationDetail,
            toLocation: toLocation,
            toLocationDetail: toLocationDetail,
            notes: notes
        )

        try await submitMovement(movement)
        await loadInventoryData()
    }

    func recordAdjustment(itemId: String, quantity: Int, location: StockLocation, reason: String?, notes: String?) async throws {
        let movement = createMovement(
            itemId: itemId,
            type: .adjustment,
            quantity: quantity,
            fromLocation: location,
            toLocation: location,
            reason: reason,
            notes: notes
        )

        try await submitMovement(movement)
        await loadInventoryData()
    }

    private func createMovement(itemId: String, type: MovementType, quantity: Int,
                               fromLocation: StockLocation?, fromLocationDetail: String? = nil,
                               toLocation: StockLocation?, toLocationDetail: String? = nil,
                               vehicleId: String? = nil, workOrderId: String? = nil,
                               supplierId: String? = nil, costPerUnit: Double? = nil,
                               reason: String? = nil, notes: String? = nil) -> StockMovement {
        guard let item = inventoryItems.first(where: { $0.id == itemId }) else {
            fatalError("Item not found")
        }

        let totalCost: Double? = {
            if let cost = costPerUnit {
                return cost * Double(quantity)
            }
            return nil
        }()

        return StockMovement(
            id: UUID().uuidString,
            itemId: itemId,
            itemSku: item.sku,
            itemName: item.name,
            movementType: type,
            quantity: quantity,
            fromLocation: fromLocation,
            toLocation: toLocation,
            fromLocationDetail: fromLocationDetail,
            toLocationDetail: toLocationDetail,
            vehicleId: vehicleId,
            workOrderId: workOrderId,
            supplierId: supplierId,
            costPerUnit: costPerUnit,
            totalCost: totalCost,
            reason: reason,
            notes: notes,
            performedBy: "Current User", // Should be replaced with actual user
            performedAt: Date()
        )
    }

    private func submitMovement(_ movement: StockMovement) async throws {
        let url = URL(string: APIConfiguration.baseURL + movementsEndpoint)!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        if let token = await AuthenticationManager.shared.getAccessToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        request.httpBody = try JSONEncoder.fleetEncoder.encode(movement)

        let (_, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            throw NSError(domain: "InventoryError", code: -1, userInfo: [NSLocalizedDescriptionKey: "Failed to record movement"])
        }
    }

    // MARK: - Alert Management
    func acknowledgeAlert(_ alertId: String) async throws {
        let url = URL(string: APIConfiguration.baseURL + alertsEndpoint + "/\(alertId)/acknowledge")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"

        if let token = await AuthenticationManager.shared.getAccessToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        let (_, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            throw NSError(domain: "InventoryError", code: -1, userInfo: [NSLocalizedDescriptionKey: "Failed to acknowledge alert"])
        }

        // Remove from active alerts
        activeAlerts.removeAll { $0.id == alertId }
    }

    func checkForAlerts(item: InventoryItem) -> [InventoryAlert] {
        var alerts: [InventoryAlert] = []

        // Low stock alert
        if item.isLowStock {
            alerts.append(createAlert(
                item: item,
                type: .lowStock,
                severity: .medium,
                message: "Stock level (\(item.quantity)) is below minimum threshold (\(item.minLevel))"
            ))
        }

        // Out of stock alert
        if item.quantity == 0 {
            alerts.append(createAlert(
                item: item,
                type: .outOfStock,
                severity: .critical,
                message: "Item is out of stock"
            ))
        }

        // Overstock alert
        if item.isOverStock {
            alerts.append(createAlert(
                item: item,
                type: .overStock,
                severity: .low,
                message: "Stock level (\(item.quantity)) exceeds maximum threshold (\(item.maxLevel))"
            ))
        }

        // Expiring soon alert
        if item.isExpiringSoon {
            alerts.append(createAlert(
                item: item,
                type: .expiringSoon,
                severity: .high,
                message: "Item expires within 30 days"
            ))
        }

        // Expired alert
        if item.isExpired {
            alerts.append(createAlert(
                item: item,
                type: .expired,
                severity: .critical,
                message: "Item has expired"
            ))
        }

        return alerts
    }

    private func createAlert(item: InventoryItem, type: InventoryAlert.AlertType,
                           severity: InventoryAlert.AlertSeverity, message: String) -> InventoryAlert {
        InventoryAlert(
            id: UUID().uuidString,
            itemId: item.id,
            itemSku: item.sku,
            itemName: item.name,
            alertType: type,
            severity: severity,
            currentQuantity: item.quantity,
            threshold: type == .lowStock ? item.minLevel : (type == .overStock ? item.maxLevel : nil),
            expirationDate: item.expirationDate,
            message: message,
            isAcknowledged: false,
            acknowledgedBy: nil,
            acknowledgedAt: nil,
            createdAt: Date()
        )
    }

    // MARK: - Filtering
    func applyFilters() {
        var filtered = inventoryItems

        // Category filter
        if let category = selectedCategory {
            filtered = filtered.filter { $0.category == category }
        }

        // Location filter
        if let location = selectedLocation {
            filtered = filtered.filter { $0.location == location }
        }

        // Status filter
        if let status = selectedStatus {
            filtered = filtered.filter { $0.stockStatus == status }
        }

        // Low stock filter
        if showLowStockOnly {
            filtered = filtered.filter { $0.isLowStock || $0.quantity == 0 }
        }

        // Expiring soon filter
        if showExpiringSoonOnly {
            filtered = filtered.filter { $0.isExpiringSoon || $0.isExpired }
        }

        // Search text filter
        if !searchText.isEmpty {
            filtered = filtered.filter {
                $0.name.localizedCaseInsensitiveContains(searchText) ||
                $0.sku.localizedCaseInsensitiveContains(searchText) ||
                ($0.description?.localizedCaseInsensitiveContains(searchText) ?? false)
            }
        }

        filteredItems = filtered
    }

    func clearFilters() {
        selectedCategory = nil
        selectedLocation = nil
        selectedStatus = nil
        showLowStockOnly = false
        showExpiringSoonOnly = false
        searchText = ""
    }

    // MARK: - Statistics
    private func updateStats(_ items: [InventoryItem]) {
        totalInventoryValue = items.reduce(0) { $0 + $1.totalValue }
        lowStockItemsCount = items.filter { $0.isLowStock }.count
        outOfStockItemsCount = items.filter { $0.quantity == 0 }.count
        alertsCount = activeAlerts.count
    }

    func calculateReorderPoint(item: InventoryItem, leadTimeDays: Int, averageDailyUsage: Double) -> Int {
        // Reorder Point = (Average Daily Usage × Lead Time) + Safety Stock
        let safetyStock = Double(item.minLevel)
        let reorderPoint = (averageDailyUsage * Double(leadTimeDays)) + safetyStock
        return Int(ceil(reorderPoint))
    }

    func calculateEconomicOrderQuantity(annualDemand: Int, orderCost: Double, holdingCost: Double) -> Int {
        // EOQ = sqrt((2 × Annual Demand × Order Cost) / Holding Cost per Unit)
        let eoq = sqrt((2.0 * Double(annualDemand) * orderCost) / holdingCost)
        return Int(ceil(eoq))
    }

    // MARK: - Reporting
    func generateStockValueReport() -> [(category: InventoryCategory, value: Double, percentage: Double)] {
        let categoryValues = Dictionary(grouping: inventoryItems) { $0.category }
            .mapValues { items in
                items.reduce(0.0) { $0 + $1.totalValue }
            }

        let total = totalInventoryValue > 0 ? totalInventoryValue : 1.0

        return categoryValues.map { (category: $0.key, value: $0.value, percentage: ($0.value / total) * 100) }
            .sorted { $0.value > $1.value }
    }

    func generateLocationReport() -> [(location: StockLocation, itemCount: Int, value: Double)] {
        let locationData = Dictionary(grouping: inventoryItems) { $0.location }
            .mapValues { items in
                (count: items.count, value: items.reduce(0.0) { $0 + $1.totalValue })
            }

        return locationData.map { (location: $0.key, itemCount: $0.value.count, value: $0.value.value) }
            .sorted { $0.value > $1.value }
    }

    func generateLowStockReport() -> [InventoryItem] {
        inventoryItems
            .filter { $0.isLowStock || $0.quantity == 0 }
            .sorted { $0.stockStatus.rawValue > $1.stockStatus.rawValue }
    }

    func generateExpirationReport() -> [InventoryItem] {
        inventoryItems
            .filter { $0.isExpiringSoon || $0.isExpired }
            .sorted {
                guard let date1 = $0.expirationDate, let date2 = $1.expirationDate else { return false }
                return date1 < date2
            }
    }

    // MARK: - Barcode Scanning
    func lookupByBarcode(_ barcode: String) -> InventoryItem? {
        inventoryItems.first { $0.barcodeData == barcode }
    }

    func lookupBySKU(_ sku: String) -> InventoryItem? {
        inventoryItems.first { $0.sku.lowercased() == sku.lowercased() }
    }
}

// MARK: - JSONDecoder Extension
extension JSONDecoder {
    static var fleetDecoder: JSONDecoder {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        return decoder
    }
}

// MARK: - JSONEncoder Extension
extension JSONEncoder {
    static var fleetEncoder: JSONEncoder {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        encoder.keyEncodingStrategy = .convertToSnakeCase
        return encoder
    }
}
