import Foundation
import CoreLocation

// MARK: - Fuel Purchase
struct FuelPurchase: Codable, Identifiable, Equatable {
    let id: String
    let vehicleId: String
    let vehicleNumber: String
    let driverName: String
    let purchaseDate: Date
    let fuelType: FuelType
    let quantity: Double // gallons or liters
    let pricePerUnit: Double
    let totalCost: Double
    let odometer: Double
    let location: FuelStationLocation
    let fuelCardId: String?
    let receiptImageUrl: String?
    var receiptImageData: Data?
    let notes: String?
    let isTankFull: Bool

    // Computed properties
    var efficiency: Double? {
        // MPG or km/L calculation if we have previous fill-up data
        return nil // Will be calculated by ViewModel
    }

    var costPerMile: Double? {
        guard odometer > 0 else { return nil }
        return totalCost / odometer
    }

    var formattedDate: String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter.string(from: purchaseDate)
    }

    var formattedCost: String {
        return String(format: "$%.2f", totalCost)
    }

    var formattedQuantity: String {
        return String(format: "%.2f gal", quantity)
    }

    // API coding keys
    enum CodingKeys: String, CodingKey {
        case id
        case vehicleId = "vehicle_id"
        case vehicleNumber = "vehicle_number"
        case driverName = "driver_name"
        case purchaseDate = "purchase_date"
        case fuelType = "fuel_type"
        case quantity
        case pricePerUnit = "price_per_unit"
        case totalCost = "total_cost"
        case odometer
        case location
        case fuelCardId = "fuel_card_id"
        case receiptImageUrl = "receipt_image_url"
        case notes
        case isTankFull = "is_tank_full"
    }

    // Sample data for previews
    static var sample: FuelPurchase {
        FuelPurchase(
            id: UUID().uuidString,
            vehicleId: "VEH-001",
            vehicleNumber: "V-12345",
            driverName: "John Doe",
            purchaseDate: Date(),
            fuelType: .gasoline,
            quantity: 15.5,
            pricePerUnit: 3.89,
            totalCost: 60.30,
            odometer: 45230,
            location: FuelStationLocation.sample,
            fuelCardId: "FC-001",
            receiptImageUrl: nil,
            notes: "Regular fill-up",
            isTankFull: true
        )
    }
}

// MARK: - Fuel Station Location
struct FuelStationLocation: Codable, Equatable {
    let name: String
    let address: String
    let city: String
    let state: String
    let zipCode: String
    let latitude: Double
    let longitude: Double

    var fullAddress: String {
        "\(address), \(city), \(state) \(zipCode)"
    }

    var coordinate: CLLocationCoordinate2D {
        CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
    }

    enum CodingKeys: String, CodingKey {
        case name
        case address
        case city
        case state
        case zipCode = "zip_code"
        case latitude
        case longitude
    }

    static var sample: FuelStationLocation {
        FuelStationLocation(
            name: "Shell Station",
            address: "123 Main St",
            city: "Washington",
            state: "DC",
            zipCode: "20001",
            latitude: 38.9072,
            longitude: -77.0369
        )
    }
}

// MARK: - Fuel Card
struct FuelCard: Codable, Identifiable, Equatable {
    let id: String
    let cardNumber: String // Masked for security
    let provider: FuelCardProvider
    let assignedVehicleId: String?
    let assignedDriverName: String?
    let isActive: Bool
    let activationDate: Date
    let expirationDate: Date?
    let monthlyLimit: Double?
    let currentMonthSpending: Double
    let lastUsed: Date?

    var isExpiringSoon: Bool {
        guard let expirationDate = expirationDate else { return false }
        let daysUntilExpiration = Calendar.current.dateComponents([.day], from: Date(), to: expirationDate).day ?? 0
        return daysUntilExpiration <= 30 && daysUntilExpiration > 0
    }

    var isExpired: Bool {
        guard let expirationDate = expirationDate else { return false }
        return expirationDate < Date()
    }

    var isOverLimit: Bool {
        guard let monthlyLimit = monthlyLimit else { return false }
        return currentMonthSpending >= monthlyLimit
    }

    var limitPercentage: Double {
        guard let monthlyLimit = monthlyLimit, monthlyLimit > 0 else { return 0 }
        return (currentMonthSpending / monthlyLimit) * 100
    }

    var statusColor: String {
        if isExpired || !isActive { return "red" }
        if isExpiringSoon || isOverLimit { return "orange" }
        return "green"
    }

    enum CodingKeys: String, CodingKey {
        case id
        case cardNumber = "card_number"
        case provider
        case assignedVehicleId = "assigned_vehicle_id"
        case assignedDriverName = "assigned_driver_name"
        case isActive = "is_active"
        case activationDate = "activation_date"
        case expirationDate = "expiration_date"
        case monthlyLimit = "monthly_limit"
        case currentMonthSpending = "current_month_spending"
        case lastUsed = "last_used"
    }

