import Foundation
import CoreLocation
import SwiftUI

// MARK: - Incident Report
struct IncidentReport: Codable, Identifiable, Equatable {
    let id: String
    let incidentNumber: String
    let vehicleId: String
    let vehicleNumber: String
    let driverName: String
    let driverId: String
    let incidentDate: Date
    let reportedDate: Date
    let reportedBy: String
    let type: IncidentType
    let severity: IncidentSeverity
    let status: IncidentStatus
    let location: IncidentLocation
    let description: String
    let weatherConditions: WeatherCondition?
    let roadConditions: RoadCondition?
    let witnesses: [Witness]
    var photos: [IncidentPhoto]
    let damageEstimate: Double?
    let injuries: [Injury]
    let policeReport: PoliceReport?
    var insuranceClaim: InsuranceClaim?
    let notes: String?
    let lastUpdated: Date
    let assignedTo: String?

    // Computed properties
    var formattedIncidentDate: String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter.string(from: incidentDate)
    }

    var formattedReportedDate: String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter.string(from: reportedDate)
    }

    var hasInjuries: Bool {
        !injuries.isEmpty
    }

    var hasDamage: Bool {
        damageEstimate != nil && damageEstimate! > 0
    }

    var requiresPoliceReport: Bool {
        severity == .major || severity == .critical || hasInjuries
    }

    var statusColor: Color {
        switch status {
        case .draft: return ModernTheme.Colors.idle
        case .submitted: return ModernTheme.Colors.info
        case .underReview: return ModernTheme.Colors.warning
        case .approved: return ModernTheme.Colors.success
        case .closed: return ModernTheme.Colors.idle
        case .rejected: return ModernTheme.Colors.error
        }
    }

    var severityColor: Color {
        switch severity {
        case .minor: return ModernTheme.Colors.info
        case .moderate: return ModernTheme.Colors.warning
        case .major: return Color.orange
        case .critical: return ModernTheme.Colors.error
        }
    }

    // API coding keys
    enum CodingKeys: String, CodingKey {
        case id
        case incidentNumber = "incident_number"
        case vehicleId = "vehicle_id"
        case vehicleNumber = "vehicle_number"
        case driverName = "driver_name"
        case driverId = "driver_id"
        case incidentDate = "incident_date"
        case reportedDate = "reported_date"
        case reportedBy = "reported_by"
        case type
        case severity
        case status
        case location
        case description
        case weatherConditions = "weather_conditions"
        case roadConditions = "road_conditions"
        case witnesses
        case photos
        case damageEstimate = "damage_estimate"
        case injuries
        case policeReport = "police_report"
        case insuranceClaim = "insurance_claim"
        case notes
        case lastUpdated = "last_updated"
        case assignedTo = "assigned_to"
    }

    static var sample: IncidentReport {
        IncidentReport(
            id: UUID().uuidString,
            incidentNumber: "INC-2025-001",
            vehicleId: "VEH-001",
            vehicleNumber: "V-12345",
            driverName: "John Doe",
            driverId: "DRV-001",
            incidentDate: Date(),
            reportedDate: Date(),
            reportedBy: "John Doe",
            type: .collision,
            severity: .moderate,
            status: .submitted,
            location: IncidentLocation.sample,
            description: "Minor collision at intersection",
            weatherConditions: .clear,
            roadConditions: .dry,
            witnesses: [],
            photos: [],
            damageEstimate: 2500.00,
            injuries: [],
            policeReport: nil,
            insuranceClaim: nil,
            notes: nil,
            lastUpdated: Date(),
            assignedTo: nil
        )
    }
}

// MARK: - Incident Type
enum IncidentType: String, Codable, CaseIterable {
    case collision = "Collision"
    case property = "Property Damage"
    case injury = "Injury"
    case theft = "Theft/Vandalism"
    case mechanical = "Mechanical Failure"
    case traffic = "Traffic Violation"
    case safety = "Safety Violation"
    case environmental = "Environmental"
    case other = "Other"

    var icon: String {
        switch self {
        case .collision: return "car.side.and.exclamationmark.fill"
        case .property: return "house.fill"
        case .injury: return "cross.case.fill"
        case .theft: return "lock.shield.fill"
        case .mechanical: return "wrench.and.screwdriver.fill"
        case .traffic: return "exclamationmark.octagon.fill"
        case .safety: return "shield.lefthalf.filled"
        case .environmental: return "leaf.fill"
        case .other: return "exclamationmark.triangle.fill"
        }
    }

    var color: Color {
        switch self {
        case .collision: return .red
        case .property: return .orange
        case .injury: return .red
        case .theft: return .purple
        case .mechanical: return .yellow
        case .traffic: return .orange
        case .safety: return .red
        case .environmental: return .green
        case .other: return .gray
        }
    }
}

