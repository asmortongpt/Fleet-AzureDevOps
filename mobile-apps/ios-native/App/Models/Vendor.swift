//
//  Vendor.swift
//  Fleet Manager
//
//  Vendor model for procurement management
//

import Foundation

// MARK: - Vendor Model
public struct Vendor: Identifiable, Codable, Equatable {
    public let id: String
    public let tenantId: String
    public var name: String
    public var category: VendorCategory
    public var contactName: String
    public var email: String
    public var phone: String
    public var address: VendorAddress
    public var paymentTerms: PaymentTerms
    public var rating: Double
    public var status: VendorStatus
    public var totalSpend: Double
    public var orderCount: Int
    public var notes: String?
    public var tags: [String]?
    public var createdAt: Date
    public var updatedAt: Date

    // Computed properties
    public var ratingStars: Int {
        Int(rating.rounded())
    }

    public var formattedTotalSpend: String {
        String(format: "$%.2f", totalSpend)
    }

    public var statusColor: String {
        switch status {
        case .active: return "green"
        case .inactive: return "gray"
        case .suspended: return "red"
        case .pending: return "orange"
        }
    }
}

// MARK: - Vendor Category
public enum VendorCategory: String, Codable, CaseIterable {
    case parts = "Parts"
    case maintenance = "Maintenance"
    case fuel = "Fuel"
    case tires = "Tires"
    case insurance = "Insurance"
    case leasing = "Leasing"
    case cleaning = "Cleaning"
    case bodyShop = "Body Shop"
    case other = "Other"

    public var icon: String {
        switch self {
        case .parts: return "wrench.and.screwdriver.fill"
        case .maintenance: return "gearshape.fill"
        case .fuel: return "fuelpump.fill"
        case .tires: return "circle.grid.cross.fill"
        case .insurance: return "shield.fill"
        case .leasing: return "key.fill"
        case .cleaning: return "sparkles"
        case .bodyShop: return "car.fill"
        case .other: return "ellipsis.circle.fill"
        }
    }
}

// MARK: - Vendor Status
public enum VendorStatus: String, Codable, CaseIterable {
    case active = "Active"
    case inactive = "Inactive"
    case suspended = "Suspended"
    case pending = "Pending"

    public var displayName: String {
        rawValue
    }
}

// MARK: - Vendor Address
public struct VendorAddress: Codable, Equatable {
    public var street: String
    public var city: String
    public var state: String
    public var zipCode: String
    public var country: String

    public var fullAddress: String {
        "\(street), \(city), \(state) \(zipCode), \(country)"
    }
}

// MARK: - Payment Terms
public struct PaymentTerms: Codable, Equatable {
    public var netDays: Int
    public var discountPercent: Double?
    public var discountDays: Int?
    public var acceptsCreditCard: Bool
    public var acceptsACH: Bool
    public var acceptsCheck: Bool

    public var displayTerms: String {
        if let discountPercent = discountPercent, let discountDays = discountDays {
            return "\(Int(discountPercent))%/\(discountDays), Net \(netDays)"
        }
        return "Net \(netDays)"
    }
}

// MARK: - Vendor Performance Metrics
public struct VendorPerformanceMetrics: Codable {
    public let vendorId: String
    public var onTimeDeliveryRate: Double
    public var averageLeadTime: Double
    public var qualityRating: Double
    public var totalOrders: Int
    public var totalSpend: Double
    public var lastOrderDate: Date?

    public var onTimePercentage: Int {
        Int(onTimeDeliveryRate * 100)
    }
}

// MARK: - API Response Models
public struct VendorsResponse: Codable {
    public let vendors: [Vendor]
    public let total: Int
    public let page: Int?
    public let limit: Int?
}

public struct VendorResponse: Codable {
    public let vendor: Vendor
}
