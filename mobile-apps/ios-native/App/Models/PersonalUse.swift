//
//  PersonalUse.swift
//  Fleet Manager
//
//  Personal use tracking, mileage reimbursement, and approval workflow models
//

import Foundation
import CoreLocation

// MARK: - Personal Trip
struct PersonalTrip: Codable, Identifiable, Equatable {
    let id: String
    let vehicleId: String
    let vehicleNumber: String
    let driverId: String
    let driverName: String
    let startDate: Date
    let endDate: Date?
    let startLocation: TripLocation
    let endLocation: TripLocation?
    let startOdometer: Double
    let endOdometer: Double?
    let purpose: String
    let notes: String?
    let isCompleted: Bool
    let createdAt: Date
    let updatedAt: Date

    // Computed properties
    var totalMiles: Double {
        guard let endOdometer = endOdometer else { return 0 }
        return endOdometer - startOdometer
    }

    var duration: TimeInterval? {
        guard let endDate = endDate else { return nil }
        return endDate.timeIntervalSince(startDate)
    }

    var formattedDuration: String {
        guard let duration = duration else { return "In Progress" }
        let hours = Int(duration) / 3600
        let minutes = Int(duration) % 3600 / 60
        return "\(hours)h \(minutes)m"
    }

    var formattedDate: String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter.string(from: startDate)
    }

    var formattedMiles: String {
        String(format: "%.1f mi", totalMiles)
    }

    var statusColor: String {
        isCompleted ? "green" : "orange"
    }

    // API coding keys
    enum CodingKeys: String, CodingKey {
        case id
        case vehicleId = "vehicle_id"
        case vehicleNumber = "vehicle_number"
        case driverId = "driver_id"
        case driverName = "driver_name"
        case startDate = "start_date"
        case endDate = "end_date"
        case startLocation = "start_location"
        case endLocation = "end_location"
        case startOdometer = "start_odometer"
        case endOdometer = "end_odometer"
        case purpose
        case notes
        case isCompleted = "is_completed"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }

    // Sample data for previews
    static var sample: PersonalTrip {
        PersonalTrip(
            id: UUID().uuidString,
            vehicleId: "VEH-001",
            vehicleNumber: "V-12345",
            driverId: "DRV-001",
            driverName: "John Doe",
            startDate: Date().addingTimeInterval(-3600),
            endDate: Date(),
            startLocation: TripLocation.sample,
            endLocation: TripLocation(
                address: "456 Oak St",
                city: "Washington",
                state: "DC",
                zipCode: "20002",
                latitude: 38.9100,
                longitude: -77.0400
            ),
            startOdometer: 45230.0,
            endOdometer: 45265.0,
            purpose: "Medical appointment",
            notes: "Routine checkup",
            isCompleted: true,
            createdAt: Date().addingTimeInterval(-7200),
            updatedAt: Date()
        )
    }
}

// MARK: - Trip Location
struct TripLocation: Codable, Equatable {
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
        case address
        case city
        case state
        case zipCode = "zip_code"
        case latitude
        case longitude
    }

    static var sample: TripLocation {
        TripLocation(
            address: "123 Main St",
            city: "Washington",
            state: "DC",
            zipCode: "20001",
            latitude: 38.9072,
            longitude: -77.0369
        )
    }
}

// MARK: - Reimbursement Request
struct ReimbursementRequest: Codable, Identifiable, Equatable {
    let id: String
    let driverId: String
    let driverName: String
    let driverEmail: String?
    let requestDate: Date
    let periodStart: Date
    let periodEnd: Date
    let tripIds: [String]
    let totalMiles: Double
    let reimbursementRate: Double // IRS rate or company rate
    let totalAmount: Double
    let status: ReimbursementStatus
    let submittedBy: String
    let approvedBy: String?
    let approvedDate: Date?
    let rejectedReason: String?
    let paidDate: Date?
    let paymentMethod: PaymentMethod?
    let notes: String?
    let attachments: [String]? // URLs to receipts/documentation

    // Computed properties
    var formattedAmount: String {
        String(format: "$%.2f", totalAmount)
    }

    var formattedRate: String {
        String(format: "$%.3f/mi", reimbursementRate)
    }

    var formattedMiles: String {
        String(format: "%.1f mi", totalMiles)
    }

