import Foundation
import Combine
import SwiftUI

@MainActor
class FuelViewModel: RefreshableViewModel {
    // MARK: - Published Properties
    @Published var purchases: [FuelPurchase] = []
    @Published var fuelCards: [FuelCard] = []
    @Published var analytics: FuelAnalytics?
    @Published var selectedVehicleId: String?
    @Published var selectedDateRange: DateRange = .last30Days
    @Published var showingAddPurchase = false
    @Published var showingReceiptCamera = false
    @Published var selectedPurchase: FuelPurchase?
    @Published var capturedReceiptImage: UIImage?

    // Filter properties
    @Published var filterByVehicle: String?
    @Published var filterByDriver: String?
    @Published var sortOption: SortOption = .dateDescending

    // MARK: - Computed Properties
    var filteredPurchases: [FuelPurchase] {
        var filtered = purchases

        if let vehicleFilter = filterByVehicle {
            filtered = filtered.filter { $0.vehicleId == vehicleFilter }
        }

        if let driverFilter = filterByDriver {
            filtered = filtered.filter { $0.driverName == driverFilter }
        }

        if !searchText.isEmpty {
            filtered = filtered.filter {
                $0.vehicleNumber.localizedCaseInsensitiveContains(searchText) ||
                $0.driverName.localizedCaseInsensitiveContains(searchText) ||
                $0.location.name.localizedCaseInsensitiveContains(searchText)
            }
        }

        // Apply sorting
        return sortPurchases(filtered, by: sortOption)
    }

    var totalSpending: Double {
        filteredPurchases.reduce(0) { $0 + $1.totalCost }
    }

    var totalGallons: Double {
        filteredPurchases.reduce(0) { $0 + $1.quantity }
    }

    var averagePricePerGallon: Double {
        guard totalGallons > 0 else { return 0 }
        return totalSpending / totalGallons
    }

    var activeCards: [FuelCard] {
        fuelCards.filter { $0.isActive && !$0.isExpired }
    }

    var expiringCards: [FuelCard] {
        fuelCards.filter { $0.isExpiringSoon }
    }

    var overLimitCards: [FuelCard] {
        fuelCards.filter { $0.isOverLimit }
    }

    // MARK: - Initialization
    override init() {
        super.init()
        Task {
            await loadInitialData()
        }
    }

    // MARK: - Data Loading
    func loadInitialData() async {
        await refresh()
    }

    override func refresh() async {
        startRefreshing()

        await withTaskGroup(of: Void.self) { group in
            group.addTask { await self.loadPurchases() }
            group.addTask { await self.loadFuelCards() }
            group.addTask { await self.loadAnalytics() }
        }

        finishRefreshing()
    }

    func loadPurchases() async {
        do {
            startLoading()

            // Simulate API call - replace with actual API service
            try await Task.sleep(nanoseconds: 500_000_000)

            // Mock data - replace with actual API response
            let mockPurchases = generateMockPurchases()

            await MainActor.run {
                self.purchases = mockPurchases
                self.finishLoading()
            }
        } catch {
            handleError(error)
        }
    }

    func loadFuelCards() async {
        do {
            // Simulate API call
            try await Task.sleep(nanoseconds: 300_000_000)

            let mockCards = generateMockFuelCards()

            await MainActor.run {
                self.fuelCards = mockCards
            }
        } catch {
            print("Error loading fuel cards: \(error)")
        }
    }

    func loadAnalytics() async {
        do {
            // Simulate API call
            try await Task.sleep(nanoseconds: 400_000_000)

            let mockAnalytics = generateMockAnalytics()

            await MainActor.run {
                self.analytics = mockAnalytics
            }
        } catch {
            print("Error loading analytics: \(error)")
        }
    }

    // MARK: - CRUD Operations
    func addPurchase(_ purchase: FuelPurchase) async {
        do {
            startLoading()

            // Simulate API call
            try await Task.sleep(nanoseconds: 500_000_000)

            await MainActor.run {
                self.purchases.insert(purchase, at: 0)
                self.finishLoading()
                self.showingAddPurchase = false
                ModernTheme.Haptics.success()
            }

            // Reload analytics after adding purchase
            await loadAnalytics()
        } catch {
            handleError(error)
        }
    }

    func updatePurchase(_ purchase: FuelPurchase) async {
        do {
            startLoading()

            // Simulate API call
            try await Task.sleep(nanoseconds: 300_000_000)

            await MainActor.run {
                if let index = self.purchases.firstIndex(where: { $0.id == purchase.id }) {
                    self.purchases[index] = purchase
                }
                self.finishLoading()
                ModernTheme.Haptics.success()
            }
        } catch {
            handleError(error)
        }
    }