// MARK: - Incident Severity
enum IncidentSeverity: String, Codable, CaseIterable {
    case minor = "Minor"
    case moderate = "Moderate"
    case major = "Major"
    case critical = "Critical"

    var icon: String {
        switch self {
        case .minor: return "exclamationmark.circle"
        case .moderate: return "exclamationmark.triangle"
        case .major: return "exclamationmark.triangle.fill"
        case .critical: return "exclamationmark.octagon.fill"
        }
    }
}

// MARK: - Incident Status
enum IncidentStatus: String, Codable, CaseIterable {
    case draft = "Draft"
    case submitted = "Submitted"
    case underReview = "Under Review"
    case approved = "Approved"
    case closed = "Closed"
    case rejected = "Rejected"

    var icon: String {
        switch self {
        case .draft: return "pencil.circle"
        case .submitted: return "paperplane.circle"
        case .underReview: return "eye.circle"
        case .approved: return "checkmark.circle"
        case .closed: return "lock.circle"
        case .rejected: return "xmark.circle"
        }
    }
}

// MARK: - Incident Location
struct IncidentLocation: Codable, Equatable {
    let latitude: Double
    let longitude: Double
    let address: String
    let city: String
    let state: String
    let zipCode: String
    let country: String

    var coordinate: CLLocationCoordinate2D {
        CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
    }

    var fullAddress: String {
        "\(address), \(city), \(state) \(zipCode)"
    }

    enum CodingKeys: String, CodingKey {
        case latitude
        case longitude
        case address
        case city
        case state
        case zipCode = "zip_code"
        case country
    }

    static var sample: IncidentLocation {
        IncidentLocation(
            latitude: 38.9072,
            longitude: -77.0369,
            address: "123 Main St",
            city: "Washington",
            state: "DC",
            zipCode: "20001",
            country: "USA"
        )
    }
}

// MARK: - Weather Condition
enum WeatherCondition: String, Codable, CaseIterable {
    case clear = "Clear"
    case cloudy = "Cloudy"
    case rain = "Rain"
    case snow = "Snow"
    case fog = "Fog"
    case ice = "Ice"
    case wind = "High Wind"

    var icon: String {
        switch self {
        case .clear: return "sun.max.fill"
        case .cloudy: return "cloud.fill"
        case .rain: return "cloud.rain.fill"
        case .snow: return "cloud.snow.fill"
        case .fog: return "cloud.fog.fill"
        case .ice: return "snowflake"
        case .wind: return "wind"
        }
    }
}

// MARK: - Road Condition
enum RoadCondition: String, Codable, CaseIterable {
    case dry = "Dry"
    case wet = "Wet"
    case icy = "Icy"
    case snow = "Snow Covered"
    case gravel = "Gravel"
    case construction = "Construction"

    var icon: String {
        switch self {
        case .dry: return "road.lanes"
        case .wet: return "drop.fill"
        case .icy: return "snowflake"
        case .snow: return "cloud.snow.fill"
        case .gravel: return "square.grid.3x3.fill"
        case .construction: return "cone.fill"
        }
    }
}

// MARK: - Witness
struct Witness: Codable, Identifiable, Equatable {
    let id: String
    let name: String
    let contactPhone: String
    let contactEmail: String?
    let statement: String?

    enum CodingKeys: String, CodingKey {
        case id
        case name
        case contactPhone = "contact_phone"
        case contactEmail = "contact_email"
        case statement
    }
}

// MARK: - Incident Photo
struct IncidentPhoto: Codable, Identifiable, Equatable {
    let id: String
    let photoUrl: String?
    var photoData: Data?
    let caption: String?
    let timestamp: Date
    let photoType: PhotoType
    let uploadedBy: String

    enum PhotoType: String, Codable {
        case overview = "Overview"
        case damage = "Damage"
        case location = "Location"
        case other = "Other"
    }

    enum CodingKeys: String, CodingKey {
        case id
        case photoUrl = "photo_url"
        case caption
        case timestamp
        case photoType = "photo_type"
        case uploadedBy = "uploaded_by"
    }
}

// MARK: - Injury
struct Injury: Codable, Identifiable, Equatable {
    let id: String
    let personName: String
    let personType: PersonType
    let severity: InjurySeverity
    let description: String
    let medicalAttention: Bool
    let hospitalName: String?
    let treatmentDetails: String?

    enum PersonType: String, Codable {
        case driver = "Driver"
        case passenger = "Passenger"
        case pedestrian = "Pedestrian"
        case other = "Other"
    }

    enum InjurySeverity: String, Codable {
        case minor = "Minor"
        case moderate = "Moderate"
        case severe = "Severe"
        case fatal = "Fatal"
    }