    static var sample: FuelCard {
        FuelCard(
            id: UUID().uuidString,
            cardNumber: "**** **** **** 1234",
            provider: .wex,
            assignedVehicleId: "VEH-001",
            assignedDriverName: "John Doe",
            isActive: true,
            activationDate: Date().addingTimeInterval(-86400 * 365),
            expirationDate: Date().addingTimeInterval(86400 * 365),
            monthlyLimit: 1000.0,
            currentMonthSpending: 450.75,
            lastUsed: Date().addingTimeInterval(-86400 * 2)
        )
    }
}

// MARK: - Fuel Card Provider
enum FuelCardProvider: String, Codable, CaseIterable {
    case wex = "WEX"
    case fleetCor = "FleetCor"
    case voyager = "Voyager"
    case shell = "Shell"
    case bp = "BP"
    case exxonMobil = "ExxonMobil"
    case other = "Other"

    var displayName: String {
        rawValue
    }

    var icon: String {
        switch self {
        case .wex: return "creditcard.fill"
        case .fleetCor: return "creditcard.fill"
        case .voyager: return "creditcard.fill"
        case .shell: return "fuelpump.fill"
        case .bp: return "fuelpump.fill"
        case .exxonMobil: return "fuelpump.fill"
        case .other: return "creditcard"
        }
    }
}

// MARK: - Fuel Efficiency Data
struct FuelEfficiencyData: Identifiable {
    let id = UUID()
    let vehicleId: String
    let vehicleNumber: String
    let averageMPG: Double
    let totalGallonsUsed: Double
    let totalCost: Double
    let totalMilesDriven: Double
    let numberOfFillUps: Int
    let dateRange: DateInterval
    let trend: EfficiencyTrend

    var costPerMile: Double {
        guard totalMilesDriven > 0 else { return 0 }
        return totalCost / totalMilesDriven
    }

    var formattedMPG: String {
        String(format: "%.1f MPG", averageMPG)
    }

    var formattedCostPerMile: String {
        String(format: "$%.3f/mi", costPerMile)
    }
}

// MARK: - Efficiency Trend
enum EfficiencyTrend {
    case improving
    case declining
    case stable

    var icon: String {
        switch self {
        case .improving: return "arrow.up.right.circle.fill"
        case .declining: return "arrow.down.right.circle.fill"
        case .stable: return "minus.circle.fill"
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

// MARK: - Fuel Analytics
struct FuelAnalytics: Codable {
    let totalSpending: Double
    let averagePricePerGallon: Double
    let totalGallonsPurchased: Double
    let averageFillUpCost: Double
    let fleetAverageMPG: Double
    let topPerformingVehicles: [VehicleEfficiency]
    let bottomPerformingVehicles: [VehicleEfficiency]
    let monthlyTrend: [MonthlyFuelData]

    enum CodingKeys: String, CodingKey {
        case totalSpending = "total_spending"
        case averagePricePerGallon = "average_price_per_gallon"
        case totalGallonsPurchased = "total_gallons_purchased"
        case averageFillUpCost = "average_fillup_cost"
        case fleetAverageMPG = "fleet_average_mpg"
        case topPerformingVehicles = "top_performing_vehicles"
        case bottomPerformingVehicles = "bottom_performing_vehicles"
        case monthlyTrend = "monthly_trend"
    }
}

// MARK: - Vehicle Efficiency
struct VehicleEfficiency: Codable, Identifiable {
    let id: String
    let vehicleNumber: String
    let vehicleMake: String
    let vehicleModel: String
    let averageMPG: Double
    let totalCost: Double
    let costPerMile: Double

    enum CodingKeys: String, CodingKey {
        case id
        case vehicleNumber = "vehicle_number"
        case vehicleMake = "vehicle_make"
        case vehicleModel = "vehicle_model"
        case averageMPG = "average_mpg"
        case totalCost = "total_cost"
        case costPerMile = "cost_per_mile"
    }
}

// MARK: - Monthly Fuel Data
struct MonthlyFuelData: Codable, Identifiable {
    let id = UUID()
    let month: String
    let totalCost: Double
    let totalGallons: Double
    let averageMPG: Double

    enum CodingKeys: String, CodingKey {
        case month
        case totalCost = "total_cost"
        case totalGallons = "total_gallons"
        case averageMPG = "average_mpg"
    }
}

// MARK: - API Response Models
struct FuelPurchasesResponse: Codable {
    let purchases: [FuelPurchase]
    let total: Int
    let page: Int?
    let limit: Int?
}

struct FuelCardsResponse: Codable {
    let cards: [FuelCard]
    let total: Int
}

struct FuelAnalyticsResponse: Codable {
    let analytics: FuelAnalytics
    let dateRange: DateInterval

    enum CodingKeys: String, CodingKey {
        case analytics
        case dateRange = "date_range"
    }
}