    func deletePurchase(_ purchase: FuelPurchase) async {
        do {
            startLoading()

            // Simulate API call
            try await Task.sleep(nanoseconds: 300_000_000)

            await MainActor.run {
                self.purchases.removeAll { $0.id == purchase.id }
                self.finishLoading()
                ModernTheme.Haptics.success()
            }
        } catch {
            handleError(error)
        }
    }

    // MARK: - Fuel Card Management
    func addFuelCard(_ card: FuelCard) async {
        do {
            startLoading()
            try await Task.sleep(nanoseconds: 300_000_000)

            await MainActor.run {
                self.fuelCards.append(card)
                self.finishLoading()
                ModernTheme.Haptics.success()
            }
        } catch {
            handleError(error)
        }
    }

    func deactivateFuelCard(_ card: FuelCard) async {
        do {
            startLoading()
            try await Task.sleep(nanoseconds: 300_000_000)

            await MainActor.run {
                if let index = self.fuelCards.firstIndex(where: { $0.id == card.id }) {
                    var updatedCard = card
                    // Would update isActive property here
                    self.fuelCards[index] = updatedCard
                }
                self.finishLoading()
                ModernTheme.Haptics.success()
            }
        } catch {
            handleError(error)
        }
    }

    // MARK: - Calculations
    func calculateEfficiency(for vehicleId: String) -> FuelEfficiencyData? {
        let vehiclePurchases = purchases.filter { $0.vehicleId == vehicleId && $0.isTankFull }

        guard vehiclePurchases.count >= 2 else { return nil }

        let sortedPurchases = vehiclePurchases.sorted { $0.purchaseDate < $1.purchaseDate }

        var totalMiles = 0.0
        var totalGallons = 0.0
        var totalCost = 0.0

        for i in 1..<sortedPurchases.count {
            let current = sortedPurchases[i]
            let previous = sortedPurchases[i-1]

            let miles = current.odometer - previous.odometer
            totalMiles += miles
            totalGallons += current.quantity
            totalCost += current.totalCost
        }

        let averageMPG = totalMiles / totalGallons
        let trend = calculateTrend(for: sortedPurchases)

        let firstDate = sortedPurchases.first?.purchaseDate ?? Date()
        let lastDate = sortedPurchases.last?.purchaseDate ?? Date()

        return FuelEfficiencyData(
            vehicleId: vehicleId,
            vehicleNumber: sortedPurchases.first?.vehicleNumber ?? "",
            averageMPG: averageMPG,
            totalGallonsUsed: totalGallons,
            totalCost: totalCost,
            totalMilesDriven: totalMiles,
            numberOfFillUps: sortedPurchases.count,
            dateRange: DateInterval(start: firstDate, end: lastDate),
            trend: trend
        )
    }

    private func calculateTrend(for purchases: [FuelPurchase]) -> EfficiencyTrend {
        guard purchases.count >= 4 else { return .stable }

        let recentCount = purchases.count / 2
        let recentPurchases = Array(purchases.suffix(recentCount))
        let olderPurchases = Array(purchases.prefix(purchases.count - recentCount))

        let recentMPG = calculateAverageMPG(for: recentPurchases)
        let olderMPG = calculateAverageMPG(for: olderPurchases)

        let difference = recentMPG - olderMPG

        if difference > 1.0 {
            return .improving
        } else if difference < -1.0 {
            return .declining
        } else {
            return .stable
        }
    }

    private func calculateAverageMPG(for purchases: [FuelPurchase]) -> Double {
        var totalMiles = 0.0
        var totalGallons = 0.0

        for i in 1..<purchases.count {
            let miles = purchases[i].odometer - purchases[i-1].odometer
            totalMiles += miles
            totalGallons += purchases[i].quantity
        }

        guard totalGallons > 0 else { return 0 }
        return totalMiles / totalGallons
    }

    // MARK: - Sorting
    private func sortPurchases(_ purchases: [FuelPurchase], by option: SortOption) -> [FuelPurchase] {
        switch option {
        case .dateDescending:
            return purchases.sorted { $0.purchaseDate > $1.purchaseDate }
        case .dateAscending:
            return purchases.sorted { $0.purchaseDate < $1.purchaseDate }
        case .costDescending:
            return purchases.sorted { $0.totalCost > $1.totalCost }
        case .costAscending:
            return purchases.sorted { $0.totalCost < $1.totalCost }
        case .vehicle:
            return purchases.sorted { $0.vehicleNumber < $1.vehicleNumber }
        }
    }