    enum CodingKeys: String, CodingKey {
        case id
        case personName = "person_name"
        case personType = "person_type"
        case severity
        case description
        case medicalAttention = "medical_attention"
        case hospitalName = "hospital_name"
        case treatmentDetails = "treatment_details"
    }
}

// MARK: - Police Report
struct PoliceReport: Codable, Equatable {
    let reportNumber: String
    let officerName: String
    let officerBadge: String
    let department: String
    let filedDate: Date
    let reportUrl: String?

    enum CodingKeys: String, CodingKey {
        case reportNumber = "report_number"
        case officerName = "officer_name"
        case officerBadge = "officer_badge"
        case department
        case filedDate = "filed_date"
        case reportUrl = "report_url"
    }
}

// MARK: - Insurance Claim
struct InsuranceClaim: Codable, Equatable {
    let claimNumber: String
    let insuranceProvider: String
    let policyNumber: String
    let filedDate: Date
    let claimAmount: Double
    let status: ClaimStatus
    let adjusterName: String?
    let adjusterPhone: String?
    let approvedAmount: Double?
    let settlementDate: Date?
    let notes: String?

    enum ClaimStatus: String, Codable {
        case filed = "Filed"
        case underReview = "Under Review"
        case approved = "Approved"
        case partiallyApproved = "Partially Approved"
        case denied = "Denied"
        case settled = "Settled"

        var color: Color {
            switch self {
            case .filed: return ModernTheme.Colors.info
            case .underReview: return ModernTheme.Colors.warning
            case .approved: return ModernTheme.Colors.success
            case .partiallyApproved: return ModernTheme.Colors.warning
            case .denied: return ModernTheme.Colors.error
            case .settled: return ModernTheme.Colors.success
            }
        }
    }

    var formattedClaimAmount: String {
        String(format: "$%.2f", claimAmount)
    }

    var formattedApprovedAmount: String? {
        guard let amount = approvedAmount else { return nil }
        return String(format: "$%.2f", amount)
    }

    enum CodingKeys: String, CodingKey {
        case claimNumber = "claim_number"
        case insuranceProvider = "insurance_provider"
        case policyNumber = "policy_number"
        case filedDate = "filed_date"
        case claimAmount = "claim_amount"
        case status
        case adjusterName = "adjuster_name"
        case adjusterPhone = "adjuster_phone"
        case approvedAmount = "approved_amount"
        case settlementDate = "settlement_date"
        case notes
    }
}

// MARK: - Incident Statistics
struct IncidentStatistics: Codable {
    let totalIncidents: Int
    let openIncidents: Int
    let closedIncidents: Int
    let incidentsByType: [String: Int]
    let incidentsBySeverity: [String: Int]
    let totalDamageEstimate: Double
    let totalClaimAmount: Double
    let averageResolutionDays: Double
    let incidentTrend: [MonthlyIncidentData]

    var formattedTotalDamage: String {
        String(format: "$%.2f", totalDamageEstimate)
    }

    var formattedTotalClaims: String {
        String(format: "$%.2f", totalClaimAmount)
    }

    enum CodingKeys: String, CodingKey {
        case totalIncidents = "total_incidents"
        case openIncidents = "open_incidents"
        case closedIncidents = "closed_incidents"
        case incidentsByType = "incidents_by_type"
        case incidentsBySeverity = "incidents_by_severity"
        case totalDamageEstimate = "total_damage_estimate"
        case totalClaimAmount = "total_claim_amount"
        case averageResolutionDays = "average_resolution_days"
        case incidentTrend = "incident_trend"
    }
}

// MARK: - Monthly Incident Data
struct MonthlyIncidentData: Codable, Identifiable {
    let id = UUID()
    let month: String
    let count: Int
    let totalDamage: Double

    enum CodingKeys: String, CodingKey {
        case month
        case count
        case totalDamage = "total_damage"
    }
}

// MARK: - Incident Report Request
struct IncidentReportRequest {
    let vehicleId: String
    let vehicleNumber: String
    let driverName: String
    let driverId: String
    let incidentDate: Date
    let type: IncidentType
    let severity: IncidentSeverity
    let location: IncidentLocation
    let description: String
    let weatherConditions: WeatherCondition?
    let roadConditions: RoadCondition?
    let witnesses: [Witness]
    let photos: [Data]
    let damageEstimate: Double?
    let injuries: [Injury]
    let policeReport: PoliceReport?
    let notes: String?
}

// MARK: - API Response Models
struct IncidentReportsResponse: Codable {
    let incidents: [IncidentReport]
    let total: Int
    let page: Int?
    let limit: Int?
}

struct IncidentReportResponse: Codable {
    let incident: IncidentReport
}

struct IncidentStatisticsResponse: Codable {
    let statistics: IncidentStatistics
}