    var formattedPeriod: String {
        let formatter = DateFormatter()
        formatter.dateStyle = .short
        return "\(formatter.string(from: periodStart)) - \(formatter.string(from: periodEnd))"
    }

    var formattedRequestDate: String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        return formatter.string(from: requestDate)
    }

    var statusColor: String {
        status.color
    }

    var statusIcon: String {
        status.icon
    }

    var isPending: Bool {
        status == .pending
    }

    var canEdit: Bool {
        status == .pending || status == .rejected
    }

    // API coding keys
    enum CodingKeys: String, CodingKey {
        case id
        case driverId = "driver_id"
        case driverName = "driver_name"
        case driverEmail = "driver_email"
        case requestDate = "request_date"
        case periodStart = "period_start"
        case periodEnd = "period_end"
        case tripIds = "trip_ids"
        case totalMiles = "total_miles"
        case reimbursementRate = "reimbursement_rate"
        case totalAmount = "total_amount"
        case status
        case submittedBy = "submitted_by"
        case approvedBy = "approved_by"
        case approvedDate = "approved_date"
        case rejectedReason = "rejected_reason"
        case paidDate = "paid_date"
        case paymentMethod = "payment_method"
        case notes
        case attachments
    }

    // Sample data for previews
    static var sample: ReimbursementRequest {
        ReimbursementRequest(
            id: UUID().uuidString,
            driverId: "DRV-001",
            driverName: "John Doe",
            driverEmail: "john.doe@example.com",
            requestDate: Date(),
            periodStart: Date().addingTimeInterval(-30 * 86400),
            periodEnd: Date(),
            tripIds: ["TRIP-001", "TRIP-002"],
            totalMiles: 125.5,
            reimbursementRate: 0.67, // 2025 IRS rate
            totalAmount: 84.09,
            status: .pending,
            submittedBy: "John Doe",
            approvedBy: nil,
            approvedDate: nil,
            rejectedReason: nil,
            paidDate: nil,
            paymentMethod: nil,
            notes: "Monthly personal use reimbursement",
            attachments: nil
        )
    }
}

// MARK: - Reimbursement Status
enum ReimbursementStatus: String, Codable, CaseIterable {
    case pending = "Pending"
    case approved = "Approved"
    case paid = "Paid"
    case rejected = "Rejected"
    case cancelled = "Cancelled"

    var displayName: String {
        rawValue
    }

    var icon: String {
        switch self {
        case .pending: return "clock.fill"
        case .approved: return "checkmark.circle.fill"
        case .paid: return "dollarsign.circle.fill"
        case .rejected: return "xmark.circle.fill"
        case .cancelled: return "minus.circle.fill"
        }
    }

    var color: String {
        switch self {
        case .pending: return "orange"
        case .approved: return "blue"
        case .paid: return "green"
        case .rejected: return "red"
        case .cancelled: return "gray"
        }
    }
}

// MARK: - Payment Method
enum PaymentMethod: String, Codable, CaseIterable {
    case directDeposit = "Direct Deposit"
    case check = "Check"
    case payroll = "Payroll Deduction"
    case other = "Other"

    var displayName: String {
        rawValue
    }

    var icon: String {
        switch self {
        case .directDeposit: return "arrow.down.circle.fill"
        case .check: return "doc.text.fill"
        case .payroll: return "dollarsign.circle.fill"
        case .other: return "ellipsis.circle.fill"
        }
    }
}

// MARK: - Reimbursement Policy
struct ReimbursementPolicy: Codable, Identifiable, Equatable {
    let id: String
    let name: String
    let description: String
    let ratePerMile: Double // Current IRS rate: $0.67 for 2025
    let maxMonthlyMiles: Double?
    let maxMonthlyAmount: Double?
    let requiresApproval: Bool
    let approvalThreshold: Double? // Auto-approve under this amount
    let allowedPurposes: [String]
    let requiresDocumentation: Bool
    let isActive: Bool
    let effectiveDate: Date
    let expirationDate: Date?

    var formattedRate: String {
        String(format: "$%.3f/mi", ratePerMile)
    }

    var formattedMaxMiles: String? {
        guard let maxMiles = maxMonthlyMiles else { return nil }
        return String(format: "%.0f mi/month", maxMiles)
    }