    // MARK: - Receipt Management
    func captureReceipt(_ image: UIImage) {
        capturedReceiptImage = image
        showingReceiptCamera = false
        ModernTheme.Haptics.success()
    }

    func clearCapturedReceipt() {
        capturedReceiptImage = nil
    }

    // MARK: - Search Override
    override func performSearch() {
        // Search is handled by filteredPurchases computed property
        isSearching = !searchText.isEmpty
    }

    override func clearSearch() {
        super.clearSearch()
        filterByVehicle = nil
        filterByDriver = nil
    }

    // MARK: - Mock Data Generation
    private func generateMockPurchases() -> [FuelPurchase] {
        let vehicleIds = ["VEH-001", "VEH-002", "VEH-003", "VEH-004", "VEH-005"]
        let drivers = ["John Doe", "Jane Smith", "Bob Johnson", "Alice Williams", "Charlie Brown"]
        let stations = ["Shell Station", "Chevron", "BP", "Exxon", "Mobil"]

        return (0..<25).map { index in
            let date = Date().addingTimeInterval(Double(-index * 86400 * 2))
            let vehicleId = vehicleIds.randomElement()!
            let driver = drivers.randomElement()!
            let station = stations.randomElement()!
            let quantity = Double.random(in: 10...25)
            let price = Double.random(in: 3.5...4.5)

            return FuelPurchase(
                id: UUID().uuidString,
                vehicleId: vehicleId,
                vehicleNumber: vehicleId,
                driverName: driver,
                purchaseDate: date,
                fuelType: .gasoline,
                quantity: quantity,
                pricePerUnit: price,
                totalCost: quantity * price,
                odometer: Double.random(in: 40000...60000),
                location: FuelStationLocation(
                    name: station,
                    address: "\(Int.random(in: 100...999)) Main St",
                    city: "Washington",
                    state: "DC",
                    zipCode: "20001",
                    latitude: 38.9072,
                    longitude: -77.0369
                ),
                fuelCardId: "FC-001",
                receiptImageUrl: nil,
                notes: index % 3 == 0 ? "Regular fill-up" : nil,
                isTankFull: true
            )
        }
    }

    private func generateMockFuelCards() -> [FuelCard] {
        return (1...5).map { index in
            FuelCard(
                id: "FC-00\(index)",
                cardNumber: "**** **** **** \(1230 + index)",
                provider: FuelCardProvider.allCases.randomElement()!,
                assignedVehicleId: "VEH-00\(index)",
                assignedDriverName: "Driver \(index)",
                isActive: index != 5,
                activationDate: Date().addingTimeInterval(-86400 * 365),
                expirationDate: Date().addingTimeInterval(86400 * (index == 3 ? 20 : 365)),
                monthlyLimit: 1000.0,
                currentMonthSpending: Double.random(in: 300...950),
                lastUsed: Date().addingTimeInterval(Double(-index * 86400))
            )
        }
    }

    private func generateMockAnalytics() -> FuelAnalytics {
        FuelAnalytics(
            totalSpending: totalSpending,
            averagePricePerGallon: averagePricePerGallon,
            totalGallonsPurchased: totalGallons,
            averageFillUpCost: totalSpending / Double(purchases.count),
            fleetAverageMPG: 24.5,
            topPerformingVehicles: [],
            bottomPerformingVehicles: [],
            monthlyTrend: []
        )
    }
}

// MARK: - Supporting Types
enum DateRange: String, CaseIterable {
    case last7Days = "Last 7 Days"
    case last30Days = "Last 30 Days"
    case last90Days = "Last 90 Days"
    case lastYear = "Last Year"
    case custom = "Custom"

    var days: Int {
        switch self {
        case .last7Days: return 7
        case .last30Days: return 30
        case .last90Days: return 90
        case .lastYear: return 365
        case .custom: return 0
        }
    }
}

enum SortOption: String, CaseIterable {
    case dateDescending = "Date (Newest)"
    case dateAscending = "Date (Oldest)"
    case costDescending = "Cost (Highest)"
    case costAscending = "Cost (Lowest)"
    case vehicle = "Vehicle"

    var icon: String {
        switch self {
        case .dateDescending, .dateAscending:
            return "calendar"
        case .costDescending, .costAscending:
            return "dollarsign.circle"
        case .vehicle:
            return "car.fill"
        }
    }
}