    var formattedMaxAmount: String? {
        guard let maxAmount = maxMonthlyAmount else { return nil }
        return String(format: "$%.2f/month", maxAmount)
    }

    var isExpired: Bool {
        guard let expirationDate = expirationDate else { return false }
        return expirationDate < Date()
    }

    enum CodingKeys: String, CodingKey {
        case id
        case name
        case description
        case ratePerMile = "rate_per_mile"
        case maxMonthlyMiles = "max_monthly_miles"
        case maxMonthlyAmount = "max_monthly_amount"
        case requiresApproval = "requires_approval"
        case approvalThreshold = "approval_threshold"
        case allowedPurposes = "allowed_purposes"
        case requiresDocumentation = "requires_documentation"
        case isActive = "is_active"
        case effectiveDate = "effective_date"
        case expirationDate = "expiration_date"
    }

    // Sample data for previews
    static var sample: ReimbursementPolicy {
        ReimbursementPolicy(
            id: "POL-001",
            name: "2025 IRS Standard Rate",
            description: "Standard IRS mileage reimbursement rate for personal use of company vehicles",
            ratePerMile: 0.67, // 2025 IRS rate
            maxMonthlyMiles: 500.0,
            maxMonthlyAmount: 335.0,
            requiresApproval: true,
            approvalThreshold: 100.0,
            allowedPurposes: [
                "Medical appointments",
                "Personal errands",
                "Family emergencies",
                "Religious activities",
                "Educational purposes"
            ],
            requiresDocumentation: false,
            isActive: true,
            effectiveDate: Date().addingTimeInterval(-365 * 86400),
            expirationDate: nil
        )
    }
}

// MARK: - Personal Use Summary
struct PersonalUseSummary: Identifiable {
    let id = UUID()
    let month: Date
    let totalTrips: Int
    let totalPersonalMiles: Double
    let totalBusinessMiles: Double
    let reimbursementAmount: Double
    let policyComplianceStatus: ComplianceStatus
    let outstandingRequests: Int

    var totalMiles: Double {
        totalPersonalMiles + totalBusinessMiles
    }

    var personalMileagePercentage: Double {
        guard totalMiles > 0 else { return 0 }
        return (totalPersonalMiles / totalMiles) * 100
    }

    var formattedPersonalMiles: String {
        String(format: "%.1f mi", totalPersonalMiles)
    }

    var formattedBusinessMiles: String {
        String(format: "%.1f mi", totalBusinessMiles)
    }

    var formattedReimbursement: String {
        String(format: "$%.2f", reimbursementAmount)
    }

    var formattedPercentage: String {
        String(format: "%.1f%%", personalMileagePercentage)
    }

    var formattedMonth: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMMM yyyy"
        return formatter.string(from: month)
    }
}

// MARK: - Compliance Status
enum ComplianceStatus: String {
    case compliant = "Compliant"
    case warning = "Warning"
    case violation = "Violation"

    var icon: String {
        switch self {
        case .compliant: return "checkmark.shield.fill"
        case .warning: return "exclamationmark.triangle.fill"
        case .violation: return "xmark.shield.fill"
        }
    }

    var color: String {
        switch self {
        case .compliant: return "green"
        case .warning: return "orange"
        case .violation: return "red"
        }
    }

    var description: String {
        switch self {
        case .compliant: return "Within policy limits"
        case .warning: return "Approaching policy limits"
        case .violation: return "Exceeds policy limits"
        }
    }
}

// MARK: - API Response Models
struct PersonalTripsResponse: Codable {
    let trips: [PersonalTrip]
    let total: Int
    let page: Int?
    let limit: Int?
}

struct ReimbursementRequestsResponse: Codable {
    let requests: [ReimbursementRequest]
    let total: Int
    let page: Int?
    let limit: Int?
}

struct PersonalUseSummaryResponse: Codable {
    let summary: PersonalUseSummary
    let policy: ReimbursementPolicy

    enum CodingKeys: String, CodingKey {
        case summary
        case policy
    }
}

// MARK: - Chart Data
struct MileageChartData: Identifiable {
    let id = UUID()
    let month: String
    let personalMiles: Double
    let businessMiles: Double
}

struct ReimbursementChartData: Identifiable {
    let id = UUID()
    let month: String
    let amount: Double
}
